import { PRACTICE_ROOMS } from "../data/workforce";
import {
  calculateBankSessionCost,
  getPatternCycle,
  getSafeWorkforceProfiles,
  normaliseBankShift,
  normaliseWorkingPatternDay,
} from "./workforceService";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export const CAPACITY_BACKBONE_VERSION = "v6.2";
export const DEFAULT_PRACTICE_NAME = "Fleggburgh Surgery";
export const DEFAULT_PRACTICE_ID = "demo-practice";

const DAY_TO_NUMBER = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

function fallback(message = "Supabase not configured") {
  return {
    ok: false,
    mode: "localStorage fallback",
    message,
    practice: null,
    membership: null,
    counts: {},
  };
}

function normaliseRole(value = "") {
  return String(value || "").toLowerCase();
}

function slug(value = "item") {
  return String(value || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "item";
}

function getCurrentUserName(actor = {}) {
  return actor?.name || actor?.display_name || actor?.email || "GPOP user";
}

function inferSkills(profile = {}) {
  const role = normaliseRole([profile.role, profile.team, profile.activity, profile.notes].filter(Boolean).join(" "));
  const skills = [];

  function add(skill_key, skill_label, skill_group = "Clinical capability", can_book_directly = true) {
    if (!skills.some((skill) => skill.skill_key === skill_key)) {
      skills.push({ skill_key, skill_label, skill_group, can_book_directly });
    }
  }

  if (role.includes("gp") || role.includes("registrar") || role.includes("doctor") || role.includes("partner")) {
    add("gp", "GP / duty doctor", "Clinical clinician", true);
    add("same_day_clinician", "Same-day clinician review", "Care navigation", true);
    add("clinical_signoff", "Clinical pathway sign-off", "Governance", false);
  }

  if (role.includes("anp") || role.includes("advanced nurse") || role.includes("nurse practitioner")) {
    add("anp", "ANP / minor illness", "Clinical clinician", true);
    add("same_day_clinician", "Same-day clinician review", "Care navigation", true);
    add("minor_illness", "Minor illness", "Care navigation", true);
  }

  if (role.includes("practice nurse") || role.includes("nurse")) {
    add("practice_nurse", "Practice Nurse", "Clinical clinician", true);
    add("immunisations", "Immunisations / vaccines", "Treatment room", true);
    add("ltc_review", "Long-term condition review", "Chronic disease", true);
  }

  if (role.includes("hca") || role.includes("healthcare assistant") || role.includes("health care assistant")) {
    add("hca", "HCA", "Treatment room", true);
    add("bloods", "Bloods / observations", "Treatment room", true);
    add("bp", "Blood pressure checks", "Treatment room", true);
  }

  if (role.includes("pharmacist") || role.includes("pharmacy")) {
    add("pharmacist", "Practice pharmacist", "Medicines", true);
    add("medication_query", "Medication query", "Medicines", true);
  }

  if (role.includes("reception") || role.includes("navigator") || role.includes("admin") || role.includes("coordinator")) {
    add("reception", "Reception / care navigation", "Admin", true);
    add("admin_task", "Admin task", "Admin", true);
  }

  if (role.includes("physio") || role.includes("fcp") || role.includes("first contact")) {
    add("fcp", "First Contact Physiotherapy", "MSK", true);
    add("msk", "MSK assessment", "MSK", true);
  }

  return skills.length ? skills : [{
    skill_key: "capacity_visible",
    skill_label: "Capacity visible",
    skill_group: "Operational",
    can_book_directly: false,
  }];
}

function calculatePaidHours(startTime, finishTime, breakMinutes = 0, fallbackHours = 0) {
  const [startH, startM] = String(startTime || "").split(":").map(Number);
  const [finishH, finishM] = String(finishTime || "").split(":").map(Number);
  if ([startH, startM, finishH, finishM].some((part) => Number.isNaN(part))) {
    return Number(fallbackHours || 0);
  }
  let minutes = (finishH * 60 + finishM) - (startH * 60 + startM);
  if (minutes < 0) minutes += 24 * 60;
  return Math.max(Math.round(((minutes - Number(breakMinutes || 0)) / 60) * 100) / 100, 0);
}

function buildDefaultRules() {
  return [
    ["chest-pain", "Chest pain", "Urgent clinician review / emergency SOP", "same_day_clinician", "gp", "Duty clinician", "Urgent"],
    ["stroke-tia", "Stroke/TIA symptoms", "Emergency escalation / urgent clinician review", "same_day_clinician", "gp", "Duty clinician", "Urgent"],
    ["breathlessness", "Breathing difficulty", "Same-day urgent clinician review", "same_day_clinician", "gp", "Duty clinician", "Urgent"],
    ["cough-respiratory", "Cough / respiratory symptoms", "Pharmacy First / clinician review if excluded", "minor_illness", "gp", "ANP / GP", "Routine"],
    ["upper-airway-nasal", "Nasal / sinus symptoms", "Pharmacy First / minor illness route if criteria met", "minor_illness", "gp", "Community pharmacy / ANP", "Routine"],
    ["sore-throat-ent", "Sore throat / ENT", "Pharmacy First / clinician review if excluded", "minor_illness", "gp", "Community pharmacy / ANP", "Routine"],
    ["uti-urinary", "UTI / urinary symptoms", "Urine sample / ANP or GP review", "anp", "gp", "ANP / GP", "Same day"],
    ["bladder-leakage", "Bladder leakage / continence", "Routine GP/ANP continence review", "anp", "gp", "ANP / GP", "Routine"],
    ["catheter", "Catheter problem", "Same-day clinician / community nursing route", "same_day_clinician", "gp", "Duty clinician", "Same day"],
    ["skin-rash", "Rash / skin lesion", "Image link plus ANP/GP review", "minor_illness", "gp", "ANP / GP", "Routine"],
    ["msk-injury", "MSK / injury", "FCP if available today, otherwise GP/ANP/local MSK route", "fcp", "gp", "FCP / GP", "Routine"],
    ["headache-neuro", "Headache / neurology", "GP/ANP review according to red flags", "gp", "anp", "GP / ANP", "Routine"],
    ["abdominal-gi", "Abdominal / GI", "GP/ANP review", "gp", "anp", "GP / ANP", "Routine"],
    ["medication", "Medication / prescription", "Practice pharmacist if available, otherwise GP/admin task", "pharmacist", "gp", "Pharmacist / GP", "Routine"],
    ["admin-results", "Admin / results / referrals", "Reception/admin task or GP sign-off if clinical", "admin_task", "gp", "Reception / GP", "Routine"],
    ["mental-health", "Mental health", "GP/ANP mental health review / urgent escalation if risk", "gp", "same_day_clinician", "GP / duty clinician", "Routine"],
    ["children", "Child symptoms", "GP/ANP review unless pharmacy/minor illness criteria approved", "gp", "anp", "GP / ANP", "Routine"],
    ["older-frailty", "Frailty / older person", "GP/ANP review with frailty awareness", "gp", "anp", "GP / ANP", "Routine"],
    ["ltc-review", "Long-term condition review", "Practice Nurse / HCA / GP depending review type", "practice_nurse", "gp", "Practice Nurse", "Routine"],
    ["vaccination", "Vaccination", "Nurse/HCA vaccination appointment if trained", "immunisations", "practice_nurse", "Practice Nurse / HCA", "Routine"],
  ].map(([pathway_key, pathway_label, default_action, primary_skill_key, fallback_skill_key, default_role, urgency]) => ({
    pathway_key,
    pathway_label,
    age_band: "Any",
    sex_context: "Any",
    default_action,
    primary_skill_key,
    fallback_skill_key,
    default_role,
    urgency,
    prep_action: "Use local approved pathway. Confirm red flags and check live SystmOne capacity before booking.",
    slot_text: `Care nav: ${pathway_label} · ${default_role} per approved pathway`,
    signoff_status: "Draft",
    clinical_owner: "Named GP / clinician sign-off required",
  }));
}

export function isCapacityBackboneAvailable() {
  return isSupabaseConfigured() && Boolean(supabase);
}

export async function getCurrentAuthUser() {
  if (!isCapacityBackboneAvailable()) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

export async function ensurePracticeBackbone({ practiceName = DEFAULT_PRACTICE_NAME, role = "Practice Manager", actor = {} } = {}) {
  if (!isCapacityBackboneAvailable()) return fallback("Supabase env vars are not configured.");

  const user = await getCurrentAuthUser();
  if (!user) return fallback("Supabase is configured, but no authenticated user is signed in yet.");

  const displayName = getCurrentUserName(actor);
  const email = user.email || actor?.email || "";

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName,
    email,
    role_label: role,
    last_seen_at: new Date().toISOString(),
    metadata: { source: "gpop-v6.2-access-scaffold" },
  }, { onConflict: "id" });

  if (profileError) return fallback(`Profile setup failed: ${profileError.message}`);

  let practice = null;
  const { data: existingPractices } = await supabase
    .from("practices")
    .select("id, name, status")
    .eq("name", practiceName)
    .limit(1);

  if (Array.isArray(existingPractices) && existingPractices.length > 0) {
    practice = existingPractices[0];
  } else {
    const { data: insertedPractice, error: practiceError } = await supabase
      .from("practices")
      .insert({
        name: practiceName,
        tenant_type: "practice",
        status: "active",
        created_by: user.id,
        updated_by: user.id,
        settings: { created_from: "GPOP v6.2", no_patient_identifiable_data: true },
      })
      .select("id, name, status")
      .single();

    if (practiceError) return fallback(`Practice setup failed: ${practiceError.message}`);
    practice = insertedPractice;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("practice_memberships")
    .upsert({
      practice_id: practice.id,
      user_id: user.id,
      role,
      status: "active",
      created_by: user.id,
      updated_by: user.id,
      permissions: { v62_capacity_backbone: true },
    }, { onConflict: "practice_id,user_id" })
    .select("id, practice_id, user_id, role, status")
    .single();

  if (membershipError) return fallback(`Membership setup failed: ${membershipError.message}`);

  return {
    ok: true,
    mode: "Supabase",
    message: `${practiceName} practice backbone is ready for ${email}.`,
    practice,
    membership,
    user,
  };
}

async function upsertRooms(practiceId, userId) {
  const rows = PRACTICE_ROOMS.map((room) => ({
    practice_id: practiceId,
    name: room.name,
    room_type: room.type || "Operational",
    capacity: room.capacity || 1,
    active: room.status !== "Closed",
    equipment_tags: room.equipmentTags || [],
    room_payload: room,
    created_by: userId,
    updated_by: userId,
  }));

  const { data, error } = await supabase
    .from("rooms")
    .upsert(rows, { onConflict: "practice_id,name" })
    .select("id, name");

  if (error) throw new Error(`Room sync failed: ${error.message}`);
  return data || [];
}

async function upsertStaffProfiles(practiceId, userId, staffProfiles = []) {
  const safeProfiles = getSafeWorkforceProfiles(staffProfiles);
  const rows = safeProfiles.map((profile) => ({
    practice_id: practiceId,
    display_name: profile.name,
    role: profile.role || "Role to confirm",
    team: profile.team || "Unassigned",
    employment_status: profile.employmentStatus || profile.status || "Active",
    contract_type: profile.contractType || "Permanent",
    start_date: profile.startDate || null,
    line_manager: profile.lineManager || "Practice Manager",
    primary_room: profile.primaryRoom || profile.room || "Reception",
    secondary_room: profile.secondaryRoom || "",
    notes: profile.notes || "",
    profile_payload: profile,
    skill_tags: inferSkills(profile).map((skill) => skill.skill_key),
    visible_in_capacity: profile.visibleInCapacity !== false,
    created_by: userId,
    updated_by: userId,
  }));

  const { data, error } = await supabase
    .from("staff_profiles")
    .upsert(rows, { onConflict: "practice_id,display_name" })
    .select("id, display_name, role, primary_room");

  if (error) throw new Error(`Staff profile sync failed: ${error.message}`);

  const idByName = new Map((data || []).map((row) => [row.display_name, row.id]));
  return { rows: data || [], idByName, profiles: safeProfiles };
}

async function replaceStaffChildRows(practiceId, tables = []) {
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("practice_id", practiceId);
    if (error) throw new Error(`${table} cleanup failed: ${error.message}`);
  }
}

function roomIdForName(rooms = [], roomName = "") {
  return rooms.find((room) => room.name === roomName)?.id || null;
}

async function insertSkills(practiceId, userId, profiles = [], idByName = new Map()) {
  const rows = profiles.flatMap((profile) => inferSkills(profile).map((skill) => ({
    practice_id: practiceId,
    staff_profile_id: idByName.get(profile.name),
    ...skill,
    requires_clinician_signoff: skill.skill_key === "clinical_signoff",
    notes: "Derived from GPOP workforce profile. Review before live use.",
    created_by: userId,
    updated_by: userId,
  }))).filter((row) => row.staff_profile_id);

  if (rows.length === 0) return [];
  const { data, error } = await supabase.from("staff_skills").insert(rows).select("id");
  if (error) throw new Error(`Skill sync failed: ${error.message}`);
  return data || [];
}

async function insertWorkingPatternSessions(practiceId, userId, profiles = [], idByName = new Map(), rooms = []) {
  const rows = [];

  profiles.forEach((profile) => {
    const cycle = getPatternCycle(profile);
    (profile.workingPattern || []).forEach((day, dayIndex) => {
      const normalisedDay = normaliseWorkingPatternDay(day, Number(day.week || 1), day.day);
      const baseSegments = Array.isArray(normalisedDay.segments) && normalisedDay.segments.length > 0
        ? normalisedDay.segments
        : [normalisedDay];

      baseSegments.forEach((segment, segmentIndex) => {
        const start = segment.startTime || normalisedDay.startTime;
        const finish = segment.finishTime || normalisedDay.finishTime;
        const paidHours = Number(segment.hours || normalisedDay.hours || 0);
        if (!paidHours && !start && !finish) return;

        rows.push({
          practice_id: practiceId,
          staff_profile_id: idByName.get(profile.name),
          cycle_type: cycle.type,
          cycle_week: Number(normalisedDay.week || 1),
          anchor_date: cycle.anchorDate || "2026-04-06",
          day_of_week: DAY_TO_NUMBER[normalisedDay.day] || ((dayIndex % 7) + 1),
          day_name: normalisedDay.day,
          session_order: segmentIndex + 1,
          starts_at: start || null,
          ends_at: finish || null,
          unpaid_break_minutes: Number(segment.breakMinutes ?? normalisedDay.breakMinutes ?? 0),
          paid_hours: paidHours,
          room_id: roomIdForName(rooms, segment.room || profile.primaryRoom || profile.room),
          room_name: segment.room || profile.primaryRoom || profile.room || "",
          activity: segment.activity || profile.role || "Working session",
          visible_in_capacity: paidHours > 0,
          effective_from: profile.startDate || "2026-04-01",
          created_by: userId,
          updated_by: userId,
        });
      });
    });
  });

  const validRows = rows.filter((row) => row.staff_profile_id);
  if (validRows.length === 0) return [];
  const { data, error } = await supabase.from("working_pattern_sessions").insert(validRows).select("id");
  if (error) throw new Error(`Working pattern session sync failed: ${error.message}`);
  return data || [];
}

async function insertBankSessions(practiceId, userId, profiles = [], idByName = new Map(), rooms = []) {
  const rows = [];
  profiles.forEach((profile) => {
    (profile.bankShifts || []).forEach((source, index) => {
      const shift = normaliseBankShift(source, index, profile.primaryRoom || profile.room || "GP room 1");
      if (!shift.date || shift.status === "Cancelled") return;
      const sessionCost = calculateBankSessionCost(shift);
      rows.push({
        practice_id: practiceId,
        staff_profile_id: idByName.get(profile.name),
        session_date: shift.date,
        starts_at: shift.startTime || "09:00",
        ends_at: shift.finishTime || "17:00",
        unpaid_break_minutes: Number(shift.breakMinutes || 0),
        paid_hours: Number(shift.hours || calculatePaidHours(shift.startTime, shift.finishTime, shift.breakMinutes)),
        room_id: roomIdForName(rooms, shift.room || profile.primaryRoom || profile.room),
        room_name: shift.room || profile.primaryRoom || profile.room || "",
        activity: shift.activity || "Bank / locum session",
        status: shift.status || "Planned",
        pay_type: shift.payType || "Hourly",
        hourly_rate: Number(shift.hourlyRate || 0),
        day_rate: Number(shift.dayRate || 0),
        session_cost: Number(sessionCost || 0),
        funding_source: shift.fundingSource || "Practice",
        note: shift.note || "",
        visible_in_capacity: shift.status !== "Cancelled",
        created_by: userId,
        updated_by: userId,
      });
    });
  });

  const validRows = rows.filter((row) => row.staff_profile_id);
  if (validRows.length === 0) return [];
  const { data, error } = await supabase.from("bank_locum_sessions").insert(validRows).select("id");
  if (error) throw new Error(`Bank/locum session sync failed: ${error.message}`);
  return data || [];
}

async function insertLeaveRequests(practiceId, userId, holidayRequests = [], idByName = new Map()) {
  const rows = (holidayRequests || []).map((request) => ({
    practice_id: practiceId,
    staff_profile_id: idByName.get(request.staffName) || null,
    staff_name: request.staffName || "Unknown staff member",
    start_date: request.startDate || request.date,
    end_date: request.endDate || request.startDate || request.date,
    reason: request.reason || request.type || "Leave",
    status: request.status || "Pending",
    deducted_hours: Number(request.deductedHours ?? request.hours ?? 0),
    deduction_breakdown: request.deductionBreakdown || request.breakdown || [],
    source: request.source || "GPOP local import",
    created_by: userId,
    updated_by: userId,
  })).filter((row) => row.start_date && row.end_date);

  if (rows.length === 0) return [];
  const { data, error } = await supabase.from("leave_requests").insert(rows).select("id");
  if (error) throw new Error(`Leave request sync failed: ${error.message}`);
  return data || [];
}

async function insertAssignmentRules(practiceId, userId) {
  const rows = buildDefaultRules().map((rule) => ({
    practice_id: practiceId,
    ...rule,
    created_by: userId,
    updated_by: userId,
  }));
  const { data, error } = await supabase
    .from("care_nav_assignment_rules")
    .upsert(rows, { onConflict: "practice_id,pathway_key,age_band,sex_context" })
    .select("id");
  if (error) throw new Error(`Care-nav assignment rule sync failed: ${error.message}`);
  return data || [];
}

export async function seedCapacityBackboneFromLocal({ practiceName = DEFAULT_PRACTICE_NAME, role = "Practice Manager", actor = {}, staffProfiles = [], holidayRequests = [] } = {}) {
  if (!isCapacityBackboneAvailable()) return fallback("Supabase is not configured, so GPOP will keep using localStorage.");
  const context = await ensurePracticeBackbone({ practiceName, role, actor });
  if (!context.ok) return context;

  try {
    const practiceId = context.practice.id;
    const userId = context.user.id;
    const rooms = await upsertRooms(practiceId, userId);
    const staffResult = await upsertStaffProfiles(practiceId, userId, staffProfiles);

    await replaceStaffChildRows(practiceId, [
      "staff_skills",
      "working_pattern_sessions",
      "bank_locum_sessions",
      "leave_requests",
    ]);

    const skills = await insertSkills(practiceId, userId, staffResult.profiles, staffResult.idByName);
    const patternSessions = await insertWorkingPatternSessions(practiceId, userId, staffResult.profiles, staffResult.idByName, rooms);
    const bankSessions = await insertBankSessions(practiceId, userId, staffResult.profiles, staffResult.idByName, rooms);
    const leaveRows = await insertLeaveRequests(practiceId, userId, holidayRequests, staffResult.idByName);
    const rules = await insertAssignmentRules(practiceId, userId);

    return {
      ok: true,
      mode: "Supabase",
      message: "Capacity backbone seeded from the current GPOP local/demo workforce.",
      practice: context.practice,
      membership: context.membership,
      counts: {
        rooms: rooms.length,
        staff_profiles: staffResult.rows.length,
        staff_skills: skills.length,
        working_pattern_sessions: patternSessions.length,
        bank_locum_sessions: bankSessions.length,
        leave_requests: leaveRows.length,
        care_nav_assignment_rules: rules.length,
      },
    };
  } catch (error) {
    return fallback(error?.message || "Capacity backbone seed failed.");
  }
}

export async function getCapacityBackboneStatus() {
  if (!isCapacityBackboneAvailable()) return fallback("Supabase is not configured.");
  const context = await ensurePracticeBackbone({ practiceName: DEFAULT_PRACTICE_NAME });
  if (!context.ok) return context;

  const tables = [
    "rooms",
    "staff_profiles",
    "staff_skills",
    "working_pattern_sessions",
    "bank_locum_sessions",
    "leave_requests",
    "care_nav_assignment_rules",
  ];

  const counts = {};
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("practice_id", context.practice.id);
    counts[table] = error ? "setup needed" : count || 0;
  }

  return {
    ...context,
    ok: true,
    mode: "Supabase",
    message: "Capacity backbone status checked.",
    counts,
  };
}

export async function fetchWorkforceProfilesFromSupabase() {
  if (!isCapacityBackboneAvailable()) return { ok: false, profiles: [], message: "Supabase not configured" };
  const context = await ensurePracticeBackbone({ practiceName: DEFAULT_PRACTICE_NAME });
  if (!context.ok) return { ok: false, profiles: [], message: context.message };

  const { data, error } = await supabase
    .from("staff_profiles")
    .select("profile_payload")
    .eq("practice_id", context.practice.id)
    .order("display_name", { ascending: true });

  if (error) return { ok: false, profiles: [], message: error.message };

  const profiles = (data || [])
    .map((row) => row.profile_payload)
    .filter(Boolean);

  return {
    ok: profiles.length > 0,
    profiles,
    message: profiles.length ? "Loaded workforce profiles from Supabase." : "No Supabase workforce profiles seeded yet.",
  };
}
