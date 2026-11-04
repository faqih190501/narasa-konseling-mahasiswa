export type ProblemCategory =
  | "Akademik & Studi"
  | "Emosi & Kesehatan Mental"
  | "Relasi Keluarga/Sosial"
  | "Karier & Masa Depan"
  | "Spiritual & Nilai Diri";

export type UrgencyLabel =
  | "Rendah (0-2)"
  | "Sedang (3-5)"
  | "Tinggi (6-8)"
  | "Kritis (9-12)";

export type TicketStatus =
  | "Pending"
  | "Confirmed"
  | "In-Progress"
  | "Completed"
  | "Rescheduled"
  | "Cancelled"
  | "No-Show";

export type ModalityChoice =
  | "Tatap Muka - Ruang BK"
  | "Daring - Google Meet"
  | "Konsultasi Chat Anonim";

export type ScheduleModality = "Online" | "Offline" | "Both";

export interface StudentAccount {
  id: string;
  nim: string;
  full_name: string;
  prodi_id: string;
  angkatan: number;
  phone_wa: string;
  password: string;
  status_mahasiswa: "Aktif" | "Cuti";
  created_at: string;
}

export interface UserMahasiswa {
  id: string;
  nim_encrypted: string;
  full_name_encrypted: string;
  pseudonym: string;
  prodi_id: string;
  angkatan: number;
  phone_wa_encrypted: string;
  is_anonymous: boolean;
  consent_log_at: string;
  created_at: string;
}

export interface Counselor {
  id: string;
  nip_nidn: string;
  name: string;
  role_title: string;
  specialization: ProblemCategory[];
  bio: string;
  is_peer_counselor: boolean;
  max_daily_slots: number;
  active_status: boolean;
  online_status: boolean;
  phone_piket: string;
}

export interface CounselorSchedule {
  id: string;
  counselor_id: string;
  day_of_week: string;
  date_iso: string;
  start_time: string;
  end_time: string;
  modality_type: ScheduleModality;
  room_location: string;
  is_booked: boolean;
}

export interface SoapNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  updated_at: string;
}

export interface CounselingTicket {
  ticket_code: string;
  mahasiswa_id: string;
  counselor_id: string;
  schedule_id: string;
  category: ProblemCategory;
  emotional_condition: string;
  urgency_score: number;
  urgency_label: UrgencyLabel;
  modality_selected: ModalityChoice;
  status: TicketStatus;
  meet_link: string;
  room_location: string;
  identity_disclosed: boolean;
  triage_duration_seconds: number;
  soap_notes?: SoapNotes;
  csat_rating?: number;
  csat_feedback?: string;
  whatsapp_notified: boolean;
  calendar_synced: boolean;
  reminder_h1_sent: boolean;
  reminder_h2h_sent: boolean;
  created_at: string;
}

export interface IntakeAssessment {
  id: string;
  ticket_code: string;
  phq4_answers: [number, number, number, number]; // Q1, Q2 (GAD-2), Q3, Q4 (PHQ-2)
  phq4_score: number; // 0 - 12
  gad_score: number;  // 0 - 6 (Anxiety)
  phq2_score: number; // 0 - 6 (Depression)
  client_story_encrypted: string;
  crisis_flag: boolean;
  crisis_keywords_detected: string[];
  created_at: string;
}

export interface CrisisEventLog {
  id: string;
  timestamp: string;
  trigger_source: "quick_button" | "keyword_watcher";
  matched_keywords: string[];
  detection_latency_ms: number;
  pseudonym: string;
  piket_counselor_name: string;
  whatsapp_alert_sent: boolean;
  status: "High-Priority Alert Terkirim" | "Ditangani Konselor Piket";
}

export interface LiveChatMessage {
  id: string;
  ticket_code: string;
  sender_role: "mahasiswa" | "counselor" | "system";
  sender_name: string;
  message: string;
  created_at: string;
}

export interface DecryptedTicketView extends CounselingTicket {
  mahasiswa_pseudonym: string;
  mahasiswa_prodi: string;
  mahasiswa_angkatan: number;
  mahasiswa_is_anonymous: boolean;
  // Only populated if requester is the assigned counselor AND identity is disclosed (or escalated)
  mahasiswa_nim_decrypted?: string;
  mahasiswa_name_decrypted?: string;
  mahasiswa_phone_decrypted?: string;
  // Only populated if requester is the assigned counselor
  client_story_decrypted?: string;
  phq4_answers?: [number, number, number, number];
  gad_score?: number;
  phq2_score?: number;
  crisis_flag?: boolean;
  crisis_keywords_detected?: string[];
  counselor_name: string;
  counselor_is_peer: boolean;
  schedule_day: string;
  schedule_date: string;
  schedule_start: string;
  schedule_end: string;
}

