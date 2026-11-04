"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Home,
  MessageCircleHeart,
  GraduationCap,
  CalendarCheck,
  FileSpreadsheet,
  BookOpenCheck,
  Users,
  Search,
  Bell,
  LogOut,
  Play,
  BarChart2,
  Clock,
  Flame,
  Monitor,
  Crown,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Minimize2,
  HeartPulse,
  PhoneCall,
  Ticket,
  Wind,
  Lock,
  Video,
  CheckCircle2,
  Download,
} from "lucide-react";
import LoginPortal, { AuthenticatedSession } from "@/components/LoginPortal";
import NarasaLogo from "@/components/NarasaLogo";
import ChatboxWidget from "@/components/ChatboxWidget";
import SelfHelpModule from "@/components/SelfHelpModule";
import CounselorDashboard from "@/components/CounselorDashboard";
import AdminAnalyticsDashboard from "@/components/AdminAnalyticsDashboard";
import StudentAccountsManager from "@/components/StudentAccountsManager";
import AdminLiveChatInbox from "@/components/AdminLiveChatInbox";
import StudentDirectConsult from "@/components/StudentDirectConsult";
import {
  Counselor,
  CounselorSchedule,
  CrisisEventLog,
  DecryptedTicketView,
  LiveChatMessage,
  StudentAccount,
} from "@/lib/types";

type NavKey =
  | "dashboard"
  | "konsultasi_admin"
  | "balas_chat"
  | "akun_mahasiswa"
  | "chatbox"
  | "prodi_konselor"
  | "mahasiswa_tiket"
  | "nilai_phq4"
  | "jurnal_soap"
  | "selfhelp";

export default function HomePage() {
  // Authentication Session (Null = Show Login Portal for Mahasiswa & Admin)
  const [session, setSession] = useState<AuthenticatedSession | null>(null);
  const [activeNav, setActiveNav] = useState<NavKey>("dashboard");

  const [studentAccounts, setStudentAccounts] = useState<StudentAccount[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [schedules, setSchedules] = useState<CounselorSchedule[]>([]);
  const [ticketsAdminView, setTicketsAdminView] = useState<
    DecryptedTicketView[]
  >([]);
  const [crisisLogs, setCrisisLogs] = useState<CrisisEventLog[]>([]);
  const [liveChatMessages, setLiveChatMessages] = useState<LiveChatMessage[]>(
    []
  );
  const [analytics, setAnalytics] = useState<any>(null);

  // Interactive UI controls on the clay dashboard
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showNotifPopover, setShowNotifPopover] = useState<boolean>(false);
  const [donutMode, setDonutMode] = useState<"kehadiran" | "phq4">("kehadiran");
  const [floatingWidgetOpen, setFloatingWidgetOpen] = useState<boolean>(false);

  // Student Ticket Lookup State
  const [ticketLookupInput, setTicketLookupInput] = useState<string>(
    "BK-20261103-3819"
  );

  const loadState = useCallback(async () => {
    try {
      const res = await fetch("/api/state?role=admin");
      const data = await res.json();
      setStudentAccounts(data.student_accounts || []);
      setCounselors(data.counselors || []);
      setSchedules(data.schedules || []);
      setTicketsAdminView(data.tickets || []);
      setCrisisLogs(data.crisis_logs || []);
      setLiveChatMessages(data.live_chat_messages || []);
      setAnalytics(data.analytics || null);
    } catch (e) {
      console.error("Failed to fetch state:", e);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const handleLoginSuccess = (authSession: AuthenticatedSession) => {
    setSession(authSession);
    setActiveNav("dashboard");
  };

  const handleLogout = () => {
    setSession(null);
    setFloatingWidgetOpen(false);
  };

  // If not logged in, render the Dual Login Portal (Mahasiswa vs Admin/Konselor)
  if (!session) {
    return <LoginPortal onLoginSuccess={handleLoginSuccess} />;
  }

  const isMahasiswa = session.role === "mahasiswa";

  // Filtered tickets for quick search
  const filteredTickets = ticketsAdminView.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.ticket_code.toLowerCase().includes(q) ||
      t.mahasiswa_pseudonym.toLowerCase().includes(q) ||
      t.mahasiswa_prodi.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.counselor_name.toLowerCase().includes(q)
    );
  });

  // Donut chart metrics
  const totalTickets = Math.max(1, ticketsAdminView.length);
  const hadirCount = ticketsAdminView.filter(
    (t) =>
      t.status === "Confirmed" ||
      t.status === "Completed" ||
      t.status === "In-Progress"
  ).length;
  const rescheduleCount = ticketsAdminView.filter(
    (t) => t.status === "Rescheduled" || t.status === "Pending"
  ).length;
  const izinCancelCount = ticketsAdminView.filter(
    (t) => t.status === "Cancelled"
  ).length;
  const noShowCount = ticketsAdminView.filter(
    (t) => t.status === "No-Show"
  ).length;

  const hadirPct = Math.round((hadirCount / totalTickets) * 100) || 75;
  const reschedulePct = Math.max(0, 100 - hadirPct);

  const onlineCounselorsCount = counselors.filter((c) => c.online_status).length;
  const openSlotsCount = schedules.filter((s) => !s.is_booked).length;

  // Navigation items tailored for Mahasiswa vs Admin/Konselor
  const navItems: {
    key: NavKey;
    label: string;
    icon: React.ElementType;
    badgeBg: string;
    iconColor: string;
  }[] = isMahasiswa
    ? [
        {
          key: "dashboard",
          label: "Beranda Mahasiswa",
          icon: Home,
          badgeBg: "bg-[#D3EAE2]",
          iconColor: "text-[#2E7D67]",
        },
        {
          key: "konsultasi_admin",
          label: "Chat Konsultasi Admin",
          icon: MessageCircleHeart,
          badgeBg: "bg-[#FAD9CE]",
          iconColor: "text-[#D9603B]",
        },
        {
          key: "chatbox",
          label: "Skrining Mandiri PHQ-4",
          icon: Sparkles,
          badgeBg: "bg-[#E6D8F5]",
          iconColor: "text-[#7A4EB3]",
        },
        {
          key: "mahasiswa_tiket",
          label: "Tiket Konseling Saya",
          icon: Ticket,
          badgeBg: "bg-[#FBE8C2]",
          iconColor: "text-[#C5861E]",
        },
        {
          key: "selfhelp",
          label: "Relaksasi Napas 4-7-8",
          icon: Wind,
          badgeBg: "bg-[#D5E5F6]",
          iconColor: "text-[#3F78B5]",
        },
      ]
    : [
        {
          key: "dashboard",
          label: "Dashboard",
          icon: Home,
          badgeBg: "bg-[#D3EAE2]",
          iconColor: "text-[#2E7D67]",
        },
        {
          key: "balas_chat",
          label: "Balas Chat Mahasiswa",
          icon: MessageCircleHeart,
          badgeBg: "bg-[#FAD9CE]",
          iconColor: "text-[#D9603B]",
        },
        {
          key: "akun_mahasiswa",
          label: "Data Mahasiswa",
          icon: Users,
          badgeBg: "bg-[#F7DFD0]",
          iconColor: "text-[#B85D38]",
        },
        {
          key: "mahasiswa_tiket",
          label: "Data Klien & Tiket",
          icon: GraduationCap,
          badgeBg: "bg-[#FBE8C2]",
          iconColor: "text-[#C5861E]",
        },
        {
          key: "nilai_phq4",
          label: "Skor PHQ-4 & Leger",
          icon: FileSpreadsheet,
          badgeBg: "bg-[#E6D8F5]",
          iconColor: "text-[#7A4EB3]",
        },
        {
          key: "jurnal_soap",
          label: "Jurnal & SOAP BK",
          icon: BookOpenCheck,
          badgeBg: "bg-[#D2EBDD]",
          iconColor: "text-[#2E855A]",
        },
        {
          key: "chatbox",
          label: "Simulasi Chatbox",
          icon: Sparkles,
          badgeBg: "bg-[#F3E5D8]",
          iconColor: "text-[#9E6B43]",
        },
        {
          key: "selfhelp",
          label: "Relaksasi 4-7-8",
          icon: HeartPulse,
          badgeBg: "bg-[#D6EFEA]",
          iconColor: "text-[#2B7A78]",
        },
      ];

  // Weekly 3D Pill Bar Data matching the reference image aesthetic
  const weeklyBars = [
    {
      day: "Sen",
      heightPct: 86,
      sessions: "6 Sesi (92%)",
      gradient: "from-[#F39C80] via-[#EE8564] to-[#E5714E]",
      shadow: "rgba(229, 113, 78, 0.35)",
    },
    {
      day: "Sel",
      heightPct: 48,
      sessions: "4 Sesi (78%)",
      gradient: "from-[#FAD06C] via-[#F5BC47] to-[#EAA92A]",
      shadow: "rgba(234, 169, 42, 0.35)",
    },
    {
      day: "Rab",
      heightPct: 18,
      sessions: "2 Sesi (80%)",
      gradient: "from-[#A1CEB8] via-[#88BE9F] to-[#72AD8C]",
      shadow: "rgba(114, 173, 140, 0.35)",
    },
    {
      day: "Kam",
      heightPct: 18,
      sessions: "3 Sesi (85%)",
      gradient: "from-[#F38E6B] via-[#EB7650] to-[#DF613A]",
      shadow: "rgba(223, 97, 58, 0.35)",
    },
    {
      day: "Jum",
      heightPct: 18,
      sessions: "2 Sesi (90%)",
      gradient: "from-[#95BFEA] via-[#78A9DF] to-[#6196D1]",
      shadow: "rgba(97, 150, 209, 0.35)",
    },
    {
      day: "Sab",
      heightPct: 18,
      sessions: "1 Sesi Sebaya",
      gradient: "from-[#82C0B0] via-[#66AC9A] to-[#529987]",
      shadow: "rgba(82, 153, 135, 0.35)",
    },
    {
      day: "Min",
      heightPct: 18,
      sessions: "Self-Help 24/7",
      gradient: "from-[#E4B4D5] via-[#D49BC2] to-[#C283AF]",
      shadow: "rgba(194, 131, 175, 0.35)",
    },
  ];

  const headerTitleMap: Record<NavKey, string> = {
    dashboard: isMahasiswa ? "Beranda Ruang Aman Mahasiswa" : "Dashboard",
    konsultasi_admin: "Chat Konsultasi Langsung ke Admin BK",
    balas_chat: "Inbox Live Chat & Balas Pesan Mahasiswa",
    akun_mahasiswa: "Manajemen Data & Akun Mahasiswa",
    chatbox: "Skrining Mandiri PHQ-4 & Triase Konseling",
    prodi_konselor: "Direktori Dosen BK & Konselor Sebaya",
    mahasiswa_tiket: isMahasiswa
      ? "Tiket Konseling Saya"
      : "Data Klien & Tiket Konseling",
    nilai_phq4: "Skor Skrining PHQ-4 & Analitik",
    jurnal_soap: "Jurnal Konseling & SOAP Notes",
    selfhelp: "Ruang Relaksasi & Napas 4-7-8",
  };

  return (
    <div className="min-h-screen p-3 sm:p-5 lg:p-7 flex items-stretch justify-center">
      <div className="w-full max-w-[1440px] flex flex-col lg:flex-row gap-5 lg:gap-6">
        {/* ============================================================
            LEFT FLOATING SAGE-MINT SIDEBAR (Matches Reference Image + NARASA Logo)
           ============================================================ */}
        <aside className="clay-sidebar w-full lg:w-[272px] shrink-0 rounded-[34px] p-5 flex flex-col justify-between no-print">
          <div>
            {/* Official NARASA Brand Pill at Top of Sidebar */}
            <div className="mb-3 rounded-[22px] bg-[#FCFBF8]/90 px-3.5 py-2.5 border border-white shadow-sm flex items-center justify-center">
              <NarasaLogo
                size="sm"
                showText={true}
                subtitle="Narasi Rasa • BK Kampus"
              />
            </div>

            {/* Top Profile Avatar & Greeting */}
            <div className="flex flex-col items-center text-center pt-1 pb-5">
              <div className="relative">
                <div className="h-[84px] w-[84px] rounded-full bg-[#F5E1D6] border-[4px] border-white shadow-[0_8px_20px_rgba(90,115,105,0.18)] flex items-center justify-center overflow-hidden">
                  {/* Friendly Illustrated Avatar SVG */}
                  <svg
                    viewBox="0 0 100 100"
                    className="h-full w-full"
                    aria-label="Avatar"
                  >
                    <circle cx="50" cy="50" r="50" fill="#F4DFD5" />
                    <path
                      d="M20 96 C22 74, 78 74, 80 96 Z"
                      fill={isMahasiswa ? "#EE7854" : "#76B09D"}
                    />
                    <polygon points="38,76 50,88 45,73" fill="#FFFFFF" />
                    <polygon points="62,76 50,88 55,73" fill="#FFFFFF" />
                    <rect
                      x="43"
                      y="62"
                      width="14"
                      height="14"
                      rx="5"
                      fill="#F3C1A8"
                    />
                    <circle cx="29" cy="48" r="5" fill="#F3C1A8" />
                    <circle cx="71" cy="48" r="5" fill="#F3C1A8" />
                    <rect
                      x="31"
                      y="26"
                      width="38"
                      height="40"
                      rx="18"
                      fill="#FAD0BA"
                    />
                    <path
                      d="M29 42 C29 22, 71 22, 71 42 C67 31, 33 31, 29 42 Z"
                      fill="#6D4534"
                    />
                    <path
                      d="M39 41 Q42 39 45 41"
                      stroke="#5A3828"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M55 41 Q58 39 61 41"
                      stroke="#5A3828"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <circle cx="42" cy="46" r="2.3" fill="#2D2A26" />
                    <circle cx="58" cy="46" r="2.3" fill="#2D2A26" />
                    <circle
                      cx="37"
                      cy="51"
                      r="3.2"
                      fill="#F29B86"
                      opacity="0.6"
                    />
                    <circle
                      cx="63"
                      cy="51"
                      r="3.2"
                      fill="#F29B86"
                      opacity="0.6"
                    />
                    <path
                      d="M44 54 Q50 59 56 54"
                      stroke="#8C4A32"
                      strokeWidth="2.4"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                {/* Green Online Dot */}
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-[#2EB886] ring-[3px] ring-white" />
              </div>

              <h2 className="mt-3.5 text-[15px] font-extrabold text-[#2D2A26] flex items-center justify-center gap-1 px-2">
                <span className="truncate">
                  Hi, {session.displayName.split(",")[0]}!
                </span>
                <span>👋</span>
              </h2>
              <p className="mt-0.5 text-[11.5px] font-semibold text-[#5E6A64]">
                {session.subRoleLabel}
              </p>
            </div>

            {/* Navigation Menu Items */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveNav(item.key)}
                    className={`w-full flex items-center gap-3.5 rounded-[20px] px-4 py-3 text-left text-[13.5px] transition-all duration-200 ${
                      isActive
                        ? "bg-[#FCFBF7] font-extrabold text-[#2D2A26] shadow-[0_10px_22px_rgba(95,115,105,0.14)] scale-[1.01]"
                        : "font-semibold text-[#414844] hover:bg-white/45"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.badgeBg} ${item.iconColor} shadow-sm`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Peach Callout Card */}
          <div className="mt-6 space-y-2.5">
            <div className="rounded-[26px] bg-gradient-to-b from-[#FCE6DC] to-[#F7D3C2] border-2 border-white/80 p-4 text-center shadow-[0_10px_24px_rgba(215,135,105,0.16)]">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-b from-[#FAD25A] to-[#F2B830] text-white shadow-md border border-white/60">
                <Crown className="h-5 w-5 fill-white" />
              </div>
              <h3 className="mt-2.5 text-sm font-extrabold text-[#2D2A26]">
                {isMahasiswa
                  ? "Konsultasi Langsung Admin"
                  : "Triase & Jurnal Hari Ini"}
              </h3>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[#6E5D55]">
                {isMahasiswa
                  ? "Hubungi & chat langsung dengan Admin BK kapan saja secara aman!"
                  : "Catat aktivitas konseling & jurnal SOAP dengan cepat & rapi!"}
              </p>
              <button
                onClick={() =>
                  setActiveNav(isMahasiswa ? "konsultasi_admin" : "jurnal_soap")
                }
                className="mt-3.5 w-full clay-btn-coral rounded-full py-2.5 px-4 text-xs font-extrabold text-white transition active:scale-95"
              >
                {isMahasiswa
                  ? "+ Chat Konsultasi Admin"
                  : "+ Isi Jurnal Cepat"}
              </button>
            </div>

            <a
              href="/narasa-konseling.apk"
              download="NARASA-Konseling-Mahasiswa.apk"
              className="w-full rounded-full bg-[#2E7D67] hover:bg-[#256654] py-2.5 px-4 text-xs font-extrabold text-white border border-white shadow-sm flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              Download APK Android
            </a>

            <button
              onClick={handleLogout}
              className="w-full rounded-full bg-white/75 hover:bg-white py-2.5 px-4 text-xs font-extrabold text-[#5C5346] border border-white shadow-sm flex items-center justify-center gap-2 transition"
            >
              <LogOut className="h-3.5 w-3.5 text-[#D9603B]" />
              Keluar / Ganti Akun Login
            </button>
          </div>
        </aside>

        {/* ============================================================
            RIGHT MAIN CREAM SHELL (Matches Reference Image)
           ============================================================ */}
        <main className="clay-shell flex-1 rounded-[36px] p-5 sm:p-7 lg:p-8 flex flex-col justify-between overflow-hidden">
          <div className="space-y-6">
            {/* TOP HEADER BAR */}
            <header className="flex flex-wrap items-center justify-between gap-4 no-print">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-[#FCFBF8] border-2 border-white shadow-sm p-1 flex items-center justify-center overflow-hidden">
                  <img
                    src="/logo-narasa.jpg"
                    alt="NARASA"
                    className="h-full w-full object-contain"
                  />
                </div>
                <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#2D2A26]">
                  {headerTitleMap[activeNav]}
                </h1>
                <span className="rounded-full bg-[#F9E69B] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#6E5611] shadow-sm border border-white/70">
                  {isMahasiswa
                    ? session.isAnonymous
                      ? "NARASA • SAMARAN AES-256"
                      : `NARASA • SSO ${session.identifier}`
                    : "NARASA • PETUGAS BK AES-256"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Search Input Pill */}
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 h-4 w-4 text-[#8C867E]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isMahasiswa
                        ? "Cari kode tiket atau nama konselor..."
                        : "Cari klien samaran, tiket, materi..."
                    }
                    className="w-52 sm:w-64 rounded-full bg-[#F3F0E8] border border-white pl-9 pr-4 py-2.5 text-xs font-medium text-[#2D2A26] placeholder-[#969086] shadow-inner focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E88A6B]/40"
                  />
                </div>

                {/* Notification Bell with Badge '2' */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifPopover(!showNotifPopover)}
                    className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#F3F0E8] border border-white text-[#5C5346] shadow-sm hover:bg-white transition"
                    title="Notifikasi Sistem & Pengingat Jadwal"
                  >
                    <Bell className="h-4 w-4 fill-[#6B5A4C]" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#E66A46] text-[10px] font-extrabold text-white ring-2 ring-white">
                      2
                    </span>
                  </button>

                  {showNotifPopover && (
                    <div className="absolute right-0 mt-2 w-80 rounded-3xl bg-white p-4 shadow-2xl border border-slate-100 z-50 text-xs space-y-2.5">
                      <div className="flex items-center justify-between font-extrabold text-[#2D2A26] border-b pb-2">
                        <span>Notifikasi Layanan BK</span>
                        <button
                          onClick={() => setShowNotifPopover(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          Tutup
                        </button>
                      </div>
                      <div className="rounded-2xl bg-[#FCE8DF] p-3 text-[#6E3422]">
                        <div className="font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-[#D95338]" />
                          Protokol Krisis Siaga 24/7 (FR-02)
                        </div>
                        <p className="mt-0.5 text-[11px]">
                          Pemindai kata kunci darurat aktif (&lt; 1 milidetik).
                          Hotline 119 ext. 8 siaga.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#E1F2EC] p-3 text-[#215A49]">
                        <div className="font-bold">
                          Pengingat Otomatis WhatsApp (FR-08)
                        </div>
                        <p className="mt-0.5 text-[11px]">
                          Pengingat H-1 dan H-2 jam aktif untuk seluruh tiket
                          konseling terjadwal.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Download APK Button in Header */}
                <a
                  href="/narasa-konseling.apk"
                  download="NARASA-Konseling-Mahasiswa.apk"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#2E7D67] hover:bg-[#256654] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition active:scale-95"
                  title="Unduh Aplikasi Android NARASA (.APK)"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download APK</span>
                </a>

                {/* Logout / Return to Login Screen Button */}
                <button
                  onClick={handleLogout}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DCEEE7] border border-white text-[#2E7D67] shadow-sm hover:bg-[#CBE5DC] transition"
                  title="Keluar & Kembali ke Halaman Login Mahasiswa / Admin"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* ============================================================
                VIEW 1A: BERANDA KHUSUS MAHASISWA (When logged in as Mahasiswa)
               ============================================================ */}
            {activeNav === "dashboard" && isMahasiswa && (
              <div className="space-y-6">
                {/* Peach Hero Banner for Mahasiswa */}
                <div className="clay-hero-peach rounded-[30px] p-6 sm:p-7 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 max-w-2xl">
                      <div className="h-24 w-24 shrink-0 rounded-[26px] bg-[#FCFBF7] border-2 border-white shadow-[0_12px_26px_rgba(195,125,100,0.22)] flex items-center justify-center p-2">
                        <svg
                          viewBox="0 0 100 100"
                          className="h-full w-full"
                          aria-label="Student Avatar"
                        >
                          <circle cx="50" cy="50" r="44" fill="#F8E2D8" />
                          <path
                            d="M22 92 C25 72, 75 72, 78 92 Z"
                            fill="#89C4B4"
                          />
                          <rect
                            x="44"
                            y="60"
                            width="12"
                            height="12"
                            rx="4"
                            fill="#F2BE9C"
                          />
                          <rect
                            x="32"
                            y="28"
                            width="36"
                            height="36"
                            rx="17"
                            fill="#FAD1B8"
                          />
                          <path
                            d="M30 44 C30 22, 70 22, 70 44 C64 33, 36 33, 30 44 Z"
                            fill="#E67A46"
                          />
                          <circle cx="43" cy="46" r="2.2" fill="#2D2A26" />
                          <circle cx="57" cy="46" r="2.2" fill="#2D2A26" />
                          <path
                            d="M45 53 Q50 57 55 53"
                            stroke="#8A4832"
                            strokeWidth="2.2"
                            fill="none"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      <div className="space-y-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-1 text-[11px] font-extrabold text-[#C46A4E] shadow-sm">
                          <span>☀️</span>
                          <span>
                            {session.prodi ||
                              "Layanan Bimbingan & Konseling Mahasiswa"}
                          </span>
                        </span>

                        <h2 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-[#2D2A26] leading-tight">
                          Halo, {session.displayName}! Kamu Tidak Sendirian ☀️
                        </h2>

                        <p className="text-xs sm:text-[13.5px] text-[#5F544E] leading-relaxed max-w-xl">
                          Kamu bisa langsung mengirim pesan konsultasi 2 arah ke{" "}
                          <strong>Admin Utama BK NARASA</strong> di bawah ini,
                          atau melakukan skrining mandiri PHQ-4 dan memilih
                          jadwal sesi konseling.
                        </p>

                        <div className="pt-1.5 flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => setActiveNav("konsultasi_admin")}
                            className="clay-btn-coral inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold text-white transition active:scale-95"
                          >
                            <MessageCircleHeart className="h-3.5 w-3.5" />
                            Chat Konsultasi ke Admin BK
                          </button>

                          <button
                            onClick={() => setActiveNav("chatbox")}
                            className="clay-btn-white inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold text-[#2D2A26] transition hover:bg-white active:scale-95"
                          >
                            <Play className="h-3.5 w-3.5 text-[#4E9682]" />
                            Skrining PHQ-4 & Booking Jadwal
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center justify-center pr-2">
                      <svg
                        viewBox="0 0 90 120"
                        className="h-28 w-20 drop-shadow-sm"
                        aria-label="Cactus Plant"
                      >
                        <ellipse
                          cx="34"
                          cy="48"
                          rx="12"
                          ry="24"
                          fill="#68A38B"
                        />
                        <ellipse
                          cx="56"
                          cy="48"
                          rx="12"
                          ry="24"
                          fill="#4F8A73"
                        />
                        <ellipse
                          cx="45"
                          cy="42"
                          rx="13"
                          ry="28"
                          fill="#5B9880"
                        />
                        <path
                          d="M24 70 L66 70 L60 106 C59 110, 31 110, 30 106 Z"
                          fill="#E2CBB0"
                        />
                        <rect
                          x="21"
                          y="66"
                          width="48"
                          height="7"
                          rx="3.5"
                          fill="#D7BE9E"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 4 Pastel Clay Stat Cards for Mahasiswa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  <button
                    onClick={() => setActiveNav("konsultasi_admin")}
                    className="clay-card-mint rounded-[28px] p-5 text-left transition hover:-translate-y-0.5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#559A87] text-white shadow-md">
                      <MessageCircleHeart className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-xs font-semibold text-[#5E6E68]">
                      Chat Konsultasi Admin
                    </div>
                    <div className="mt-1 text-2xl font-extrabold text-[#2D2A26]">
                      Online 24/7
                    </div>
                    <div className="mt-2 text-xs font-extrabold text-[#2A856A]">
                      Klik untuk Chat Langsung →
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveNav("chatbox")}
                    className="clay-card-peach rounded-[28px] p-5 text-left transition hover:-translate-y-0.5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EE7854] text-white shadow-md">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-xs font-semibold text-[#6E5C56]">
                      Skrining Mandiri
                    </div>
                    <div className="mt-1 text-2xl font-extrabold text-[#2D2A26]">
                      PHQ-4
                    </div>
                    <div className="mt-2 text-xs font-extrabold text-[#2A856A]">
                      Cek Kondisi Emosimu →
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveNav("selfhelp")}
                    className="clay-card-butter rounded-[28px] p-5 text-left transition hover:-translate-y-0.5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4B942] text-white shadow-md">
                      <Wind className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-xs font-semibold text-[#6E644C]">
                      Relaksasi Mandiri
                    </div>
                    <div className="mt-1 text-3xl font-extrabold text-[#2D2A26]">
                      4-7-8
                    </div>
                    <div className="mt-2 text-xs font-extrabold text-[#2A856A]">
                      Audio 432Hz & Grounding
                    </div>
                  </button>

                  <div className="clay-card-sky rounded-[28px] p-5 text-left">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#689FD4] text-white shadow-md">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-xs font-semibold text-[#556678]">
                      Perlindungan Privasi
                    </div>
                    <div className="mt-1 text-3xl font-extrabold text-[#2D2A26]">
                      100%
                    </div>
                    <div className="mt-2 text-xs font-extrabold text-[#4E647E]">
                      Terenkripsi AES-256
                    </div>
                  </div>
                </div>

                {/* Direct 2-Way Consultation Room with Admin on Student Dashboard */}
                <StudentDirectConsult
                  studentName={session.displayName}
                  studentIdentifier={session.identifier}
                  studentProdi={
                    session.prodi ||
                    "BKPI (Bimbingan & Konseling Pendidikan Islam)"
                  }
                  isAnonymous={Boolean(session.isAnonymous)}
                  tickets={ticketsAdminView}
                  allMessages={liveChatMessages}
                  onDataChanged={loadState}
                />
              </div>
            )}

            {/* ============================================================
                VIEW 1A-2: MENU KHUSUS CHAT KONSULTASI LANGSUNG KE ADMIN (MAHASISWA)
               ============================================================ */}
            {activeNav === "konsultasi_admin" && isMahasiswa && (
              <StudentDirectConsult
                studentName={session.displayName}
                studentIdentifier={session.identifier}
                studentProdi={
                  session.prodi ||
                  "BKPI (Bimbingan & Konseling Pendidikan Islam)"
                }
                isAnonymous={Boolean(session.isAnonymous)}
                tickets={ticketsAdminView}
                allMessages={liveChatMessages}
                onDataChanged={loadState}
              />
            )}

            {/* ============================================================
                VIEW 1B: DASHBOARD UTAMA ADMIN & KONSELOR (Matches Reference Image)
               ============================================================ */}
            {activeNav === "dashboard" && !isMahasiswa && (
              <div className="space-y-6">
                {/* PEACH HERO BANNER CARD */}
                <div className="clay-hero-peach rounded-[30px] p-6 sm:p-7 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 max-w-2xl">
                      {/* Left Raised White Squircle Avatar with Headset */}
                      <div className="h-24 w-24 shrink-0 rounded-[26px] bg-[#FCFBF7] border-2 border-white shadow-[0_12px_26px_rgba(195,125,100,0.22)] flex items-center justify-center p-2">
                        <svg
                          viewBox="0 0 100 100"
                          className="h-full w-full"
                          aria-label="Counselor Avatar"
                        >
                          <circle cx="50" cy="50" r="44" fill="#F8E2D8" />
                          <path
                            d="M22 92 C25 72, 75 72, 78 92 Z"
                            fill="#89C4B4"
                          />
                          <rect
                            x="44"
                            y="60"
                            width="12"
                            height="12"
                            rx="4"
                            fill="#F2BE9C"
                          />
                          <rect
                            x="32"
                            y="28"
                            width="36"
                            height="36"
                            rx="17"
                            fill="#FAD1B8"
                          />
                          <path
                            d="M30 44 C30 22, 70 22, 70 44 C64 33, 36 33, 30 44 Z"
                            fill="#E67A46"
                          />
                          <path
                            d="M28 46 A22 22 0 0 1 72 46"
                            stroke="#5A463C"
                            strokeWidth="3"
                            fill="none"
                          />
                          <rect
                            x="24"
                            y="42"
                            width="6"
                            height="11"
                            rx="3"
                            fill="#E06344"
                          />
                          <rect
                            x="70"
                            y="42"
                            width="6"
                            height="11"
                            rx="3"
                            fill="#E06344"
                          />
                          <path
                            d="M72 52 Q66 60 54 59"
                            stroke="#5A463C"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                          />
                          <circle cx="43" cy="46" r="2.2" fill="#2D2A26" />
                          <circle cx="57" cy="46" r="2.2" fill="#2D2A26" />
                          <path
                            d="M45 53 Q50 57 55 53"
                            stroke="#8A4832"
                            strokeWidth="2.2"
                            fill="none"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      {/* Center Greeting & CTA Buttons */}
                      <div className="space-y-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-1 text-[11px] font-extrabold text-[#C46A4E] shadow-sm">
                          <span>☀️</span>
                          <span>
                            Semester Genap • Tahun Ajaran Aktif 24/7
                          </span>
                        </span>

                        <h2 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-[#2D2A26] leading-tight">
                          Selamat Bertugas, {session.displayName.split(",")[0]}! ☀️
                        </h2>

                        <p className="text-xs sm:text-[13.5px] text-[#5F544E] leading-relaxed max-w-xl">
                          Kelola triase awal mahasiswa, rekap skor skrining
                          PHQ-4, dan jurnal SOAP konseling dengan lebih hangat
                          dan menyenangkan hari ini.
                        </p>

                        <div className="pt-1.5 flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => setActiveNav("balas_chat")}
                            className="clay-btn-coral inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold text-white transition active:scale-95"
                          >
                            <MessageCircleHeart className="h-3.5 w-3.5" />
                            Balas Chat Mahasiswa ({liveChatMessages.length} Pesan)
                          </button>

                          <button
                            onClick={() => setActiveNav("jurnal_soap")}
                            className="clay-btn-white inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold text-[#2D2A26] transition hover:bg-white active:scale-95"
                          >
                            <BarChart2 className="h-3.5 w-3.5 text-[#4E9682]" />
                            Input SOAP & PHQ-4
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Potted Cactus SVG Illustration */}
                    <div className="hidden sm:flex items-center justify-center pr-2">
                      <svg
                        viewBox="0 0 90 120"
                        className="h-28 w-20 drop-shadow-sm"
                        aria-label="Cactus Plant"
                      >
                        <ellipse
                          cx="34"
                          cy="48"
                          rx="12"
                          ry="24"
                          fill="#68A38B"
                        />
                        <ellipse
                          cx="56"
                          cy="48"
                          rx="12"
                          ry="24"
                          fill="#4F8A73"
                        />
                        <ellipse
                          cx="45"
                          cy="42"
                          rx="13"
                          ry="28"
                          fill="#5B9880"
                        />
                        <path
                          d="M24 70 L66 70 L60 106 C59 110, 31 110, 30 106 Z"
                          fill="#E2CBB0"
                        />
                        <rect
                          x="21"
                          y="66"
                          width="48"
                          height="7"
                          rx="3.5"
                          fill="#D7BE9E"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 4 PASTEL CLAY STAT CARDS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  <button
                    onClick={() => setActiveNav("akun_mahasiswa")}
                    className="clay-card-mint rounded-[28px] p-5 text-left transition hover:-translate-y-0.5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#559A87] text-white shadow-[0_6px_14px_rgba(85,154,135,0.35)]">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-xs font-semibold text-[#5E6E68]">
                      Total Mahasiswa
                    </div>
                    <div className="mt-1 text-3xl font-extrabold text-[#2D2A26]">
                      {studentAccounts.length}
                    </div>
                    <div className="mt-2 text-xs font-extrabold text-[#2A856A]">
                      Mahasiswa Aktif Terdaftar
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveNav("nilai_phq4")}
                    className="clay-card-peach rounded-[28px] p-5 text-left transition hover:-translate-y-0.5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EE7854] text-white shadow-[0_6px_14px_rgba(238,120,84,0.35)]">
                      <Monitor className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-xs font-semibold text-[#6E5C56]">
                      Data Program Studi
                    </div>
                    <div className="mt-1 text-3xl font-extrabold text-[#2D2A26]">
                      2
                    </div>
                    <div className="mt-2 text-xs font-extrabold text-[#2A856A]">
                      BKPI & PIAUD Aktif
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveNav("balas_chat")}
                    className="clay-card-butter rounded-[28px] p-5 text-left transition hover:-translate-y-0.5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4B942] text-white shadow-[0_6px_14px_rgba(244,185,66,0.35)]">
                      <MessageCircleHeart className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-xs font-semibold text-[#6E644C]">
                      Pesan Konsultasi
                    </div>
                    <div className="mt-1 text-3xl font-extrabold text-[#2D2A26]">
                      {liveChatMessages.length}
                    </div>
                    <div className="mt-2 text-xs font-extrabold text-[#2A856A]">
                      Total Chat Masuk & Balasan
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveNav("jurnal_soap")}
                    className="clay-card-sky rounded-[28px] p-5 text-left transition hover:-translate-y-0.5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#689FD4] text-white shadow-[0_6px_14px_rgba(104,159,212,0.35)]">
                      <Flame className="h-5 w-5 fill-white" />
                    </div>
                    <div className="mt-4 text-xs font-semibold text-[#556678]">
                      Jurnal & SOAP BK
                    </div>
                    <div className="mt-1 text-3xl font-extrabold text-[#2D2A26]">
                      {ticketsAdminView.length}
                    </div>
                    <div className="mt-2 text-xs font-extrabold text-[#4E647E]">
                      Pertemuan Tercatat
                    </div>
                  </button>
                </div>

                {/* 2 BOTTOM CHARTS ROW (3D Pill Bar Chart + Donut Composition Chart) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Grafik Aktivitas Konseling (3D Soft Pill Bars) */}
                  <div className="clay-card-white lg:col-span-6 rounded-[30px] p-6 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-[#2D2A26]">
                          Grafik Aktivitas Konseling & Triase
                        </h3>
                        <p className="text-xs text-[#8C857B] mt-0.5">
                          Statistik konsultasi & penyelesaian skrining mahasiswa per hari
                        </p>
                      </div>
                      <span className="rounded-full bg-[#F6F4EE] border border-slate-200/70 px-3.5 py-1 text-xs font-extrabold text-[#2D2A26] shadow-sm">
                        Minggu Ini
                      </span>
                    </div>

                    <div className="mt-8 pt-4 flex items-end justify-between gap-3 h-48 px-2">
                      {weeklyBars.map((bar) => (
                        <div
                          key={bar.day}
                          className="group flex-1 flex flex-col items-center h-full justify-end"
                        >
                          <div className="opacity-0 group-hover:opacity-100 transition mb-1.5 rounded-lg bg-[#2D2A26] px-2 py-0.5 text-[10px] font-bold text-white whitespace-nowrap">
                            {bar.sessions}
                          </div>
                          <div
                            className={`w-8 sm:w-10 rounded-full bg-gradient-to-b ${bar.gradient} transition-all duration-500 group-hover:scale-105`}
                            style={{
                              height: `${bar.heightPct}%`,
                              boxShadow: `0 10px 18px ${bar.shadow}, inset 0 2px 4px rgba(255,255,255,0.55)`,
                            }}
                          />
                          <div className="mt-2 h-1.5 w-7 rounded-full bg-slate-300/60 blur-[1px]" />
                          <span className="mt-2 text-xs font-bold text-[#5C564F]">
                            {bar.day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Komposisi Status & Tingkat Urgensi PHQ-4 (SVG Donut Chart) */}
                  <div className="clay-card-white lg:col-span-6 rounded-[30px] p-6 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-[#2D2A26]">
                          Komposisi Tingkat Urgensi & Status Tiket
                        </h3>
                        <p className="text-xs text-[#8C857B] mt-0.5">
                          Distribusi penyelesaian konsultasi & skrining PHQ-4
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setDonutMode(
                            donutMode === "kehadiran" ? "phq4" : "kehadiran"
                          )
                        }
                        className="rounded-full bg-[#F6F4EE] border border-slate-200/70 px-3.5 py-1 text-xs font-extrabold text-[#2D2A26] shadow-sm hover:bg-white transition"
                      >
                        Detail
                      </button>
                    </div>

                    <div className="my-6 flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
                      <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
                        <svg
                          viewBox="0 0 120 120"
                          className="h-full w-full -rotate-90"
                        >
                          <circle
                            cx="60"
                            cy="60"
                            r="46"
                            fill="none"
                            stroke="#F2EFE9"
                            strokeWidth="16"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="46"
                            fill="none"
                            stroke="#559A87"
                            strokeWidth="16"
                            strokeDasharray={`${(hadirPct / 100) * 289} 289`}
                            strokeLinecap="round"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="46"
                            fill="none"
                            stroke="#F4B942"
                            strokeWidth="16"
                            strokeDasharray={`${
                              (reschedulePct / 100) * 289
                            } 289`}
                            strokeDashoffset={`-${(hadirPct / 100) * 289}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-extrabold text-[#2D2A26]">
                            {hadirPct}%
                          </span>
                          <span className="text-xs font-semibold text-[#7A746B]">
                            Tuntas
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 w-full space-y-3 text-xs">
                        {[
                          {
                            color: "bg-[#559A87]",
                            label: "Sesi Aktif / Selesai",
                            val: `${hadirPct}% (${hadirCount})`,
                          },
                          {
                            color: "bg-[#F4B942]",
                            label: "Menunggu Tindak Lanjut",
                            val: `${reschedulePct}% (${
                              rescheduleCount || 1
                            })`,
                          },
                          {
                            color: "bg-[#689FD4]",
                            label: "Konsultasi Daring",
                            val: `${ticketsAdminView.filter((t) => t.modality_selected.includes("Daring") || t.modality_selected.includes("Chat")).length} Tiket`,
                          },
                          {
                            color: "bg-[#EE7854]",
                            label: "Konsultasi Luring",
                            val: `${ticketsAdminView.filter((t) => t.modality_selected.includes("Luring")).length} Tiket`,
                          },
                        ].map((row) => (
                          <div
                            key={row.label}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`h-3.5 w-3.5 rounded-full ${row.color} shadow-sm`}
                              />
                              <span className="font-semibold text-[#5C564F]">
                                {row.label}
                              </span>
                            </div>
                            <span className="font-extrabold text-[#2D2A26]">
                              {row.val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================
                VIEW: INBOX LIVE CHAT 2 ARAH (ADMIN MEMBALAS CHAT MAHASISWA)
               ============================================================ */}
            {activeNav === "balas_chat" && !isMahasiswa && (
              <AdminLiveChatInbox
                tickets={ticketsAdminView}
                allMessages={liveChatMessages}
                adminName={session.displayName}
                onDataChanged={loadState}
              />
            )}

            {/* ============================================================
                VIEW: MANAJEMEN DATA & AKUN MAHASISWA (TAMBAH & HAPUS)
               ============================================================ */}
            {activeNav === "akun_mahasiswa" && !isMahasiswa && (
              <StudentAccountsManager
                studentAccounts={studentAccounts}
                onDataChanged={loadState}
              />
            )}

            {/* ============================================================
                VIEW 2: CHATBOX TRIASE 24/7
               ============================================================ */}
            {activeNav === "chatbox" && (
              <ChatboxWidget
                counselors={counselors}
                schedules={schedules}
                onDataChanged={loadState}
                onOpenSelfHelpTab={() => setActiveNav("selfhelp")}
                studentName={isMahasiswa ? session.displayName : undefined}
                studentProdi={isMahasiswa ? session.prodi : undefined}
              />
            )}

            {/* ============================================================
                VIEW 3A: TIKET KONSELING SAYA (KHUSUS MAHASISWA)
               ============================================================ */}
            {activeNav === "mahasiswa_tiket" && isMahasiswa && (
              <div className="space-y-5">
                <div className="clay-card-white rounded-[28px] p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold text-[#2D2A26]">
                        Cek Status Tiket Konseling Saya
                      </h3>
                      <p className="text-xs text-[#7A746B]">
                        Masukkan kode tiket konseling Anda untuk melihat status
                        konsultasi atau membuka tautan Google Meet.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ticketLookupInput}
                        onChange={(e) => setTicketLookupInput(e.target.value)}
                        placeholder="Kode Tiket (BK-...)"
                        className="rounded-full bg-[#F3F0E8] px-4 py-2 text-xs font-extrabold text-[#2D2A26]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {filteredTickets.map((t) => (
                      <div
                        key={t.ticket_code}
                        className="clay-card-mint rounded-[24px] p-5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-extrabold text-[#2D2A26]">
                            {t.ticket_code}
                          </span>
                          <span className="rounded-full bg-white px-3 py-0.5 text-[11px] font-extrabold text-[#2E7D67]">
                            {t.status}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#2D2A26]">
                          Konselor: {t.counselor_name}
                        </div>
                        <div className="text-xs text-[#4E5A54]">
                          Modalitas: <strong>{t.modality_selected}</strong>
                        </div>
                        {t.meet_link && (
                          <a
                            href={t.meet_link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-extrabold text-[#2E7D67] shadow-sm"
                          >
                            <Video className="h-3.5 w-3.5" />
                            Buka Ruang Google Meet
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================
                VIEW 3B: JURNAL & SOAP NOTES / ANTREAN KONSELOR (PETUGAS BK)
               ============================================================ */}
            {!isMahasiswa &&
              (activeNav === "jurnal_soap" ||
                activeNav === "mahasiswa_tiket") && (
                <CounselorDashboard
                  counselors={counselors}
                  schedules={schedules}
                  crisisLogs={crisisLogs}
                  onDataChanged={loadState}
                />
              )}

            {/* ============================================================
                VIEW 4: SKOR PHQ-4, LEGER & ANALITIK KAMPUS (FR-11)
               ============================================================ */}
            {activeNav === "nilai_phq4" && (
              <AdminAnalyticsDashboard
                analytics={analytics}
                tickets={ticketsAdminView}
                onDataChanged={loadState}
              />
            )}

            {/* ============================================================
                VIEW 5: DATA AKUN KONSELOR & KONSELOR SEBAYA
               ============================================================ */}
            {activeNav === "prodi_konselor" && (
              <div className="space-y-5">
                <div className="clay-hero-peach rounded-[28px] p-6">
                  <h2 className="text-xl font-extrabold text-[#2D2A26]">
                    Direktori Dosen BK Ahli & Konselor Sebaya (Peer Counselor)
                  </h2>
                  <p className="text-xs text-[#5F544E] mt-1">
                    Sistem memisahkan rujukan kasus ringan (Skor PHQ-4 0–5) ke
                    Konselor Sebaya dan kasus klinis/berat (Skor PHQ-4 6–12) ke
                    Dosen BK Ahli.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {counselors.map((c, i) => {
                    const cardClass =
                      i % 3 === 0
                        ? "clay-card-mint"
                        : i % 3 === 1
                        ? "clay-card-peach"
                        : "clay-card-butter";
                    const openSlots = schedules.filter(
                      (s) => s.counselor_id === c.id && !s.is_booked
                    ).length;

                    return (
                      <div
                        key={c.id}
                        className={`${cardClass} rounded-[28px] p-5 flex flex-col justify-between`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-white/85 px-3 py-1 text-[10px] font-extrabold text-[#2D2A26]">
                              {c.is_peer_counselor
                                ? "Konselor Sebaya"
                                : "Dosen BK / Psikolog"}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#287D63]">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  c.online_status
                                    ? "bg-[#2EB886]"
                                    : "bg-slate-400"
                                }`}
                              />
                              {c.online_status ? "Online" : "Offline"}
                            </span>
                          </div>
                          <h3 className="mt-3 text-base font-extrabold text-[#2D2A26]">
                            {c.name}
                          </h3>
                          <p className="text-xs font-semibold text-[#5C564F]">
                            {c.role_title} • ID: {c.nip_nidn}
                          </p>
                          <p className="mt-2 text-xs text-[#5C564F] leading-relaxed">
                            {c.bio}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/60 flex items-center justify-between text-xs">
                          <span className="font-bold text-[#2D2A26]">
                            Slot Tersedia: {openSlots} / {c.max_daily_slots}
                          </span>
                          <button
                            onClick={() => setActiveNav("chatbox")}
                            className="rounded-full bg-white px-3.5 py-1.5 font-extrabold text-[#2D2A26] shadow-sm hover:bg-[#FCFBF7]"
                          >
                            Pilih Jadwal →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================
                VIEW 6: SELF-HELP & GROUNDING EXERCISE 4-7-8 (FR-09)
               ============================================================ */}
            {activeNav === "selfhelp" && <SelfHelpModule />}
          </div>

          {/* Subtle Footer inside Main Shell */}
          <footer className="mt-8 pt-4 border-t border-[#ECE8DF] flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-[#8C857B] no-print">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#559A87]" />
              <span>
                <strong>Konsel.In (CC-Chatbox)</strong> • Login Aktif:{" "}
                <strong>{session.displayName}</strong> ({session.subRoleLabel})
              </span>
            </div>
            <div>
              Integrasi SIAKAD SSO • WhatsApp Gateway • Google Meet • Hotline
              Darurat 119 ext. 8
            </div>
          </footer>
        </main>
      </div>

      {/* Floating Responsive Web Widget Popup Launcher */}
      <div className="fixed bottom-5 right-5 z-40 no-print">
        {floatingWidgetOpen ? (
          <div className="w-[370px] sm:w-[430px] max-h-[84vh] overflow-y-auto rounded-[32px] border-2 border-white bg-[#FCFBF7] shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-[#559A87] to-[#EE7854] px-5 py-3 text-white">
              <span className="text-xs font-extrabold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Widget Chatbox Konseling Kampus 24/7
              </span>
              <button
                onClick={() => setFloatingWidgetOpen(false)}
                className="rounded-full bg-white/20 p-1 hover:bg-white/30"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
            <div className="p-2">
              <ChatboxWidget
                counselors={counselors}
                schedules={schedules}
                onDataChanged={loadState}
                onOpenSelfHelpTab={() => {
                  setFloatingWidgetOpen(false);
                  setActiveNav("selfhelp");
                }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setFloatingWidgetOpen(true)}
            className="clay-btn-coral flex items-center gap-2.5 rounded-full px-5 py-3.5 text-xs font-extrabold text-white transition hover:scale-105"
          >
            <MessageCircleHeart className="h-5 w-5" />
            <span>Chatbox Triase Cepat</span>
          </button>
        )}
      </div>
    </div>
  );
}
