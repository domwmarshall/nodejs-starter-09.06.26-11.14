import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { SETTINGS_STORAGE_KEYS } from "./settingsService";

export const AUTH_SESSION_STORAGE_KEY = SETTINGS_STORAGE_KEYS.authSession;
export const PRACTICE_MEMBERSHIPS_STORAGE_KEY = SETTINGS_STORAGE_KEYS.practiceMemberships;

export const initialRoles = [
  "Practice Manager",
  "GP Partner",
  "Reception / Care Navigator",
  "Practice Nurse",
  "Dispenser",
  "ARRS Pharmacist",
  "PCN Manager",
  "ICB Viewer / Auditor",
];

export function createMockAuthSession({ email, name, role, practiceName, inviteCode }) {
  return {
    id: `mock-user-${Date.now()}`,
    email: email || "demo.user@gpop.local",
    name: name || email?.split("@")[0] || "Demo user",
    role: role || "Practice Manager",
    practiceId: `practice-${String(practiceName || "fleggburgh").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    practiceName: practiceName || "Fleggburgh Surgery",
    inviteCode: inviteCode || "GPOP-DEMO",
    status: "Pending admin approval",
    authMode: isSupabaseConfigured() ? "Supabase-ready scaffold" : "Mock local scaffold",
    createdAt: new Date().toISOString(),
  };
}

export async function signUpWithSupabase({ email, password }) {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, mode: "mock", message: "Supabase Auth is not configured in this environment." };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, mode: "supabase", message: error.message };
  return { ok: true, mode: "supabase", data };
}

export async function signInWithSupabase({ email, password }) {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, mode: "mock", message: "Supabase Auth is not configured in this environment." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, mode: "supabase", message: error.message };
  return { ok: true, mode: "supabase", data };
}

export async function signOutSupabase() {
  if (!isSupabaseConfigured() || !supabase) return { ok: true, mode: "mock" };
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, mode: "supabase", message: error.message };
  return { ok: true, mode: "supabase" };
}

export function getAuthScaffoldSteps() {
  return [
    "Create a practice or enter an invite code",
    "Create profile and select requested role",
    "Practice admin approves membership",
    "RLS grants access only to the user's practice_id",
    "Every material action is linked to authenticated user and practice",
  ];
}
