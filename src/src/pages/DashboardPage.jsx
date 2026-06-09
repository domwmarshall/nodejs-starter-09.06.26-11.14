import { useMemo } from "react";
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

function ActionQueue({ actions }) {
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
      {actions.slice(0, 5).map((action) => (
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
  const [storedInboxItems] = useLocalStorageState(INBOX_STORAGE_KEY, inboxItems);
  const [storedFinanceTasks] = useLocalStorageState(FINANCE_TASKS_STORAGE_KEY, financeTasks);
  const [storedInvoiceLines] = useLocalStorageState(
    DISPENSARY_INVOICE_LINES_STORAGE_KEY,
    supplierInvoiceLines
  );

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
          <div>
            <span>Open actions</span>
            <strong>{dashboard.actions.length}</strong>
          </div>
          <div>
            <span>Cover risks</span>
            <strong>{dashboard.coverRiskCount}</strong>
          </div>
          <div>
            <span>Fridges</span>
            <strong>{fridgeSafe ? "OK" : "Check"}</strong>
          </div>
        </div>
      </section>

      <section className="premium-metric-row">
        <MetricCard
          title="Inbox"
          value={dashboard.openInbox}
          detail="Open operational items"
          icon={Bell}
        />
        <MetricCard
          title="Team"
          value={dashboard.staffVisible}
          detail="Profiles visible today"
          icon={Users}
        />
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
      </section>

      <section className="premium-dashboard-grid">
        <Panel className="premium-card premium-card-primary">
          <div className="premium-card-header">
            <div>
              <span>Priority queue</span>
              <h3>What needs doing next</h3>
            </div>
            <RiskPill tone={dashboard.highPriority > 0 ? "amber" : "success"}>
              {dashboard.highPriority} high priority
            </RiskPill>
          </div>
          <ActionQueue actions={dashboard.actions} />
        </Panel>

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
      </section>

      <section className="premium-insight-grid">
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

        <InsightCard
          icon={CalendarDays}
          label="Leave"
          value={`${dashboard.pendingLeave} pending`}
          detail="Requests awaiting management decision. Cover impact is checked before approval."
          tone="neutral"
        />

        <InsightCard
          icon={AlertTriangle}
          label="Finance exceptions"
          value={`${dashboard.overdueFinanceTasks} overdue`}
          detail={`${dashboard.dispensaryProfitability.lossRows.length} dispensary loss line(s) need review.`}
          tone={dashboard.overdueFinanceTasks > 0 ? "amber" : "neutral"}
        />
      </section>
    </>
  );
}
