"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircleHeart,
  Send,
  ShieldCheck,
  Video,
  MapPin,
  PhoneCall,
  Sparkles,
  CheckCircle2,
  Clock,
  Lock,
  PlusCircle,
  AlertTriangle,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import {
  DecryptedTicketView,
  LiveChatMessage,
  ModalityChoice,
  ProblemCategory,
} from "@/lib/types";
import { PROBLEM_CATEGORIES, scanCrisisKeywords } from "@/lib/triage-engine";

interface Props {
  studentName: string;
  studentIdentifier: string;
  studentProdi: string;
  isAnonymous: boolean;
  tickets: DecryptedTicketView[];
  allMessages: LiveChatMessage[];
  onDataChanged: () => void;
}

export default function StudentDirectConsult({
  studentName,
  studentIdentifier,
  studentProdi,
  isAnonymous,
  tickets,
  allMessages,
  onDataChanged,
}: Props) {
  // Filter tickets belonging to this student (or fallback to most recent active consultation)
  const safeStudentName = (studentName || "").toLowerCase();
  const safeStudentIdentifier = (studentIdentifier || "").toLowerCase();

  const myTickets = (tickets || []).filter(
    (t) =>
      (t.mahasiswa_pseudonym || "").toLowerCase() === safeStudentName ||
      (t.mahasiswa_name_decrypted || "").toLowerCase() === safeStudentName ||
      (safeStudentIdentifier &&
        !isAnonymous &&
        (t.mahasiswa_nim_decrypted || "").toLowerCase() ===
          safeStudentIdentifier)
  );

  const [activeTicketCode, setActiveTicketCode] = useState<string>(
    myTickets[0]?.ticket_code || ""
  );
  const [selectedCategory, setSelectedCategory] = useState<ProblemCategory>(
    "Emosi & Kesehatan Mental"
  );
  const [selectedModality, setSelectedModality] = useState<ModalityChoice>(
    "Konsultasi Chat Anonim"
  );
  const [messageInput, setMessageInput] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [localMessages, setLocalMessages] = useState<LiveChatMessage[]>([]);
  const [activeMeetLink, setActiveMeetLink] = useState<string>("");
  const [crisisBanner, setCrisisBanner] = useState<{
    active: boolean;
    keywords: string[];
  }>({ active: false, keywords: [] });

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Sync active ticket if student doesn't have one selected yet
  useEffect(() => {
    if (!activeTicketCode && myTickets.length > 0) {
      setActiveTicketCode(myTickets[0].ticket_code);
    }
  }, [myTickets, activeTicketCode]);

  // Real-time 2s polling so Admin replies appear immediately
  useEffect(() => {
    if (!activeTicketCode) {
      setLocalMessages([]);
      return;
    }

    const fetchThread = async () => {
      try {
        const res = await fetch(
          `/api/state?role=mahasiswa&ticketCode=${activeTicketCode}`
        );
        const data = await res.json();
        if (data.live_chat_messages) {
          setLocalMessages(data.live_chat_messages);
        }
        if (data.ticket?.meet_link) {
          setActiveMeetLink(data.ticket.meet_link);
        }
      } catch {
        // ignore network hiccup
      }
    };

    fetchThread();
    const timer = setInterval(fetchThread, 2000);
    return () => clearInterval(timer);
  }, [activeTicketCode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages.length, activeTicketCode]);

  const activeTicketObj = tickets.find(
    (t) => t.ticket_code === activeTicketCode
  );

  const handleStartNewConsultation = () => {
    setActiveTicketCode("");
    setLocalMessages([]);
    setActiveMeetLink("");
  };

  const handleSendConsultationMessage = async (presetText?: string) => {
    const textToSend = (presetText ?? messageInput).trim();
    if (!textToSend) return;

    // Real-time crisis check
    const scan = scanCrisisKeywords(textToSend);
    if (scan.isCrisis) {
      setCrisisBanner({ active: true, keywords: scan.matchedKeywords });
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trigger_crisis",
          trigger_source: "keyword_watcher",
          matched_keywords: scan.matchedKeywords,
          detection_latency_ms: scan.latencyMs,
          pseudonym: studentName,
        }),
      }).catch(() => {});
    }

    setIsSending(true);
    if (!presetText) {
      setMessageInput("");
    }

    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_live_chat",
          ticket_code: activeTicketCode || undefined,
          sender_role: "mahasiswa",
          sender_name: studentName,
          nim: isAnonymous ? "ANONIM" : studentIdentifier,
          is_anonymous: isAnonymous,
          prodi_id: studentProdi,
          category: selectedCategory,
          modality_selected: selectedModality,
          emotional_condition: `Konsultasi Langsung Admin (${selectedCategory})`,
          message: textToSend,
          simulate_counselor_reply: false,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.ticket_code && data.ticket_code !== activeTicketCode) {
          setActiveTicketCode(data.ticket_code);
        }
        if (data.ticket?.meet_link) {
          setActiveMeetLink(data.ticket.meet_link);
        }
        setLocalMessages((prev) => {
          const updated = [...prev, data.message];
          if (data.autoReply) updated.push(data.autoReply);
          return updated;
        });
        onDataChanged();
      }
    } finally {
      setIsSending(false);
    }
  };

  const quickConsultationStarters = [
    "Halo Admin BK, saya ingin konsultasi langsung mengenai masalah akademik / bimbingan kuliah saya.",
    "Halo Admin BK, akhir-akhir ini saya merasa cemas / overthinking dan butuh teman cerita.",
    "Halo Admin BK, apakah saya bisa konsultasi melalui Google Meet atau Tatap Muka di Ruang BK?",
    "Halo Admin BK, saya butuh saran mengenai masalah relasi sosial dan adaptasi di kampus.",
  ];

  return (
    <div className="space-y-6">
      {/* Top Hero Banner: Ruang Konsultasi Langsung ke Admin BK */}
      <div className="clay-hero-peach rounded-[30px] p-6 border-2 border-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FCFBF8] p-1.5 shadow-md border-2 border-white">
              <img
                src="/logo-narasa.jpg"
                alt="NARASA"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-0.5 text-[11px] font-extrabold text-white shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                  ADMIN BK ONLINE • SIAP KONSULTASI LANGSUNG
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-0.5 text-[11px] font-bold text-[#2E7D67]">
                  <Lock className="h-3 w-3" />
                  Privasi Terenkripsi AES-256
                </span>
              </div>
              <h2 className="mt-1.5 text-xl sm:text-2xl font-extrabold text-[#2D2A26]">
                Ruang Konsultasi Langsung dengan Admin BK NARASA
              </h2>
              <p className="text-xs text-[#5F544E] mt-0.5">
                Tanpa harus melewati tahapan kuesioner bot—sampaikan langsung
                keluhan atau pertanyaanmu kepada{" "}
                <strong>Admin Utama BK</strong> di bawah ini dan terima balasan
                secara <em>real-time</em>.
              </p>
            </div>
          </div>

          {/* Direct WhatsApp & Emergency Call to Admin BK */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`https://wa.me/6281234567801?text=${encodeURIComponent(
                `Halo Admin BK NARASA, saya ${studentName} (${studentProdi}) ingin berkonsultasi langsung.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#2EB886] hover:bg-[#259D72] px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              WhatsApp Admin BK
            </a>
            <button
              onClick={handleStartNewConsultation}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/90 hover:bg-white px-4 py-2.5 text-xs font-extrabold text-[#2D2A26] border border-white shadow-sm transition"
            >
              <PlusCircle className="h-3.5 w-3.5 text-[#EE7854]" />
              Sesi Konsultasi Baru
            </button>
          </div>
        </div>
      </div>

      {/* Crisis Alert Banner if crisis keywords detected */}
      {crisisBanner.active && (
        <div className="rounded-[26px] border-2 border-rose-500 bg-rose-50 p-5 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-extrabold text-rose-950">
                  Kamu Tidak Sendirian — Admin BK NARASA Siap Mendampingimu Sekarang
                </h3>
                <p className="text-xs text-rose-800 mt-0.5">
                  Kami mendeteksi sinyal kondisi darurat ({crisisBanner.keywords.join(", ")}). Admin BK telah menerima peringatan prioritas tinggi. Silakan hubungi nomor darurat di samping jika butuh pertolongan segera.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="tel:119"
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-rose-700"
              >
                Panggil 119 ext. 8
              </a>
              <button
                onClick={() => setCrisisBanner({ active: false, keywords: [] })}
                className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 border border-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Direct Consultation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (4 cols): Pengaturan Topik, Mode Konsultasi & Daftar Sesi Saya */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Identitas & Pilihan Mode Konsultasi ke Admin */}
          <div className="clay-card-white rounded-[28px] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#2D2A26] flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#559A87]" />
                Pengaturan Konsultasi Admin
              </h3>
              <span className="rounded-full bg-[#E1F2EC] px-2.5 py-0.5 text-[10px] font-extrabold text-[#215A49]">
                {isAnonymous ? "Mode Samaran" : `NIM ${studentIdentifier}`}
              </span>
            </div>

            <div className="rounded-2xl bg-[#F6F4EE] p-3 text-xs space-y-1">
              <div className="text-[11px] text-[#7A746B]">Identitas Anda di Layar Admin:</div>
              <div className="font-extrabold text-[#2D2A26]">{studentName}</div>
              <div className="text-[11px] font-semibold text-[#559A87]">
                {studentProdi}
              </div>
            </div>

            {/* Pilih Topik Konsultasi */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#6E665E] mb-2">
                1. Pilih Topik Konsultasi:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PROBLEM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-xl px-2.5 py-2 text-left text-[11px] font-bold transition border ${
                      selectedCategory === cat.id
                        ? "bg-[#559A87] text-white border-[#559A87] shadow-sm"
                        : "bg-[#F9F8F4] text-[#4E5A54] border-slate-200/80 hover:bg-white"
                    }`}
                  >
                    {cat.shortTitle}
                  </button>
                ))}
              </div>
            </div>

            {/* Pilih Jalur / Modalitas Konsultasi dengan Admin */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#6E665E] mb-2">
                2. Cara Konsultasi dengan Admin:
              </label>
              <div className="space-y-1.5">
                {(
                  [
                    {
                      m: "Konsultasi Chat Anonim" as ModalityChoice,
                      title: "Chat Langsung 2 Arah (Di Sini)",
                      desc: "Tanya-jawab & curhat langsung dibalas Admin BK",
                      icon: MessageCircleHeart,
                    },
                    {
                      m: "Daring - Google Meet" as ModalityChoice,
                      title: "Video Call Google Meet Admin",
                      desc: "Dapatkan link ruang Google Meet dengan Admin",
                      icon: Video,
                    },
                    {
                      m: "Tatap Muka - Ruang BK" as ModalityChoice,
                      title: "Tatap Muka di Ruang BK Kampus",
                      desc: "Ruang BK Privat Lt. 2 Gd. Layanan Mahasiswa",
                      icon: MapPin,
                    },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = selectedModality === item.m;
                  return (
                    <button
                      key={item.m}
                      type="button"
                      onClick={() => setSelectedModality(item.m)}
                      className={`w-full flex items-start gap-2.5 rounded-2xl p-3 text-left transition border ${
                        active
                          ? "bg-[#FCE8DF] border-[#EE7854] text-[#2D2A26] shadow-sm"
                          : "bg-[#F9F8F4] border-slate-200/80 text-[#5C564F] hover:bg-white"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 mt-0.5 ${
                          active ? "text-[#D9603B]" : "text-[#559A87]"
                        }`}
                      />
                      <div>
                        <div className="text-xs font-extrabold">{item.title}</div>
                        <div className="text-[10.5px] opacity-80">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: Riwayat Sesi Konsultasi Saya */}
          <div className="clay-card-white rounded-[28px] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6E665E]">
                Riwayat Sesi Konsultasi ({myTickets.length})
              </h3>
              <button
                onClick={onDataChanged}
                className="text-[11px] font-bold text-[#559A87] hover:underline flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Segarkan
              </button>
            </div>

            {myTickets.length === 0 ? (
              <div className="rounded-2xl bg-[#F6F4EE] p-4 text-center text-xs text-[#7A746B]">
                Belum ada riwayat sesi. Ketik pesan di sebelah kanan untuk
                langsung memulai konsultasi dengan Admin!
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {myTickets.map((t) => {
                  const isSelected = t.ticket_code === activeTicketCode;
                  const threadMsgs = allMessages.filter(
                    (m) => m.ticket_code === t.ticket_code
                  );
                  const lastMsg = threadMsgs[threadMsgs.length - 1];
                  const repliedByAdmin = lastMsg?.sender_role === "counselor";

                  return (
                    <button
                      key={t.ticket_code}
                      onClick={() => setActiveTicketCode(t.ticket_code)}
                      className={`w-full rounded-2xl p-3 text-left transition border ${
                        isSelected
                          ? "bg-[#E1F2EC] border-[#559A87] shadow-sm"
                          : "bg-[#F9F8F4] border-slate-200/70 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-[#2D2A26]">
                          {t.ticket_code}
                        </span>
                        {repliedByAdmin ? (
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9.5px] font-extrabold text-white">
                            Dibalas Admin ✓
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9.5px] font-bold text-amber-900">
                            Menunggu Balasan
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-[#2E7D67]">
                        {t.category} • {t.modality_selected}
                      </div>
                      {lastMsg && (
                        <p className="mt-1 text-[11px] text-[#5C564F] truncate">
                          {lastMsg.sender_role === "counselor" ? "Admin: " : "Anda: "}
                          {lastMsg.message}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (8 cols): Ruang Obrolan Konsultasi Langsung 2 Arah dengan Admin */}
        <div className="lg:col-span-8">
          <div className="clay-card-white rounded-[30px] p-5 sm:p-6 flex flex-col justify-between min-h-[600px]">
            {/* Top Chat Room Header */}
            <div className="border-b border-[#ECE8DF] pb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D3EAE2] text-[#2E7D67] font-extrabold shadow-sm">
                  BK
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#2D2A26]">
                      Admin Utama BK NARASA
                    </h3>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                      Aktif Membalas Chat
                    </span>
                  </div>
                  <p className="text-xs text-[#6E665E]">
                    {activeTicketCode ? (
                      <>
                        Kode Sesi Konsultasi:{" "}
                        <strong className="text-[#2D2A26]">
                          {activeTicketCode}
                        </strong>{" "}
                        • Topik:{" "}
                        <strong>
                          {activeTicketObj?.category || selectedCategory}
                        </strong>
                      </>
                    ) : (
                      <>
                        Sesi Baru • Topik: <strong>{selectedCategory}</strong> •
                        Mode: <strong>{selectedModality}</strong>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Show Google Meet Link if Daring - Google Meet */}
              {(activeTicketObj?.meet_link || activeMeetLink) && (
                <a
                  href={activeTicketObj?.meet_link || activeMeetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 hover:bg-sky-700 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition"
                >
                  <Video className="h-3.5 w-3.5" />
                  Gabung Google Meet Admin
                </a>
              )}
            </div>

            {/* Chat Messages Stream */}
            <div className="my-4 flex-1 max-h-[370px] overflow-y-auto rounded-[24px] bg-[#F7F5EF] p-4 sm:p-5 space-y-3 border border-white shadow-inner">
              {localMessages.length === 0 ? (
                <div className="space-y-4 py-4">
                  <div className="mx-auto max-w-lg rounded-2xl bg-white p-4 border border-[#E2ECE8] shadow-sm text-center space-y-2">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#D3EAE2] text-[#2E7D67]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-extrabold text-[#2D2A26]">
                      Mulai Konsultasi Langsung dengan Admin BK
                    </h4>
                    <p className="text-xs text-[#6E665E] leading-relaxed">
                      Halo <strong>{studentName}</strong>! Kamu bisa langsung
                      mengetikkan curhatan, pertanyaan, atau permintaan jadwal
                      konsultasi di bawah ini, atau klik salah satu kalimat
                      pembuka cepat berikut:
                    </p>
                  </div>

                  {/* Quick Starter Prompts */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {quickConsultationStarters.map((starter, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendConsultationMessage(starter)}
                        className="rounded-2xl border border-[#D3EAE2] bg-white hover:bg-[#EBF7F3] p-3 text-left text-xs font-semibold text-[#2D2A26] shadow-sm transition flex items-start gap-2"
                      >
                        <MessageCircleHeart className="h-4 w-4 shrink-0 text-[#559A87] mt-0.5" />
                        <span>&ldquo;{starter}&rdquo;</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                localMessages.map((msg) => {
                  const isMe = msg.sender_role === "mahasiswa";
                  const isSystem = msg.sender_role === "system";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMe
                          ? "items-end"
                          : isSystem
                          ? "items-center"
                          : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-[#7A746B]">
                          {isMe
                            ? `${msg.sender_name} (Anda)`
                            : isSystem
                            ? msg.sender_name
                            : `${msg.sender_name} • Admin BK`}
                        </span>
                        <span className="text-[10px] text-[#9C958B]">
                          •{" "}
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString(
                                "id-ID",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "Baru saja"}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                          isMe
                            ? "rounded-br-none bg-[#EE7854] text-white font-medium"
                            : isSystem
                            ? "bg-amber-50 border border-amber-200 text-amber-900 text-center text-xs"
                            : "rounded-bl-none bg-white border-2 border-[#BCE0D4] text-[#1D4E3E] font-semibold"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Bottom Message Composer */}
            <div className="space-y-2.5 pt-2 border-t border-[#ECE8DF]">
              <div className="flex gap-2.5">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendConsultationMessage();
                    }
                  }}
                  placeholder="Tulis pesan atau curhatan konsultasi langsung ke Admin BK (Tekan Enter untuk kirim)..."
                  className="flex-1 rounded-2xl bg-[#F3F0E8] border border-white px-4 py-3.5 text-xs sm:text-sm font-medium text-[#2D2A26] placeholder-[#969086] shadow-inner focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#559A87]/40"
                />
                <button
                  type="button"
                  disabled={isSending || !messageInput.trim()}
                  onClick={() => handleSendConsultationMessage()}
                  className="clay-btn-coral rounded-2xl px-6 py-3.5 text-xs sm:text-sm font-extrabold text-white flex items-center gap-2 transition disabled:opacity-45"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSending ? "Mengirim..." : "Kirim ke Admin"}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#7A746B] px-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#2EB886]" />
                  Pesan Anda langsung masuk ke menu{" "}
                  <strong>Balas Chat Mahasiswa</strong> di Dashboard Admin BK.
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Sinkronisasi Real-Time Aktif (2 detik)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

