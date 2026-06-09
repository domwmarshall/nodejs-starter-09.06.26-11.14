import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const ACTIVITY_LOG_TABLE = "gpop_activity_log";

export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl &&
      supabasePublishableKey &&
      !String(supabaseUrl).includes("your-project") &&
      !String(supabasePublishableKey).includes("your-")
  );
}

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function getSupabaseEnvironmentSummary() {
  return {
    configured: isSupabaseConfigured(),
    urlPresent: Boolean(supabaseUrl),
    keyPresent: Boolean(supabasePublishableKey),
    tableName: ACTIVITY_LOG_TABLE,
    mode: isSupabaseConfigured() ? "Supabase configured" : "localStorage fallback",
  };
}

export async function getSupabaseConnectionStatus() {
  const environment = getSupabaseEnvironmentSummary();

  if (!environment.configured || !supabase) {
    return {
      ...environment,
      status: "fallback",
      label: "localStorage fallback",
      message:
        "Supabase environment variables are not configured. GPOP will continue using browser localStorage.",
      checkedAt: new Date().toISOString(),
    };
  }

  try {
    const { error } = await supabase
      .from(ACTIVITY_LOG_TABLE)
      .select("id")
      .limit(1);

    if (error) {
      return {
        ...environment,
        status: "error",
        label: "Supabase needs setup",
        message:
          error.message ||
          "Supabase responded, but the activity log table or RLS policy is not ready.",
        checkedAt: new Date().toISOString(),
      };
    }

    return {
      ...environment,
      status: "connected",
      label: "Supabase connected",
      message: "GPOP can read from the Supabase activity log table.",
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ...environment,
      status: "error",
      label: "Supabase unavailable",
      message:
        error?.message ||
        "Could not connect to Supabase. GPOP will continue using localStorage fallback.",
      checkedAt: new Date().toISOString(),
    };
  }
}
