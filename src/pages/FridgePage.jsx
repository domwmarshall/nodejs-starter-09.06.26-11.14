import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Database,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Thermometer,
  WifiOff,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "../components/Badge";
import { DataTable } from "../components/DataTable";
import { SectionHeader } from "../components/SectionHeader";
import { AlertBanner, Button, PageHeader, Panel } from "../components/ui";
import {
  easyCloudIntegrationStatus,
  getEasyCloudFrontendSafetySummary,
  getEasyLogBatteryStatus,
  getEasyLogDeviceStatus,
  getFridgeSnapshotFromSupabase,
  runEasyCloudBackgroundRefresh,
  runEasyCloudDiagnostics,
  syncEasyCloudAlarms,
  syncEasyCloudCurrentReadings,
  syncEasyCloudDevices,
} from "../services/easyCloudAdapterService";

function formatDateTime(value) {
  if (!value) return "Not known";
  try {
    return new Date(value).toLocaleString("en-GB", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function getStatusBadge(status) {
  const label = String(status || "").toLowerCase();
  if (label.includes("range") || label.includes("ok") || label.includes("safe")) return "success";
  if (label.includes("alarm") || label.includes("lost") || label.includes("out")) return "danger";
  return "neutral";
}


function formatChartTime(value) {
  if (!value) return "Unknown";
  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function roundToMinuteIso(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setSeconds(0, 0);
  return date.toISOString();
}

function safeSeriesKey(value) {
  return `device_${String(value || "unknown").replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

function buildTemperatureChart(readings = [], devices = []) {
  const deviceLookup = new Map(
    devices.map((device) => [
      device.id,
      {
        key: safeSeriesKey(device.id || device.external_device_id || device.name),
        label: device.name || device.external_mac_address || "Fridge",
      },
    ])
  );

  const grouped = new Map();
  const seriesMap = new Map();
  const validReadings = readings
    .map((reading) => {
      const temperature = Number(reading.temperature ?? reading.value ?? reading.current_temperature);
      const readingAt = reading.reading_at || reading.readingAt || reading.created_at;
      const bucket = roundToMinuteIso(readingAt);
      if (!bucket || !Number.isFinite(temperature)) return null;
      const deviceInfo = deviceLookup.get(reading.device_id) || {
        key: safeSeriesKey(reading.device_id || reading.fridge_device_id || reading.device_name || "unknown"),
        label: reading.device_name || "Fridge",
      };
      seriesMap.set(deviceInfo.key, deviceInfo.label);
      return { bucket, readingAt, temperature, deviceInfo };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.bucket) - new Date(b.bucket));

  validReadings.forEach((reading) => {
    const existing = grouped.get(reading.bucket) || {
      bucket: reading.bucket,
      timeLabel: formatChartTime(reading.bucket),
    };
    existing[reading.deviceInfo.key] = reading.temperature;
    grouped.set(reading.bucket, existing);
  });

  const data = Array.from(grouped.values()).sort((a, b) => new Date(a.bucket) - new Date(b.bucket));
  const series = Array.from(seriesMap.entries()).map(([key, label]) => ({ key, label }));
  const temperatures = validReadings.map((reading) => reading.temperature);
  const min = temperatures.length ? Math.min(2, ...temperatures) : 2;
  const max = temperatures.length ? Math.max(8, ...temperatures) : 8;

  return {
    data,
    series,
    yDomain: [Math.floor(min - 1), Math.ceil(max + 1)],
  };
}

function TemperatureHistoryChart({ readings, devices }) {
  const chart = useMemo(() => buildTemperatureChart(readings, devices), [readings, devices]);

  if (!chart.data.length) {
    return (
      <div className="empty-state-inline easylog-chart-empty">
        <Thermometer size={22} />
        <strong>No temperature history yet.</strong>
        <span>Run Sync current readings a few times, or leave auto-refresh running while the page is open.</span>
      </div>
    );
  }

  return (
    <div className="easylog-chart-shell">
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={chart.data} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="timeLabel" minTickGap={28} />
          <YAxis domain={chart.yDomain} unit="°C" width={44} />
          <Tooltip formatter={(value, name) => [`${Number(value).toFixed(1)}°C`, name]} />
          <Legend />
          <ReferenceArea y1={2} y2={8} label="2–8°C safe range" />
          {chart.series.map((series) => (
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.label}
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DeviceCard({ device }) {
  const status = getEasyLogDeviceStatus(device);
  const battery = getEasyLogBatteryStatus(device);
  const temperature = status.temperature;
  const lastSeen = device.last_communication_at || device.lastCommunication || device.last_synced_at || device.lastSyncedAt;

  return (
    <article className="easylog-device-card">
      <div className="easylog-device-card-header">
        <div>
          <span className="eyebrow">{device.type || device.device_type || device.fridge_type || "Fridge device"}</span>
          <h3>{device.name}</h3>
          <p>{device.location || "Location not mapped"}</p>
        </div>
        <Badge tone={getStatusBadge(status.label)}>{status.label}</Badge>
      </div>

      <div className={`easylog-temp-display ${temperature === null ? "easylog-temp-display--empty" : ""}`}>
        <Thermometer size={22} />
        <strong>{temperature === null ? "No reading" : `${temperature.toFixed(1)}°C`}</strong>
        <span>{temperature === null ? "Click Sync current readings" : status.safeBand}</span>
      </div>

      <dl className="easylog-device-meta">
        <div>
          <dt>EasyLog device</dt>
          <dd>{device.external_device_id || device.easyCloudDeviceId || "Not mapped"}</dd>
        </div>
        <div>
          <dt>MAC</dt>
          <dd>{device.external_mac_address || device.mac_address || "Not known"}</dd>
        </div>
        <div className="easylog-battery-meta">
          <dt>Battery</dt>
          <dd>
            <span className={`easylog-battery-pill easylog-battery-pill--${battery.tone}`}>{battery.label}</span>
            <small>{battery.detail}</small>
          </dd>
        </div>
        <div>
          <dt>Last seen</dt>
          <dd>{formatDateTime(lastSeen)}</dd>
        </div>
      </dl>
    </article>
  );
}

export function FridgePage({ currentUser }) {
  const [snapshot, setSnapshot] = useState({ ok: false, devices: [], readings: [], alerts: [], syncLog: [] });
  const [busyAction, setBusyAction] = useState("");
  const [actionResult, setActionResult] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [autoRefreshMinutes, setAutoRefreshMinutes] = useState(5);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [lastAutoRefresh, setLastAutoRefresh] = useState(null);
  const [autoRefreshMessage, setAutoRefreshMessage] = useState("Auto-refresh is on while this page is open.");
  const autoRefreshInFlightRef = useRef(false);

  const safetySummary = getEasyCloudFrontendSafetySummary();

  async function refreshSnapshot() {
    const result = await getFridgeSnapshotFromSupabase(currentUser);
    setSnapshot(result);
  }

  useEffect(() => {
    void refreshSnapshot();
  }, []);

  async function runAutoRefreshCycle() {
    if (autoRefreshInFlightRef.current || busyAction) return;
    autoRefreshInFlightRef.current = true;
    setAutoRefreshing(true);

    try {
      const backgroundResult = await runEasyCloudBackgroundRefresh(currentUser);
      await refreshSnapshot();
      setLastAutoRefresh(new Date().toISOString());
      setAutoRefreshMessage(
        backgroundResult.ok
          ? `${backgroundResult.readingCount ?? 0} reading(s) refreshed, ${backgroundResult.batteryUpdateCount ?? 0} battery/health update(s), ${backgroundResult.alarmCount ?? 0} alarm(s) checked.`
          : backgroundResult.message || "Auto-refresh could not complete."
      );
    } catch (error) {
      setAutoRefreshMessage(error instanceof Error ? error.message : "Auto-refresh failed.");
    } finally {
      autoRefreshInFlightRef.current = false;
      setAutoRefreshing(false);
    }
  }

  useEffect(() => {
    if (!autoRefreshEnabled) return undefined;
    const intervalMs = Math.max(1, Number(autoRefreshMinutes || 5)) * 60 * 1000;
    const timer = window.setInterval(() => {
      void runAutoRefreshCycle();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [autoRefreshEnabled, autoRefreshMinutes, currentUser, busyAction]);

  async function runAction(label, handler) {
    setBusyAction(label);
    setActionResult(null);
    const result = await handler(currentUser);
    setActionResult(result);
    await refreshSnapshot();
    setBusyAction("");
  }

  const deviceCards = snapshot.devices || [];
  const liveDevices = deviceCards.filter((device) => getEasyLogDeviceStatus(device).label === "In range").length;
  const reviewDevices = deviceCards.length - liveDevices;

  const alertRows = useMemo(
    () => (snapshot.alerts || []).map((alert) => ({
      ...alert,
      created: formatDateTime(alert.created_at || alert.createdAt),
      status: alert.status || "Open",
    })),
    [snapshot.alerts]
  );

  const syncRows = useMemo(
    () => (snapshot.syncLog || []).map((row) => ({
      ...row,
      started: formatDateTime(row.started_at),
      completed: formatDateTime(row.completed_at),
    })),
    [snapshot.syncLog]
  );

  return (
    <>
      <PageHeader
        eyebrow="Fridge monitoring"
        title="EasyLog Cloud integration"
        action={
          <Button
            variant="secondary"
            leftIcon={RefreshCw}
            onClick={refreshSnapshot}
            disabled={Boolean(busyAction)}
          >
            Refresh snapshot
          </Button>
        }
      >
        Sync EasyLog Cloud devices, current readings and alarms through Supabase Edge Functions. API secrets stay server-side.
      </PageHeader>

      <AlertBanner
        tone="info"
        icon={ShieldCheck}
        title="No EasyLog secrets in the browser"
      >
        {safetySummary.message} Store the EasyLog API token and user GUID as Supabase Edge Function secrets only.
      </AlertBanner>

      {actionResult ? (
        <AlertBanner
          tone={actionResult.ok ? "success" : "warning"}
          icon={actionResult.ok ? CheckCircle2 : AlertTriangle}
          title={actionResult.ok ? "EasyLog action completed" : "EasyLog action needs attention"}
        >
          {actionResult.message || actionResult.detail || "No message returned."}
        </AlertBanner>
      ) : null}

      <section className="easylog-command-grid">
        <Panel className="easylog-command-card">
          <SectionHeader
            eyebrow="v6.3 integration foundation"
            title="Connection controls"
          >
            These buttons call the deployed Supabase Edge Function. They will show a helpful error until the function is deployed and secrets are set.
          </SectionHeader>

          <div className="easylog-action-row">
            <Button
              variant="primary"
              leftIcon={Cloud}
              isLoading={busyAction === "diagnostics"}
              onClick={() => runAction("diagnostics", runEasyCloudDiagnostics)}
            >
              Run EasyLog diagnostics
            </Button>
            <Button
              variant="secondary"
              leftIcon={Database}
              isLoading={busyAction === "sync-devices"}
              onClick={() => runAction("sync-devices", syncEasyCloudDevices)}
            >
              Sync devices
            </Button>
            <Button
              variant="secondary"
              leftIcon={Thermometer}
              isLoading={busyAction === "sync-readings"}
              onClick={() => runAction("sync-readings", syncEasyCloudCurrentReadings)}
            >
              Sync current readings
            </Button>
            <Button
              variant="secondary"
              leftIcon={AlertTriangle}
              isLoading={busyAction === "sync-alarms"}
              onClick={() => runAction("sync-alarms", syncEasyCloudAlarms)}
            >
              Sync alarms
            </Button>
            <Button
              variant="secondary"
              leftIcon={RefreshCw}
              isLoading={busyAction === "cron-refresh"}
              onClick={() => runAction("cron-refresh", runEasyCloudBackgroundRefresh)}
            >
              Test background cycle
            </Button>
          </div>

          <div className="easylog-background-sync-card">
            <div>
              <span className="eyebrow">Server background sync</span>
              <strong>Cron-ready EasyLog refresh</strong>
              <p>
                Create a Supabase Cron Job that invokes <code>easycloud-sync</code> with <code>{'{"action":"cron-refresh-all"}'}</code>.
                The job can run even when nobody has GPOP open. A 5-minute cadence is usually sensible for live fridge oversight. Device sync also refreshes EasyLog battery/connection status.
              </p>
            </div>
            <div className="easylog-cron-checklist">
              <span>1. Deploy updated Edge Function</span>
              <span>2. Create Supabase Cron Job</span>
              <span>3. Watch Sync log for background entries</span>
            </div>
          </div>

          <div className="easylog-auto-refresh-card">
            <div>
              <span className="eyebrow">Auto refresh</span>
              <strong>{autoRefreshEnabled ? "Live while page is open" : "Paused"}</strong>
              <p>
                {autoRefreshing ? "Refreshing EasyLog readings, device health and alarms now…" : autoRefreshMessage}
                {lastAutoRefresh ? ` Last run ${formatDateTime(lastAutoRefresh)}.` : ""}
              </p>
            </div>
            <div className="easylog-auto-refresh-controls">
              {[1, 5, 15].map((minutes) => (
                <button
                  type="button"
                  key={minutes}
                  className={autoRefreshMinutes === minutes ? "is-selected" : ""}
                  onClick={() => setAutoRefreshMinutes(minutes)}
                >
                  {minutes} min
                </button>
              ))}
              <button
                type="button"
                className={autoRefreshEnabled ? "is-selected" : ""}
                onClick={() => setAutoRefreshEnabled((value) => !value)}
              >
                {autoRefreshEnabled ? "On" : "Off"}
              </button>
            </div>
          </div>

          <div className="easylog-secret-grid">
            <div>
              <KeyRound size={18} />
              <strong>Required Supabase secrets</strong>
              <span>{easyCloudIntegrationStatus.requiredSecrets.join(" · ")}</span>
            </div>
            <div>
              <Cloud size={18} />
              <strong>Edge Function</strong>
              <span>{easyCloudIntegrationStatus.requiredFunctions.join(" · ")}</span>
            </div>
          </div>
        </Panel>

        <Panel className="easylog-summary-card">
          <span className="eyebrow">Current GPOP fridge snapshot</span>
          <div className="easylog-big-number-row">
            <div>
              <strong>{deviceCards.length}</strong>
              <span>devices</span>
            </div>
            <div>
              <strong>{liveDevices}</strong>
              <span>in range</span>
            </div>
            <div>
              <strong>{reviewDevices}</strong>
              <span>review</span>
            </div>
          </div>
          <p>{snapshot.message || "No Supabase snapshot loaded yet."}</p>
        </Panel>
      </section>

      <Panel>
        <SectionHeader eyebrow="Device register" title="Fridges and mapped EasyLog devices">
          EasyLog sync will upsert devices into the Supabase fridge register, keeping manual fallback available.
        </SectionHeader>

        {deviceCards.length ? (
          <div className="easylog-device-grid">
            {deviceCards.map((device) => (
              <DeviceCard key={device.id || device.external_device_id || device.name} device={device} />
            ))}
          </div>
        ) : (
          <div className="empty-state-inline">
            <WifiOff size={22} />
            <strong>No fridge devices found yet.</strong>
            <span>Sync devices from EasyLog Cloud or continue with manual fridge checks until the API is live.</span>
          </div>
        )}
      </Panel>

      <Panel className="easylog-chart-panel">
        <SectionHeader eyebrow="Temperature history" title="EasyLog temperature trend">
          Plots synced fridge readings from Supabase using Recharts. The shaded band marks the expected 2–8°C vaccine fridge range.
        </SectionHeader>
        <TemperatureHistoryChart readings={snapshot.readings || []} devices={deviceCards} />
      </Panel>

      <section className="easylog-data-grid">
        <Panel>
          <SectionHeader eyebrow="Alerts" title="EasyLog / fridge alerts" />
          <DataTable
            columns={[
              { key: "title", label: "Alert" },
              { key: "severity", label: "Severity" },
              { key: "status", label: "Status" },
              { key: "created", label: "Created" },
            ]}
            rows={alertRows}
            emptyMessage="No alerts synced yet."
          />
        </Panel>

        <Panel>
          <SectionHeader eyebrow="Sync log" title="Integration sync history" />
          <DataTable
            columns={[
              { key: "status", label: "Status" },
              { key: "detail", label: "Detail" },
              { key: "started", label: "Started" },
              { key: "completed", label: "Completed" },
            ]}
            rows={syncRows}
            emptyMessage="No sync log entries yet."
          />
        </Panel>
      </section>
    </>
  );
}
