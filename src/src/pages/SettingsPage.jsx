import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Database,
  Lock,
  ShieldCheck,
  ToggleRight,
  RotateCcw,
  Save,
  Server,
} from "lucide-react";

import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { DataTable } from "../components/DataTable";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

import {
  practiceSettings,
  moduleSettings,
  rolePermissions,
  productionReadinessItems,
  reminderSettings,
} from "../data/settings";

import {
  DEFAULT_APP_CONFIG,
  SETTINGS_STORAGE_KEYS,
  clearAllDemoData,
} from "../services/settingsService";

import {
  createConnectionTestActivity,
  fetchActivityLog,
  logActivity,
} from "../services/activityLogService";
import { getSupabaseConnectionStatus } from "../services/supabaseClient";

import {
  AlertBanner,
  Button,
  PageHeader,
  FormField,
  fieldClassName,
  Panel,
} from "../components/ui";


const permissionColumns = [
  { key: "dashboard", label: "Dashboard" },
  { key: "staff", label: "Staff" },
  { key: "calendar", label: "Calendar" },
  { key: "compliance", label: "Compliance" },
  { key: "training", label: "Training" },
  { key: "audits", label: "Audits" },
  { key: "finance", label: "Finance" },
  { key: "careNavigation", label: "Care nav" },
  { key: "settings", label: "Settings" },
];

function getPermissionClass(value = "") {
  const permission = String(value).toLowerCase();

  if (permission.includes("manage") || permission.includes("approve")) {
    return "permission-pill permission-pill-manage";
  }

  if (permission.includes("no access")) {
    return "permission-pill permission-pill-none";
  }

  if (
    permission.includes("limited") ||
    permission.includes("configure") ||
    permission.includes("own")
  ) {
    return "permission-pill permission-pill-limited";
  }

  return "permission-pill permission-pill-view";
}

export function SettingsPage({
  moduleToggleSettings = moduleSettings,
  setModuleToggleSettings,
  currentUser = { name: "Prototype user", role: "Unknown role" },
}) {
  const [selectedModuleId, setSelectedModuleId] = useState(moduleSettings[0].id);
  const [savedMessage, setSavedMessage] = useState("");

  const [appConfig, setAppConfig] = useLocalStorageState(
    SETTINGS_STORAGE_KEYS.appConfig,
    DEFAULT_APP_CONFIG
  );

  const [databaseStatus, setDatabaseStatus] = useState({
    status: "checking",
    label: "Checking database",
    message: "Checking Supabase connection...",
  });
  const [activityRows, setActivityRows] = useState([]);
  const [databaseBusy, setDatabaseBusy] = useState(false);

  const localModuleSettings = Array.isArray(moduleToggleSettings)
    ? moduleToggleSettings
    : moduleSettings;

  const selectedModule =
    localModuleSettings.find((module) => module.id === selectedModuleId) ||
    localModuleSettings[0] ||
    moduleSettings[0];

  const enabledModules = localModuleSettings.filter((module) => module.enabled);
  const disabledModules = localModuleSettings.filter((module) => !module.enabled);

  const highRiskItems = productionReadinessItems.filter(
    (item) => item.risk === "High"
  );

  function formatActivityDate(value) {
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

  async function refreshDatabasePanel() {
    setDatabaseBusy(true);

    const [status, rows] = await Promise.all([
      getSupabaseConnectionStatus(),
      fetchActivityLog(12),
    ]);

    setDatabaseStatus(status);
    setActivityRows(rows);
    setDatabaseBusy(false);
  }

  useEffect(() => {
    refreshDatabasePanel();
  }, []);

  async function createDatabaseTestLog() {
    setDatabaseBusy(true);
    await createConnectionTestActivity(currentUser);
    await refreshDatabasePanel();
  }

  function updateConfigField(fieldName, value) {
    setAppConfig((currentConfig) => ({
      ...currentConfig,
      [fieldName]: value,
    }));

    setSavedMessage("Changes are saved automatically in this browser.");
  }

  function resetAppConfig() {
    const confirmed = window.confirm(
      "Reset practice profile settings back to the default demo configuration?"
    );

    if (!confirmed) return;

    setAppConfig(DEFAULT_APP_CONFIG);
    setSavedMessage("Practice profile reset to default demo settings.");

    void logActivity({
      eventType: "settings_profile_reset",
      module: "Settings",
      title: "Practice profile reset",
      detail: "Practice profile settings were reset to the default demo configuration.",
      actorName: currentUser.name,
      actorRole: currentUser.role,
    });
  }

  function toggleModule(moduleId) {
    if (typeof setModuleToggleSettings !== "function") {
      alert(
        "Module toggles are not connected to App.jsx yet. Check that SettingsPage is being passed setModuleToggleSettings."
      );
      return;
    }

    const updatedModules = localModuleSettings.map((module) =>
      module.id === moduleId
        ? {
            ...module,
            enabled: !module.enabled,
          }
        : module
    );

    setModuleToggleSettings(updatedModules);

    const changedModule = updatedModules.find((module) => module.id === moduleId);

    void logActivity({
      eventType: "module_toggle_changed",
      module: "Settings",
      title: `${changedModule?.name || moduleId} ${changedModule?.enabled ? "enabled" : "disabled"}`,
      detail: "Module availability was changed in Settings.",
      actorName: currentUser.name,
      actorRole: currentUser.role,
      metadata: {
        moduleId,
        enabled: changedModule?.enabled,
      },
    });
  }

  function resetDemoData() {
    const confirmed = window.confirm(
      "Reset all GPOP demo data? This will clear saved holiday requests, inbox statuses, audit submissions, module toggles, finance task statuses and app profile settings from this browser."
    );

    if (!confirmed) return;

    clearAllDemoData();
    window.location.reload();
  }

  return (
    <>
      <PageHeader eyebrow="Settings" title="Admin settings">
        Practice configuration, module toggles, permissions, reminder rules and
        production readiness checks.
      </PageHeader>

      <section className="metric-grid">
        <MetricCard
          title="Enabled modules"
          value={enabledModules.length}
          detail={`${disabledModules.length} module(s) disabled`}
          icon={ToggleRight}
        />
        <MetricCard
          title="Data mode"
          value="Dummy"
          detail="No patient-identifiable data"
          icon={ShieldCheck}
        />
        <MetricCard
          title="High-risk gaps"
          value={highRiskItems.length}
          detail="Before production use"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Storage"
          value={databaseStatus.status === "connected" ? "DB" : "Local"}
          detail={databaseStatus.label}
          icon={Database}
        />
      </section>

      <section className="content-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Practice profile" title="Editable system configuration">
            These values are now editable and stored in this browser using
            localStorage. Later they should move into a real database.
          </SectionHeader>

          <form className="settings-edit-form">
            <FormField label="Practice name">
              <input
                className={fieldClassName}
                type="text"
                value={appConfig.practiceName}
                onChange={(event) =>
                  updateConfigField("practiceName", event.target.value)
                }
              />
            </FormField>

            <FormField label="Short system name">
              <input
                className={fieldClassName}
                type="text"
                value={appConfig.systemName}
                onChange={(event) =>
                  updateConfigField("systemName", event.target.value)
                }
              />
            </FormField>

            <FormField label="Full system name">
              <input
                className={fieldClassName}
                type="text"
                value={appConfig.systemFullName}
                onChange={(event) =>
                  updateConfigField("systemFullName", event.target.value)
                }
              />
            </FormField>

            <FormField label="Data mode">
              <select
                className={fieldClassName}
                value={appConfig.dataMode}
                onChange={(event) =>
                  updateConfigField("dataMode", event.target.value)
                }
              >
                <option>Dummy data only</option>
                <option>Prototype local data</option>
                <option>Database planned</option>
                <option>Production locked</option>
              </select>
            </FormField>

            <FormField label="Holiday year start">
              <input
                className={fieldClassName}
                type="text"
                value={appConfig.holidayYearStart}
                onChange={(event) =>
                  updateConfigField("holidayYearStart", event.target.value)
                }
              />
            </FormField>

            <FormField label="Holiday year end">
              <input
                className={fieldClassName}
                type="text"
                value={appConfig.holidayYearEnd}
                onChange={(event) =>
                  updateConfigField("holidayYearEnd", event.target.value)
                }
              />
            </FormField>

            <FormField label="Admin contact">
              <input
                className={fieldClassName}
                type="text"
                value={appConfig.adminContact}
                onChange={(event) =>
                  updateConfigField("adminContact", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Prototype warning text"
              className="settings-wide-field"
            >
              <textarea
                className={fieldClassName}
                value={appConfig.prototypeWarning}
                onChange={(event) =>
                  updateConfigField("prototypeWarning", event.target.value)
                }
              />
            </FormField>
          </form>

          <div className="settings-save-strip">
            <div>
              <Save size={18} />
              <span>
                {savedMessage ||
                  "Changes save automatically in this browser as you type."}
              </span>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="settings-reset-button"
              onClick={resetAppConfig}
            >
              Reset profile
            </Button>
          </div>
        </Panel>

        <Panel as="aside" className="panel">
          <SectionHeader eyebrow="Current profile" title="Live configuration preview">
            This preview shows the current saved browser configuration.
          </SectionHeader>

          <div className="settings-profile-grid">
            <div>
              <span>Practice name</span>
              <strong>{appConfig.practiceName}</strong>
            </div>
            <div>
              <span>System name</span>
              <strong>{appConfig.systemName}</strong>
            </div>
            <div>
              <span>Full name</span>
              <strong>{appConfig.systemFullName}</strong>
            </div>
            <div>
              <span>Data mode</span>
              <Badge>{appConfig.dataMode}</Badge>
            </div>
            <div>
              <span>Holiday year</span>
              <strong>
                {appConfig.holidayYearStart} to {appConfig.holidayYearEnd}
              </strong>
            </div>
            <div>
              <span>Admin contact</span>
              <strong>{appConfig.adminContact}</strong>
            </div>
            <div>
              <span>SystmOne connection</span>
              <Badge>{practiceSettings.systmOneConnection}</Badge>
            </div>
            <div>
              <span>Database</span>
              <Badge>{databaseStatus.label || practiceSettings.databaseStatus}</Badge>
            </div>
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Safety" title="Prototype rules">
            These rules should stay visible until the app has proper security,
            governance and hosting.
          </SectionHeader>

          <AlertBanner tone="danger" title="No patient-identifiable data" icon={Lock}>
            {appConfig.prototypeWarning}
          </AlertBanner>

          <div className="settings-mini-list">
            <div>
              <CheckCircle2 size={18} />
              <span>Use mock staff names only</span>
            </div>
            <div>
              <CheckCircle2 size={18} />
              <span>No live SystmOne connection</span>
            </div>
            <div>
              <CheckCircle2 size={18} />
              <span>No patient data in uploads</span>
            </div>
          </div>
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Configuration maturity" title="What this means">
            These settings currently only affect this browser. In the production
            app, this should be a controlled admin-only configuration area.
          </SectionHeader>

          <div className="governance-alert-grid">
            <div className="governance-alert">
              <div>
                <strong>Browser-level settings</strong>
                <span>Current configuration is saved only in localStorage.</span>
              </div>
              <Badge>Prototype</Badge>
            </div>
            <div className="governance-alert">
              <div>
                <strong>Database required</strong>
                <span>Practice settings should eventually be stored centrally.</span>
              </div>
              <Badge>Required</Badge>
            </div>
            <div className="governance-alert">
              <div>
                <strong>Admin-only access</strong>
                <span>Only authorised admin users should edit these settings.</span>
              </div>
              <Badge>Planned</Badge>
            </div>
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Database" title="Supabase connection">
            GPOP now has a database adapter. Activity logging writes to Supabase
            when configured and falls back to localStorage if the table, network
            or permissions are not ready.
          </SectionHeader>

          <div className="database-status-card">
            <div>
              <Server size={22} />
            </div>
            <div>
              <strong>{databaseStatus.label}</strong>
              <p>{databaseStatus.message}</p>
              <span>
                Table: <strong>{databaseStatus.tableName || "gpop_activity_log"}</strong>
              </span>
            </div>
            <Badge>{databaseStatus.status}</Badge>
          </div>

          <div className="policy-actions">
            <Button
              type="button"
              variant="primary"
              onClick={createDatabaseTestLog}
              disabled={databaseBusy}
            >
              Write test log
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={refreshDatabasePanel}
              disabled={databaseBusy}
            >
              Refresh status
            </Button>
          </div>
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Activity log" title="Latest production events">
            These records come from Supabase when connected, otherwise from the
            local browser fallback. This is the first production-grade database
            backed feature.
          </SectionHeader>

          <DataTable
            columns={[
              { key: "created_at", label: "Time" },
              { key: "module", label: "Module" },
              { key: "title", label: "Event" },
              { key: "actor_role", label: "Role" },
              { key: "storage_mode", label: "Storage" },
            ]}
            rows={activityRows}
            emptyTitle="No activity yet"
            emptyMessage="Click Write test log, or perform actions such as approving leave or changing modules."
            renderCell={(row, key) => {
              if (key === "created_at") return formatActivityDate(row.created_at);
              if (key === "module" || key === "storage_mode") return <Badge>{row[key]}</Badge>;
              if (key === "title") {
                return (
                  <div className="stacked-cell">
                    <strong>{row.title}</strong>
                    <span>{row.detail}</span>
                  </div>
                );
              }
              return row[key];
            }}
          />
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Modules" title="Module toggles">
            Turn modules on/off in this mock settings area. Toggles now update
            the sidebar immediately and persist after refresh.
          </SectionHeader>

          <DataTable
            columns={[
              { key: "name", label: "Module" },
              { key: "description", label: "Description" },
              { key: "dataRisk", label: "Data risk" },
              { key: "governanceStatus", label: "Governance" },
              { key: "enabled", label: "Enabled" },
              { key: "actions", label: "Actions" },
            ]}
            rows={localModuleSettings}
            renderCell={(row, key) => {
              if (key === "name") {
                return (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-button"
                    style={{ padding: 0, justifyContent: "flex-start" }}
                    onClick={() => setSelectedModuleId(row.id)}
                  >
                    {row.name}
                  </Button>
                );
              }

              if (key === "dataRisk" || key === "governanceStatus") {
                return <Badge>{row[key]}</Badge>;
              }

              if (key === "enabled") {
                return <Badge>{row.enabled ? "On" : "Off"}</Badge>;
              }

              if (key === "actions") {
                return (
                  <Button
                    type="button"
                    size="sm"
                    variant={row.enabled ? "danger" : "primary"}
                    className="settings-toggle-button"
                    onClick={() => toggleModule(row.id)}
                  >
                    {row.enabled ? "Disable" : "Enable"}
                  </Button>
                );
              }

              return row[key];
            }}
          />
        </Panel>

        <Panel as="aside" className="panel policy-detail-panel">
          <SectionHeader eyebrow="Selected module" title={selectedModule.name}>
            {selectedModule.description}
          </SectionHeader>

          <div className="policy-detail-grid">
            <div>
              <span>Enabled</span>
              <Badge>{selectedModule.enabled ? "On" : "Off"}</Badge>
            </div>
            <div>
              <span>Data risk</span>
              <Badge>{selectedModule.dataRisk} risk</Badge>
            </div>
            <div>
              <span>Governance status</span>
              <Badge>{selectedModule.governanceStatus}</Badge>
            </div>
          </div>

          <div className="policy-actions">
            <Button
              type="button"
              variant={selectedModule.enabled ? "danger" : "primary"}
              onClick={() => toggleModule(selectedModule.id)}
            >
              {selectedModule.enabled ? "Disable module" : "Enable module"}
            </Button>
          </div>
        </Panel>
      </section>

      <Panel className="panel role-permissions-panel">
        <SectionHeader eyebrow="Permissions" title="Role permissions matrix">
          This is a mock role-based access model. Later this will control what
          each user can see and do after login.
        </SectionHeader>

        <div className="role-permissions-table-wrap" aria-label="Role permissions matrix">
          <table className="role-permissions-table">
            <thead>
              <tr>
                <th scope="col">Role</th>
                {permissionColumns.map((column) => (
                  <th scope="col" key={column.key}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rolePermissions.map((row) => (
                <tr key={row.role}>
                  <th scope="row">
                    <strong>{row.role}</strong>
                  </th>

                  {permissionColumns.map((column) => (
                    <td key={column.key}>
                      <span className={getPermissionClass(row[column.key])}>
                        {row[column.key]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="role-permissions-note">
          Scroll horizontally on smaller screens. Role names stay readable and permission chips keep their full labels.
        </p>
      </Panel>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Reminders" title="Reminder settings">
            These are planned rules for feeding alerts into the Inbox.
          </SectionHeader>

          <DataTable
            columns={[
              { key: "setting", label: "Setting" },
              { key: "value", label: "Value" },
              { key: "status", label: "Status" },
            ]}
            rows={reminderSettings}
            renderCell={(row, key) => {
              if (key === "setting") return <strong>{row.setting}</strong>;
              if (key === "status") return <Badge>{row.status}</Badge>;
              return row[key];
            }}
          />
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Production" title="Readiness checklist">
            These items must be addressed before the app can be used as a real
            multi-user system.
          </SectionHeader>

          <div className="governance-alert-grid">
            {productionReadinessItems.map((item) => (
              <div className="governance-alert" key={item.area}>
                <div>
                  <strong>{item.area}</strong>
                  <span>
                    {item.status} · {item.note}
                  </span>
                </div>
                <Badge>{item.risk} risk</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel className="panel">
        <SectionHeader eyebrow="Demo data" title="Reset prototype data">
          Clear saved browser data and reload the app back to the original demo
          state.
        </SectionHeader>

        <div className="reset-demo-card">
          <div>
            <RotateCcw size={24} />
          </div>

          <div>
            <strong>Reset this browser’s demo data</strong>
            <p>
              This clears localStorage for GPOP only. It resets holiday requests,
              inbox statuses, audit submissions, finance task statuses, app
              profile settings and module toggles. It does not affect any real
              database because there is no real database connected yet.
            </p>
          </div>

          <Button type="button" variant="danger" onClick={resetDemoData}>
            Reset demo data
          </Button>
        </div>
      </Panel>

      <Panel className="panel">
        <SectionHeader eyebrow="Next technical phase" title="Storage plan">
          This is the planned route from prototype to production-quality app.
        </SectionHeader>

        <div className="storage-roadmap">
          <div>
            <strong>1. In-memory state</strong>
            <span>Original prototype. Fast, but reset on refresh.</span>
          </div>
          <div>
            <strong>2. localStorage</strong>
            <span>Current step. Keeps prototype data after refresh.</span>
          </div>
          <div>
            <strong>3. Service layer</strong>
            <span>Current architecture step. Keeps pages away from storage details.</span>
          </div>
          <div>
            <strong>4. API/database layer</strong>
            <span>Later: Supabase/Postgres, Prisma, or another backend.</span>
          </div>
          <div>
            <strong>5. Production hardening</strong>
            <span>Authentication, permissions, backups, audit logs and testing.</span>
          </div>
        </div>
      </Panel>
    </>
  );
}