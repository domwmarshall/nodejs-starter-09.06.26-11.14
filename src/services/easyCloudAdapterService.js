import { fridgeAlerts as fallbackFridgeAlerts, fridgeDevices as fallbackFridgeDevices, fridgeReadings as fallbackFridgeReadings } from "../data/fridgeDevices";
import { ensurePracticeBackbone } from "./capacityBackboneService";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export const EASYCLOUD_FUNCTION_NAME = "easycloud-sync";
export const EASYCLOUD_SYNC_VERSION = "v6.3.6";

export const easyCloudIntegrationStatus = {
  enabled: true,
  mode: "Supabase Edge Function only",
  credentialLocation: "Supabase Edge Function secrets",
  frontendSecretAllowed: false,
  requiredSecrets: ["EASYCLOUD_API_TOKEN", "EASYCLOUD_USER_GUID"],
  optionalSecrets: ["EASYCLOUD_BASE_URL", "EASYCLOUD_ACCOUNT_GUID"],
  requiredFunctions: [
    "supabase/functions/easycloud-sync",
  ],
  backgroundSync: {
    recommendedCadenceMinutes: 5,
    cronActions: ["cron-refresh", "cron-refresh-all"],
    dashboardRoute: "Supabase → Database → Cron Jobs",
  },
  endpoints: [
    "Users.svc/AccountSummary",
    "Locations.svc/UserLocations",
    "Devices.svc/AllDevicesSummary",
    "Devices.svc/CurrentReadings",
    "Users.svc/DevicesInAlarm",
    "Devices.svc/Readings",
  ],
};

function localFallback(message = "Supabase is not configured. EasyLog sync cannot run from the frontend.") {
  return {
    ok: false,
    mode: "local fallback",
    message,
    checkedAt: new Date().toISOString(),
    devices: fallbackFridgeDevices,
    readings: fallbackFridgeReadings,
    alerts: fallbackFridgeAlerts,
  };
}

function normaliseError(error, fallbackMessage = "EasyLog sync failed") {
  if (!error) return fallbackMessage;
  if (typeof error === "string") return error;
  return error.message || error.error_description || fallbackMessage;
}

export function getEasyCloudFrontendSafetySummary() {
  return {
    safe: true,
    message: "No EasyLog API token is read by the React frontend. Sync requests go via Supabase Edge Function secrets.",
    frontendEnvVars: ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"],
    forbiddenFrontendEnvVars: ["EASYCLOUD_API_TOKEN", "EASYCLOUD_USER_GUID", "EASYLOG_PASSWORD"],
  };
}

export async function runEasyCloudAction(action, options = {}) {
  if (!isSupabaseConfigured() || !supabase) {
    return localFallback("Supabase is not configured, so the EasyLog Edge Function cannot be called.");
  }

  const backbone = await ensurePracticeBackbone({
    actor: options.actor || {},
    role: options.actor?.role || "Practice Manager",
  });

  if (!backbone.ok || !backbone.practice?.id) {
    return {
      ok: false,
      mode: "Supabase",
      message: backbone.message || "Practice membership could not be confirmed before EasyLog sync.",
      checkedAt: new Date().toISOString(),
    };
  }

  const payload = {
    action,
    practiceId: backbone.practice.id,
    practiceName: backbone.practice.name,
    localTime: true,
    includeArchived: false,
    ...options,
  };

  try {
    const { data, error } = await supabase.functions.invoke(EASYCLOUD_FUNCTION_NAME, {
      body: payload,
    });

    if (error) {
      return {
        ok: false,
        mode: "Supabase Edge Function",
        action,
        message: normaliseError(error, `EasyLog ${action} failed. Is the Edge Function deployed?`),
        checkedAt: new Date().toISOString(),
        raw: error,
      };
    }

    return {
      ok: Boolean(data?.ok),
      mode: "Supabase Edge Function",
      action,
      checkedAt: new Date().toISOString(),
      ...data,
    };
  } catch (error) {
    return {
      ok: false,
      mode: "Supabase Edge Function",
      action,
      message: normaliseError(error, `EasyLog ${action} failed. Edge Function may not be deployed yet.`),
      checkedAt: new Date().toISOString(),
    };
  }
}

export async function runEasyCloudDiagnostics(actor) {
  return runEasyCloudAction("diagnostics", { actor });
}

export async function syncEasyCloudDevices(actor) {
  return runEasyCloudAction("sync-devices", { actor });
}

export async function syncEasyCloudCurrentReadings(actor) {
  return runEasyCloudAction("sync-current-readings", { actor });
}

export async function syncEasyCloudAlarms(actor) {
  return runEasyCloudAction("sync-alarms", { actor });
}

export async function runEasyCloudBackgroundRefresh(actor) {
  return runEasyCloudAction("cron-refresh", { actor, triggeredBy: "gpop-manual-background-test" });
}

export async function runEasyCloudBackgroundRefreshAll(actor) {
  return runEasyCloudAction("cron-refresh-all", { actor, triggeredBy: "gpop-manual-background-test" });
}

export async function fetchEasyCloudDevices(actor) {
  return syncEasyCloudDevices(actor);
}

export async function syncEasyCloudReadings(actor) {
  return syncEasyCloudCurrentReadings(actor);
}

export async function getFridgeSnapshotFromSupabase(actor) {
  if (!isSupabaseConfigured() || !supabase) {
    return localFallback();
  }

  const backbone = await ensurePracticeBackbone({
    actor: actor || {},
    role: actor?.role || "Practice Manager",
  });

  if (!backbone.ok || !backbone.practice?.id) {
    return {
      ...localFallback(backbone.message || "Supabase practice membership is not ready."),
      mode: "Supabase fallback",
    };
  }

  const practiceId = backbone.practice.id;
  const [deviceResult, readingResult, alertResult, syncResult] = await Promise.all([
    supabase
      .from("fridge_devices")
      .select("*")
      .eq("practice_id", practiceId)
      .order("name", { ascending: true }),
    supabase
      .from("fridge_readings")
      .select("*")
      .eq("practice_id", practiceId)
      .order("reading_at", { ascending: false })
      .limit(500),
    supabase
      .from("fridge_alerts")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("integration_sync_log")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("integration_key", "easylog-cloud")
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const firstError = deviceResult.error || readingResult.error || alertResult.error || syncResult.error;
  if (firstError) {
    return {
      ...localFallback(firstError.message),
      mode: "Supabase error",
      error: firstError.message,
    };
  }

  return {
    ok: true,
    mode: "Supabase",
    message: `${deviceResult.data?.length || 0} fridge device(s), ${readingResult.data?.length || 0} recent reading(s), ${alertResult.data?.length || 0} alert(s).`,
    practice: backbone.practice,
    devices: deviceResult.data || [],
    readings: readingResult.data || [],
    alerts: alertResult.data || [],
    syncLog: syncResult.data || [],
    checkedAt: new Date().toISOString(),
  };
}

export function parseTemperatureValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  if (!text || text === "--" || text.includes("----") || text.toLowerCase().includes("disabled")) return null;
  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstKnownTemperature(...values) {
  for (const value of values) {
    const parsed = typeof value === "number" ? value : parseTemperatureValue(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function getEasyLogBatteryStatus(device = {}) {
  const metadata = device.metadata || {};
  const rawSummary = metadata.rawDeviceSummary || {};
  const raw = device.battery_level ?? device.batteryLevel ?? metadata.batteryLevel ?? rawSummary.batteryLevel ?? rawSummary.BatteryLevel;
  const level = raw === null || raw === undefined || raw === "" ? null : Number(raw);
  const isKnown = Number.isFinite(level);
  const permanentlyPowered = Boolean(device.permanently_powered ?? device.permanentlyPowered ?? metadata.permanentlyPowered ?? rawSummary.permanentlyPowered);

  if (!isKnown) {
    return {
      known: false,
      level: null,
      label: permanentlyPowered ? "Mains powered" : "Not reported",
      detail: permanentlyPowered ? "EasyLog reports mains power but no battery code." : "EasyLog has not returned a battery code yet. Sync devices/current readings will also refresh device health.",
      tone: "neutral",
    };
  }

  if (level === 0) return { known: true, level, label: "Critical", detail: "Battery critical", tone: "danger" };
  if (level >= 1 && level <= 5) {
    const tone = level <= 2 ? "warning" : "success";
    return { known: true, level, label: `${level}/5`, detail: `EasyLog battery level ${level} of 5`, tone };
  }
  if (level === 11) return { known: true, level, label: "Charging", detail: "Battery charging", tone: "success" };
  if (level === 12) return { known: true, level, label: "Full", detail: "Battery full", tone: "success" };
  if (level === 13) return { known: true, level, label: "Battery error", detail: "EasyLog reports a battery error", tone: "danger" };
  if (level === 20) return { known: true, level, label: "Mains disconnected", detail: "Permanently powered but disconnected", tone: "danger" };
  if (level === 21) return { known: true, level, label: "Mains OK", detail: "Permanently powered and OK", tone: "success" };

  return { known: true, level, label: `Code ${level}`, detail: "Battery code returned by EasyLog", tone: "neutral" };
}

export function getEasyLogDeviceStatus(device = {}) {
  const temperature = firstKnownTemperature(
    device.current_temperature,
    device.currentTemperature,
    device.temperature,
    device.current_reading,
    device.metadata?.latestCurrentReading,
    device.metadata?.rawCurrentChannels?.find?.((channel) => String(channel).includes("°C")),
    device.metadata?.rawCurrentChannels?.[0]
  );

  const targetMin = Number(device.target_min ?? device.targetMin ?? 2);
  const targetMax = Number(device.target_max ?? device.targetMax ?? 8);
  const isTemperatureKnown = temperature !== null;
  const inRange = isTemperatureKnown && temperature >= targetMin && temperature <= targetMax;
  const connectionLost = Boolean(device.connection_lost ?? device.connectionLost);
  const inAlarm = Number(device.in_alarm ?? device.inAlarm ?? 0) > 0 || String(device.alarm_status || "").toLowerCase().includes("alarm");

  let label = "Awaiting reading";
  if (connectionLost) label = "Connection lost";
  else if (inAlarm) label = "In alarm";
  else if (isTemperatureKnown && !inRange) label = "Out of range";
  else if (inRange) label = "In range";

  return {
    label,
    inRange,
    connectionLost,
    inAlarm,
    temperature,
    safeBand: `${targetMin}°C to ${targetMax}°C`,
  };
}
