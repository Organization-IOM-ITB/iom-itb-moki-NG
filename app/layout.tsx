import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import AdminNotificationCenter from "./components/AdminNotificationCenter";
import DownloadProvider from "./components/DownloadProvider";
import OutboundTrackerOverlay from "./components/OutboundTrackerOverlay";
import ThemeRegistry from "./components/ThemeRegistry";
import SsoProvider from "./components/SsoProvider";
import "./globals.css";

// DM Sans = font kanonik IOM-ITB (lihat iom-tokens.css).
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MOKI ITB",
  description: "Kelola kontak dan kirim blast message dengan alur yang sederhana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${dmSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeRegistry>
          <SsoProvider>
            <DownloadProvider>
              <AdminNotificationCenter />
              {children}
            </DownloadProvider>
          </SsoProvider>
          <OutboundTrackerOverlay />
        </ThemeRegistry>
      </body>
    </html>
  );
}
