import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  PoundSterling,
  ShieldCheck,
  Snowflake,
  Users,
} from "lucide-react";

import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { PageHeader, Panel } from "../components/ui";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { formatDate, getDueText } from "../utils/dateUtils";

import { staff } from "../data/staff";
import { inboxItems } from "../data/inbox";
import { expectedPayments, financeTasks } from "../data/finance";
import { supplierInvoiceLines } from "../data/dispensaryFinance";
import { fridgeTemperatureSeries, getFridgeStats } from "../data/fridgeTemps";

import {
  INBOX_STORAGE_KEY,
  getInboxMetrics,
} from "../services/inboxService";
import {
  DISPENSARY_INVOICE_LINES_STORAGE_KEY,
  FINANCE_TASKS_STORAGE_KEY,
  formatMoney,
  getDispensaryProfitability,
  getFinanceTaskMetrics,
  getPaymentTotals,
} from "../services/financeService";
import { getCoverMetrics } from "../services/coverService";
import { getRoleHomeSummary } from "../services/userService";
import {
  FEATURE_FLAGS_STORAGE_KEY,
  getRoleDashboardPresets,
  isFeatureEnabled,
  mergeFeatureFlags,
} from "../services/featureFlagService";

function buildInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function RiskPill({ children, tone = "neutral" }) {
  return <span className={`premium-pill premium-pill-${tone}`}>{children}</span>;
}

function ActionQueue({ actions, limit = 5 }) {
  const visibleActions = actions.slice(0, limit);

  if (!actions.length) {
    return (
      <div className="premium-empty-state">
        <CheckCircle2 size={18} />
        <div>
          <strong>No immediate blockers</strong>
          <span>Today looks calm. Nothing critical is waiting.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-action-list">
      {visibleActions.map((action) => (
        <article className="premium-action-row" key={action.id}>
          <div className="premium-action-icon">
            {action.priority === "High" || action.priority === "High risk" ? (
              <AlertTriangle size={16} />
            ) : (
              <ClipboardList size={16} />
            )}
          </div>
          <div>
            <strong>{action.title}</strong>
            <span>{action.module} · {action.owner} · {getDueText(action.dueDate)}</span>
          </div>
          <RiskPill tone={action.priority === "High" || action.priority === "High risk" ? "danger" : "amber"}>
            {action.priority}
          </RiskPill>
        </article>
      ))}
    </div>
  );
}

function DashboardDrilldownPanel({ mode, dashboard, fridgeSafe, onClose }) {
  if (!mode) return null;

  const panelTitle = {
    actions: "Open actions",
    cover: "Cover risk detail",
    fridges: "Fridge detail",
  }[mode];

  const panelDetail = {
    actions: `${dashboard.actions.length} operational item(s) available for review.`,
    cover: `${dashboard.coverRiskCount} cover risk item(s) need workforce review.`,
    fridges: fridgeSafe ? "Both fridge feeds are currently shown as in range." : "One or more fridge feeds need review.",
  }[mode];

  const rows = mode === "cover"
    ? dashboard.actions.filter((action) => String(action.module).toLowerCase().includes("workforce") || String(action.title).toLowerCase().includes("cover"))
    : dashboard.actions;

  return (
    <Panel className="dashboard-drilldown-panel">
      <div className="dashboard-drilldown-header">
        <div>
          <span className="eyebrow">Dashboard detail</span>
          <h3>{panelTitle}</h3>
          <p>{panelDetail}</p>
        </div>
        <button type="button" className="dashboard-text-button" onClick={onClose}>Close</button>
      </div>

      {mode === "fridges" ? (
        <div className="dashboard-detail-grid">
          <div><span>Vaccine fridge</span><strong>{fridgeSafe ? "Within range" : "Check range"}</strong><p>Manual/API-ready feed. Full fridge module owns excursions and acknowledgements.</p></div>
          <div><span>Dispensary fridge</span><strong>{fridgeSafe ? "Within range" : "Check range"}</strong><p>Daily check and EasyCloud adapter scaffold remain separated from patient data.</p></div>
          <div><span>Next action</span><strong>Open fridge module</strong><p>Use this dashboard card as the summary; fridge records live in the fridge workflow.</p></div>
        </div>
      ) : (
        <ActionQueue actions={rows} limit={rows.length} />
      )}
    </Panel>
  );
}

function TeamRail({ people }) {
  return (
    <div className="premium-team-rail">
      {people.map((person) => (
        <article className="premium-team-card" key={person.name}>
          <div className="premium-avatar">{buildInitials(person.name)}</div>
          <div>
            <strong>{person.name}</strong>
            <span>{person.role}</span>
          </div>
          <small>{person.room}</small>
        </article>
      ))}
    </div>
  );
}

function FridgeSummary({ fridge }) {
  const stats = getFridgeStats(fridge);
  const isSafe = stats.status === "In range";

  return (
    <article className="premium-insight-row">
      <div className="premium-insight-icon">
        <Snowflake size={17} />
      </div>
      <div>
        <strong>{fridge.name}</strong>
        <span>{fridge.location} · {stats.current.toFixed(1)}°C now</span>
      </div>
      <RiskPill tone={isSafe ? "success" : "danger"}>{stats.status}</RiskPill>
    </article>
  );
}

function InsightCard({ icon: Icon, label, value, detail, tone = "neutral" }) {
  return (
    <Panel className={`premium-insight-card premium-insight-card-${tone}`}>
      <div className="premium-insight-card-icon">
        <Icon size={18} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </Panel>
  );
}

export function DashboardPage({ holidayRequests = [], currentUser, staffList = staff }) {
  const [openDashboardPanel, setOpenDashboardPanel] = useState(null);
  const [storedInboxItems] = useLocalStorageState(INBOX_STORAGE_KEY, inboxItems);
  const [storedFinanceTasks] = useLocalStorageState(FINANCE_TASKS_STORAGE_KEY, financeTasks);
  const [storedInvoiceLines] = useLocalStorageState(
    DISPENSARY_INVOICE_LINES_STORAGE_KEY,
    supplierInvoiceLines
  );
  const [featureFlagState] = useLocalStorageState(FEATURE_FLAGS_STORAGE_KEY, []);
  const activeFeatureFlags = mergeFeatureFlags(featureFlagState);
  const rolePreset = getRoleDashboardPresets().find((preset) => preset.role === currentUser?.role) || getRoleDashboardPresets()[0];
  const showFridge = isFeatureEnabled(activeFeatureFlags, "dashboard.fridgeCharts");
  const showFinance = isFeatureEnabled(activeFeatureFlags, "dashboard.financeSnapshot");
  const showWorkforce = isFeatureEnabled(activeFeatureFlags, "dashboard.workforcePanel");
  const showCompliance = isFeatureEnabled(activeFeatureFlags, "dashboard.compliancePanel");

  const dashboard = useMemo(() => {
    const inboxMetrics = getInboxMetrics(Array.isArray(storedInboxItems) ? storedInboxItems : inboxItems);
    const financeTaskMetrics = getFinanceTaskMetrics(
      Array.isArray(storedFinanceTasks) ? storedFinanceTasks : financeTasks
    );
    const paymentTotals = getPaymentTotals(expectedPayments);
    const dispensaryProfitability = getDispensaryProfitability({
      invoiceLines: Array.isArray(storedInvoiceLines) ? storedInvoiceLines : supplierInvoiceLines,
    });
    const coverMetrics = getCoverMetrics({ requests: holidayRequests, staffList });

    const pendingLeave = holidayRequests.filter((request) => request.status === "Pending");
    const coverRisks = [
      ...coverMetrics.riskyApprovedRequests,
      ...coverMetrics.riskyPendingRequests,
    ];

    const actions = [
      ...coverRisks.map((request) => ({
        id: `cover-${request.id}`,
        title: `${request.staffName} leave affects cover`,
        module: "Workforce",
        owner: "Practice Manager",
        dueDate: request.date,
        priority: request.coverRisk || "High",
      })),
      ...financeTaskMetrics.highPriorityTasks.map((task) => ({
        id: `finance-${task.id}`,
        title: task.title,
        module: "Finance",
        owner: task.owner || "Finance lead",
        dueDate: task.dueDate,
        priority: task.priority || "High",
      })),
      ...pendingLeave.map((request) => ({
        id: `leave-${request.id}`,
        title: `${request.staffName} leave request`,
        module: "Workforce",
        owner: "Practice Manager",
        dueDate: request.date,
        priority: "Medium",
      })),
      ...inboxMetrics.openItems.slice(0, 4).map((item) => ({
        id: `inbox-${item.id}`,
        title: item.title,
        module: item.module,
        owner: item.assignedTo || "Unassigned",
        dueDate: item.dueDate,
        priority: item.priority || "Medium",
      })),
    ];

    return {
      openInbox: inboxMetrics.openItems.length,
      highPriority: actions.filter((action) => action.priority === "High" || action.priority === "High risk").length,
      pendingLeave: pendingLeave.length,
      coverRiskCount: coverRisks.length,
      actions,
      paymentTotals,
      dispensaryProfitability,
      overdueFinanceTasks: financeTaskMetrics.overdueTasks.length,
      staffVisible: staffList.length,
    };
  }, [storedInboxItems, storedFinanceTasks, storedInvoiceLines, holidayRequests, staffList]);

  const firstFridge = getFridgeStats(fridgeTemperatureSeries.vaccine);
  const secondFridge = getFridgeStats(fridgeTemperatureSeries.dispensary);
  const fridgeSafe = firstFridge.status === "In range" && secondFridge.status === "In range";

  return (
    <>
      <PageHeader
        eyebrow="Today"
        title="Operational cockpit"
      >
        {getRoleHomeSummary(currentUser)} Focused view. Less noise, clearer priorities, faster decisions.
      </PageHeader>

      <section className="auth-mode-toggle">
        <span className="premium-pill premium-pill-neutral">{currentUser?.role || "Practice Manager"} view</span>
        {rolePreset.cards.map((card) => <span className="premium-pill premium-pill-success" key={card}>{card}</span>)}
      </section>

      <section className="premium-dashboard-hero">
        <div className="premium-hero-copy">
          <RiskPill tone={dashboard.highPriority > 0 ? "amber" : "success"}>
            {dashboard.highPriority > 0 ? "Needs review" : "Calm today"}
          </RiskPill>
          <h2>{dashboard.highPriority > 0 ? "A few items need manager attention." : "The practice looks operationally stable."}</h2>
          <p>
            {dashboard.openInbox} open item{dashboard.openInbox === 1 ? "" : "s"}, {dashboard.coverRiskCount} cover risk{dashboard.coverRiskCount === 1 ? "" : "s"}, and fridge monitoring is {fridgeSafe ? "within range" : "showing an excursion"}.
          </p>
        </div>

        <div className="premium-hero-metrics">
          <button type="button" className="premium-hero-metric-button" onClick={() => setOpenDashboardPanel(openDashboardPanel === "actions" ? null : "actions")}>
            <span>Open actions</span>
            <strong>{dashboard.actions.length}</strong>
            <small>{openDashboardPanel === "actions" ? "Hide detail" : "View detail"}</small>
          </button>
          <button type="button" className="premium-hero-metric-button" onClick={() => setOpenDashboardPanel(openDashboardPanel === "cover" ? null : "cover")}>
            <span>Cover risks</span>
            <strong>{dashboard.coverRiskCount}</strong>
            <small>{openDashboardPanel === "cover" ? "Hide detail" : "View list"}</small>
          </button>
          <button type="button" className="premium-hero-metric-button" onClick={() => setOpenDashboardPanel(openDashboardPanel === "fridges" ? null : "fridges")}>
            <span>Fridges</span>
            <strong>{fridgeSafe ? "OK" : "Check"}</strong>
            <small>{openDashboardPanel === "fridges" ? "Hide detail" : "View status"}</small>
          </button>
        </div>
      </section>

      <DashboardDrilldownPanel
        mode={openDashboardPanel}
        dashboard={dashboard}
        fridgeSafe={fridgeSafe}
        onClose={() => setOpenDashboardPanel(null)}
      />

      <section className="premium-metric-row">
        <MetricCard
          title="Inbox"
          value={dashboard.openInbox}
          detail="Open operational items"
          icon={Bell}
        />
        {showWorkforce ? (
          <MetricCard
            title="Team"
            value={dashboard.staffVisible}
            detail="Profiles visible today"
            icon={Users}
          />
        ) : null}
        {showFinance ? (
          <>
            <MetricCard
              title="Finance"
              value={formatMoney(dashboard.paymentTotals.outstanding)}
              detail="Expected income outstanding"
              icon={PoundSterling}
            />
            <MetricCard
              title="Dispensary"
              value={formatMoney(dashboard.dispensaryProfitability.grossProfit)}
              detail={`${dashboard.dispensaryProfitability.lossRows.length} loss lines`}
              icon={ShieldCheck}
            />
          </>
        ) : null}
      </section>

      <section className="premium-dashboard-grid">
        <Panel className="premium-card premium-card-primary">
          <div className="premium-card-header">
            <div>
              <span>Priority queue</span>
              <h3>What needs doing next</h3>
            </div>
            <div className="dashboard-card-actions">
              <RiskPill tone={dashboard.highPriority > 0 ? "amber" : "success"}>
                {dashboard.highPriority} high priority
              </RiskPill>
              <button type="button" className="dashboard-text-button" onClick={() => setOpenDashboardPanel(openDashboardPanel === "actions" ? null : "actions")}>
                {openDashboardPanel === "actions" ? "Hide all" : "View all"}
              </button>
            </div>
          </div>
          <ActionQueue actions={dashboard.actions} />
        </Panel>

        {showWorkforce ? (
          <Panel className="premium-card">
            <div className="premium-card-header">
              <div>
                <span>Workforce</span>
                <h3>Who is around</h3>
              </div>
              <RiskPill tone={dashboard.coverRiskCount > 0 ? "amber" : "success"}>
                {dashboard.coverRiskCount > 0 ? `${dashboard.coverRiskCount} risk` : "Covered"}
              </RiskPill>
            </div>
            <TeamRail people={staffList.slice(0, 5)} />
          </Panel>
        ) : null}
      </section>

      <section className="premium-insight-grid">
        {showFridge ? (
          <Panel className="premium-card premium-card-compact">
            <div className="premium-card-header">
              <div>
                <span>Fridge monitoring</span>
                <h3>Cold chain</h3>
              </div>
              <RiskPill tone={fridgeSafe ? "success" : "danger"}>{fridgeSafe ? "All safe" : "Check"}</RiskPill>
            </div>
            <div className="premium-insight-list">
              <FridgeSummary fridge={fridgeTemperatureSeries.vaccine} />
              <FridgeSummary fridge={fridgeTemperatureSeries.dispensary} />
            </div>
          </Panel>
        ) : null}

        {showWorkforce ? (
          <InsightCard
            icon={CalendarDays}
            label="Leave"
            value={`${dashboard.pendingLeave} pending`}
            detail="Requests awaiting management decision. Cover impact is checked before approval."
            tone="neutral"
          />
        ) : null}

        {showFinance ? (
          <InsightCard
            icon={AlertTriangle}
            label="Finance exceptions"
            value={`${dashboard.overdueFinanceTasks} overdue`}
            detail={`${dashboard.dispensaryProfitability.lossRows.length} dispensary loss line(s) need review.`}
            tone={dashboard.overdueFinanceTasks > 0 ? "amber" : "neutral"}
          />
        ) : null}

        {showCompliance ? (
          <InsightCard
            icon={ShieldCheck}
            label="Governance"
            value="Visible"
            detail="Compliance, training and audit cards are enabled for this dashboard view."
            tone="neutral"
          />
        ) : null}
      </section>
    </>
  );
}
