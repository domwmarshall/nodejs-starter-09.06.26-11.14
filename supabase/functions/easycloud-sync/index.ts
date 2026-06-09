// GPOP v6.3.6 EasyLog Cloud / EasyCloud sync foundation with battery-health fallback/detail sync.
// Deploy with: supabase functions deploy easycloud-sync
// Required secrets: EASYCLOUD_API_TOKEN, EASYCLOUD_USER_GUID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Optional secret: EASYCLOUD_BASE_URL=https://apiwww.easylogcloud.com

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_BASE_URL = "https://apiwww.easylogcloud.com";

type EasyLogCurrentReadings = {
  channels?: Array<string | number> | null;
  datetime?: string;
  received?: string;
  timeZone?: string;
  timeZoneOffset?: number;
};

type EasyLogDevice = {
  GUID?: string;
  MACAddress?: string;
  MACaddress?: string;
  name?: string;
  type?: string;
  locationGUID?: string;
  RSSI?: number;
  batteryLevel?: number;
  BatteryLevel?: number;
  permanentlyPowered?: boolean;
  PermanentlyPowered?: boolean;
  currentConnectionMethod?: number;
  CurrentConnectionMethod?: number;
  deviceDetailsEndpoint?: string;
  inAlarm?: number;
  connectionLost?: boolean;
  archived?: boolean;
  currentReadings?: EasyLogCurrentReadings;
  lastCommunication?: string;
  lastReadingsReceived?: string;
  firmwareVersion?: string;
  timeZone?: string;
  timeZoneOffset?: number;
  channels?: unknown[];
  probes?: unknown[];
};

type RegisteredFridgeDevice = {
  id: string;
  name: string;
  external_device_id: string;
  metadata?: Record<string, unknown> | null;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getSecrets() {
  const apiToken = Deno.env.get("EASYCLOUD_API_TOKEN") || Deno.env.get("EASYLOG_API_TOKEN") || "";
  const userGuid = Deno.env.get("EASYCLOUD_USER_GUID") || Deno.env.get("EASYLOG_USER_GUID") || "";
  const baseUrl = Deno.env.get("EASYCLOUD_BASE_URL") || DEFAULT_BASE_URL;
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  return {
    apiToken,
    userGuid,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    supabaseUrl,
    serviceRoleKey,
    ready: Boolean(apiToken && userGuid && supabaseUrl && serviceRoleKey),
    missing: [
      ["EASYCLOUD_API_TOKEN", apiToken],
      ["EASYCLOUD_USER_GUID", userGuid],
      ["SUPABASE_URL", supabaseUrl],
      ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey],
    ].filter(([, value]) => !value).map(([name]) => name),
  };
}

function createAdminClient(secrets: ReturnType<typeof getSecrets>) {
  return createClient(secrets.supabaseUrl, secrets.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function easyLogDateToIso(value?: string | null) {
  if (!value) return null;
  const match = String(value).match(/\/Date\((-?\d+)([+-]\d{4})?\)\//);
  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  const ms = Number(match[1]);
  if (!Number.isFinite(ms) || ms < 0) return null;
  return new Date(ms).toISOString();
}

function parseTemperature(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  if (!text || text === "--" || text.includes("----") || text.toLowerCase().includes("disabled")) return null;
  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractTemperatureFromChannels(channels?: Array<string | number> | null) {
  const list = Array.isArray(channels) ? channels : [];
  const preferred = list.find((channel) => String(channel).includes("°C"));
  return parseTemperature(preferred ?? list[0]);
}

function extractTemperature(device: EasyLogDevice) {
  return extractTemperatureFromChannels(device.currentReadings?.channels);
}

function readNumberField(source: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (value === null || value === undefined || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readBooleanField(source: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "boolean") return value;
    if (String(value).toLowerCase() === "true") return true;
    if (String(value).toLowerCase() === "false") return false;
  }
  return null;
}

function extractBatteryLevel(device: EasyLogDevice) {
  return readNumberField(device as Record<string, unknown>, [
    "batteryLevel",
    "BatteryLevel",
    "battery_level",
    "battery",
    "Battery",
  ]);
}

function describeBatteryLevel(level: number | null, permanentlyPowered: boolean | null) {
  if (level === null) return permanentlyPowered ? "Mains powered" : "Not reported by EasyLog";
  if (level === 0) return "Critical";
  if (level >= 1 && level <= 5) return `${level}/5`;
  if (level === 11) return "Charging";
  if (level === 12) return "Full";
  if (level === 13) return "Battery error";
  if (level === 20) return "Mains disconnected";
  if (level === 21) return "Mains OK";
  return `Code ${level}`;
}

function hasKnownBattery(device: EasyLogDevice | Record<string, unknown> | null | undefined) {
  return extractBatteryLevel(device as EasyLogDevice) !== null;
}

function mergeEasyLogDeviceSummary(summary: EasyLogDevice, detail: EasyLogDevice | null) {
  if (!detail || typeof detail !== "object") return summary;
  return {
    ...summary,
    ...detail,
    GUID: summary.GUID || detail.GUID,
    MACAddress: summary.MACAddress || summary.MACaddress || detail.MACAddress || detail.MACaddress,
    MACaddress: summary.MACaddress || detail.MACaddress || detail.MACAddress,
    name: summary.name || detail.name,
    locationGUID: summary.locationGUID || detail.locationGUID,
    type: summary.type || detail.type,
    currentReadings: summary.currentReadings || detail.currentReadings,
    lastCommunication: summary.lastCommunication || detail.lastCommunication,
    lastReadingsReceived: summary.lastReadingsReceived || detail.lastReadingsReceived,
  };
}

async function tryFetchDeviceDetail(secrets: ReturnType<typeof getSecrets>, sensorGUID: string) {
  if (!sensorGUID) return null;
  try {
    return await easyLogGet(secrets, "Devices.svc", "Device", {
      sensorGUID,
      localTime: true,
    }) as EasyLogDevice;
  } catch {
    return null;
  }
}

async function enrichBatteryHealthFromDeviceDetail(secrets: ReturnType<typeof getSecrets>, devices: EasyLogDevice[]) {
  const enriched = [] as EasyLogDevice[];
  let detailLookupCount = 0;
  let batteryDetailCount = 0;

  for (const device of devices) {
    const sensorGUID = device.GUID || "";
    if (hasKnownBattery(device) || !sensorGUID) {
      enriched.push(device);
      continue;
    }

    const detail = await tryFetchDeviceDetail(secrets, sensorGUID);
    detailLookupCount += 1;
    const merged = mergeEasyLogDeviceSummary(device, detail);
    if (hasKnownBattery(merged)) batteryDetailCount += 1;
    enriched.push(merged);
  }

  return { devices: enriched, detailLookupCount, batteryDetailCount };
}


async function easyLogGet(
  secrets: ReturnType<typeof getSecrets>,
  service: string,
  resource: string,
  params: Record<string, string | number | boolean | null | undefined> = {},
) {
  const url = new URL(`${secrets.baseUrl}/${service}/${resource}`);
  url.searchParams.set("APIToken", secrets.apiToken);
  url.searchParams.set("userGUID", secrets.userGuid);

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const text = await response.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const message = typeof body === "object" && body && "Message" in body
      ? String((body as { Message?: string }).Message)
      : `EasyLog ${service}/${resource} returned HTTP ${response.status}`;
    throw new Error(message);
  }

  if (typeof body === "object" && body && "Message" in body && "ExceptionType" in body) {
    throw new Error(String((body as { Message?: string }).Message || `EasyLog ${service}/${resource} returned an exception.`));
  }

  return body;
}

async function logSync(admin: ReturnType<typeof createAdminClient>, practiceId: string, status: string, detail: string, startedAt: string) {
  await admin.from("integration_sync_log").insert({
    practice_id: practiceId,
    integration_key: "easylog-cloud",
    status,
    detail,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
  });
}

async function upsertDevices(admin: ReturnType<typeof createAdminClient>, practiceId: string, devices: EasyLogDevice[], sourceLabel = "AllDevicesSummary") {
  const mappedDevices = devices
    .filter((device) => device.GUID || device.MACAddress || device.MACaddress)
    .map((device) => {
      const temperature = extractTemperature(device);
      const readingAt = easyLogDateToIso(device.currentReadings?.datetime);
      const receivedAt = easyLogDateToIso(device.currentReadings?.received);
      const fallbackLastSeen = easyLogDateToIso(device.lastCommunication) || easyLogDateToIso(device.lastReadingsReceived) || receivedAt || readingAt;
      const batteryLevel = extractBatteryLevel(device);
      const permanentlyPowered = readBooleanField(device as Record<string, unknown>, ["permanentlyPowered", "PermanentlyPowered", "permanently_powered"]);
      const currentConnectionMethod = readNumberField(device as Record<string, unknown>, ["currentConnectionMethod", "CurrentConnectionMethod", "current_connection_method"]);
      return {
        practice_id: practiceId,
        name: device.name || device.MACAddress || device.GUID || "EasyLog device",
        location: device.locationGUID || "EasyLog Cloud",
        external_device_id: device.GUID || device.MACAddress || device.MACaddress,
        external_mac_address: device.MACAddress || device.MACaddress || null,
        external_location_guid: device.locationGUID || null,
        device_type: device.type || null,
        current_temperature: temperature,
        current_reading_at: readingAt,
        last_communication_at: fallbackLastSeen,
        last_synced_at: new Date().toISOString(),
        rssi: device.RSSI ?? null,
        battery_level: batteryLevel,
        connection_lost: Boolean(device.connectionLost),
        in_alarm: Number(device.inAlarm || 0),
        sync_status: "synced",
        active: !device.archived,
        metadata: {
          source: sourceLabel,
          firmwareVersion: device.firmwareVersion || null,
          timeZone: device.timeZone || device.currentReadings?.timeZone || null,
          timeZoneOffset: device.timeZoneOffset ?? device.currentReadings?.timeZoneOffset ?? null,
          batteryLevel,
          batteryLabel: describeBatteryLevel(batteryLevel, permanentlyPowered),
          permanentlyPowered,
          currentConnectionMethod,
          deviceDetailsEndpoint: device.deviceDetailsEndpoint || null,
          rawCurrentChannels: device.currentReadings?.channels || [],
          channels: device.channels || [],
          probes: device.probes || [],
          rawDeviceSummary: device,
        },
        updated_at: new Date().toISOString(),
      };
    });

  if (!mappedDevices.length) return { deviceCount: 0, readingCount: 0 };

  const { data: savedDevices, error: deviceError } = await admin
    .from("fridge_devices")
    .upsert(mappedDevices, { onConflict: "practice_id,external_device_id" })
    .select("id, external_device_id, current_temperature, current_reading_at");

  if (deviceError) throw new Error(`Fridge device upsert failed: ${deviceError.message}`);

  const readings = (savedDevices || [])
    .filter((device) => device.current_temperature !== null && device.current_reading_at)
    .map((device) => ({
      practice_id: practiceId,
      device_id: device.id,
      reading_at: device.current_reading_at,
      temperature: device.current_temperature,
      source: "easylog-current",
      raw_payload: {
        external_device_id: device.external_device_id,
        synced_at: new Date().toISOString(),
      },
    }));

  if (readings.length) {
    const { error: readingError } = await admin
      .from("fridge_readings")
      .upsert(readings, { onConflict: "practice_id,device_id,reading_at,source" });
    if (readingError) throw new Error(`Fridge reading upsert failed: ${readingError.message}`);
  }

  return { deviceCount: savedDevices?.length || mappedDevices.length, readingCount: readings.length };
}

async function syncDevices(secrets: ReturnType<typeof getSecrets>, admin: ReturnType<typeof createAdminClient>, practiceId: string) {
  const devices = await easyLogGet(secrets, "Devices.svc", "AllDevicesSummary", {
    includeArchived: false,
    localTime: true,
  }) as EasyLogDevice[];

  const list = Array.isArray(devices) ? devices : [];
  const enrichment = await enrichBatteryHealthFromDeviceDetail(secrets, list);
  const counts = await upsertDevices(admin, practiceId, enrichment.devices, "AllDevicesSummary");
  return { ...counts, rawDeviceCount: list.length, detailLookupCount: enrichment.detailLookupCount, batteryDetailCount: enrichment.batteryDetailCount };
}

async function syncCurrentReadings(secrets: ReturnType<typeof getSecrets>, admin: ReturnType<typeof createAdminClient>, practiceId: string) {
  const { data: existingDevices, error: existingError } = await admin
    .from("fridge_devices")
    .select("id, name, external_device_id, battery_level, rssi, metadata")
    .eq("practice_id", practiceId)
    .not("external_device_id", "is", null);

  if (existingError) throw new Error(`Could not load EasyLog device register: ${existingError.message}`);

  let devices = (existingDevices || []) as RegisteredFridgeDevice[];

  if (!devices.length) {
    await syncDevices(secrets, admin, practiceId);
    const { data: seededDevices, error: seededError } = await admin
      .from("fridge_devices")
      .select("id, name, external_device_id, battery_level, rssi, metadata")
      .eq("practice_id", practiceId)
      .not("external_device_id", "is", null);
    if (seededError) throw new Error(`Could not load EasyLog device register after device sync: ${seededError.message}`);
    devices = (seededDevices || []) as RegisteredFridgeDevice[];
  }

  const readingsToUpsert = [] as Array<Record<string, unknown>>;
  let deviceUpdateCount = 0;
  let noReadingCount = 0;
  let batteryUpdateCount = 0;

  for (const device of devices) {
    const current = await easyLogGet(secrets, "Devices.svc", "CurrentReadings", {
      sensorGUID: device.external_device_id,
      localTime: true,
    }) as EasyLogCurrentReadings;

    const temperature = extractTemperatureFromChannels(current?.channels);
    const readingAt = easyLogDateToIso(current?.datetime);
    const receivedAt = easyLogDateToIso(current?.received);
    const existingMetadata = device.metadata && typeof device.metadata === "object" ? device.metadata : {};

    const { error: updateError } = await admin
      .from("fridge_devices")
      .update({
        current_temperature: temperature,
        current_reading_at: readingAt,
        last_communication_at: receivedAt || readingAt,
        last_synced_at: new Date().toISOString(),
        sync_status: temperature === null ? "synced-no-current-reading" : "synced",
        metadata: {
          ...existingMetadata,
          source: "CurrentReadings",
          latestCurrentReading: current?.channels?.[0] ?? null,
          rawCurrentChannels: current?.channels || [],
          currentReadings: current || null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("practice_id", practiceId)
      .eq("id", device.id);

    if (updateError) throw new Error(`Could not update current reading for ${device.name}: ${updateError.message}`);

    deviceUpdateCount += 1;

    if (batteryLevel !== null) batteryUpdateCount += 1;

    if (temperature !== null && readingAt) {
      readingsToUpsert.push({
        practice_id: practiceId,
        device_id: device.id,
        reading_at: readingAt,
        received_at: receivedAt,
        temperature,
        source: "easylog-current-readings-endpoint",
        raw_payload: current || {},
      });
    } else {
      noReadingCount += 1;
    }
  }

  if (readingsToUpsert.length) {
    const { error: readingError } = await admin
      .from("fridge_readings")
      .upsert(readingsToUpsert, { onConflict: "practice_id,device_id,reading_at,source" });
    if (readingError) throw new Error(`Fridge reading upsert failed: ${readingError.message}`);
  }

  return {
    deviceCount: deviceUpdateCount,
    readingCount: readingsToUpsert.length,
    noReadingCount,
    batteryUpdateCount,
  };
}

async function syncAlarms(secrets: ReturnType<typeof getSecrets>, admin: ReturnType<typeof createAdminClient>, practiceId: string) {
  const devices = await easyLogGet(secrets, "Users.svc", "DevicesInAlarm", {
    localTime: true,
  }) as EasyLogDevice[];

  const list = Array.isArray(devices) ? devices : [];
  if (!list.length) return { alarmCount: 0, message: "No EasyLog devices are currently in alarm." };

  await upsertDevices(admin, practiceId, list, "DevicesInAlarm");

  const { data: mappedDevices, error: mappedError } = await admin
    .from("fridge_devices")
    .select("id, external_device_id, name")
    .eq("practice_id", practiceId)
    .in("external_device_id", list.map((device) => device.GUID || device.MACAddress || device.MACaddress).filter(Boolean));

  if (mappedError) throw new Error(`Could not map alarm devices: ${mappedError.message}`);

  const rows = list.map((device) => {
    const externalId = device.GUID || device.MACAddress || device.MACaddress || "unknown";
    const mapped = (mappedDevices || []).find((candidate) => candidate.external_device_id === externalId);
    return {
      practice_id: practiceId,
      device_id: mapped?.id || null,
      severity: Number(device.inAlarm || 0) > 1 ? "High" : "Medium",
      status: "open",
      title: `EasyLog alarm: ${device.name || externalId}`,
      detail: `EasyLog reports alarm state ${device.inAlarm ?? "unknown"}${device.connectionLost ? " and connection lost" : ""}.`,
      external_event_id: `easylog-alarm-${externalId}-${device.inAlarm || "alarm"}`,
      raw_payload: device,
      created_at: new Date().toISOString(),
    };
  });

  const { error: alertError } = await admin
    .from("fridge_alerts")
    .upsert(rows, { onConflict: "practice_id,external_event_id" });

  if (alertError) throw new Error(`Alarm upsert failed: ${alertError.message}`);

  return { alarmCount: rows.length };
}


async function runCronRefreshForPractice(secrets: ReturnType<typeof getSecrets>, admin: ReturnType<typeof createAdminClient>, practiceId: string) {
  const startedAt = new Date().toISOString();

  try {
    const deviceCounts = await syncDevices(secrets, admin, practiceId);
    const readingCounts = await syncCurrentReadings(secrets, admin, practiceId);
    const alarmCounts = await syncAlarms(secrets, admin, practiceId);
    const detail = `EasyLog background cron refresh completed: ${deviceCounts.deviceCount} device(s), ${readingCounts.readingCount} current reading(s), ${readingCounts.noReadingCount} device(s) without current reading, ${readingCounts.batteryUpdateCount || 0} battery/health update(s), ${alarmCounts.alarmCount || 0} alarm(s).`;

    await logSync(admin, practiceId, "success", detail, startedAt);

    return {
      ok: true,
      practiceId,
      deviceCount: deviceCounts.deviceCount,
      readingCount: readingCounts.readingCount,
      noReadingCount: readingCounts.noReadingCount,
      batteryUpdateCount: readingCounts.batteryUpdateCount || 0,
      alarmCount: alarmCounts.alarmCount || 0,
      message: detail,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logSync(admin, practiceId, "error", `EasyLog background cron refresh failed: ${message}`, startedAt);
    return {
      ok: false,
      practiceId,
      message,
    };
  }
}

async function getCronPracticeIds(admin: ReturnType<typeof createAdminClient>, requestedPracticeId?: string) {
  if (requestedPracticeId) {
    return [{ id: requestedPracticeId, name: "Current practice" }];
  }

  const { data, error } = await admin
    .from("practices")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw new Error(`Could not load practices for background EasyLog sync: ${error.message}`);
  return data || [];
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startedAt = new Date().toISOString();
  const secrets = getSecrets();

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action = String(body.action || "diagnostics");
  const practiceId = String(body.practiceId || "");

  if (!secrets.ready) {
    return jsonResponse({
      ok: false,
      action,
      message: `EasyLog Edge Function secrets are incomplete: ${secrets.missing.join(", ")}.`,
      missingSecrets: secrets.missing,
      checkedAt: new Date().toISOString(),
    }, 200);
  }

  const admin = createAdminClient(secrets);

  try {
    if (action === "cron-refresh-all") {
      const practices = await getCronPracticeIds(admin);
      if (!practices.length) {
        return jsonResponse({
          ok: false,
          action,
          message: "No practices were found for background EasyLog sync.",
          checkedAt: new Date().toISOString(),
        }, 200);
      }

      const results = [];
      for (const practice of practices) {
        results.push(await runCronRefreshForPractice(secrets, admin, practice.id));
      }

      const successCount = results.filter((result) => result.ok).length;
      return jsonResponse({
        ok: successCount === results.length,
        action,
        message: `EasyLog background sync completed for ${successCount}/${results.length} practice(s).`,
        practiceCount: practices.length,
        successCount,
        errorCount: results.length - successCount,
        results,
        checkedAt: new Date().toISOString(),
      });
    }

    if (action === "cron-refresh") {
      if (!practiceId) {
        return jsonResponse({
          ok: false,
          action,
          message: "practiceId is required for cron-refresh.",
          checkedAt: new Date().toISOString(),
        }, 400);
      }

      const result = await runCronRefreshForPractice(secrets, admin, practiceId);
      return jsonResponse({
        action,
        checkedAt: new Date().toISOString(),
        ...result,
      });
    }

    if (!practiceId) {
      return jsonResponse({
        ok: false,
        action,
        message: "practiceId is required.",
        checkedAt: new Date().toISOString(),
      }, 400);
    }

    if (action === "diagnostics") {
      const accountSummary = await easyLogGet(secrets, "Users.svc", "AccountSummary");
      await logSync(admin, practiceId, "success", "EasyLog diagnostics completed.", startedAt);
      return jsonResponse({
        ok: true,
        action,
        message: "EasyLog credentials and AccountSummary endpoint responded.",
        accountSummary,
        checkedAt: new Date().toISOString(),
      });
    }

    if (action === "sync-devices") {
      const counts = await syncDevices(secrets, admin, practiceId);
      await logSync(admin, practiceId, "success", `EasyLog device sync completed: ${counts.deviceCount} devices, ${counts.readingCount} summary readings.`, startedAt);
      return jsonResponse({
        ok: true,
        action,
        message: `EasyLog device sync completed: ${counts.deviceCount} devices and ${counts.readingCount} summary readings synced.`,
        ...counts,
        checkedAt: new Date().toISOString(),
      });
    }

    if (action === "sync-current-readings") {
      const counts = await syncCurrentReadings(secrets, admin, practiceId);
      await logSync(admin, practiceId, "success", `EasyLog current reading sync completed: ${counts.deviceCount} devices checked, ${counts.readingCount} readings, ${counts.noReadingCount} without current reading, ${counts.batteryUpdateCount || 0} battery/health update(s).`, startedAt);
      return jsonResponse({
        ok: true,
        action,
        message: `EasyLog current reading sync completed: ${counts.deviceCount} devices checked, ${counts.readingCount} current reading(s) saved, ${counts.noReadingCount} device(s) returned no temperature reading, ${counts.batteryUpdateCount || 0} battery/health update(s).`,
        ...counts,
        checkedAt: new Date().toISOString(),
      });
    }

    if (action === "sync-alarms") {
      const counts = await syncAlarms(secrets, admin, practiceId);
      await logSync(admin, practiceId, "success", `EasyLog alarm sync completed: ${counts.alarmCount} alarms.`, startedAt);
      return jsonResponse({
        ok: true,
        action,
        message: counts.message || `EasyLog alarm sync completed: ${counts.alarmCount} alarm(s) synced.`,
        ...counts,
        checkedAt: new Date().toISOString(),
      });
    }

    return jsonResponse({
      ok: false,
      action,
      message: `Unknown EasyLog action: ${action}`,
      checkedAt: new Date().toISOString(),
    }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logSync(admin, practiceId, "error", message, startedAt);
    return jsonResponse({
      ok: false,
      action,
      message,
      checkedAt: new Date().toISOString(),
    }, 200);
  }
});
