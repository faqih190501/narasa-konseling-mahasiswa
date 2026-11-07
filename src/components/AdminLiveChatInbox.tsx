"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquareHeart,
  Send,
  Search,
  Sparkles,
  Clock,
  CheckCircle2,
  UserCheck,
  EyeOff,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { DecryptedTicketView, LiveChatMessage } from "@/lib/types";

interface Props {
  tickets: DecryptedTicketView[];
  allMessages: LiveChatMessage[];
  adminName?: string;
  onDataChanged: () => void;
}

const QUICK_ADMIN_REPLIES = [
  "Halo Kak, Admin BK NARASA di sini. Aku sedang membaca ceritamu ya, silakan ceritakan lebih lanjut dengan tenang.",
  "Terima kasih sudah berani berbagi di Ruang Aman NARASA. Kamu tidak sendirian, kami siap mendampingimu.",
  "Jadwal sesi konselingmu sudah kami konfirmasi ya. Apakah ada waktu atau kebutuhan khusus yang ingin disesuaikan?",
  "Sembari menunggu sesi, kamu bisa mencoba fitur Relaksasi Napas 4-7-8 di menu sebelah kiri agar lebih tenang ya.",
];

export default function AdminLiveChatInbox({
  tickets,
  allMessages,
  adminName = "Admin Utama NARASA",
  onDataChanged,
}: Props) {
  const [selectedTicketCode, setSelectedTicketCode] = useState<string>(
    tickets[0]?.ticket_code || ""
  );
  const [replyInput, setReplyInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-select first ticket if none selected
  useEffect(() => {
    if (!selectedTicketCode && tickets.length > 0) {
      setSelectedTicketCode(tickets[0].ticket_code);
    }
  }, [tickets, selectedTicketCode]);

  // Poll every 2.5s for real-time incoming messages from Mahasiswa
  useEffect(() => {
    const interval = setInterval(() => {
      onDataChanged();
    }, 2500);
    return () => clearInterval(interval);
  }, [onDataChanged]);

  const currentMessages = allMessages.filter(
    (m) => m.ticket_code === selectedTicketCode
  );

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length, selectedTicketCode]);

  const selectedTicket = tickets.find(
    (t) => t.ticket_code === selectedTicketCode
  );

  const handleSendAdminReply = async (customText?: string) => {
    const textToSend = (customText ?? replyInput).trim();
    if (!selectedTicketCode || !textToSend) return;

    if (!customText) {
      setReplyInput("");
    }
    setIsSending(true);

    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_live_chat",
          ticket_code: selectedTicketCode,
          sender_role: "counselor",
          sender_name: `${adminName} (Admin BK)`,
          message: textToSend,
          simulate_counselor_reply: false,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onDataChanged();
      }
    } finally {
      setIsSending(false);
    }
  };

  // Sort tickets so threads with latest messages or waiting for admin reply appear at top
  const filteredTickets = tickets
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.ticket_code.toLowerCase().includes(q) ||
        t.mahasiswa_pseudonym.toLowerCase().includes(q) ||
        (t.mahasiswa_name_decrypted || "").toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aMsgs = allMessages.filter((m) => m.ticket_code === a.ticket_code);
      const bMsgs = allMessages.filter((m) => m.ticket_code === b.ticket_code);
      const aLast = aMsgs[aMsgs.length - 1]?.created_at || a.created_at;
      const bLast = bMsgs[bMsgs.length - 1]?.created_at || b.created_at;
      return bLast.localeCompare(aLast);
    });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Hero Banner */}
      <div className="clay-hero-peach rounded-[24px] sm:rounded-[30px] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 sm:px-3.5 py-1 text-[10.5px] sm:text-[11px] font-extrabold text-[#C46A4E]">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            Live Chat Real-Time 2 Arah (FR-10 • Mahasiswa ⇄ Admin BK)
          </span>
          <h2 className="mt-2 text-lg sm:text-2xl font-extrabold text-[#2D2A26]">
            Kotak Masuk & Balas Chat Mahasiswa Secara Langsung 💬
          </h2>
          <p className="mt-1 text-xs sm:text-[13px] text-[#5F544E] max-w-2xl">
            Pilih percakapan mahasiswa untuk membaca keluhan awal dan langsung
            mengirim balasan chat secara real-time ke layar mahasiswa.
          </p>
        </div>

        <button
          onClick={onDataChanged}
          className="clay-btn-white self-start md:self-center inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-extrabold text-[#2D2A26]"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#559A87]" />
          Segarkan Pesan
        </button>
      </div>

      {/* Main Split Chat Layout (Mobile List/Chat Toggle + Desktop Side-by-Side) */}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-12 items-stretch">
        {/* LEFT 4 COLS: DAFTAR PERCAKAPAN MAHASISWA */}
        <div
          className={`clay-card-white lg:col-span-4 rounded-[24px] sm:rounded-[30px] p-4 sm:p-5 flex-col justify-between ${
            mobileShowChat ? "hidden lg:flex" : "flex"
          }`}
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="text-sm font-extrabold text-[#2D2A26]">
                Daftar Chat Mahasiswa ({filteredTickets.length})
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2E7D67]">
                <span className="h-2 w-2 rounded-full bg-[#2EB886] animate-ping" />
                Live Sync
              </span>
            </div>

            <div className="relative mt-3">
              <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#8C867E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama/samaran atau kode tiket..."
                className="w-full rounded-full bg-[#F3F0E8] pl-9 pr-4 py-2 text-xs font-semibold text-[#2D2A26] placeholder-[#969086] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="mt-3.5 space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredTickets.map((t) => {
                const threadMsgs = allMessages.filter(
                  (m) => m.ticket_code === t.ticket_code
                );
                const lastMsg = threadMsgs[threadMsgs.length - 1];
                const needsAdminReply = lastMsg?.sender_role === "mahasiswa";
                const isSelected = t.ticket_code === selectedTicketCode;

                return (
                  <button
                    key={t.ticket_code}
                    onClick={() => {
                      setSelectedTicketCode(t.ticket_code);
                      setMobileShowChat(true);
                    }}
                    className={`w-full rounded-[22px] p-3.5 text-left transition border-2 ${
                      isSelected
                        ? "clay-card-mint border-white ring-2 ring-[#559A87]/30"
                        : "bg-[#FAF8F3] border-transparent hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#2D2A26] truncate">
                        {t.identity_disclosed && t.mahasiswa_name_decrypted
                          ? t.mahasiswa_name_decrypted
                          : t.mahasiswa_pseudonym}
                      </span>
                      {needsAdminReply ? (
                        <span className="shrink-0 rounded-full bg-[#EE7854] px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm animate-pulse">
                          Perlu Dibalas
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-[#2E7D67]">
                          {threadMsgs.length} Pesan
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-[#6E6A63]">
                      <span>{t.ticket_code}</span>
                      <span>PHQ-4: {t.urgency_score}/12</span>
                    </div>

                    <p className="mt-1.5 text-xs text-[#414844] line-clamp-2 bg-white/70 rounded-xl px-2.5 py-1.5">
                      {lastMsg ? (
                        <>
                          <strong className="text-[#2D2A26]">
                            {lastMsg.sender_role === "mahasiswa"
                              ? "Mahasiswa: "
                              : lastMsg.sender_role === "counselor"
                              ? "Admin: "
                              : ""}
                          </strong>
                          {lastMsg.message}
                        </>
                      ) : (
                        t.client_story_decrypted || "Belum ada pesan obrolan."
                      )}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT 8 COLS: RUANG BALAS CHAT MAHASISWA REAL-TIME */}
        <div
          className={`clay-card-white lg:col-span-8 min-w-0 rounded-[24px] sm:rounded-[30px] p-4 sm:p-6 flex-col justify-between min-h-[500px] sm:min-h-[600px] ${
            mobileShowChat ? "flex" : "hidden lg:flex"
          }`}
        >
          {!selectedTicket ? (
            <div className="m-auto text-center text-sm text-[#8C857B]">
              Pilih salah satu mahasiswa di sebelah kiri untuk mulai membalas
              percakapan.
            </div>
          ) : (
            <>
              {/* Top Student Info Context Header */}
              <div className="border-b border-slate-100 pb-4 space-y-3">
                {/* Mobile Back to Conversation List Button */}
                <button
                  type="button"
                  onClick={() => setMobileShowChat(false)}
                  className="lg:hidden inline-flex items-center gap-1.5 rounded-full bg-[#F3F0E8] hover:bg-[#E2F1EC] px-3.5 py-1.5 text-xs font-extrabold text-[#2D2A26] transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-[#559A87]" />
                  <span>Daftar Chat ({filteredTickets.length})</span>
                </button>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-[#DCEEE7] text-[#2E7D67] font-extrabold text-base shadow-sm">
                      <MessageSquareHeart className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-[#2D2A26] break-words">
                          {selectedTicket.identity_disclosed &&
                          selectedTicket.mahasiswa_name_decrypted
                            ? `${selectedTicket.mahasiswa_name_decrypted} (NIM: ${selectedTicket.mahasiswa_nim_decrypted})`
                            : `${selectedTicket.mahasiswa_pseudonym} (Mode Samaran)`}
                        </h3>
                        <span className="rounded-full bg-[#F9E69B] px-2.5 py-0.5 text-[10px] sm:text-[10.5px] font-extrabold text-[#6E5611]">
                          {selectedTicket.urgency_label}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-[#6E6A63]">
                        Tiket: <strong>{selectedTicket.ticket_code}</strong> •{" "}
                        {selectedTicket.mahasiswa_prodi} • Topik:{" "}
                        <strong>{selectedTicket.category}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E2F1EC] px-3 py-1 font-extrabold text-[#287D63]">
                      {selectedTicket.identity_disclosed ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5" />
                          Identitas Terverifikasi
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Mode Samaran Anonim
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Ringkasan Cerita Awal Mahasiswa */}
                {selectedTicket.client_story_decrypted && (
                  <div className="rounded-2xl bg-[#FAF8F3] border border-[#ECE8DF] px-4 py-2.5 text-xs text-[#4E5A54]">
                    <span className="font-extrabold text-[#2D2A26]">
                      Cerita / Keluhan Awal Mahasiswa:{" "}
                    </span>
                    <span className="italic">
                      &ldquo;{selectedTicket.client_story_decrypted}&rdquo;
                    </span>
                  </div>
                )}
              </div>

              {/* Chat Messages Scroll Container */}
              <div className="my-4 flex-1 max-h-[360px] overflow-y-auto rounded-[24px] bg-[#F7F5EF] p-4 space-y-3 border border-white shadow-inner">
                {currentMessages.length === 0 ? (
                  <div className="text-center text-xs text-[#8C857B] py-10">
                    Belum ada riwayat chat pada tiket ini. Kirim sapaan pertama
                    dari Admin di bawah ini!
                  </div>
                ) : (
                  currentMessages.map((msg) => {
                    const isAdmin = msg.sender_role === "counselor";
                    const isSystem = msg.sender_role === "system";

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <div className="rounded-full bg-[#FCE8DF] border border-white px-4 py-1.5 text-[11px] font-bold text-[#8A442D] text-center max-w-lg shadow-sm">
                            {msg.message}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isAdmin ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#7A746B] mb-1 px-1">
                          <span>{msg.sender_name}</span>
                          <span>•</span>
                          <Clock className="h-2.5 w-2.5" />
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        <div
                          className={`max-w-[82%] rounded-[22px] px-4 py-3 text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                            isAdmin
                              ? "rounded-br-none bg-gradient-to-br from-[#559A87] to-[#438271] text-white font-medium"
                              : "rounded-bl-none bg-white border border-[#EAE5DC] text-[#2D2A26] font-medium"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Bottom Admin Reply Composer + 1-Click Quick Templates */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <div className="text-[11px] font-extrabold text-[#6E6A63] mb-1.5">
                    ⚡ Template Balasan Cepat Admin (Klik untuk Langsung Kirim):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ADMIN_REPLIES.map((tpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendAdminReply(tpl)}
                        className="rounded-full bg-[#F3F0E8] hover:bg-[#E2F1EC] px-3 py-1.5 text-[11px] font-bold text-[#2D2A26] transition text-left truncate max-w-xs border border-white shadow-sm"
                        title={tpl}
                      >
                        + &ldquo;{tpl.slice(0, 48)}...&rdquo;
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5">
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendAdminReply();
                      }
                    }}
                    placeholder={`Balas ${selectedTicket.mahasiswa_pseudonym}...`}
                    className="flex-1 min-w-0 rounded-full bg-[#F3F0E8] border border-white px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold text-[#2D2A26] placeholder-[#969086] shadow-inner focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#559A87]"
                  />
                  <button
                    type="button"
                    disabled={isSending || !replyInput.trim()}
                    onClick={() => handleSendAdminReply()}
                    className="clay-btn-coral shrink-0 inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-4 sm:px-6 py-3 text-xs sm:text-sm font-extrabold text-white transition active:scale-95 disabled:opacity-40"
                  >
                    <Send className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Kirim Balasan</span>
                    <span className="sm:hidden">Kirim</span>
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

