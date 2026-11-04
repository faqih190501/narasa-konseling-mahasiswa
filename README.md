# Konsel.In — Campus Counseling Chatbox (CC-Chatbox) v1.0

Implementasi Fullstack **Next.js + TypeScript + Tailwind CSS** untuk **Sistem Chatbox Triase & Penjadwalan Konseling Mahasiswa** berdasarkan dokumen spesifikasi PRD Unit Layanan Bimbingan & Konseling (BK) Kampus.

## Cara Menjalankan Aplikasi

1. **Melalui Shortcut Windows (Paling Mudah)**:
   Klik 2x file [`Jalankan-KonselIn.bat`](file:///d:/Konsel.In/Jalankan-KonselIn.bat), lalu buka `http://localhost:3000` di browser.

2. **Melalui Terminal PowerShell / CMD**:
   ```powershell
   $env:PATH = "$env:USERPROFILE\.local\node\node-v22.14.0-win-x64;$env:PATH"
   npm.cmd run dev
   ```

---

## Peta Fitur Sesuai Spesifikasi PRD (FR-01 s/d FR-11)

| Kode Fitur | Modul & Nama Fitur | Implementasi pada Konsel.In |
| :--- | :--- | :--- |
| **FR-01** | **Widget Chatbox & Informed Consent** | Layar persetujuan Kode Etik Kerahasiaan Konseling wajib disetujui sebelum masuk ke Tahap 2, dilengkapi pencatatan `consent_log` dan mode Floating Pop-up Web Widget. |
| **FR-02** | **Mesin Deteksi Kata Kunci Krisis (< 1 detik)** | Pemindaian *real-time* (`src/lib/triage-engine.ts`) terhadap kata kunci bahaya diri (formal & bahasa gaul). Mengunci layar ke Kartu Intervensi Darurat, *Click-to-Call* Konselor Jaga & Hotline `119 ext. 8`, serta mengirim *High-Priority Alert* ke Dashboard Konselor Piket. |
| **FR-03** | **Alur Triase & Kuesioner PHQ-4 (0–12)** | Klasifikasi 5 topik masalah + 4 pertanyaan skala Likert (0–3) untuk sub-skor kecemasan (`GAD-2`) dan depresi (`PHQ-2`). Melabeli tiket otomatis sebagai `Rendah (0-2)`, `Sedang (3-5)`, `Tinggi (6-8)`, atau `Kritis (9-12)`. |
| **FR-04** | **Mode Samaran (Pseudonym) & SSO SIAKAD** | Mahasiswa dapat menggunakan Nama Samaran atau memvalidasi NIM aktif melalui simulasi REST API SSO SIAKAD. Data PII (`nim`, `full_name`, `phone_wa`) dienkripsi menggunakan **AES-256-GCM** (`src/lib/crypto.ts`). |
| **FR-05** | **Manajemen Jadwal & Slot Konselor** | Sinkronisasi slot ketersediaan Dosen BK & Konselor Sebaya secara *real-time* (`is_booked = true` anti *double-booking*), serta fitur penambahan slot jadwal baru oleh konselor. |
| **FR-06** | **Penerbitan Tiket & Notifikasi Otomatis** | Pembuatan kode tiket unik (`BK-YYYYMMDD-XXXX`), tautan ruang virtual Google Meet otomatis, dan simulasi pengiriman konfirmasi WhatsApp Gateway (< 30 detik). |
| **FR-07** | **Dashboard Konselor, Pre-Session Brief & SOAP Notes** | RBAC ketat: hanya konselor yang ditugaskan pada `ticket_code` terkait yang dapat mendekripsi cerita klien (`client_story_encrypted`), mencatat **SOAP Notes**, merujuk kasus dari Konselor Sebaya ke Dosen BK Ahli, dan mengunduh **Kartu Riwayat Konseling**. |
| **FR-08** | **Pengingat Jadwal & Reschedule Mandiri** | Status pengingat otomatis H-1 & H-2 jam serta panel perubahan jadwal (*reschedule*) dan pembatalan mandiri oleh mahasiswa. |
| **FR-09** | **Modul Self-Help & Grounding Exercise** | Panduan animasi **Pernapasan 4-7-8**, latihan interaktif **Grounding 5-4-3-2-1**, synthesizer **Audio Relaksasi 432Hz** berbasis Web Audio API, dan pustaka artikel manajemen stres akademik. |
| **FR-10** | **Live Chat Handover (Konselor Jaga)** | Indikator status konselor *Online* dan ruang percakapan dua arah secara langsung antara mahasiswa dan Konselor / Konselor Sebaya. |
| **FR-11** | **Evaluasi Pasca-Sesi (CSAT) & Analitik Kampus** | Kuesioner CSAT bintang 1–5, pantauan 5 KPI utama MVP, fitur **Auto-Purge 30 Hari**, serta ekspor laporan bulanan **Excel/CSV & PDF 100% Anonim Secara Statistik**. |

