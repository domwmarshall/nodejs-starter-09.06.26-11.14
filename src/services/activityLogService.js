import { readStorage, writeStorage } from "./storageService";
import {
  ACTIVITY_LOG_TABLE,
  getSupabaseConnectionStatus,
  isSupabaseConfigured,
  supabase,
} from "./supabaseClient";

export const ACTIVITY_LOG_STORAGE_KEY = "gpop-activity-log";

function createLocalId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normaliseActivityEvent(event = {}) {
  const now = new Date().toISOString();

  return {
    id: event.id || createLocalId(),
    practice_id: event.practiceId || event.practice_id || "demo-practice",
    event_type: event.eventType || event.event_type || "general_event",
    module: event.module || "General",
    title: event.title || "GPOP activity",
    detail: event.detail || "",
    actor_name: event.actorName || event.actor_name || "Workspace user",
    actor_role: event.actorRole || event.actor_role || "Unknown role",
    metadata: event.metadata || {},
    created_at: event.createdAt || event.created_at || now,
    storage_mode: event.storageMode || event.storage_mode || "localStorage",
  };
}

function getLocalActivityLog() {
  return readStorage(ACTIVITY_LOG_STORAGE_KEY, []);
}

function saveLocalActivityLog(events) {
  return writeStorage(ACTIVITY_LOG_STORAGE_KEY, events.slice(0, 100));
}

export function getActivityLogStorageKey() {
  return ACTIVITY_LOG_STORAGE_KEY;
}

export async function logActivity(event) {
  const normalisedEvent = normaliseActivityEvent(event);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from(ACTIVITY_LOG_TABLE)
        .insert({
          practice_id: normalisedEvent.practice_id,
          event_type: normalisedEvent.event_type,
          module: normalisedEvent.module,
          title: normalisedEvent.title,
          detail: normalisedEvent.detail,
          actor_name: normalisedEvent.actor_name,
          actor_role: normalisedEvent.actor_role,
          metadata: normalisedEvent.metadata,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          saved: true,
          mode: "supabase",
          event: {
            ...data,
            storage_mode: "Supabase",
          },
        };
      }

      console.warn("Supabase activity log insert failed", error);
    } catch (error) {
      console.warn("Supabase activity log insert threw an error", error);
    }
  }

  const localEvents = getLocalActivityLog();
  const fallbackEvent = {
    ...normalisedEvent,
    storage_mode: "localStorage fallback",
  };

  saveLocalActivityLog([fallbackEvent, ...localEvents]);

  return {
    saved: true,
    mode: "localStorage",
    event: fallbackEvent,
  };
}

export async function fetchActivityLog(limit = 30) {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from(ACTIVITY_LOG_TABLE)
        .select("id, practice_id, event_type, module, title, detail, actor_name, actor_role, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && Array.isArray(data)) {
        return data.map((event) => ({
          ...event,
          storage_mode: "Supabase",
        }));
      }

      console.warn("Supabase activity log fetch failed", error);
    } catch (error) {
      console.warn("Supabase activity log fetch threw an error", error);
    }
  }

  return getLocalActivityLog().slice(0, limit);
}

export async function createConnectionTestActivity(actor = {}) {
  return logActivity({
    eventType: "database_connection_test",
    module: "Settings",
    title: "Database connection test",
    detail:
      "A test activity was created from GPOP Settings to confirm the activity log adapter is working.",
    actorName: actor.name || "Workspace user",
    actorRole: actor.role || "Unknown role",
    metadata: {
      source: "settings_database_panel",
      connectionStatus: await getSupabaseConnectionStatus(),
    },
  });
}
