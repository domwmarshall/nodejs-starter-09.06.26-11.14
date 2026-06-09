import { useMemo, useState } from "react";
import {
  Building2,
  Database,
  KeyRound,
  LogOut,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "../components/Badge";
import { DataTable } from "../components/DataTable";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import {
  AUTH_SESSION_STORAGE_KEY,
  PRACTICE_MEMBERSHIPS_STORAGE_KEY,
  createMockAuthSession,
  getAuthScaffoldSteps,
  initialRoles,
  signInWithSupabase,
  signOutSupabase,
  signUpWithSupabase,
} from "../services/authService";
import { logActivity } from "../services/activityLogService";
import { getSupabaseEnvironmentSummary } from "../services/supabaseClient";
import { getCapacityBackboneDiagnostics, getCapacityBackboneStatus, resetCapacityBackboneOperationalData, seedCapacityBackboneFromLocal } from "../services/capacityBackboneService";
import { AlertBanner, Button, FormField, PageHeader, Panel, fieldClassName } from "../components/ui";

function buildMembershipRows(session, memberships = []) {
  const storedRows = Array.isArray(memberships) ? memberships : [];
  const sessionRow = session
    ? [{
        id: session.id,
        practiceName: session.practiceName,
        email: session.email,
        role: session.role,
        status: session.status,
        authMode: session.authMode,
      }]
    : [];

  return [...sessionRow, ...storedRows].slice(0, 8);
}

export function AuthPage({ currentUser, staffList = [], holidayRequests = [] }) {
  const [session, setSession] = useLocalStorageState(AUTH_SESSION_STORAGE_KEY, null);
  const [memberships, setMemberships] = useLocalStorageState(PRACTICE_MEMBERSHIPS_STORAGE_KEY, []);
  const [mode, setMode] = useState("create");
  const [email, setEmail] = useState("demo@gpop.local");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(currentUser?.name || "Dominic Marshall");
  const [role, setRole] = useState(currentUser?.role || "Practice Manager");
  const [practiceName, setPracticeName] = useState("Fleggburgh Surgery");
  const [inviteCode, setInviteCode] = useState("GPOP-DEMO");
  const [message, setMessage] = useState("");
  const [backboneStatus, setBackboneStatus] = useState(null);
  const [backboneBusy, setBackboneBusy] = useState(false);
  const environment = getSupabaseEnvironmentSummary();

  const membershipRows = useMemo(() => buildMembershipRows(session, memberships), [session, memberships]);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setMessage("Working...");

    let response = { ok: false, mode: "mock", message: "Mock mode" };

    if (mode === "signIn") {
      response = await signInWithSupabase({ email, password });
    }

    if (mode === "signUp") {
      response = await signUpWithSupabase({ email, password });
    }

    const nextSession = createMockAuthSession({ email, name, role, practiceName, inviteCode });
    nextSession.authMode = response.ok ? "Supabase Auth" : nextSession.authMode;
    nextSession.supabaseStatus = response.ok ? "Supabase response received" : response.message;
    nextSession.status = mode === "signIn" ? "Signed in / membership pending" : "Practice membership pending admin approval";

    setSession(nextSession);
    setMemberships((currentRows) => [
      {
        id: `membership-${Date.now()}`,
        practiceId: nextSession.practiceId,
        practiceName: nextSession.practiceName,
        email: nextSession.email,
        role: nextSession.role,
        status: nextSession.status,
        authMode: nextSession.authMode,
        createdAt: nextSession.createdAt,
      },
      ...(Array.isArray(currentRows) ? currentRows : []),
    ].slice(0, 12));

    setMessage(response.ok ? "Supabase Auth returned successfully. Local practice membership scaffold created." : `${response.message} Local auth scaffold created instead.`);

    void logActivity({
      eventType: "auth_scaffold_session_created",
      module: "Access",
      title: "Auth scaffold session created",
      detail: `${nextSession.email} requested ${nextSession.role} access to ${nextSession.practiceName}.`,
      actorName: currentUser?.name || name,
      actorRole: currentUser?.role || role,
      metadata: { mode, environment: environment.mode, supabaseResponseMode: response.mode },
    });
  }

  async function handleCapacityBackboneCheck() {
    setBackboneBusy(true);
    const response = await getCapacityBackboneStatus();
    setBackboneStatus(response);
    setMessage(response.message || "Capacity backbone checked.");
    setBackboneBusy(false);
  }

  async function handleCapacityBackboneSeed() {
    setBackboneBusy(true);
    const response = await seedCapacityBackboneFromLocal({
      practiceName,
      role,
      actor: currentUser || { name, role },
      staffProfiles: staffList,
      holidayRequests,
    });
    setBackboneStatus(response);
    setMessage(response.message || "Capacity backbone seed attempted.");
    setBackboneBusy(false);

    void logActivity({
      eventType: response.ok ? "capacity_backbone_seeded" : "capacity_backbone_seed_failed",
      module: "Access",
      title: response.ok ? "Capacity backbone seeded" : "Capacity backbone seed failed",
      detail: response.message || "GPOP v6.2 capacity backbone action completed.",
      actorName: currentUser?.name || name,
      actorRole: currentUser?.role || role,
      metadata: { counts: response.counts, mode: response.mode },
    });
  }
  async function handleCapacityBackboneDiagnostics() {
    setBackboneBusy(true);
    const response = await getCapacityBackboneDiagnostics();
    setBackboneStatus(response);
    setMessage(response.message || "Capacity backbone diagnostics completed.");
    setBackboneBusy(false);
  }

  async function handleCapacityBackboneReset() {
    const confirmed = window.confirm("Reset seeded operational data in Supabase? This keeps practice/profile/membership rows, but removes rooms, staff, skills, sessions, leave and care-nav rules for this practice so you can reseed cleanly.");
    if (!confirmed) return;
    setBackboneBusy(true);
    const response = await resetCapacityBackboneOperationalData({ practiceName });
    setBackboneStatus(response);
    setMessage(response.message || "Capacity backbone reset attempted.");
    setBackboneBusy(false);

    void logActivity({
      eventType: response.ok ? "capacity_backbone_reset" : "capacity_backbone_reset_failed",
      module: "Access",
      title: response.ok ? "Capacity backbone reset" : "Capacity backbone reset failed",
      detail: response.message || "GPOP v6.2.1 capacity backbone reset completed.",
      actorName: currentUser?.name || name,
      actorRole: currentUser?.role || role,
      metadata: { counts: response.counts, mode: response.mode },
    });
  }

  async function handleSignOut() {
    await signOutSupabase();
    setSession(null);
    setMessage("Signed out of the local auth scaffold.");
    void logActivity({
      eventType: "auth_scaffold_signed_out",
      module: "Access",
      title: "Auth scaffold signed out",
      detail: "The local auth scaffold session was cleared.",
      actorName: currentUser?.name || name,
      actorRole: currentUser?.role || role,
    });
  }

  return (
    <>
      <PageHeader eyebrow="Access" title="Supabase Auth and practice membership scaffold">
        Sign-in, profile and practice membership structure for future RLS. This keeps the current demo role switcher intact while preparing the app for real multi-user access.
      </PageHeader>

      <AlertBanner tone="warning" title="Auth scaffold only" icon={ShieldCheck}>
        This page does not expose service-role secrets and does not create patient records. Supabase Auth calls only run when VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are configured.
      </AlertBanner>

      <section className="metric-grid">
        <Panel className="metric-card">
          <div className="metric-icon"><KeyRound size={20} /></div>
          <div><span>Auth mode</span><strong>{environment.configured ? "Supabase ready" : "Local fallback"}</strong><p>{environment.mode}</p></div>
        </Panel>
        <Panel className="metric-card">
          <div className="metric-icon"><Building2 size={20} /></div>
          <div><span>Practice scope</span><strong>{session?.practiceName || practiceName}</strong><p>practice_id is required for future records</p></div>
        </Panel>
        <Panel className="metric-card">
          <div className="metric-icon"><Users size={20} /></div>
          <div><span>Memberships</span><strong>{membershipRows.length}</strong><p>local membership rows</p></div>
        </Panel>
        <Panel className="metric-card">
          <div className="metric-icon"><Database size={20} /></div>
          <div><span>RLS posture</span><strong>Planned</strong><p>practices · profiles · memberships</p></div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel panel-large">
          <div className="auth-mode-toggle">
            <Button type="button" variant={mode === "create" ? "primary" : "secondary"} onClick={() => setMode("create")}>Mock create</Button>
            <Button type="button" variant={mode === "signUp" ? "primary" : "secondary"} onClick={() => setMode("signUp")}>Supabase sign-up</Button>
            <Button type="button" variant={mode === "signIn" ? "primary" : "secondary"} onClick={() => setMode("signIn")}>Supabase sign-in</Button>
          </div>

          <form className="settings-edit-form" onSubmit={handleAuthSubmit}>
            <FormField label="Name"><input className={fieldClassName} value={name} onChange={(event) => setName(event.target.value)} /></FormField>
            <FormField label="Email"><input className={fieldClassName} type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></FormField>
            <FormField label="Password"><input className={fieldClassName} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Required only when Supabase Auth is configured" /></FormField>
            <FormField label="Requested role"><select className={fieldClassName} value={role} onChange={(event) => setRole(event.target.value)}>{initialRoles.map((item) => <option key={item}>{item}</option>)}</select></FormField>
            <FormField label="Practice"><input className={fieldClassName} value={practiceName} onChange={(event) => setPracticeName(event.target.value)} /></FormField>
            <FormField label="Invite code"><input className={fieldClassName} value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} /></FormField>
            <div className="policy-actions">
              <Button type="submit" variant="primary" leftIcon={UserPlus}>Create access scaffold</Button>
              <Button type="button" variant="secondary" onClick={handleSignOut} leftIcon={LogOut}>Sign out</Button>
            </div>
          </form>
          {message ? <p className="request-preview">{message}</p> : null}
        </Panel>

        <Panel className="panel">
          <div className="premium-card-header">
            <div><span>Current session</span><h3>{session?.email || "Not signed in"}</h3></div>
            <Badge>{session?.authMode || "No session"}</Badge>
          </div>
          <div className="settings-profile-grid">
            <div><span>Role</span><strong>{session?.role || "None"}</strong></div>
            <div><span>Practice ID</span><strong>{session?.practiceId || "Not created"}</strong></div>
            <div><span>Status</span><Badge>{session?.status || "Signed out"}</Badge></div>
            <div><span>Supabase</span><Badge>{environment.configured ? "Configured" : "Fallback"}</Badge></div>
          </div>
        </Panel>
      </section>

      <Panel className="panel capacity-backbone-panel">
        <div className="premium-card-header">
          <div>
            <span>v6.2.1 Supabase capacity backbone</span>
            <h3>Connect staff, rooms, sessions and care-nav routing</h3>
          </div>
          <Badge>{backboneStatus?.ok ? "DB live" : environment.configured ? "Check setup" : "Fallback"}</Badge>
        </div>

        <div className="blue-box">
          <strong>What this creates</strong>
          <p>Practice-scoped records for rooms, staff profiles, staff skills, split working-pattern sessions, bank/locum sessions with cost, leave/unavailability and care-navigation assignment rules. No patient-identifiable data is created.</p>
        </div>

        <div className="policy-actions capacity-action-row">
          <Button type="button" variant="secondary" onClick={handleCapacityBackboneCheck} disabled={backboneBusy}>
            Check DB backbone
          </Button>
          <Button type="button" variant="secondary" onClick={handleCapacityBackboneDiagnostics} disabled={backboneBusy}>
            Run diagnostics
          </Button>
          <Button type="button" variant="primary" onClick={handleCapacityBackboneSeed} disabled={backboneBusy || !environment.configured}>
            Seed / upsert current GPOP data
          </Button>
          <Button type="button" variant="danger" onClick={handleCapacityBackboneReset} disabled={backboneBusy || !environment.configured}>
            Reset seeded operational data
          </Button>
        </div>

        {backboneStatus ? (
          <div className={backboneStatus.ok ? "capacity-backbone-status" : "capacity-backbone-status capacity-backbone-status-error"}>
            <strong>{backboneStatus.message}</strong>
            {backboneStatus.checkedAt ? <p>Checked {new Date(backboneStatus.checkedAt).toLocaleString("en-GB")}</p> : null}
            <div className="settings-profile-grid">
              {Object.entries(backboneStatus.counts || {}).map(([key, value]) => (
                <div key={key}><span>{key.replaceAll("_", " ")}</span><strong>{value}</strong></div>
              ))}
            </div>
            {Array.isArray(backboneStatus.diagnostics) && backboneStatus.diagnostics.length ? (
              <div className="diagnostics-list">
                {backboneStatus.diagnostics.map((item) => (
                  <div className="diagnostics-row" key={item.label}>
                    <Badge>{item.ok ? "OK" : "Check"}</Badge>
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {Array.isArray(backboneStatus.tableChecks) && backboneStatus.tableChecks.some((item) => !item.ok) ? (
              <div className="blue-box blue-box-warning">
                <strong>Table issue detected</strong>
                <p>{backboneStatus.tableChecks.filter((item) => !item.ok).map((item) => `${item.table}: ${item.error}`).join(" · ")}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Panel>

      <section className="content-grid">
        <Panel className="panel">
          <div className="premium-card-header"><div><span>Implementation sequence</span><h3>Auth to RLS</h3></div><Badge>v6.0</Badge></div>
          <div className="settings-mini-list">
            {getAuthScaffoldSteps().map((step) => <div key={step}><ShieldCheck size={18} /><span>{step}</span></div>)}
          </div>
        </Panel>

        <Panel className="panel">
          <div className="premium-card-header"><div><span>Core tables</span><h3>Membership structure</h3></div><Badge>DB-ready</Badge></div>
          <div className="governance-alert-grid">
            {["practices", "profiles", "practice_memberships", "rooms", "staff_profiles", "staff_skills", "working_pattern_sessions", "bank_locum_sessions", "leave_requests", "care_nav_assignment_rules"].map((table) => (
              <div className="governance-alert" key={table}><div><strong>{table}</strong><span>practice_id scoped and RLS-aware in the migration plan.</span></div><Badge>RLS-ready</Badge></div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel className="panel">
        <div className="premium-card-header"><div><span>Memberships</span><h3>Practice access requests</h3></div><Badge>{membershipRows.length} local</Badge></div>
        <DataTable
          columns={[
            { key: "practiceName", label: "Practice" },
            { key: "email", label: "Email" },
            { key: "role", label: "Role" },
            { key: "status", label: "Status" },
            { key: "authMode", label: "Mode" },
          ]}
          rows={membershipRows}
          emptyTitle="No memberships yet"
          emptyMessage="Create a local access scaffold or configure Supabase Auth."
          renderCell={(row, key) => key === "status" || key === "authMode" ? <Badge>{row[key]}</Badge> : row[key]}
        />
      </Panel>
    </>
  );
}
