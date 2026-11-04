"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Lock,
  Unlock,
  FileText,
  Download,
  CalendarPlus,
  CheckCircle2,
  ArrowUpRight,
  MessageSquare,
  Send,
  UserCheck,
  EyeOff,
  Clock,
  Video,
  Sparkles,
} from "lucide-react";
import {
  Counselor,
  CounselorSchedule,
  CrisisEventLog,
  DecryptedTicketView,
  LiveChatMessage,
  ScheduleModality,
  TicketStatus,
} from "@/lib/types";

interface Props {
  counselors: Counselor[];
  schedules: CounselorSchedule[];
  crisisLogs: CrisisEventLog[];
  onDataChanged: () => void;
}

export default function CounselorDashboard({
  counselors,
  schedules,
  crisisLogs,
  onDataChanged,
}: Props) {
  const [activeCounselorId, setActiveCounselorId] = useState<string>("c-1");
  const [tickets, setTickets] = useState<DecryptedTicketView[]>([]);
  const [selectedTicketCode, setSelectedTicketCode] = useState<string>("");
  const [liveMessages, setLiveMessages] = useState<LiveChatMessage[]>([]);
  const [replyText, setReplyText] = useState<string>("");

  // SOAP Notes Form State
  const [statusInput, setStatusInput] = useState<TicketStatus>("Confirmed");
  const [subjective, setSubjective] = useState<string>("");
  const [objective, setObjective] = useState<string>("");
  const [assessment, setAssessment] = useState<string>("");
  const [plan, setPlan] = useState<string>("");
  const [soapSavedMsg, setSoapSavedMsg] = useState<string | null>(null);

  // New Schedule Slot State (FR-05)
  const [newSlotDay, setNewSlotDay] = useState<string>("Rabu");
  const [newSlotDate, setNewSlotDate] = useState<string>("2026-11-11");
  const [newSlotStart, setNewSlotStart] = useState<string>("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState<string>("10:00");
  const [newSlotModality, setNewSlotModality] =
    useState<ScheduleModality>("Both");

  const activeCounselor =
    counselors.find((c) => c.id === activeCounselorId) || counselors[0];

  const fetchCounselorView = async () => {
    const res = await fetch(`/api/state?role=counselor`);
    const data = await res.json();
    if (data.tickets) {
      setTickets(data.tickets);
      if (data.tickets.length > 0) {
        const currentStillAssigned = data.tickets.find(
          (t: DecryptedTicketView) => t.ticket_code === selectedTicketCode
        );
        const pick = currentStillAssigned || data.tickets[0];
        selectTicket(pick, data.live_chat_messages || []);
      } else {
        setSelectedTicketCode("");
      }
    }
  };

  useEffect(() => {
    fetchCounselorView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedules]);

  const selectTicket = (
    t: DecryptedTicketView,
    allMessages?: LiveChatMessage[]
  ) => {
    setSelectedTicketCode(t.ticket_code);
    setStatusInput(t.status);
    setSubjective(t.soap_notes?.subjective || "");
    setObjective(
      t.soap_notes?.objective ||
        `Skor Skrining PHQ-4: ${t.urgency_score}/12 (GAD-2: ${
          t.gad_score ?? "-"
        }, PHQ-2: ${t.phq2_score ?? "-"}) — Kategori Urgensi: ${t.urgency_label}.`
    );
    setAssessment(t.soap_notes?.assessment || "");
    setPlan(t.soap_notes?.plan || "");
    setSoapSavedMsg(null);

    if (allMessages) {
      setLiveMessages(
        allMessages.filter((m) => m.ticket_code === t.ticket_code)
      );
    } else {
      fetch(`/api/state?role=counselor&counselorId=${activeCounselorId}&ticketCode=${t.ticket_code}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.live_chat_messages) setLiveMessages(d.live_chat_messages);
        });
    }
  };

  const assignedTickets = tickets;
  const selectedTicket = assignedTickets.find(
    (t) => t.ticket_code === selectedTicketCode
  );

  const handleSaveSoap = async () => {
    if (!selectedTicket) return;
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_ticket_soap",
        ticket_code: selectedTicket.ticket_code,
        status: statusInput,
        subjective,
        objective,
        assessment,
        plan,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setSoapSavedMsg("Catatan SOAP & status sesi berhasil disimpan terenkripsi.");
      fetchCounselorView();
      onDataChanged();
    }
  };

  // Download Kartu Riwayat Konseling (FR-07 Acceptance Criteria)
  const handleDownloadHistoryCard = () => {
    if (!selectedTicket) return;
    const content = [
      "====================================================================",
      "           KARTU RIWAYAT KONSELING MAHASISWA (RAHASIA)              ",
      "           Unit Layanan Bimbingan & Konseling (BK) Kampus           ",
      "====================================================================",
      `Kode Tiket        : ${selectedTicket.ticket_code}`,
      `Tanggal Dibuat    : ${selectedTicket.created_at}`,
      `Status Sesi       : ${statusInput}`,
      `Konselor Bertugas : ${selectedTicket.counselor_name}`,
      "--------------------------------------------------------------------",
      "DATA KLIEN (RBAC TERPROTEKSI AES-256)",
      `Nama Samaran      : ${selectedTicket.mahasiswa_pseudonym}`,
      `Identitas Resmi   : ${
        selectedTicket.identity_disclosed
          ? `${selectedTicket.mahasiswa_name_decrypted} (NIM: ${selectedTicket.mahasiswa_nim_decrypted})`
          : "Mode Anonim / Samaran (Disembunyikan sesuai FR-04)"
      }`,
      `Program Studi     : ${selectedTicket.mahasiswa_prodi} (Angkatan ${selectedTicket.mahasiswa_angkatan})`,
      "--------------------------------------------------------------------",
      "RINGKASAN PRA-KONSELING (PRE-SESSION BRIEF)",
      `Kategori Masalah  : ${selectedTicket.category}`,
      `Kondisi Emosional : ${selectedTicket.emotional_condition}`,
      `Skor PHQ-4        : ${selectedTicket.urgency_score}/12 (${selectedTicket.urgency_label})`,
      `Sub-skor GAD/PHQ  : Kecemasan GAD-2 = ${selectedTicket.gad_score}/6 | Depresi PHQ-2 = ${selectedTicket.phq2_score}/6`,
      `Cerita Awal Klien : ${selectedTicket.client_story_decrypted || "-"}`,
      "--------------------------------------------------------------------",
      "CATATAN HASIL SESI (SOAP NOTES)",
      `[S] Subjective    : ${subjective || "-"}`,
      `[O] Objective     : ${objective || "-"}`,
      `[A] Assessment    : ${assessment || "-"}`,
      `[P] Plan          : ${plan || "-"}`,
      "====================================================================",
      "Dokumen ini bersifat RAHASIA sesuai Kode Etik Bimbingan & Konseling.",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Kartu-Riwayat-${selectedTicket.ticket_code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Refer from Peer Counselor to Expert Dosen BK (Bab 02)
  const handleReferToExpert = async () => {
    if (!selectedTicket) return;
    await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "refer_to_expert",
        ticket_code: selectedTicket.ticket_code,
        target_counselor_id: "c-1",
      }),
    });
    fetchCounselorView();
    onDataChanged();
  };

  // Send Live Chat Message as Counselor (FR-10)
  const handleSendCounselorChat = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    const msg = replyText.trim();
    setReplyText("");
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_live_chat",
        ticket_code: selectedTicket.ticket_code,
        sender_role: "counselor",
        sender_name: activeCounselor.name,
        message: msg,
        simulate_counselor_reply: false,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setLiveMessages((prev) => [...prev, data.message]);
      onDataChanged();
    }
  };

  // Add New Schedule Slot (FR-05)
  const handleAddSlot = async () => {
    await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_schedule_slot",
        counselor_id: activeCounselorId,
        day_of_week: newSlotDay,
        date_iso: newSlotDate,
        start_time: newSlotStart,
        end_time: newSlotEnd,
        modality_type: newSlotModality,
      }),
    });
    onDataChanged();
  };

  const handleToggleOnline = async () => {
    await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_counselor_online",
        counselor_id: activeCounselorId,
      }),
    });
    onDataChanged();
  };

  const counselorSchedules = schedules.filter(
    (s) => s.counselor_id === activeCounselorId
  );

  const urgencyBadgeColor = (label: string) => {
    if (label.startsWith("Kritis"))
      return "bg-rose-100 text-rose-800 border-rose-300";
    if (label.startsWith("Tinggi"))
      return "bg-amber-100 text-amber-800 border-amber-300";
    if (label.startsWith("Sedang"))
      return "bg-sky-100 text-sky-800 border-sky-300";
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Admin Unified Management Header */}
      <div className="rounded-[26px] border border-white bg-[#FCFBF7] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E2F1EC] px-3 py-1 text-xs font-extrabold text-[#2E7D67]">
                <Lock className="h-3.5 w-3.5" />
                Modul FR-07 • Panel Admin Pengelola Layanan BK
              </span>
              <span className="text-xs font-semibold text-[#6E6A63]">
                Total Antrean Aktif: {assignedTickets.length} Tiket
              </span>
            </div>
            <h2 className="mt-1.5 text-xl font-extrabold text-[#2D2A26]">
              Manajemen Tiket Klien, Pre-Session Brief & Jurnal SOAP BK
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {assignedTickets.length > 0 && (
              <select
                value={selectedTicketCode}
                onChange={(e) => {
                  const found = assignedTickets.find(
                    (t) => t.ticket_code === e.target.value
                  );
                  if (found) selectTicket(found);
                }}
                className="rounded-full bg-[#F3F0E8] border border-white px-4 py-2 text-xs font-extrabold text-[#2D2A26] shadow-inner focus:bg-white focus:outline-none"
              >
                {assignedTickets.map((t) => (
                  <option key={t.ticket_code} value={t.ticket_code}>
                    {t.ticket_code} —{" "}
                    {t.identity_disclosed && t.mahasiswa_name_decrypted
                      ? t.mahasiswa_name_decrypted
                      : t.mahasiswa_pseudonym}{" "}
                    ({t.category})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleToggleOnline}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold transition ${
                activeCounselor?.online_status
                  ? "bg-[#E2F1EC] text-[#287D63] border border-white shadow-sm"
                  : "bg-slate-100 text-slate-600 border border-slate-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  activeCounselor?.online_status
                    ? "bg-[#2EB886] animate-ping"
                    : "bg-slate-400"
                }`}
              />
              Status Layanan Live Chat:{" "}
              {activeCounselor?.online_status ? "Online" : "Offline"}
            </button>
          </div>
        </div>
      </div>

      {/* High-Priority Crisis Escalation Feed (FR-02) */}
      {crisisLogs.length > 0 && (
        <div className="rounded-2xl border-2 border-rose-400 bg-rose-50/90 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-rose-900">
              <ShieldAlert className="h-5 w-5 text-rose-600 animate-pulse" />
              Log Peringatan Prioritas Tinggi (Red-Flag Crisis Protocol FR-02)
            </div>
            <span className="rounded-full bg-white px-3 py-0.5 text-xs font-bold text-rose-700">
              Total Trigger Darurat: {crisisLogs.length}
            </span>
          </div>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
            {crisisLogs.slice(0, 2).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 text-xs border border-rose-200"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    Klien: {log.pseudonym} • Kata Kunci: &ldquo;
                    {log.matched_keywords.join(", ")}&rdquo;
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Konselor Piket: {log.piket_counselor_name} • Kecepatan
                    Deteksi: {log.detection_latency_ms} ms
                  </div>
                </div>
                <span className="rounded-lg bg-rose-100 px-2.5 py-1 font-bold text-rose-800">
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full-Width Pre-Session Brief, Decrypted Story, SOAP Notes & Live Chat */}
      <div className="w-full space-y-6">
        <div className="space-y-6">
          {!selectedTicket ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Belum ada tiket konseling yang aktif untuk ditampilkan.
            </div>
          ) : (
            <>
              {/* Pre-Session Brief Card */}
              <div className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-900">
                        <Unlock className="h-3 w-3" />
                        Pre-Session Brief Terdekripsi (AES-256)
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${urgencyBadgeColor(
                          selectedTicket.urgency_label
                        )}`}
                      >
                        Urgensi: {selectedTicket.urgency_label}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">
                      Tiket {selectedTicket.ticket_code} —{" "}
                      {selectedTicket.identity_disclosed
                        ? `${selectedTicket.mahasiswa_name_decrypted} (NIM: ${selectedTicket.mahasiswa_nim_decrypted})`
                        : `${selectedTicket.mahasiswa_pseudonym} (Mode Samaran Anonim)`}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Program Studi: {selectedTicket.mahasiswa_prodi} • Angkatan{" "}
                      {selectedTicket.mahasiswa_angkatan} • Durasi Triase:{" "}
                      {selectedTicket.triage_duration_seconds} detik
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleDownloadHistoryCard}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-teal-300 bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-900 hover:bg-teal-100"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Unduh Kartu Riwayat Konseling
                    </button>

                    {activeCounselor?.is_peer_counselor && (
                      <button
                        onClick={handleReferToExpert}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-600 shadow-sm"
                        title="Rujuk kasus ini ke Dosen BK Ahli jika melebihi batas kewenangan konselor sebaya"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Rujuk ke Dosen BK Ahli
                      </button>
                    )}
                  </div>
                </div>

                {/* Skor Skrining PHQ-4 & Modalitas */}
                <div className="grid gap-3 sm:grid-cols-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <div className="text-slate-500">Skor Total PHQ-4:</div>
                    <div className="mt-1 text-base font-extrabold text-slate-900">
                      {selectedTicket.urgency_score} / 12
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-600">
                      GAD-2 (Cemas): {selectedTicket.gad_score ?? "-"} | PHQ-2
                      (Depresi): {selectedTicket.phq2_score ?? "-"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <div className="text-slate-500">Kategori & Emosi Awal:</div>
                    <div className="mt-1 font-bold text-slate-900">
                      {selectedTicket.category}
                    </div>
                    <div className="mt-0.5 text-[11px] text-teal-700 font-medium">
                      Kondisi: {selectedTicket.emotional_condition}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <div className="text-slate-500">Modalitas & Jadwal:</div>
                    <div className="mt-1 font-bold text-slate-900">
                      {selectedTicket.modality_selected}
                    </div>
                    {selectedTicket.meet_link ? (
                      <a
                        href={selectedTicket.meet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 underline"
                      >
                        <Video className="h-3 w-3" />
                        Buka Google Meet
                      </a>
                    ) : (
                      <div className="mt-0.5 text-[11px] text-slate-600">
                        {selectedTicket.room_location}
                      </div>
                    )}
                  </div>
                </div>

                {/* Isi Cerita Klien Terdekripsi (client_story_encrypted) */}
                <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-teal-900 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                      Ringkasan Keluhan Pra-Konseling (Decrypted Client Story):
                    </span>
                    <span className="text-[10px] font-normal text-teal-700">
                      Hanya dapat dibaca oleh {activeCounselor?.name}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed italic">
                    &ldquo;{selectedTicket.client_story_decrypted}&rdquo;
                  </p>
                </div>
              </div>

              {/* Pencatatan Hasil Sesi: SOAP Notes & Status Tiket (FR-07) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-teal-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Catatan Klinis Hasil Sesi (SOAP Notes - FR-07)
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600">
                      Status Siklus Tiket:
                    </label>
                    <select
                      value={statusInput}
                      onChange={(e) =>
                        setStatusInput(e.target.value as TicketStatus)
                      }
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="In-Progress">In-Progress</option>
                      <option value="Completed">Completed (Selesai)</option>
                      <option value="Rescheduled">Rescheduled</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="No-Show">No-Show</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      S — Subjective (Keluhan Subjektif Klien Saat Sesi)
                    </label>
                    <textarea
                      rows={3}
                      value={subjective}
                      onChange={(e) => setSubjective(e.target.value)}
                      placeholder="Apa yang diungkapkan mahasiswa selama sesi konseling..."
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      O — Objective (Observasi Konselor & Skor Asesmen)
                    </label>
                    <textarea
                      rows={3}
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      placeholder="Afek, bahasa tubuh, skor PHQ-4/GAD-2..."
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      A — Assessment (Rumusan Masalah / Analisis Konselor)
                    </label>
                    <textarea
                      rows={3}
                      value={assessment}
                      onChange={(e) => setAssessment(e.target.value)}
                      placeholder="Identifikasi faktor pemicu dan dinamika psikologis..."
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      P — Plan (Rencana Intervensi & Tindak Lanjut)
                    </label>
                    <textarea
                      rows={3}
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      placeholder="Tugas perilaku, latihan relaksasi, atau jadwal sesi lanjutan..."
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  {soapSavedMsg ? (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      {soapSavedMsg}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Perubahan SOAP Notes disimpan pada rekam jejak tiket konseling.
                    </span>
                  )}
                  <button
                    onClick={handleSaveSoap}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Simpan SOAP Notes & Status
                  </button>
                </div>
              </div>

              {/* Panel Live Chat Handover Konselor (FR-10) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-teal-600" />
                    <h4 className="text-xs font-bold text-slate-800">
                      Ruang Percakapan Langsung (Live Chat Handover - FR-10) • Tiket{" "}
                      {selectedTicket.ticket_code}
                    </h4>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Real-Time Sync Aktif
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl bg-slate-50 p-3">
                  {liveMessages.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 py-4">
                      Belum ada pesan percakapan langsung pada tiket ini.
                    </div>
                  ) : (
                    liveMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          m.sender_role === "counselor"
                            ? "items-end"
                            : "items-start"
                        }`}
                      >
                        <span className="text-[10px] font-semibold text-slate-400 mb-0.5">
                          {m.sender_name}
                        </span>
                        <div
                          className={`rounded-xl px-3 py-2 text-xs max-w-[80%] ${
                            m.sender_role === "counselor"
                              ? "bg-teal-600 text-white"
                              : m.sender_role === "system"
                              ? "bg-amber-50 text-amber-900 border border-amber-200"
                              : "bg-white border border-slate-200 text-slate-800"
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendCounselorChat();
                    }}
                    placeholder={`Balas pesan kepada ${selectedTicket.mahasiswa_pseudonym}...`}
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                  <button
                    onClick={handleSendCounselorChat}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Kirim Balasan
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

