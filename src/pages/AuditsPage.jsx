import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Clock,
  PlusCircle,
  Search,
  Thermometer,
} from "lucide-react";

import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { DataTable } from "../components/DataTable";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { formatDate } from "../utils/dateUtils";

import {
  AUDIT_SUBMISSIONS_STORAGE_KEY,
  AUDIT_TEMPLATES_STORAGE_KEY,
  addAuditSubmission,
  addAuditTemplate,
  addAuditTemplateQuestion,
  closeAuditAction,
  createAuditSubmission,
  createAuditTemplate,
  enrichAuditTemplates,
  filterAuditTemplates,
  getAuditMetrics,
  getAuditTemplateById,
  getDefaultAuditSubmissions,
  getDefaultAuditTemplates,
  getRecentAuditSubmissions,
  getSafeAuditSubmissions,
  getSafeAuditTemplates,
  getSubmissionsForTemplate,
  updateAuditTemplate,
} from "../services/auditService";

import {
  AlertBanner,
  Button,
  FormField,
  PageHeader,
  Panel,
  fieldClassName,
} from "../components/ui";

export function AuditsPage() {
  const [templates, setTemplates] = useLocalStorageState(
    AUDIT_TEMPLATES_STORAGE_KEY,
    getDefaultAuditTemplates()
  );
  const [submissions, setSubmissions] = useLocalStorageState(
    AUDIT_SUBMISSIONS_STORAGE_KEY,
    getDefaultAuditSubmissions()
  );

  const safeTemplates = useMemo(() => getSafeAuditTemplates(templates), [templates]);
  const safeSubmissions = useMemo(() => getSafeAuditSubmissions(submissions), [submissions]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedTemplateId, setSelectedTemplateId] = useState(safeTemplates[0].id);
  const [completedBy, setCompletedBy] = useState("Dominic Marshall");
  const [issuesFound, setIssuesFound] = useState("No");
  const [actionRequired, setActionRequired] = useState("");
  const [newQuestion, setNewQuestion] = useState("");

  const [newAuditName, setNewAuditName] = useState("Controlled drugs balance check");
  const [newAuditCategory, setNewAuditCategory] = useState("Medicines");
  const [newAuditFrequency, setNewAuditFrequency] = useState("Weekly");
  const [newAuditAssignedTo, setNewAuditAssignedTo] = useState("Dispenser");
  const [newAuditOwner, setNewAuditOwner] = useState("Practice Manager");
  const [newAuditRisk, setNewAuditRisk] = useState("High");
  const [newAuditNextDue, setNewAuditNextDue] = useState("2026-06-12");
  const [newAuditDescription, setNewAuditDescription] = useState("Check controlled drug stock balance and discrepancy log.");
  const [newAuditEvidence, setNewAuditEvidence] = useState("Balance check, discrepancy action and sign-off");

  const enrichedTemplates = useMemo(() => enrichAuditTemplates(safeTemplates), [safeTemplates]);

  const selectedTemplate = useMemo(
    () => getAuditTemplateById(safeTemplates, selectedTemplateId),
    [safeTemplates, selectedTemplateId]
  );

  const filteredTemplates = useMemo(
    () => filterAuditTemplates(enrichedTemplates, searchTerm, statusFilter),
    [enrichedTemplates, searchTerm, statusFilter]
  );

  const metrics = useMemo(
    () => getAuditMetrics(safeTemplates, safeSubmissions),
    [safeTemplates, safeSubmissions]
  );

  const selectedTemplateSubmissions = useMemo(
    () => getSubmissionsForTemplate(safeSubmissions, selectedTemplate.id),
    [safeSubmissions, selectedTemplate.id]
  );

  const recentSubmissions = useMemo(
    () => getRecentAuditSubmissions(safeSubmissions),
    [safeSubmissions]
  );

  function submitMockAudit(event) {
    event.preventDefault();

    const newSubmission = createAuditSubmission({
      template: selectedTemplate,
      completedBy,
      issuesFound,
      actionRequired,
    });

    setSubmissions((currentSubmissions) => addAuditSubmission(currentSubmissions, newSubmission));
    setTemplates((currentTemplates) =>
      updateAuditTemplate(currentTemplates, selectedTemplate.id, {
        status: issuesFound === "Yes" ? "Due soon" : "Up to date",
        nextDue: selectedTemplate.nextDue,
      })
    );
    setActionRequired("");
    setIssuesFound("No");
  }

  function submitAuditTemplate(event) {
    event.preventDefault();

    const newTemplate = createAuditTemplate({
      name: newAuditName,
      category: newAuditCategory,
      frequency: newAuditFrequency,
      assignedTo: newAuditAssignedTo,
      owner: newAuditOwner,
      risk: newAuditRisk,
      nextDue: newAuditNextDue,
      description: newAuditDescription,
      requiredEvidence: newAuditEvidence,
    });

    setTemplates((currentTemplates) => addAuditTemplate(currentTemplates, newTemplate));
    setSelectedTemplateId(newTemplate.id);
    setNewAuditName("");
  }

  function addQuestion(event) {
    event.preventDefault();
    setTemplates((currentTemplates) => addAuditTemplateQuestion(currentTemplates, selectedTemplate.id, newQuestion));
    setNewQuestion("");
  }

  function markSelectedUpToDate() {
    setTemplates((currentTemplates) =>
      updateAuditTemplate(currentTemplates, selectedTemplate.id, {
        status: "Up to date",
        nextDue: selectedTemplate.nextDue,
      })
    );
  }

  function resetAudits() {
    const confirmed = window.confirm("Reset audit templates and submissions to demo data?");
    if (!confirmed) return;
    setTemplates(getDefaultAuditTemplates());
    setSubmissions(getDefaultAuditSubmissions());
    setSelectedTemplateId(getDefaultAuditTemplates()[0].id);
  }

  return (
    <>
      <PageHeader eyebrow="Audits" title="Audit engine">
        Create audit templates, add checklist questions, submit audits, close
        actions and feed exceptions into the Dashboard and Inbox.
      </PageHeader>

      <section className="metric-grid">
        <MetricCard title="Templates" value={enrichedTemplates.length} detail="Active audit templates" icon={ClipboardCheck} />
        <MetricCard title="Due soon" value={metrics.dueSoonAudits.length} detail="Upcoming audit checks" icon={Clock} />
        <MetricCard title="Overdue" value={metrics.overdueAudits.length} detail="Requires escalation" icon={AlertTriangle} />
        <MetricCard title="Actions" value={metrics.actionRequiredSubmissions.length} detail="Submissions needing action" icon={Thermometer} />
      </section>

      {metrics.overdueAudits.length > 0 ? (
        <AlertBanner tone="danger" title="Overdue audits" icon={AlertTriangle}>
          {metrics.overdueAudits.length} audit{metrics.overdueAudits.length === 1 ? " is" : "s are"} overdue and should be escalated.
        </AlertBanner>
      ) : null}

      {metrics.actionRequiredSubmissions.length > 0 ? (
        <AlertBanner tone="warning" title="Audit actions required" icon={Thermometer}>
          {metrics.actionRequiredSubmissions.length} submitted audit{metrics.actionRequiredSubmissions.length === 1 ? " needs" : "s need"} follow-up action.
        </AlertBanner>
      ) : null}

      <section className="content-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Template library" title="Audit templates">
            Search, filter and select an audit template. Templates are now
            persistent and editable.
          </SectionHeader>

          <div className="compliance-toolbar">
            <label className="search-input">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search audits, owners, categories..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <label className="filter-select">
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option>All</option>
                <option>Overdue</option>
                <option>Due soon</option>
                <option>Up to date</option>
                <option>Retired</option>
              </select>
            </label>
          </div>

          <DataTable
            columns={[
              { key: "name", label: "Audit" },
              { key: "category", label: "Category" },
              { key: "frequency", label: "Frequency" },
              { key: "assignedTo", label: "Assigned to" },
              { key: "nextDue", label: "Next due" },
              { key: "status", label: "Status" },
              { key: "risk", label: "Risk" },
            ]}
            rows={filteredTemplates}
            emptyTitle="No audit templates found"
            emptyMessage="Try clearing the search box or changing the status filter."
            renderCell={(row, key) => {
              if (key === "name") {
                return (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-button"
                    style={{ padding: 0, justifyContent: "flex-start" }}
                    onClick={() => setSelectedTemplateId(row.id)}
                  >
                    {row.name}
                  </Button>
                );
              }

              if (key === "nextDue") {
                return (
                  <div className="stacked-cell">
                    <strong>{formatDate(row.nextDue)}</strong>
                    <span>{row.dueText}</span>
                  </div>
                );
              }

              if (key === "status") return <Badge>{row.status}</Badge>;
              if (key === "risk") return <Badge>{row.risk} risk</Badge>;

              return row[key];
            }}
          />
        </Panel>

        <Panel as="aside" className="panel policy-detail-panel">
          <SectionHeader eyebrow="Selected audit" title={selectedTemplate.name}>
            {selectedTemplate.description}
          </SectionHeader>

          <div className="policy-detail-grid">
            <div><span>Category</span><strong>{selectedTemplate.category}</strong></div>
            <div><span>Frequency</span><strong>{selectedTemplate.frequency}</strong></div>
            <div><span>Assigned to</span><strong>{selectedTemplate.assignedTo}</strong></div>
            <div><span>Owner</span><strong>{selectedTemplate.owner}</strong></div>
            <div><span>Risk</span><Badge>{selectedTemplate.risk} risk</Badge></div>
            <div><span>Status</span><Badge>{selectedTemplate.status}</Badge></div>
            <div><span>Required evidence</span><strong>{selectedTemplate.requiredEvidence}</strong></div>
            <div><span>Submissions</span><strong>{selectedTemplateSubmissions.length}</strong></div>
          </div>

          <div className="policy-actions">
            <Button type="button" variant="primary" onClick={markSelectedUpToDate}>Mark up to date</Button>
            <Button type="button" variant="secondary" onClick={() => setTemplates((currentTemplates) => updateAuditTemplate(currentTemplates, selectedTemplate.id, { status: "Retired" }))}>Retire</Button>
            <Button type="button" variant="secondary" onClick={resetAudits}>Reset demo</Button>
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Audit builder" title="Create new audit template">
            Create templates for fire safety, fridge checks, legionella, CD checks,
            premises inspections or any local governance task.
          </SectionHeader>

          <form className="audit-submit-form" onSubmit={submitAuditTemplate}>
            <FormField label="Audit name"><input className={fieldClassName} value={newAuditName} onChange={(event) => setNewAuditName(event.target.value)} /></FormField>
            <FormField label="Category"><input className={fieldClassName} value={newAuditCategory} onChange={(event) => setNewAuditCategory(event.target.value)} /></FormField>
            <FormField label="Frequency"><select className={fieldClassName} value={newAuditFrequency} onChange={(event) => setNewAuditFrequency(event.target.value)}><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Quarterly</option><option>Annual</option></select></FormField>
            <FormField label="Assigned to"><input className={fieldClassName} value={newAuditAssignedTo} onChange={(event) => setNewAuditAssignedTo(event.target.value)} /></FormField>
            <FormField label="Owner"><input className={fieldClassName} value={newAuditOwner} onChange={(event) => setNewAuditOwner(event.target.value)} /></FormField>
            <FormField label="Risk"><select className={fieldClassName} value={newAuditRisk} onChange={(event) => setNewAuditRisk(event.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></FormField>
            <FormField label="Next due"><input className={fieldClassName} type="date" value={newAuditNextDue} onChange={(event) => setNewAuditNextDue(event.target.value)} /></FormField>
            <FormField label="Description"><textarea className={fieldClassName} value={newAuditDescription} onChange={(event) => setNewAuditDescription(event.target.value)} /></FormField>
            <FormField label="Required evidence"><textarea className={fieldClassName} value={newAuditEvidence} onChange={(event) => setNewAuditEvidence(event.target.value)} /></FormField>
            <Button type="submit" variant="primary" leftIcon={PlusCircle}>Create audit template</Button>
          </form>
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Submit" title="Complete selected audit">
            Submit an audit and create follow-up actions when issues are found.
          </SectionHeader>

          <form className="audit-submit-form" onSubmit={submitMockAudit}>
            <FormField label="Completed by"><select className={fieldClassName} value={completedBy} onChange={(event) => setCompletedBy(event.target.value)}><option>Dominic Marshall</option><option>Nurse User</option><option>Reception User</option><option>Dispenser User</option><option>Admin User</option></select></FormField>
            <FormField label="Issues found?"><select className={fieldClassName} value={issuesFound} onChange={(event) => setIssuesFound(event.target.value)}><option>No</option><option>Yes</option></select></FormField>
            <FormField label="Action required"><textarea className={fieldClassName} value={actionRequired} onChange={(event) => setActionRequired(event.target.value)} placeholder="Enter action required if any issues were found" /></FormField>
            <Button type="submit" variant="primary">Submit audit</Button>
          </form>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Checklist" title="Selected audit questions">
            Add questions to shape the audit completion workflow.
          </SectionHeader>

          <form className="inline-form" onSubmit={addQuestion}>
            <input value={newQuestion} onChange={(event) => setNewQuestion(event.target.value)} placeholder="Add checklist question" />
            <Button type="submit" variant="primary">Add</Button>
          </form>

          <div className="question-list dashboard-section-spacing">
            {selectedTemplate.questions.map((question, index) => (
              <div className="question-item" key={`${question}-${index}`}>
                <strong>{index + 1}. {question}</strong>
                <Badge>Required</Badge>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Exceptions" title="Action required">
            Close audit actions when follow-up has been completed.
          </SectionHeader>

          <div className="governance-alert-grid">
            {metrics.actionRequiredSubmissions.length === 0 ? (
              <div className="empty-state"><strong>No audit actions</strong><span>No submitted audits currently require action.</span></div>
            ) : (
              metrics.actionRequiredSubmissions.map((submission) => (
                <div className="governance-alert" key={submission.id}>
                  <div>
                    <strong>{submission.auditName}</strong>
                    <span>{submission.completedBy} · {formatDate(submission.completedDate)} · {submission.actionRequired}</span>
                  </div>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setSubmissions((currentSubmissions) => closeAuditAction(currentSubmissions, submission.id))}>Close</Button>
                </div>
              ))
            )}
          </div>
        </Panel>
      </section>

      <Panel className="panel">
        <SectionHeader eyebrow="Submissions" title="Recent audit submissions">
          These audit records are stored in browser localStorage and now generate alerts.
        </SectionHeader>

        <DataTable
          columns={[
            { key: "auditName", label: "Audit" },
            { key: "completedBy", label: "Completed by" },
            { key: "completedDate", label: "Date" },
            { key: "result", label: "Result" },
            { key: "issuesFound", label: "Issues" },
            { key: "actionRequired", label: "Action required" },
          ]}
          rows={recentSubmissions}
          emptyTitle="No audit submissions"
          emptyMessage="Submit an audit completion to create your first audit record."
          renderCell={(row, key) => {
            if (key === "auditName") return <strong>{row.auditName}</strong>;
            if (key === "completedDate") return formatDate(row.completedDate);
            if (key === "result" || key === "issuesFound") return <Badge>{row[key]}</Badge>;
            return row[key];
          }}
        />
      </Panel>
    </>
  );
}
