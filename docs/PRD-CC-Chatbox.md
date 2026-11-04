# PRODUCT REQUIREMENT DOCUMENT (PRD)
## Sistem Chatbox Triase & Penjadwalan Konseling Mahasiswa (Konsel.In / CC-Chatbox)
**Gerbang Layanan Bimbingan dan Konseling Kampus Berbasis Percakapan Interaktif, Skrining Awal Mandiri, dan Intervensi Krisis Terintegrasi**

| Atribut Dokumen | Detail Spesifikasi | Atribut Rilis | Detail Operasional |
| :--- | :--- | :--- | :--- |
| **Nama Produk** | Campus Counseling Chatbox (CC-Chatbox / Konsel.In) | **Versi Dokumen** | v1.0 (Dokumen Spesifikasi Lengkap) |
| **Unit Pengelola** | Unit Layanan Bimbingan & Konseling (BK) Kampus | **Status Rilis** | Tahap Pengembangan MVP |
| **Target Pengguna** | Mahasiswa Aktif, Dosen BK/Konselor, Konselor Sebaya, Admin BK | **Platform Utama** | Responsive Web Widget & Portal (Mobile & Desktop) |
| **Integrasi Sistem** | SIAKAD (SSO), WhatsApp Gateway, Google Calendar & Meet | **Tingkat Privasi** | Rahasia / Terenkripsi AES-256 (Kode Etik Konseling) |

---

## 01. IKHTISAR & LANDASAN PRODUK
Layanan Bimbingan dan Konseling (BK) di lingkungan perguruan tinggi sering menghadapi kesenjangan antara tingginya kebutuhan pendampingan mahasiswa dengan rendahnya tingkat pemanfaatan layanan resmi. Mahasiswa kerap mengalami hambatan psikologis (stigma takut dinilai bermasalah), kebingungan prosedur pendaftaran manual, serta ketidakpastian jadwal konselor. Sistem Chatbox Konseling Mahasiswa dirancang sebagai pintu masuk digital pertama (*first-line digital intake*) yang empatik, bebas stigma, dan beroperasi 24/7 untuk menjembatani mahasiswa dengan konselor kampus.

### 1.1 Tujuan Strategis Produk
1. **Menurunkan Hambatan Akses (Zero-Stigma Entry)**: Menyediakan ruang interaksi awal berbasis percakapan terpandu yang ramah dan memungkinkan mahasiswa melakukan eksplorasi layanan secara anonim sebelum memutuskan menjadwalkan sesi resmi.
2. **Otomasi Asesmen Awal (Smart Triage)**: Mengumpulkan informasi dasar terkait kategori permasalahan (akademik, pribadi/emosional, sosial, karier, atau spiritual) serta tingkat urgensi sebelum mahasiswa bertemu konselor.
3. **Mitigasi Risiko & Intervensi Krisis Cepat**: Mendeteksi kata kunci berbahaya (indikasi menyakiti diri atau krisis akut) secara *real-time* dan langsung mengarahkan mahasiswa ke protokol bantuan darurat.
4. **Efisiensi Administrasi Unit BK**: Mengeliminasi pencatatan manual dan tumpang-tindih jadwal melalui sinkronisasi slot ketersediaan konselor serta pengiriman tiket konseling otomatis.

### 1.2 Indikator Keberhasilan Utama (KPI & Target Metrik)
| Indikator Kinerja (KPI) | Definisi Operasional | Target Keberhasilan (MVP) |
| :--- | :--- | :--- |
| **Intake Completion Rate** | Persentase mahasiswa yang membuka chatbox hingga berhasil mengirim tiket/jadwal konseling. | `>= 70%` dari sesi percakapan aktif |
| **Average Triage Time** | Rata-rata durasi yang dibutuhkan mahasiswa dari membuka chatbox hingga jadwal terkonfirmasi. | `<= 3 menit` per transaksi booking |
| **Session No-Show Rate** | Persentase ketidakhadiran mahasiswa pada jadwal konseling yang telah dipesan. | Turun `>= 35%` berkat pengingat otomatis |
| **Crisis Escalation Speed** | Kecepatan sistem menampilkan kontak darurat saat mendeteksi kata kunci berisiko tinggi. | `< 1 detik` (Instan / 100% Akurasi Trigger) |
| **Student Satisfaction (CSAT)** | Tingkat kepuasan mahasiswa terhadap kemudahan dan kenyamanan penggunaan chatbox. | Skor rata-rata `>= 4.5` dari skala 5.0 |

