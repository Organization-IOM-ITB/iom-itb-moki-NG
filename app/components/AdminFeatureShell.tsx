"use client";

import { useState } from "react";
import Link from "next/link";
import { Box, Button, Drawer, IconButton, Stack, Typography } from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import PermMediaRoundedIcon from "@mui/icons-material/PermMediaRounded";
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import { adminPalette, adminTypographySx } from "../lib/adminPalette";
import AppSelectorFab from "./AppSelectorFab";
import { useSso } from "./SsoProvider";

interface AdminFeatureShellProps {
  title: string;
  description: string;
  currentPath:
    | "/contacts"
    | "/group"
    | "/blastmessage"
    | "/ticket"
    | "/whatsapp"
    | "/scrape"
    | "/content-record"
    | "/content-assets"
    | "/content-tags"
    | "/access-control";
  badge?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    href: "/contacts" as const,
    featureKey: "contacts",
    label: "Contacts",
    icon: <PeopleAltRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    href: "/group" as const,
    featureKey: "groups",
    label: "Groups",
    icon: <Groups2RoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    href: "/blastmessage" as const,
    featureKey: "blast",
    label: "Blast",
    icon: <SendRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    href: "/ticket" as const,
    featureKey: "ticket",
    label: "Ticket",
    icon: <ConfirmationNumberRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    href: "/whatsapp" as const,
    featureKey: "whatsapp",
    label: "WhatsApp",
    icon: <WhatsAppIcon sx={{ fontSize: 18 }} />,
  },
  {
    href: "/scrape" as const,
    featureKey: "scrape",
    label: "Import",
    icon: <ManageSearchRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    href: "/content-record" as const,
    featureKey: "content-record",
    label: "Library",
    icon: <VideoLibraryRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    href: "/content-assets" as const,
    featureKey: "content-assets",
    label: "Assets",
    icon: <PermMediaRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    href: "/content-tags" as const,
    featureKey: "content-assets",
    label: "Tags",
    icon: <LocalOfferRoundedIcon sx={{ fontSize: 18 }} />,
  },
];

interface NavItem {
  href: string;
  featureKey: string;
  label: string;
  icon: React.ReactNode;
}

// Isi rail (logo + menu). Dipakai di sidebar desktop (≥ lg) dan di drawer
// yang dibuka tombol menu di header untuk layar lebih sempit.
function SidebarRailContent({
  navItems,
  currentPath,
  onNavigate,
}: {
  navItems: NavItem[];
  currentPath: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Box
        sx={{
          width: "100%",
          height: 60,
          px: 1,
          py: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src="/logo copy.png"
            alt="MOKI"
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </Box>
      </Box>

      <Stack spacing={0} sx={{ width: "100%", py: 1 }}>
        {navItems.map((item) => {
          const active = item.href === currentPath;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: "none" }}
              onClick={onNavigate}
            >
              <Box
                sx={{
                  px: 0.5,
                  py: 1.05,
                  backgroundColor: active
                    ? adminPalette.sidebarActive
                    : "transparent",
                  color: active
                    ? adminPalette.textPrimary
                    : adminPalette.sidebarRailText,
                  textAlign: "center",
                  transition:
                    "background-color 120ms ease, color 120ms ease",
                  "&:hover": {
                    backgroundColor: active
                      ? adminPalette.sidebarActive
                      : "rgba(255,255,255,0.08)",
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: 20,
                  },
                }}
              >
                <Box sx={{ display: "grid", placeItems: "center" }}>
                  {item.icon}
                </Box>
                <Typography
                  sx={{
                    mt: 0.55,
                    fontSize: "0.62rem",
                    lineHeight: 1.15,
                    fontWeight: 700,
                    color: "inherit",
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            </Link>
          );
        })}
      </Stack>
    </>
  );
}

export default function AdminFeatureShell({
  title,
  description,
  currentPath,
  badge,
  actions,
  children,
}: AdminFeatureShellProps) {
  const { userName, userEmail, roles, features, logout } = useSso();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAdmin = roles.includes("admin");
  const accessibleNavItems = NAV_ITEMS.filter((item) => isAdmin || features.includes(item.featureKey));
  const navItems = isAdmin
    ? [
        ...accessibleNavItems,
        {
          href: "/access-control" as const,
          featureKey: "access-control",
          label: "Access",
          icon: <AdminPanelSettingsRoundedIcon sx={{ fontSize: 18 }} />,
        },
      ]
    : accessibleNavItems;

  return (
    <Box sx={{ ...adminTypographySx, minHeight: "100vh", backgroundColor: adminPalette.canvas }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "80px minmax(0, 1fr)" },
          gridTemplateRows: {
            xs: "60px auto minmax(0, 1fr)",
            lg: "60px minmax(0, 1fr)",
          },
          minHeight: "100vh",
        }}
      >
        <Box
          component="aside"
          sx={{
            display: { xs: "none", lg: "flex" },
            position: "sticky",
            top: 0,
            gridColumn: "1 / 2",
            gridRow: "1 / 3",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: adminPalette.sidebarRail,
            borderRight: "1px solid rgba(4, 1, 1, 0.08)",
          }}
        >
          <SidebarRailContent navItems={navItems} currentPath={currentPath} />
        </Box>

        <Box
          component="header"
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            gridColumn: { xs: "1 / 2", lg: "2 / 4" },
            gridRow: "1 / 2",
            height: 60,
            px: { xs: 2, md: 3 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: adminPalette.topNav,
            color: "#ffffff",
            borderBottom: `1px solid ${adminPalette.brand}`,
          }}
        >
          <Stack direction="row" spacing={1.2} alignItems="center">
            <IconButton
              aria-label="Buka menu"
              onClick={() => setDrawerOpen(true)}
              sx={{
                display: { xs: "inline-flex", lg: "none" },
                ml: -1,
                color: "#ffffff",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
              }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              MOKI ITB
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 1,
                px: 1.25,
                py: 0.75,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                backgroundColor: "rgba(255,255,255,0.14)",
              }}
            >
              <NotificationsNoneRoundedIcon sx={{ fontSize: 18 }} />
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "inherit",
                }}
              >
                Notifications
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.75, sm: 1 },
                minWidth: 0,
                maxWidth: { xs: 190, sm: 320 },
                px: { xs: 1, sm: 1.25 },
                py: 0.55,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.22)",
                backgroundColor: "rgba(255,255,255,0.16)",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: { xs: "0.76rem", sm: "0.82rem" },
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: "inherit",
                  }}
                >
                  {userName || "Pengguna SSO"}
                </Typography>
                <Typography
                  sx={{
                    display: { xs: "none", sm: "block" },
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: "0.72rem",
                    lineHeight: 1.15,
                    color: "rgba(255,255,255,0.72)",
                  }}
                >
                  {userEmail || roles.join(", ") || "MOKI ITB SSO"}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                sx={{
                  minWidth: 0,
                  borderRadius: 999,
                  borderColor: "rgba(255,255,255,0.42)",
                  color: "#ffffff",
                  textTransform: "none",
                  fontWeight: 700,
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.72)",
                    backgroundColor: "rgba(255,255,255,0.12)",
                  },
                }}
                onClick={() => {
                  void logout();
                }}
              >
                Logout
              </Button>
            </Box>
          </Stack>
        </Box>

        <Stack
          sx={{
            minWidth: 0,
            minHeight: 0,
            gridColumn: { xs: "1 / 2", lg: "2 / 3" },
            gridRow: { xs: "3 / 4", lg: "2 / 3" },
          }}
        >
          <Box
            sx={{
              display: { xs: "block", lg: "none" },
              gridRow: "2 / 3",
              backgroundColor: adminPalette.surfaceSoft,
              borderBottom: `1px solid ${adminPalette.border}`,
            }}
          >
            <Stack spacing={1.5} sx={{ px: 2, py: 2 }}>
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: adminPalette.textMuted,
                  }}
                >
                  {badge || "Workspace"}
                </Typography>
                <Typography
                  component="h1"
                  sx={{
                    mt: 0.7,
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: adminPalette.textPrimary,
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.85,
                    fontSize: "0.88rem",
                    lineHeight: 1.55,
                    color: adminPalette.textSecondary,
                  }}
                >
                  {description}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {navItems.map((item) => {
                  const active = item.href === currentPath;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{ textDecoration: "none" }}
                    >
                      <Button
                        variant={active ? "contained" : "outlined"}
                        size="small"
                        sx={{
                          minHeight: 32,
                          minWidth: 0,
                          borderRadius: 1.5,
                          textTransform: "none",
                          fontWeight: 700,
                          boxShadow: "none",
                          borderColor: adminPalette.borderStrong,
                          color: active
                            ? "#ffffff"
                            : adminPalette.textSecondary,
                          backgroundColor: active
                            ? adminPalette.brand
                            : adminPalette.surface,
                          "&:hover": {
                            boxShadow: "none",
                            backgroundColor: active
                              ? adminPalette.brandDark
                              : adminPalette.brandSoft,
                            borderColor: active
                              ? adminPalette.brandDark
                              : adminPalette.brandSoftStrong,
                          },
                        }}
                      >
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </Stack>

              {actions ? <Box>{actions}</Box> : null}
            </Stack>
          </Box>

          <Box sx={{ minWidth: 0, px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
            {children}
          </Box>
        </Stack>
      </Box>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ display: { lg: "none" } }}
        PaperProps={{
          sx: {
            width: 80,
            alignItems: "center",
            backgroundColor: adminPalette.sidebarRail,
          },
        }}
      >
        <SidebarRailContent
          navItems={navItems}
          currentPath={currentPath}
          onNavigate={() => setDrawerOpen(false)}
        />
      </Drawer>

      <AppSelectorFab />
    </Box>
  );
}
