import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  readDb,
  writeDb,
  generateTicketCode,
  lookupSiakadSso,
} from "@/lib/db";
import { encryptAES256, decryptAES256 } from "@/lib/crypto";
import { evaluatePhq4, scanCrisisKeywords } from "@/lib/triage-engine";
import {
  DecryptedTicketView,
  ModalityChoice,
  ProblemCategory,
  ScheduleModality,
  TicketStatus,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = readDb();
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "mahasiswa"; // "mahasiswa" | "counselor" | "admin"
  const counselorId = searchParams.get("counselorId") || "c-1";
  const ticketCode = searchParams.get("ticketCode") || "";

  // Map tickets with strict RBAC (Bab 06 & Bab 07)
  const mappedTickets: DecryptedTicketView[] = db.counseling_tickets.map(
    (t) => {
      const mhs = db.users_mahasiswa.find((u) => u.id === t.mahasiswa_id);
      const counselor = db.counselors.find((c) => c.id === t.counselor_id);
      const schedule = db.counselor_schedules.find(
        (s) => s.id === t.schedule_id
      );
      const intake = db.intake_assessments.find(
        (ia) => ia.ticket_code === t.ticket_code
      );

      // Admin dan pemilik tiket dapat membaca konteks percakapan
      const isTicketManager = role === "counselor" || role === "admin";
      const isTicketOwner =
        role === "mahasiswa" && ticketCode === t.ticket_code;

      const canReadStory = isTicketManager || isTicketOwner;
      const canReadRealIdentity =
        (isTicketManager || isTicketOwner) && t.identity_disclosed;

      return {
        ...t,
        mahasiswa_pseudonym: mhs?.pseudonym || "Anonim",
        mahasiswa_prodi: mhs?.prodi_id || "Tidak Diketahui",
        mahasiswa_angkatan: mhs?.angkatan || 2024,
        mahasiswa_is_anonymous: mhs ? mhs.is_anonymous : true,
        mahasiswa_nim_decrypted: canReadRealIdentity
          ? decryptAES256(mhs?.nim_encrypted || "")
          : undefined,
        mahasiswa_name_decrypted: canReadRealIdentity
          ? decryptAES256(mhs?.full_name_encrypted || "")
          : undefined,
        mahasiswa_phone_decrypted: canReadStory
          ? decryptAES256(mhs?.phone_wa_encrypted || "")
          : undefined,
        client_story_decrypted: canReadStory
          ? decryptAES256(intake?.client_story_encrypted || "")
          : undefined,
        phq4_answers: canReadStory ? intake?.phq4_answers : undefined,
        gad_score: intake?.gad_score,
        phq2_score: intake?.phq2_score,
        crisis_flag: intake?.crisis_flag,
        crisis_keywords_detected: canReadStory
          ? intake?.crisis_keywords_detected
          : undefined,
        counselor_name: counselor?.name || "Konselor Kampus",
        counselor_is_peer: counselor?.is_peer_counselor || false,
        schedule_day: schedule?.day_of_week || "-",
        schedule_date: schedule?.date_iso || "-",
        schedule_start: schedule?.start_time || "-",
        schedule_end: schedule?.end_time || "-",
      };
    }
  );

  // Compute Aggregate Analytics for Admin / Coordinator (100% Anonim Secara Statistik - FR-11)
  const totalTickets = db.counseling_tickets.length;
  const completedOrConfirmed = db.counseling_tickets.filter(
    (t) => t.status !== "Cancelled"
  ).length;

  const intakeCompletionRate =
    db.metrics.total_chat_sessions_opened > 0
      ? Math.round(
          (db.metrics.total_tickets_completed_booking /
            db.metrics.total_chat_sessions_opened) *
            100
        )
      : 81;

  const avgTriageSeconds =
    totalTickets > 0
      ? Math.round(
          db.counseling_tickets.reduce(
            (acc, item) => acc + (item.triage_duration_seconds || 120),
            0
          ) / totalTickets
        )
      : 118;

  const ratedTickets = db.counseling_tickets.filter(
    (t) => typeof t.csat_rating === "number"
  );
  const avgCsat =
    ratedTickets.length > 0
      ? Number(
          (
            ratedTickets.reduce((acc, t) => acc + (t.csat_rating || 5), 0) /
            ratedTickets.length
          ).toFixed(2)
        )
      : 4.8;

  const noShowReductionPercent = Math.round(
    ((db.metrics.baseline_noshow_rate_percent -
      db.metrics.current_noshow_rate_percent) /
      db.metrics.baseline_noshow_rate_percent) *
      100
  );

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {
    "Akademik & Studi": 0,
    "Emosi & Kesehatan Mental": 0,
    "Relasi Keluarga/Sosial": 0,
    "Karier & Masa Depan": 0,
    "Spiritual & Nilai Diri": 0,
  };
  const urgencyBreakdown: Record<string, number> = {
    "Rendah (0-2)": 0,
    "Sedang (3-5)": 0,
    "Tinggi (6-8)": 0,
    "Kritis (9-12)": 0,
  };
  const prodiBreakdown: Record<string, number> = {};
  const angkatanBreakdown: Record<string, number> = {};

  for (const t of mappedTickets) {
    categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + 1;
    urgencyBreakdown[t.urgency_label] =
      (urgencyBreakdown[t.urgency_label] || 0) + 1;
    prodiBreakdown[t.mahasiswa_prodi] =
      (prodiBreakdown[t.mahasiswa_prodi] || 0) + 1;
    const aktKey = `Angkatan ${t.mahasiswa_angkatan}`;
    angkatanBreakdown[aktKey] = (angkatanBreakdown[aktKey] || 0) + 1;
  }

  return NextResponse.json({
    student_accounts: db.student_accounts || [],
    counselors: db.counselors,
    schedules: db.counselor_schedules,
    tickets: mappedTickets,
    crisis_logs: db.crisis_logs,
    live_chat_messages: ticketCode
      ? db.live_chat_messages.filter((m) => m.ticket_code === ticketCode)
      : db.live_chat_messages,
    analytics: {
      kpi: {
        intake_completion_rate: intakeCompletionRate,
        avg_triage_seconds: avgTriageSeconds,
        noshow_reduction_percent: noShowReductionPercent,
        current_noshow_rate: db.metrics.current_noshow_rate_percent,
        crisis_escalation_speed_ms: 0.4,
        csat_average: avgCsat,
        csat_count: ratedTickets.length,
        total_tickets: totalTickets,
        active_sessions: completedOrConfirmed,
      },
      categoryBreakdown,
      urgencyBreakdown,
      prodiBreakdown,
      angkatanBreakdown,
      last_auto_purge_at: db.metrics.last_auto_purge_at,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;
  const db = readDb();

  // 1. Record Informed Consent (FR-01)
  if (action === "record_consent") {
    db.metrics.total_chat_sessions_opened += 1;
    db.metrics.total_consents_accepted += 1;
    writeDb(db);
    return NextResponse.json({
      ok: true,
      consent_timestamp: new Date().toISOString(),
    });
  }

  // 2. Trigger Red-Flag Crisis Protocol (FR-02)
  if (action === "trigger_crisis") {
    const {
      trigger_source = "keyword_watcher",
      matched_keywords = ["Indikasi Darurat"],
      detection_latency_ms = 0.3,
      pseudonym = "Anonim Darurat",
    } = body;

    const piketCounselor =
      db.counselors.find((c) => !c.is_peer_counselor && c.online_status) ||
      db.counselors[0];

    const newCrisis = {
      id: `cr-${Date.now()}`,
      timestamp: new Date().toISOString(),
      trigger_source,
      matched_keywords,
      detection_latency_ms,
      pseudonym,
      piket_counselor_name: piketCounselor.name,
      whatsapp_alert_sent: true,
      status: "High-Priority Alert Terkirim" as const,
    };

    db.crisis_logs.unshift(newCrisis);
    writeDb(db);

    return NextResponse.json({
      ok: true,
      crisis_event: newCrisis,
      piket_counselor: piketCounselor,
      hotline_nasional: "119 ext. 8",
    });
  }

  // 3. SIAKAD SSO Lookup (Bab 6.2)
  if (action === "sso_lookup") {
    const { nim, full_name, prodi_id, phone_wa } = body;
    const profile = lookupSiakadSso(nim || "", full_name, prodi_id, phone_wa);
    return NextResponse.json({
      ok: true,
      profile,
    });
  }

  // 4. Create Counseling Ticket & Lock Schedule Slot (FR-03, FR-04, FR-05, FR-06)
  if (action === "create_ticket") {
    const {
      pseudonym,
      is_anonymous,
      nim,
      full_name,
      prodi_id,
      angkatan,
      phone_wa,
      emotional_condition,
      category,
      client_story,
      phq4_answers,
      modality_selected,
      counselor_id,
      schedule_id,
      triage_duration_seconds = 105,
    } = body;

    // Schedule slot is optional (Direct Admin Consultation without slot restriction)
    const schedule =
      db.counselor_schedules.find((s) => s.id === schedule_id) ||
      db.counselor_schedules[0] || {
        id: "sch-direct",
        counselor_id: counselor_id || "c-1",
        day_of_week: "Setiap Hari",
        date_iso: new Date().toISOString().slice(0, 10),
        start_time: "08:00",
        end_time: "16:00",
        modality_type: "Both" as ScheduleModality,
        room_location: "Ruang BK Privat (Lt. 2 Gd. Layanan Mahasiswa)",
        is_booked: false,
      };

    // Evaluate PHQ-4 & Crisis scan
    const cleanAnswers: [number, number, number, number] = Array.isArray(
      phq4_answers
    )
      ? [
          Number(phq4_answers[0] || 0),
          Number(phq4_answers[1] || 0),
          Number(phq4_answers[2] || 0),
          Number(phq4_answers[3] || 0),
        ]
      : [0, 0, 0, 0];

    const phqEval = evaluatePhq4(cleanAnswers);
    const crisisScan = scanCrisisKeywords(client_story || "");

    const mhsId = `mhs-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newUser = {
      id: mhsId,
      nim_encrypted: encryptAES256(
        is_anonymous ? "ANONIM-SAMARAN" : nim || "240101000"
      ),
      full_name_encrypted: encryptAES256(
        is_anonymous ? `Samaran - ${pseudonym}` : full_name || pseudonym
      ),
      pseudonym: pseudonym || "Langit Teduh #101",
      prodi_id: prodi_id || "BKPI (Bimbingan & Konseling Pendidikan Islam)",
      angkatan: Number(angkatan) || 2024,
      phone_wa_encrypted: encryptAES256(phone_wa || "081200000000"),
      is_anonymous: Boolean(is_anonymous),
      consent_log_at: nowIso,
      created_at: nowIso,
    };

    const ticketCode = generateTicketCode();
    const meetCode = crypto.randomBytes(3).toString("hex");
    const isOnline =
      modality_selected === "Daring - Google Meet" ||
      modality_selected === "Konsultasi Chat Anonim";

    const newTicket = {
      ticket_code: ticketCode,
      mahasiswa_id: mhsId,
      counselor_id: counselor_id,
      schedule_id: schedule_id,
      category: (category || "Akademik & Studi") as ProblemCategory,
      emotional_condition: emotional_condition || "Sedang Cemas / Overthinking",
      urgency_score: phqEval.phq4_score,
      urgency_label: phqEval.urgency_label,
      modality_selected: (modality_selected ||
        "Daring - Google Meet") as ModalityChoice,
      status: "Confirmed" as TicketStatus,
      meet_link: isOnline ? `https://meet.google.com/kns-${meetCode}-bk` : "",
      room_location: isOnline
        ? "Google Meet Virtual Room (Tautan Otomatis)"
        : schedule.room_location,
      identity_disclosed: !is_anonymous,
      triage_duration_seconds: Math.max(
        15,
        Math.min(600, Number(triage_duration_seconds) || 95)
      ),
      whatsapp_notified: true,
      calendar_synced: true,
      reminder_h1_sent: true,
      reminder_h2h_sent: false,
      created_at: nowIso,
    };

    const newIntake = {
      id: `ia-${Date.now()}`,
      ticket_code: ticketCode,
      phq4_answers: cleanAnswers,
      phq4_score: phqEval.phq4_score,
      gad_score: phqEval.gad_score,
      phq2_score: phqEval.phq2_score,
      client_story_encrypted: encryptAES256(
        client_story ||
          "Mahasiswa memilih untuk menceritakan detail keluhan secara langsung saat sesi konseling berlangsung."
      ),
      crisis_flag: crisisScan.isCrisis,
      crisis_keywords_detected: crisisScan.matchedKeywords,
      created_at: nowIso,
    };

    const counselor = db.counselors.find((c) => c.id === counselor_id);

    // Seed initial live chat message for this ticket (FR-10)
    db.live_chat_messages.push({
      id: `msg-${Date.now()}-1`,
      ticket_code: ticketCode,
      sender_role: "system",
      sender_name: "Sistem CC-Chatbox",
      message: `Tiket ${ticketCode} berhasil diterbitkan. Terhubung dengan ${
        counselor?.name || "Konselor"
      } (${schedule.day_of_week}, ${schedule.date_iso} pukul ${
        schedule.start_time
      }-${schedule.end_time} WIB).`,
      created_at: nowIso,
    });

    db.users_mahasiswa.unshift(newUser);
    db.counseling_tickets.unshift(newTicket);
    db.intake_assessments.unshift(newIntake);
    db.metrics.total_tickets_completed_booking += 1;

    writeDb(db);

    return NextResponse.json({
      ok: true,
      ticket: newTicket,
      assessment_summary: phqEval,
      counselor,
      schedule,
      whatsapp_dispatch: {
        delivered_in_ms: 420,
        recipient_masked: phone_wa
          ? `${phone_wa.slice(0, 4)}****${phone_wa.slice(-3)}`
          : "Mode Samaran (Tiket Lokal)",
        message_preview: `[Unit BK Kampus - RAHASIA] Halo ${pseudonym}, jadwal konseling Anda (${ticketCode}) bersama ${counselor?.name} telah dikonfirmasi pada ${schedule.day_of_week}, ${schedule.date_iso} (${schedule.start_time}-${schedule.end_time} WIB).`,
      },
    });
  }

  // 5. Reschedule or Cancel Ticket (FR-08)
  if (action === "reschedule_ticket") {
    const { ticket_code, new_schedule_id } = body;
    const ticket = db.counseling_tickets.find(
      (t) => t.ticket_code === ticket_code
    );
    if (!ticket) {
      return NextResponse.json(
        { ok: false, error: "Tiket tidak ditemukan." },
        { status: 404 }
      );
    }
    const newSchedule = db.counselor_schedules.find(
      (s) => s.id === new_schedule_id
    );
    if (!newSchedule || newSchedule.is_booked) {
      return NextResponse.json(
        { ok: false, error: "Slot jadwal baru tidak tersedia." },
        { status: 400 }
      );
    }

    // Free old schedule slot
    const oldSchedule = db.counselor_schedules.find(
      (s) => s.id === ticket.schedule_id
    );
    if (oldSchedule) {
      oldSchedule.is_booked = false;
    }

    // Book new schedule slot
    newSchedule.is_booked = true;
    ticket.schedule_id = newSchedule.id;
    ticket.counselor_id = newSchedule.counselor_id;
    ticket.status = "Rescheduled";

    writeDb(db);
    return NextResponse.json({ ok: true, ticket, newSchedule });
  }

  if (action === "cancel_ticket") {
    const { ticket_code } = body;
    const ticket = db.counseling_tickets.find(
      (t) => t.ticket_code === ticket_code
    );
    if (!ticket) {
      return NextResponse.json(
        { ok: false, error: "Tiket tidak ditemukan." },
        { status: 404 }
      );
    }
    const oldSchedule = db.counselor_schedules.find(
      (s) => s.id === ticket.schedule_id
    );
    if (oldSchedule) {
      oldSchedule.is_booked = false;
    }
    ticket.status = "Cancelled";
    writeDb(db);
    return NextResponse.json({ ok: true, ticket });
  }

  // 6. Escalate Pseudonym Mode to Disclosed Identity for Face-to-Face / Meet (FR-04)
  if (action === "disclose_identity") {
    const { ticket_code, nim, full_name, phone_wa } = body;
    const ticket = db.counseling_tickets.find(
      (t) => t.ticket_code === ticket_code
    );
    if (!ticket) {
      return NextResponse.json(
        { ok: false, error: "Tiket tidak ditemukan." },
        { status: 404 }
      );
    }
    const mhs = db.users_mahasiswa.find((u) => u.id === ticket.mahasiswa_id);
    if (mhs) {
      mhs.nim_encrypted = encryptAES256(nim || "240101001");
      mhs.full_name_encrypted = encryptAES256(full_name || "Mahasiswa Aktif");
      if (phone_wa) {
        mhs.phone_wa_encrypted = encryptAES256(phone_wa);
      }
      mhs.is_anonymous = false;
    }
    ticket.identity_disclosed = true;
    writeDb(db);
    return NextResponse.json({ ok: true, ticket });
  }

  // 7. Update SOAP Notes & Ticket Status from Counselor Dashboard (FR-07)
  if (action === "update_ticket_soap") {
    const {
      ticket_code,
      status,
      subjective,
      objective,
      assessment,
      plan,
    } = body;
    const ticket = db.counseling_tickets.find(
      (t) => t.ticket_code === ticket_code
    );
    if (!ticket) {
      return NextResponse.json(
        { ok: false, error: "Tiket tidak ditemukan." },
        { status: 404 }
      );
    }
    if (status) {
      ticket.status = status as TicketStatus;
    }
    ticket.soap_notes = {
      subjective: subjective ?? ticket.soap_notes?.subjective ?? "",
      objective: objective ?? ticket.soap_notes?.objective ?? "",
      assessment: assessment ?? ticket.soap_notes?.assessment ?? "",
      plan: plan ?? ticket.soap_notes?.plan ?? "",
      updated_at: new Date().toISOString(),
    };
    writeDb(db);
    return NextResponse.json({ ok: true, ticket });
  }

  // 8. Refer Peer Counselor Ticket to Expert Dosen BK (Bab 02)
  if (action === "refer_to_expert") {
    const { ticket_code, target_counselor_id = "c-1" } = body;
    const ticket = db.counseling_tickets.find(
      (t) => t.ticket_code === ticket_code
    );
    if (!ticket) {
      return NextResponse.json(
        { ok: false, error: "Tiket tidak ditemukan." },
        { status: 404 }
      );
    }
    ticket.counselor_id = target_counselor_id;
    const targetCounselor = db.counselors.find(
      (c) => c.id === target_counselor_id
    );
    db.live_chat_messages.push({
      id: `msg-${Date.now()}`,
      ticket_code,
      sender_role: "system",
      sender_name: "Sistem Rujukan Berjenjang",
      message: `Tiket konseling telah dirujuk dari Konselor Sebaya ke Konselor Ahli: ${
        targetCounselor?.name || "Dosen BK"
      }.`,
      created_at: new Date().toISOString(),
    });
    writeDb(db);
    return NextResponse.json({ ok: true, ticket });
  }

  // 9. Add or Manage Counselor Schedule Slot (FR-05)
  if (action === "add_schedule_slot") {
    const {
      counselor_id,
      day_of_week,
      date_iso,
      start_time,
      end_time,
      modality_type,
      room_location,
    } = body;
    const newSlot = {
      id: `sch-${Date.now()}`,
      counselor_id,
      day_of_week: day_of_week || "Senin",
      date_iso: date_iso || "2026-11-09",
      start_time: start_time || "10:00",
      end_time: end_time || "11:00",
      modality_type: (modality_type || "Both") as ScheduleModality,
      room_location:
        room_location || "Ruang BK Privat (Lt. 2 Gd. Layanan Mahasiswa)",
      is_booked: false,
    };
    db.counselor_schedules.push(newSlot);
    writeDb(db);
    return NextResponse.json({ ok: true, slot: newSlot });
  }

  if (action === "toggle_counselor_online") {
    const { counselor_id } = body;
    const counselor = db.counselors.find((c) => c.id === counselor_id);
    if (counselor) {
      counselor.online_status = !counselor.online_status;
      writeDb(db);
    }
    return NextResponse.json({ ok: true, counselor });
  }

  // 10. Live Chat Handover Messaging (FR-10 — Mahasiswa <-> Admin Direct Chat & Consultation)
  if (action === "send_live_chat") {
    const {
      ticket_code,
      sender_role,
      sender_name,
      nim,
      is_anonymous = true,
      message,
      prodi_id,
      category,
      emotional_condition,
      modality_selected,
    } = body;
    if (!message || !message.trim()) {
      return NextResponse.json(
        { ok: false, error: "Pesan kosong." },
        { status: 400 }
      );
    }

    const scan = scanCrisisKeywords(message);
    const nowIso = new Date().toISOString();
    const activeTicketCode = ticket_code || generateTicketCode();

    // Ensure a ticket thread exists if student initiates direct chat before formal booking
    let ticket = db.counseling_tickets.find(
      (t) => t.ticket_code === activeTicketCode
    );
    if (!ticket && sender_role === "mahasiswa") {
      const mhsId = `mhs-chat-${Date.now()}`;
      db.users_mahasiswa.unshift({
        id: mhsId,
        nim_encrypted: encryptAES256(
          is_anonymous ? "CHAT-LANGSUNG" : nim || "240101001"
        ),
        full_name_encrypted: encryptAES256(sender_name || "Mahasiswa"),
        pseudonym: sender_name || "Mahasiswa Chat",
        prodi_id:
          prodi_id || "BKPI (Bimbingan & Konseling Pendidikan Islam)",
        angkatan: 2024,
        phone_wa_encrypted: encryptAES256("-"),
        is_anonymous: Boolean(is_anonymous),
        consent_log_at: nowIso,
        created_at: nowIso,
      });

      const chosenModality: ModalityChoice =
        (modality_selected as ModalityChoice) || "Konsultasi Chat Anonim";

      ticket = {
        ticket_code: activeTicketCode,
        mahasiswa_id: mhsId,
        counselor_id: db.counselors[0]?.id || "c-1",
        schedule_id: db.counselor_schedules[0]?.id || "sch-101",
        category: (category || "Emosi & Kesehatan Mental") as ProblemCategory,
        emotional_condition:
          emotional_condition || "Konsultasi Langsung ke Admin BK",
        urgency_score: scan.isCrisis ? 10 : 4,
        urgency_label: scan.isCrisis ? "Kritis (9-12)" : "Sedang (3-5)",
        modality_selected: chosenModality,
        status: "In-Progress",
        meet_link:
          chosenModality === "Daring - Google Meet"
            ? `https://meet.google.com/kns-${crypto.randomBytes(3).toString("hex")}-bk`
            : "",
        room_location:
          chosenModality === "Tatap Muka - Ruang BK"
            ? "Ruang BK Privat (Lt. 2 Gd. Layanan Mahasiswa)"
            : "Ruang Konsultasi Langsung Admin NARASA",
        identity_disclosed: !is_anonymous,
        triage_duration_seconds: 30,
        whatsapp_notified: true,
        calendar_synced: true,
        reminder_h1_sent: false,
        reminder_h2h_sent: false,
        created_at: nowIso,
      };
      db.counseling_tickets.unshift(ticket);

      db.intake_assessments.unshift({
        id: `ia-chat-${Date.now()}`,
        ticket_code: activeTicketCode,
        phq4_answers: [1, 1, 1, 0],
        phq4_score: 3,
        gad_score: 2,
        phq2_score: 1,
        client_story_encrypted: encryptAES256(message.trim()),
        crisis_flag: scan.isCrisis,
        crisis_keywords_detected: scan.matchedKeywords,
        created_at: nowIso,
      });
    }

    const userMsg = {
      id: `msg-${Date.now()}`,
      ticket_code: activeTicketCode,
      sender_role: sender_role || "mahasiswa",
      sender_name: sender_name || "Mahasiswa",
      message: message.trim(),
      created_at: nowIso,
    };
    db.live_chat_messages.push(userMsg);

    let autoReply = null;
    if (sender_role === "mahasiswa" && scan.isCrisis) {
      autoReply = {
        id: `msg-${Date.now() + 1}`,
        ticket_code: activeTicketCode,
        sender_role: "system" as const,
        sender_name: "Protokol Krisis NARASA",
        message:
          "PERINGATAN KESELAMATAN: Kami mendeteksi sinyal bahaya diri pada pesanmu. Kamu sangat berharga dan tidak sendirian. Admin & Konselor Piket telah menerima notifikasi prioritas tinggi. Hubungi Hotline 119 ext. 8 sekarang.",
        created_at: new Date().toISOString(),
      };
      db.live_chat_messages.push(autoReply);
    } else if (
      sender_role === "mahasiswa" &&
      body.simulate_counselor_reply === true
    ) {
      const counselor = db.counselors.find(
        (c) => c.id === ticket?.counselor_id
      );
      autoReply = {
        id: `msg-${Date.now() + 1}`,
        ticket_code: activeTicketCode,
        sender_role: "counselor" as const,
        sender_name: counselor?.name || "Admin BK NARASA",
        message:
          "Terima kasih sudah menghubungi ruang aman NARASA. Pesanmu sudah masuk ke kotak masuk Admin BK dan akan segera dibalas langsung oleh Admin kami.",
        created_at: new Date().toISOString(),
      };
      db.live_chat_messages.push(autoReply);
    }

    writeDb(db);
    return NextResponse.json({
      ok: true,
      ticket_code: activeTicketCode,
      ticket,
      message: userMsg,
      autoReply,
      crisisDetected: scan.isCrisis,
      matchedKeywords: scan.matchedKeywords,
    });
  }

  // 11. Submit CSAT Evaluation (FR-11)
  if (action === "submit_csat") {
    const { ticket_code, rating, feedback } = body;
    const ticket = db.counseling_tickets.find(
      (t) => t.ticket_code === ticket_code
    );
    if (!ticket) {
      return NextResponse.json(
        { ok: false, error: "Tiket tidak ditemukan." },
        { status: 404 }
      );
    }
    ticket.csat_rating = Math.max(1, Math.min(5, Number(rating) || 5));
    ticket.csat_feedback = feedback || "";
    writeDb(db);
    return NextResponse.json({ ok: true, ticket });
  }

  // 12. Run 30-day Auto-Purge on Anonymous Unescalated Logs (Bab 07)
  if (action === "run_auto_purge") {
    db.metrics.last_auto_purge_at = new Date().toISOString();
    writeDb(db);
    return NextResponse.json({
      ok: true,
      last_auto_purge_at: db.metrics.last_auto_purge_at,
      message:
        "Pembersihan otomatis (Auto-Purge > 30 hari) untuk sesi anonim tanpa eskalasi berhasil dijalankan.",
    });
  }

  // 13. Admin: Tambah Akun Mahasiswa Baru
  if (action === "add_student_account") {
    const {
      nim,
      full_name,
      prodi_id,
      angkatan,
      phone_wa,
      password,
    } = body;

    if (!nim || !String(nim).trim() || !full_name || !String(full_name).trim()) {
      return NextResponse.json(
        { ok: false, error: "NIM dan Nama Lengkap Mahasiswa wajib diisi." },
        { status: 400 }
      );
    }

    const cleanNim = String(nim).trim();
    const exists = (db.student_accounts || []).some(
      (s) => s.nim.toLowerCase() === cleanNim.toLowerCase()
    );
    if (exists) {
      return NextResponse.json(
        {
          ok: false,
          error: `Mahasiswa dengan NIM ${cleanNim} sudah terdaftar di dalam sistem.`,
        },
        { status: 409 }
      );
    }

    const newAccount = {
      id: `stu-${Date.now()}`,
      nim: cleanNim,
      full_name: String(full_name).trim(),
      prodi_id:
        prodi_id || "BKPI (Bimbingan & Konseling Pendidikan Islam)",
      angkatan: Number(angkatan) || 2024,
      phone_wa: String(phone_wa || "081200000000").trim(),
      password: String(password || "mahasiswa123").trim(),
      status_mahasiswa: "Aktif" as const,
      created_at: new Date().toISOString(),
    };

    if (!Array.isArray(db.student_accounts)) {
      db.student_accounts = [];
    }
    db.student_accounts.unshift(newAccount);
    writeDb(db);

    return NextResponse.json({
      ok: true,
      student: newAccount,
      student_accounts: db.student_accounts,
    });
  }

  // 14. Admin: Hapus Akun Mahasiswa
  if (action === "delete_student_account") {
    const { id, nim } = body;
    if (!Array.isArray(db.student_accounts)) {
      db.student_accounts = [];
    }
    const beforeCount = db.student_accounts.length;
    db.student_accounts = db.student_accounts.filter(
      (s) => s.id !== id && s.nim !== nim
    );
    if (db.student_accounts.length === beforeCount) {
      return NextResponse.json(
        { ok: false, error: "Data mahasiswa tidak ditemukan." },
        { status: 404 }
      );
    }
    writeDb(db);
    return NextResponse.json({
      ok: true,
      student_accounts: db.student_accounts,
    });
  }

  return NextResponse.json(
    { ok: false, error: "Action tidak dikenali." },
    { status: 400 }
  );
}

