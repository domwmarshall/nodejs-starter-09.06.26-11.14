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

function PanelHeader({ eyebrow, title, children, isOpen, onToggle }) {
  return (
    <div className="collapsible-panel-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {children ? <p>{children}</p> : null}
      </div>

      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="panel-toggle-button"
        onClick={onToggle}
      >
        {isOpen ? "Hide" : "Show"}
      </Button>
    </div>
  );
}

function InboxDetailModal({ item, onClose, onStatusChange, mode = "inbox" }) {
  if (!item) return null;

  return (
    <div className="detail-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="detail-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${item.title} details`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="detail-modal-header">
          <div>
            <p className="eyebrow">{mode === "generated" ? "Generated alert" : "Selected item"}</p>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </div>

          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="detail-meta-grid">
          <div>
            <span>Module</span>
            <Badge>{item.module}</Badge>
          </div>
          <div>
            <span>Priority</span>
            <Badge>{item.priority}</Badge>
          </div>
          <div>
            <span>Type</span>
            <strong>{item.type}</strong>
          </div>
          {"status" in item ? (
            <div>
              <span>Status</span>
              <Badge>{item.status}</Badge>
            </div>
          ) : null}
          <div>
            <span>Assigned to</span>
            <strong>{item.assignedTo || "Not assigned"}</strong>
          </div>
          <div>
            <span>Due date</span>
            <strong>{item.dueDate ? formatDate(item.dueDate) : "No due date"}</strong>
          </div>
          <div>
            <span>Due status</span>
            <strong>{item.dueText || "No due status"}</strong>
          </div>
          <div className="detail-meta-wide">
            <span>Suggested action</span>
            <strong>{item.action || "Review and decide next action."}</strong>
          </div>
        </div>

        {mode === "inbox" ? (
          <div className="policy-actions detail-actions">
            <Button
              type="button"
              variant="primary"
              onClick={() => onStatusChange(item.id, "Done")}
            >
              Mark done
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => onStatusChange(item.id, "Snoozed")}
            >
              Snooze
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => onStatusChange(item.id, "Open")}
            >
              Reopen
            </Button>
          </div>
        ) : (
          <div className="policy-actions detail-actions">
            <Button type="button" variant="primary" onClick={onClose}>
              Acknowledge
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Add task
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
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
  const [selectedInboxItem, setSelectedInboxItem] = useState(null);
  const [selectedGeneratedAlert, setSelectedGeneratedAlert] = useState(null);
  const [showActionQueue, setShowActionQueue] = useState(true);
  const [showGeneratedAlerts, setShowGeneratedAlerts] = useState(false);
  const [showModuleSummary, setShowModuleSummary] = useState(false);

  const enrichedItems = useMemo(() => enrichInboxItems(items), [items]);

  const filteredItems = useMemo(
    () => filterInboxItems(enrichedItems, searchTerm, activeFilter).filter((item) => item.status !== "Done"),
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
        A cleaner action workspace. Lists stay compact; click an item to open full detail and actions.
      </PageHeader>

      <section className="metric-grid compact-metric-grid">
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
          {metrics.overdueItems.length === 1 ? " is" : "s are"} overdue.
        </AlertBanner>
      ) : null}

      <Panel className="panel clean-workspace-panel">
        <PanelHeader
          eyebrow="Inbox list"
          title="Action queue"
          isOpen={showActionQueue}
          onToggle={() => setShowActionQueue((current) => !current)}
        >
          Search, filter and open an item for full details and operational actions.
        </PanelHeader>

        {showActionQueue ? (
          <>
            <div className="inbox-toolbar inbox-toolbar-compact">
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

            <div className="clean-action-list">
              {filteredItems.length > 0 ? (
                filteredItems.map((row) => (
                  <button
                    type="button"
                    className={["clean-action-card", selectedItemId === row.id ? "clean-action-card-active" : ""].join(" ")}
                    key={row.id}
                    onClick={() => {
                      setSelectedItemId(row.id);
                      setSelectedInboxItem(row);
                    }}
                  >
                    <div className="clean-action-main">
                      <strong>{row.title}</strong>
                      <span>{row.description}</span>
                    </div>

                    <div className="clean-action-meta">
                      <Badge>{row.module}</Badge>
                      <Badge>{row.priority}</Badge>
                      <span>{formatDate(row.dueDate)}</span>
                      <span>{row.assignedTo}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="quiet-empty-card">
                  <strong>No inbox items found</strong>
                  <span>Try clearing the search box or changing the quick filter.</span>
                </div>
              )}
            </div>
          </>
        ) : null}
      </Panel>

      <Panel className="panel clean-workspace-panel">
        <PanelHeader
          eyebrow="Generated alerts"
          title="Live operational inbox"
          isOpen={showGeneratedAlerts}
          onToggle={() => setShowGeneratedAlerts((current) => !current)}
        >
          Generated alerts are collapsed by default so they do not dominate the workspace.
        </PanelHeader>

        {showGeneratedAlerts ? (
          <div className="clean-action-list generated-alert-list">
            {generatedAlerts.length > 0 ? (
              generatedAlerts.map((row) => (
                <button
                  type="button"
                  className="clean-action-card"
                  key={row.id}
                  onClick={() => setSelectedGeneratedAlert(row)}
                >
                  <div className="clean-action-main">
                    <strong>{row.title}</strong>
                    <span>{row.description}</span>
                  </div>

                  <div className="clean-action-meta">
                    <Badge>{row.module}</Badge>
                    <Badge>{row.type}</Badge>
                    <Badge>{row.priority}</Badge>
                    <span>{row.dueDate ? formatDate(row.dueDate) : "No due date"}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="quiet-empty-card">
                <strong>No generated alerts</strong>
                <span>No live operational alerts are currently being generated for this role.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="collapsed-panel-summary">
            <span>{generatedAlerts.length} generated alert(s)</span>
            <span>{generatedAlertMetrics.highPriorityAlerts.length} high priority</span>
          </div>
        )}
      </Panel>

      <Panel className="panel clean-workspace-panel">
        <PanelHeader
          eyebrow="Module summary"
          title="Alerts by module"
          isOpen={showModuleSummary}
          onToggle={() => setShowModuleSummary((current) => !current)}
        >
          Keep this closed unless you need a module-level breakdown.
        </PanelHeader>

        {showModuleSummary ? (
          <div className="module-alert-grid clean-module-grid">
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
        ) : null}
      </Panel>

      <InboxDetailModal
        item={selectedInboxItem}
        mode="inbox"
        onClose={() => setSelectedInboxItem(null)}
        onStatusChange={(itemId, newStatus) => {
          updateItemStatus(itemId, newStatus);
          if (newStatus === "Done") {
            setSelectedInboxItem(null);
            return;
          }
          setSelectedInboxItem((current) =>
            current && current.id === itemId ? { ...current, status: newStatus } : current
          );
        }}
      />

      <InboxDetailModal
        item={selectedGeneratedAlert}
        mode="generated"
        onClose={() => setSelectedGeneratedAlert(null)}
        onStatusChange={() => {}}
      />
    </>
  );
}
