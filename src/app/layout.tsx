import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#FCFBF7",
};

export const metadata: Metadata = {
  title:
    "NARASA (Narasi Rasa) — Sistem Chatbox Triase & Konsultasi Konseling Mahasiswa",
  description:
    "NARASA (Narasi Rasa) • Gerbang Layanan Bimbingan dan Konseling Kampus Prodi BKPI & PIAUD Berbasis Percakapan Interaktif dan Skrining Awal Mandiri (PHQ-4).",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NARASA BK",
  },
  icons: {
    icon: "/logo-narasa.jpg",
    apple: "/logo-narasa.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased overflow-x-hidden selection:bg-[#6E7D68] selection:text-white">
        {children}
      </body>
    </html>
  );
}
