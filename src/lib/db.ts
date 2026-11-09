import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  Counselor,
  CounselorSchedule,
  CounselingTicket,
  IntakeAssessment,
  UserMahasiswa,
  StudentAccount,
  CrisisEventLog,
  LiveChatMessage,
  SeminarAnnouncement,
} from "./types";
import { encryptAES256 } from "./crypto";

export interface DatabaseSchema {
  student_accounts: StudentAccount[];
  users_mahasiswa: UserMahasiswa[];
  counselors: Counselor[];
  counselor_schedules: CounselorSchedule[];
  counseling_tickets: CounselingTicket[];
  intake_assessments: IntakeAssessment[];
  crisis_logs: CrisisEventLog[];
  live_chat_messages: LiveChatMessage[];
  seminar_announcements: SeminarAnnouncement[];
  metrics: {
    total_chat_sessions_opened: number;
    total_consents_accepted: number;
    total_tickets_completed_booking: number;
    baseline_noshow_rate_percent: number;
    current_noshow_rate_percent: number;
    last_auto_purge_at: string;
  };
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "konselin-db.json");
const TMP_DB_FILE = path.join("/tmp", "konselin-db.json");

declare global {
  // eslint-disable-next-line no-var
  var __konselinMemoryDb: DatabaseSchema | undefined;
}

function createInitialSeedData(): DatabaseSchema {
  const counselors: Counselor[] = [
    {
      id: "c-1",
      nip_nidn: "0412088101",
      name: "Dr. Hj. Siti Nurhaliza, M.Pd., Kons.",
      role_title: "Koordinator & Dosen BK Ahli",
      specialization: [
        "Akademik & Studi",
        "Emosi & Kesehatan Mental",
        "Spiritual & Nilai Diri",
      ],
      bio: "Konselor profesional bersertifikat dengan pengalaman 14 tahun mendampingi mahasiswa mengatasi kecemasan skripsi, krisis makna diri, dan regulasi emosi.",
      is_peer_counselor: false,
      max_daily_slots: 5,
      active_status: true,
      online_status: true,
      phone_piket: "6281234567801",
    },
    {
      id: "c-2",
      nip_nidn: "0423118702",
      name: "Ahmad Fauzi, M.Psi., Psikolog",
      role_title: "Psikolog Klinis & Dosen BK",
      specialization: [
        "Emosi & Kesehatan Mental",
        "Relasi Keluarga/Sosial",
        "Akademik & Studi",
      ],
      bio: "Fokus pada penanganan distres emosional sedang-berat, kecemasan klinis, burnout akademik, dan dinamika relasi keluarga.",
      is_peer_counselor: false,
      max_daily_slots: 4,
      active_status: true,
      online_status: true,
      phone_piket: "6281234567802",
    },
    {
      id: "c-3",
      nip_nidn: "0405049003",
      name: "Rina Kartika, M.Pd.",
      role_title: "Dosen BK Karier & Akademik",
      specialization: [
        "Karier & Masa Depan",
        "Akademik & Studi",
        "Spiritual & Nilai Diri",
      ],
      bio: "Mendampingi perencanaan karier pasca-kampus, pemetaan potensi diri, adaptasi mahasiswa baru, dan strategi penyelesaian studi.",
      is_peer_counselor: false,
      max_daily_slots: 4,
      active_status: true,
      online_status: false,
      phone_piket: "6281234567803",
    },
    {
      id: "c-4",
      nip_nidn: "PEER-202301",
      name: "Nadia Putri (Konselor Sebaya)",
      role_title: "Peer Counselor Terlatih — Prodi BKPI",
      specialization: [
        "Akademik & Studi",
        "Relasi Keluarga/Sosial",
        "Karier & Masa Depan",
      ],
      bio: "Teman sebaya terlatih di bawah supervisi Unit BK untuk ruang cerita santai, adaptasi perkuliahan, dan manajemen waktu harian.",
      is_peer_counselor: true,
      max_daily_slots: 6,
      active_status: true,
      online_status: true,
      phone_piket: "6281234567804",
    },
    {
      id: "c-5",
      nip_nidn: "PEER-202302",
      name: "Rizky Pratama (Konselor Sebaya)",
      role_title: "Peer Counselor Terlatih — Prodi BKPI",
      specialization: [
        "Relasi Keluarga/Sosial",
        "Emosi & Kesehatan Mental",
        "Spiritual & Nilai Diri",
      ],
      bio: "Pendamping sebaya untuk curhat ringan seputar pertemanan kampus, organisasi, dan menjaga keseimbangan belajar.",
      is_peer_counselor: true,
      max_daily_slots: 6,
      active_status: true,
      online_status: true,
      phone_piket: "6281234567805",
    },
  ];

  const schedules: CounselorSchedule[] = [
    // c-1 schedules
    {
      id: "sch-101",
      counselor_id: "c-1",
      day_of_week: "Kamis",
      date_iso: "2026-11-05",
      start_time: "09:00",
      end_time: "10:00",
      modality_type: "Both",
      room_location: "Ruang BK Privat 1 (Lt. 2 Gd. Layanan Mahasiswa)",
      is_booked: true,
    },
    {
      id: "sch-102",
      counselor_id: "c-1",
      day_of_week: "Kamis",
      date_iso: "2026-11-05",
      start_time: "10:30",
      end_time: "11:30",
      modality_type: "Both",
      room_location: "Ruang BK Privat 1 (Lt. 2 Gd. Layanan Mahasiswa)",
      is_booked: false,
    },
    {
      id: "sch-103",
      counselor_id: "c-1",
      day_of_week: "Jumat",
      date_iso: "2026-11-06",
      start_time: "13:30",
      end_time: "14:30",
      modality_type: "Online",
      room_location: "Google Meet Virtual Room",
      is_booked: false,
    },
    {
      id: "sch-104",
      counselor_id: "c-1",
      day_of_week: "Senin",
      date_iso: "2026-11-09",
      start_time: "09:00",
      end_time: "10:00",
      modality_type: "Both",
      room_location: "Ruang BK Privat 1 (Lt. 2 Gd. Layanan Mahasiswa)",
      is_booked: false,
    },
    // c-2 schedules
    {
      id: "sch-201",
      counselor_id: "c-2",
      day_of_week: "Kamis",
      date_iso: "2026-11-05",
      start_time: "13:00",
      end_time: "14:00",
      modality_type: "Both",
      room_location: "Ruang Konseling Klinis 2 (Lt. 2 Gd. Layanan Mahasiswa)",
      is_booked: true,
    },
    {
      id: "sch-202",
      counselor_id: "c-2",
      day_of_week: "Jumat",
      date_iso: "2026-11-06",
      start_time: "09:30",
      end_time: "10:30",
      modality_type: "Both",
      room_location: "Ruang Konseling Klinis 2 (Lt. 2 Gd. Layanan Mahasiswa)",
      is_booked: false,
    },
    {
      id: "sch-203",
      counselor_id: "c-2",
      day_of_week: "Selasa",
      date_iso: "2026-11-10",
      start_time: "14:00",
      end_time: "15:00",
      modality_type: "Online",
      room_location: "Google Meet Virtual Room",
      is_booked: false,
    },
    // c-3 schedules
    {
      id: "sch-301",
      counselor_id: "c-3",
      day_of_week: "Jumat",
      date_iso: "2026-11-06",
      start_time: "10:00",
      end_time: "11:00",
      modality_type: "Both",
      room_location: "Ruang Bimbingan Karier (Lt. 1 Gd. Layanan Mahasiswa)",
      is_booked: true,
    },
    {
      id: "sch-302",
      counselor_id: "c-3",
      day_of_week: "Senin",
      date_iso: "2026-11-09",
      start_time: "13:00",
      end_time: "14:00",
      modality_type: "Both",
      room_location: "Ruang Bimbingan Karier (Lt. 1 Gd. Layanan Mahasiswa)",
      is_booked: false,
    },
    {
      id: "sch-303",
      counselor_id: "c-3",
      day_of_week: "Rabu",
      date_iso: "2026-11-11",
      start_time: "10:00",
      end_time: "11:00",
      modality_type: "Online",
      room_location: "Google Meet Virtual Room",
      is_booked: false,
    },
    // c-4 (Peer counselor) schedules
    {
      id: "sch-401",
      counselor_id: "c-4",
      day_of_week: "Kamis",
      date_iso: "2026-11-05",
      start_time: "15:30",
      end_time: "16:30",
      modality_type: "Both",
      room_location: "Pojok Sahabat BK / Google Meet",
      is_booked: true,
    },
    {
      id: "sch-402",
      counselor_id: "c-4",
      day_of_week: "Jumat",
      date_iso: "2026-11-06",
      start_time: "15:00",
      end_time: "16:00",
      modality_type: "Online",
      room_location: "Google Meet / Chat Sebaya",
      is_booked: false,
    },
    {
      id: "sch-403",
      counselor_id: "c-4",
      day_of_week: "Sabtu",
      date_iso: "2026-11-07",
      start_time: "10:00",
      end_time: "11:00",
      modality_type: "Online",
      room_location: "Google Meet / Chat Sebaya",
      is_booked: false,
    },
    // c-5 (Peer counselor) schedules
    {
      id: "sch-501",
      counselor_id: "c-5",
      day_of_week: "Kamis",
      date_iso: "2026-11-05",
      start_time: "16:00",
      end_time: "17:00",
      modality_type: "Online",
      room_location: "Google Meet / Chat Sebaya",
      is_booked: false,
    },
    {
      id: "sch-502",
      counselor_id: "c-5",
      day_of_week: "Senin",
      date_iso: "2026-11-09",
      start_time: "15:30",
      end_time: "16:30",
      modality_type: "Both",
      room_location: "Pojok Sahabat BK / Google Meet",
      is_booked: false,
    },
  ];

  const users_mahasiswa: UserMahasiswa[] = [
    {
      id: "mhs-1",
      nim_encrypted: encryptAES256("220101014"),
      full_name_encrypted: encryptAES256("Aulia Rahmawati"),
      pseudonym: "Langit Teduh #412",
      prodi_id: "BKPI (Bimbingan & Konseling Pendidikan Islam)",
      angkatan: 2022,
      phone_wa_encrypted: encryptAES256("081298761234"),
      is_anonymous: false,
      consent_log_at: "2026-11-02T08:14:00.000Z",
      created_at: "2026-11-02T08:14:00.000Z",
    },
    {
      id: "mhs-2",
      nim_encrypted: encryptAES256("ANONIM-SAMARAN"),
      full_name_encrypted: encryptAES256("Samaran - Embun Pagi #209"),
      pseudonym: "Embun Pagi #209",
      prodi_id: "PIAUD (Pendidikan Islam Anak Usia Dini)",
      angkatan: 2024,
      phone_wa_encrypted: encryptAES256("085711223344"),
      is_anonymous: true,
      consent_log_at: "2026-11-03T10:20:00.000Z",
      created_at: "2026-11-03T10:20:00.000Z",
    },
    {
      id: "mhs-3",
      nim_encrypted: encryptAES256("230204088"),
      full_name_encrypted: encryptAES256("Muhammad Fikri Haikal"),
      pseudonym: "Bintang Utara #774",
      prodi_id: "PIAUD (Pendidikan Islam Anak Usia Dini)",
      angkatan: 2023,
      phone_wa_encrypted: encryptAES256("081344556677"),
      is_anonymous: false,
      consent_log_at: "2026-11-03T14:05:00.000Z",
      created_at: "2026-11-03T14:05:00.000Z",
    },
    {
      id: "mhs-4",
      nim_encrypted: encryptAES256("250101052"),
      full_name_encrypted: encryptAES256("Salsabila Nur Azizah"),
      pseudonym: "Senja Tenang #518",
      prodi_id: "BKPI (Bimbingan & Konseling Pendidikan Islam)",
      angkatan: 2025,
      phone_wa_encrypted: encryptAES256("082199887766"),
      is_anonymous: true,
      consent_log_at: "2026-11-03T19:30:00.000Z",
      created_at: "2026-11-03T19:30:00.000Z",
    },
  ];

  const counseling_tickets: CounselingTicket[] = [
    {
      ticket_code: "BK-20261102-1042",
      mahasiswa_id: "mhs-1",
      counselor_id: "c-1",
      schedule_id: "sch-101",
      category: "Akademik & Studi",
      emotional_condition: "Lelah Akademik / Skripsi",
      urgency_score: 7,
      urgency_label: "Tinggi (6-8)",
      modality_selected: "Tatap Muka - Ruang BK",
      status: "Completed",
      meet_link: "",
      room_location: "Ruang BK Privat 1 (Lt. 2 Gd. Layanan Mahasiswa)",
      identity_disclosed: true,
      triage_duration_seconds: 125,
      soap_notes: {
        subjective:
          "Klien mengeluhkan kecemasan tinggi saat hendak bimbingan revisi bab 4 skripsi dan sulit tidur selama 2 minggu terakhir.",
        objective:
          "Klien tampak tegang di awal sesi namun kooperatif. Skor PHQ-4: 7 (GAD-2: 4, PHQ-2: 3).",
        assessment:
          "Academic burnout & kecemasan performa terkait penyelesaian tugas akhir.",
        plan: "1. Latihan teknik grounding & pernapasan 4-7-8. 2. Penyusunan micro-goals pengerjaan revisi per 3 hari. 3. Sesi evaluasi 2 minggu mendatang.",
        updated_at: "2026-11-03T11:00:00.000Z",
      },
      csat_rating: 5,
      csat_feedback:
        "Sangat membantu, chatbox-nya menenangkan dan tidak bikin canggung waktu mau daftar.",
      whatsapp_notified: true,
      calendar_synced: true,
      reminder_h1_sent: true,
      reminder_h2h_sent: true,
      created_at: "2026-11-02T08:16:05.000Z",
    },
    {
      ticket_code: "BK-20261103-3819",
      mahasiswa_id: "mhs-2",
      counselor_id: "c-2",
      schedule_id: "sch-201",
      category: "Emosi & Kesehatan Mental",
      emotional_condition: "Sedih Berkepanjangan",
      urgency_score: 10,
      urgency_label: "Kritis (9-12)",
      modality_selected: "Daring - Google Meet",
      status: "Confirmed",
      meet_link: "https://meet.google.com/kns-ccbk-201",
      room_location: "Google Meet Virtual Room (Privat Terenkripsi)",
      identity_disclosed: false,
      triage_duration_seconds: 142,
      whatsapp_notified: true,
      calendar_synced: true,
      reminder_h1_sent: true,
      reminder_h2h_sent: false,
      created_at: "2026-11-03T10:22:22.000Z",
    },
    {
      ticket_code: "BK-20261103-5904",
      mahasiswa_id: "mhs-3",
      counselor_id: "c-3",
      schedule_id: "sch-301",
      category: "Karier & Masa Depan",
      emotional_condition: "Sedang Cemas / Overthinking",
      urgency_score: 4,
      urgency_label: "Sedang (3-5)",
      modality_selected: "Tatap Muka - Ruang BK",
      status: "Confirmed",
      meet_link: "",
      room_location: "Ruang Bimbingan Karier (Lt. 1 Gd. Layanan Mahasiswa)",
      identity_disclosed: true,
      triage_duration_seconds: 110,
      csat_rating: 5,
      csat_feedback: "Proses pemilihan jadwal cepat dan langsung dapat WA.",
      whatsapp_notified: true,
      calendar_synced: true,
      reminder_h1_sent: true,
      reminder_h2h_sent: false,
      created_at: "2026-11-03T14:06:50.000Z",
    },
    {
      ticket_code: "BK-20261103-7120",
      mahasiswa_id: "mhs-4",
      counselor_id: "c-4",
      schedule_id: "sch-401",
      category: "Relasi Keluarga/Sosial",
      emotional_condition: "Sedang Cemas / Overthinking",
      urgency_score: 2,
      urgency_label: "Rendah (0-2)",
      modality_selected: "Konsultasi Chat Anonim",
      status: "In-Progress",
      meet_link: "https://meet.google.com/kns-peer-401",
      room_location: "Live Chat Sebaya / Pojok Sahabat BK",
      identity_disclosed: false,
      triage_duration_seconds: 95,
      csat_rating: 4,
      csat_feedback: "Nyaman bisa pakai nama samaran dulu.",
      whatsapp_notified: true,
      calendar_synced: true,
      reminder_h1_sent: true,
      reminder_h2h_sent: true,
      created_at: "2026-11-03T19:31:35.000Z",
    },
  ];

  const intake_assessments: IntakeAssessment[] = [
    {
      id: "ia-1",
      ticket_code: "BK-20261102-1042",
      phq4_answers: [2, 2, 2, 1],
      phq4_score: 7,
      gad_score: 4,
      phq2_score: 3,
      client_story_encrypted: encryptAES256(
        "Saya merasa sangat takut bertemu dosen pembimbing skripsi karena takut hasil olah data saya salah semua. Sudah dua minggu sulit tidur dan jantung sering berdebar."
      ),
      crisis_flag: false,
      crisis_keywords_detected: [],
      created_at: "2026-11-02T08:16:05.000Z",
    },
    {
      id: "ia-2",
      ticket_code: "BK-20261103-3819",
      phq4_answers: [3, 2, 3, 2],
      phq4_score: 10,
      gad_score: 5,
      phq2_score: 5,
      client_story_encrypted: encryptAES256(
        "Akhir-akhir ini saya menangis hampir setiap malam di kosan, merasa tertekan karena masalah finansial keluarga dan nilai kuliah yang turun drastis. Saya butuh teman bicara profesional tapi malu kalau teman sekelas tahu."
      ),
      crisis_flag: false,
      crisis_keywords_detected: [],
      created_at: "2026-11-03T10:22:22.000Z",
    },
    {
      id: "ia-3",
      ticket_code: "BK-20261103-5904",
      phq4_answers: [1, 2, 1, 0],
      phq4_score: 4,
      gad_score: 3,
      phq2_score: 1,
      client_story_encrypted: encryptAES256(
        "Bingung menentukan fokus karier setelah lulus nanti, apakah lanjut mengajar di sekolah atau mengambil jalur profesi lain karena tuntutan orang tua."
      ),
      crisis_flag: false,
      crisis_keywords_detected: [],
      created_at: "2026-11-03T14:06:50.000Z",
    },
    {
      id: "ia-4",
      ticket_code: "BK-20261103-7120",
      phq4_answers: [1, 1, 0, 0],
      phq4_score: 2,
      gad_score: 2,
      phq2_score: 0,
      client_story_encrypted: encryptAES256(
        "Sebagai mahasiswa baru dari luar kota, saya masih canggung beradaptasi dengan teman-teman kelompok di kelas dan sering merasa homesick."
      ),
      crisis_flag: false,
      crisis_keywords_detected: [],
      created_at: "2026-11-03T19:31:35.000Z",
    },
  ];

  const crisis_logs: CrisisEventLog[] = [
    {
      id: "cr-101",
      timestamp: "2026-11-01T21:14:10.000Z",
      trigger_source: "keyword_watcher",
      matched_keywords: ["tidak kuat hidup lagi"],
      detection_latency_ms: 0.4,
      pseudonym: "Samudra Biru #903",
      piket_counselor_name: "Ahmad Fauzi, M.Psi., Psikolog",
      whatsapp_alert_sent: true,
      status: "Ditangani Konselor Piket",
    },
  ];

  const live_chat_messages: LiveChatMessage[] = [
    {
      id: "msg-1",
      ticket_code: "BK-20261103-7120",
      sender_role: "system",
      sender_name: "Sistem CC-Chatbox",
      message:
        "Sesi Live Chat Anonim terhubung dengan Nadia Putri (Konselor Sebaya). Identitas asli Anda tetap dirahasiakan.",
      created_at: "2026-11-03T19:32:00.000Z",
    },
    {
      id: "msg-2",
      ticket_code: "BK-20261103-7120",
      sender_role: "counselor",
      sender_name: "Nadia Putri (Konselor Sebaya)",
      message:
        "Halo Kak Senja Tenang #518! Terima kasih sudah berani cerita ya. Wajar banget kok merasa homesick di semester awal perantauan. Bagian mana yang paling bikin kakak merasa canggung di kelas saat ini?",
      created_at: "2026-11-03T19:33:10.000Z",
    },
    {
      id: "msg-3",
      ticket_code: "BK-20261103-7120",
      sender_role: "mahasiswa",
      sender_name: "Senja Tenang #518",
      message:
        "Halo Kak Nadia, iya kak setiap ada pembagian kelompok diskusi rasanya takut nggak kebagian kelompok karena teman-teman lain sudah punya circle sendiri.",
      created_at: "2026-11-03T19:35:00.000Z",
    },
  ];

  const student_accounts: StudentAccount[] = [
    {
      id: "stu-1",
      nim: "230101001",
      full_name: "Naufal Rizqullah Pratama",
      prodi_id: "BKPI (Bimbingan & Konseling Pendidikan Islam)",
      angkatan: 2023,
      phone_wa: "081288990011",
      password: "mahasiswa123",
      status_mahasiswa: "Aktif",
      created_at: "2026-11-01T08:00:00.000Z",
    },
    {
      id: "stu-2",
      nim: "240102015",
      full_name: "Zahra Khairunnisa",
      prodi_id: "PIAUD (Pendidikan Islam Anak Usia Dini)",
      angkatan: 2024,
      phone_wa: "085677889922",
      password: "mahasiswa123",
      status_mahasiswa: "Aktif",
      created_at: "2026-11-01T08:05:00.000Z",
    },
    {
      id: "stu-3",
      nim: "220101014",
      full_name: "Aulia Rahmawati",
      prodi_id: "BKPI (Bimbingan & Konseling Pendidikan Islam)",
      angkatan: 2022,
      phone_wa: "081298761234",
      password: "mahasiswa123",
      status_mahasiswa: "Aktif",
      created_at: "2026-11-01T08:10:00.000Z",
    },
    {
      id: "stu-4",
      nim: "250101042",
      full_name: "Dimas Aditya Saputra",
      prodi_id: "PIAUD (Pendidikan Islam Anak Usia Dini)",
      angkatan: 2025,
      phone_wa: "081366778899",
      password: "mahasiswa123",
      status_mahasiswa: "Aktif",
      created_at: "2026-11-01T08:15:00.000Z",
    },
  ];

  const defaultPosterSvg1 =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2E7D67"/><stop offset="55%" stop-color="#559A87"/><stop offset="100%" stop-color="#EE7854"/></linearGradient></defs><rect width="800" height="420" rx="24" fill="url(#g1)"/><circle cx="710" cy="80" r="110" fill="#FFFFFF" fill-opacity="0.12"/><circle cx="90" cy="360" r="130" fill="#FFFFFF" fill-opacity="0.1"/><rect x="44" y="38" width="210" height="34" rx="17" fill="#FCFBF8"/><text x="149" y="60" font-family="Segoe UI, Arial" font-size="14" font-weight="800" fill="#2E7D67" text-anchor="middle">WEBINAR NASIONAL BK</text><text x="44" y="130" font-family="Segoe UI, Arial" font-size="31" font-weight="800" fill="#FFFFFF">Kesehatan Mental Mahasiswa</text><text x="44" y="172" font-family="Segoe UI, Arial" font-size="27" font-weight="700" fill="#FDECC8">&amp; Ketangguhan Akademik di Era Digital</text><text x="44" y="230" font-family="Segoe UI, Arial" font-size="17" font-weight="600" fill="#EAF6F1">Pemateri: Dr. Hj. Siti Nurhaliza, M.Pd., Kons. &amp; Ahmad Fauzi, M.Psi., Psikolog</text><rect x="44" y="275" width="490" height="54" rx="14" fill="#FFFFFF" fill-opacity="0.18"/><text x="64" y="308" font-family="Segoe UI, Arial" font-size="16" font-weight="700" fill="#FFFFFF"> terbuka untuk Mahasiswa BKPI &amp; PIAUD • Free E-Sertifikat</text></svg>`
    );

  const defaultPosterSvg2 =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6C4A32"/><stop offset="50%" stop-color="#C86D44"/><stop offset="100%" stop-color="#F2B84B"/></linearGradient></defs><rect width="800" height="420" rx="24" fill="url(#g2)"/><circle cx="690" cy="330" r="120" fill="#FFFFFF" fill-opacity="0.12"/><rect x="44" y="38" width="240" height="34" rx="17" fill="#FCFBF8"/><text x="164" y="60" font-family="Segoe UI, Arial" font-size="14" font-weight="800" fill="#6C4A32" text-anchor="middle">SEMINAR PRAKTIKUM PIAUD &amp; BKPI</text><text x="44" y="130" font-family="Segoe UI, Arial" font-size="30" font-weight="800" fill="#FFFFFF">Pendampingan Regulasi Emosi</text><text x="44" y="172" font-family="Segoe UI, Arial" font-size="26" font-weight="700" fill="#FFF4D6">Anak Usia Dini &amp; Konseling Sebaya</text><text x="44" y="230" font-family="Segoe UI, Arial" font-size="17" font-weight="600" fill="#FFF9EB">Narasumber: Rina Kartika, M.Pd. • Aula Utama &amp; Live Zoom</text><rect x="44" y="275" width="470" height="54" rx="14" fill="#FFFFFF" fill-opacity="0.18"/><text x="64" y="308" font-family="Segoe UI, Arial" font-size="16" font-weight="700" fill="#FFFFFF">Kolaborasi Prodi BKPI &amp; PIAUD • Pendaftaran Gratis</text></svg>`
    );

  const seminar_announcements: SeminarAnnouncement[] = [
    {
      id: "sem-101",
      title: "Webinar Kesehatan Mental & Strategi Mengatasi Academic Burnout",
      event_type: "Webinar",
      target_prodi: "Semua Prodi (BKPI & PIAUD)",
      speaker: "Dr. Hj. Siti Nurhaliza, M.Pd., Kons. & Ahmad Fauzi, M.Psi., Psikolog",
      event_date: "Sabtu, 14 November 2026",
      event_time: "09.00 – 11.30 WIB",
      location_or_link: "Zoom Cloud Meetings & Live YouTube NARASA",
      registration_link: "https://meet.google.com/narasa-webinar-bk",
      description:
        "Kupas tuntas teknik regulasi emosi, manajemen kecemasan skripsi, serta pertolongan pertama psikologis (Psychological First Aid) bagi mahasiswa BKPI dan PIAUD.",
      image_data_url: defaultPosterSvg1,
      created_by: "Admin Utama NARASA",
      created_at: "2026-11-08T08:00:00.000Z",
    },
    {
      id: "sem-102",
      title: "Seminar Kolaborasi: Regulasi Emosi Anak Usia Dini & Konseling Sebaya",
      event_type: "Seminar",
      target_prodi: "Semua Prodi (BKPI & PIAUD)",
      speaker: "Rina Kartika, M.Pd. (Dosen BK & Praktisi Pendidikan)",
      event_date: "Rabu, 18 November 2026",
      event_time: "13.00 – 15.30 WIB",
      location_or_link: "Aula Gedung Layanan Mahasiswa Lt. 2 & Hybrid Google Meet",
      registration_link: "https://meet.google.com/narasa-seminar-piaud",
      description:
        "Seminar interaktif mengenai tahapan perkembangan sosial-emosional AUD serta praktik komunikasi empatik bagi calon pendidik PIAUD dan konselor BKPI.",
      image_data_url: defaultPosterSvg2,
      created_by: "Admin Utama NARASA",
      created_at: "2026-11-08T09:00:00.000Z",
    },
  ];

  return {
    student_accounts,
    users_mahasiswa,
    counselors,
    counselor_schedules: schedules,
    counseling_tickets,
    intake_assessments,
    crisis_logs,
    live_chat_messages,
    seminar_announcements,
    metrics: {
      total_chat_sessions_opened: 48,
      total_consents_accepted: 44,
      total_tickets_completed_booking: 39,
      baseline_noshow_rate_percent: 28,
      current_noshow_rate_percent: 11, // Turun > 60% berkat pengingat otomatis H-1 & H-2 jam
      last_auto_purge_at: "2026-11-04T00:00:00.000Z",
    },
  };
}

export function readDb(): DatabaseSchema {
  try {
    // 1. Check /tmp first if running on serverless (e.g., Vercel/Netlify) and already written
    if (fs.existsSync(TMP_DB_FILE)) {
      const rawTmp = fs.readFileSync(TMP_DB_FILE, "utf8");
      const parsedTmp = JSON.parse(rawTmp) as DatabaseSchema;
      if (!Array.isArray(parsedTmp.seminar_announcements)) {
        parsedTmp.seminar_announcements =
          createInitialSeedData().seminar_announcements;
      }
      globalThis.__konselinMemoryDb = parsedTmp;
      return parsedTmp;
    }

    // 2. Check local workspace data/konselin-db.json
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(raw) as DatabaseSchema;
      let mutated = false;
      if (!Array.isArray(parsed.student_accounts)) {
        parsed.student_accounts = createInitialSeedData().student_accounts;
        mutated = true;
      }
      if (!Array.isArray(parsed.seminar_announcements)) {
        parsed.seminar_announcements =
          createInitialSeedData().seminar_announcements;
        mutated = true;
      }
      if (mutated) {
        writeDb(parsed);
      }
      globalThis.__konselinMemoryDb = parsed;
      return parsed;
    }

    // 3. Check in-memory fallback
    if (globalThis.__konselinMemoryDb) {
      return globalThis.__konselinMemoryDb;
    }

    // 4. Create initial seed data
    const seed = createInitialSeedData();
    globalThis.__konselinMemoryDb = seed;
    writeDb(seed);
    return seed;
  } catch {
    if (globalThis.__konselinMemoryDb) {
      return globalThis.__konselinMemoryDb;
    }
    const seed = createInitialSeedData();
    globalThis.__konselinMemoryDb = seed;
    return seed;
  }
}

export function writeDb(data: DatabaseSchema): void {
  globalThis.__konselinMemoryDb = data;
  const serialized = JSON.stringify(data, null, 2);
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, serialized, "utf8");
  } catch {
    // Fallback for read-only cloud/serverless environments (Vercel/Netlify)
    try {
      fs.writeFileSync(TMP_DB_FILE, serialized, "utf8");
    } catch {
      // In-memory globalThis.__konselinMemoryDb still holds latest state
    }
  }
}

export function generateTicketCode(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = crypto.randomInt(1000, 9999);
  return `BK-${y}${m}${d}-${rand}`;
}

// Simulasi Direktori SIAKAD SSO Kampus (Bab 6.2)
export interface SiakadStudentProfile {
  nim: string;
  full_name: string;
  prodi_id: string;
  angkatan: number;
  status_mahasiswa: "Aktif";
  phone_wa: string;
}

const SIAKAD_DIRECTORY: Record<string, SiakadStudentProfile> = {
  "230101001": {
    nim: "230101001",
    full_name: "Naufal Rizqullah Pratama",
    prodi_id: "BKPI (Bimbingan & Konseling Pendidikan Islam)",
    angkatan: 2023,
    status_mahasiswa: "Aktif",
    phone_wa: "081288990011",
  },
  "240102015": {
    nim: "240102015",
    full_name: "Zahra Khairunnisa",
    prodi_id: "PIAUD (Pendidikan Islam Anak Usia Dini)",
    angkatan: 2024,
    status_mahasiswa: "Aktif",
    phone_wa: "085677889922",
  },
  "220101014": {
    nim: "220101014",
    full_name: "Aulia Rahmawati",
    prodi_id: "BKPI (Bimbingan & Konseling Pendidikan Islam)",
    angkatan: 2022,
    status_mahasiswa: "Aktif",
    phone_wa: "081298761234",
  },
  "250101042": {
    nim: "250101042",
    full_name: "Dimas Aditya Saputra",
    prodi_id: "PIAUD (Pendidikan Islam Anak Usia Dini)",
    angkatan: 2025,
    status_mahasiswa: "Aktif",
    phone_wa: "081366778899",
  },
};

export function lookupSiakadSso(
  nimInput: string,
  customName?: string,
  customProdi?: string,
  customPhone?: string
): SiakadStudentProfile {
  const cleanNim = nimInput.trim();
  const db = readDb();
  const existingAccount = db.student_accounts.find(
    (s) => s.nim.toLowerCase() === cleanNim.toLowerCase()
  );
  if (existingAccount) {
    return {
      nim: existingAccount.nim,
      full_name: existingAccount.full_name,
      prodi_id: existingAccount.prodi_id,
      angkatan: existingAccount.angkatan,
      status_mahasiswa: "Aktif",
      phone_wa: existingAccount.phone_wa,
    };
  }
  if (SIAKAD_DIRECTORY[cleanNim]) {
    return SIAKAD_DIRECTORY[cleanNim];
  }
  const yearPrefix = parseInt(cleanNim.slice(0, 2), 10);
  const angkatan =
    !isNaN(yearPrefix) && yearPrefix >= 19 && yearPrefix <= 26
      ? 2000 + yearPrefix
      : 2024;
  return {
    nim: cleanNim || "240101099",
    full_name: customName?.trim() || `Mahasiswa SIAKAD (${cleanNim})`,
    prodi_id:
      customProdi || "BKPI (Bimbingan & Konseling Pendidikan Islam)",
    angkatan,
    status_mahasiswa: "Aktif",
    phone_wa: customPhone?.trim() || "081200001122",
  };
}

