# Config dibawa lewat build, BUKAN bind mount.
#
# Coolify menjalankan `docker compose` di dalam container helper, sementara
# bind mount diselesaikan oleh Docker daemon di host. Path /artifacts/<id>
# tidak ada di host, sehingga bind mount file config membuat Docker
# menciptakan directory kosong dan Garage gagal:
#   Error: IO error: Is a directory (os error 21)
# Build context dikirim sebagai tar dari helper, jadi COPY bekerja normal.
FROM dxflrs/garage:v2.1.0

COPY garage.toml /etc/garage.toml
