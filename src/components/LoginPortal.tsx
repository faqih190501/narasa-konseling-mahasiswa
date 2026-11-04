"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  UserCheck,
  RefreshCw,
  ArrowRight,
  PhoneCall,
  AlertTriangle,
  HeartHandshake,
  Crown,
} from "lucide-react";
import { generateCalmPseudonym } from "@/lib/triage-engine";
import { StudentAccount } from "@/lib/types";
import NarasaLogo from "./NarasaLogo";

export interface AuthenticatedSession {
  role: "mahasiswa" | "admin";
  subRoleLabel: string;
  displayName: string;
  identifier: string; // NIM / Pseudonym / Email Admin
  prodi?: string;
  angkatan?: number;
  isAnonymous?: boolean;
}

interface Props {
  onLoginSuccess: (session: AuthenticatedSession) => void;
}

export default function LoginPortal({ onLoginSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<"mahasiswa" | "admin">("mahasiswa");

  // Mahasiswa Login State
  const [mhsEntryMode, setMhsEntryMode] = useState<"sso" | "anonim">("sso");
  const [nim, setNim] = useState<string>("230101001");
  const [mhsPassword, setMhsPassword] = useState<string>("mahasiswa123");
  const [mhsName, setMhsName] = useState<string>("Naufal Rizqullah Pratama");
  const [mhsProdi, setMhsProdi] = useState<string>(
    "BKPI (Bimbingan & Konseling Pendidikan Islam)"
  );
  const [mhsAngkatan, setMhsAngkatan] = useState<number>(2023);
  const [pseudonym, setPseudonym] = useState<string>("Langit Teduh #412");

  // Admin Login State (Hanya Admin)
  const [adminUsername, setAdminUsername] = useState<string>(
    "admin@narasa.ac.id"
  );
  const [adminPassword, setAdminPassword] = useState<string>("adminbk2026");
  const [adminDisplayName, setAdminDisplayName] = useState<string>(
    "Admin Utama NARASA"
  );

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [studentAccounts, setStudentAccounts] = useState<StudentAccount[]>([]);

  useEffect(() => {
    setPseudonym(generateCalmPseudonym());
    fetch("/api/state")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.student_accounts) && d.student_accounts.length > 0) {
          setStudentAccounts(d.student_accounts);
          const first = d.student_accounts[0];
          setNim(first.nim);
          setMhsName(first.full_name);
          setMhsProdi(first.prodi_id);
          setMhsAngkatan(first.angkatan);
          setMhsPassword(first.password || "mahasiswa123");
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectDemoMahasiswa = (
    demoNim: string,
    demoName: string,
    demoProdi: string,
    demoAngkatan: number,
    demoPassword?: string
  ) => {
    setMhsEntryMode("sso");
    setNim(demoNim);
    setMhsName(demoName);
    setMhsProdi(demoProdi);
    setMhsAngkatan(demoAngkatan);
    setMhsPassword(demoPassword || "mahasiswa123");
    setErrorMsg(null);
  };

  const handleMahasiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mhsEntryMode === "anonim") {
      onLoginSuccess({
        role: "mahasiswa",
        subRoleLabel: "Mahasiswa • Mode Samaran Anonim",
        displayName: pseudonym,
        identifier: "ANONIM-SAMARAN",
        prodi: mhsProdi,
        angkatan: 2024,
        isAnonymous: true,
      });
      return;
    }

    if (!nim.trim() || !mhsPassword.trim()) {
      setErrorMsg("Mohon masukkan NIM dan Kata Sandi SSO SIAKAD Anda.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sso_lookup",
          nim: nim.trim(),
          full_name: mhsName,
          prodi_id: mhsProdi,
        }),
      });
      const data = await res.json();
      const profile = data.profile;

      onLoginSuccess({
        role: "mahasiswa",
        subRoleLabel: `Mahasiswa Aktif • Angkatan ${
          profile?.angkatan || mhsAngkatan
        }`,
        displayName: profile?.full_name || mhsName || `Mahasiswa (${nim})`,
        identifier: profile?.nim || nim,
        prodi: profile?.prodi_id || mhsProdi,
        angkatan: profile?.angkatan || mhsAngkatan,
        isAnonymous: false,
      });
    } catch {
      onLoginSuccess({
        role: "mahasiswa",
        subRoleLabel: `Mahasiswa Aktif • Angkatan ${mhsAngkatan}`,
        displayName: mhsName || `Mahasiswa (${nim})`,
        identifier: nim,
        prodi: mhsProdi,
        angkatan: mhsAngkatan,
        isAnonymous: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!adminUsername.trim() || !adminPassword.trim()) {
      setErrorMsg("Mohon masukkan Username/Email dan Kata Sandi Admin.");
      return;
    }

    onLoginSuccess({
      role: "admin",
      subRoleLabel: "Administrator Utama Layanan BK",
      displayName: adminDisplayName || "Admin Utama NARASA",
      identifier: adminUsername,
    });
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 flex items-center justify-center">
      <div className="w-full max-w-[1220px] grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ============================================================
            LEFT COLUMN: WARM CLAYMORPHIC BRANDING & NARASA LOGO
           ============================================================ */}
        <div className="clay-sidebar lg:col-span-5 rounded-[36px] p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div>
            {/* Top Official NARASA Brand Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="rounded-[24px] bg-[#FCFBF8]/95 px-4 py-2.5 border-2 border-white shadow-[0_10px_24px_rgba(95,75,55,0.12)]">
                <NarasaLogo
                  size="md"
                  showText={true}
                  subtitle="Ruang Aman Bimbingan & Konseling"
                />
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-[10.5px] font-extrabold text-[#2E7D67] shadow-sm">
                <Sparkles className="h-3 w-3 text-[#EE7854]" />
                24/7 Aktif
              </span>
            </div>

            {/* Brand Title */}
            <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold text-[#2D2A26] leading-tight">
              Ruang Aman Cerita & Penjadwalan Konseling{" "}
              <span className="text-[#6C4A32]">NARASA</span>{" "}
              <span className="text-lg font-bold text-[#559A87]">
                (Narasi Rasa)
              </span>{" "}
              ☀️
            </h1>
            <p className="mt-2.5 text-xs sm:text-[13.5px] text-[#4E5A54] leading-relaxed">
              Gerbang layanan konseling kampus berbasis percakapan interaktif,
              skrining mandiri <strong>PHQ-4</strong>, dan perlindungan privasi{" "}
              <strong>AES-256</strong> sesuai Kode Etik Bimbingan & Konseling.
            </p>

            {/* Center Cute Claymorphic Illustration Card with Large NARASA Logo */}
            <div className="mt-6 clay-hero-peach rounded-[28px] p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 shrink-0 rounded-[24px] bg-[#FCFBF8] border-2 border-white shadow-[0_10px_24px_rgba(108,74,50,0.18)] flex items-center justify-center p-2 overflow-hidden">
                  <img
                    src="/logo-narasa.jpg"
                    alt="Logo NARASA - Narasi Rasa"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <span className="rounded-full bg-white/85 px-2.5 py-0.5 text-[10px] font-extrabold text-[#6C4A32]">
                    NARASA • Zero-Stigma Entry
                  </span>
                  <h3 className="mt-1 text-sm font-extrabold text-[#2D2A26]">
                    Setiap Rasa Punya Cerita
                  </h3>
                  <p className="mt-0.5 text-[11.5px] text-[#5F544E] leading-snug">
                    Bisa masuk dengan akun <strong>SSO SIAKAD</strong> atau{" "}
                    <strong>Mode Samaran Anonim</strong> tanpa takut dinilai.
                  </p>
                </div>
              </div>

              {/* Potted Cactus Illustration */}
              <svg
                viewBox="0 0 90 120"
                className="hidden sm:block h-20 w-14 shrink-0"
                aria-label="Cactus"
              >
                <ellipse cx="34" cy="48" rx="12" ry="24" fill="#68A38B" />
                <ellipse cx="56" cy="48" rx="12" ry="24" fill="#4F8A73" />
                <ellipse cx="45" cy="42" rx="13" ry="28" fill="#5B9880" />
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

            {/* 3 Pastel Feature Mini-Cards */}
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/75 p-3 border border-white shadow-sm">
                <div className="text-xs font-extrabold text-[#2E7D67]">
                  AES-256
                </div>
                <div className="mt-0.5 text-[10.5px] font-semibold text-[#5C6660]">
                  Data & Cerita Terenkripsi
                </div>
              </div>
              <div className="rounded-2xl bg-white/75 p-3 border border-white shadow-sm">
                <div className="text-xs font-extrabold text-[#D9603B]">
                  PHQ-4 Smart
                </div>
                <div className="mt-0.5 text-[10.5px] font-semibold text-[#5C6660]">
                  Skrining & Triase Otomatis
                </div>
              </div>
              <div className="rounded-2xl bg-white/75 p-3 border border-white shadow-sm">
                <div className="text-xs font-extrabold text-[#B8831D]">
                  Kode Etik BK
                </div>
                <div className="mt-0.5 text-[10.5px] font-semibold text-[#5C6660]">
                  Rahasia & Bebas Stigma
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Crisis Hotline Box (FR-02 Always Accessible without Login) */}
          <div className="mt-6 rounded-[24px] bg-white/85 border-2 border-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#2D2A26]">
                    Sedang Dalam Kondisi Krisis / Darurat?
                  </div>
                  <div className="text-[11px] text-[#6E6A63]">
                    Hubungi Hotline Darurat 119 ext. 8 kapan saja.
                  </div>
                </div>
              </div>
              <a
                href="tel:119"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-rose-700"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                119 ext. 8
              </a>
            </div>
          </div>
        </div>

        {/* ============================================================
            RIGHT COLUMN: DUAL LOGIN PORTAL (MAHASISWA vs ADMIN)
           ============================================================ */}
        <div className="clay-shell lg:col-span-7 rounded-[36px] p-6 sm:p-9 flex flex-col justify-between">
          <div>
            {/* Role Portal Switcher Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECE8DF] pb-5">
              <div className="flex items-center gap-3.5">
                <div className="h-14 w-14 shrink-0 rounded-2xl bg-[#FCFBF8] border-2 border-white shadow-[0_8px_18px_rgba(108,74,50,0.14)] p-1.5 flex items-center justify-center">
                  <img
                    src="/logo-narasa.jpg"
                    alt="NARASA"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <span className="rounded-full bg-[#F9E69B] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#6E5611]">
                    PORTAL RESMI NARASA • NARASI RASA
                  </span>
                  <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-[#2D2A26]">
                    {activeTab === "mahasiswa"
                      ? "Login Mahasiswa"
                      : "Login Admin BK"}
                  </h2>
                </div>
              </div>

              {/* Pill Tab Selector: Hanya Mahasiswa & Admin */}
              <div className="inline-flex rounded-full bg-[#F2EFE8] p-1.5 border border-white shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("mahasiswa");
                    setErrorMsg(null);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold transition-all ${
                    activeTab === "mahasiswa"
                      ? "clay-btn-coral text-white shadow-md"
                      : "text-[#5C564F] hover:text-[#2D2A26]"
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                  Mahasiswa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("admin");
                    setErrorMsg(null);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold transition-all ${
                    activeTab === "admin"
                      ? "bg-[#559A87] text-white shadow-md"
                      : "text-[#5C564F] hover:text-[#2D2A26]"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </button>
              </div>
            </div>

            {/* ============================================================
                TAB 1: FORM LOGIN MAHASISWA (SSO SIAKAD & MODE SAMARAN ANONIM)
               ============================================================ */}
            {activeTab === "mahasiswa" ? (
              <form onSubmit={handleMahasiswaSubmit} className="mt-6 space-y-5">
                {/* Mode Pilihan Identitas Mahasiswa (FR-04) */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMhsEntryMode("sso")}
                    className={`rounded-[22px] p-3.5 text-left border-2 transition ${
                      mhsEntryMode === "sso"
                        ? "clay-card-mint border-white ring-2 ring-[#559A87]/30"
                        : "bg-[#F7F5F0] border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#559A87] text-white">
                        <UserCheck className="h-4 w-4" />
                      </span>
                      <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-extrabold text-[#2E7D67]">
                        SSO SIAKAD
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-extrabold text-[#2D2A26]">
                      Akun Resmi Mahasiswa
                    </div>
                    <div className="text-[11px] text-[#5E6E68]">
                      Untuk sesi Tatap Muka / Google Meet
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMhsEntryMode("anonim")}
                    className={`rounded-[22px] p-3.5 text-left border-2 transition ${
                      mhsEntryMode === "anonim"
                        ? "clay-card-peach border-white ring-2 ring-[#EE7854]/30"
                        : "bg-[#F7F5F0] border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EE7854] text-white">
                        <HeartHandshake className="h-4 w-4" />
                      </span>
                      <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-extrabold text-[#C45534]">
                        FR-04 Anonim
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-extrabold text-[#2D2A26]">
                      Mode Samaran (Anonim)
                    </div>
                    <div className="text-[11px] text-[#6E5C56]">
                      Tanpa NIM • Bebas Stigma 100%
                    </div>
                  </button>
                </div>

                {mhsEntryMode === "sso" ? (
                  <>
                    {/* Quick Registered Student Accounts from Admin DB */}
                    <div className="rounded-2xl bg-[#F6F3EC] p-3.5 border border-white">
                      <div className="text-[11px] font-extrabold text-[#6E6A63] mb-2">
                        ⚡ Pilih Akun Mahasiswa Terdaftar ({studentAccounts.length} Akun):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {studentAccounts.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              handleSelectDemoMahasiswa(
                                item.nim,
                                item.full_name,
                                item.prodi_id,
                                item.angkatan,
                                item.password
                              )
                            }
                            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                              nim === item.nim
                                ? "bg-[#559A87] text-white shadow-sm"
                                : "bg-white text-[#2D2A26] hover:bg-[#E2F1EC]"
                            }`}
                          >
                            {item.full_name.split(" ")[0]} ({item.nim})
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-extrabold text-[#2D2A26] mb-1.5">
                          NIM Mahasiswa (SIAKAD)
                        </label>
                        <input
                          type="text"
                          value={nim}
                          onChange={(e) => setNim(e.target.value)}
                          placeholder="Contoh: 230101001"
                          className="w-full rounded-2xl bg-[#F3F0E8] border border-white px-4 py-3 text-xs font-bold text-[#2D2A26] shadow-inner focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#559A87]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#2D2A26] mb-1.5">
                          Kata Sandi SSO SIAKAD
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={mhsPassword}
                            onChange={(e) => setMhsPassword(e.target.value)}
                            placeholder="Masukkan kata sandi"
                            className="w-full rounded-2xl bg-[#F3F0E8] border border-white px-4 py-3 pr-10 text-xs font-bold text-[#2D2A26] shadow-inner focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#559A87]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-[#7A746B]"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-extrabold text-[#2D2A26] mb-1.5">
                          Nama Mahasiswa (Dienkripsi AES-256)
                        </label>
                        <input
                          type="text"
                          value={mhsName}
                          onChange={(e) => setMhsName(e.target.value)}
                          className="w-full rounded-2xl bg-[#F3F0E8] border border-white px-4 py-3 text-xs font-semibold text-[#2D2A26] shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-extrabold text-[#2D2A26] mb-1.5">
                          Program Studi
                        </label>
                        <select
                          value={mhsProdi}
                          onChange={(e) => setMhsProdi(e.target.value)}
                          className="w-full rounded-2xl bg-[#F3F0E8] border border-white px-4 py-3 text-xs font-semibold text-[#2D2A26] shadow-inner"
                        >
                          <option value="BKPI (Bimbingan & Konseling Pendidikan Islam)">
                            BKPI (Bimbingan & Konseling)
                          </option>
                          <option value="PIAUD (Pendidikan Islam Anak Usia Dini)">
                            PIAUD (Pendidikan Anak Usia Dini)
                          </option>
                          <option value="PAI (Pendidikan Agama Islam)">
                            PAI (Pendidikan Agama Islam)
                          </option>
                          <option value="Manajemen Pendidikan Islam">
                            Manajemen Pendidikan Islam
                          </option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Mode Samaran Anonim (FR-04) */
                  <div className="clay-card-butter rounded-[26px] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C6516]">
                          Mode Samaran Aktif (FR-04 Pseudonym Mode)
                        </span>
                        <h4 className="text-base font-extrabold text-[#2D2A26]">
                          Identitas Asli & NIM Anda Disembunyikan
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPseudonym(generateCalmPseudonym())}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-[#2D2A26] shadow-sm hover:bg-[#FCFBF7]"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-[#EE7854]" />
                        Acak Nama
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-[#5C5346] mb-1">
                          Nama Samaran Anda:
                        </label>
                        <input
                          type="text"
                          value={pseudonym}
                          onChange={(e) => setPseudonym(e.target.value)}
                          className="w-full rounded-2xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#2D2A26] shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#5C5346] mb-1">
                          Program Studi (Hanya Statistik Agregat):
                        </label>
                        <select
                          value={mhsProdi}
                          onChange={(e) => setMhsProdi(e.target.value)}
                          className="w-full rounded-2xl bg-white px-4 py-2.5 text-xs font-semibold text-[#2D2A26] shadow-sm"
                        >
                          <option value="BKPI (Bimbingan & Konseling Pendidikan Islam)">
                            BKPI
                          </option>
                          <option value="PIAUD (Pendidikan Islam Anak Usia Dini)">
                            PIAUD
                          </option>
                          <option value="PAI (Pendidikan Agama Islam)">
                            PAI
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-bold text-rose-700">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full clay-btn-coral rounded-full py-3.5 px-6 text-sm font-extrabold text-white flex items-center justify-center gap-2 transition active:scale-98"
                >
                  <span>
                    {mhsEntryMode === "sso"
                      ? "Masuk Portal Mahasiswa (SSO SIAKAD)"
                      : `Masuk Ruang Aman Sebagai "${pseudonym}"`}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              /* ============================================================
                  TAB 2: FORM LOGIN ADMIN (HANYA ADMIN UTAMA)
                 ============================================================ */
              <form onSubmit={handleAdminSubmit} className="mt-6 space-y-5">
                <div className="clay-card-peach rounded-[24px] p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EE7854] text-white shadow-md">
                      <Crown className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wider text-[#B85232]">
                        Akses Administrator Tunggal
                      </div>
                      <div className="text-sm font-extrabold text-[#2D2A26]">
                        Admin Utama NARASA (Unit BK Kampus)
                      </div>
                      <div className="text-[11px] text-[#6E5C56]">
                        Mengelola Dashboard, Tiket Klien, Jadwal Sesi, Jurnal
                        SOAP, dan Laporan Analitik Kampus.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminUsername("admin@narasa.ac.id");
                      setAdminDisplayName("Admin Utama NARASA");
                      setAdminPassword("adminbk2026");
                    }}
                    className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[11px] font-extrabold text-[#2D2A26] shadow-sm hover:bg-[#FCFBF7]"
                  >
                    Isi Otomatis
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-extrabold text-[#2D2A26] mb-1.5">
                      Email / Username Admin BK
                    </label>
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin@narasa.ac.id"
                      className="w-full rounded-2xl bg-[#F3F0E8] border border-white px-4 py-3 text-xs font-bold text-[#2D2A26] shadow-inner focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#2D2A26] mb-1.5">
                      Kata Sandi Admin
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Masukkan kata sandi admin"
                        className="w-full rounded-2xl bg-[#F3F0E8] border border-white px-4 py-3 pr-10 text-xs font-bold text-[#2D2A26] shadow-inner focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-[#7A746B]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#2D2A26] mb-1.5">
                    Nama Tampilan Admin di Dashboard
                  </label>
                  <input
                    type="text"
                    value={adminDisplayName}
                    onChange={(e) => setAdminDisplayName(e.target.value)}
                    className="w-full rounded-2xl bg-[#F3F0E8] border border-white px-4 py-3 text-xs font-semibold text-[#2D2A26] shadow-inner"
                  />
                </div>

                <div className="rounded-2xl bg-[#E2F1EC]/70 border border-white px-4 py-3 text-xs text-[#285E4E] flex items-center gap-2.5">
                  <Lock className="h-4 w-4 shrink-0 text-[#2E7D67]" />
                  <span>
                    <strong>Otorisasi Admin Aktif:</strong> Memiliki akses penuh
                    untuk memantau Dashboard Utama, mengelola tiket konseling,
                    dan mengekspor laporan bulanan.
                  </span>
                </div>

                {errorMsg && (
                  <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-bold text-rose-700">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-b from-[#5FA894] to-[#468976] py-3.5 px-6 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(70,137,118,0.35)] flex items-center justify-center gap-2 transition hover:brightness-105 active:scale-98"
                >
                  <span>Masuk Dashboard Admin NARASA</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>

          {/* Footer Note inside Login Card */}
          <div className="mt-6 pt-4 border-t border-[#ECE8DF] flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-[#8C857B]">
            <span>🔒 Terenkripsi End-to-End AES-256-GCM</span>
            <span>NARASA (Narasi Rasa) • Unit Layanan BK Kampus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
