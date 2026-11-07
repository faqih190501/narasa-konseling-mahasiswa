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
  Download,
  Smartphone,
  UserPlus,
  CheckCircle2,
  Gamepad2,
  FileText,
  X,
} from "lucide-react";
import { generateCalmPseudonym } from "@/lib/triage-engine";
import { StudentAccount } from "@/lib/types";
import NarasaLogo from "./NarasaLogo";
import MindfulGamesModule from "./MindfulGamesModule";

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
  const [showGameModal, setShowGameModal] = useState<boolean>(false);

  // Mahasiswa Login / Daftar / Anonim State
  const [mhsEntryMode, setMhsEntryMode] = useState<
    "sso" | "daftar" | "anonim"
  >("sso");
  const [nim, setNim] = useState<string>("230101001");
  const [mhsPassword, setMhsPassword] = useState<string>("mahasiswa123");
  const [mhsName, setMhsName] = useState<string>("Naufal Rizqullah Pratama");
  const [mhsProdi, setMhsProdi] = useState<string>(
    "BKPI (Bimbingan & Konseling Pendidikan Islam)"
  );
  const [mhsAngkatan, setMhsAngkatan] = useState<number>(2023);
  const [pseudonym, setPseudonym] = useState<string>("Langit Teduh #412");

  // Mahasiswa Self-Registration State (Buat Akun Sendiri)
  const [regNim, setRegNim] = useState<string>("");
  const [regName, setRegName] = useState<string>("");
  const [regProdi, setRegProdi] = useState<string>(
    "BKPI (Bimbingan & Konseling Pendidikan Islam)"
  );
  const [regAngkatan, setRegAngkatan] = useState<number>(2024);
  const [regPhoneWa, setRegPhoneWa] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>("");

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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [studentAccounts, setStudentAccounts] = useState<StudentAccount[]>([]);
  const [isApkMode, setIsApkMode] = useState<boolean>(false);

  useEffect(() => {
    setPseudonym(generateCalmPseudonym());
    try {
      const ua = navigator.userAgent || "";
      const params = new URLSearchParams(window.location.search);
      const isStandalone =
        window.matchMedia?.("(display-mode: standalone)").matches ||
        ua.includes("NarasaAndroidAPK") ||
        params.get("source") === "apk";
      setIsApkMode(Boolean(isStandalone));
    } catch {}
    let localAccounts: StudentAccount[] = [];
    try {
      const saved = localStorage.getItem("narasa_registered_students");
      if (saved) localAccounts = JSON.parse(saved);
    } catch {}

    fetch("/api/state")
      .then((r) => r.json())
      .then((d) => {
        const serverList: StudentAccount[] = Array.isArray(d.student_accounts)
          ? d.student_accounts
          : [];
        const merged = [...serverList];
        for (const loc of localAccounts) {
          if (
            !merged.some(
              (s) => s.nim.toLowerCase() === loc.nim.toLowerCase()
            )
          ) {
            merged.unshift(loc);
          }
        }
        if (merged.length > 0) {
          setStudentAccounts(merged);
          const first = merged[0];
          setNim(first.nim);
          setMhsName(first.full_name);
          setMhsProdi(first.prodi_id);
          setMhsAngkatan(first.angkatan);
          setMhsPassword(first.password || "mahasiswa123");
        }
      })
      .catch(() => {
        if (localAccounts.length > 0) setStudentAccounts(localAccounts);
      });
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
    setSuccessMsg(null);
  };

  const handleMahasiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // MODE 1: SAMARAN ANONIM
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

    // MODE 2: DAFTAR AKUN MAHASISWA BARU (BUAT AKUN SENDIRI)
    if (mhsEntryMode === "daftar") {
      const cleanNim = regNim.trim();
      const cleanName = regName.trim();
      const cleanPwd = regPassword.trim();

      if (!cleanNim || !cleanName) {
        setErrorMsg("Mohon lengkapi NIM dan Nama Lengkap Anda terlebih dahulu.");
        return;
      }
      if (cleanPwd.length < 4) {
        setErrorMsg("Kata sandi minimal 4 karakter.");
        return;
      }
      if (cleanPwd !== regConfirmPassword.trim()) {
        setErrorMsg("Konfirmasi kata sandi tidak sama dengan kata sandi baru.");
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "register_student_account",
            nim: cleanNim,
            full_name: cleanName,
            prodi_id: regProdi,
            angkatan: regAngkatan,
            phone_wa: regPhoneWa.trim() || "081200000000",
            password: cleanPwd,
          }),
        });
        const data = await res.json();
        if (!data.ok) {
          setErrorMsg(data.error || "Gagal mendaftarkan akun mahasiswa.");
          setIsLoading(false);
          return;
        }

        const created: StudentAccount = data.student;
        try {
          const prevRaw = localStorage.getItem("narasa_registered_students");
          const prevList: StudentAccount[] = prevRaw ? JSON.parse(prevRaw) : [];
          const updated = [
            created,
            ...prevList.filter(
              (item) => item.nim.toLowerCase() !== created.nim.toLowerCase()
            ),
          ];
          localStorage.setItem(
            "narasa_registered_students",
            JSON.stringify(updated)
          );
        } catch {}

        setStudentAccounts((prev) => [created, ...prev]);

        onLoginSuccess({
          role: "mahasiswa",
          subRoleLabel: `Mahasiswa Aktif • Angkatan ${created.angkatan}`,
          displayName: created.full_name,
          identifier: created.nim,
          prodi: created.prodi_id,
          angkatan: created.angkatan,
          isAnonymous: false,
        });
      } catch {
        setErrorMsg("Terjadi gangguan jaringan saat membuat akun baru.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // MODE 3: LOGIN AKUN MAHASISWA
    if (!nim.trim() || !mhsPassword.trim()) {
      setErrorMsg("Mohon masukkan NIM dan Kata Sandi Akun Mahasiswa Anda.");
      return;
    }

    setIsLoading(true);
    try {
      const cleanNim = nim.trim();
      const cleanPwd = mhsPassword.trim();

      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login_student",
          nim: cleanNim,
          password: cleanPwd,
        }),
      });
      const data = await res.json();

      if (data.ok && data.student) {
        const s: StudentAccount = data.student;
        onLoginSuccess({
          role: "mahasiswa",
          subRoleLabel: `Mahasiswa Aktif • Angkatan ${s.angkatan}`,
          displayName: s.full_name,
          identifier: s.nim,
          prodi: s.prodi_id,
          angkatan: s.angkatan,
          isAnonymous: false,
        });
        return;
      }

      // Fallback check in localStorage (if serverless cold start reset memory)
      const localMatch = studentAccounts.find(
        (item) => item.nim.toLowerCase() === cleanNim.toLowerCase()
      );
      if (localMatch) {
        if (localMatch.password && localMatch.password !== cleanPwd) {
          setErrorMsg("Kata sandi yang Anda masukkan tidak sesuai.");
          setIsLoading(false);
          return;
        }
        // Re-sync to server
        await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "register_student_account",
            nim: localMatch.nim,
            full_name: localMatch.full_name,
            prodi_id: localMatch.prodi_id,
            angkatan: localMatch.angkatan,
            phone_wa: localMatch.phone_wa,
            password: localMatch.password || cleanPwd,
          }),
        }).catch(() => {});

        onLoginSuccess({
          role: "mahasiswa",
          subRoleLabel: `Mahasiswa Aktif • Angkatan ${localMatch.angkatan}`,
          displayName: localMatch.full_name,
          identifier: localMatch.nim,
          prodi: localMatch.prodi_id,
          angkatan: localMatch.angkatan,
          isAnonymous: false,
        });
        return;
      }

      setErrorMsg(
        data.error ||
          `NIM ${cleanNim} belum terdaftar. Silakan klik "Buat Akun Baru" untuk membuat akun mahasiswa sendiri.`
      );
    } catch {
      setErrorMsg("Terjadi kesalahan saat memverifikasi akun mahasiswa.");
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
    <div className="min-h-[100dvh] p-3 sm:p-6 lg:p-10 flex items-center justify-center">
      <div className="w-full max-w-[1220px] grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* ============================================================
            LEFT COLUMN (Desktop Left / Mobile Bottom): WARM CLAYMORPHIC BRANDING & NARASA LOGO
           ============================================================ */}
        <div className="order-2 lg:order-1 clay-sidebar lg:col-span-5 rounded-[28px] sm:rounded-[36px] p-5 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div>
            {/* Top Official NARASA Brand Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="rounded-[20px] sm:rounded-[24px] bg-[#FCFBF8]/95 px-3.5 sm:px-4 py-2 sm:py-2.5 border-2 border-white shadow-[0_10px_24px_rgba(95,75,55,0.12)]">
                <NarasaLogo
                  size="md"
                  showText={true}
                  subtitle="Ruang Aman Bimbingan & Konseling"
                />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[10.5px] font-extrabold text-[#2E7D67] shadow-sm shrink-0">
                <Sparkles className="h-3 w-3 text-[#EE7854]" />
                24/7 Aktif
              </span>
            </div>

            {/* Brand Title */}
            <h1 className="mt-4 sm:mt-5 text-xl sm:text-3xl font-extrabold text-[#2D2A26] leading-tight">
              Ruang Aman Cerita & Konseling{" "}
              <span className="text-[#6C4A32]">NARASA</span>{" "}
              <span className="text-base sm:text-lg font-bold text-[#559A87]">
                (Narasi Rasa)
              </span>{" "}
              ☀️
            </h1>
            <p className="mt-2 sm:mt-2.5 text-xs sm:text-[13.5px] text-[#4E5A54] leading-relaxed">
              Gerbang layanan konseling kampus berbasis percakapan interaktif,
              skrining mandiri <strong>PHQ-4</strong>, dan perlindungan privasi{" "}
              <strong>AES-256</strong> sesuai Kode Etik Bimbingan & Konseling.
            </p>

            {/* Center Cute Claymorphic Illustration Card with Large NARASA Logo */}
            <div className="mt-5 sm:mt-6 clay-hero-peach rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-16 w-16 sm:h-24 sm:w-24 shrink-0 rounded-[20px] sm:rounded-[24px] bg-[#FCFBF8] border-2 border-white shadow-[0_10px_24px_rgba(108,74,50,0.18)] flex items-center justify-center p-1.5 sm:p-2 overflow-hidden">
                  <img
                    src="/logo-narasa.jpg"
                    alt="Logo NARASA - Narasi Rasa"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <span className="inline-block rounded-full bg-white/85 px-2.5 py-0.5 text-[9.5px] sm:text-[10px] font-extrabold text-[#6C4A32]">
                    NARASA • Zero-Stigma Entry
                  </span>
                  <h3 className="mt-1 text-xs sm:text-sm font-extrabold text-[#2D2A26]">
                    Setiap Rasa Punya Cerita
                  </h3>
                  <p className="mt-0.5 text-[11px] sm:text-[11.5px] text-[#5F544E] leading-snug">
                    Bisa masuk dengan akun <strong>SSO SIAKAD</strong>,{" "}
                    <strong>Buat Akun Sendiri</strong>, atau{" "}
                    <strong>Mode Samaran Anonim</strong>.
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
            <div className="mt-4 sm:mt-5 grid grid-cols-3 gap-2 sm:gap-3 text-center">
              <div className="rounded-2xl bg-white/75 p-2.5 sm:p-3 border border-white shadow-sm">
                <div className="text-[11px] sm:text-xs font-extrabold text-[#2E7D67]">
                  AES-256
                </div>
                <div className="mt-0.5 text-[9.5px] sm:text-[10.5px] font-semibold text-[#5C6660] leading-tight">
                  Data & Cerita Terenkripsi
                </div>
              </div>
              <div className="rounded-2xl bg-white/75 p-2.5 sm:p-3 border border-white shadow-sm">
                <div className="text-[11px] sm:text-xs font-extrabold text-[#D9603B]">
                  PHQ-4 Smart
                </div>
                <div className="mt-0.5 text-[9.5px] sm:text-[10.5px] font-semibold text-[#5C6660] leading-tight">
                  Skrining & Triase Otomatis
                </div>
              </div>
              <div className="rounded-2xl bg-white/75 p-2.5 sm:p-3 border border-white shadow-sm">
                <div className="text-[11px] sm:text-xs font-extrabold text-[#B8831D]">
                  Kode Etik BK
                </div>
                <div className="mt-0.5 text-[9.5px] sm:text-[10.5px] font-semibold text-[#5C6660] leading-tight">
                  Rahasia & Bebas Stigma
                </div>
              </div>
            </div>

            {/* Download Aplikasi Android (.APK) Card */}
            <div className="mt-4 sm:mt-5 rounded-[22px] sm:rounded-[24px] bg-gradient-to-r from-[#E2F1EC] to-[#FCFBF8] border-2 border-white p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2E7D67] text-white shadow-sm">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#2D2A26]">
                    {isApkMode
                      ? "Aplikasi Android NARASA Aktif ✓"
                      : "Aplikasi Mobile NARASA (Android v1.2)"}
                  </div>
                  <div className="text-[11px] font-semibold text-[#4E5A54]">
                    {isApkMode
                      ? "Anda sedang mengakses NARASA melalui aplikasi mobile resmi"
                      : "Installer .APK resmi bertanda tangan digital (Android 7.0 – 16)"}
                  </div>
                </div>
              </div>
              {!isApkMode && (
                <a
                  href="/narasa-konseling-v2.apk"
                  download="NARASA-Konseling-v2.apk"
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#2E7D67] hover:bg-[#256654] px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition active:scale-95"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download APK
                </a>
              )}
            </div>

            {/* Zona Mini-Game Kognitif & Relaksasi Card */}
            <div className="mt-3.5 rounded-[22px] sm:rounded-[24px] bg-gradient-to-r from-[#FCE8DF] to-[#FCFBF8] border-2 border-white p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EE7854] text-white shadow-sm">
                  <Gamepad2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#2D2A26]">
                    6 Game Edukasi Konseling, BKPI & PIAUD
                  </div>
                  <div className="text-[11px] font-semibold text-[#5F544E]">
                    Lab Mikro-Konseling, Teori Piaget & BK, Detektif Emosi, CBT & Fokus
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGameModal(true)}
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#EE7854] hover:bg-[#DC6642] px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition active:scale-95"
              >
                <Gamepad2 className="h-3.5 w-3.5" />
                Mainkan Game
              </button>
            </div>
          </div>

          {/* Bottom Crisis Hotline Box (FR-02 Always Accessible without Login) */}
          <div className="mt-5 sm:mt-6 rounded-[22px] sm:rounded-[24px] bg-white/85 border-2 border-white p-3.5 sm:p-4 shadow-sm">
            <div className="flex flex-col xs:flex-row sm:flex-row sm:items-center justify-between gap-3">
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
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-rose-700"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                119 ext. 8
              </a>
            </div>
          </div>
        </div>

        {/* ============================================================
            RIGHT COLUMN (Desktop Right / Mobile Top): DUAL LOGIN PORTAL (MAHASISWA vs ADMIN)
           ============================================================ */}
        <div className="order-1 lg:order-2 clay-shell lg:col-span-7 rounded-[28px] sm:rounded-[36px] p-4 sm:p-8 lg:p-9 flex flex-col justify-between">
          <div>
            {/* Role Portal Switcher Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 border-b border-[#ECE8DF] pb-4 sm:pb-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-2xl bg-[#FCFBF8] border-2 border-white shadow-[0_8px_18px_rgba(108,74,50,0.14)] p-1.5 flex items-center justify-center">
                    <img
                      src="/logo-narasa.jpg"
                      alt="NARASA"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-[#F9E69B] px-2.5 sm:px-3 py-0.5 text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#6E5611]">
                      PORTAL RESMI NARASA
                    </span>
                    <h2 className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-extrabold text-[#2D2A26]">
                      {activeTab === "mahasiswa"
                        ? "Login Mahasiswa"
                        : "Login Admin BK"}
                    </h2>
                  </div>
                </div>

                {/* Quick Download APK Pill on Handphone Top Right */}
                {isApkMode ? (
                  <span className="lg:hidden shrink-0 inline-flex items-center gap-1 rounded-full bg-[#E2F1EC] px-2.5 py-1 text-[10px] font-extrabold text-[#2E7D67]">
                    <Smartphone className="h-3 w-3" />
                    <span>App v1.2</span>
                  </span>
                ) : (
                  <a
                    href="/narasa-konseling-v2.apk"
                    download="NARASA-Konseling-v2.apk"
                    className="lg:hidden shrink-0 inline-flex items-center gap-1 rounded-full bg-[#2E7D67] px-3 py-1.5 text-[10.5px] font-extrabold text-white shadow-sm active:scale-95"
                  >
                    <Download className="h-3 w-3" />
                    <span>APK</span>
                  </a>
                )}
              </div>

              {/* Pill Tab Selector: Hanya Mahasiswa & Admin (Full-width 2-col on Handphone, pill on Desktop) */}
              <div className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto rounded-full bg-[#F2EFE8] p-1.5 border border-white shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("mahasiswa");
                    setErrorMsg(null);
                  }}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 sm:py-2 text-xs font-extrabold transition-all ${
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
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 sm:py-2 text-xs font-extrabold transition-all ${
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
                TAB 1: FORM LOGIN MAHASISWA (SSO SIAKAD, BUAT AKUN SENDIRI & MODE SAMARAN ANONIM)
               ============================================================ */}
            {activeTab === "mahasiswa" ? (
              <form onSubmit={handleMahasiswaSubmit} className="mt-4 sm:mt-6 space-y-4 sm:space-y-5">
                {/* 3 Pilihan Mode Mahasiswa: Masuk Akun, Buat Akun Baru, Mode Anonim (Side-by-side 3 cols on Phone & Desktop!) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMhsEntryMode("sso");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`rounded-[18px] sm:rounded-[22px] p-2.5 sm:p-3.5 text-left border-2 transition ${
                      mhsEntryMode === "sso"
                        ? "clay-card-mint border-white ring-2 ring-[#559A87]/30"
                        : "bg-[#F7F5F0] border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-[#559A87] text-white">
                        <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <span className="hidden sm:inline-block rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-extrabold text-[#2E7D67]">
                        Login
                      </span>
                    </div>
                    <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-extrabold text-[#2D2A26] leading-tight">
                      Masuk Akun
                    </div>
                    <div className="mt-0.5 text-[9.5px] sm:text-[11px] text-[#5E6E68] leading-tight">
                      Pakai NIM
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMhsEntryMode("daftar");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`rounded-[18px] sm:rounded-[22px] p-2.5 sm:p-3.5 text-left border-2 transition ${
                      mhsEntryMode === "daftar"
                        ? "clay-card-sky border-white ring-2 ring-[#689FD4]/40"
                        : "bg-[#F7F5F0] border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-[#4F86BE] text-white">
                        <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <span className="hidden sm:inline-block rounded-full bg-white/85 px-2.5 py-0.5 text-[10px] font-extrabold text-[#2D5F91]">
                        Daftar Baru
                      </span>
                    </div>
                    <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-extrabold text-[#2D2A26] leading-tight">
                      Buat Akun
                    </div>
                    <div className="mt-0.5 text-[9.5px] sm:text-[11px] text-[#4E647E] leading-tight">
                      Daftar sendiri
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMhsEntryMode("anonim");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`rounded-[18px] sm:rounded-[22px] p-2.5 sm:p-3.5 text-left border-2 transition ${
                      mhsEntryMode === "anonim"
                        ? "clay-card-peach border-white ring-2 ring-[#EE7854]/30"
                        : "bg-[#F7F5F0] border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-[#EE7854] text-white">
                        <HeartHandshake className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <span className="hidden sm:inline-block rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-extrabold text-[#C45534]">
                        Anonim
                      </span>
                    </div>
                    <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-extrabold text-[#2D2A26] leading-tight">
                      Samaran
                    </div>
                    <div className="mt-0.5 text-[9.5px] sm:text-[11px] text-[#6E5C56] leading-tight">
                      Tanpa NIM
                    </div>
                  </button>
                </div>

                {mhsEntryMode === "sso" ? (
                  <>
                    {/* Quick Registered Student Accounts from DB */}
                    <div className="rounded-2xl bg-[#F6F3EC] p-3.5 border border-white">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-extrabold text-[#6E6A63]">
                          ⚡ Pilih Cepat Akun Terdaftar ({studentAccounts.length} Akun):
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setMhsEntryMode("daftar");
                            setErrorMsg(null);
                          }}
                          className="text-[11px] font-extrabold text-[#2E7D67] hover:underline"
                        >
                          + Belum punya akun? Buat Akun Sendiri
                        </button>
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
                          NIM Mahasiswa
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
                          Kata Sandi Akun Mahasiswa
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
                  </>
                ) : mhsEntryMode === "daftar" ? (
                  /* Form Pendaftaran Mandiri Mahasiswa (Buat Akun Sendiri) */
                  <div className="rounded-[26px] bg-[#EEF5FB] border-2 border-white p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-white/80 pb-3">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2D5F91]">
                          Pendaftaran Mandiri Mahasiswa
                        </span>
                        <h4 className="text-base font-extrabold text-[#2D2A26]">
                          Buat Akun Konseling Mahasiswa Baru
                        </h4>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-extrabold text-[#2E7D67]">
                        Langsung Aktif ✓
                      </span>
                    </div>

                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-extrabold text-[#2D2A26] mb-1">
                          NIM Mahasiswa <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={regNim}
                          onChange={(e) => setRegNim(e.target.value)}
                          placeholder="Masukkan NIM Anda (cth: 240101055)"
                          className="w-full rounded-2xl bg-white border border-white px-4 py-2.5 text-xs font-bold text-[#2D2A26] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4F86BE]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#2D2A26] mb-1">
                          Nama Lengkap <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Masukkan nama lengkap sesuai KTM"
                          className="w-full rounded-2xl bg-white border border-white px-4 py-2.5 text-xs font-bold text-[#2D2A26] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4F86BE]"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3.5 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-extrabold text-[#2D2A26] mb-1">
                          Program Studi <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={regProdi}
                          onChange={(e) => setRegProdi(e.target.value)}
                          className="w-full rounded-2xl bg-white border border-white px-3.5 py-2.5 text-xs font-bold text-[#2D2A26] shadow-sm"
                        >
                          <option value="BKPI (Bimbingan & Konseling Pendidikan Islam)">
                            BKPI (Bimbingan & Konseling Pendidikan Islam)
                          </option>
                          <option value="PIAUD (Pendidikan Islam Anak Usia Dini)">
                            PIAUD (Pendidikan Islam Anak Usia Dini)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#2D2A26] mb-1">
                          Angkatan
                        </label>
                        <select
                          value={regAngkatan}
                          onChange={(e) => setRegAngkatan(Number(e.target.value))}
                          className="w-full rounded-2xl bg-white border border-white px-3.5 py-2.5 text-xs font-bold text-[#2D2A26] shadow-sm"
                        >
                          <option value={2022}>2022</option>
                          <option value={2023}>2023</option>
                          <option value={2024}>2024</option>
                          <option value={2025}>2025</option>
                          <option value={2026}>2026</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-3.5 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-extrabold text-[#2D2A26] mb-1">
                          No. WhatsApp (Opsional)
                        </label>
                        <input
                          type="text"
                          value={regPhoneWa}
                          onChange={(e) => setRegPhoneWa(e.target.value)}
                          placeholder="0812xxxxxxxx"
                          className="w-full rounded-2xl bg-white border border-white px-3.5 py-2.5 text-xs font-bold text-[#2D2A26] shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#2D2A26] mb-1">
                          Buat Kata Sandi <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min. 4 karakter"
                          className="w-full rounded-2xl bg-white border border-white px-3.5 py-2.5 text-xs font-bold text-[#2D2A26] shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#2D2A26] mb-1">
                          Ulangi Kata Sandi <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Ketik ulang sandi"
                          className="w-full rounded-2xl bg-white border border-white px-3.5 py-2.5 text-xs font-bold text-[#2D2A26] shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
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
                            BKPI (Bimbingan & Konseling Pendidikan Islam)
                          </option>
                          <option value="PIAUD (Pendidikan Islam Anak Usia Dini)">
                            PIAUD (Pendidikan Islam Anak Usia Dini)
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {successMsg && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    {successMsg}
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
                    {isLoading
                      ? "Memproses..."
                      : mhsEntryMode === "sso"
                      ? "Masuk Portal Mahasiswa"
                      : mhsEntryMode === "daftar"
                      ? "Daftar Akun Baru & Masuk Sekarang"
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
            <span>🔒 Terenkripsi End-to-End AES-256-GCM • Prodi: BKPI & PIAUD</span>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/Kesimpulan-Aplikasi-NARASA.pdf"
                download="Kesimpulan-Aplikasi-NARASA-Konseling-Mahasiswa.pdf"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#F3ECFA] hover:bg-[#E7DBF6] px-3.5 py-1 text-[11px] font-extrabold text-[#5E3594] transition"
              >
                <FileText className="h-3.5 w-3.5" />
                PDF Kesimpulan
              </a>
              <button
                type="button"
                onClick={() => setShowGameModal(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#FCE8DF] hover:bg-[#F8D7C8] px-3.5 py-1 text-[11px] font-extrabold text-[#C8522E] transition"
              >
                <Gamepad2 className="h-3.5 w-3.5" />
                Main Game Fokus
              </button>
              {isApkMode ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E2F1EC] px-3.5 py-1 text-[11px] font-extrabold text-[#2E7D67]">
                  <Smartphone className="h-3.5 w-3.5" />
                  Android App NARASA Aktif
                </span>
              ) : (
                <a
                  href="/narasa-konseling-v2.apk"
                  download="NARASA-Konseling-v2.apk"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#E2F1EC] hover:bg-[#D1E8E0] px-3.5 py-1 text-[11px] font-extrabold text-[#2E7D67] transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download APK Android
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen / Modal Game Hub when launched from Login Screen */}
      {showGameModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs p-2.5 sm:p-6 overflow-y-auto flex items-start justify-center">
          <div className="w-full max-w-[1060px] clay-shell rounded-[28px] sm:rounded-[34px] p-3.5 sm:p-6 my-2 sm:my-4 shadow-2xl border-2 border-white space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-[#ECE8DF] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EE7854] text-white shadow-sm">
                  <Gamepad2 className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-extrabold text-[#2D2A26]">
                    Arena Permainan Kognitif & Relaksasi NARASA
                  </div>
                  <div className="text-[11px] text-[#6E6A63]">
                    Dapat dimainkan langsung kapan saja untuk menyegarkan fokus
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGameModal(false)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2D2A26] hover:bg-[#433F3A] px-4 py-2 text-xs font-extrabold text-white transition"
              >
                <X className="h-3.5 w-3.5" />
                Kembali ke Login
              </button>
            </div>

            <MindfulGamesModule />
          </div>
        </div>
      )}
    </div>
  );
}
