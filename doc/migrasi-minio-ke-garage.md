# Migrasi MinIO → Garage (moki-NG)

**Latar.** MinIO menutup distribusi publiknya: `minio/minio` dan `minio/mc`
membalas 401 di quay.io maupun Docker Hub (termasuk `:latest`), sementara
repo lain di quay.io normal. Binary di `dl.min.io` juga 410 Gone. Image
MinIO yang masih ada di server tidak tergantikan, jadi deploy berikutnya
akan gagal begitu image itu ter-prune.

Pola yang sama sudah diterapkan di `BanKes-OTA-NG`. moki lebih sederhana
karena **tidak ada public bucket** — file disajikan lewat presigned URL.

**Yang TIDAK berubah:** kode aplikasi. `app/lib/object-storage.ts` sudah
generik (`endpoint`, `region`, `forcePathStyle: true` secara default), dan
`DEFAULT_REGION = 'us-east-1'` cocok dengan `s3_region` di `garage.toml`.

---

## Perbedaan dari MinIO

| | MinIO | Garage |
|---|---|---|
| Port S3 | 9000 | **3900** |
| Console | 9001 | tidak ada (pakai CLI) |
| Bucket | dibuat app via `CreateBucket` | **pre-create manual**, lalu key diberi izin per bucket |
| Bootstrap | tidak ada | **wajib**: layout assign + apply, sekali |
| Binary di container | `mc`/`minio` di PATH | **`/garage`** (PATH image tidak memuat `/`) |

> **Kenapa bucket di-pre-create.** App memanggil `HeadBucket`, dan kalau
> gagal memanggil `CreateBucket`. Di Garage, izin diberikan **per bucket**
> dan belum dipastikan ada flag "key boleh membuat bucket sendiri". Dengan
> pre-create, `HeadBucket` selalu berhasil dan `CreateBucket` tidak pernah
> terpanggil.

## 0. Amankan dulu

```bash
docker save quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z | gzip > ~/minio-image-backup.tar.gz

# Nama volume moki disebut EKSPLISIT. Ada dua volume minio-data di server
# (moki dan BanKes-OTA-NG), jadi `grep … | head -1` bisa mengambil yang
# salah dan mem-backup stack yang bukan targetnya.
#
# Catatan: Coolify menormalkan nama volume — compose menulis `minio_data`,
# tapi di server namanya <project>_minio-data (tanda hubung).
VOL=lqfd6mol8al4jiquvvyb4ot3_minio-data
docker volume inspect "$VOL" >/dev/null || echo "VOLUME TIDAK ADA — cek: docker volume ls | grep -i minio"

# Direktori backup ditulis absolut, bukan `~`. Saat dijalankan sebagai root
# dari /home/madzul, `~` mengembang ke /root sehingga file-nya seolah tidak
# terbuat padahal ada di tempat lain.
BACKUP_DIR=/root
docker run --rm -v "$VOL":/data -v "$BACKUP_DIR":/backup \
  alpine tar czf /backup/moki-minio-data-backup.tar.gz -C /data .

ls -lh "$BACKUP_DIR/moki-minio-data-backup.tar.gz"   # pastikan ukurannya wajar
```

## 1. Env di Coolify

```bash
openssl rand -hex 32    # -> GARAGE_RPC_SECRET
openssl rand -base64 32 # -> GARAGE_ADMIN_TOKEN
```

Tambahkan `GARAGE_RPC_SECRET` dan `GARAGE_ADMIN_TOKEN`.

⚠️ **`S3_ENDPOINT_DOCKER` diubah port-nya dari `9000` ke `3900`**, host
tetap internal: `http://garage:3900` (sebelumnya `http://minio:9000`).

S3 API **tidak** di-publish ke host — tidak diperlukan, karena diakses dari
dalam network compose saja.

> **Bug lama yang perlu diketahui, bukan akibat migrasi.**
> `app/ticket/[id]/page.tsx` merender `<img src={media_signed_url}>`
> langsung di browser. Presigned URL dibuat dari `S3_ENDPOINT`, yang
> bernilai internal — dulu `minio:9000`, sekarang `garage:3900` — sehingga
> browser tidak bisa me-resolve host-nya dan **lampiran media tiket tidak
> tampil**. Ini sudah terjadi sejak memakai MinIO.
>
> Perbaikan yang benar: route proxy server-side, seperti
> `/api/admin/content-assets/[assetId]/download` yang sudah ada untuk asset
> konten — bukan mengekspos S3 API ke internet.

`S3_ACCESS_KEY_ID` dan `S3_SECRET_ACCESS_KEY` diisi setelah langkah 3.
`S3_REGION` tidak perlu diubah (`us-east-1` sudah cocok).

## 1b. Pastikan tidak ada file storage sisa di Coolify

Kalau pernah mencoba bind mount `garage.toml`, Coolify mendaftarkan
`/etc/garage.toml` sebagai **file storage** dan bisa me-mount-nya sebagai
directory kosong — menimpa config yang sudah di-COPY ke image, dan Garage
akan gagal dengan `Is a directory (os error 21)`.

Periksa di Coolify → resource → **Storages**, dan hapus entri
`/etc/garage.toml` kalau ada. (Ini terjadi di `BanKes-OTA-NG`.)

## 2. Deploy

Garage hidup tapi belum melayani apa pun sampai layout di-apply.

## 3. Bootstrap (sekali saja)

> Nama container dibuat Coolify — `container_name:` di compose diabaikan.
> Binary ada di `/garage`, bukan di PATH.

```bash
GC=$(docker ps --format '{{.Names}}' | grep ^garage- | head -1)
G="docker exec -it $GC /garage"

$G status                     # catat Node ID
$G layout show                # cek apakah layout sudah ada
$G layout assign -z dc1 -c 100G <NODE_ID>
$G layout apply --version 1

# Pre-create SEMUA bucket yang dipakai app
for B in content-assets blast-assets ticket-assets; do
  $G bucket create "$B"
done

$G key create moki-app
for B in content-assets blast-assets ticket-assets; do
  $G bucket allow --read --write --owner "$B" --key moki-app
done

$G key info moki-app --show-secret   # -> S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY
```

Sesuaikan `-c 100G` dengan kapasitas yang ingin dialokasikan; cek dulu
ukuran data lama dengan `docker system df -v | grep -i minio`.

### ⚠️ Bucket dari database

Kolom `storage_bucket` menyimpan nama bucket per baris, jadi bisa ada nilai
di luar tiga konstanta di atas. Enumerasi dulu:

```sql
SELECT DISTINCT storage_bucket FROM content_assets WHERE storage_bucket IS NOT NULL;
```

Setiap nilai yang muncul harus ikut di-`bucket create` dan di-`bucket allow`,
kalau tidak file-nya tidak akan bisa diakses.

## 4. Pindahkan data

`mc` sudah tidak bisa di-pull, jadi pakai rclone. MinIO lama dijalankan
sementara dari image yang masih ada di cache.

```bash
GC=$(docker ps --format '{{.Names}}' | grep ^garage- | head -1)
NET=$(docker inspect "$GC" -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' | tr ' ' '\n' | grep -v '^$' | head -1)
VOL=lqfd6mol8al4jiquvvyb4ot3_minio-data

docker run -d --name minio-old --network "$NET" \
  -v "$VOL":/data \
  -e MINIO_ROOT_USER="<MINIO_ROOT_USER lama>" \
  -e MINIO_ROOT_PASSWORD="<MINIO_ROOT_PASSWORD lama>" \
  quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z server /data

for B in content-assets blast-assets ticket-assets; do
  docker run --rm --network "$NET" \
    -e RCLONE_CONFIG_OLD_TYPE=s3 -e RCLONE_CONFIG_OLD_PROVIDER=Minio \
    -e RCLONE_CONFIG_OLD_ENDPOINT=http://minio-old:9000 \
    -e RCLONE_CONFIG_OLD_ACCESS_KEY_ID="<lama>" \
    -e RCLONE_CONFIG_OLD_SECRET_ACCESS_KEY="<lama>" \
    -e RCLONE_CONFIG_NEW_TYPE=s3 -e RCLONE_CONFIG_NEW_PROVIDER=Other \
    -e RCLONE_CONFIG_NEW_ENDPOINT=http://garage:3900 \
    -e RCLONE_CONFIG_NEW_REGION=us-east-1 \
    -e RCLONE_CONFIG_NEW_ACCESS_KEY_ID="<GK… baru>" \
    -e RCLONE_CONFIG_NEW_SECRET_ACCESS_KEY="<secret baru>" \
    rclone/rclone:1.71.0 copy "OLD:$B" "NEW:$B" --progress --checksum
done

docker rm -f minio-old
```

## 5. Deploy ulang, lalu verifikasi

Yang **wajib** diuji — ini satu-satunya bagian yang tidak dipakai di
BanKes-OTA-NG sehingga belum pernah terbukti dengan Garage:

1. **Presigned URL.** Buka halaman Assets (`/content-assets`) dan pastikan
   gambar tampil. Presigned URL memakai host dari `S3_ENDPOINT` apa adanya,
   jadi kalau gambar gagal dimuat, periksa apakah `S3_ENDPOINT_DOCKER`
   menunjuk alamat yang bisa dijangkau browser di port 3900.
2. **Upload baru** di Assets atau Ticket, pastikan tampil, lalu hapus —
   menguji `PutObject`, presigned `GetObject`, dan `DeleteObject`.
3. **Halaman Import** (`/scrape`, label "Library"/"Import") — asset konten
   disimpan di bucket ini, dan pernah ada laporan "konten hasil fitur
   import hilang" yang belum terpecahkan. Layak diperiksa ulang di sini.

## 6. Bersih-bersih (setelah verifikasi lulus)

```bash
docker volume rm "$VOL"
```

Simpan `moki-minio-data-backup.tar.gz` beberapa waktu.
