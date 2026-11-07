"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Gamepad2,
  Trophy,
  Sparkles,
  Brain,
  Zap,
  Lightbulb,
  RotateCcw,
  Volume2,
  VolumeX,
  Timer,
  Heart,
  Star,
  Award,
  CheckCircle2,
  XCircle,
  Play,
  HelpCircle,
  Scissors,
  Flame,
  ShieldCheck,
  MessageSquareHeart,
  BookOpenCheck,
  Compass,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

type ActiveGameTab =
  | "micro"
  | "sorter"
  | "emotion"
  | "cbt"
  | "memory"
  | "reflex";

type MemoryDifficulty = "easy" | "medium" | "hard";
type SorterTrack = "piaud" | "azas_bk" | "teori_konseling";

interface GameStats {
  totalXp: number;
  gamesCompleted: number;
  memoryBest: Record<MemoryDifficulty, number>;
  reflexBest: number;
  cbtBest: number;
  microBest: number;
  sorterBest: number;
  emotionBest: number;
}

const DEFAULT_STATS: GameStats = {
  totalXp: 0,
  gamesCompleted: 0,
  memoryBest: { easy: 0, medium: 0, hard: 0 },
  reflexBest: 0,
  cbtBest: 0,
  microBest: 0,
  sorterBest: 0,
  emotionBest: 0,
};

const STORAGE_KEY = "narasa_game_stats_v1";

// ============================================================================
// DATA GAME 1 (EDUKASI): LAB MIKRO-KONSELING (MERAKIT RESPONS EMPATIK 3-TAHAP)
// Teori: Carl Rogers (Person-Centered) & Allen Ivey (Microskills Hierarchy)
// ============================================================================
interface MicroCounselingCase {
  id: string;
  clientLabel: string;
  prodiContext: string;
  clientStatement: string;
  theoryReference: string;
  step1Reflection: {
    prompt: string;
    choices: { id: string; text: string; isBest: boolean; note: string }[];
  };
  step2Paraphrase: {
    prompt: string;
    choices: { id: string; text: string; isBest: boolean; note: string }[];
  };
  step3OpenQuestion: {
    prompt: string;
    choices: { id: string; text: string; isBest: boolean; note: string }[];
  };
}

const MICRO_COUNSELING_CASES: MicroCounselingCase[] = [
  {
    id: "mc-1",
    clientLabel: "Mahasiswa Semester Akhir",
    prodiContext: "Konteks Konseling Akademik BKPI",
    clientStatement:
      "\"Aku rasanya ingin menyerah saja menyusun skripsi ini. Setiap kali membuka laptop, dadaku sesak karena takut drafku ditolak lagi oleh dosen pembimbing.\"",
    theoryReference:
      "Allen Ivey (Microskills): Urutan ideal respons awal konselor adalah Refleksi Perasaan → Parafrase Isi → Pertanyaan Terbuka Eksploratif.",
    step1Reflection: {
      prompt: "Tahap 1 • Pilih kalimat Refleksi Perasaan (Reflection of Feeling):",
      choices: [
        {
          id: "r1",
          text: "Aku menangkap rasa cemas dan kelelahan yang begitu berat setiap kali kamu akan memulai bimbingan.",
          isBest: true,
          note: "Validasi emosi akurat tanpa menghakimi (Empati Primer Rogers).",
        },
        {
          id: "r2",
          text: "Kamu tidak boleh merasa takut begitu, semua mahasiswa juga mengalami revisi skripsi.",
          isBest: false,
          note: "Mengandung invalidasi emosi (minimizing) yang membuat konseli merasa tidak dipahami.",
        },
        {
          id: "r3",
          text: "Kenapa harus sesak napas? Dosen pembimbing kan memang tugasnya mengoreksi.",
          isBest: false,
          note: "Nada menginterogasi memicu pertahanan diri (defensiveness) konseli.",
        },
      ],
    },
    step2Paraphrase: {
      prompt: "Tahap 2 • Pilih kalimat Parafrase Inti Masalah (Paraphrasing):",
      choices: [
        {
          id: "p1",
          text: "Jadi kekhawatiran akan penolakan draf membuatmu terkunci bahkan sebelum mulai mengetik.",
          isBest: true,
          note: "Merangkum inti hambatan konseli dengan bahasa baru yang jernih dan ringkas.",
        },
        {
          id: "p2",
          text: "Artinya kamu memang kurang disiplin membagi waktu mengerjakan skripsi setiap malam.",
          isBest: false,
          note: "Memberi label penilaian (judgmental labeling), bukan memparafrase ucapan konseli.",
        },
        {
          id: "p3",
          text: "Pokoknya besok kamu wajib mengetik minimal sepuluh halaman tanpa alasan.",
          isBest: false,
          note: "Memberi perintah direktif prematur sebelum masalah terpetakan.",
        },
      ],
    },
    step3OpenQuestion: {
      prompt: "Tahap 3 • Pilih Pertanyaan Terbuka Pemberdaya (Open Question):",
      choices: [
        {
          id: "q1",
          text: "Bagian kecil mana dari catatan revisi tersebut yang menurutmu paling ringan untuk kita urai lebih dulu bersama?",
          isBest: true,
          note: "Pertanyaan terbuka yang mengarahkan konseli pada kendali diri (agency) dan solusi bertahap.",
        },
        {
          id: "q2",
          text: "Apakah kamu sudah minum air putih tadi pagi?",
          isBest: false,
          note: "Pertanyaan tertutup (ya/tidak) yang mengalihkan fokus dari inti beban emosional.",
        },
        {
          id: "q3",
          text: "Kamu tahu kan kalau menunda skripsi akan membuat kuliahmu makin mahal?",
          isBest: false,
          note: "Pertanyaan retoris yang justru menambah kecemasan (catastrophic pressure).",
        },
      ],
    },
  },
  {
    id: "mc-2",
    clientLabel: "Orang Tua Murid TK (Usia 5 Tahun)",
    prodiContext: "Konteks Kemitraan Orang Tua & Guru PIAUD",
    clientStatement:
      "\"Bu Guru, saya malu dan bingung sekali. Anak saya di rumah sering tantrum menangis berguling-guling kalau gawainya diminta, apakah saya gagal mendidik anak?\"",
    theoryReference:
      "Pendekatan Konseling Pengasuhan (Parenting Partnership PIAUD): Bangun rasa aman orang tua dari rasa bersalah sebelum mendiskusikan strategi regulasi anak.",
    step1Reflection: {
      prompt: "Tahap 1 • Pilih kalimat Refleksi Perasaan kepada Orang Tua:",
      choices: [
        {
          id: "r1",
          text: "Ibu pasti merasa sangat kewalahan sekaligus khawatir ketika menghadapi ledakan emosi ananda di rumah.",
          isBest: true,
          note: "Menurunkan rasa malu orang tua dengan penerimaan hangat tanpa syarat.",
        },
        {
          id: "r2",
          text: "Memang salah Ibu sendiri kenapa sejak awal anak usia dini diberikan gawai terlalu lama.",
          isBest: false,
          note: "Menyalahkan (blaming) memutus kepercayaan kolaborasi antara guru PIAUD dan orang tua.",
        },
        {
          id: "r3",
          text: "Jangan malu Bu, biasa saja kok anak menangis seperti itu.",
          isBest: false,
          note: "Mengabaikan kedalaman kekhawatiran orang tua.",
        },
      ],
    },
    step2Paraphrase: {
      prompt: "Tahap 2 • Pilih kalimat Parafrase Edukatif:",
      choices: [
        {
          id: "p1",
          text: "Transisi menghentikan layar gawai menjadi pemicu utama tantrum ananda, hingga membuat Ibu mempertanyakan peran pengasuhan Ibu.",
          isBest: true,
          note: "Memetakan pemicu perilaku anak dan beban batin orang tua secara objektif.",
        },
        {
          id: "p2",
          text: "Berarti anak Ibu termasuk kategori anak yang keras kepala dan sulit diatur.",
          isBest: false,
          note: "Melabel negatif karakter anak usia dini yang korteks prefrontalnya masih berkembang.",
        },
        {
          id: "p3",
          text: "Ibu harus langsung menyita gawai selamanya mulai sore ini.",
          isBest: false,
          note: "Instruksi kaku tanpa memahami konteks rutinitas keluarga di rumah.",
        },
      ],
    },
    step3OpenQuestion: {
      prompt: "Tahap 3 • Pilih Pertanyaan Terbuka Kolaboratif:",
      choices: [
        {
          id: "q1",
          text: "Biasanya aktivitas bermain fisik atau cerita apa yang paling disukai ananda saat sedang bersama Ibu tanpa gawai?",
          isBest: true,
          note: "Menggali kekuatan keluarga (strength-based inquiry) untuk menyusun aktivitas pengganti yang menyenangkan.",
        },
        {
          id: "q2",
          text: "Apakah Ibu pernah memarahi anak saat dia berguling-guling?",
          isBest: false,
          note: "Pertanyaan tertutup yang memojokkan orang tua.",
        },
        {
          id: "q3",
          text: "Kenapa Ibu tidak bisa tegas sedikit saja kepada anak usia lima tahun?",
          isBest: false,
          note: "Menghakimi kapasitas pengasuhan orang tua.",
        },
      ],
    },
  },
  {
    id: "mc-3",
    clientLabel: "Mahasiswa Baru Perantauan",
    prodiContext: "Konteks Adaptasi Sosial Kampus",
    clientStatement:
      "\"Sudah dua bulan kuliah, rasanya aku seperti orang asing di kelas. Semua teman sudah punya lingkaran akrab, sementara aku makan siang sendiri terus.\"",
    theoryReference:
      "Carl Rogers (Unconditional Positive Regard): Rasa kesepian membutuhkan kehadiran empatik yang menormalisasi pengalaman tanpa meremehkan.",
    step1Reflection: {
      prompt: "Tahap 1 • Pilih kalimat Refleksi Perasaan:",
      choices: [
        {
          id: "r1",
          text: "Merasa sendirian di lingkungan baru yang ramai tentu menyisakan rasa sepi dan tidak nyaman di hatimu.",
          isBest: true,
          note: "Menangkap kontras emosional 'sepi di tengah keramaian' secara peka.",
        },
        {
          id: "r2",
          text: "Makanya kamu jangan pendiam terus di pojok kelas, harus berani menyapa duluan.",
          isBest: false,
          note: "Nasihat menggurui membuat konseli merasa disalahkan atas kesepiannya.",
        },
        {
          id: "r3",
          text: "Makan siang sendiri sebenarnya lebih hemat waktu dan tenang lho.",
          isBest: false,
          note: "Mengalihkan topik dengan sudut pandang pribadi konselor.",
        },
      ],
    },
    step2Paraphrase: {
      prompt: "Tahap 2 • Pilih kalimat Parafrase Isi:",
      choices: [
        {
          id: "p1",
          text: "Kamu sangat merindukan koneksi pertemanan yang hangat, namun melihat kelompok yang sudah terbentuk membuatmu ragu untuk masuk.",
          isBest: true,
          note: "Menyimpulkan kebutuhan relasional sekaligus hambatan situasional konseli dengan tepat.",
        },
        {
          id: "p2",
          text: "Berarti teman-teman sekelasmu semuanya sombong dan pilih-pilih teman.",
          isBest: false,
          note: "Membuat asumsi negatif sepihak yang dapat memperburuk persepsi sosial konseli.",
        },
        {
          id: "p3",
          text: "Intinya kamu belum terbiasa merantau jauh dari rumah orang tua.",
          isBest: false,
          note: "Menyempitkan masalah tanpa menangkap keinginan konseli untuk berelasi di kelas.",
        },
      ],
    },
    step3OpenQuestion: {
      prompt: "Tahap 3 • Pilih Pertanyaan Terbuka Eksploratif:",
      choices: [
        {
          id: "q1",
          text: "Dari teman-teman di kelas atau kelompok tugas kemarin, situasi kecil seperti apa yang membuatmu merasa paling aman untuk memulai obrolan ringan?",
          isBest: true,
          note: "Membantu konseli mengidentifikasi peluang sosial berisiko rendah (micro-social step).",
        },
        {
          id: "q2",
          text: "Apakah kamu ingin pindah kos saja supaya punya teman baru?",
          isBest: false,
          note: "Pertanyaan tertutup yang melompat ke solusi ekstrem.",
        },
        {
          id: "q3",
          text: "Kenapa waktu orientasi mahasiswa baru kemarin kamu tidak langsung mencari sahabat?",
          isBest: false,
          note: "Mengungkit masa lalu yang tidak bisa diubah hanya menambah penyesalan.",
        },
      ],
    },
  },
  {
    id: "mc-4",
    clientLabel: "Pengurus Organisasi & Mahasiswa Aktif",
    prodiContext: "Konteks Burnout & Batas Sehat (Assertiveness)",
    clientStatement:
      "\"Semua kepanitiaan selalu melimpahkan tugas desain dan laporan ke aku karena aku tidak pernah tega menolak, tapi sekarang kesehatanku drop dan tugasku keteteran.\"",
    theoryReference:
      "Komunikasi Asertif & Konseling Realitas (Glasser): Membantu konseli menyadari konsekuensi 'people-pleasing' dan merancang batas sehat (healthy boundaries).",
    step1Reflection: {
      prompt: "Tahap 1 • Pilih kalimat Refleksi Perasaan:",
      choices: [
        {
          id: "r1",
          text: "Kamu tampak sangat kelelahan memikul beban berlapis sendirian sambil menahan rasa sungkan pada teman-temanmu.",
          isBest: true,
          note: "Merefleksikan kelelahan fisik sekaligus konflik batin rasa tidak enak hati.",
        },
        {
          id: "r2",
          text: "Wah hebat dong berarti kamu orang paling diandalkan di organisasi!",
          isBest: false,
          note: "Memuji beban berlebih justru memperkuat jebakan people-pleasing.",
        },
        {
          id: "r3",
          text: "Keluar saja langsung dari semua grup WhatsApp kepanitiaan malam ini.",
          isBest: false,
          note: "Saran reaktif ekstrem yang mengabaikan keterampilan komunikasi asertif.",
        },
      ],
    },
    step2Paraphrase: {
      prompt: "Tahap 2 • Pilih kalimat Parafrase Isi:",
      choices: [
        {
          id: "p1",
          text: "Keinginanmu menjaga perasaan rekan organisasi membuatmu terus berkata 'ya', hingga kesehatan dan kuliahmu sendiri ikut dikorbankan.",
          isBest: true,
          note: "Menunjukkan hubungan sebab-akibat perilaku secara objektif dan penuh respek.",
        },
        {
          id: "p2",
          text: "Teman-teman organisasimu memang sengaja memanfaatkan kebaikanmu.",
          isBest: false,
          note: "Menempatkan konseli semata-mata sebagai korban pasif tanpa ruang kendali asertif.",
        },
        {
          id: "p3",
          text: "Kamu kurang pintar mengatur jam tidur dan vitamin harianmu.",
          isBest: false,
          note: "Mengabaikan akar masalah batas beban kerja (workload boundary).",
        },
      ],
    },
    step3OpenQuestion: {
      prompt: "Tahap 3 • Pilih Pertanyaan Terbuka Pemberdaya:",
      choices: [
        {
          id: "q1",
          text: "Kalimat penolakan sopan seperti apa yang rasanya paling nyaman kamu ucapkan saat ada permintaan baru minggu ini?",
          isBest: true,
          note: "Melatih konseli merumuskan kalimat asertif (behavior rehearsal) yang sesuai dengan nilainya.",
        },
        {
          id: "q2",
          text: "Sudahkah kamu marah kepada ketua panitianya?",
          isBest: false,
          note: "Pertanyaan tertutup yang menyamakan asertif dengan agresif.",
        },
        {
          id: "q3",
          text: "Kenapa dari awal kamu mau saja disuruh-suruh?",
          isBest: false,
          note: "Pertanyaan 'kenapa' bernada menyalahkan memicu rasa malu pada konseli.",
        },
      ],
    },
  },
];

// ============================================================================
// DATA GAME 2 (EDUKASI): SORTIR CEPAT KURIKULUM BKPI & PIAUD
// Teori: Piaget, Vygotsky, STPPA PAUD, Asas BK Prayitno, Mazhab Konseling
// ============================================================================
interface SorterCardItem {
  id: string;
  statement: string;
  correctBucket: string;
  explanation: string;
}

const SORTER_CURRICULUM: Record<
  SorterTrack,
  {
    title: string;
    subtitle: string;
    buckets: { id: string; label: string; color: string }[];
    cards: SorterCardItem[];
  }
> = {
  piaud: {
    title: "Psikologi Perkembangan Anak (PIAUD)",
    subtitle: "Teori Kognitif Piaget, Vygotsky & Aspek Perkembangan AUD",
    buckets: [
      {
        id: "sensorimotor",
        label: "Sensorimotor (0–2 Th)",
        color: "bg-[#E2F2EC] border-[#559A87] text-[#1D5444]",
      },
      {
        id: "praoperasional",
        label: "Praoperasional (2–7 Th)",
        color: "bg-[#FCE8DF] border-[#EE7854] text-[#7A311B]",
      },
      {
        id: "vygotsky_zpd",
        label: "Scaffolding / ZPD Vygotsky",
        color: "bg-[#E9DDF8] border-[#8B5CF6] text-[#4C2889]",
      },
      {
        id: "sosial_emosi",
        label: "Regulasi Sosial-Emosional",
        color: "bg-[#FDF1CE] border-[#EAB308] text-[#73510C]",
      },
    ],
    cards: [
      {
        id: "p-1",
        statement:
          "Anak usia 4 tahun mengira gelas tinggi yang sempit berisi lebih banyak air dibanding gelas pendek lebar meski volumenya sama.",
        correctBucket: "praoperasional",
        explanation:
          "Piaget: Belum berkembangnya konsep konservasi (conservation) dan pemusatan perhatian pada satu dimensi (centration) khas tahap Praoperasional (2–7 tahun).",
      },
      {
        id: "p-2",
        statement:
          "Bayi usia 10 bulan mulai mencari mainan kerincingan yang disembunyikan di balik kain selimut.",
        correctBucket: "sensorimotor",
        explanation:
          "Piaget: Pencapaian ketetapan objek (Object Permanence) adalah tonggak kognitif utama tahap Sensorimotor (0–2 tahun).",
      },
      {
        id: "p-3",
        statement:
          "Guru TK memberi petunjuk bertahap saat anak menyusun puzzle baru, lalu mengurangi bantuan ketika anak mulai mahir sendiri.",
        correctBucket: "vygotsky_zpd",
        explanation:
          "Lev Vygotsky: Teknik Scaffolding di dalam Zone of Proximal Development (ZPD) menjembatani kemampuan aktual menuju kemampuan potensial anak.",
      },
      {
        id: "p-4",
        statement:
          "Anak usia 5 tahun belajar menunggu giliran perosotan dan mengungkapkan rasa kesal dengan kata-kata, bukan mendorong teman.",
        correctBucket: "sosial_emosi",
        explanation:
          "STPPA PIAUD: Kemampuan prososial, kontrol impuls, dan ekspresi emosi verbal merupakan indikator inti perkembangan Sosial-Emosional AUD.",
      },
      {
        id: "p-5",
        statement:
          "Anak usia 3,5 tahun menganggap boneka beruangnya ikut sedih dan lapar sehingga disuapi biskuit mainan (bermain simbolik & animisme).",
        correctBucket: "praoperasional",
        explanation:
          "Piaget: Symbolic Play (bermain pura-pura) dan pemikiran animisme berkembang pesat pada tahap Praoperasional.",
      },
      {
        id: "p-6",
        statement:
          "Bayi bereksplorasi mengenal dunia terutama melalui genggaman refleks, sentuhan tekstur, dan memasukkan benda aman ke mulut.",
        correctBucket: "sensorimotor",
        explanation:
          "Piaget: Pada tahap Sensorimotor, skema kognitif dibangun langsung melalui koordinasi pancaindra dan gerak motorik awal.",
      },
      {
        id: "p-7",
        statement:
          "Teman sebaya yang lebih terampil mendampingi temannya mengikat tali sepatu melalui contoh perlahan.",
        correctBucket: "vygotsky_zpd",
        explanation:
          "Vygotsky: More Knowledgeable Other (MKO) tidak hanya guru/orang dewasa, tetapi juga teman sebaya dalam pembelajaran sosial.",
      },
      {
        id: "p-8",
        statement:
          "Guru menyediakan 'Pojok Tenang' berisi bantal lembut dan kartu gambar perasaan bagi anak yang sedang menangis kewalahan.",
        correctBucket: "sosial_emosi",
        explanation:
          "Co-regulation menuju Self-Regulation membantu anak usia dini mengenali dan menenangkan emosi besar secara aman.",
      },
    ],
  },
  azas_bk: {
    title: "Asas & Kode Etik Bimbingan Konseling (BKPI)",
    subtitle: "Prinsip Fundamental Layanan Konseling Profesional",
    buckets: [
      {
        id: "kerahasiaan",
        label: "Asas Kerahasiaan",
        color: "bg-[#E2F2EC] border-[#559A87] text-[#1D5444]",
      },
      {
        id: "kesukarelaan",
        label: "Asas Kesukarelaan",
        color: "bg-[#FCE8DF] border-[#EE7854] text-[#7A311B]",
      },
      {
        id: "kemandirian",
        label: "Asas Kemandirian",
        color: "bg-[#E9DDF8] border-[#8B5CF6] text-[#4C2889]",
      },
      {
        id: "keterbukaan",
        label: "Asas Keterbukaan",
        color: "bg-[#FDF1CE] border-[#EAB308] text-[#73510C]",
      },
    ],
    cards: [
      {
        id: "b-1",
        statement:
          "Konselor mengenkripsi catatan sesi dengan AES-256 dan menolak menceritakan masalah pribadi konseli kepada teman sekelasnya.",
        correctBucket: "kerahasiaan",
        explanation:
          "Asas Kerahasiaan adalah mahkota profesi BK: seluruh data dan cerita pribadi konseli wajib dijaga mutlak kecuali kondisi darurat keselamatan jiwa.",
      },
      {
        id: "b-2",
        statement:
          "Mahasiswa datang ke ruang konseling atas kesadaran dan niat tulus sendiri setelah merasakan suasana layanan yang ramah tanpa paksaan.",
        correctBucket: "kesukarelaan",
        explanation:
          "Asas Kesukarelaan: Proses konseling paling efektif bila konseli hadir tanpa rasa terpaksa atau terancam hukuman.",
      },
      {
        id: "b-3",
        statement:
          "Konselor memfasilitasi konseli menimbang alternatif solusi hingga konseli mampu mengambil keputusan bertanggung jawab atas pilihannya sendiri.",
        correctBucket: "kemandirian",
        explanation:
          "Asas Kemandirian: Tujuan akhir konseling bukan membuat konseli bergantung pada konselor, melainkan berdaya mengatur hidupnya secara matang.",
      },
      {
        id: "b-4",
        statement:
          "Suasana penerimaan konselor yang tulus membuat konseli berani jujur mengungkapkan perasaan terdalam tanpa berpura-pura.",
        correctBucket: "keterbukaan",
        explanation:
          "Asas Keterbukaan: Kejujuran dua arah dan keaslian (congruence) menjadi pintu masuk pemecahan masalah yang akurat.",
      },
      {
        id: "b-5",
        statement:
          "Berkas asesmen psikologis dan catatan SOAP disimpan di lemari/basis data terkunci yang hanya dapat diakses konselor berwenang.",
        correctBucket: "kerahasiaan",
        explanation:
          "Kode Etik ABKIN mewajibkan pengamanan rekam konseling baik fisik maupun digital agar privasi konseli terlindungi.",
      },
      {
        id: "b-6",
        statement:
          "Konselor tidak mendiktekan jurusan atau pilihan karier secara sepihak, melainkan melatih konseli mengenali potensi dan keputusannya.",
        correctBucket: "kemandirian",
        explanation:
          "Menghormati otonomi (autonomy) konseli merupakan wujud nyata penerapan Asas Kemandirian.",
      },
    ],
  },
  teori_konseling: {
    title: "Mazhab & Pendekatan Terapi Konseling",
    subtitle: "Kenali Tokoh & Teknik Utama Psikoterapi Modern",
    buckets: [
      {
        id: "rogers",
        label: "Person-Centered (Rogers)",
        color: "bg-[#E2F2EC] border-[#559A87] text-[#1D5444]",
      },
      {
        id: "cbt",
        label: "Kognitif-Perilaku / CBT",
        color: "bg-[#FCE8DF] border-[#EE7854] text-[#7A311B]",
      },
      {
        id: "sfbt",
        label: "Solution-Focused (SFBT)",
        color: "bg-[#E9DDF8] border-[#8B5CF6] text-[#4C2889]",
      },
      {
        id: "behavior",
        label: "Behavioristik",
        color: "bg-[#FDF1CE] border-[#EAB308] text-[#73510C]",
      },
    ],
    cards: [
      {
        id: "t-1",
        statement:
          "Mengutamakan tiga kondisi inti: Congruence (keaslian), Unconditional Positive Regard (penerimaan tanpa syarat), dan Accurate Empathy.",
        correctBucket: "rogers",
        explanation:
          "Carl Rogers (Person-Centered Therapy) meyakini manusia memiliki kecenderungan aktualisasi diri bila berada dalam relasi terapeutik yang tulus.",
      },
      {
        id: "t-2",
        statement:
          "Mengajak konseli menguji bukti faktual atas keyakinan irasional (ABCDE Albert Ellis / pikiran otomatis Aaron Beck).",
        correctBucket: "cbt",
        explanation:
          "CBT & REBT berfokus pada bagaimana interpretasi kognitif terhadap peristiwa memengaruhi emosi dan tindakan seseorang.",
      },
      {
        id: "t-3",
        statement:
          "Menggunakan 'Miracle Question' (Pertanyaan Keajaiban) dan mencari 'Exception' (saat masalah pernah berhasil diatasi konseli).",
        correctBucket: "sfbt",
        explanation:
          "Insoo Kim Berg & Steve de Shazer: Solution-Focused Brief Therapy berorientasi masa depan dan kekuatan solusi yang sudah dimiliki konseli.",
      },
      {
        id: "t-4",
        statement:
          "Menerapkan Desensitisasi Sistematis, Token Economy, dan penguatan positif (positive reinforcement) untuk membentuk kebiasaan baru.",
        correctBucket: "behavior",
        explanation:
          "Konseling Behavioristik (Wolpe, Skinner) menggunakan prinsip belajar untuk memodifikasi perilaku maladaptif secara terukur.",
      },
      {
        id: "t-5",
        statement:
          "Menggunakan pertanyaan berskala (Scaling Question 1–10) untuk mengukur kemajuan kecil konseli menuju tujuan sesi.",
        correctBucket: "sfbt",
        explanation:
          "Scaling Question adalah teknik khas SFBT untuk mengonfirmasi progres nyata dan langkah kecil berikutnya.",
      },
      {
        id: "t-6",
        statement:
          "Melatih konseli mengisi Jurnal Catatan Pikiran (Thought Record) untuk mengenali jebakan overgeneralisasi dan catastrophizing.",
        correctBucket: "cbt",
        explanation:
          "Thought Record membantu konseli menyadari keterkaitan antara Situasi → Pikiran Otomatis → Emosi → Respons Alternatif Sehat.",
      },
    ],
  },
};

// ============================================================================
// DATA GAME 3 (EDUKASI): DETEKTIF LITERASI EMOSI & REGULASI (PLUTCHIK & BARRETT)
// Teori: Granularitas Emosi (Lisa Feldman Barrett) & Roda Emosi Plutchik
// ============================================================================
interface EmotionDetectiveCase {
  id: string;
  vignette: string;
  bodyCue: string;
  correctEmotion: string;
  emotionOptions: string[];
  correctStrategy: string;
  strategyOptions: { id: string; text: string }[];
  scientificInsight: string;
}

const EMOTION_DETECTIVE_CASES: EmotionDetectiveCase[] = [
  {
    id: "ed-1",
    vignette:
      "Kamu melihat daftar tugas akhir semester, chat grup praktikum, dan jadwal mengajar sekaligus hingga pikiranmu terasa penuh dan sulit memilih harus mulai dari mana.",
    bodyCue: "Sinyal Tubuh: Napas pendek di dada, bahu menegang, sulit fokus membaca satu kalimat utuh.",
    correctEmotion: "Kewalahan Kognitif (Overwhelmed)",
    emotionOptions: [
      "Kewalahan Kognitif (Overwhelmed)",
      "Kemarahan Eksplosif",
      "Kebosanan Apatis",
      "Rasa Malu Sosial",
    ],
    correctStrategy: "s1",
    strategyOptions: [
      {
        id: "s1",
        text: "Brain-Dump & Chunking: Tuliskan semua beban di kertas, pilih hanya 1 tugas terkecil berdurasi 15 menit, dan abaikan sisanya sejenak.",
      },
      {
        id: "s2",
        text: "Membuka tiga aplikasi media sosial sekaligus untuk melupakan tugas hingga tengah malam.",
      },
      {
        id: "s3",
        text: "Memaksa mengerjakan lima dokumen bersamaan dalam satu layar (multitasking ekstrem).",
      },
    ],
    scientificInsight:
      "Riset Kognitif: Saat working memory kelebihan muatan (cognitive overload), teknik eksternalisasi tulisan (brain-dump) dan micro-stepping langsung menurunkan beban amigdala.",
  },
  {
    id: "ed-2",
    vignette:
      "Teman dekatmu berhasil lolos seleksi beasiswa atau lomba yang juga sangat kamu impikan. Ada rasa perih di hati melihat pengumumannya, padahal kamu tidak membenci temanmu.",
    bodyCue: "Sinyal Tubuh: Perut terasa mengkerut, dorongan menutup layar ponsel dan membandingkan diri.",
    correctEmotion: "Cemburu Aspiratif (Benign Envy)",
    emotionOptions: [
      "Cemburu Aspiratif (Benign Envy)",
      "Jijik Moral (Disgust)",
      "Trauma Masa Lalu",
      "Euforia Berlebihan",
    ],
    correctStrategy: "s1",
    strategyOptions: [
      {
        id: "s1",
        text: "Jadikan sinyal arah nilai: Akui bahwa emosi ini menandakan hal tersebut penting bagimu, beri selamat tulus, lalu tanyakan tips belajarnya.",
      },
      {
        id: "s2",
        text: "Menghukum diri karena merasa menjadi teman yang jahat hanya gara-gara sempat merasa iri.",
      },
      {
        id: "s3",
        text: "Mencari-cari kekurangan teman tersebut supaya pencapaiannya terlihat sepele.",
      },
    ],
    scientificInsight:
      "Psikologi Emosi (Van de Ven): 'Benign Envy' berfungsi adaptif sebagai kompas motivasi—ia memberi tahu kita cita-cita apa yang sangat kita pedulikan.",
  },
  {
    id: "ed-3",
    vignette:
      "Kamu terlanjur berbicara dengan nada ketus kepada adik atau sahabatmu karena sedang lelah, lalu malamnya terus terbayang ekspresi sedih wajahnya.",
    bodyCue: "Sinyal Tubuh: Rasa berat di ulu hati, dorongan kuat ingin memperbaiki keadaan.",
    correctEmotion: "Rasa Bersalah Sehat (Constructive Guilt)",
    emotionOptions: [
      "Rasa Bersalah Sehat (Constructive Guilt)",
      "Kepanikan Akut",
      "Kesombongan Diri",
      "Mati Rasa (Numbness)",
    ],
    correctStrategy: "s1",
    strategyOptions: [
      {
        id: "s1",
        text: "Repair Action: Sampaikan permintaan maaf spesifik dengan tulus ('Maaf tadi nadaku ketus saat aku lelah') dan perbaiki komunikasi ke depan.",
      },
      {
        id: "s2",
        text: "Menyebut diri sendiri manusia paling buruk sedunia dan mengurung diri berminggu-minggu (Toxic Shame).",
      },
      {
        id: "s3",
        text: "Menyalahkan dia sepenuhnya supaya tidak perlu meminta maaf.",
      },
    ],
    scientificInsight:
      "Brené Brown & Tangney: Penting membedakan 'Guilt' ('perilakuku tadi keliru, aku bisa memperbaikinya') dari 'Shame' ('diriku buruk'). Guilt yang sehat mendorong perbaikan relasi!",
  },
  {
    id: "ed-4",
    vignette:
      "Sudah tidur 7 jam, tetapi rasanya tetap hampa, kehilangan antusiasme pada mata kuliah yang dulu disukai, dan mudah sinis terhadap aktivitas harian.",
    bodyCue: "Sinyal Tubuh: Energi terkuras kronis, rasa berjarak secara emosional (emotional exhaustion).",
    correctEmotion: "Kelelahan Emosional (Academic Burnout)",
    emotionOptions: [
      "Kelelahan Emosional (Academic Burnout)",
      "Kejutan Sesaat (Surprise)",
      "Demam Panggung",
      "Rasa Kagum (Awe)",
    ],
    correctStrategy: "s1",
    strategyOptions: [
      {
        id: "s1",
        text: "Pemulihan Bermakna & Dukungan: Kurangi komitmen non-esensial, jadwalkan istirahat bebas rasa bersalah, dan berkonsultasi dengan Konselor BK.",
      },
      {
        id: "s2",
        text: "Menambah 2 kepanitiaan baru supaya tidak sempat merasakan kelelahan.",
      },
      {
        id: "s3",
        text: "Menyimpulkan bahwa seluruh masa depan akademik sudah tamat selamanya.",
      },
    ],
    scientificInsight:
      "Christina Maslach (Burnout Inventory): Burnout memiliki 3 dimensi (kelelahan emosional, sinisme/depersonalisasi, penurunan efikasi) yang membutuhkan pemulihan beban & dukungan sosial, bukan sekadar dipaksa keras.",
  },
];

// ============================================================================
// DATA GAME 4: TANTANGAN REFRAMING KOGNITIF (CBT CHALLENGE)
// ============================================================================
interface CbtScenario {
  id: string;
  tag: string;
  situation: string;
  automaticThought: string;
  distortionName: string;
  distortionHint: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

const CBT_SCENARIOS: CbtScenario[] = [
  {
    id: "cbt-1",
    tag: "Skripsi & Akademik",
    situation:
      "Dosen pembimbing memberikan banyak catatan revisi berwarna merah pada draf Bab 2 skripsimu.",
    automaticThought:
      "\"Tulisan saya buruk sekali. Saya memang tidak berbakat kuliah dan pasti gagal lulus tepat waktu.\"",
    distortionName: "All-or-Nothing Thinking & Catastrophizing",
    distortionHint:
      "Pola pikir hitam-putih yang menganggap satu revisi sebagai kegagalan total di masa depan.",
    options: [
      {
        id: "a",
        text: "Catatan revisi adalah panduan spesifik agar draf saya lebih kuat. Saya bisa mencicil perbaikannya satu sub-bab per hari.",
        isCorrect: true,
        feedback:
          "Tepat! Ini adalah Cognitive Reframing yang memisahkan kualitas draf sementara dari nilai diri serta memecah masalah menjadi langkah konkret.",
      },
      {
        id: "b",
        text: "Sebaiknya saya menghindar dulu dari bimbingan selama sebulan sampai perasaan saya benar-benar siap.",
        isCorrect: false,
        feedback:
          "Penghindaran (avoidance) justru memperkuat kecemasan dan menumpuk beban revisi di kemudian hari.",
      },
      {
        id: "c",
        text: "Tidak apa-apa, anggap saja revisi itu tidak penting dan tidak usah dipikirkan sama sekali.",
        isCorrect: false,
        feedback:
          "Mengabaikan masalah nyata (denial) berbeda dengan menenangkan pikiran secara realistis.",
      },
      {
        id: "d",
        text: "Teman-teman lain pasti jauh lebih pintar karena draf mereka tampak mulus.",
        isCorrect: false,
        feedback:
          "Perbandingan sosial yang tidak adil hanya menambah tekanan emosional tanpa menyelesaikan revisi.",
      },
    ],
  },
  {
    id: "cbt-2",
    tag: "Praktikum BKPI",
    situation:
      "Saat latihan konseling sebaya (peer counseling) di prodi BKPI, konseli tiba-tiba terdiam lama setelah kamu mengajukan pertanyaan reflektif.",
    automaticThought:
      "\"Dia diam karena pertanyaan saya salah besar. Saya gagal menjadi calon konselor yang baik.\"",
    distortionName: "Mind Reading & Personalization",
    distortionHint:
      "Menebak isi pikiran orang lain secara negatif dan langsung menyalahkan diri sendiri sepenuhnya.",
    options: [
      {
        id: "a",
        text: "Langsung memberondongnya dengan lima pertanyaan baru supaya suasana tidak hening.",
        isCorrect: false,
        feedback:
          "Memutus keheningan secara terburu-buru dapat mengganggu proses refleksi emosi konseli.",
      },
      {
        id: "b",
        text: "Hening dalam konseling sering berarti konseli sedang memproses perasaannya. Saya cukup hadir hangat dan memberi ruang aman.",
        isCorrect: true,
        feedback:
          "Luar biasa! Dalam teknik BK, keheningan terapeutik (therapeutic silence) adalah ruang berharga bagi konseli untuk mengenali emosinya.",
      },
      {
        id: "c",
        text: "Meminta maaf berkali-kali karena sudah membuat suasana menjadi canggung.",
        isCorrect: false,
        feedback:
          "Fokus berlebihan pada kecemasan diri sendiri dapat mengalihkan perhatian dari kebutuhan konseli.",
      },
      {
        id: "d",
        text: "Menyimpulkan bahwa saya memang tidak cocok di jurusan BKPI.",
        isCorrect: false,
        feedback:
          "Overgeneralisasi dari satu momen latihan menghambat proses belajar keterampilan klinis.",
      },
    ],
  },
  {
    id: "cbt-3",
    tag: "Microteaching PIAUD",
    situation:
      "Saat simulasi mengajar anak usia dini (PIAUD), media alat peraga yang kamu buat kurang menarik perhatian sebagian anak hingga kelas menjadi riuh.",
    automaticThought:
      "\"Simulasi saya berantakan total! Dosen dan teman-teman pasti menilai saya tidak becus mendidik anak.\"",
    distortionName: "Magnification & Labeling",
    distortionHint:
      "Membesar-besarkan kendala wajar di kelas menjadi label kegagalan permanen pada diri sendiri.",
    options: [
      {
        id: "a",
        text: "Dinamika anak usia dini memang aktif dan spontan. Saya bisa mengajak tepuk fokus singkat lalu mencatat evaluasi media untuk sesi berikutnya.",
        isCorrect: true,
        feedback:
          "Sangat kompeten! Respons fleksibel (ice-breaking fokus) dan growth mindset adalah kunci utama pendidik PIAUD profesional.",
      },
      {
        id: "b",
        text: "Memarahi anak-anak dengan nada tinggi supaya kelas langsung diam seketika.",
        isCorrect: false,
        feedback:
          "Pendekatan represif bertentangan dengan prinsip ramah anak pada pendidikan anak usia dini.",
      },
      {
        id: "c",
        text: "Berhenti mengajar di tengah jalan karena merasa sudah terlanjur malu.",
        isCorrect: false,
        feedback:
          "Menyerah saat kendala muncul membuat kita kehilangan kesempatan melatih adaptabilitas kelas.",
      },
      {
        id: "d",
        text: "Menyalahkan teman sekelompok karena tidak membantu menyiapkan alat peraga.",
        isCorrect: false,
        feedback:
          "Menyalahkan pihak luar menutup ruang evaluasi konstruktif yang bisa kita kendalikan.",
      },
    ],
  },
  {
    id: "cbt-4",
    tag: "Presentasi Kelas",
    situation:
      "Jantungmu berdebar kencang dan telapak tangan dingin 5 menit sebelum giliran presentasi makalah di depan kelas.",
    automaticThought:
      "\"Jantung saya berdebar keras, artinya saya pasti akan nge-blank dan mempermalukan diri sendiri di depan semua orang!\"",
    distortionName: "Emotional Reasoning",
    distortionHint:
      "Menganggap sensasi fisik tegang sebagai bukti pasti bahwa bencana akan terjadi.",
    options: [
      {
        id: "a",
        text: "Keluar kelas dengan alasan sakit agar tidak jadi tampil hari ini.",
        isCorrect: false,
        feedback:
          "Menghindar memberi kelegaan sesaat, tetapi membuat ketakutan presentasi berikutnya makin besar.",
      },
      {
        id: "b",
        text: "Debar jantung adalah cara alami tubuh menyiapkan energi fokus. Saya tarik napas 4-7-8 dan fokus menyampaikan poin utama dengan perlahan.",
        isCorrect: true,
        feedback:
          "Tepat sekali! Mengubah pemaknaan arousal fisiologis dari 'ancaman' menjadi 'kesiapan energi' terbukti menurunkan kecemasan performa.",
      },
      {
        id: "c",
        text: "Membaca seluruh teks slide secepat mungkin tanpa menatap audiens sama sekali.",
        isCorrect: false,
        feedback:
          "Berbicara terlalu cepat justru memperpendek napas dan meningkatkan rasa panik.",
      },
      {
        id: "d",
        text: "Memaksa diri bahwa saya sama sekali tidak boleh merasa gugup sedikit pun.",
        isCorrect: false,
        feedback:
          "Melawan rasa gugup secara kaku justru menciptakan kecemasan lapis kedua (anxiety about anxiety).",
      },
    ],
  },
  {
    id: "cbt-5",
    tag: "Manajemen Energi & Burnout",
    situation:
      "Minggu ini ada 4 tugas makalah, jadwal organisasi kampus, dan kegiatan keluarga, sehingga tubuhmu terasa sangat terkuras.",
    automaticThought:
      "\"Kalau saya beristirahat malam ini, saya adalah mahasiswa pemalas dan tidak bertanggung jawab.\"",
    distortionName: "Should Statements & Self-Criticism",
    distortionHint:
      "Menuntut diri bekerja tanpa batas dengan aturan 'harus selalu produktif' yang menghukum diri.",
    options: [
      {
        id: "a",
        text: "Istirahat terjadwal adalah bagian dari strategi menjaga fungsi otak, bukan kemalasan. Saya tidur cukup malam ini lalu menyusun prioritas besok pagi.",
        isCorrect: true,
        feedback:
          "Tepat! Pemulihan terencana (restorative rest) menjaga memori kerja, regulasi emosi, dan produktivitas berkelanjutan.",
      },
      {
        id: "b",
        text: "Memaksakan begadang 2 malam berturut-turut dengan banyak kopi sampai semua selesai sekaligus.",
        isCorrect: false,
        feedback:
          "Deprivasi tidur akut menurunkan konsentrasi drastis dan memicu kelelahan emosional (burnout).",
      },
      {
        id: "c",
        text: "Menyerahkan semua tugas begitu saja tanpa dikerjakan sama sekali.",
        isCorrect: false,
        feedback:
          "Ekstrem menyerah sama tidak seimbangnya dengan ekstrem memforsir diri.",
      },
      {
        id: "d",
        text: "Terus menyalahkan diri sambil menatap layar laptop berjam-jam tanpa bisa mengetik.",
        isCorrect: false,
        feedback:
          "Rasa bersalah berlebih menguras energi mental tanpa menghasilkan progres maupun istirahat.",
      },
    ],
  },
  {
    id: "cbt-6",
    tag: "Filter Mental & Nilai",
    situation:
      "Nilai salah satu mata kuliahmu turun dari A menjadi B+, padahal kamu sudah berusaha belajar di tengah kondisi sempat kurang sehat.",
    automaticThought:
      "\"Nilai B+ ini mengecewakan. Usaha keras saya selama satu semester sia-sia belaka.\"",
    distortionName: "Mental Filter (Filter Mental Negatif)",
    distortionHint:
      "Hanya menyorot satu ketidaksempurnaan kecil dan menghapus seluruh perjuangan serta pencapaian lainnya.",
    options: [
      {
        id: "a",
        text: "Merobek catatan kuliah mata kuliah tersebut karena kesal pada diri sendiri.",
        isCorrect: false,
        feedback:
          "Melampiaskan kekecewaan dengan menghukum usaha sendiri memperdalam rasa frustrasi.",
      },
      {
        id: "b",
        text: "B+ tetap hasil yang baik, terlebih diraih saat kondisi kesehatan sempat menurun. Saya mengapresiasi ketekunan saya sambil mengevaluasi bagian yang perlu diperkuat.",
        isCorrect: true,
        feedback:
          "Kompeten & berimbang! Ini memadukan self-compassion (welas asih diri) dengan evaluasi realistis.",
      },
      {
        id: "c",
        text: "Berhenti belajar sungguh-sungguh di semester depan karena merasa usaha tidak ada gunanya.",
        isCorrect: false,
        feedback:
          "Learned helplessness menghentikan potensi perkembanganmu di semester berikutnya.",
      },
      {
        id: "d",
        text: "Menyembunyikan rasa sedih dan berpura-pura tidak peduli pada masa depan kuliah.",
        isCorrect: false,
        feedback:
          "Menekan emosi yang wajar justru membuat beban batin bertahan lebih lama.",
      },
    ],
  },
];

// ============================================================================
// DATA GAME 5: MEMORI HARMONI EMOSI
// ============================================================================
interface EmotionPairItem {
  id: string;
  emoji: string;
  title: string;
  affirmation: string;
  bg: string;
}

const EMOTION_POOL: EmotionPairItem[] = [
  {
    id: "tenang",
    emoji: "🌿",
    title: "Napas Tenang",
    affirmation:
      "Satu tarikan napas sadar memberi sinyal aman bagi sistem sarafmu.",
    bg: "from-[#E1F3EC] to-[#CBE9DD]",
  },
  {
    id: "empati",
    emoji: "🤝",
    title: "Empati Hangat",
    affirmation:
      "Mendengarkan tanpa menghakimi adalah jembatan pemulihan terbaik.",
    bg: "from-[#FCE7DD] to-[#F7D4C4]",
  },
  {
    id: "harapan",
    emoji: "☀️",
    title: "Harapan Baru",
    affirmation:
      "Hari yang berat bukan berarti perjalananmu gagal; esok selalu punya ruang bertumbuh.",
    bg: "from-[#FDF1CE] to-[#FAE3A7]",
  },
  {
    id: "fokus",
    emoji: "🎯",
    title: "Fokus Kini",
    affirmation:
      "Kerjakan satu langkah kecil di depan mata, bukan seluruh gunung sekaligus.",
    bg: "from-[#DCEBFA] to-[#C5DDF6]",
  },
  {
    id: "batas",
    emoji: "🛡️",
    title: "Batas Sehat",
    affirmation:
      "Berani berkata 'cukup' saat lelah adalah wujud menghargai kesehatan mentalmu.",
    bg: "from-[#E9DDF8] to-[#D7C4F0]",
  },
  {
    id: "syukur",
    emoji: "🌻",
    title: "Syukur Kecil",
    affirmation:
      "Menyadari tiga hal kecil yang berjalan baik hari ini menenangkan kecemasan.",
    bg: "from-[#FDECC8] to-[#F9DBA0]",
  },
  {
    id: "kasih",
    emoji: "💚",
    title: "Kasih Diri",
    affirmation:
      "Bicaralah pada dirimu sendiri selembut kamu menenangkan sahabat terdekatmu.",
    bg: "from-[#D9F2E6] to-[#BEE8D4]",
  },
  {
    id: "berani",
    emoji: "🦁",
    title: "Keberanian",
    affirmation:
      "Meminta bantuan ke konselor bukanlah kelemahan, melainkan keberanian merawat diri.",
    bg: "from-[#FCDFD3] to-[#F7C9B6]",
  },
  {
    id: "jernih",
    emoji: "💧",
    title: "Pikiran Jernih",
    affirmation:
      "Perasaan adalah tamu sementara; amati ia hadir tanpa harus hanyut di dalamnya.",
    bg: "from-[#D8EEF8] to-[#BDE1F2]",
  },
  {
    id: "aman",
    emoji: "🏡",
    title: "Ruang Aman",
    affirmation:
      "Setiap rasa punya cerita, dan di NARASA ceritamu selalu dihargai.",
    bg: "from-[#EFE6D8] to-[#E3D4BE]",
  },
];

interface MemoryCard {
  uid: string;
  pairId: string;
  emoji: string;
  title: string;
  affirmation: string;
  bg: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// ============================================================================
// DATA GAME 6: TANGKAP FOKUS & TEPIS OVERTHINKING (GO / NO-GO)
// ============================================================================
interface ReflexOrb {
  id: number;
  kind: "positive" | "golden" | "negative";
  label: string;
  emoji: string;
  xPct: number;
  yPct: number;
  createdAt: number;
  ttlMs: number;
}

const POSITIVE_ORBS = [
  { label: "Tenang", emoji: "🌿" },
  { label: "Fokus", emoji: "🎯" },
  { label: "Harapan", emoji: "☀️" },
  { label: "Empati", emoji: "💚" },
  { label: "Berdaya", emoji: "💪" },
  { label: "Syukur", emoji: "🌻" },
];

const NEGATIVE_ORBS = [
  { label: "Panik!", emoji: "🌩️" },
  { label: "Overthinking", emoji: "🌀" },
  { label: "Burnout", emoji: "🔥" },
  { label: "Cemas Berlebih", emoji: "⚡" },
];

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getPlayerRank(xp: number) {
  if (xp >= 2000) {
    return {
      title: "Master Konselor & Harmoni NARASA",
      badge: "👑",
      nextXp: 3500,
      color: "text-[#9E6B14] bg-[#FDECC8]",
    };
  }
  if (xp >= 900) {
    return {
      title: "Navigator Kognitif & Empati",
      badge: "🧭",
      nextXp: 2000,
      color: "text-[#2E7D67] bg-[#D6EFE6]",
    };
  }
  if (xp >= 350) {
    return {
      title: "Praktisi Muda BKPI-PIAUD",
      badge: "🌿",
      nextXp: 900,
      color: "text-[#3F78B5] bg-[#DCEBFA]",
    };
  }
  return {
    title: "Penjelajah Literasi Emosi",
    badge: "🌱",
    nextXp: 350,
    color: "text-[#6C4A32] bg-[#F5E6D8]",
  };
}

export default function MindfulGamesModule({
  studentName,
}: {
  studentName?: string;
}) {
  const [activeGame, setActiveGame] = useState<ActiveGameTab>("micro");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setStats({
          totalXp: Number(parsed.totalXp) || 0,
          gamesCompleted: Number(parsed.gamesCompleted) || 0,
          memoryBest: {
            easy: Number(parsed.memoryBest?.easy) || 0,
            medium: Number(parsed.memoryBest?.medium) || 0,
            hard: Number(parsed.memoryBest?.hard) || 0,
          },
          reflexBest: Number(parsed.reflexBest) || 0,
          cbtBest: Number(parsed.cbtBest) || 0,
          microBest: Number(parsed.microBest) || 0,
          sorterBest: Number(parsed.sorterBest) || 0,
          emotionBest: Number(parsed.emotionBest) || 0,
        });
      }
    } catch {}
  }, []);

  const updateStats = useCallback((updater: (prev: GameStats) => GameStats) => {
    setStats((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const playSfx = useCallback(
    (type: "flip" | "match" | "wrong" | "bonus" | "win") => {
      if (!soundEnabled) return;
      try {
        const AudioClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioClass) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;
        const notes: { freq: number; start: number; dur: number; gain: number }[] =
          type === "flip"
            ? [{ freq: 520, start: 0, dur: 0.07, gain: 0.06 }]
            : type === "match"
            ? [
                { freq: 523.25, start: 0, dur: 0.1, gain: 0.08 },
                { freq: 659.25, start: 0.08, dur: 0.14, gain: 0.09 },
              ]
            : type === "bonus"
            ? [
                { freq: 587.33, start: 0, dur: 0.08, gain: 0.08 },
                { freq: 783.99, start: 0.07, dur: 0.09, gain: 0.09 },
                { freq: 1046.5, start: 0.14, dur: 0.16, gain: 0.1 },
              ]
            : type === "win"
            ? [
                { freq: 523.25, start: 0, dur: 0.11, gain: 0.09 },
                { freq: 659.25, start: 0.1, dur: 0.11, gain: 0.09 },
                { freq: 783.99, start: 0.2, dur: 0.12, gain: 0.1 },
                { freq: 1046.5, start: 0.32, dur: 0.28, gain: 0.11 },
              ]
            : [
                { freq: 230, start: 0, dur: 0.1, gain: 0.08 },
                { freq: 175, start: 0.09, dur: 0.14, gain: 0.08 },
              ];

        notes.forEach((n) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = type === "wrong" ? "triangle" : "sine";
          osc.frequency.setValueAtTime(n.freq, now + n.start);
          g.gain.setValueAtTime(n.gain, now + n.start);
          g.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + n.start);
          osc.stop(now + n.start + n.dur + 0.02);
        });
      } catch {}
    },
    [soundEnabled]
  );

  // ==========================================================================
  // STATE & LOGIC — GAME 1 (EDUKASI): LAB MIKRO-KONSELING (3-STEP BUILDER)
  // ==========================================================================
  const [mcCases, setMcCases] = useState<MicroCounselingCase[]>([]);
  const [mcIndex, setMcIndex] = useState<number>(0);
  const [mcStep, setMcStep] = useState<1 | 2 | 3 | 4>(1);
  const [mcPicks, setMcPicks] = useState<{
    step1?: { text: string; isBest: boolean; note: string };
    step2?: { text: string; isBest: boolean; note: string };
    step3?: { text: string; isBest: boolean; note: string };
  }>({});
  const [mcScore, setMcScore] = useState<number>(0);
  const [mcFinished, setMcFinished] = useState<boolean>(false);

  const initMicroGame = useCallback(() => {
    const randomized = shuffleArray(MICRO_COUNSELING_CASES).map((c) => ({
      ...c,
      step1Reflection: {
        ...c.step1Reflection,
        choices: shuffleArray(c.step1Reflection.choices),
      },
      step2Paraphrase: {
        ...c.step2Paraphrase,
        choices: shuffleArray(c.step2Paraphrase.choices),
      },
      step3OpenQuestion: {
        ...c.step3OpenQuestion,
        choices: shuffleArray(c.step3OpenQuestion.choices),
      },
    }));
    setMcCases(randomized);
    setMcIndex(0);
    setMcStep(1);
    setMcPicks({});
    setMcScore(0);
    setMcFinished(false);
  }, []);

  useEffect(() => {
    initMicroGame();
  }, [initMicroGame]);

  const currentMc = mcCases[mcIndex];

  const handlePickMicroStep = (choice: {
    text: string;
    isBest: boolean;
    note: string;
  }) => {
    const pts = choice.isBest ? 35 : 5;
    playSfx(choice.isBest ? "match" : "wrong");
    setMcScore((s) => s + pts);

    if (mcStep === 1) {
      setMcPicks((p) => ({ ...p, step1: choice }));
      setMcStep(2);
    } else if (mcStep === 2) {
      setMcPicks((p) => ({ ...p, step2: choice }));
      setMcStep(3);
    } else if (mcStep === 3) {
      const nextPicks = { ...mcPicks, step3: choice };
      setMcPicks(nextPicks);
      if (
        nextPicks.step1?.isBest &&
        nextPicks.step2?.isBest &&
        choice.isBest
      ) {
        setMcScore((s) => s + 25); // Perfect Empathy Combo Bonus
        playSfx("bonus");
      }
      setMcStep(4);
    }
  };

  const handleNextMicroCase = () => {
    if (mcIndex + 1 >= mcCases.length) {
      setMcFinished(true);
      playSfx("win");
      updateStats((st) => ({
        ...st,
        totalXp: st.totalXp + Math.max(25, mcScore),
        gamesCompleted: st.gamesCompleted + 1,
        microBest: Math.max(st.microBest, mcScore),
      }));
      return;
    }
    setMcIndex((i) => i + 1);
    setMcStep(1);
    setMcPicks({});
  };

  // ==========================================================================
  // STATE & LOGIC — GAME 2 (EDUKASI): SORTIR CEPAT KURIKULUM BKPI & PIAUD
  // ==========================================================================
  const [sorterTrack, setSorterTrack] = useState<SorterTrack>("piaud");
  const [sorterDeck, setSorterDeck] = useState<SorterCardItem[]>([]);
  const [sorterIdx, setSorterIdx] = useState<number>(0);
  const [sorterScore, setSorterScore] = useState<number>(0);
  const [sorterStreak, setSorterStreak] = useState<number>(0);
  const [sorterCorrectCount, setSorterCorrectCount] = useState<number>(0);
  const [sorterPickedBucket, setSorterPickedBucket] = useState<string | null>(
    null
  );
  const [sorterFinished, setSorterFinished] = useState<boolean>(false);

  const initSorterGame = useCallback((track: SorterTrack) => {
    setSorterTrack(track);
    setSorterDeck(shuffleArray(SORTER_CURRICULUM[track].cards));
    setSorterIdx(0);
    setSorterScore(0);
    setSorterStreak(0);
    setSorterCorrectCount(0);
    setSorterPickedBucket(null);
    setSorterFinished(false);
  }, []);

  useEffect(() => {
    initSorterGame("piaud");
  }, [initSorterGame]);

  const currentSortCard = sorterDeck[sorterIdx];
  const currentSortCurriculum = SORTER_CURRICULUM[sorterTrack];

  const handleSortIntoBucket = (bucketId: string) => {
    if (!currentSortCard || sorterPickedBucket !== null || sorterFinished) {
      return;
    }
    setSorterPickedBucket(bucketId);
    const isRight = bucketId === currentSortCard.correctBucket;
    if (isRight) {
      const gained = 35 + sorterStreak * 10;
      playSfx(sorterStreak >= 2 ? "bonus" : "match");
      setSorterScore((s) => s + gained);
      setSorterStreak((st) => st + 1);
      setSorterCorrectCount((c) => c + 1);
    } else {
      playSfx("wrong");
      setSorterStreak(0);
    }
  };

  const handleNextSorterCard = () => {
    if (sorterIdx + 1 >= sorterDeck.length) {
      setSorterFinished(true);
      playSfx("win");
      updateStats((st) => ({
        ...st,
        totalXp: st.totalXp + Math.max(20, sorterScore),
        gamesCompleted: st.gamesCompleted + 1,
        sorterBest: Math.max(st.sorterBest, sorterScore),
      }));
      return;
    }
    setSorterIdx((i) => i + 1);
    setSorterPickedBucket(null);
  };

  // ==========================================================================
  // STATE & LOGIC — GAME 3 (EDUKASI): DETEKTIF LITERASI EMOSI & REGULASI
  // ==========================================================================
  const [edDeck, setEdDeck] = useState<EmotionDetectiveCase[]>([]);
  const [edIdx, setEdIdx] = useState<number>(0);
  const [edPhase, setEdPhase] = useState<"emotion" | "strategy" | "review">(
    "emotion"
  );
  const [edPickedEmotion, setEdPickedEmotion] = useState<string | null>(null);
  const [edPickedStrategy, setEdPickedStrategy] = useState<string | null>(null);
  const [edScore, setEdScore] = useState<number>(0);
  const [edFinished, setEdFinished] = useState<boolean>(false);

  const initEmotionGame = useCallback(() => {
    const shuffled = shuffleArray(EMOTION_DETECTIVE_CASES).map((item) => ({
      ...item,
      emotionOptions: shuffleArray(item.emotionOptions),
      strategyOptions: shuffleArray(item.strategyOptions),
    }));
    setEdDeck(shuffled);
    setEdIdx(0);
    setEdPhase("emotion");
    setEdPickedEmotion(null);
    setEdPickedStrategy(null);
    setEdScore(0);
    setEdFinished(false);
  }, []);

  useEffect(() => {
    initEmotionGame();
  }, [initEmotionGame]);

  const currentEd = edDeck[edIdx];

  const handlePickEmotionLabel = (label: string) => {
    if (!currentEd || edPhase !== "emotion") return;
    setEdPickedEmotion(label);
    const ok = label === currentEd.correctEmotion;
    playSfx(ok ? "match" : "wrong");
    if (ok) setEdScore((s) => s + 40);
    setEdPhase("strategy");
  };

  const handlePickEmotionStrategy = (stratId: string) => {
    if (!currentEd || edPhase !== "strategy") return;
    setEdPickedStrategy(stratId);
    const ok = stratId === currentEd.correctStrategy;
    playSfx(ok ? "bonus" : "wrong");
    if (ok) setEdScore((s) => s + 45);
    setEdPhase("review");
  };

  const handleNextEmotionCase = () => {
    if (edIdx + 1 >= edDeck.length) {
      setEdFinished(true);
      playSfx("win");
      updateStats((st) => ({
        ...st,
        totalXp: st.totalXp + Math.max(20, edScore),
        gamesCompleted: st.gamesCompleted + 1,
        emotionBest: Math.max(st.emotionBest, edScore),
      }));
      return;
    }
    setEdIdx((i) => i + 1);
    setEdPickedEmotion(null);
    setEdPickedStrategy(null);
    setEdPhase("emotion");
  };

  // ==========================================================================
  // STATE & LOGIC — GAME 4: TANTANGAN REFRAMING KOGNITIF (CBT CHALLENGE)
  // ==========================================================================
  const [cbtDeck, setCbtDeck] = useState<CbtScenario[]>([]);
  const [cbtIndex, setCbtIndex] = useState<number>(0);
  const [cbtScore, setCbtScore] = useState<number>(0);
  const [cbtStreak, setCbtStreak] = useState<number>(0);
  const [cbtCorrectCount, setCbtCorrectCount] = useState<number>(0);
  const [cbtChosenOption, setCbtChosenOption] = useState<string | null>(null);
  const [cbtTimeLeft, setCbtTimeLeft] = useState<number>(25);
  const [cbtShowHint, setCbtShowHint] = useState<boolean>(false);
  const [cbtHintsLeft, setCbtHintsLeft] = useState<number>(2);
  const [cbtFiftyLeft, setCbtFiftyLeft] = useState<number>(2);
  const [cbtHiddenOptions, setCbtHiddenOptions] = useState<string[]>([]);
  const [cbtFinished, setCbtFinished] = useState<boolean>(false);

  const initCbtGame = useCallback(() => {
    const selected = shuffleArray(CBT_SCENARIOS).map((sc) => ({
      ...sc,
      options: shuffleArray(sc.options),
    }));
    setCbtDeck(selected);
    setCbtIndex(0);
    setCbtScore(0);
    setCbtStreak(0);
    setCbtCorrectCount(0);
    setCbtChosenOption(null);
    setCbtTimeLeft(25);
    setCbtShowHint(false);
    setCbtHintsLeft(2);
    setCbtFiftyLeft(2);
    setCbtHiddenOptions([]);
    setCbtFinished(false);
  }, []);

  useEffect(() => {
    initCbtGame();
  }, [initCbtGame]);

  useEffect(() => {
    if (
      activeGame !== "cbt" ||
      cbtFinished ||
      cbtChosenOption !== null ||
      cbtDeck.length === 0
    ) {
      return;
    }
    const timer = setInterval(() => {
      setCbtTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setCbtChosenOption("TIMEOUT");
          setCbtStreak(0);
          playSfx("wrong");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeGame, cbtFinished, cbtChosenOption, cbtDeck.length, playSfx]);

  const currentScenario = cbtDeck[cbtIndex];

  const handleSelectCbtOption = (optId: string, isCorrect: boolean) => {
    if (cbtChosenOption !== null || cbtFinished) return;
    setCbtChosenOption(optId);

    if (isCorrect) {
      const speedBonus = Math.max(5, cbtTimeLeft * 2);
      const streakBonus = cbtStreak * 15;
      const gained = 40 + speedBonus + streakBonus;
      playSfx(cbtStreak >= 1 ? "bonus" : "match");
      setCbtScore((s) => s + gained);
      setCbtStreak((st) => st + 1);
      setCbtCorrectCount((c) => c + 1);
    } else {
      playSfx("wrong");
      setCbtStreak(0);
    }
  };

  const handleNextCbtQuestion = () => {
    if (cbtIndex + 1 >= cbtDeck.length) {
      setCbtFinished(true);
      playSfx("win");
      updateStats((st) => ({
        ...st,
        totalXp: st.totalXp + Math.max(20, cbtScore),
        gamesCompleted: st.gamesCompleted + 1,
        cbtBest: Math.max(st.cbtBest, cbtScore),
      }));
      return;
    }
    setCbtIndex((i) => i + 1);
    setCbtChosenOption(null);
    setCbtTimeLeft(25);
    setCbtShowHint(false);
    setCbtHiddenOptions([]);
  };

  const handleUseFiftyFifty = () => {
    if (
      !currentScenario ||
      cbtFiftyLeft <= 0 ||
      cbtChosenOption !== null ||
      cbtHiddenOptions.length > 0
    ) {
      return;
    }
    const wrongIds = currentScenario.options
      .filter((o) => !o.isCorrect)
      .map((o) => o.id);
    const toHide = shuffleArray(wrongIds).slice(0, 2);
    setCbtHiddenOptions(toHide);
    setCbtFiftyLeft((n) => n - 1);
    playSfx("flip");
  };

  const handleUseDistortionHint = () => {
    if (cbtHintsLeft <= 0 || cbtShowHint || cbtChosenOption !== null) return;
    setCbtShowHint(true);
    setCbtHintsLeft((n) => n - 1);
    playSfx("flip");
  };

  // ==========================================================================
  // STATE & LOGIC — GAME 5: MEMORI HARMONI EMOSI
  // ==========================================================================
  const [memDifficulty, setMemDifficulty] = useState<MemoryDifficulty>("easy");
  const [memCards, setMemCards] = useState<MemoryCard[]>([]);
  const [memSelected, setMemSelected] = useState<number[]>([]);
  const [memMoves, setMemMoves] = useState<number>(0);
  const [memCombo, setMemCombo] = useState<number>(1);
  const [memScore, setMemScore] = useState<number>(0);
  const [memSeconds, setMemSeconds] = useState<number>(0);
  const [memPreviewing, setMemPreviewing] = useState<boolean>(false);
  const [memFinished, setMemFinished] = useState<boolean>(false);
  const [memLastAffirmation, setMemLastAffirmation] = useState<{
    emoji: string;
    title: string;
    text: string;
  } | null>(null);
  const memLockRef = useRef<boolean>(false);

  const pairCountByDiff: Record<MemoryDifficulty, number> = {
    easy: 6,
    medium: 8,
    hard: 10,
  };

  const initMemoryGame = useCallback((diff: MemoryDifficulty) => {
    const pairCount = pairCountByDiff[diff];
    const chosen = shuffleArray(EMOTION_POOL).slice(0, pairCount);
    const deck = shuffleArray(
      chosen.flatMap((item, idx) => [
        {
          uid: `${item.id}-a-${idx}`,
          pairId: item.id,
          emoji: item.emoji,
          title: item.title,
          affirmation: item.affirmation,
          bg: item.bg,
          isFlipped: true,
          isMatched: false,
        },
        {
          uid: `${item.id}-b-${idx}`,
          pairId: item.id,
          emoji: item.emoji,
          title: item.title,
          affirmation: item.affirmation,
          bg: item.bg,
          isFlipped: true,
          isMatched: false,
        },
      ])
    );

    memLockRef.current = true;
    setMemDifficulty(diff);
    setMemCards(deck);
    setMemSelected([]);
    setMemMoves(0);
    setMemCombo(1);
    setMemScore(0);
    setMemSeconds(0);
    setMemFinished(false);
    setMemLastAffirmation(null);
    setMemPreviewing(true);

    const previewMs = diff === "easy" ? 1600 : diff === "medium" ? 2000 : 2400;
    const t = setTimeout(() => {
      setMemCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })));
      setMemPreviewing(false);
      memLockRef.current = false;
    }, previewMs);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const cleanup = initMemoryGame("easy");
    return cleanup;
  }, [initMemoryGame]);

  useEffect(() => {
    if (activeGame !== "memory" || memPreviewing || memFinished) return;
    const timer = setInterval(() => {
      setMemSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeGame, memPreviewing, memFinished]);

  const handleCardTap = (index: number) => {
    if (memLockRef.current || memPreviewing || memFinished) return;
    const target = memCards[index];
    if (!target || target.isFlipped || target.isMatched) return;

    playSfx("flip");
    const nextCards = memCards.map((c, i) =>
      i === index ? { ...c, isFlipped: true } : c
    );
    const nextSelected = [...memSelected, index];
    setMemCards(nextCards);
    setMemSelected(nextSelected);

    if (nextSelected.length === 2) {
      memLockRef.current = true;
      const [firstIdx, secondIdx] = nextSelected;
      const firstCard = nextCards[firstIdx];
      const secondCard = nextCards[secondIdx];
      setMemMoves((m) => m + 1);

      if (firstCard.pairId === secondCard.pairId) {
        const gained = 25 * memCombo;
        const updatedScore = memScore + gained;
        const nextCombo = Math.min(6, memCombo + 1);

        setTimeout(() => {
          playSfx(memCombo >= 2 ? "bonus" : "match");
          setMemCards((prev) => {
            const updated = prev.map((c, i) =>
              i === firstIdx || i === secondIdx
                ? { ...c, isMatched: true, isFlipped: true }
                : c
            );
            const allDone = updated.every((c) => c.isMatched);
            if (allDone) {
              const timeBonus = Math.max(
                10,
                (pairCountByDiff[memDifficulty] * 12 - memSeconds) * 2
              );
              const finalTotal = updatedScore + timeBonus;
              setMemScore(finalTotal);
              setMemFinished(true);
              playSfx("win");
              updateStats((st) => ({
                ...st,
                totalXp: st.totalXp + finalTotal,
                gamesCompleted: st.gamesCompleted + 1,
                memoryBest: {
                  ...st.memoryBest,
                  [memDifficulty]: Math.max(
                    st.memoryBest[memDifficulty],
                    finalTotal
                  ),
                },
              }));
            }
            return updated;
          });
          setMemScore(updatedScore);
          setMemCombo(nextCombo);
          setMemLastAffirmation({
            emoji: firstCard.emoji,
            title: firstCard.title,
            text: firstCard.affirmation,
          });
          setMemSelected([]);
          memLockRef.current = false;
        }, 280);
      } else {
        setTimeout(() => {
          playSfx("wrong");
          setMemCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setMemCombo(1);
          setMemSelected([]);
          memLockRef.current = false;
        }, 720);
      }
    }
  };

  // ==========================================================================
  // STATE & LOGIC — GAME 6: TANGKAP FOKUS & TEPIS OVERTHINKING (GO / NO-GO)
  // ==========================================================================
  const [reflexRunning, setReflexRunning] = useState<boolean>(false);
  const [reflexEnded, setReflexEnded] = useState<boolean>(false);
  const [reflexTimeLeft, setReflexTimeLeft] = useState<number>(45);
  const [reflexScore, setReflexScore] = useState<number>(0);
  const [reflexCombo, setReflexCombo] = useState<number>(1);
  const [reflexLives, setReflexLives] = useState<number>(3);
  const [reflexOrbs, setReflexOrbs] = useState<ReflexOrb[]>([]);
  const [reflexFeedback, setReflexFeedback] = useState<string>(
    "Ketuk gelembung Hijau/Emas, dan biarkan awan Merah lewat tanpa disentuh!"
  );
  const orbIdRef = useRef<number>(1);
  const reflexScoreRef = useRef<number>(0);

  const startReflexGame = () => {
    orbIdRef.current = 1;
    reflexScoreRef.current = 0;
    setReflexOrbs([]);
    setReflexScore(0);
    setReflexCombo(1);
    setReflexLives(3);
    setReflexTimeLeft(45);
    setReflexEnded(false);
    setReflexFeedback(
      "Fokus aktif! Ketuk energi positif & abaikan awan overthinking."
    );
    setReflexRunning(true);
    playSfx("match");
  };

  const finishReflexGame = useCallback(
    (finalScore: number) => {
      setReflexRunning(false);
      setReflexEnded(true);
      setReflexOrbs([]);
      playSfx("win");
      updateStats((st) => ({
        ...st,
        totalXp: st.totalXp + Math.max(15, finalScore),
        gamesCompleted: st.gamesCompleted + 1,
        reflexBest: Math.max(st.reflexBest, finalScore),
      }));
    },
    [playSfx, updateStats]
  );

  useEffect(() => {
    if (!reflexRunning) return;
    const t = setInterval(() => {
      setReflexTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          finishReflexGame(reflexScoreRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [reflexRunning, finishReflexGame]);

  useEffect(() => {
    if (!reflexRunning) return;

    const wave =
      reflexTimeLeft > 32
        ? 1
        : reflexTimeLeft > 20
        ? 2
        : reflexTimeLeft > 10
        ? 3
        : 4;
    const spawnIntervalMs =
      wave === 1 ? 820 : wave === 2 ? 680 : wave === 3 ? 560 : 480;

    const spawner = setInterval(() => {
      setReflexOrbs((prev) => {
        if (prev.length >= 7) return prev;
        const roll = Math.random();
        let kind: ReflexOrb["kind"] = "positive";
        let picked =
          POSITIVE_ORBS[Math.floor(Math.random() * POSITIVE_ORBS.length)];
        let ttlMs = wave >= 3 ? 2300 : 2800;

        if (roll > 0.88) {
          kind = "golden";
          picked = { label: "Mindful +40", emoji: "⭐" };
          ttlMs = 1900;
        } else if (roll > 0.62) {
          kind = "negative";
          picked =
            NEGATIVE_ORBS[Math.floor(Math.random() * NEGATIVE_ORBS.length)];
          ttlMs = 2400;
        }

        const nextOrb: ReflexOrb = {
          id: orbIdRef.current++,
          kind,
          label: picked.label,
          emoji: picked.emoji,
          xPct: 10 + Math.random() * 74,
          yPct: 12 + Math.random() * 70,
          createdAt: Date.now(),
          ttlMs,
        };
        return [...prev, nextOrb];
      });
    }, spawnIntervalMs);

    const cleaner = setInterval(() => {
      const now = Date.now();
      setReflexOrbs((prev) => {
        let missedPositive = false;
        let avoidedNegativeCount = 0;
        const kept = prev.filter((orb) => {
          const expired = now - orb.createdAt >= orb.ttlMs;
          if (expired) {
            if (orb.kind === "positive") missedPositive = true;
            if (orb.kind === "negative") avoidedNegativeCount += 1;
            return false;
          }
          return true;
        });

        if (missedPositive) {
          setReflexCombo(1);
        }
        if (avoidedNegativeCount > 0) {
          const detachBonus = avoidedNegativeCount * 5;
          setReflexScore((sc) => {
            const next = sc + detachBonus;
            reflexScoreRef.current = next;
            return next;
          });
        }
        return kept;
      });
    }, 150);

    return () => {
      clearInterval(spawner);
      clearInterval(cleaner);
    };
  }, [reflexRunning, reflexTimeLeft]);

  const handleOrbTap = (orb: ReflexOrb) => {
    if (!reflexRunning) return;
    setReflexOrbs((prev) => prev.filter((o) => o.id !== orb.id));

    if (orb.kind === "negative") {
      playSfx("wrong");
      setReflexCombo(1);
      setReflexFeedback(
        `Awan "${orb.label}" tersentuh! Ingat: biarkan pikiran negatif lewat tanpa bereaksi.`
      );
      setReflexLives((lv) => {
        const nextLv = lv - 1;
        if (nextLv <= 0) {
          finishReflexGame(reflexScoreRef.current);
          return 0;
        }
        return nextLv;
      });
      return;
    }

    if (orb.kind === "golden") {
      playSfx("bonus");
      const pts = 40 + reflexCombo * 5;
      setReflexScore((sc) => {
        const next = sc + pts;
        reflexScoreRef.current = next;
        return next;
      });
      setReflexCombo((c) => Math.min(8, c + 1));
      setReflexLives((lv) => Math.min(3, lv + 1));
      setReflexFeedback(
        `✨ Bintang Mindful tertangkap! +${pts} Poin & Fokus pulih!`
      );
      return;
    }

    playSfx("match");
    const pts = 12 * reflexCombo;
    setReflexScore((sc) => {
      const next = sc + pts;
      reflexScoreRef.current = next;
      return next;
    });
    setReflexCombo((c) => Math.min(8, c + 1));
    setReflexFeedback(
      `${orb.emoji} ${orb.label} diserap (+${pts} Poin • Combo x${Math.min(
        8,
        reflexCombo + 1
      )})`
    );
  };

  const rank = getPlayerRank(stats.totalXp);
  const progressPct = Math.min(
    100,
    Math.round((stats.totalXp / rank.nextXp) * 100)
  );

  const currentWave =
    reflexTimeLeft > 32
      ? 1
      : reflexTimeLeft > 20
      ? 2
      : reflexTimeLeft > 10
      ? 3
      : 4;

  const gameCatalog: {
    key: ActiveGameTab;
    title: string;
    subtitle: string;
    badge: string;
    best: number;
    icon: React.ElementType;
    iconBg: string;
    activeBorder: string;
  }[] = [
    {
      key: "micro",
      title: "1. Lab Mikro-Konseling",
      subtitle: "Rakit Respons Empatik 3-Tahap (Rogers & Ivey)",
      badge: "EDUKASI BK",
      best: stats.microBest,
      icon: MessageSquareHeart,
      iconBg: "bg-[#D6EFE6] text-[#2E7D67]",
      activeBorder: "border-[#2E7D67]",
    },
    {
      key: "sorter",
      title: "2. Sortir Teori BKPI & PIAUD",
      subtitle: "Klasifikasi Piaget, Vygotsky, Asas & Mazhab BK",
      badge: "KURIKULUM",
      best: stats.sorterBest,
      icon: BookOpenCheck,
      iconBg: "bg-[#E9DDF8] text-[#6B3FA0]",
      activeBorder: "border-[#7A4EB3]",
    },
    {
      key: "emotion",
      title: "3. Detektif Literasi Emosi",
      subtitle: "Granularitas Emosi & Strategi Regulasi Ilmiah",
      badge: "PSIKOEDUKASI",
      best: stats.emotionBest,
      icon: Compass,
      iconBg: "bg-[#DCEBFA] text-[#356CA8]",
      activeBorder: "border-[#3F78B5]",
    },
    {
      key: "cbt",
      title: "4. Tantangan Reframing CBT",
      subtitle: "Ubah Distorsi Kognitif & Pikiran Otomatis Negatif",
      badge: "TERAPI KOGNITIF",
      best: stats.cbtBest,
      icon: Lightbulb,
      iconBg: "bg-[#FBE8C2] text-[#C5861E]",
      activeBorder: "border-[#C5861E]",
    },
    {
      key: "memory",
      title: "5. Memori Harmoni Emosi",
      subtitle: "Latihan Working Memory & Kartu Afirmasi Positif",
      badge: "MEMORI KERJA",
      best: Math.max(
        stats.memoryBest.easy,
        stats.memoryBest.medium,
        stats.memoryBest.hard
      ),
      icon: Brain,
      iconBg: "bg-[#D9F2E6] text-[#267358]",
      activeBorder: "border-[#559A87]",
    },
    {
      key: "reflex",
      title: "6. Tangkap Fokus Positif",
      subtitle: "Kontrol Inhibisi Go/No-Go & Detachment",
      badge: "ATENSI",
      best: stats.reflexBest,
      icon: Zap,
      iconBg: "bg-[#FAD9CE] text-[#D9603B]",
      activeBorder: "border-[#EE7854]",
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ====================================================================
          TOP HERO & KOMPETENSI AKADEMIK-PSIKOLOGIS PEMAIN HUD
         ==================================================================== */}
      <div className="clay-hero-peach rounded-[26px] sm:rounded-[30px] p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold text-[#2E7D67] shadow-sm">
                <GraduationCap className="h-3.5 w-3.5 text-[#EE7854]" />
                6 Game Edukasi Psikologi, BKPI & PIAUD
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold shadow-sm ${rank.color}`}
              >
                <span>{rank.badge}</span>
                <span>{rank.title}</span>
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-extrabold text-[#2D2A26]">
              Laboratorium Game Edukasi & Regulasi Emosi NARASA{" "}
              {studentName ? `• ${studentName.split(",")[0]}` : ""}
            </h2>
            <p className="text-xs sm:text-[13px] text-[#5F544E] max-w-2xl leading-relaxed">
              Pelajari keterampilan komunikasi konseling (Rogers & Ivey), teori
              perkembangan anak (Piaget & Vygotsky), asas kode etik BK,
              literasi emosi ilmiah, hingga latihan fokus dan memori kerja.
            </p>
          </div>

          {/* Player XP & Sound Control Card */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 rounded-[22px] bg-[#FCFBF8]/95 border-2 border-white p-3.5 shadow-sm shrink-0">
            <div className="min-w-[155px]">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-[#2D2A26]">
                <span className="flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5 text-[#EAA92A]" />
                  {stats.totalXp} XP
                </span>
                <span className="text-[#6E6A63]">
                  {stats.gamesCompleted} Sesi
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-[#ECE8DF] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#559A87] to-[#EE7854] transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] font-semibold text-[#7A746B]">
                Level Berikutnya: {rank.nextXp} XP
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition ${
                soundEnabled
                  ? "bg-[#E2F1EC] border-white text-[#2E7D67]"
                  : "bg-[#F3F0E8] border-white text-[#8C857B]"
              }`}
              title={soundEnabled ? "Matikan Efek Suara" : "Nyalakan Efek Suara"}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* 6 GAME MODE SELECTOR GRID (2 cols on Phone, 3 cols on Desktop) */}
        <div className="mt-4 sm:mt-5 grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {gameCatalog.map((g) => {
            const Icon = g.icon;
            const isActive = activeGame === g.key;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => setActiveGame(g.key)}
                className={`rounded-[20px] p-3 sm:p-3.5 text-left transition-all border-2 ${
                  isActive
                    ? `bg-[#FCFBF8] ${g.activeBorder} shadow-md scale-[1.01]`
                    : "bg-white/70 border-white hover:bg-white/95"
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl ${g.iconBg}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="rounded-full bg-[#F3F0E8] px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold text-[#5C564F] truncate">
                    {g.best > 0 ? `Rekor ${g.best}` : g.badge}
                  </span>
                </div>
                <div className="mt-2 text-[11.5px] sm:text-sm font-extrabold text-[#2D2A26] leading-snug">
                  {g.title}
                </div>
                <div className="mt-0.5 text-[10px] sm:text-[11px] text-[#6E6A63] line-clamp-2 leading-tight">
                  {g.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          GAME 1 VIEW (EDUKASI): LAB MIKRO-KONSELING (3-STEP RESPONSE BUILDER)
         ==================================================================== */}
      {activeGame === "micro" && (
        <div className="clay-card-white rounded-[26px] sm:rounded-[30px] p-4 sm:p-6 space-y-5">
          {!mcFinished && currentMc ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#ECE8DF] pb-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-[#2D2A26] px-3.5 py-1.5 font-extrabold text-white">
                    Simulasi {mcIndex + 1} / {mcCases.length}
                  </span>
                  <span className="rounded-full bg-[#E2F1EC] px-3 py-1.5 font-extrabold text-[#2E7D67]">
                    Skor Empati: {mcScore} XP
                  </span>
                  <span className="rounded-full bg-[#FDF1CE] px-3 py-1.5 font-extrabold text-[#8A6214]">
                    {currentMc.prodiContext}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={initMicroGame}
                  className="inline-flex items-center gap-1 rounded-full bg-[#F3F0E8] hover:bg-[#E6E1D6] px-3 py-1.5 text-xs font-extrabold text-[#2D2A26]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Ulang Simulasi
                </button>
              </div>

              {/* Client Bubble */}
              <div className="rounded-[24px] bg-gradient-to-br from-[#FCF5EE] to-[#F4EFE6] border border-white p-4 sm:p-5 space-y-2.5">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#C8522E]">
                  🗣️ Curhatan Konseli ({currentMc.clientLabel}):
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-[#2D2A26] leading-relaxed italic">
                  {currentMc.clientStatement}
                </p>
                <div className="text-[11px] text-[#5E6A64] bg-white/80 rounded-xl px-3 py-2">
                  <strong>Panduan Teori:</strong> {currentMc.theoryReference}
                </div>
              </div>

              {/* Assembled Counselor Response Preview */}
              <div className="rounded-[22px] bg-[#E6F4EE] border border-[#BFE0D4] p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#215A49]">
                  <span>💬 Draf Balasan Konselor yang Sedang Kamu Rakit:</span>
                  <span>Tahap {Math.min(3, mcStep)} / 3</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  {(
                    [
                      {
                        label: "1. Refleksi Perasaan",
                        pick: mcPicks.step1,
                        active: mcStep === 1,
                      },
                      {
                        label: "2. Parafrase Isi",
                        pick: mcPicks.step2,
                        active: mcStep === 2,
                      },
                      {
                        label: "3. Pertanyaan Terbuka",
                        pick: mcPicks.step3,
                        active: mcStep === 3,
                      },
                    ] as const
                  ).map((slot) => (
                    <div
                      key={slot.label}
                      className={`rounded-2xl p-3 border ${
                        slot.pick
                          ? slot.pick.isBest
                            ? "bg-white border-[#559A87] text-[#1D5444]"
                            : "bg-[#FCE8E4] border-rose-300 text-[#7A271A]"
                          : slot.active
                          ? "bg-white/90 border-dashed border-[#2E7D67] text-[#2E7D67]"
                          : "bg-white/45 border-white/70 text-[#8C857B]"
                      }`}
                    >
                      <div className="text-[10px] font-extrabold uppercase tracking-wider">
                        {slot.label}
                      </div>
                      <div className="mt-1 text-[11.5px] font-semibold leading-snug">
                        {slot.pick
                          ? slot.pick.text
                          : slot.active
                          ? "Pilih kalimat terbaik di bawah..."
                          : "Menunggu tahap sebelumnya"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Choices or Review */}
              {mcStep < 4 ? (
                <div className="space-y-2.5">
                  <div className="text-xs sm:text-sm font-extrabold text-[#2D2A26]">
                    {mcStep === 1
                      ? currentMc.step1Reflection.prompt
                      : mcStep === 2
                      ? currentMc.step2Paraphrase.prompt
                      : currentMc.step3OpenQuestion.prompt}
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {(mcStep === 1
                      ? currentMc.step1Reflection.choices
                      : mcStep === 2
                      ? currentMc.step2Paraphrase.choices
                      : currentMc.step3OpenQuestion.choices
                    ).map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => handlePickMicroStep(ch)}
                        className="w-full rounded-[20px] border-2 border-[#E6E1D6] bg-[#F9F7F2] hover:bg-[#EFECE3] hover:border-[#559A87] p-3.5 sm:p-4 text-left text-xs sm:text-[13px] font-bold text-[#2D2A26] transition active:scale-[0.99]"
                      >
                        {ch.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] bg-[#FCFBF7] border-2 border-[#C6E4D8] p-4 sm:p-5 space-y-3">
                  <div className="text-sm font-extrabold text-[#215A49]">
                    📋 Evaluasi Akademik Keterampilan Mikro-Konseling:
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { title: "Refleksi Perasaan", data: mcPicks.step1 },
                      { title: "Parafrase Isi", data: mcPicks.step2 },
                      { title: "Pertanyaan Terbuka", data: mcPicks.step3 },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className={`rounded-xl p-3 flex items-start gap-2.5 ${
                          item.data?.isBest
                            ? "bg-[#E2F2EC] text-[#1D5444]"
                            : "bg-[#FCE8E4] text-[#7A271A]"
                        }`}
                      >
                        {item.data?.isBest ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#2E7D67]" />
                        ) : (
                          <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                        )}
                        <div>
                          <strong>{item.title}:</strong> {item.data?.note}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextMicroCase}
                      className="clay-btn-coral inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-extrabold text-white"
                    >
                      <span>
                        {mcIndex + 1 >= mcCases.length
                          ? "Selesaikan Lab Konseling"
                          : "Lanjut Konseli Berikutnya"}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[26px] bg-gradient-to-br from-[#E2F2EC] via-[#FCFBF7] to-[#FCE8DF] border-2 border-white p-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#2E7D67] text-white shadow-md">
                <MessageSquareHeart className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-extrabold text-[#2D2A26]">
                Praktikum Lab Mikro-Konseling Selesai!
              </h3>
              <p className="text-xs sm:text-sm text-[#5C564F]">
                Skor Kompetensi Konseling: <strong>{mcScore} XP</strong> • Rekor
                Terbaik: <strong>{stats.microBest} XP</strong>
              </p>
              <p className="max-w-lg mx-auto text-xs text-[#5E6A64] leading-relaxed">
                Kamu telah berlatih merangkai <strong>Refleksi Perasaan</strong>,{" "}
                <strong>Parafrase Isi</strong>, dan{" "}
                <strong>Pertanyaan Terbuka</strong> sesuai standar komunikasi
                terapeutik Bimbingan & Konseling.
              </p>
              <button
                type="button"
                onClick={initMicroGame}
                className="clay-btn-coral inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-extrabold text-white shadow-md"
              >
                <RotateCcw className="h-4 w-4" />
                Praktik Lagi dengan Urutan Acak
              </button>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          GAME 2 VIEW (EDUKASI): SORTIR CEPAT KURIKULUM BKPI & PIAUD
         ==================================================================== */}
      {activeGame === "sorter" && (
        <div className="clay-card-white rounded-[26px] sm:rounded-[30px] p-4 sm:p-6 space-y-5">
          {/* Curriculum Track Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#ECE8DF] pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { key: "piaud", label: "Perkembangan Anak (PIAUD)" },
                  { key: "azas_bk", label: "Asas & Etika BK (BKPI)" },
                  { key: "teori_konseling", label: "Mazhab Psikoterapi" },
                ] as const
              ).map((tr) => (
                <button
                  key={tr.key}
                  type="button"
                  onClick={() => initSorterGame(tr.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
                    sorterTrack === tr.key
                      ? "bg-[#7A4EB3] text-white shadow-sm"
                      : "bg-[#F3F0E8] text-[#5C564F] hover:bg-[#E6E1D6]"
                  }`}
                >
                  {tr.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-[#E9DDF8] px-3 py-1.5 font-extrabold text-[#5E3594]">
                Skor: {sorterScore} XP
              </span>
              <span className="rounded-full bg-[#FAD9CE] px-3 py-1.5 font-extrabold text-[#C8522E]">
                Combo: {sorterStreak}🔥
              </span>
              {!sorterFinished && sorterDeck.length > 0 && (
                <span className="rounded-full bg-[#2D2A26] px-3 py-1.5 font-extrabold text-white">
                  Kartu {sorterIdx + 1}/{sorterDeck.length}
                </span>
              )}
            </div>
          </div>

          {!sorterFinished && currentSortCard ? (
            <>
              {/* Flashcard Case */}
              <div className="rounded-[26px] bg-gradient-to-br from-[#F7F2FC] via-[#FCFBF8] to-[#EEF6F2] border-2 border-white p-5 sm:p-7 text-center shadow-md space-y-2.5">
                <span className="inline-block rounded-full bg-white px-3 py-1 text-[10.5px] font-extrabold text-[#6B3FA0] shadow-xs">
                  📚 {currentSortCurriculum.title}
                </span>
                <p className="text-sm sm:text-base font-extrabold text-[#2D2A26] max-w-2xl mx-auto leading-relaxed">
                  &ldquo;{currentSortCard.statement}&rdquo;
                </p>
                <p className="text-[11px] font-semibold text-[#7A746B]">
                  Ketuk kategori konsep ilmiah yang paling sesuai di bawah ini:
                </p>
              </div>

              {/* 4 Classification Buckets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentSortCurriculum.buckets.map((b) => {
                  const answered = sorterPickedBucket !== null;
                  const isCorrectBucket =
                    currentSortCard.correctBucket === b.id;
                  const isSelected = sorterPickedBucket === b.id;

                  let cardClass = `${b.color} hover:scale-[1.01]`;
                  if (answered) {
                    if (isCorrectBucket) {
                      cardClass =
                        "bg-[#D9F2E6] border-[#2E7D67] text-[#154636] ring-2 ring-[#2E7D67]";
                    } else if (isSelected) {
                      cardClass =
                        "bg-[#FCE6E2] border-rose-500 text-[#7D2317]";
                    } else {
                      cardClass =
                        "bg-[#F5F3EE] border-[#E5E0D5] text-[#969086] opacity-65";
                    }
                  }

                  return (
                    <button
                      key={b.id}
                      type="button"
                      disabled={answered}
                      onClick={() => handleSortIntoBucket(b.id)}
                      className={`rounded-[22px] border-2 p-4 text-left font-extrabold text-xs sm:text-sm transition flex items-center justify-between gap-2 shadow-xs ${cardClass}`}
                    >
                      <span>{b.label}</span>
                      {answered && isCorrectBucket && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2E7D67]" />
                      )}
                      {answered && isSelected && !isCorrectBucket && (
                        <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Scientific Concept Explanation */}
              {sorterPickedBucket !== null && (
                <div className="rounded-[22px] bg-[#EFE7FA] border border-[#D5C1F0] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-extrabold text-[#4C2889]">
                      📖 Penjelasan Teori & Referensi Akademik:
                    </div>
                    <p className="text-xs text-[#3D2569] leading-relaxed">
                      {currentSortCard.explanation}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextSorterCard}
                    className="clay-btn-coral shrink-0 rounded-full px-5 py-2.5 text-xs font-extrabold text-white"
                  >
                    {sorterIdx + 1 >= sorterDeck.length
                      ? "Lihat Nilai Akhir →"
                      : "Kartu Berikutnya →"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[26px] bg-gradient-to-br from-[#EFE7FA] via-[#FCFBF7] to-[#E2F2EC] border-2 border-white p-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#7A4EB3] text-white shadow-md">
                <BookOpenCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-extrabold text-[#2D2A26]">
                Modul {currentSortCurriculum.title} Tuntas!
              </h3>
              <p className="text-xs sm:text-sm text-[#5C564F]">
                Tepat:{" "}
                <strong>
                  {sorterCorrectCount} / {sorterDeck.length} Konsep
                </strong>{" "}
                • Skor: <strong>{sorterScore} XP</strong> • Rekor Terbaik:{" "}
                <strong>{stats.sorterBest} XP</strong>
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => initSorterGame(sorterTrack)}
                  className="clay-btn-coral rounded-full px-5 py-2.5 text-xs font-extrabold text-white"
                >
                  Ulangi Topik Ini
                </button>
                <button
                  type="button"
                  onClick={() =>
                    initSorterGame(
                      sorterTrack === "piaud"
                        ? "azas_bk"
                        : sorterTrack === "azas_bk"
                        ? "teori_konseling"
                        : "piaud"
                    )
                  }
                  className="rounded-full bg-[#2E7D67] px-5 py-2.5 text-xs font-extrabold text-white"
                >
                  Coba Topik Kurikulum Lainnya →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          GAME 3 VIEW (EDUKASI): DETEKTIF LITERASI EMOSI & REGULASI ILMIAH
         ==================================================================== */}
      {activeGame === "emotion" && (
        <div className="clay-card-white rounded-[26px] sm:rounded-[30px] p-4 sm:p-6 space-y-5">
          {!edFinished && currentEd ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECE8DF] pb-4 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#356CA8] px-3.5 py-1.5 font-extrabold text-white">
                    Jurnal {edIdx + 1} / {edDeck.length}
                  </span>
                  <span className="rounded-full bg-[#DCEBFA] px-3 py-1.5 font-extrabold text-[#28568A]">
                    Skor Literasi: {edScore} XP
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#6E6A63]">
                  Teori Granularitas Emosi • Lisa Feldman Barrett & Plutchik
                </span>
              </div>

              {/* Journal Case */}
              <div className="rounded-[24px] bg-gradient-to-br from-[#EDF5FC] to-[#FCFBF7] border border-white p-4 sm:p-5 space-y-2.5 shadow-xs">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#356CA8]">
                  🔍 Analisis Jurnal Pengalaman Batin:
                </div>
                <p className="text-xs sm:text-sm font-bold text-[#2D2A26] leading-relaxed">
                  {currentEd.vignette}
                </p>
                <div className="rounded-xl bg-white/90 px-3.5 py-2 text-xs font-semibold text-[#4E5A54]">
                  🩺 {currentEd.bodyCue}
                </div>
              </div>

              {/* Phase 1: Identify Granular Emotion */}
              <div className="space-y-2.5">
                <div className="text-xs sm:text-sm font-extrabold text-[#2D2A26]">
                  Langkah 1 • Namai emosi spesifiknya secara presisi (Emotional
                  Granularity):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentEd.emotionOptions.map((emo) => {
                    const locked = edPhase !== "emotion";
                    const isRight = emo === currentEd.correctEmotion;
                    const isPicked = edPickedEmotion === emo;

                    let cls =
                      "bg-[#F8F6F0] hover:bg-[#E8F1FA] border-[#E6E1D6] text-[#2D2A26]";
                    if (locked) {
                      if (isRight) {
                        cls =
                          "bg-[#E1F3EC] border-[#2E7D67] text-[#1B4D3E]";
                      } else if (isPicked) {
                        cls = "bg-[#FCE6E2] border-rose-400 text-[#7D2317]";
                      } else {
                        cls = "bg-[#F8F6F0]/60 border-[#ECE8DF] text-[#969086]";
                      }
                    }

                    return (
                      <button
                        key={emo}
                        type="button"
                        disabled={locked}
                        onClick={() => handlePickEmotionLabel(emo)}
                        className={`rounded-[18px] border-2 p-3.5 text-left text-xs font-extrabold transition flex items-center justify-between gap-2 ${cls}`}
                      >
                        <span>{emo}</span>
                        {locked && isRight && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2E7D67]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phase 2: Match Evidence-Based Regulation Strategy */}
              {edPhase !== "emotion" && (
                <div className="space-y-2.5 pt-2 border-t border-[#ECE8DF]">
                  <div className="text-xs sm:text-sm font-extrabold text-[#2D2A26]">
                    Langkah 2 • Pilih strategi regulasi berbasis bukti ilmiah
                    untuk emosi <em>{currentEd.correctEmotion}</em>:
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentEd.strategyOptions.map((st) => {
                      const locked = edPhase === "review";
                      const isRight = st.id === currentEd.correctStrategy;
                      const isPicked = edPickedStrategy === st.id;

                      let cls =
                        "bg-[#F8F6F0] hover:bg-[#EFECE3] border-[#E6E1D6] text-[#2D2A26]";
                      if (locked) {
                        if (isRight) {
                          cls =
                            "bg-[#E1F3EC] border-[#2E7D67] text-[#1B4D3E]";
                        } else if (isPicked) {
                          cls = "bg-[#FCE6E2] border-rose-400 text-[#7D2317]";
                        } else {
                          cls =
                            "bg-[#F8F6F0]/60 border-[#ECE8DF] text-[#969086]";
                        }
                      }

                      return (
                        <button
                          key={st.id}
                          type="button"
                          disabled={locked}
                          onClick={() => handlePickEmotionStrategy(st.id)}
                          className={`rounded-[18px] border-2 p-3.5 text-left text-xs font-bold leading-relaxed transition flex items-center justify-between gap-2 ${cls}`}
                        >
                          <span>{st.text}</span>
                          {locked && isRight && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2E7D67]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Phase 3: Scientific Takeaway */}
              {edPhase === "review" && (
                <div className="rounded-[22px] bg-[#E3EFFB] border border-[#BBD6F2] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-extrabold text-[#234E80]">
                      🧠 Wawasan Psikoedukasi & Neurosains Emosi:
                    </div>
                    <p className="text-xs text-[#2B4C73] leading-relaxed">
                      {currentEd.scientificInsight}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextEmotionCase}
                    className="clay-btn-coral shrink-0 rounded-full px-5 py-2.5 text-xs font-extrabold text-white"
                  >
                    {edIdx + 1 >= edDeck.length
                      ? "Selesaikan Detektif Emosi →"
                      : "Jurnal Berikutnya →"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[26px] bg-gradient-to-br from-[#DCEBFA] via-[#FCFBF7] to-[#E2F2EC] border-2 border-white p-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#356CA8] text-white shadow-md">
                <Compass className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-extrabold text-[#2D2A26]">
                Misi Detektif Literasi Emosi Selesai!
              </h3>
              <p className="text-xs sm:text-sm text-[#5C564F]">
                Skor Akhir: <strong>{edScore} XP</strong> • Rekor Terbaik:{" "}
                <strong>{stats.emotionBest} XP</strong>
              </p>
              <p className="max-w-lg mx-auto text-xs text-[#5E6A64] leading-relaxed">
                Prinsip psikologi <em>&ldquo;Name it to tame it&rdquo;</em>{" "}
                (Dr. Dan Siegel): menamai emosi secara spesifik terbukti
                menenangkan reaktivitas sistem limbik dan membantu memilih
                respons sehat.
              </p>
              <button
                type="button"
                onClick={initEmotionGame}
                className="clay-btn-coral inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-extrabold text-white shadow-md"
              >
                <RotateCcw className="h-4 w-4" />
                Mainkan Ulang Jurnal Acak
              </button>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          GAME 4 VIEW: TANTANGAN REFRAMING KOGNITIF (CBT CHALLENGE)
         ==================================================================== */}
      {activeGame === "cbt" && (
        <div className="clay-card-white rounded-[26px] sm:rounded-[30px] p-4 sm:p-6 space-y-5">
          {!cbtFinished && currentScenario ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#ECE8DF] pb-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-[#2D2A26] px-3.5 py-1.5 font-extrabold text-white">
                    Kasus {cbtIndex + 1} / {cbtDeck.length}
                  </span>
                  <span className="rounded-full bg-[#E2F1EC] px-3 py-1.5 font-extrabold text-[#2E7D67]">
                    Skor: {cbtScore} XP
                  </span>
                  <span className="rounded-full bg-[#FAD9CE] px-3 py-1.5 font-extrabold text-[#C8522E]">
                    Streak: {cbtStreak}🔥
                  </span>
                  <span
                    className={`rounded-full px-3 py-1.5 font-extrabold inline-flex items-center gap-1 ${
                      cbtTimeLeft <= 7
                        ? "bg-rose-100 text-rose-700"
                        : "bg-[#F3F0E8] text-[#5C564F]"
                    }`}
                  >
                    <Timer className="h-3.5 w-3.5" />
                    {cbtTimeLeft}d
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseDistortionHint}
                    disabled={
                      cbtHintsLeft <= 0 ||
                      cbtShowHint ||
                      cbtChosenOption !== null
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#E9DDF8] hover:bg-[#DECcf4] disabled:opacity-45 px-3.5 py-1.5 text-xs font-extrabold text-[#5E3594] transition"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    Cek Distorsi ({cbtHintsLeft})
                  </button>
                  <button
                    type="button"
                    onClick={handleUseFiftyFifty}
                    disabled={
                      cbtFiftyLeft <= 0 ||
                      cbtChosenOption !== null ||
                      cbtHiddenOptions.length > 0
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#FBE8C2] hover:bg-[#F7DDA8] disabled:opacity-45 px-3.5 py-1.5 text-xs font-extrabold text-[#8F5F10] transition"
                  >
                    <Scissors className="h-3.5 w-3.5" />
                    50:50 ({cbtFiftyLeft})
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] bg-gradient-to-br from-[#FCF5EE] to-[#F4EFE6] border border-white p-4 sm:p-5 space-y-3 shadow-sm">
                <span className="inline-block rounded-full bg-white px-3 py-0.5 text-[11px] font-extrabold text-[#2E7D67] shadow-xs">
                  Konteks: {currentScenario.tag}
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#2D2A26] leading-relaxed">
                  {currentScenario.situation}
                </p>
                <div className="rounded-2xl bg-[#FCE6E2]/90 border border-rose-200/70 p-3.5">
                  <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-rose-700">
                    Pikiran Otomatis Negatif yang Muncul:
                  </div>
                  <p className="mt-1 text-xs sm:text-[13.5px] font-extrabold italic text-[#6E271B]">
                    {currentScenario.automaticThought}
                  </p>
                </div>

                {(cbtShowHint || cbtChosenOption !== null) && (
                  <div className="rounded-2xl bg-[#EFE7FA] border border-[#DAC8F3] p-3 text-xs text-[#4C2B7A]">
                    <strong>
                      Pola Distorsi Kognitif ({currentScenario.distortionName}):
                    </strong>{" "}
                    {currentScenario.distortionHint}
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-extrabold text-[#4E5A54]">
                  Pilih respons Cognitive Reframing / Konseling yang paling
                  sehat & kompeten:
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {currentScenario.options.map((opt) => {
                    if (cbtHiddenOptions.includes(opt.id)) {
                      return null;
                    }
                    const isAnswered = cbtChosenOption !== null;
                    const isSelected = cbtChosenOption === opt.id;

                    let btnStyle =
                      "bg-[#F8F6F0] hover:bg-[#EFECE3] border-[#E6E1D6] text-[#2D2A26]";
                    if (isAnswered) {
                      if (opt.isCorrect) {
                        btnStyle =
                          "bg-[#E1F3EC] border-[#559A87] text-[#1B4D3E]";
                      } else if (isSelected) {
                        btnStyle =
                          "bg-[#FCE6E2] border-rose-400 text-[#7D2317]";
                      } else {
                        btnStyle =
                          "bg-[#F8F6F0]/60 border-[#ECE8DF] text-[#8C857B]";
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isAnswered}
                        onClick={() =>
                          handleSelectCbtOption(opt.id, opt.isCorrect)
                        }
                        className={`w-full rounded-[20px] border-2 p-3.5 sm:p-4 text-left transition flex items-start justify-between gap-3 ${btnStyle}`}
                      >
                        <span className="text-xs sm:text-[13px] font-bold leading-relaxed">
                          {opt.text}
                        </span>
                        {isAnswered && opt.isCorrect && (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2E7D67]" />
                        )}
                        {isAnswered && isSelected && !opt.isCorrect && (
                          <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {cbtChosenOption !== null && (
                <div className="rounded-[22px] bg-[#E5F3EE] border border-[#BFE0D4] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-extrabold text-[#215A49] flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      {cbtChosenOption === "TIMEOUT"
                        ? "Waktu Habis! Berikut Ulasan Konselingnya:"
                        : "Ulasan Kompetensi Psikologis BK:"}
                    </div>
                    <p className="text-xs text-[#335248] leading-relaxed">
                      {
                        (
                          currentScenario.options.find(
                            (o) => o.id === cbtChosenOption
                          ) || currentScenario.options.find((o) => o.isCorrect)
                        )?.feedback
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextCbtQuestion}
                    className="clay-btn-coral shrink-0 rounded-full px-5 py-2.5 text-xs font-extrabold text-white active:scale-95"
                  >
                    {cbtIndex + 1 >= cbtDeck.length
                      ? "Lihat Hasil Akhir →"
                      : "Kasus Berikutnya →"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[26px] bg-gradient-to-br from-[#E2F2EC] via-[#FCFBF7] to-[#FCE8DF] border-2 border-white p-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#2E7D67] text-white shadow-md">
                <Trophy className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-extrabold text-[#2D2A26]">
                Evaluasi Tantangan Reframing CBT Selesai!
              </h3>
              <p className="text-xs sm:text-sm text-[#5C564F]">
                Jawaban Tepat:{" "}
                <strong>
                  {cbtCorrectCount} dari {cbtDeck.length} Kasus
                </strong>{" "}
                • Total Skor: <strong>{cbtScore} XP</strong> • Rekor Terbaik:{" "}
                <strong>{stats.cbtBest} XP</strong>
              </p>
              <button
                type="button"
                onClick={initCbtGame}
                className="clay-btn-coral inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-extrabold text-white shadow-md"
              >
                <RotateCcw className="h-4 w-4" />
                Mainkan Paket Kasus Baru
              </button>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          GAME 5 VIEW: MEMORI HARMONI EMOSI
         ==================================================================== */}
      {activeGame === "memory" && (
        <div className="clay-card-white rounded-[26px] sm:rounded-[30px] p-4 sm:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#ECE8DF] pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { key: "easy", label: "Santai (12 Kartu)" },
                  { key: "medium", label: "Fokus (16 Kartu)" },
                  { key: "hard", label: "Master BK (20 Kartu)" },
                ] as const
              ).map((lv) => (
                <button
                  key={lv.key}
                  type="button"
                  onClick={() => initMemoryGame(lv.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
                    memDifficulty === lv.key
                      ? "bg-[#2E7D67] text-white shadow-sm"
                      : "bg-[#F3F0E8] text-[#5C564F] hover:bg-[#E7E2D6]"
                  }`}
                >
                  {lv.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="rounded-full bg-[#E2F1EC] px-3 py-1.5 font-extrabold text-[#2E7D67]">
                Skor: {memScore}
              </span>
              <span className="rounded-full bg-[#FAD9CE] px-3 py-1.5 font-extrabold text-[#C8522E]">
                Combo x{memCombo}
              </span>
              <span className="rounded-full bg-[#F3F0E8] px-3 py-1.5 font-bold text-[#5C564F]">
                Langkah: {memMoves}
              </span>
              <span className="rounded-full bg-[#F3F0E8] px-3 py-1.5 font-bold text-[#5C564F] inline-flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" />
                {memSeconds}d
              </span>
              <button
                type="button"
                onClick={() => initMemoryGame(memDifficulty)}
                className="inline-flex items-center gap-1 rounded-full bg-[#2D2A26] px-3.5 py-1.5 font-extrabold text-white hover:bg-[#433F3A] active:scale-95 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Acak Ulang
              </button>
            </div>
          </div>

          {memPreviewing && (
            <div className="rounded-2xl bg-[#FDF3D7] border border-[#F5DC9B] px-4 py-2.5 text-center text-xs font-extrabold text-[#8A6214]">
              👀 Hafalkan posisi pasangan simbol emosi sekarang... Permainan
              dimulai sesaat lagi!
            </div>
          )}

          <div
            className={`grid gap-2.5 sm:gap-3.5 ${
              memDifficulty === "hard"
                ? "grid-cols-4 sm:grid-cols-5"
                : "grid-cols-4"
            }`}
          >
            {memCards.map((card, idx) => {
              const revealed = card.isFlipped || card.isMatched;
              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => handleCardTap(idx)}
                  disabled={revealed || memPreviewing}
                  className={`relative aspect-square sm:aspect-[4/3] rounded-[18px] sm:rounded-[22px] p-2 flex flex-col items-center justify-center text-center transition-all duration-200 select-none ${
                    card.isMatched
                      ? `bg-gradient-to-br ${card.bg} border-2 border-[#559A87] shadow-inner scale-[0.98]`
                      : revealed
                      ? `bg-gradient-to-br ${card.bg} border-2 border-white shadow-md scale-[1.02]`
                      : "bg-gradient-to-br from-[#559A87] to-[#3B7B6A] hover:from-[#4C8F7D] hover:to-[#326B5C] text-white border-2 border-white shadow-[0_6px_14px_rgba(65,115,100,0.22)] active:scale-95"
                  }`}
                >
                  {revealed ? (
                    <>
                      <span className="text-2xl sm:text-3xl leading-none">
                        {card.emoji}
                      </span>
                      <span className="mt-1 text-[10px] sm:text-xs font-extrabold text-[#2D2A26] leading-tight line-clamp-1">
                        {card.title}
                      </span>
                      {card.isMatched && (
                        <CheckCircle2 className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-[#2E7D67]" />
                      )}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white/90" />
                      <span className="mt-1 text-[9.5px] sm:text-[10.5px] font-extrabold tracking-wide text-white/90">
                        NARASA
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {memLastAffirmation && !memFinished && (
            <div className="rounded-[22px] bg-gradient-to-r from-[#E4F3ED] to-[#FCFBF7] border border-[#C6E4D8] p-4 flex items-start gap-3">
              <span className="text-2xl shrink-0">
                {memLastAffirmation.emoji}
              </span>
              <div>
                <div className="text-xs font-extrabold text-[#2E7D67]">
                  Pasangan Cocok: {memLastAffirmation.title}
                </div>
                <p className="mt-0.5 text-xs text-[#41504A] leading-relaxed">
                  {memLastAffirmation.text}
                </p>
              </div>
            </div>
          )}

          {memFinished && (
            <div className="rounded-[24px] bg-gradient-to-r from-[#FCE8DF] via-[#FDF4DC] to-[#E2F2EC] border-2 border-white p-5 text-center space-y-3 shadow-md">
              <div className="inline-flex items-center gap-1 text-amber-500">
                <Star className="h-6 w-6 fill-amber-400" />
                <Star className="h-7 w-7 fill-amber-400" />
                <Star
                  className={`h-6 w-6 ${
                    memMoves <= pairCountByDiff[memDifficulty] * 2
                      ? "fill-amber-400"
                      : "text-slate-300"
                  }`}
                />
              </div>
              <h3 className="text-lg font-extrabold text-[#2D2A26]">
                Luar Biasa! Semua Memori Harmoni Terbuka 🎉
              </h3>
              <p className="text-xs text-[#5C564F]">
                Skor Akhir: <strong>{memScore} XP</strong> • Selesai dalam{" "}
                <strong>{memMoves} langkah</strong> ({memSeconds} detik) • Rekor
                Level Ini: <strong>{stats.memoryBest[memDifficulty]} XP</strong>
              </p>
              <div className="flex flex-wrap justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => initMemoryGame(memDifficulty)}
                  className="clay-btn-coral rounded-full px-5 py-2.5 text-xs font-extrabold text-white"
                >
                  Mainkan Lagi
                </button>
                {memDifficulty !== "hard" && (
                  <button
                    type="button"
                    onClick={() =>
                      initMemoryGame(
                        memDifficulty === "easy" ? "medium" : "hard"
                      )
                    }
                    className="rounded-full bg-[#2E7D67] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm"
                  >
                    Naik Tingkat Kesulitan →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          GAME 6 VIEW: TANGKAP FOKUS POSITIF & TEPIS OVERTHINKING
         ==================================================================== */}
      {activeGame === "reflex" && (
        <div className="clay-card-white rounded-[26px] sm:rounded-[30px] p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#ECE8DF] pb-3.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-[#E2F1EC] px-3.5 py-1.5 font-extrabold text-[#2E7D67]">
                Skor: {reflexScore}
              </span>
              <span className="rounded-full bg-[#FAD9CE] px-3 py-1.5 font-extrabold text-[#C8522E] inline-flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" />
                Combo x{reflexCombo}
              </span>
              <span className="rounded-full bg-[#FBE8C2] px-3 py-1.5 font-extrabold text-[#9E6B14]">
                Gelombang {currentWave}/4
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-full bg-[#FCE8E6] px-3 py-1.5">
                {[1, 2, 3].map((idx) => (
                  <Heart
                    key={idx}
                    className={`h-4 w-4 transition ${
                      idx <= reflexLives
                        ? "fill-rose-500 text-rose-500"
                        : "text-rose-200"
                    }`}
                  />
                ))}
              </div>

              <span className="rounded-full bg-[#2D2A26] px-3.5 py-1.5 text-xs font-extrabold text-white inline-flex items-center gap-1">
                <Timer className="h-3.5 w-3.5 text-[#FAD06C]" />
                {reflexTimeLeft}d
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-[#F6F4EE] px-4 py-2.5 text-xs font-bold text-[#4E5A54] flex items-center justify-between gap-2">
            <span>{reflexFeedback}</span>
            <span className="hidden sm:inline text-[11px] text-[#7A746B] shrink-0">
              Abaikan awan merah = +5 Poin Detachment
            </span>
          </div>

          <div className="relative h-[340px] sm:h-[400px] w-full rounded-[24px] bg-gradient-to-b from-[#EAF5F0] via-[#F6F4EC] to-[#FCECE4] border-2 border-white shadow-inner overflow-hidden select-none">
            {!reflexRunning && (
              <div className="absolute inset-0 z-20 bg-[#FCFBF8]/88 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                {reflexEnded ? (
                  <div className="max-w-md space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBE8C2] text-[#C5861E] shadow-sm">
                      <Award className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-extrabold text-[#2D2A26]">
                      Sesi Latihan Fokus Selesai!
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5C564F]">
                      Skor Kamu: <strong>{reflexScore} XP</strong> • Rekor
                      Tertinggi: <strong>{stats.reflexBest} XP</strong>
                    </p>
                    <button
                      type="button"
                      onClick={startReflexGame}
                      className="clay-btn-coral inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-extrabold text-white shadow-md active:scale-95"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      Mainkan Lagi (45 Detik)
                    </button>
                  </div>
                ) : (
                  <div className="max-w-md space-y-3.5">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D6EFE6] text-[#2E7D67] shadow-sm">
                      <Zap className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#2D2A26]">
                      Siap Melatih Fokus & Kontrol Inhibisi?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left text-[11.5px]">
                      <div className="rounded-2xl bg-[#E2F2EC] p-3 text-[#215A49]">
                        <strong>✅ KETUK CEPAT:</strong> Gelembung Hijau &
                        Bintang Emas untuk mengumpulkan energi positif.
                      </div>
                      <div className="rounded-2xl bg-[#FCE6E2] p-3 text-[#7D2E22]">
                        <strong>✋ JANGAN DISENTUH:</strong> Biarkan Awan Merah
                        (Panik / Overthinking) lewat sendiri (+5 Poin).
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={startReflexGame}
                      className="clay-btn-coral inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-extrabold text-white shadow-md active:scale-95"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      Mulai Tantangan 45 Detik
                    </button>
                  </div>
                )}
              </div>
            )}

            {reflexOrbs.map((orb) => {
              const styleClass =
                orb.kind === "golden"
                  ? "bg-gradient-to-br from-[#FFE27A] to-[#F4B428] text-[#4A3505] ring-4 ring-[#FFF3BE] animate-bounce"
                  : orb.kind === "negative"
                  ? "bg-gradient-to-br from-[#F06449] to-[#C43B25] text-white ring-2 ring-rose-200"
                  : "bg-gradient-to-br from-[#59A690] to-[#2E7D67] text-white ring-2 ring-white";

              return (
                <button
                  key={orb.id}
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleOrbTap(orb);
                  }}
                  style={{
                    left: `${orb.xPct}%`,
                    top: `${orb.yPct}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-lg flex items-center gap-1.5 text-xs font-extrabold transition transform active:scale-90 cursor-pointer ${styleClass}`}
                >
                  <span className="text-base sm:text-lg leading-none">
                    {orb.emoji}
                  </span>
                  <span className="whitespace-nowrap">{orb.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
