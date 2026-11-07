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
} from "lucide-react";

type ActiveGameTab = "memory" | "reflex" | "cbt";
type MemoryDifficulty = "easy" | "medium" | "hard";

interface GameStats {
  totalXp: number;
  gamesCompleted: number;
  memoryBest: Record<MemoryDifficulty, number>;
  reflexBest: number;
  cbtBest: number;
}

const DEFAULT_STATS: GameStats = {
  totalXp: 0,
  gamesCompleted: 0,
  memoryBest: { easy: 0, medium: 0, hard: 0 },
  reflexBest: 0,
  cbtBest: 0,
};

const STORAGE_KEY = "narasa_game_stats_v1";

// ============================================================================
// DATA GAME 1: MEMORI HARMONI EMOSI
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
// DATA GAME 2: TANGKAP FOKUS & TEPIS OVERTHINKING (GO / NO-GO)
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

// ============================================================================
// DATA GAME 3: TANTANGAN REFRAMING KOGNITIF (CBT CHALLENGE)
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
    tag: "Relasi & Pertemanan",
    situation:
      "Sahabat satu angkatanmu belum membalas pesan WhatsApp-mu sejak pagi padahal statusnya sempat terlihat online.",
    automaticThought:
      "\"Dia pasti sedang kesal pada saya atau sengaja menjauhi saya karena perkataan saya kemarin.\"",
    distortionName: "Jumping to Conclusions",
    distortionHint:
      "Langsung mengambil kesimpulan terburuk tanpa bukti faktual yang cukup.",
    options: [
      {
        id: "a",
        text: "Mengirim 10 pesan beruntun menanyakan kenapa dia marah kepada saya.",
        isCorrect: false,
        feedback:
          "Reaksi impulsif berbasis asumsi dapat menimbulkan ketegangan yang sebenarnya tidak ada.",
      },
      {
        id: "b",
        text: "Memblokir kontaknya terlebih dahulu supaya saya tidak merasa sakit hati.",
        isCorrect: false,
        feedback:
          "Memutus hubungan karena prasangka merusak komunikasi yang sehat.",
      },
      {
        id: "c",
        text: "Bisa jadi ia sedang sibuk kuliah atau mengurus hal mendesak. Saya beri jeda wajar sambil melanjutkan aktivitas saya sendiri.",
        isCorrect: true,
        feedback:
          "Sehat & dewasa! Memberi ruang kemungkinan alternatif (alternative explanation) menjaga ketenangan emosi dan relasi.",
      },
      {
        id: "d",
        text: "Menyindirnya lewat status media sosial agar dia peka.",
        isCorrect: false,
        feedback:
          "Komunikasi pasif-agresif memperkeruh masalah dan meningkatkan stres relasional.",
      },
    ],
  },
  {
    id: "cbt-6",
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
    id: "cbt-7",
    tag: "Adaptasi & Kepercayaan Diri",
    situation:
      "Saat diskusi kelas, teman sekelasmu menyampaikan pendapat dengan istilah ilmiah yang sangat fasih, sementara kamu masih menyusun kalimat.",
    automaticThought:
      "\"Semua orang di kelas ini jauh lebih cerdas daripada saya. Saya salah masuk program studi.\"",
    distortionName: "Impostor Phenomenon & Discounting the Positive",
    distortionHint:
      "Mengabaikan kelebihan diri sendiri dan membandingkan proses dalam dirimu dengan tampilan luar orang lain.",
    options: [
      {
        id: "a",
        text: "Berjanji tidak akan pernah berbicara di kelas lagi selama satu semester penuh.",
        isCorrect: false,
        feedback:
          "Membungkam suara sendiri menghambat perkembangan kepercayaan diri akademikmu.",
      },
      {
        id: "b",
        text: "Setiap mahasiswa punya gaya dan kecepatan belajar unik. Kefasihan teman bisa menjadi inspirasi, dan perspektif sederhana saya tetap bernilai.",
        isCorrect: true,
        feedback:
          "Sangat tepat! Menghargai keunikan proses belajar sendiri menumbuhkan efikasi diri akademik yang sehat.",
      },
      {
        id: "c",
        text: "Mencari-cari kesalahan argumen teman tersebut dalam hati agar merasa lebih unggul.",
        isCorrect: false,
        feedback:
          "Merendahkan orang lain bukan fondasi kepercayaan diri yang tulus dan tenang.",
      },
      {
        id: "d",
        text: "Langsung berencana pindah jurusan malam ini juga karena merasa kalah saing.",
        isCorrect: false,
        feedback:
          "Keputusan besar tidak sebaiknya diambil saat emosi sedang terpicu oleh perbandingan sesaat.",
      },
    ],
  },
  {
    id: "cbt-8",
    tag: "Keluarga & Harapan",
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

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getPlayerRank(xp: number) {
  if (xp >= 1500) {
    return {
      title: "Master Harmoni NARASA",
      badge: "👑",
      nextXp: 3000,
      color: "text-[#9E6B14] bg-[#FDECC8]",
    };
  }
  if (xp >= 750) {
    return {
      title: "Navigator Kognitif",
      badge: "🧭",
      nextXp: 1500,
      color: "text-[#2E7D67] bg-[#D6EFE6]",
    };
  }
  if (xp >= 300) {
    return {
      title: "Sahabat Empatik",
      badge: "🌿",
      nextXp: 750,
      color: "text-[#3F78B5] bg-[#DCEBFA]",
    };
  }
  return {
    title: "Penjelajah Tenang",
    badge: "🌱",
    nextXp: 300,
    color: "text-[#6C4A32] bg-[#F5E6D8]",
  };
}

export default function MindfulGamesModule({
  studentName,
}: {
  studentName?: string;
}) {
  const [activeGame, setActiveGame] = useState<ActiveGameTab>("memory");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Load saved stats from localStorage
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

  // Lightweight Web Audio API sound synth (100% offline, instant for Web & Android APK)
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
  // STATE & LOGIC — GAME 1: MEMORI HARMONI EMOSI
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
      const nextMoveCount = memMoves + 1;
      setMemMoves(nextMoveCount);

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
  // STATE & LOGIC — GAME 2: TANGKAP FOKUS & TEPIS OVERTHINKING (GO / NO-GO)
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

  // Countdown timer for Reflex Game
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

  // Spawner & TTL cleaner for Reflex Orbs
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

  // ==========================================================================
  // STATE & LOGIC — GAME 3: TANTANGAN REFRAMING KOGNITIF (CBT CHALLENGE)
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
    const selected = shuffleArray(CBT_SCENARIOS)
      .slice(0, 6)
      .map((sc) => ({
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

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ====================================================================
          TOP HERO & KOMPETENSI PEMAIN HUD
         ==================================================================== */}
      <div className="clay-hero-peach rounded-[26px] sm:rounded-[30px] p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold text-[#2E7D67] shadow-sm">
                <Gamepad2 className="h-3.5 w-3.5 text-[#EE7854]" />
                Zona Game Kognitif & Relaksasi NARASA
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold shadow-sm ${rank.color}`}
              >
                <span>{rank.badge}</span>
                <span>{rank.title}</span>
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-extrabold text-[#2D2A26]">
              Asah Fokus, Regulasi Emosi & Ketangkasan Pikiran{" "}
              {studentName ? `• ${studentName.split(",")[0]}` : ""}
            </h2>
            <p className="text-xs sm:text-[13px] text-[#5F544E] max-w-2xl leading-relaxed">
              Tiga permainan interaktif berbasis psikologi kognitif & konseling
              (Memori Kerja, Kontrol Fokus Go/No-Go, dan Tantangan Reframing
              CBT) untuk menyegarkan pikiran di sela perkuliahan.
            </p>
          </div>

          {/* Player XP & Sound Control Card */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 rounded-[22px] bg-[#FCFBF8]/95 border-2 border-white p-3.5 shadow-sm shrink-0">
            <div className="min-w-[150px]">
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
                Target Level Berikutnya: {rank.nextXp} XP
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

        {/* 3 GAME MODE SELECTOR TABS */}
        <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setActiveGame("memory")}
            className={`rounded-[20px] p-3.5 text-left transition-all border-2 ${
              activeGame === "memory"
                ? "bg-[#FCFBF8] border-[#559A87] shadow-md scale-[1.01]"
                : "bg-white/65 border-white hover:bg-white/90"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#D6EFE6] text-[#2E7D67]">
                <Brain className="h-4 w-4" />
              </span>
              <span className="rounded-full bg-[#F3F0E8] px-2.5 py-0.5 text-[10px] font-extrabold text-[#5C564F]">
                Rekor:{" "}
                {Math.max(
                  stats.memoryBest.easy,
                  stats.memoryBest.medium,
                  stats.memoryBest.hard
                )}
              </span>
            </div>
            <div className="mt-2 text-xs sm:text-sm font-extrabold text-[#2D2A26]">
              1. Memori Harmoni Emosi
            </div>
            <div className="text-[11px] text-[#6E6A63]">
              Working Memory • Combo Kartu & Afirmasi
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveGame("reflex")}
            className={`rounded-[20px] p-3.5 text-left transition-all border-2 ${
              activeGame === "reflex"
                ? "bg-[#FCFBF8] border-[#EE7854] shadow-md scale-[1.01]"
                : "bg-white/65 border-white hover:bg-white/90"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAD9CE] text-[#D9603B]">
                <Zap className="h-4 w-4" />
              </span>
              <span className="rounded-full bg-[#F3F0E8] px-2.5 py-0.5 text-[10px] font-extrabold text-[#5C564F]">
                Rekor: {stats.reflexBest}
              </span>
            </div>
            <div className="mt-2 text-xs sm:text-sm font-extrabold text-[#2D2A26]">
              2. Tangkap Fokus Positif
            </div>
            <div className="text-[11px] text-[#6E6A63]">
              Refleks Go/No-Go • Tepis Awan Overthinking
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveGame("cbt")}
            className={`rounded-[20px] p-3.5 text-left transition-all border-2 ${
              activeGame === "cbt"
                ? "bg-[#FCFBF8] border-[#C5861E] shadow-md scale-[1.01]"
                : "bg-white/65 border-white hover:bg-white/90"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FBE8C2] text-[#C5861E]">
                <Lightbulb className="h-4 w-4" />
              </span>
              <span className="rounded-full bg-[#F3F0E8] px-2.5 py-0.5 text-[10px] font-extrabold text-[#5C564F]">
                Rekor: {stats.cbtBest}
              </span>
            </div>
            <div className="mt-2 text-xs sm:text-sm font-extrabold text-[#2D2A26]">
              3. Tantangan Reframing CBT
            </div>
            <div className="text-[11px] text-[#6E6A63]">
              Strategi Kognitif • Studi Kasus BKPI & PIAUD
            </div>
          </button>
        </div>
      </div>

      {/* ====================================================================
          GAME 1 VIEW: MEMORI HARMONI EMOSI
         ==================================================================== */}
      {activeGame === "memory" && (
        <div className="clay-card-white rounded-[26px] sm:rounded-[30px] p-4 sm:p-6 space-y-5">
          {/* Controls & Live Metrics */}
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

          {/* Card Grid */}
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

          {/* Micro-Affirmation Toast upon Match */}
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

          {/* Completion Summary */}
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
          GAME 2 VIEW: TANGKAP FOKUS POSITIF & TEPIS OVERTHINKING
         ==================================================================== */}
      {activeGame === "reflex" && (
        <div className="clay-card-white rounded-[26px] sm:rounded-[30px] p-4 sm:p-6 space-y-4">
          {/* HUD Bar */}
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
              {/* Focus Hearts */}
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

              {/* Countdown */}
              <span className="rounded-full bg-[#2D2A26] px-3.5 py-1.5 text-xs font-extrabold text-white inline-flex items-center gap-1">
                <Timer className="h-3.5 w-3.5 text-[#FAD06C]" />
                {reflexTimeLeft}d
              </span>
            </div>
          </div>

          {/* Live Coaching Banner */}
          <div className="rounded-2xl bg-[#F6F4EE] px-4 py-2.5 text-xs font-bold text-[#4E5A54] flex items-center justify-between gap-2">
            <span>{reflexFeedback}</span>
            <span className="hidden sm:inline text-[11px] text-[#7A746B] shrink-0">
              Abaikan awan merah = +5 Poin Detachment
            </span>
          </div>

          {/* Interactive Reflex Arena */}
          <div className="relative h-[340px] sm:h-[400px] w-full rounded-[24px] bg-gradient-to-b from-[#EAF5F0] via-[#F6F4EC] to-[#FCECE4] border-2 border-white shadow-inner overflow-hidden select-none">
            {/* Start / End Overlay */}
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
                    <p className="text-[11.5px] text-[#6E6A63]">
                      Kemampuan memilah pikiran positif dan membiarkan awan
                      overthinking berlalu melatih kontrol atensi eksekutifmu.
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
                      Siap Melatih Fokus & Kontrol Pikiran?
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

            {/* Floating Orbs */}
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

      {/* ====================================================================
          GAME 3 VIEW: TANTANGAN REFRAMING KOGNITIF (CBT CHALLENGE)
         ==================================================================== */}
      {activeGame === "cbt" && (
        <div className="clay-card-white rounded-[26px] sm:rounded-[30px] p-4 sm:p-6 space-y-5">
          {!cbtFinished && currentScenario ? (
            <>
              {/* Top Progress & Lifelines */}
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

                {/* Lifelines */}
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

              {/* Scenario Card */}
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

              {/* 4 Reframing Choices */}
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

              {/* Explanation & Next Button */}
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
            /* CBT Final Scorecard */
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
              <p className="max-w-lg mx-auto text-xs text-[#5E6A64] leading-relaxed">
                {cbtCorrectCount >= 5
                  ? "Kompetensi regulasi kognitifmu sangat matang! Kamu mampu mengenali distorsi pikiran dan memilih respons empatik yang konstruktif."
                  : "Terus berlatih! Mengenali pikiran otomatis negatif adalah langkah awal membangun ketangguhan mental di kampus."}
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
    </div>
  );
}
