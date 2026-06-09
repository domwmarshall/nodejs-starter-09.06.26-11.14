import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { DataTable } from "../components/DataTable";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { formatDate } from "../utils/dateUtils";

import { inboxItems, inboxQuickFilters } from "../data/inbox";
import { staff as baseStaff } from "../data/staff";
import { moduleSettings } from "../data/settings";
import { auditTemplates } from "../data/audits";
import { trainingCourses, trainingRecords } from "../data/training";
import { financeTasks } from "../data/finance";
import { supplierInvoiceLines } from "../data/dispensaryFinance";
import {
  COMPLIANCE_ACKNOWLEDGEMENTS_STORAGE_KEY,
  COMPLIANCE_POLICIES_STORAGE_KEY,
  COMPLIANCE_QUESTIONS_STORAGE_KEY,
  getDefaultPolicies,
  getDefaultPolicyAcknowledgements,
  getDefaultPolicyQuestions,
} from "../services/complianceService";

import {
  INBOX_STORAGE_KEY,
  enrichInboxItems,
  filterInboxItems,
  getInboxMetrics,
  getInboxModuleSummary,
  updateInboxItemStatus,
} from "../services/inboxService";

import {
  AUDIT_SUBMISSIONS_STORAGE_KEY,
  AUDIT_TEMPLATES_STORAGE_KEY,
  getDefaultAuditSubmissions,
  getDefaultAuditTemplates,
} from "../services/auditService";

import { DISPENSARY_INVOICE_LINES_STORAGE_KEY, FINANCE_TASKS_STORAGE_KEY } from "../services/financeService";
import { MODULE_SETTINGS_STORAGE_KEY } from "../services/appShellService";
import {
  TRAINING_COURSES_STORAGE_KEY,
  TRAINING_RECORDS_STORAGE_KEY,
  getDefaultTrainingCourses,
  getDefaultTrainingRecords,
} from "../services/trainingService";
import {
  CARE_NAVIGATION_NOTES_STORAGE_KEY,
  CARE_NAVIGATION_PATHWAYS_STORAGE_KEY,
  getDefaultCareNavigationPathways,
  getDefaultSampleCareNavigationCalls,
} from "../services/careNavigationService";

import {
  getAlertsForUser,
  getGeneratedOperationalAlerts,
  getOperationalAlertMetrics,
} from "../services/operationsAlertService";

import {
  AlertBanner,
  Button,
  PageHeader,
  Panel,
} from "../components/ui";

function GraduationMiniIcon() {
  return <span className="mini-icon">T</span>;
}

export function InboxPage({ holidayRequests = [], currentUser, staffList = baseStaff }) {
  const [items, setItems] = useLocalStorageState(INBOX_STORAGE_KEY, inboxItems);

  const [storedAuditSubmissions] = useLocalStorageState(
    AUDIT_SUBMISSIONS_STORAGE_KEY,
    getDefaultAuditSubmissions()
  );

  const [storedAuditTemplates] = useLocalStorageState(
    AUDIT_TEMPLATES_STORAGE_KEY,
    getDefaultAuditTemplates()
  );

  const [storedTrainingCourses] = useLocalStorageState(
    TRAINING_COURSES_STORAGE_KEY,
    getDefaultTrainingCourses()
  );

  const [storedTrainingRecords] = useLocalStorageState(
    TRAINING_RECORDS_STORAGE_KEY,
    getDefaultTrainingRecords()
  );

  const [storedCarePathways] = useLocalStorageState(
    CARE_NAVIGATION_PATHWAYS_STORAGE_KEY,
    getDefaultCareNavigationPathways()
  );

  const [storedCareNotes] = useLocalStorageState(
    CARE_NAVIGATION_NOTES_STORAGE_KEY,
    getDefaultSampleCareNavigationCalls()
  );

  const [storedFinanceTasks] = useLocalStorageState(
    FINANCE_TASKS_STORAGE_KEY,
    financeTasks
  );

  const [storedInvoiceLines] = useLocalStorageState(
    DISPENSARY_INVOICE_LINES_STORAGE_KEY,
    supplierInvoiceLines
  );

  const [storedModuleSettings] = useLocalStorageState(
    MODULE_SETTINGS_STORAGE_KEY,
    moduleSettings
  );

  const [storedPolicies] = useLocalStorageState(
    COMPLIANCE_POLICIES_STORAGE_KEY,
    getDefaultPolicies()
  );

  const [storedPolicyAcknowledgements] = useLocalStorageState(
    COMPLIANCE_ACKNOWLEDGEMENTS_STORAGE_KEY,
    getDefaultPolicyAcknowledgements()
  );

  const [storedPolicyQuestions] = useLocalStorageState(
    COMPLIANCE_QUESTIONS_STORAGE_KEY,
    getDefaultPolicyQuestions()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedItemId, setSelectedItemId] = useState(inboxItems[0].id);

  const enrichedItems = useMemo(() => enrichInboxItems(items), [items]);

  const filteredItems = useMemo(
    () => filterInboxItems(enrichedItems, searchTerm, activeFilter),
    [enrichedItems, searchTerm, activeFilter]
  );

  const metrics = useMemo(() => getInboxMetrics(items), [items]);

  const generatedAlerts = useMemo(() => {
    const safeAuditSubmissions = Array.isArray(storedAuditSubmissions)
      ? storedAuditSubmissions
      : getDefaultAuditSubmissions();

    const safeAuditTemplates = Array.isArray(storedAuditTemplates)
      ? storedAuditTemplates
      : auditTemplates;

    const safeTrainingCourses = Array.isArray(storedTrainingCourses)
      ? storedTrainingCourses
      : trainingCourses;

    const safeTrainingRecords = Array.isArray(storedTrainingRecords)
      ? storedTrainingRecords
      : trainingRecords;

    const safeCarePathways = Array.isArray(storedCarePathways)
      ? storedCarePathways
      : getDefaultCareNavigationPathways();

    const safeCareNotes = Array.isArray(storedCareNotes)
      ? storedCareNotes
      : getDefaultSampleCareNavigationCalls();

    const safeFinanceTasks = Array.isArray(storedFinanceTasks)
      ? storedFinanceTasks
      : financeTasks;

    const safeModuleSettings = Array.isArray(storedModuleSettings)
      ? storedModuleSettings
      : moduleSettings;

    const safeInvoiceLines = Array.isArray(storedInvoiceLines)
      ? storedInvoiceLines
      : supplierInvoiceLines;

    const safePolicies = Array.isArray(storedPolicies)
      ? storedPolicies
      : getDefaultPolicies();

    const safePolicyAcknowledgements = Array.isArray(storedPolicyAcknowledgements)
      ? storedPolicyAcknowledgements
      : getDefaultPolicyAcknowledgements();

    const safePolicyQuestions = Array.isArray(storedPolicyQuestions)
      ? storedPolicyQuestions
      : getDefaultPolicyQuestions();

    return getAlertsForUser(
      getGeneratedOperationalAlerts({
        holidayRequests,
        staffList,
        auditTemplates: safeAuditTemplates,
        auditSubmissions: safeAuditSubmissions,
        activeFinanceTasks: safeFinanceTasks,
        activeInvoiceLines: safeInvoiceLines,
        activeModuleSettings: safeModuleSettings,
        activePolicies: safePolicies,
        activePolicyAcknowledgements: safePolicyAcknowledgements,
        activePolicyQuestions: safePolicyQuestions,
        activeTrainingCourses: safeTrainingCourses,
        activeTrainingRecords: safeTrainingRecords,
        activeCarePathways: safeCarePathways,
        activeCareNotes: safeCareNotes,
      }),
      currentUser
    );
  }, [
    holidayRequests,
    staffList,
    storedAuditSubmissions,
    storedAuditTemplates,
    storedTrainingCourses,
    storedTrainingRecords,
    storedCarePathways,
    storedCareNotes,
    storedFinanceTasks,
    storedInvoiceLines,
    storedModuleSettings,
    storedPolicies,
    storedPolicyAcknowledgements,
    storedPolicyQuestions,
    currentUser,
  ]);

  const generatedAlertMetrics = useMemo(
    () => getOperationalAlertMetrics(generatedAlerts),
    [generatedAlerts]
  );

  const selectedItem =
    enrichedItems.find((item) => item.id === selectedItemId) || enrichedItems[0];

  function updateItemStatus(itemId, newStatus) {
    setItems((currentItems) =>
      updateInboxItemStatus(currentItems, itemId, newStatus)
    );
  }

  return (
    <>
      <PageHeader eyebrow="Inbox" title="Notification centre">
        Central command centre for reminders, governance alerts, training,
        audits, rota warnings and operational actions.
      </PageHeader>

      <section className="metric-grid">
        <MetricCard
          title="Open items"
          value={metrics.openItems.length}
          detail="Active alerts and tasks"
          icon={Bell}
        />
        <MetricCard
          title="High priority"
          value={metrics.highPriorityItems.length}
          detail="Needs management attention"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Overdue"
          value={metrics.overdueItems.length}
          detail="Past due date"
          icon={Clock}
        />
        <MetricCard
          title="Completed"
          value={metrics.doneItems.length}
          detail="Marked done in this session"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Generated"
          value={generatedAlertMetrics.openAlerts.length}
          detail={`${generatedAlertMetrics.highPriorityAlerts.length} high priority`}
          icon={ShieldCheck}
        />
      </section>

      {metrics.overdueItems.length > 0 ? (
        <AlertBanner
          tone="warning"
          title="Overdue inbox items"
          icon={AlertTriangle}
        >
          {metrics.overdueItems.length} inbox item
          {metrics.overdueItems.length === 1 ? " is" : "s are"} overdue and may
          need management attention.
        </AlertBanner>
      ) : null}

      <section className="content-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Inbox list" title="Action queue">
            Search, filter and select an item. Buttons update mock state and now
            survive refresh using localStorage.
          </SectionHeader>

          <div className="inbox-toolbar">
            <label className="search-input">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search alerts, modules, owners..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <div className="quick-filter-list">
              {inboxQuickFilters.map((filter) => (
                <Button
                  key={filter}
                  type="button"
                  size="sm"
                  variant={activeFilter === filter ? "primary" : "secondary"}
                  className={
                    activeFilter === filter
                      ? "quick-filter quick-filter-active"
                      : "quick-filter"
                  }
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          <DataTable
            columns={[
              { key: "title", label: "Item" },
              { key: "module", label: "Module" },
              { key: "priority", label: "Priority" },
              { key: "assignedTo", label: "Assigned to" },
              { key: "dueDate", label: "Due" },
              { key: "status", label: "Status" },
            ]}
            rows={filteredItems}
            emptyTitle="No inbox items found"
            emptyMessage="Try clearing the search box or changing the quick filter."
            renderCell={(row, key) => {
              if (key === "title") {
                return (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-button"
                    style={{ padding: 0, justifyContent: "flex-start" }}
                    onClick={() => setSelectedItemId(row.id)}
                  >
                    {row.title}
                  </Button>
                );
              }

              if (key === "module" || key === "priority" || key === "status") {
                return <Badge>{row[key]}</Badge>;
              }

              if (key === "dueDate") {
                return (
                  <div className="stacked-cell">
                    <strong>{formatDate(row.dueDate)}</strong>
                    <span>{row.dueText}</span>
                  </div>
                );
              }

              return row[key];
            }}
          />
        </Panel>

        <Panel as="aside" className="panel inbox-detail-panel">
          <SectionHeader eyebrow="Selected item" title={selectedItem.title}>
            {selectedItem.description}
          </SectionHeader>

          <div className="policy-detail-grid">
            <div>
              <span>Module</span>
              <Badge>{selectedItem.module}</Badge>
            </div>
            <div>
              <span>Priority</span>
              <Badge>{selectedItem.priority}</Badge>
            </div>
            <div>
              <span>Type</span>
              <strong>{selectedItem.type}</strong>
            </div>
            <div>
              <span>Status</span>
              <Badge>{selectedItem.status}</Badge>
            </div>
            <div>
              <span>Assigned to</span>
              <strong>{selectedItem.assignedTo}</strong>
            </div>
            <div>
              <span>Due date</span>
              <strong>{formatDate(selectedItem.dueDate)}</strong>
            </div>
            <div>
              <span>Due status</span>
              <strong>{selectedItem.dueText}</strong>
            </div>
            <div>
              <span>Suggested action</span>
              <strong>{selectedItem.action}</strong>
            </div>
          </div>

          <div className="policy-actions">
            <Button
              type="button"
              variant="primary"
              onClick={() => updateItemStatus(selectedItem.id, "Done")}
            >
              Mark done
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => updateItemStatus(selectedItem.id, "Snoozed")}
            >
              Snooze
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => updateItemStatus(selectedItem.id, "Open")}
            >
              Reopen
            </Button>
          </div>
        </Panel>
      </section>

      <Panel className="panel">
        <SectionHeader eyebrow="Generated alerts" title="Live operational inbox">
          These alerts are generated from current workforce, cover, compliance,
          training, audit, finance and governance data.
        </SectionHeader>

        <DataTable
          columns={[
            { key: "title", label: "Alert" },
            { key: "module", label: "Module" },
            { key: "type", label: "Type" },
            { key: "assignedTo", label: "Assigned to" },
            { key: "dueDate", label: "Due" },
            { key: "priority", label: "Priority" },
            { key: "action", label: "Suggested action" },
          ]}
          rows={generatedAlerts}
          emptyTitle="No generated alerts"
          emptyMessage="No live operational alerts are currently being generated for this role."
          renderCell={(row, key) => {
            if (key === "title") {
              return (
                <div className="stacked-cell">
                  <strong>{row.title}</strong>
                  <span>{row.description}</span>
                </div>
              );
            }

            if (key === "module" || key === "type" || key === "priority") {
              return <Badge>{row[key]}</Badge>;
            }

            if (key === "dueDate") {
              return row.dueDate ? (
                <div className="stacked-cell">
                  <strong>{formatDate(row.dueDate)}</strong>
                  <span>{row.dueText}</span>
                </div>
              ) : (
                <span className="muted-text">No due date</span>
              );
            }

            return row[key];
          }}
        />
      </Panel>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Module summary" title="Alerts by module">
            A future version will generate these automatically from each module.
          </SectionHeader>

          <div className="module-alert-grid">
            {[
              "Compliance",
              "Training",
              "Audits",
              "Calendar",
              "Staff",
              "Finance",
              "Care Navigation",
            ].map((moduleName) => {
              const moduleSummary = getInboxModuleSummary(items, moduleName);

              return (
                <div className="module-alert-card" key={moduleName}>
                  <div>
                    <strong>{moduleName}</strong>
                    <span>{moduleSummary.moduleItems.length} open item(s)</span>
                  </div>
                  <Badge>{moduleSummary.riskLabel}</Badge>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Governance" title="Inbox rules planned">
            These rules will decide what appears here automatically.
          </SectionHeader>

          <div className="rule-list">
            <div>
              <ShieldCheck size={18} />
              <span>Overdue policy reviews create high-priority alerts</span>
            </div>
            <div>
              <GraduationMiniIcon />
              <span>Overdue training creates staff-specific reminders</span>
            </div>
            <div>
              <Clock size={18} />
              <span>Daily audits create same-day completion alerts</span>
            </div>
            <div>
              <AlertTriangle size={18} />
              <span>High-risk modules create governance alerts</span>
            </div>
          </div>
        </Panel>
      </section>
    </>
  );
}