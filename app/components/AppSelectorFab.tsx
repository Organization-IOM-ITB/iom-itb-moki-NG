"use client";

import { Fab, Tooltip } from "@mui/material";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";

import { adminPalette } from "../lib/adminPalette";

// Halaman "Pilihan Aplikasi" ada di admin-NG (/select) dan dipakai bersama
// oleh semua app SSO. Default di-hardcode agar tidak wajib env; override
// lewat NEXT_PUBLIC_APP_SELECTOR_URL (di-inline saat build).
const APP_SELECTOR_URL =
  process.env.NEXT_PUBLIC_APP_SELECTOR_URL || "https://admin-ng.iom-itb.id/select";

export default function AppSelectorFab() {
  return (
    <Tooltip title="Pilihan Aplikasi" placement="left">
      <Fab
        component="a"
        href={APP_SELECTOR_URL}
        aria-label="Kembali ke Pilihan Aplikasi"
        sx={{
          position: "fixed",
          right: 24,
          bottom: 24,
          // Di bawah OutboundTrackerOverlay (1400) agar panel progres blast
          // tetap terbaca saat keduanya muncul di pojok yang sama.
          zIndex: 1300,
          color: "#ffffff",
          backgroundColor: adminPalette.brand,
          boxShadow: "0 10px 24px rgba(0, 55, 147, 0.28)",
          transition: "transform 160ms ease, background-color 160ms ease",
          "&:hover": {
            backgroundColor: adminPalette.brandDark,
            transform: "translateY(-2px)",
          },
        }}
      >
        <AppsRoundedIcon />
      </Fab>
    </Tooltip>
  );
}
