import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "NARASA (Narasi Rasa) — Sistem Chatbox Triase & Penjadwalan Konseling Mahasiswa",
  description:
    "NARASA (Narasi Rasa) • Gerbang Layanan Bimbingan dan Konseling Kampus Berbasis Percakapan Interaktif, Skrining Awal Mandiri (PHQ-4), dan Intervensi Krisis Terintegrasi.",
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
      <body className="antialiased selection:bg-[#6E7D68] selection:text-white">
        {children}
      </body>
    </html>
  );
}
