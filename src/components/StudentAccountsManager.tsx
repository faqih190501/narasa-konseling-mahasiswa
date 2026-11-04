"use client";

import React, { useState } from "react";
import {
  UserPlus,
  Trash2,
  GraduationCap,
  Search,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { StudentAccount } from "@/lib/types";

interface Props {
  studentAccounts: StudentAccount[];
  onDataChanged: () => void;
}

export default function StudentAccountsManager({
  studentAccounts,
  onDataChanged,
}: Props) {
  const [nim, setNim] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [prodiId, setProdiId] = useState<string>(
    "BKPI (Bimbingan & Konseling Pendidikan Islam)"
  );
  const [angkatan, setAngkatan] = useState<number>(2024);
  const [phoneWa, setPhoneWa] = useState<string>("");
  const [password, setPassword] = useState<string>("mahasiswa123");

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    if (!nim.trim() || !fullName.trim()) {
      setFeedbackMsg({
        type: "error",
        text: "Mohon isi NIM dan Nama Lengkap Mahasiswa terlebih dahulu.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_student_account",
          nim: nim.trim(),
          full_name: fullName.trim(),
          prodi_id: prodiId,
          angkatan,
          phone_wa: phoneWa.trim() || "081200000000",
          password: password.trim() || "mahasiswa123",
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setFeedbackMsg({
          type: "error",
          text: data.error || "Gagal menambahkan mahasiswa.",
        });
      } else {
        setFeedbackMsg({
          type: "success",
          text: `Akun mahasiswa ${fullName.trim()} (NIM: ${nim.trim()}) berhasil ditambahkan dan siap digunakan untuk Login!`,
        });
        setNim("");
        setFullName("");
        setPhoneWa("");
        setPassword("mahasiswa123");
        onDataChanged();
      }
    } catch {
      setFeedbackMsg({
        type: "error",
        text: "Terjadi gangguan jaringan saat menyimpan data mahasiswa.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (stu: StudentAccount) => {
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_student_account",
          id: stu.id,
          nim: stu.nim,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedbackMsg({
          type: "success",
          text: `Akun mahasiswa ${stu.full_name} (NIM: ${stu.nim}) telah dihapus dari sistem.`,
        });
        onDataChanged();
      } else {
        setFeedbackMsg({
          type: "error",
          text: data.error || "Gagal menghapus mahasiswa.",
        });
      }
    } catch {
      setFeedbackMsg({
        type: "error",
        text: "Terjadi kesalahan saat menghapus akun mahasiswa.",
      });
    }
  };

  const filteredStudents = studentAccounts.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.nim.toLowerCase().includes(q) ||
      s.full_name.toLowerCase().includes(q) ||
      s.prodi_id.toLowerCase().includes(q) ||
      String(s.angkatan).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="clay-hero-peach rounded-[30px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-1 text-[11px] font-extrabold text-[#C46A4E]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Manajemen Akun Mahasiswa (SIAKAD SSO Directory)
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl font-extrabold text-[#2D2A26]">
            Kelola Data & Akun Login Mahasiswa 🎓
          </h2>
          <p className="mt-1 text-xs sm:text-[13px] text-[#5F544E] max-w-2xl">
            Admin dapat menambahkan akun mahasiswa baru maupun menghapus akun
            mahasiswa. Setiap mahasiswa yang ditambahkan di sini dapat langsung
            login di Portal Mahasiswa menggunakan NIM dan Kata Sandinya.
          </p>
        </div>

        <div className="clay-card-white rounded-[24px] px-5 py-3.5 text-center shrink-0">
          <div className="text-xs font-bold text-[#6E6A63]">
            Total Akun Mahasiswa
          </div>
          <div className="text-3xl font-extrabold text-[#2E7D67]">
            {studentAccounts.length}
          </div>
          <div className="text-[11px] font-bold text-[#2D2A26]">
            Terdaftar Aktif
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs font-extrabold flex items-center justify-between gap-2 ${
            feedbackMsg.type === "success"
              ? "bg-[#E2F1EC] border-white text-[#215A49]"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span className="flex items-center gap-2">
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2E7D67]" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            {feedbackMsg.text}
          </span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-[11px] underline opacity-75 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* LEFT 5 COLS: FORM TAMBAH AKUN MAHASISWA BARU */}
        <form
          onSubmit={handleAddStudent}
          className="clay-card-mint lg:col-span-5 rounded-[30px] p-6 space-y-4"
        >
          <div className="flex items-center gap-3 border-b border-white/70 pb-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#559A87] text-white shadow-md">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2D2A26]">
                Tambah Akun Mahasiswa Baru
              </h3>
              <p className="text-xs text-[#5E6E68]">
                Daftarkan NIM & akses login mahasiswa ke sistem NARASA
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#2D2A26] mb-1">
              NIM Mahasiswa <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="Contoh: 240101089"
              className="w-full rounded-2xl bg-white border border-white px-4 py-2.5 text-xs font-bold text-[#2D2A26] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#559A87]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#2D2A26] mb-1">
              Nama Lengkap Mahasiswa <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Putri Maharani Azzahra"
              className="w-full rounded-2xl bg-white border border-white px-4 py-2.5 text-xs font-bold text-[#2D2A26] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#559A87]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-[#2D2A26] mb-1">
                Program Studi
              </label>
              <select
                value={prodiId}
                onChange={(e) => setProdiId(e.target.value)}
                className="w-full rounded-2xl bg-white border border-white px-3 py-2.5 text-xs font-bold text-[#2D2A26] shadow-sm"
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

            <div>
              <label className="block text-xs font-extrabold text-[#2D2A26] mb-1">
                Angkatan
              </label>
              <select
                value={angkatan}
                onChange={(e) => setAngkatan(Number(e.target.value))}
                className="w-full rounded-2xl bg-white border border-white px-3 py-2.5 text-xs font-bold text-[#2D2A26] shadow-sm"
              >
                <option value={2022}>2022</option>
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#2D2A26] mb-1">
                No. WhatsApp Mahasiswa
              </label>
              <input
                type="text"
                value={phoneWa}
                onChange={(e) => setPhoneWa(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full rounded-2xl bg-white border border-white px-4 py-2.5 text-xs font-semibold text-[#2D2A26] shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#2D2A26] mb-1">
                Kata Sandi Login
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mahasiswa123"
                className="w-full rounded-2xl bg-white border border-white px-4 py-2.5 text-xs font-bold text-[#2D2A26] shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full clay-btn-coral rounded-full py-3 px-5 text-xs font-extrabold text-white flex items-center justify-center gap-2 transition active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            <span>
              {isSubmitting
                ? "Menyimpan Akun Mahasiswa..."
                : "+ Tambah & Aktifkan Akun Mahasiswa"}
            </span>
          </button>
        </form>

        {/* RIGHT 7 COLS: DAFTAR MAHASISWA & TOMBOL HAPUS */}
        <div className="clay-card-white lg:col-span-7 rounded-[30px] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FCE2D9] text-[#D9603B]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#2D2A26]">
                  Daftar Akun Mahasiswa Terdaftar ({filteredStudents.length})
                </h3>
                <p className="text-xs text-[#8C857B]">
                  Klik tombol Hapus untuk mencabut akses akun mahasiswa dari
                  sistem
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#8C867E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari NIM, nama, prodi..."
                className="rounded-full bg-[#F3F0E8] pl-9 pr-4 py-2 text-xs font-semibold text-[#2D2A26] placeholder-[#969086] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="rounded-2xl bg-[#F8F6F1] p-8 text-center text-xs font-semibold text-[#8C857B]">
              Tidak ada data mahasiswa yang cocok dengan pencarian.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredStudents.map((stu) => (
                <div
                  key={stu.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[22px] border border-[#ECE8DF] bg-[#FAF8F3] p-4 transition hover:bg-white hover:shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#DCEEE7] px-3 py-0.5 text-xs font-extrabold text-[#287D63]">
                        NIM: {stu.nim}
                      </span>
                      <span className="text-sm font-extrabold text-[#2D2A26]">
                        {stu.full_name}
                      </span>
                      <span className="rounded-full bg-[#F9E69B] px-2.5 py-0.5 text-[10px] font-extrabold text-[#6E5611]">
                        Angkatan {stu.angkatan}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-[#5C564F]">
                      {stu.prodi_id}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#7A746B] pt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3 text-[#559A87]" />
                        {stu.phone_wa}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <KeyRound className="h-3 w-3 text-[#EE7854]" />
                        Sandi: <strong>{stu.password}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteStudent(stu)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 hover:bg-rose-600 hover:text-white px-4 py-2 text-xs font-extrabold text-rose-700 transition shadow-sm"
                      title={`Hapus akun mahasiswa ${stu.full_name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus Mahasiswa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

