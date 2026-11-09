"use client";

import React, { useState, useRef } from "react";
import {
  Megaphone,
  ImagePlus,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Trash2,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Upload,
  X,
  Eye,
} from "lucide-react";
import { SeminarAnnouncement } from "@/lib/types";

interface Props {
  announcements: SeminarAnnouncement[];
  adminName?: string;
  onRefresh: () => void;
}

export default function AdminSeminarManager({
  announcements,
  adminName = "Admin Utama NARASA",
  onRefresh,
}: Props) {
  const [title, setTitle] = useState<string>("");
  const [eventType, setEventType] = useState<
    "Seminar" | "Webinar" | "Workshop BK"
  >("Webinar");
  const [targetProdi, setTargetProdi] = useState<
    "Semua Prodi (BKPI & PIAUD)" | "Khusus BKPI" | "Khusus PIAUD"
  >("Semua Prodi (BKPI & PIAUD)");
  const [speaker, setSpeaker] = useState<string>("");
  const [eventDate, setEventDate] = useState<string>("");
  const [eventTime, setEventTime] = useState<string>("09:00 - 11:30 WIB");
  const [locationOrLink, setLocationOrLink] = useState<string>(
    "Zoom Meeting & Aula Kampus"
  );
  const [registrationLink, setRegistrationLink] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [imageFileName, setImageFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [previewItem, setPreviewItem] = useState<SeminarAnnouncement | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compress & resize uploaded photo via HTML5 Canvas so it loads fast on Login page
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedback({
        type: "error",
        text: "Mohon pilih file gambar/foto (JPG, PNG, WEBP).",
      });
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawDataUrl = String(ev.target?.result || "");
      const img = new Image();
      img.onload = () => {
        const maxDim = 960;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.82);
          setImageDataUrl(compressed);
        } else {
          setImageDataUrl(rawDataUrl);
        }
      };
      img.onerror = () => {
        setImageDataUrl(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleClearPhoto = () => {
    setImageDataUrl("");
    setImageFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const syncLocalAnnouncements = (list: SeminarAnnouncement[]) => {
    try {
      localStorage.setItem(
        "narasa_seminar_announcements_v1",
        JSON.stringify(list)
      );
    } catch {}
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!title.trim()) {
      setFeedback({
        type: "error",
        text: "Judul pengumuman Seminar / Webinar wajib diisi.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_seminar_announcement",
          title: title.trim(),
          event_type: eventType,
          target_prodi: targetProdi,
          speaker: speaker.trim() || "Tim Konselor & Dosen BK NARASA",
          event_date: eventDate.trim() || "Segera Hadir",
          event_time: eventTime.trim() || "09:00 - 11:30 WIB",
          location_or_link:
            locationOrLink.trim() || "Zoom Meeting & Aula Kampus",
          registration_link: registrationLink.trim(),
          description:
            description.trim() ||
            "Mari ikuti kegiatan peningkatan kompetensi akademik dan kesehatan mental bersama Unit Bimbingan & Konseling NARASA.",
          image_data_url: imageDataUrl,
          created_by: adminName,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Gagal menyimpan pengumuman webinar.",
        });
        return;
      }

      if (Array.isArray(data.seminar_announcements)) {
        syncLocalAnnouncements(data.seminar_announcements);
      } else if (data.announcement) {
        syncLocalAnnouncements([data.announcement, ...announcements]);
      }

      setTitle("");
      setSpeaker("");
      setEventDate("");
      setRegistrationLink("");
      setDescription("");
      handleClearPhoto();

      setFeedback({
        type: "success",
        text: "Pengumuman Seminar/Webinar beserta foto berhasil diterbitkan! Sekarang otomatis tampil di Halaman Login & Beranda Mahasiswa.",
      });
      onRefresh();
    } catch {
      setFeedback({
        type: "error",
        text: "Terjadi kendala jaringan saat menyimpan pengumuman.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setFeedback(null);
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_seminar_announcement",
          id,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const updated = Array.isArray(data.seminar_announcements)
          ? data.seminar_announcements
          : announcements.filter((a) => a.id !== id);
        syncLocalAnnouncements(updated);
        setFeedback({
          type: "success",
          text: "Pengumuman seminar/webinar berhasil dihapus.",
        });
        onRefresh();
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Gagal menghapus pengumuman.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Explanation */}
      <div className="clay-hero-peach rounded-[28px] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold text-[#6C4A32] shadow-xs">
            <Megaphone className="h-3.5 w-3.5 text-[#EE7854]" />
            Manajemen Pengumuman Seminar & Webinar (Tampil Saat Login)
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#2D2A26]">
            Kelola Pengumuman & Kirim Foto Poster Webinar Kampus
          </h2>
          <p className="text-xs text-[#5F544E] max-w-2xl leading-relaxed">
            Setiap pengumuman <strong>Seminar, Webinar, atau Workshop BK</strong>{" "}
            beserta <strong>foto/poster kegiatan</strong> yang Anda tambahkan di
            bawah ini akan langsung ditampilkan pada{" "}
            <strong>Halaman Login Utama</strong> (sebelum mahasiswa masuk) dan di{" "}
            <strong>Beranda Mahasiswa BKPI & PIAUD</strong>.
          </p>
        </div>

        <div className="shrink-0 rounded-2xl bg-white/85 border border-white px-4 py-3 text-center shadow-xs">
          <div className="text-2xl font-extrabold text-[#2E7D67]">
            {announcements.length}
          </div>
          <div className="text-[11px] font-bold text-[#5F544E]">
            Pengumuman Aktif di Login
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Form Add Seminar + Photo Upload, Right = Active Announcements List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Form Tambah Pengumuman & Upload Foto Webinar */}
        <form
          onSubmit={handleCreateAnnouncement}
          className="lg:col-span-6 clay-card rounded-[28px] p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#ECE8DF] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2E7D67] text-white">
                <Megaphone className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#2D2A26]">
                  Tambah Pengumuman Seminar / Webinar Baru
                </h3>
                <p className="text-[11px] text-[#7A746C]">
                  Unggah foto poster/flyer webinar dan isi detail jadwal acara
                </p>
              </div>
            </div>
          </div>

          {/* Judul Seminar / Webinar */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6A63] mb-1">
              Judul Seminar / Webinar *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Webinar Nasional Kesehatan Mental & Konseling Mahasiswa BKPI & PIAUD"
              className="w-full rounded-2xl bg-[#F6F4EF] border border-[#E5E0D5] px-3.5 py-2.5 text-xs font-bold text-[#2D2A26] focus:outline-none focus:border-[#5FA894]"
              required
            />
          </div>

          {/* Jenis Acara & Target Prodi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6A63] mb-1">
                Jenis Kegiatan
              </label>
              <select
                value={eventType}
                onChange={(e) =>
                  setEventType(
                    e.target.value as "Seminar" | "Webinar" | "Workshop BK"
                  )
                }
                className="w-full rounded-2xl bg-[#F6F4EF] border border-[#E5E0D5] px-3.5 py-2.5 text-xs font-bold text-[#2D2A26] focus:outline-none focus:border-[#5FA894]"
              >
                <option value="Webinar">Webinar</option>
                <option value="Seminar">Seminar</option>
                <option value="Workshop BK">Workshop BK</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6A63] mb-1">
                Sasaran Program Studi
              </label>
              <select
                value={targetProdi}
                onChange={(e) =>
                  setTargetProdi(
                    e.target.value as
                      | "Semua Prodi (BKPI & PIAUD)"
                      | "Khusus BKPI"
                      | "Khusus PIAUD"
                  )
                }
                className="w-full rounded-2xl bg-[#F6F4EF] border border-[#E5E0D5] px-3.5 py-2.5 text-xs font-bold text-[#2D2A26] focus:outline-none focus:border-[#5FA894]"
              >
                <option value="Semua Prodi (BKPI & PIAUD)">
                  Semua Prodi (BKPI & PIAUD)
                </option>
                <option value="Khusus BKPI">
                  Khusus BKPI (Bimbingan & Konseling Pendidikan Islam)
                </option>
                <option value="Khusus PIAUD">
                  Khusus PIAUD (Pendidikan Islam Anak Usia Dini)
                </option>
              </select>
            </div>
          </div>

          {/* Pemateri / Narasumber */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6A63] mb-1">
              Pemateri / Narasumber
            </label>
            <input
              type="text"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              placeholder="Contoh: Dr. Hj. Siti Maryam, M.Pd., Kons. & Tim Dosen BK"
              className="w-full rounded-2xl bg-[#F6F4EF] border border-[#E5E0D5] px-3.5 py-2.5 text-xs font-bold text-[#2D2A26] focus:outline-none focus:border-[#5FA894]"
            />
          </div>

          {/* Hari/Tanggal & Jam */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6A63] mb-1">
                Hari & Tanggal Pelaksanaan
              </label>
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="Contoh: Sabtu, 28 November 2026"
                className="w-full rounded-2xl bg-[#F6F4EF] border border-[#E5E0D5] px-3.5 py-2.5 text-xs font-bold text-[#2D2A26] focus:outline-none focus:border-[#5FA894]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6A63] mb-1">
                Waktu / Jam Pelaksanaan
              </label>
              <input
                type="text"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="Contoh: 09:00 - 11:30 WIB"
                className="w-full rounded-2xl bg-[#F6F4EF] border border-[#E5E0D5] px-3.5 py-2.5 text-xs font-bold text-[#2D2A26] focus:outline-none focus:border-[#5FA894]"
              />
            </div>
          </div>

          {/* Lokasi / Link Zoom & Link Pendaftaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6A63] mb-1">
                Tempat / Platform Webinar
              </label>
              <input
                type="text"
                value={locationOrLink}
                onChange={(e) => setLocationOrLink(e.target.value)}
                placeholder="Contoh: Zoom Meeting / Aula Utama Kampus"
                className="w-full rounded-2xl bg-[#F6F4EF] border border-[#E5E0D5] px-3.5 py-2.5 text-xs font-bold text-[#2D2A26] focus:outline-none focus:border-[#5FA894]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6A63] mb-1">
                Link Zoom / Pendaftaran (Opsional)
              </label>
              <input
                type="text"
                value={registrationLink}
                onChange={(e) => setRegistrationLink(e.target.value)}
                placeholder="Contoh: https://meet.google.com/... atau https://s.id/..."
                className="w-full rounded-2xl bg-[#F6F4EF] border border-[#E5E0D5] px-3.5 py-2.5 text-xs font-bold text-[#2D2A26] focus:outline-none focus:border-[#5FA894]"
              />
            </div>
          </div>

          {/* Deskripsi Kegiatan */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6A63] mb-1">
              Deskripsi & Informasi Kegiatan
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan ringkasan materi webinar, fasilitas (E-Sertifikat, Materi PDF, Doorprize), dan instruksi bagi mahasiswa..."
              className="w-full rounded-2xl bg-[#F6F4EF] border border-[#E5E0D5] px-3.5 py-2.5 text-xs font-semibold text-[#2D2A26] focus:outline-none focus:border-[#5FA894]"
            />
          </div>

          {/* Upload Foto / Poster Webinar */}
          <div className="rounded-2xl bg-[#F4EFE6] border-2 border-dashed border-[#D5CBB8] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-[#2E7D67]" />
                <span className="text-xs font-extrabold text-[#2D2A26]">
                  Kirim / Unggah Foto Poster Webinar
                </span>
              </div>
              {imageDataUrl && (
                <button
                  type="button"
                  onClick={handleClearPhoto}
                  className="inline-flex items-center gap-1 rounded-full bg-rose-100 hover:bg-rose-200 px-2.5 py-1 text-[10.5px] font-extrabold text-rose-700 transition"
                >
                  <X className="h-3 w-3" />
                  Hapus Foto
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="webinar-photo-upload"
            />

            {!imageDataUrl ? (
              <label
                htmlFor="webinar-photo-upload"
                className="cursor-pointer flex flex-col items-center justify-center rounded-2xl bg-white/90 hover:bg-white border border-[#E5E0D5] p-5 text-center transition"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E2F1EC] text-[#2E7D67] mb-2">
                  <Upload className="h-5 w-5" />
                </div>
                <span className="text-xs font-extrabold text-[#2D2A26]">
                  Klik untuk Memilih Foto / Poster Webinar dari Perangkat
                </span>
                <span className="mt-0.5 text-[11px] text-[#7A746C]">
                  Mendukung JPG, PNG, WEBP dari PC, Laptop, atau Galeri HP (Otomatis dioptimalkan)
                </span>
              </label>
            ) : (
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden border-2 border-white shadow-md bg-[#2D2A26]/5 max-h-56 flex items-center justify-center">
                  <img
                    src={imageDataUrl}
                    alt="Preview Poster Webinar"
                    className="max-h-52 w-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#4E5A54] font-semibold">
                  <span>
                    📷 Foto terpilih:{" "}
                    <strong>{imageFileName || "Poster Webinar"}</strong>
                  </span>
                  <label
                    htmlFor="webinar-photo-upload"
                    className="cursor-pointer text-[#2E7D67] font-extrabold underline"
                  >
                    Ganti Foto Lain
                  </label>
                </div>
              </div>
            )}
          </div>

          {feedback && (
            <div
              className={`rounded-2xl px-4 py-3 text-xs font-bold flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-[#E2F1EC] border border-[#B8DEC9] text-[#1E5C4A]"
                  : "bg-rose-50 border border-rose-200 text-rose-700"
              }`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{feedback.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-gradient-to-b from-[#2E7D67] to-[#215A49] py-3.5 px-6 text-xs sm:text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(46,125,103,0.3)] flex items-center justify-center gap-2 transition hover:brightness-105 active:scale-98 disabled:opacity-60"
          >
            <Megaphone className="h-4 w-4" />
            <span>
              {isSubmitting
                ? "Menyimpan & Menerbitkan ke Halaman Login..."
                : "Terbitkan Pengumuman & Foto ke Halaman Login"}
            </span>
          </button>
        </form>

        {/* RIGHT: Daftar Pengumuman Seminar / Webinar yang Aktif */}
        <div className="lg:col-span-6 space-y-4">
          <div className="clay-card rounded-[28px] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE8DF] pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#2D2A26]">
                  Daftar Pengumuman Seminar & Webinar Aktif ({announcements.length})
                </h3>
                <p className="text-[11px] text-[#7A746C]">
                   Seluruh pengumuman di bawah ini otomatis tampil pada saat Login
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E2F1EC] px-3 py-1 text-[10.5px] font-extrabold text-[#2E7D67]">
                <Sparkles className="h-3 w-3" />
                Live di Login
              </span>
            </div>

            {announcements.length === 0 ? (
              <div className="rounded-2xl bg-[#F6F4EF] p-6 text-center text-xs text-[#7A746C]">
                Belum ada pengumuman seminar atau webinar. Silakan tambahkan melalui formulir di sebelah kiri.
              </div>
            ) : (
              <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1">
                {announcements.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[22px] bg-[#FCFBF8] border-2 border-[#ECE8DF] p-4 shadow-xs space-y-3 hover:border-[#C6E2D8] transition"
                  >
                    {item.image_data_url && (
                      <div className="relative rounded-2xl overflow-hidden border border-[#E5E0D5] bg-[#F4EFE6] max-h-48">
                        <img
                          src={item.image_data_url}
                          alt={item.title}
                          className="w-full h-44 object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-[#2E7D67]/95 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                            {item.event_type}
                          </span>
                          <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-extrabold text-[#6C4A32] shadow-xs">
                            {item.target_prodi}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      {!item.image_data_url && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-[#E2F1EC] px-2.5 py-0.5 text-[10px] font-extrabold text-[#2E7D67]">
                            {item.event_type}
                          </span>
                          <span className="rounded-full bg-[#FCE8DF] px-2.5 py-0.5 text-[10px] font-extrabold text-[#C8522E]">
                            {item.target_prodi}
                          </span>
                        </div>
                      )}
                      <h4 className="text-sm font-extrabold text-[#2D2A26] leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-[11.5px] text-[#5F544E] leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] font-semibold text-[#4E5A54]">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-[#2E7D67] shrink-0" />
                        <span className="truncate">{item.speaker}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#EE7854] shrink-0" />
                        <span className="truncate">{item.event_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#28568A] shrink-0" />
                        <span className="truncate">{item.event_time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#B8831D] shrink-0" />
                        <span className="truncate">{item.location_or_link}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#ECE8DF] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#E2F1EC] hover:bg-[#D0E8DF] px-3 py-1.5 text-[11px] font-extrabold text-[#2E7D67] transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Lihat Poster Penuh
                        </button>
                        {item.registration_link && (
                          <a
                            href={item.registration_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-[#F6F4EF] hover:bg-[#ECE8DF] px-3 py-1.5 text-[11px] font-bold text-[#2D2A26] transition"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Link Acara
                          </a>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(item.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-[11px] font-extrabold text-rose-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Preview Poster Penuh */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto flex items-center justify-center">
          <div className="w-full max-w-2xl clay-shell rounded-[28px] p-4 sm:p-6 border-2 border-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-[#ECE8DF] pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#2E7D67] px-3 py-1 text-[10.5px] font-extrabold text-white">
                  {previewItem.event_type}
                </span>
                <span className="rounded-full bg-[#FCE8DF] px-3 py-1 text-[10.5px] font-extrabold text-[#C8522E]">
                  {previewItem.target_prodi}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="inline-flex items-center gap-1 rounded-full bg-[#2D2A26] px-3.5 py-1.5 text-xs font-extrabold text-white"
              >
                <X className="h-3.5 w-3.5" />
                Tutup
              </button>
            </div>

            {previewItem.image_data_url && (
              <div className="rounded-2xl overflow-hidden border border-[#E5E0D5] bg-black/5 flex items-center justify-center">
                <img
                  src={previewItem.image_data_url}
                  alt={previewItem.title}
                  className="max-h-[420px] w-auto object-contain"
                />
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-extrabold text-[#2D2A26]">
                {previewItem.title}
              </h3>
              <p className="text-xs text-[#4E5A54] leading-relaxed">
                {previewItem.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs font-semibold text-[#2D2A26]">
                <div>🎤 Pemateri: {previewItem.speaker}</div>
                <div>📅 Tanggal: {previewItem.event_date}</div>
                <div>⏰ Waktu: {previewItem.event_time}</div>
                <div>📍 Tempat/Link: {previewItem.location_or_link}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
