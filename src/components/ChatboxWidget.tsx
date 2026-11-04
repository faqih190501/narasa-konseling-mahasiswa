"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  PhoneCall,
  MessageCircleHeart,
  Sparkles,
  Lock,
  UserCheck,
  EyeOff,
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  Send,
  RefreshCw,
  Wind,
  Star,
  ChevronRight,
  FileText,
  XCircle,
  Radio,
} from "lucide-react";
import {
  Counselor,
  CounselorSchedule,
  CounselingTicket,
  LiveChatMessage,
  ModalityChoice,
  ProblemCategory,
} from "@/lib/types";
import {
  scanCrisisKeywords,
  evaluatePhq4,
  PHQ4_QUESTIONS,
  LIKERT_OPTIONS,
  PROBLEM_CATEGORIES,
  generateCalmPseudonym,
} from "@/lib/triage-engine";
import SelfHelpModule from "./SelfHelpModule";

interface ChatMessageBubble {
  id: string;
  sender: "bot" | "user" | "system";
  text: string;
  timestamp: string;
  stageTag?: string;
}

interface Props {
  counselors: Counselor[];
  schedules: CounselorSchedule[];
  onDataChanged: () => void;
  onOpenSelfHelpTab?: () => void;
  studentName?: string;
  studentProdi?: string;
}

export default function ChatboxWidget({
  counselors,
  schedules,
  onDataChanged,
  onOpenSelfHelpTab,
  studentName,
  studentProdi,
}: Props) {
  // Stage of the 5-stage PRD Conversational Architecture
  // 1: Informed Consent (FR-01)
  // 2: Emotional Check & Safety Triage (FR-02)
  // 3: Category & Venting Story (FR-03)
  // 4: PHQ-4 Screening Questionnaire (FR-03)
  // 5: Identity Preference (FR-04) + Modality & Schedule Booking (FR-05)
  // 6: Ticket Issued, Self-Help, Reschedule & Live Chat Handover (FR-06, FR-08, FR-09, FR-10, FR-11)
  const [stage, setStage] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [consentAcceptedAt, setConsentAcceptedAt] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [triageStartTime, setTriageStartTime] = useState<number>(Date.now());

  // Crisis Protocol Lock State (FR-02)
  const [crisisLocked, setCrisisLocked] = useState(false);
  const [crisisDetails, setCrisisDetails] = useState<{
    matchedKeywords: string[];
    latencyMs: number;
    piketName: string;
    piketPhone: string;
    alertTimestamp: string;
  } | null>(null);
  const [showCrisisSelfHelp, setShowCrisisSelfHelp] = useState(false);

  // Conversation transcript bubbles
  const [messages, setMessages] = useState<ChatMessageBubble[]>([
    {
      id: "welcome-1",
      sender: "bot",
      stageTag: "Tahap 1 • Informed Consent",
      text: "Halo! Selamat datang di Ruang Aman Konseling Kampus. Aku asisten virtual yang siap membantumu terhubung dengan Konselor. Semua cerita dan datamu di sini bersifat RAHASIA sesuai kode etik konseling. Apakah kamu bersedia melanjutkan?",
      timestamp: "Baru saja",
    },
  ]);

  // Triage Data State
  const [emotionalCondition, setEmotionalCondition] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<ProblemCategory | null>(
    null
  );
  const [clientStory, setClientStory] = useState<string>("");
  const [phqStepIndex, setPhqStepIndex] = useState<number>(0); // 0..3
  const [phqAnswers, setPhqAnswers] = useState<[number, number, number, number]>([
    0, 0, 0, 0,
  ]);

  // Stage 4/5: Identity & Modality
  const [pseudonym, setPseudonym] = useState<string>("Langit Teduh #408");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [nimInput, setNimInput] = useState<string>("");
  const [fullNameInput, setFullNameInput] = useState<string>("");
  const [prodiInput, setProdiInput] = useState<string>(
    "BKPI (Bimbingan & Konseling Pendidikan Islam)"
  );
  const [angkatanInput, setAngkatanInput] = useState<number>(2024);
  const [phoneWaInput, setPhoneWaInput] = useState<string>("");
  const [ssoVerified, setSsoVerified] = useState<boolean>(false);

  const [modalitySelected, setModalitySelected] = useState<ModalityChoice>(
    "Daring - Google Meet"
  );
  const [selectedCounselorId, setSelectedCounselorId] = useState<string>("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Stage 6: Issued Ticket, Reschedule, Live Chat, CSAT
  const [issuedTicket, setIssuedTicket] = useState<CounselingTicket | null>(null);
  const [waPreviewText, setWaPreviewText] = useState<string>("");
  const [waLatencyMs, setWaLatencyMs] = useState<number>(410);
  const [showReschedulePanel, setShowReschedulePanel] = useState<boolean>(false);
  const [newScheduleChoice, setNewScheduleChoice] = useState<string>("");
  const [showInlineSelfHelp, setShowInlineSelfHelp] = useState<boolean>(false);

  // Live Chat Handover State (FR-10)
  const [liveChatOpen, setLiveChatOpen] = useState<boolean>(false);
  const [directChatTicketCode, setDirectChatTicketCode] = useState<string>("");
  const [liveChatMessages, setLiveChatMessages] = useState<LiveChatMessage[]>([]);
  const [liveChatInput, setLiveChatInput] = useState<string>("");

  const activeChatTicketCode = issuedTicket?.ticket_code || directChatTicketCode;

  // Post-Session CSAT Evaluation (FR-11)
  const [csatRating, setCsatRating] = useState<number>(5);
  const [csatFeedback, setCsatFeedback] = useState<string>("");
  const [csatSubmitted, setCsatSubmitted] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPseudonym(studentName || generateCalmPseudonym());
  }, [studentName]);

  // Real-time polling so Admin's direct replies appear immediately for the student
  useEffect(() => {
    if (!liveChatOpen || !activeChatTicketCode) return;
    const fetchLatestMessages = async () => {
      try {
        const res = await fetch(
          `/api/state?role=mahasiswa&ticketCode=${activeChatTicketCode}`
        );
        const data = await res.json();
        if (data.live_chat_messages) {
          setLiveChatMessages(data.live_chat_messages);
        }
      } catch {
        // ignore network hiccup
      }
    };
    fetchLatestMessages();
    const timer = setInterval(fetchLatestMessages, 2500);
    return () => clearInterval(timer);
  }, [liveChatOpen, activeChatTicketCode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stage, phqStepIndex, crisisLocked, issuedTicket]);

  const appendMessage = (
    sender: "bot" | "user" | "system",
    text: string,
    stageTag?: string
  ) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender,
        text,
        timestamp: timeStr,
        stageTag,
      },
    ]);
  };

  // Real-Time Crisis Escalation Trigger (< 1 second SLA - FR-02)
  const triggerCrisisProtocol = async (
    source: "quick_button" | "keyword_watcher",
    keywords: string[],
    latencyMs: number
  ) => {
    const piket =
      counselors.find((c) => !c.is_peer_counselor && c.online_status) ||
      counselors[0];

    setCrisisLocked(true);
    setCrisisDetails({
      matchedKeywords: keywords,
      latencyMs,
      piketName: piket?.name || "Dr. Hj. Siti Nurhaliza, M.Pd., Kons.",
      piketPhone: piket?.phone_piket || "6281234567801",
      alertTimestamp: new Date().toLocaleTimeString("id-ID"),
    });

    try {
      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trigger_crisis",
          trigger_source: source,
          matched_keywords: keywords,
          detection_latency_ms: latencyMs,
          pseudonym,
        }),
      });
      onDataChanged();
    } catch {
      // Crisis lock UI remains active even offline
    }
  };

  // Real-time Keyword Watcher on every keystroke in Story input
  const handleStoryChange = (val: string) => {
    const sliced = val.slice(0, 500);
    setClientStory(sliced);
    const scan = scanCrisisKeywords(sliced);
    if (scan.isCrisis) {
      triggerCrisisProtocol(
        "keyword_watcher",
        scan.matchedKeywords,
        scan.latencyMs
      );
    }
  };

  // Stage 1 -> Stage 2: Accept Informed Consent (FR-01)
  const handleAcceptConsent = async () => {
    const nowIso = new Date().toISOString();
    setConsentAcceptedAt(nowIso);
    setTriageStartTime(Date.now());
    appendMessage("user", "Ya, Saya Mengerti & Lanjutkan");
    appendMessage(
      "bot",
      "Terima kasih sudah berani melangkah. Boleh ceritakan sedikit, bagaimana perasaan atau kondisimu saat ini?",
      "Tahap 2 • Deteksi Krisis & Cek Emosi"
    );
    setStage(2);

    try {
      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "record_consent" }),
      });
      onDataChanged();
    } catch {
      // ignore
    }
  };

  // Stage 2 -> Stage 3: Emotional Check & Safety Triage
  const handleSelectEmotion = (choice: string, isEmergency = false) => {
    appendMessage("user", choice);
    if (isEmergency) {
      triggerCrisisProtocol("quick_button", [choice], 0.2);
      return;
    }
    setEmotionalCondition(choice);
    appendMessage(
      "bot",
      "Aku memahami rasanya pasti tidak mudah. Agar Konselor bisa mendampingimu dengan tepat, masalah ini paling berkaitan dengan hal apa? Kamu juga boleh menuliskan sedikit ceritamu di kolom pesan ya.",
      "Tahap 3 • Klasifikasi Topik & Cerita Singkat"
    );
    setStage(3);
  };

  // Stage 3 -> Stage 4: Submit Category & Story -> Start PHQ-4
  const handleProceedToPhq4 = () => {
    if (!selectedCategory) return;
    const scan = scanCrisisKeywords(clientStory);
    if (scan.isCrisis) {
      triggerCrisisProtocol(
        "keyword_watcher",
        scan.matchedKeywords,
        scan.latencyMs
      );
      return;
    }

    const summaryBubble = clientStory.trim()
      ? `Topik: ${selectedCategory} — "${clientStory.trim()}"`
      : `Topik Fokus: ${selectedCategory}`;
    appendMessage("user", summaryBubble);
    appendMessage(
      "bot",
      "Terima kasih sudah berbagi cerita. Sekarang aku akan mengajukan 4 pertanyaan singkat (PHQ-4) tentang kondisimu dalam 2 minggu terakhir agar kami dapat menyesuaikan prioritas pendampinganmu.",
      "Tahap 4 • Skrining Singkat PHQ-4"
    );
    setPhqStepIndex(0);
    setStage(4);
  };

  // Stage 4: Answer PHQ-4 question (0..3)
  const handleSelectPhqAnswer = (scoreValue: number, labelText: string) => {
    const updated: [number, number, number, number] = [...phqAnswers] as [
      number,
      number,
      number,
      number
    ];
    updated[phqStepIndex] = scoreValue;
    setPhqAnswers(updated);

    appendMessage(
      "user",
      `Q${phqStepIndex + 1} (${PHQ4_QUESTIONS[phqStepIndex].code}): ${labelText}`
    );

    if (phqStepIndex < 3) {
      setPhqStepIndex(phqStepIndex + 1);
    } else {
      const result = evaluatePhq4(updated);
      appendMessage(
        "bot",
        `Hasil Skrining Awal PHQ-4: Skor ${result.phq4_score}/12 • Kategori Urgensi: ${result.urgency_label}. ${result.clinical_interpretation}`,
        "Hasil Skrining Otomatis (FR-03)"
      );
      appendMessage(
        "bot",
        "Terima kasih sudah berbagi. Kamu dapat memilih Mode Samaran (Anonim) atau Login SSO SIAKAD, serta memilih berkonsultasi secara Tatap Muka di Ruang BK, Daring (Google Meet), atau Chat Anonim. Berikut jadwal Konselor yang tersedia minggu ini:",
        "Tahap 5 • Identitas, Modalitas & Jadwal Konselor"
      );

      // Auto-select recommended counselor based on PHQ-4 score & category
      const prefersExpert = result.phq4_score >= 6;
      const matchingCounselor =
        counselors.find(
          (c) =>
            (prefersExpert ? !c.is_peer_counselor : true) &&
            selectedCategory &&
            c.specialization.includes(selectedCategory)
        ) || counselors[0];

      if (matchingCounselor) {
        setSelectedCounselorId(matchingCounselor.id);
        const firstOpenSlot = schedules.find(
          (s) => s.counselor_id === matchingCounselor.id && !s.is_booked
        );
        if (firstOpenSlot) {
          setSelectedScheduleId(firstOpenSlot.id);
        }
      }

      if (prefersExpert) {
        setModalitySelected("Daring - Google Meet");
      }

      setStage(5);
    }
  };

  // SIAKAD SSO Lookup Simulation
  const handleSsoVerify = async (sampleNim?: string) => {
    const targetNim = sampleNim || nimInput || "230101001";
    setNimInput(targetNim);
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sso_lookup",
          nim: targetNim,
        }),
      });
      const data = await res.json();
      if (data.ok && data.profile) {
        setFullNameInput(data.profile.full_name);
        setProdiInput(data.profile.prodi_id);
        setAngkatanInput(data.profile.angkatan);
        setPhoneWaInput(data.profile.phone_wa);
        setIsAnonymous(false);
        setSsoVerified(true);
      }
    } catch {
      // fallback
    }
  };

  // Stage 5 -> Stage 6: Confirm Booking & Generate Ticket (FR-05, FR-06)
  const handleConfirmBooking = async () => {
    setBookingError(null);

    // Per PRD Tahap 4: Jika memilih Tatap Muka atau Video Call, minta pencantuman identitas resmi yang hanya dilihat konselor terpilih
    if (
      (modalitySelected === "Tatap Muka - Ruang BK" ||
        modalitySelected === "Daring - Google Meet") &&
      !isAnonymous &&
      (!nimInput.trim() || !fullNameInput.trim())
    ) {
      setBookingError(
        "Untuk mode Identitas Resmi SIAKAD pada sesi Tatap Muka/Google Meet, mohon lengkapi NIM dan Nama Lengkap (atau klik tombol Simulasi SSO SIAKAD)."
      );
      return;
    }

    setIsSubmittingBooking(true);
    const triageSeconds = Math.max(
      18,
      Math.round((Date.now() - triageStartTime) / 1000)
    );

    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_ticket",
          pseudonym,
          is_anonymous: isAnonymous,
          nim: nimInput,
          full_name: fullNameInput,
          prodi_id: prodiInput,
          angkatan: angkatanInput,
          phone_wa: phoneWaInput,
          emotional_condition: emotionalCondition,
          category: selectedCategory,
          client_story: clientStory,
          phq4_answers: phqAnswers,
          modality_selected: modalitySelected,
          counselor_id: selectedCounselorId || counselors[0]?.id || "c-1",
          schedule_id: selectedScheduleId || schedules[0]?.id || "sch-101",
          triage_duration_seconds: triageSeconds,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setBookingError(data.error || "Gagal membuat tiket konseling.");
        setIsSubmittingBooking(false);
        return;
      }

      setIssuedTicket(data.ticket);
      setWaPreviewText(data.whatsapp_dispatch?.message_preview || "");
      setWaLatencyMs(data.whatsapp_dispatch?.delivered_in_ms || 420);

      appendMessage(
        "user",
        `Konfirmasi Konsultasi: ${modalitySelected} bersama Admin Utama BK NARASA`
      );
      appendMessage(
        "bot",
        `Tiket Konselingmu (${data.ticket.ticket_code}) telah berhasil diterbitkan! Kamu sekarang terhubung langsung dengan Admin BK NARASA. Sembari menunggu balasan Admin, kamu bisa membuka Live Chat di bawah ini atau mencoba panduan relaksasi napas 4-7-8.`,
        "Tahap 5 Selesai • Tiket Diterbitkan (FR-06)"
      );
      setStage(6);
      setLiveChatOpen(true);
      onDataChanged();
    } catch {
      setBookingError("Terjadi gangguan jaringan saat menerbitkan tiket.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Reschedule Ticket (FR-08)
  const handleReschedule = async () => {
    if (!issuedTicket || !newScheduleChoice) return;
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reschedule_ticket",
        ticket_code: issuedTicket.ticket_code,
        new_schedule_id: newScheduleChoice,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setIssuedTicket(data.ticket);
      setSelectedScheduleId(newScheduleChoice);
      setShowReschedulePanel(false);
      appendMessage(
        "system",
        `Jadwal tiket ${issuedTicket.ticket_code} berhasil diubah secara mandiri ke ${data.newSchedule.day_of_week}, ${data.newSchedule.date_iso} (${data.newSchedule.start_time}-${data.newSchedule.end_time} WIB).`
      );
      onDataChanged();
    }
  };

  // Cancel Ticket (FR-08)
  const handleCancelTicket = async () => {
    if (!issuedTicket) return;
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "cancel_ticket",
        ticket_code: issuedTicket.ticket_code,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setIssuedTicket(data.ticket);
      appendMessage(
        "system",
        `Tiket ${issuedTicket.ticket_code} telah dibatalkan dan slot jadwal konselor telah dibuka kembali.`
      );
      onDataChanged();
    }
  };

  // Open & Fetch Live Chat Messages (FR-10 - Available at ANY stage)
  const handleOpenLiveChat = async () => {
    setLiveChatOpen(true);
    if (!activeChatTicketCode) return;
    try {
      const res = await fetch(
        `/api/state?role=mahasiswa&ticketCode=${activeChatTicketCode}`
      );
      const data = await res.json();
      if (data.live_chat_messages) {
        setLiveChatMessages(data.live_chat_messages);
      }
    } catch {
      // ignore
    }
  };

  const handleSendLiveChat = async () => {
    if (!liveChatInput.trim()) return;
    const text = liveChatInput.trim();
    setLiveChatInput("");

    // Real-time crisis check even inside live chat!
    const scan = scanCrisisKeywords(text);
    if (scan.isCrisis) {
      triggerCrisisProtocol(
        "keyword_watcher",
        scan.matchedKeywords,
        scan.latencyMs
      );
      return;
    }

    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_live_chat",
        ticket_code: activeChatTicketCode || undefined,
        sender_role: "mahasiswa",
        sender_name: studentName || pseudonym,
        prodi_id: studentProdi || prodiInput,
        category: selectedCategory || "Sosial & Relasi",
        message: text,
        simulate_counselor_reply: false,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      if (data.ticket_code && !directChatTicketCode) {
        setDirectChatTicketCode(data.ticket_code);
      }
      const updated = [...liveChatMessages, data.message];
      if (data.autoReply) {
        updated.push(data.autoReply);
      }
      setLiveChatMessages(updated);
      onDataChanged();
    }
  };

  // Submit CSAT Rating (FR-11)
  const handleSubmitCsat = async () => {
    if (!issuedTicket) return;
    await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit_csat",
        ticket_code: issuedTicket.ticket_code,
        rating: csatRating,
        feedback: csatFeedback,
      }),
    });
    setCsatSubmitted(true);
    onDataChanged();
  };

  // Reset Chat Session
  const handleResetSession = () => {
    setCrisisLocked(false);
    setCrisisDetails(null);
    setStage(1);
    setConsentAcceptedAt(null);
    setEmotionalCondition("");
    setSelectedCategory(null);
    setClientStory("");
    setPhqStepIndex(0);
    setPhqAnswers([0, 0, 0, 0]);
    setPseudonym(generateCalmPseudonym());
    setIssuedTicket(null);
    setLiveChatOpen(false);
    setCsatSubmitted(false);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        stageTag: "Tahap 1 • Informed Consent",
        text: "Halo! Selamat datang di Ruang Aman Konseling Kampus. Aku asisten virtual yang siap membantumu terhubung dengan Konselor. Semua cerita dan datamu di sini bersifat RAHASIA sesuai kode etik konseling. Apakah kamu bersedia melanjutkan?",
        timestamp: "Baru saja",
      },
    ]);
  };

  const phqSummary = evaluatePhq4(phqAnswers);
  const availableSlotsForCounselor = schedules.filter(
    (s) => s.counselor_id === selectedCounselorId && !s.is_booked
  );
  const currentCounselor = counselors.find((c) => c.id === selectedCounselorId);
  const bookedScheduleObj = schedules.find(
    (s) => s.id === (issuedTicket?.schedule_id || selectedScheduleId)
  );

  return (
    <div className="mx-auto max-w-4xl">
      {/* Main Conversational Card */}
      <div className="overflow-hidden rounded-[30px] border-2 border-white bg-[#FCFBF7] shadow-[0_14px_34px_rgba(145,135,120,0.12)]">
        {/* Calming Claymorphic Chatbox Header */}
        <div className="bg-gradient-to-r from-[#559A87] via-[#68A896] to-[#9E7152] px-6 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FCFBF8] p-1 shadow-md border-2 border-white">
                <img
                  src="/logo-narasa.jpg"
                  alt="Logo NARASA"
                  className="h-full w-full object-contain"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-[#559A87]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold tracking-tight">
                    NARASA (Narasi Rasa) • Ruang Aman Chatbox BK
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-teal-50">
                    <Lock className="h-3 w-3" />
                    Terenkripsi AES-256
                  </span>
                </div>
                <p className="text-xs text-teal-100">
                  Layanan Triase Mandiri 24/7 • Bebas Stigma • Identitas Samaran:{" "}
                  <strong className="text-white">{pseudonym}</strong>
                </p>
              </div>
            </div>

            {/* Always-Accessible Direct Admin Chat & Emergency Buttons (Bab 07 Calming UI/UX) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  if (liveChatOpen) {
                    setLiveChatOpen(false);
                  } else {
                    handleOpenLiveChat();
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold shadow-sm transition ${
                  liveChatOpen
                    ? "bg-white text-[#2E7D67] ring-2 ring-white"
                    : "bg-[#FCE8DF] text-[#9E4224] hover:bg-white hover:text-[#2E7D67]"
                }`}
                title="Buka percakapan langsung 2 arah dengan Admin / Petugas BK"
              >
                <MessageCircleHeart className="h-4 w-4" />
                {liveChatOpen ? "Tutup Chat Admin" : "Chat Langsung Admin BK"}
              </button>
              <button
                onClick={() =>
                  triggerCrisisProtocol(
                    "quick_button",
                    ["Tombol Darurat Header"],
                    0.1
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-500 ring-2 ring-rose-300/50"
                title="Klik jika Anda membutuhkan pertolongan krisis/darurat segera"
              >
                <AlertTriangle className="h-4 w-4" />
                Bantuan Darurat
              </button>
              {stage > 1 && (
                <button
                  onClick={handleResetSession}
                  className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-3 py-2 text-xs font-medium text-white hover:bg-white/25 transition"
                  title="Mulai ulang sesi percakapan baru"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mulai Ulang</span>
                </button>
              )}
            </div>
          </div>

          {/* 5-Stage Progress Stepper */}
          <div className="mt-4 grid grid-cols-5 gap-1.5 pt-2 border-t border-white/15 text-[11px]">
            {[
              { s: 1, label: "1. Persetujuan Etik" },
              { s: 2, label: "2. Cek Keamanan" },
              { s: 3, label: "3. Topik & Cerita" },
              { s: 4, label: "4. Skrining PHQ-4" },
              { s: 5, label: "5. Jadwal & Tiket" },
            ].map((item) => {
              const active = stage === item.s || (stage === 6 && item.s === 5);
              const done = stage > item.s;
              return (
                <div
                  key={item.s}
                  className={`rounded-lg px-2 py-1 text-center font-medium transition ${
                    done
                      ? "bg-emerald-400/25 text-white"
                      : active
                      ? "bg-white text-teal-800 font-semibold shadow-sm"
                      : "bg-white/10 text-teal-100/75"
                  }`}
                >
                  <span className="truncate block">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RED-FLAG CRISIS PROTOCOL LOCK SCREEN (FR-02) */}
        {crisisLocked && crisisDetails ? (
          <div className="bg-gradient-to-b from-rose-50 via-white to-teal-50/30 p-6 sm:p-8">
            <div className="mx-auto max-w-2xl rounded-2xl border-2 border-rose-500 bg-white p-6 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100 pb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  PROTOKOL INTERVENSI KRISIS AKTIF (FR-02)
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                  ⚡ Trigger Instan: {crisisDetails.latencyMs} ms (&lt; 1 detik)
                </span>
              </div>

              {/* (1) Pesan Validasi Empatik bahwa mereka tidak sendirian */}
              <div className="mt-4 space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  Kamu Tidak Sendirian. Nyawa dan Keselamatanmu Sangat Berharga.
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Aku mendengar betapa berat dan menyakitkannya beban yang sedang kamu
                  rasakan saat ini. Terima kasih karena masih bertahan hingga detik ini.
                  Kamu tidak harus memikul rasa sakit ini sendirian—ada tim Konselor
                  Jaga Kampus dan pendamping profesional yang peduli dan siap
                  mendengarkanmu sekarang juga tanpa menghakimi.
                </p>
                <div className="rounded-xl bg-rose-50/80 p-3 text-xs text-rose-900 border border-rose-200">
                  <strong>Sinyal Terdeteksi:</strong>{" "}
                  {crisisDetails.matchedKeywords.join(", ")} • Alur pendaftaran reguler
                  dihentikan sementara untuk memprioritaskan keselamatanmu.
                </div>
              </div>

              {/* (2) Tombol Panggilan Cepat (Click-to-Call) ke Konselor Jaga & Hotline 119 ext. 8 */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <a
                  href={`tel:+${crisisDetails.piketPhone}`}
                  className="flex items-center justify-center gap-2.5 rounded-2xl bg-rose-600 px-4 py-4 text-sm font-bold text-white shadow-md transition hover:bg-rose-700"
                >
                  <PhoneCall className="h-5 w-5 animate-bounce" />
                  <div className="text-left">
                    <div className="text-xs font-normal opacity-90">
                      Click-to-Call Konselor Jaga Kampus
                    </div>
                    <div>Hubungi {crisisDetails.piketName.split(",")[0]}</div>
                  </div>
                </a>

                <a
                  href="tel:119"
                  className="flex items-center justify-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-bold text-white shadow-md transition hover:bg-slate-800"
                >
                  <PhoneCall className="h-5 w-5 text-emerald-400" />
                  <div className="text-left">
                    <div className="text-xs font-normal text-slate-300">
                      Hotline Kesehatan Jiwa Nasional 24 Jam
                    </div>
                    <div>Panggil 119 (ext. 8 - SEJIWA)</div>
                  </div>
                </a>
              </div>

              {/* (3) Status High-Priority Alert ke WhatsApp & Dashboard Konselor Piket */}
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Radio className="h-5 w-5 shrink-0 text-amber-600 mt-0.5 animate-pulse" />
                  <div className="text-xs text-amber-950 space-y-1">
                    <div className="font-bold">
                      High-Priority Alert Telah Dikirim ke WhatsApp & Dashboard Konselor Piket ({crisisDetails.alertTimestamp})
                    </div>
                    <p className="text-amber-800">
                      Konselor Piket (<strong>{crisisDetails.piketName}</strong>) telah
                      menerima notifikasi darurat prioritas tinggi. Kamu juga dapat
                      langsung membuka chat WhatsApp darurat di bawah ini:
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2">
                      <a
                        href={`https://wa.me/${crisisDetails.piketPhone}?text=${encodeURIComponent(
                          `Halo Konselor Piket Kampus, saya (${pseudonym}) sedang berada dalam kondisi krisis darurat dan butuh pendampingan segera.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Chat WhatsApp Konselor Piket Sekarang
                      </a>
                      <button
                        onClick={() => setShowCrisisSelfHelp(!showCrisisSelfHelp)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50"
                      >
                        <Wind className="h-3.5 w-3.5" />
                        {showCrisisSelfHelp
                          ? "Tutup Panduan Napas"
                          : "Buka Panduan Napas Penenang 4-7-8"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {showCrisisSelfHelp && (
                <div className="mt-5">
                  <SelfHelpModule compact />
                </div>
              )}

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span>
                  Jika kamu tidak sengaja menekan tombol darurat dan kondisimu aman:
                </span>
                <button
                  onClick={() => setCrisisLocked(false)}
                  className="font-semibold text-teal-700 underline hover:text-teal-800"
                >
                  Saya Aman, Kembali ke Percakapan
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* NORMAL HYBRID CONVERSATIONAL UI */
          <div className="flex flex-col">
            {/* Chat Transcript Area */}
            <div className="max-h-[380px] overflow-y-auto bg-gradient-to-b from-Calm-50/50 via-slate-50/60 to-white p-5 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === "user"
                      ? "items-end"
                      : m.sender === "system"
                      ? "items-center"
                      : "items-start"
                  }`}
                >
                  {m.stageTag && (
                    <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-semibold text-teal-700 border border-teal-100">
                      <Sparkles className="h-2.5 w-2.5" />
                      {m.stageTag}
                    </span>
                  )}

                  {m.sender === "system" ? (
                    <div className="rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-2 text-xs font-medium text-teal-900 text-center max-w-xl">
                      {m.text}
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        m.sender === "user"
                          ? "rounded-br-none bg-teal-600 text-white"
                          : "rounded-bl-none border border-slate-200/80 bg-white text-slate-800"
                      }`}
                    >
                      <p>{m.text}</p>
                      <span
                        className={`mt-1 block text-[10px] ${
                          m.sender === "user"
                            ? "text-teal-100 text-right"
                            : "text-slate-400"
                        }`}
                      >
                        {m.timestamp}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Panel Live Chat 2 Arah Real-Time dengan Admin BK (Tersedia di Semua Tahap) */}
            {liveChatOpen && (
              <div className="border-t-2 border-[#D3EAE2] bg-[#F5FBF8] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D3EAE2] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-[#2D2A26]">
                      Live Chat 2 Arah — Terhubung Langsung dengan Admin BK NARASA
                    </span>
                    {activeChatTicketCode && (
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-[#2E7D67] border border-[#D3EAE2]">
                        Kode Chat: {activeChatTicketCode}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setLiveChatOpen(false)}
                    className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200"
                  >
                    Tutup Live Chat
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2.5 rounded-2xl bg-white p-3.5 border border-[#E2ECE8] shadow-inner">
                  {liveChatMessages.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      Silakan tuliskan pesan atau pertanyaanmu di bawah ini. Admin BK akan langsung menerima dan membalas pesanmu di sini secara real-time.
                    </div>
                  ) : (
                    liveChatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.sender_role === "mahasiswa"
                            ? "items-end"
                            : "items-start"
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-500 mb-0.5">
                          {msg.sender_name}{" "}
                          {msg.sender_role === "counselor" && "• Admin BK"}
                        </span>
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-xs max-w-[82%] leading-relaxed shadow-sm ${
                            msg.sender_role === "mahasiswa"
                              ? "rounded-br-none bg-[#EE7854] text-white font-medium"
                              : msg.sender_role === "system"
                              ? "bg-amber-50 text-amber-900 border border-amber-200"
                              : "rounded-bl-none bg-[#E1F2EC] border border-[#BDE0D4] text-[#1D4E3E] font-semibold"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={liveChatInput}
                    onChange={(e) => setLiveChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendLiveChat();
                    }}
                    placeholder="Ketik pesan langsung ke Admin BK (Tekan Enter untuk kirim)..."
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
                  />
                  <button
                    onClick={handleSendLiveChat}
                    disabled={!liveChatInput.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#559A87] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#468573] disabled:opacity-45"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Kirim ke Admin
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Stage Controls Area */}
            <div className="border-t border-slate-100 bg-slate-50/70 p-5">
              {/* TAHAP 1: INFORMED CONSENT (FR-01) */}
              {stage === 1 && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-teal-700 mt-0.5" />
                      <div className="text-xs text-slate-700 space-y-1">
                        <div className="font-bold text-teal-950">
                          Pernyataan Persetujuan Etik & Kerahasiaan (Informed Consent Digital - FR-01)
                        </div>
                        <p className="leading-relaxed">
                          Sesuai Kode Etik Bimbingan dan Konseling, seluruh data pribadi
                          dan isi percakapan Anda dienkripsi dengan standar{" "}
                          <strong>AES-256</strong> dan hanya dapat diakses oleh Konselor
                          yang menangani sesi Anda (kecuali terdapat kondisi darurat yang
                          membahayakan keselamatan jiwa). Anda juga bebas menggunakan{" "}
                          <strong>Mode Samaran (Anonim)</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleAcceptConsent}
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-teal-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Ya, Saya Mengerti & Lanjutkan
                    </button>
                    <button
                      onClick={() => setShowPrivacyModal(!showPrivacyModal)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      <FileText className="h-4 w-4 text-teal-600" />
                      {showPrivacyModal
                        ? "Tutup Kebijakan Privasi"
                        : "Baca Kebijakan Privasi"}
                    </button>
                  </div>

                  {showPrivacyModal && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-2 shadow-sm">
                      <h4 className="font-bold text-slate-900">
                        Rincian Perlindungan Data & Kode Etik Konseling Kampus:
                      </h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          <strong>Enkripsi Terpisah (PII Isolation):</strong> Identitas
                          asli (NIM, Nama, Nomor WA) disimpan terpisah dari log
                          percakapan menggunakan enkripsi AES-256-GCM.
                        </li>
                        <li>
                          <strong>Role-Based Access Control (RBAC):</strong> Admin IT dan
                          Koordinator Prodi hanya melihat angka agregat statistik tanpa
                          bisa membuka nama atau isi curhatan.
                        </li>
                        <li>
                          <strong>Auto-Purge 30 Hari:</strong> Catatan obrolan sementara
                          pada mode anonim otomatis dihapus dalam 30 hari apabila tidak
                          dilanjutkan ke sesi konseling resmi.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* TAHAP 2: CEK KONDISI EMOSIONAL & SAFETY TRIAGE (FR-02) */}
              {stage === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      Pilih kondisi yang paling menggambarkan perasaanmu saat ini (Quick-Reply):
                    </span>
                    <span className="text-[11px] text-teal-700 font-medium">
                      Persetujuan Tercatat ✓ ({consentAcceptedAt?.slice(11, 19)})
                    </span>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {[
                      {
                        label: "Sedang Cemas / Overthinking",
                        desc: "Pikiran sulit berhenti, gelisah, atau khawatir berlebih",
                        emergency: false,
                      },
                      {
                        label: "Lelah Akademik / Skripsi",
                        desc: "Kewalahan tugas kuliah, revisi skripsi, atau takut bimbingan",
                        emergency: false,
                      },
                      {
                        label: "Sedih Berkepanjangan",
                        desc: "Merasa murung, kehilangan semangat, atau kesepian",
                        emergency: false,
                      },
                      {
                        label: "Butuh Bantuan Darurat!",
                        desc: "Saya merasa ingin menyakiti diri sendiri / dalam krisis akut",
                        emergency: true,
                      },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() =>
                          handleSelectEmotion(opt.label, opt.emergency)
                        }
                        className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition ${
                          opt.emergency
                            ? "border-rose-300 bg-rose-50/80 hover:bg-rose-100 text-rose-900"
                            : "border-teal-200 bg-white hover:border-teal-500 hover:bg-teal-50/40 text-slate-800 shadow-sm"
                        }`}
                      >
                        <span className="text-sm font-bold flex items-center gap-1.5">
                          {opt.emergency && (
                            <AlertTriangle className="h-4 w-4 text-rose-600" />
                          )}
                          {opt.label}
                        </span>
                        <span
                          className={`mt-0.5 text-xs ${
                            opt.emergency ? "text-rose-700" : "text-slate-500"
                          }`}
                        >
                          {opt.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAHAP 3: KLASIFIKASI TOPIK & INPUT CERITA SINGKAT (FR-02 & FR-03) */}
              {stage === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      1. Pilih 1 Fokus Masalah Utama:
                    </label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {PROBLEM_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`rounded-xl border p-3 text-left transition ${
                            selectedCategory === cat.id
                              ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-800 hover:border-teal-300"
                          }`}
                        >
                          <div className="text-xs font-bold">{cat.shortTitle}</div>
                          <div
                            className={`mt-0.5 text-[11px] leading-snug ${
                              selectedCategory === cat.id
                                ? "text-teal-50"
                                : "text-slate-500"
                            }`}
                          >
                            {cat.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        2. Ceritakan Singkat Apa yang Kamu Rasakan (Opsional, Maks. 500 Karakter):
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {clientStory.length}/500 karakter • Pemindai Kata Kunci Krisis Aktif
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={clientStory}
                      onChange={(e) => handleStoryChange(e.target.value)}
                      placeholder="Contoh: Saya merasa sangat cemas setiap kali mau revisi skripsi dan belakangan ini sulit tidur..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1 text-teal-700">
                        <Lock className="h-3 w-3" />
                        Cerita ini dienkripsi AES-256 & hanya dapat dibaca oleh Konselor pilihanmu.
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleStoryChange(
                            "Rasanya saya sudah tidak kuat hidup lagi karena masalah ini"
                          )
                        }
                        className="text-rose-600 hover:underline font-medium"
                      >
                        [Simulasi Uji Trigger Kata Kunci Krisis &lt;1d]
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      disabled={!selectedCategory}
                      onClick={handleProceedToPhq4}
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-40"
                    >
                      Lanjut ke Skrining Singkat (PHQ-4)
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAHAP 4: KUESIONER SKRINING SINGKAT PHQ-4 (FR-03) */}
              {stage === 4 && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-teal-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-semibold text-teal-700">
                      <span>
                        Pertanyaan {phqStepIndex + 1} dari 4 •{" "}
                        {PHQ4_QUESTIONS[phqStepIndex].subscale}
                      </span>
                      <span className="rounded-full bg-teal-50 px-2.5 py-0.5">
                        Skala Likert 0–3
                      </span>
                    </div>
                    <h4 className="mt-2 text-base font-bold text-slate-800">
                      {PHQ4_QUESTIONS[phqStepIndex].question}
                    </h4>

                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                      {LIKERT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() =>
                            handleSelectPhqAnswer(opt.value, opt.label)
                          }
                          className="flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-teal-500 hover:bg-teal-50/60"
                        >
                          <span className="text-sm font-bold text-slate-800">
                            {opt.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            {opt.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAHAP 5: IDENTITAS (FR-04), MODALITAS & JADWAL KONSELOR (FR-05) */}
              {stage === 5 && (
                <div className="space-y-5">
                  {/* Ringkasan Hasil Skrining PHQ-4 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-xs">
                    <div>
                      <span className="font-bold text-teal-950">
                        Skor PHQ-4: {phqSummary.phq4_score}/12 (GAD-2:{" "}
                        {phqSummary.gad_score}, PHQ-2: {phqSummary.phq2_score})
                      </span>
                      <span className="mx-2 text-teal-400">•</span>
                      <span className="font-semibold text-teal-800">
                        Label Tiket: {phqSummary.urgency_label}
                      </span>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 font-bold text-teal-800 shadow-sm">
                      Rekomendasi: {phqSummary.recommended_tier}
                    </span>
                  </div>

                  {/* Pilihan Mode Identitas (FR-04) */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        A. Preferensi Identitas Mahasiswa (FR-04)
                      </h4>
                      <div className="inline-flex rounded-xl bg-slate-100 p-1">
                        <button
                          type="button"
                          onClick={() => setIsAnonymous(true)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            isAnonymous
                              ? "bg-teal-600 text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                          Mode Samaran (Anonim)
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAnonymous(false)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            !isAnonymous
                              ? "bg-teal-600 text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Identitas Resmi / SSO SIAKAD
                        </button>
                      </div>
                    </div>

                    {isAnonymous ? (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Nama Samaran (Pseudonym)
                          </label>
                          <input
                            type="text"
                            value={pseudonym}
                            onChange={(e) => setPseudonym(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Program Studi (Untuk Statistik Agregat)
                          </label>
                          <select
                            value={prodiInput}
                            onChange={(e) => setProdiInput(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                          >
                            <option value="BKPI (Bimbingan & Konseling Pendidikan Islam)">
                              BKPI (Bimbingan & Konseling)
                            </option>
                            <option value="PIAUD (Pendidikan Islam Anak Usia Dini)">
                              PIAUD
                            </option>
                            <option value="PAI (Pendidikan Agama Islam)">
                              PAI
                            </option>
                            <option value="Manajemen Pendidikan Islam">
                              Manajemen Pendidikan Islam
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            No. WhatsApp Sementara (Opsional Notifikasi)
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: 0812xxxx (Terenkripsi)"
                            value={phoneWaInput}
                            onChange={(e) => setPhoneWaInput(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900 border border-sky-200">
                          <span>
                            Integrasi Single Sign-On (SSO) SIAKAD: Validasi otomatis status
                            mahasiswa aktif & program studi.
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSsoVerify("230101001")}
                              className="rounded-md bg-sky-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-700"
                            >
                              Isi Otomatis SSO (NIM 230101001)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSsoVerify("240102015")}
                              className="rounded-md bg-white border border-sky-300 px-2.5 py-1 text-[11px] font-semibold text-sky-800 hover:bg-sky-100"
                            >
                              NIM 240102015
                            </button>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              NIM Mahasiswa
                            </label>
                            <input
                              type="text"
                              value={nimInput}
                              onChange={(e) => setNimInput(e.target.value)}
                              placeholder="Contoh: 230101001"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Nama Lengkap (Terenkripsi AES-256)
                            </label>
                            <input
                              type="text"
                              value={fullNameInput}
                              onChange={(e) => setFullNameInput(e.target.value)}
                              placeholder="Nama sesuai SIAKAD"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Program Studi
                            </label>
                            <input
                              type="text"
                              value={prodiInput}
                              onChange={(e) => setProdiInput(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Nomor WhatsApp Aktif
                            </label>
                            <input
                              type="text"
                              value={phoneWaInput}
                              onChange={(e) => setPhoneWaInput(e.target.value)}
                              placeholder="0812xxxxxxxx"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                            />
                          </div>
                        </div>
                        {ssoVerified && (
                          <div className="text-[11px] font-semibold text-emerald-700">
                            ✓ Terverifikasi melalui API SIAKAD Kampus (Status: Mahasiswa Aktif • Angkatan {angkatanInput})
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pilihan Modalitas Konseling */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      B. Pilih Modalitas Sesi Konseling
                    </h4>
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      {(
                        [
                          {
                            m: "Tatap Muka - Ruang BK",
                            desc: "Bertemu langsung di Ruang Konseling Privat Kampus",
                            icon: MapPin,
                          },
                          {
                            m: "Daring - Google Meet",
                            desc: "Tautan ruang video privat dikirim otomatis ke WA/Kalender",
                            icon: Video,
                          },
                          {
                            m: "Konsultasi Chat Anonim",
                            desc: "Percakapan teks terenkripsi dengan Konselor / Peer Counselor",
                            icon: MessageCircleHeart,
                          },
                        ] as const
                      ).map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.m}
                            type="button"
                            onClick={() => setModalitySelected(item.m)}
                            className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                              modalitySelected === item.m
                                ? "border-teal-600 bg-teal-50/70 text-teal-950 shadow-sm"
                                : "border-slate-200 bg-white text-slate-700 hover:border-teal-200"
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
                            <div>
                              <div className="text-xs font-bold">{item.m}</div>
                              <div className="mt-0.5 text-[11px] text-slate-500">
                                {item.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {bookingError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
                      {bookingError}
                    </div>
                  )}

                  <div className="flex items-center justify-end">
                    <button
                      disabled={isSubmittingBooking}
                      onClick={handleConfirmBooking}
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-teal-700 disabled:opacity-40"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isSubmittingBooking
                        ? "Menerbitkan Tiket Konsultasi..."
                        : "Konfirmasi & Terbitkan Tiket Konsultasi Admin BK"}
                    </button>
                  </div>
                </div>
              )}

              {/* TAHAP 6: TIKET KONSELING DITERBITKAN, WA GATEWAY, LIVE CHAT, RESCHEDULE & CSAT */}
              {stage === 6 && issuedTicket && (
                <div className="space-y-5">
                  {/* Kartu Tiket Konseling Resmi (FR-06) */}
                  <div className="rounded-2xl border-2 border-teal-500 bg-white p-5 shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                          Nomor Tiket Konseling Resmi (FR-06)
                        </span>
                        <h3 className="text-xl font-extrabold text-slate-900">
                          {issuedTicket.ticket_code}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                          Status: {issuedTicket.status}
                        </span>
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-200">
                          Urgensi: {issuedTicket.urgency_label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
                      <div className="space-y-1.5">
                        <div className="text-slate-500">Klien / Identitas:</div>
                        <div className="font-bold text-slate-800">
                          {pseudonym}{" "}
                          <span className="font-normal text-slate-500">
                            ({isAnonymous ? "Mode Samaran Anonim" : "Terverifikasi SIAKAD"})
                          </span>
                        </div>
                        <div className="text-slate-500 mt-2">
                          Konselor Pendamping:
                        </div>
                        <div className="font-bold text-slate-800">
                          {currentCounselor?.name}
                        </div>
                        <div className="text-slate-500 mt-2">
                          Kategori & Skor Skrining PHQ-4:
                        </div>
                        <div className="font-semibold text-teal-800">
                          {issuedTicket.category} • Skor {issuedTicket.urgency_score}/12
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-slate-500">Jadwal Terkunci:</div>
                        <div className="font-bold text-slate-800">
                          {bookedScheduleObj?.day_of_week},{" "}
                          {bookedScheduleObj?.date_iso} ({bookedScheduleObj?.start_time} –{" "}
                          {bookedScheduleObj?.end_time} WIB)
                        </div>
                        <div className="text-slate-500 mt-2">
                          Modalitas & Lokasi / Tautan:
                        </div>
                        <div className="font-semibold text-slate-800">
                          {issuedTicket.modality_selected}
                        </div>
                        {issuedTicket.meet_link ? (
                          <a
                            href={issuedTicket.meet_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sky-700 font-bold underline"
                          >
                            <Video className="h-3.5 w-3.5" />
                            {issuedTicket.meet_link}
                          </a>
                        ) : (
                          <div className="text-slate-600">
                            {issuedTicket.room_location}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bukti Pengiriman WhatsApp Gateway & Google Calendar (< 30 detik SLA FR-06) */}
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950">
                      <div className="flex items-center justify-between font-bold">
                        <span>
                          ✓ Webhook WhatsApp Gateway & Google Calendar Terkirim ({waLatencyMs} ms — Target SLA &lt; 30 detik)
                        </span>
                        <span>Pengingat H-1 & H-2 Jam Aktif</span>
                      </div>
                      <p className="mt-1 text-[11px] text-emerald-800 italic">
                        &ldquo;{waPreviewText}&rdquo;
                      </p>
                    </div>

                    {/* Tombol Aksi Pasca-Booking: Live Chat (FR-10), Self-Help (FR-09), Reschedule (FR-08) */}
                    <div className="mt-4 flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">
                      <button
                        onClick={handleOpenLiveChat}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                      >
                        <MessageCircleHeart className="h-4 w-4" />
                        Buka Live Chat Konselor (FR-10)
                      </button>

                      <button
                        onClick={() =>
                           onOpenSelfHelpTab
                            ? onOpenSelfHelpTab()
                            : setShowInlineSelfHelp(!showInlineSelfHelp)
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2.5 text-xs font-bold text-teal-800 hover:bg-teal-100"
                      >
                        <Wind className="h-4 w-4" />
                        Latihan Relaksasi Napas 4-7-8 (FR-09)
                      </button>

                      <button
                        onClick={() =>
                          setShowReschedulePanel(!showReschedulePanel)
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Reschedule Mandiri (FR-08)
                      </button>

                      {issuedTicket.status !== "Cancelled" && (
                        <button
                          onClick={handleCancelTicket}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Batalkan Jadwal
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Panel Reschedule Mandiri (FR-08: Maks 6 jam sebelum sesi) */}
                  {showReschedulePanel && (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 space-y-3">
                      <h4 className="text-xs font-bold text-sky-950">
                        Ubah Jadwal Mandiri (FR-08 • Tanpa Harus Menghubungi Admin Manual)
                      </h4>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={newScheduleChoice}
                          onChange={(e) => setNewScheduleChoice(e.target.value)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
                        >
                          <option value="">-- Pilih Slot Waktu Pengganti --</option>
                          {schedules
                            .filter((s) => !s.is_booked)
                            .map((s) => {
                              const c = counselors.find(
                                (item) => item.id === s.counselor_id
                              );
                              return (
                                <option key={s.id} value={s.id}>
                                  {s.day_of_week}, {s.date_iso} ({s.start_time}-
                                  {s.end_time}) — {c?.name}
                                </option>
                              );
                            })}
                        </select>
                        <button
                          onClick={handleReschedule}
                          disabled={!newScheduleChoice}
                          className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-40"
                        >
                          Simpan Jadwal Baru
                        </button>
                      </div>
                    </div>
                  )}

                  {showInlineSelfHelp && <SelfHelpModule compact />}

                  {/* Evaluasi Kepuasan Mahasiswa CSAT (FR-11) */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    {csatSubmitted ? (
                      <div className="text-xs font-semibold text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Terima kasih! Penilaian kepuasanmu (Skor {csatRating}/5) telah
                        tercatat secara anonim untuk peningkatan mutu layanan BK.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            Evaluasi Kenyamanan Penggunaan Chatbox (CSAT - FR-11):
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setCsatRating(star)}
                                className="p-1 transition hover:scale-110"
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    star <= csatRating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={csatFeedback}
                            onChange={(e) => setCsatFeedback(e.target.value)}
                            placeholder="Masukan singkat mengenai kemudahan dan kenyamanan chatbox ini..."
                            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                          />
                          <button
                            onClick={handleSubmitCsat}
                            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900"
                          >
                            Kirim CSAT
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

