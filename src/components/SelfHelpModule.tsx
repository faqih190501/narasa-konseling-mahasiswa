"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Wind,
  Play,
  Square,
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  CheckCircle2,
  Heart,
  RotateCcw,
} from "lucide-react";

const ARTICLES = [
  {
    id: "art-1",
    tag: "Skripsi & Akademik",
    readTime: "3 Menit Baca",
    title: "Mengurai Kecemasan Saat Revisi Skripsi dengan Teknik Micro-Stepping",
    summary:
      "Rasa takut bertemu dosen pembimbing sering kali muncul karena otak melihat skripsi sebagai satu gunung besar. Pecah target menjadi tugas 20 menit yang sangat spesifik.",
    tips: [
      "Fokus hanya pada 1 paragraf atau 1 poin revisi dalam satu waktu (aturan 15 menit).",
      "Pisahkan antara kritik terhadap tulisan ilmiah dengan nilai diri Anda sebagai pribadi.",
      "Gunakan teknik pernapasan 4-7-8 tepat 5 menit sebelum masuk ke ruang bimbingan.",
    ],
  },
  {
    id: "art-2",
    tag: "Regulasi Emosi",
    readTime: "4 Menit Baca",
    title: "Mengenali Bedanya Lelah Biasa dengan Academic Burnout",
    summary:
      "Jika tidur akhir pekan tidak lagi memulihkan energi dan muncul rasa sinis atau hampa terhadap perkuliahan, tubuh serta pikiran Anda sedang meminta jeda pemulihan.",
    tips: [
      "Berikan izin pada diri sendiri untuk beristirahat tanpa rasa bersalah (scheduled guilt-free rest).",
      "Kurangi paparan perbandingan sosial akademik dengan teman seangkatan di media sosial.",
      "Ceritakan bebanmu ke Konselor Sebaya atau Dosen BK sebelum menumpuk menjadi krisis.",
    ],
  },
  {
    id: "art-3",
    tag: "Relasi & Perantauan",
    readTime: "3 Menit Baca",
    title: "Mengatasi Rasa Sepi (Homesick) dan Kecanggungan Sosial di Kampus",
    summary:
      "Merasa belum memiliki lingkaran pertemanan dekat di semester awal atau saat pindah kelas adalah pengalaman normal yang dialami lebih dari 60% mahasiswa.",
    tips: [
      "Mulai dari interaksi kecil berisiko rendah, seperti menyapa teman duduk sebelah saat kuliah.",
      "Bergabung dengan komunitas minat atau Pojok Sahabat BK yang suportif dan bebas penghakiman.",
      "Tetap jadwalkan komunikasi rutin yang hangat dengan keluarga atau sahabat pendukung.",
    ],
  },
];

const GROUNDING_STEPS = [
  {
    count: 5,
    sense: "Penglihatan (Lihat)",
    prompt: "Sebutkan 5 benda di sekitarmu saat ini yang bisa kamu lihat dengan jelas (misal: pena, meja, dedaunan di luar jendela).",
  },
  {
    count: 4,
    sense: "Sentuhan (Rasakan)",
    prompt: "Sadari 4 tekstur benda yang menyentuh tubuhmu sekarang (misal: pijakan kaki di lantai, kain baju, sandaran kursi).",
  },
  {
    count: 3,
    sense: "Pendengaran (Dengar)",
    prompt: "Dengarkan 3 suara di sekelilingmu tanpa menilai (misal: hembusan angin/kipas, suara jauh di luar, atau deru napasmu).",
  },
  {
    count: 2,
    sense: "Penciuman (Aroma)",
    prompt: "Kenali 2 aroma di udara sekitarmu, atau bayangkan 2 aroma yang paling menenangkan bagimu (seperti tanah sehabis hujan atau teh hangat).",
  },
  {
    count: 1,
    sense: "Afirmasi Diri (Hati)",
    prompt: "Ucapkan 1 kalimat kebaikan untuk dirimu: 'Aku aman saat ini, dan aku sudah berusaha sebaik yang aku bisa hari ini.'",
  },
];

export default function SelfHelpModule({ compact = false }: { compact?: boolean }) {
  // 4-7-8 Breathing State
  const [isBreathing, setIsBreathing] = useState(false);
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | "idle">("idle");
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);

  // 5-4-3-2-1 Grounding Checklist
  const [completedGrounding, setCompletedGrounding] = useState<number[]>([]);

  // Web Audio API Ambient Relaxation Sound
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Selected Article
  const [activeArticleId, setActiveArticleId] = useState<string>(ARTICLES[0].id);

  useEffect(() => {
    if (!isBreathing) {
      setPhase("idle");
      setSecondsLeft(4);
      return;
    }

    setPhase("inhale");
    setSecondsLeft(4);

    let currentPhase: "inhale" | "hold" | "exhale" = "inhale";
    let counter = 4;

    const interval = setInterval(() => {
      counter -= 1;
      if (counter > 0) {
        setSecondsLeft(counter);
      } else {
        if (currentPhase === "inhale") {
          currentPhase = "hold";
          counter = 7;
          setPhase("hold");
          setSecondsLeft(7);
        } else if (currentPhase === "hold") {
          currentPhase = "exhale";
          counter = 8;
          setPhase("exhale");
          setSecondsLeft(8);
        } else {
          currentPhase = "inhale";
          counter = 4;
          setPhase("inhale");
          setSecondsLeft(4);
          setCycleCount((c) => c + 1);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathing]);

  useEffect(() => {
    return () => {
      stopAmbientAudio();
    };
  }, []);

  const toggleAmbientAudio = () => {
    if (isAudioPlaying) {
      stopAmbientAudio();
      return;
    }
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioContextClass();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.01, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 1.5);
      masterGain.connect(ctx.destination);

      // Create calming 432Hz + 528Hz harmonic sine chord
      const freqs = [216, 324, 432];
      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        oscGain.gain.setValueAtTime(0.25, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start();
      });

      audioCtxRef.current = ctx;
      gainNodeRef.current = masterGain;
      setIsAudioPlaying(true);
    } catch {
      setIsAudioPlaying(false);
    }
  };

  const stopAmbientAudio = () => {
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    }
    setIsAudioPlaying(false);
  };

  const toggleGroundingStep = (count: number) => {
    setCompletedGrounding((prev) =>
      prev.includes(count) ? prev.filter((item) => item !== count) : [...prev, count]
    );
  };

  const phaseConfig = {
    idle: {
      title: "Siap Memulai Napas 4-7-8",
      subtitle: "Tekan tombol Mulai untuk memandu ritme pernapasan relaksasi saraf parasimpatis.",
      scale: "scale-100",
      bg: "from-teal-500 to-sky-500",
    },
    inhale: {
      title: "Tarik Napas Perlahan...",
      subtitle: "Hirup udara melalui hidung dengan tenang selama 4 detik",
      scale: "scale-125",
      bg: "from-teal-500 to-emerald-500",
    },
    hold: {
      title: "Tahan Napas...",
      subtitle: "Biarkan oksigen menenangkan detak jantungmu selama 7 detik",
      scale: "scale-125",
      bg: "from-sky-500 to-indigo-500",
    },
    exhale: {
      title: "Hembuskan Perlahan...",
      subtitle: "Keluarkan napas lewat mulut secara lembut selama 8 detik",
      scale: "scale-95",
      bg: "from-emerald-500 to-teal-600",
    },
  }[phase];

  const activeArticle =
    ARTICLES.find((a) => a.id === activeArticleId) || ARTICLES[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      {!compact && (
        <div className="rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-sky-700 p-6 text-white shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-teal-50 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Modul FR-09 • Self-Help & Grounding Mandiri 24/7
              </span>
              <h2 className="mt-2 text-2xl font-bold">
                Ruang Tenang & Pertolongan Pertama Emosional
              </h2>
              <p className="mt-1 text-sm text-teal-50/90 max-w-2xl">
                Sembari menunggu jadwal sesi konseling atau saat kamu merasa kewalahan,
                gunakan panduan pernapasan 4-7-8, latihan grounding sensorik, dan audio
                relaksasi ini untuk menurunkan ketegangan.
              </p>
            </div>
            <button
              onClick={toggleAmbientAudio}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition shadow-sm ${
                isAudioPlaying
                  ? "bg-amber-400 text-slate-900 hover:bg-amber-300"
                  : "bg-white text-teal-800 hover:bg-teal-50"
              }`}
            >
              {isAudioPlaying ? (
                <>
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  Matikan Audio Relaksasi (432Hz)
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  Putar Audio Relaksasi Tenang
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className={`grid gap-6 ${compact ? "grid-cols-1" : "lg:grid-cols-2"}`}>
        {/* 1. Panduan Pernapasan 4-7-8 */}
        <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Wind className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">
                  Panduan Pernapasan 4-7-8 Interaktif
                </h3>
                <p className="text-xs text-slate-500">
                  Menurunkan respons cemas (fight-or-flight) dalam 3–4 siklus
                </p>
              </div>
            </div>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
              Siklus Selesai: {cycleCount}
            </span>
          </div>

          <div className="my-8 flex flex-col items-center justify-center">
            <div className="relative flex h-44 w-44 items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full bg-gradient-to-tr ${phaseConfig.bg} opacity-20 transition-all duration-1000 ${phaseConfig.scale}`}
              />
              <div
                className={`flex h-36 w-36 flex-col items-center justify-center rounded-full bg-gradient-to-tr ${phaseConfig.bg} text-white shadow-lg transition-all duration-1000 ${phaseConfig.scale}`}
              >
                <span className="text-4xl font-bold tracking-tight">
                  {phase === "idle" ? "4-7-8" : `${secondsLeft}d`}
                </span>
                <span className="mt-1 text-xs font-medium uppercase tracking-wider opacity-90">
                  {phase === "idle"
                    ? "Relaksasi"
                    : phase === "inhale"
                    ? "Tarik (4d)"
                    : phase === "hold"
                    ? "Tahan (7d)"
                    : "Hembus (8d)"}
                </span>
              </div>
            </div>

            <h4 className="mt-5 text-base font-semibold text-slate-800">
              {phaseConfig.title}
            </h4>
            <p className="mt-1 text-center text-xs text-slate-500 max-w-xs">
              {phaseConfig.subtitle}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsBreathing(!isBreathing)}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition shadow-sm ${
                isBreathing
                  ? "bg-rose-500 hover:bg-rose-600"
                  : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {isBreathing ? (
                <>
                  <Square className="h-4 w-4" />
                  Hentikan Sejenak
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Mulai Panduan Napas
                </>
              )}
            </button>
            {compact && (
              <button
                onClick={toggleAmbientAudio}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/60 px-3.5 py-2.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"
              >
                {isAudioPlaying ? (
                  <>
                    <Volume2 className="h-4 w-4 text-teal-600 animate-pulse" />
                    Suara Aktif
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 text-slate-500" />
                    Suara Tenang
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 2. Latihan Grounding 5-4-3-2-1 */}
        <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">
                  Teknik Grounding 5-4-3-2-1 (Anti-Overthinking)
                </h3>
                <p className="text-xs text-slate-500">
                  Klik setiap langkah setelah kamu menyadarinya di sekitarmu
                </p>
              </div>
            </div>
            {completedGrounding.length > 0 && (
              <button
                onClick={() => setCompletedGrounding([])}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-teal-600"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Ulangi
              </button>
            )}
          </div>

          <div className="mt-4 space-y-2.5">
            {GROUNDING_STEPS.map((step) => {
              const done = completedGrounding.includes(step.count);
              return (
                <button
                  key={step.count}
                  onClick={() => toggleGroundingStep(step.count)}
                  className={`w-full text-left flex items-start gap-3 rounded-xl border p-3 transition ${
                    done
                      ? "border-teal-300 bg-teal-50/70"
                      : "border-slate-200 bg-slate-50/50 hover:border-teal-200 hover:bg-white"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      done
                        ? "bg-teal-600 text-white"
                        : "bg-white text-teal-700 border border-teal-200"
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : step.count}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          done ? "text-teal-900 line-through" : "text-slate-800"
                        }`}
                      >
                        {step.sense}
                      </span>
                      <span className="text-[11px] font-medium text-teal-600">
                        {done ? "Selesai ✓" : "Ketuk jika sudah"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                      {step.prompt}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Artikel Psikoedukasi Singkat */}
      {!compact && (
        <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">
                Pustaka Psikoedukasi & Manajemen Stres Akademik
              </h3>
              <p className="text-xs text-slate-500">
                Panduan praktis yang disusun oleh Tim Dosen Bimbingan & Konseling Kampus
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            <div className="space-y-2.5">
              {ARTICLES.map((art) => (
                <button
                  key={art.id}
                  onClick={() => setActiveArticleId(art.id)}
                  className={`w-full rounded-xl border p-3.5 text-left transition ${
                    activeArticleId === art.id
                      ? "border-teal-500 bg-teal-50/70 shadow-sm"
                      : "border-slate-200 bg-white hover:border-teal-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-medium text-teal-700">
                    <span>{art.tag}</span>
                    <span>{art.readTime}</span>
                  </div>
                  <h4 className="mt-1 text-sm font-semibold text-slate-800">
                    {art.title}
                  </h4>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-slate-50/70 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
                <span className="rounded-md bg-teal-100 px-2.5 py-0.5">
                  {activeArticle.tag}
                </span>
                <span>•</span>
                <span>{activeArticle.readTime}</span>
              </div>
              <h4 className="mt-2 text-lg font-bold text-slate-800">
                {activeArticle.title}
              </h4>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {activeArticle.summary}
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Langkah Praktis yang Bisa Dicoba Hari Ini:
                </p>
                {activeArticle.tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg bg-white p-3 text-xs text-slate-700 shadow-sm border border-slate-100"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-800">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

