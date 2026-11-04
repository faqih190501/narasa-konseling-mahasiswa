import { ProblemCategory, UrgencyLabel } from "./types";

export interface CrisisScanResult {
  isCrisis: boolean;
  matchedKeywords: string[];
  latencyMs: number;
  crisisType: "self_harm" | "acute_safety" | "none";
}

// Daftar kata kunci & pola regex Bahasa Indonesia formal + bahasa gaul (FR-02)
const CRISIS_PATTERNS: { label: string; regex: RegExp; type: "self_harm" | "acute_safety" }[] = [
  { label: "bunuh diri", regex: /\b(bunuh\s*diri|bundir)\b/i, type: "self_harm" },
  { label: "mengakhiri hidup", regex: /\b(mengakhiri\s*hidup|akhiri\s*hidup|akhiri\s*semuanya)\b/i, type: "self_harm" },
  { label: "tidak kuat hidup lagi", regex: /\b(tidak|tak|nggak|gak|ga|udah\s*gak)\s*(kuat|sanggup)\s*hidup(\s*lagi)?\b/i, type: "self_harm" },
  { label: "lukai / menyakiti diri", regex: /\b(lukai|melukai|menyakiti|sakiti|nyakitin)\s*diri(\s*sendiri)?\b/i, type: "self_harm" },
  { label: "ingin mati / pengen mati", regex: /\b(ingin|pengen|pingin|mau|lebih\s*baik|mending)\s*mati(\s*aja|\s*saja)?\b/i, type: "self_harm" },
  { label: "self-harm / cutting", regex: /\b(self[\s-]*harm|cutting|silet\s*tangan|iris\s*nadi|potong\s*nadi)\b/i, type: "self_harm" },
  { label: "gantung diri / overdosis", regex: /\b(gantung\s*diri|overdosis|minum\s*racun|lompat\s*dari\s*gedung|terjun\s*dari)\b/i, type: "self_harm" },
  { label: "hilang dari dunia / pamit selamanya", regex: /\b(pamit\s*selamanya|hilang\s*dari\s*dunia|tidur\s*selamanya)\b/i, type: "self_harm" },
  { label: "kekerasan / darurat seksual", regex: /\b(diperkosa|kekerasan\s*seksual\s*darurat|ancaman\s*bunuh|dipukuli\s*sampai)\b/i, type: "acute_safety" },
];

/**
 * Mesin Pemindai Kata Kunci Krisis Real-Time (FR-02)
 * Target SLA: < 1 detik (rata-rata eksekusi < 1 milidetik)
 */
export function scanCrisisKeywords(inputText: string): CrisisScanResult {
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (!inputText || !inputText.trim()) {
    return {
      isCrisis: false,
      matchedKeywords: [],
      latencyMs: 0.1,
      crisisType: "none",
    };
  }

  const matched: string[] = [];
  let crisisType: "self_harm" | "acute_safety" | "none" = "none";

  for (const item of CRISIS_PATTERNS) {
    if (item.regex.test(inputText)) {
      matched.push(item.label);
      if (crisisType === "none" || item.type === "self_harm") {
        crisisType = item.type;
      }
    }
  }

  const end = typeof performance !== "undefined" ? performance.now() : Date.now();
  const latencyMs = Math.max(0.1, Number((end - start).toFixed(2)));

  return {
    isCrisis: matched.length > 0,
    matchedKeywords: matched,
    latencyMs,
    crisisType,
  };
}

export interface Phq4Question {
  id: number;
  code: string;
  subscale: "GAD-2 (Kecemasan)" | "PHQ-2 (Depresi)";
  question: string;
}

export const PHQ4_QUESTIONS: Phq4Question[] = [
  {
    id: 1,
    code: "GAD-1",
    subscale: "GAD-2 (Kecemasan)",
    question:
      "Dalam 2 minggu terakhir, seberapa sering kamu merasa gugup, cemas, atau gelisah?",
  },
  {
    id: 2,
    code: "GAD-2",
    subscale: "GAD-2 (Kecemasan)",
    question:
      "Dalam 2 minggu terakhir, seberapa sering kamu merasa tidak mampu menghentikan atau mengendalikan rasa khawatir?",
  },
  {
    id: 3,
    code: "PHQ-1",
    subscale: "PHQ-2 (Depresi)",
    question:
      "Dalam 2 minggu terakhir, seberapa sering kamu merasa kurang berminat atau kurang bersemangat dalam melakukan berbagai hal?",
  },
  {
    id: 4,
    code: "PHQ-2",
    subscale: "PHQ-2 (Depresi)",
    question:
      "Dalam 2 minggu terakhir, seberapa sering kamu merasa murung, sedih, atau putus asa?",
  },
];

export const LIKERT_OPTIONS = [
  { value: 0, label: "Tidak Pernah (0)", desc: "Sama sekali tidak mengganggu" },
  { value: 1, label: "Beberapa Hari (1)", desc: "1–6 hari dalam 2 minggu terakhir" },
  { value: 2, label: "Lebih dari Separuh Waktu (2)", desc: "7+ hari dalam 2 minggu terakhir" },
  { value: 3, label: "Hampir Setiap Hari (3)", desc: "Dirasakan hampir setiap hari" },
];

export interface Phq4AssessmentSummary {
  phq4_score: number;
  gad_score: number;
  phq2_score: number;
  urgency_label: UrgencyLabel;
  recommended_tier: "Peer Counselor / Dosen BK" | "Prioritas Dosen BK / Konselor Ahli";
  clinical_interpretation: string;
}

/**
 * Perhitungan Skor Kuesioner PHQ-4 (FR-03)
 * Rentang Skor Total: 0 - 12
 * - Rendah (0-2)
 * - Sedang (3-5)
 * - Tinggi (6-8)
 * - Kritis (9-12)
 */
export function evaluatePhq4(
  answers: [number, number, number, number]
): Phq4AssessmentSummary {
  const gad_score = (answers[0] || 0) + (answers[1] || 0);
  const phq2_score = (answers[2] || 0) + (answers[3] || 0);
  const phq4_score = gad_score + phq2_score;

  let urgency_label: UrgencyLabel = "Rendah (0-2)";
  let recommended_tier: "Peer Counselor / Dosen BK" | "Prioritas Dosen BK / Konselor Ahli" =
    "Peer Counselor / Dosen BK";
  let clinical_interpretation = "";

  if (phq4_score <= 2) {
    urgency_label = "Rendah (0-2)";
    recommended_tier = "Peer Counselor / Dosen BK";
    clinical_interpretation =
      "Distres emosional ringan. Sangat cocok untuk pendampingan Konselor Sebaya (Peer Support) atau konsultasi eksploratif dengan Dosen BK.";
  } else if (phq4_score <= 5) {
    urgency_label = "Sedang (3-5)";
    recommended_tier = "Peer Counselor / Dosen BK";
    clinical_interpretation =
      "Distres tingkat sedang. Disarankan berdiskusi dengan Konselor Sebaya terlatih atau menjadwalkan sesi terstruktur dengan Dosen BK.";
  } else if (phq4_score <= 8) {
    urgency_label = "Tinggi (6-8)";
    recommended_tier = "Prioritas Dosen BK / Konselor Ahli";
    clinical_interpretation =
      "Distres emosional tinggi (skor klinis signifikan). Sistem memprioritaskan rujukan langsung ke Dosen BK / Konselor Ahli.";
  } else {
    urgency_label = "Kritis (9-12)";
    recommended_tier = "Prioritas Dosen BK / Konselor Ahli";
    clinical_interpretation =
      "Distres sangat tinggi / kritis. Wajib ditangani oleh Dosen BK / Konselor Ahli dengan antrean prioritas utama.";
  }

  return {
    phq4_score,
    gad_score,
    phq2_score,
    urgency_label,
    recommended_tier,
    clinical_interpretation,
  };
}

export const PROBLEM_CATEGORIES: {
  id: ProblemCategory;
  shortTitle: string;
  description: string;
  iconName: string;
}[] = [
  {
    id: "Akademik & Studi",
    shortTitle: "Akademik & Studi",
    description: "Kesulitan belajar, manajemen waktu, kecemasan tugas akhir/skripsi, IPK",
    iconName: "BookOpen",
  },
  {
    id: "Emosi & Kesehatan Mental",
    shortTitle: "Emosi & Kesehatan Mental",
    description: "Cemas berlebih (overthinking), burnout, kesedihan mendalam, regulasi emosi",
    iconName: "HeartHandshake",
  },
  {
    id: "Relasi Keluarga/Sosial",
    shortTitle: "Relasi Keluarga / Sosial",
    description: "Konflik keluarga, pertemanan, kesepian di perantauan, hubungan interpersonal",
    iconName: "Users",
  },
  {
    id: "Karier & Masa Depan",
    shortTitle: "Karier & Masa Depan",
    description: "Kebingungan arah karier pasca-kampus, magang, kecemasan masa depan",
    iconName: "Compass",
  },
  {
    id: "Spiritual & Nilai Diri",
    shortTitle: "Spiritual & Nilai Diri",
    description: "Krisis makna hidup, nilai spiritual, kepercayaan diri, pencarian jati diri",
    iconName: "Sparkles",
  },
];

const PSEUDONYM_ADJECTIVES = [
  "Langit Teduh",
  "Senja Tenang",
  "Embun Pagi",
  "Pohon Rindang",
  "Pelangi Damai",
  "Bintang Utara",
  "Samudra Biru",
  "Cahaya Mentari",
  "Angin Sejuk",
  "Lembah Hijau",
];

export function generateCalmPseudonym(): string {
  const base =
    PSEUDONYM_ADJECTIVES[Math.floor(Math.random() * PSEUDONYM_ADJECTIVES.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${base} #${num}`;
}

