import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { DataTable } from "../components/DataTable";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { formatDate } from "../utils/dateUtils";

import { staff as baseStaff } from "../data/staff";

import {
  COMPLIANCE_ACKNOWLEDGEMENTS_STORAGE_KEY,
  COMPLIANCE_POLICIES_STORAGE_KEY,
  COMPLIANCE_QUESTIONS_STORAGE_KEY,
  addPolicy,
  addPolicyQuestion,
  completePolicyAcknowledgement,
  createPolicyDraft,
  createPolicyQuestion,
  enrichPolicies,
  filterPolicies,
  getAcknowledgementsForPolicy,
  getComplianceMetrics,
  getDefaultPolicies,
  getDefaultPolicyAcknowledgements,
  getDefaultPolicyQuestions,
  getPolicyById,
  getPolicyQuestions,
  getRoleAudienceOptions,
  getTargetRolesForAudience,
  markPolicyReviewed,
  reopenPolicyAcknowledgement,
  updatePolicy,
} from "../services/complianceService";

import {
  AlertBanner,
  Button,
  FormField,
  PageHeader,
  Panel,
  fieldClassName,
} from "../components/ui";

const defaultPolicyForm = {
  name: "",
  category: "Governance",
  owner: "Practice Manager",
  risk: "Medium",
  targetAudience: "All staff",
  documentType: "Policy",
  version: "v1.0",
  nextReviewMonths: 12,
  summary: "",
};

export function CompliancePage({ currentUser, staffList = baseStaff }) {
  const [policyList, setPolicyList] = useLocalStorageState(
    COMPLIANCE_POLICIES_STORAGE_KEY,
    getDefaultPolicies()
  );
  const [acknowledgements, setAcknowledgements] = useLocalStorageState(
    COMPLIANCE_ACKNOWLEDGEMENTS_STORAGE_KEY,
    getDefaultPolicyAcknowledgements()
  );
  const [questionList, setQuestionList] = useLocalStorageState(
    COMPLIANCE_QUESTIONS_STORAGE_KEY,
    getDefaultPolicyQuestions()
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [audienceFilter, setAudienceFilter] = useState("All");
  const [selectedPolicyId, setSelectedPolicyId] = useState(
    getDefaultPolicies()[0].id
  );
  const [policyForm, setPolicyForm] = useState(defaultPolicyForm);
  const [questionText, setQuestionText] = useState("");
  const [answerType, setAnswerType] = useState("Short answer");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [ackStaffName, setAckStaffName] = useState(staffList[0]?.name || "");

  const metrics = useMemo(
    () => getComplianceMetrics(policyList, acknowledgements, staffList),
    [policyList, acknowledgements, staffList]
  );

  const enrichedPolicies = useMemo(
    () => enrichPolicies(policyList, metrics.acknowledgementMatrix),
    [policyList, metrics.acknowledgementMatrix]
  );

  const filteredPolicies = useMemo(
    () => filterPolicies(enrichedPolicies, searchTerm, statusFilter, audienceFilter),
    [enrichedPolicies, searchTerm, statusFilter, audienceFilter]
  );

  const selectedPolicy = useMemo(
    () => getPolicyById(policyList, selectedPolicyId, metrics.acknowledgementMatrix),
    [policyList, selectedPolicyId, metrics.acknowledgementMatrix]
  );

  const selectedAcknowledgements = useMemo(
    () =>
      getAcknowledgementsForPolicy(
        selectedPolicy.id,
        acknowledgements,
        staffList,
        policyList
      ),
    [selectedPolicy.id, acknowledgements, staffList, policyList]
  );

  const selectedQuestions = useMemo(
    () => getPolicyQuestions(selectedPolicy.id, questionList),
    [selectedPolicy.id, questionList]
  );

  const targetAudienceOptions = getRoleAudienceOptions();
  const selectedStaffForAcknowledgement = staffList.find(
    (person) => person.name === ackStaffName
  );
  const selectedStaffAlreadyRequired = selectedAcknowledgements.some(
    (item) => item.staffName === ackStaffName
  );

  function updatePolicyFormField(fieldName, value) {
    setPolicyForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
  }

  function submitPolicy(event) {
    event.preventDefault();

    if (!policyForm.name.trim()) {
      alert("Please enter a policy name.");
      return;
    }

    const newPolicy = createPolicyDraft(policyForm);
    setPolicyList((currentPolicies) => addPolicy(currentPolicies, newPolicy));
    setSelectedPolicyId(newPolicy.id);
    setPolicyForm(defaultPolicyForm);
  }

  function submitQuestion(event) {
    event.preventDefault();

    if (!questionText.trim()) {
      alert("Please enter a question.");
      return;
    }

    const newQuestion = createPolicyQuestion({
      policyId: selectedPolicy.id,
      question: questionText,
      answerType,
      correctAnswer,
    });

    setQuestionList((currentQuestions) =>
      addPolicyQuestion(currentQuestions, newQuestion)
    );
    setQuestionText("");
    setCorrectAnswer("");
  }

  function updateSelectedPolicyField(fieldName, value) {
    setPolicyList((currentPolicies) =>
      updatePolicy(currentPolicies, selectedPolicy.id, {
        [fieldName]: value,
      })
    );
  }

  function completeAcknowledgementForStaff(staffName) {
    const staffMember = staffList.find((person) => person.name === staffName);

    if (!staffMember) return;

    const score = selectedQuestions.length
      ? `${selectedQuestions.length}/${selectedQuestions.length}`
      : "Acknowledged";

    setAcknowledgements((currentAcknowledgements) =>
      completePolicyAcknowledgement(currentAcknowledgements, {
        policyId: selectedPolicy.id,
        policyName: selectedPolicy.name,
        staffName: staffMember.name,
        role: staffMember.role,
        score,
      })
    );
  }

  function reopenAcknowledgementForStaff(staffName) {
    setAcknowledgements((currentAcknowledgements) =>
      reopenPolicyAcknowledgement(
        currentAcknowledgements,
        selectedPolicy.id,
        staffName
      )
    );
  }

  function resetComplianceDemoData() {
    const confirmed = window.confirm(
      "Reset policy register, questionnaire questions and acknowledgements back to the demo data?"
    );

    if (!confirmed) return;

    setPolicyList(getDefaultPolicies());
    setAcknowledgements(getDefaultPolicyAcknowledgements());
    setQuestionList(getDefaultPolicyQuestions());
    setSelectedPolicyId(getDefaultPolicies()[0].id);
  }

  return (
    <>
      <PageHeader eyebrow="Compliance" title="Policy, SOP and acknowledgement engine">
        Create controlled documents, target them to staff roles, add knowledge-check
        questions, record acknowledgements and generate policy review reminders.
      </PageHeader>

      <section className="metric-grid">
        <MetricCard
          title="Documents"
          value={enrichedPolicies.length}
          detail="Policies and SOPs"
          icon={FileText}
        />
        <MetricCard
          title="Due soon"
          value={metrics.dueSoonPolicies.length}
          detail="Need owner review"
          icon={Clock}
        />
        <MetricCard
          title="Overdue"
          value={metrics.overduePolicies.length}
          detail="Requires escalation"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Acknowledgement"
          value={`${metrics.averageAcknowledgement}%`}
          detail={`${metrics.pendingAcknowledgements.length} pending staff actions`}
          icon={CheckCircle2}
        />
      </section>

      {metrics.overduePolicies.length > 0 ? (
        <AlertBanner
          tone="danger"
          title="Overdue policy reviews"
          icon={AlertTriangle}
        >
          {metrics.overduePolicies.length} policy review
          {metrics.overduePolicies.length === 1 ? " is" : "s are"} overdue and
          should be escalated to the document owner.
        </AlertBanner>
      ) : null}

      {metrics.pendingAcknowledgements.length > 0 ? (
        <AlertBanner
          tone="warning"
          title="Staff acknowledgements outstanding"
          icon={UserCheck}
        >
          {metrics.pendingAcknowledgements.length} role-based acknowledgement
          {metrics.pendingAcknowledgements.length === 1 ? " is" : "s are"} still
          pending across the policy register.
        </AlertBanner>
      ) : null}

      <section className="content-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Policy register" title="Controlled document library">
            Search, filter and select documents. The acknowledgement percentage is
            now calculated from role-targeted staff completion records.
          </SectionHeader>

          <div className="compliance-toolbar compliance-toolbar-three">
            <label className="search-input">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search policies, owners, categories..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <label className="filter-select">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option>All</option>
                <option>Draft</option>
                <option>Approved</option>
                <option>Due soon</option>
                <option>Overdue</option>
              </select>
            </label>

            <label className="filter-select">
              Audience
              <select
                value={audienceFilter}
                onChange={(event) => setAudienceFilter(event.target.value)}
              >
                <option>All</option>
                {targetAudienceOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <DataTable
            columns={[
              { key: "name", label: "Document" },
              { key: "category", label: "Category" },
              { key: "targetAudience", label: "Audience" },
              { key: "owner", label: "Owner" },
              { key: "reviewDue", label: "Review due" },
              { key: "acknowledgement", label: "Ack" },
              { key: "computedStatus", label: "Status" },
              { key: "risk", label: "Risk" },
            ]}
            rows={filteredPolicies}
            emptyTitle="No policies found"
            emptyMessage="Try clearing the search box or changing the filters."
            renderCell={(row, key) => {
              if (key === "name") {
                return (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-button"
                    style={{ padding: 0, justifyContent: "flex-start" }}
                    onClick={() => setSelectedPolicyId(row.id)}
                  >
                    {row.name}
                  </Button>
                );
              }

              if (key === "reviewDue") {
                return (
                  <div className="stacked-cell">
                    <strong>{formatDate(row.reviewDue)}</strong>
                    <span>
                      {row.daysUntilReview < 0
                        ? `${Math.abs(row.daysUntilReview)} days overdue`
                        : `${row.daysUntilReview} days remaining`}
                    </span>
                  </div>
                );
              }

              if (key === "acknowledgement") {
                return (
                  <div className="stacked-cell">
                    <strong>{row.acknowledgement}%</strong>
                    <span>
                      {row.completedCount}/{row.totalRequired} complete
                    </span>
                  </div>
                );
              }

              if (
                key === "computedStatus" ||
                key === "risk" ||
                key === "targetAudience"
              ) {
                return (
                  <Badge>{key === "risk" ? `${row.risk} risk` : row[key]}</Badge>
                );
              }

              return row[key];
            }}
          />
        </Panel>

        <Panel as="aside" className="panel policy-detail-panel">
          <SectionHeader eyebrow="Selected document" title={selectedPolicy.name}>
            {selectedPolicy.summary}
          </SectionHeader>

          <div className="policy-detail-grid">
            <div>
              <span>Version</span>
              <strong>{selectedPolicy.version}</strong>
            </div>
            <div>
              <span>Owner</span>
              <strong>{selectedPolicy.owner}</strong>
            </div>
            <div>
              <span>Category</span>
              <strong>{selectedPolicy.category}</strong>
            </div>
            <div>
              <span>Audience</span>
              <Badge>{selectedPolicy.targetAudience}</Badge>
            </div>
            <div>
              <span>Target roles</span>
              <strong>{selectedPolicy.targetRoles.join(", ")}</strong>
            </div>
            <div>
              <span>Risk</span>
              <Badge>{selectedPolicy.risk} risk</Badge>
            </div>
            <div>
              <span>Last reviewed</span>
              <strong>{formatDate(selectedPolicy.lastReviewed)}</strong>
            </div>
            <div>
              <span>Next review</span>
              <strong>{formatDate(selectedPolicy.reviewDue)}</strong>
            </div>
            <div>
              <span>Questionnaire questions</span>
              <strong>{selectedQuestions.length}</strong>
            </div>
            <div>
              <span>Acknowledgement</span>
              <strong>{selectedPolicy.acknowledgement}%</strong>
            </div>
          </div>

          <div className="policy-actions">
            <Button
              type="button"
              variant="primary"
              onClick={() =>
                setPolicyList((currentPolicies) =>
                  markPolicyReviewed(
                    currentPolicies,
                    selectedPolicy.id,
                    currentUser?.name || "Practice Manager"
                  )
                )
              }
            >
              Mark reviewed
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => updateSelectedPolicyField("status", "Approved")}
            >
              Approve
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={resetComplianceDemoData}
            >
              Reset compliance demo
            </Button>
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Create" title="Add policy or SOP">
            Add a new controlled document and assign it to a staff audience. This
            is stored in browser localStorage for now.
          </SectionHeader>

          <form className="compliance-create-form" onSubmit={submitPolicy}>
            <div className="form-grid">
              <FormField label="Document name">
                <input
                  className={fieldClassName}
                  type="text"
                  value={policyForm.name}
                  onChange={(event) => updatePolicyFormField("name", event.target.value)}
                  placeholder="Example: Sharps Safety SOP"
                />
              </FormField>

              <FormField label="Category">
                <select
                  className={fieldClassName}
                  value={policyForm.category}
                  onChange={(event) => updatePolicyFormField("category", event.target.value)}
                >
                  <option>Governance</option>
                  <option>Health & Safety</option>
                  <option>Clinical Governance</option>
                  <option>Medicines Management</option>
                  <option>Information Governance</option>
                  <option>HR</option>
                  <option>Dispensary</option>
                </select>
              </FormField>

              <FormField label="Owner">
                <select
                  className={fieldClassName}
                  value={policyForm.owner}
                  onChange={(event) => updatePolicyFormField("owner", event.target.value)}
                >
                  <option>Practice Manager</option>
                  <option>Clinical Lead</option>
                  <option>Nursing Lead</option>
                  <option>Dispensary Lead</option>
                  <option>GP Partner</option>
                </select>
              </FormField>

              <FormField label="Audience">
                <select
                  className={fieldClassName}
                  value={policyForm.targetAudience}
                  onChange={(event) =>
                    updatePolicyFormField("targetAudience", event.target.value)
                  }
                >
                  {targetAudienceOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Risk">
                <select
                  className={fieldClassName}
                  value={policyForm.risk}
                  onChange={(event) => updatePolicyFormField("risk", event.target.value)}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </FormField>

              <FormField label="Review cycle">
                <select
                  className={fieldClassName}
                  value={policyForm.nextReviewMonths}
                  onChange={(event) =>
                    updatePolicyFormField("nextReviewMonths", event.target.value)
                  }
                >
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                </select>
              </FormField>
            </div>

            <FormField label="Summary">
              <textarea
                className={fieldClassName}
                value={policyForm.summary}
                onChange={(event) => updatePolicyFormField("summary", event.target.value)}
                placeholder="Briefly describe what the document controls."
              />
            </FormField>

            <div className="policy-actions">
              <Button type="submit" variant="primary">
                Add document
              </Button>
            </div>
          </form>
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Edit selected" title="Review controls">
            Amend the owner, risk, target audience and review date for the
            selected document.
          </SectionHeader>

          <div className="form-grid">
            <FormField label="Owner">
              <select
                className={fieldClassName}
                value={selectedPolicy.owner}
                onChange={(event) => updateSelectedPolicyField("owner", event.target.value)}
              >
                <option>Practice Manager</option>
                <option>Clinical Lead</option>
                <option>Nursing Lead</option>
                <option>Dispensary Lead</option>
                <option>GP Partner</option>
              </select>
            </FormField>

            <FormField label="Risk">
              <select
                className={fieldClassName}
                value={selectedPolicy.risk}
                onChange={(event) => updateSelectedPolicyField("risk", event.target.value)}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </FormField>

            <FormField label="Audience">
              <select
                className={fieldClassName}
                value={selectedPolicy.targetAudience}
                onChange={(event) =>
                  updateSelectedPolicyField("targetAudience", event.target.value)
                }
              >
                {targetAudienceOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Review due">
              <input
                className={fieldClassName}
                type="date"
                value={selectedPolicy.reviewDue}
                onChange={(event) => updateSelectedPolicyField("reviewDue", event.target.value)}
              />
            </FormField>
          </div>

          <div className="blue-box compliance-target-box">
            <strong>Target roles</strong>
            <p>{getTargetRolesForAudience(selectedPolicy.targetAudience).join(", ")}</p>
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Questionnaire" title="Knowledge-check questions">
            Add questions that staff must answer before they can acknowledge the
            selected policy.
          </SectionHeader>

          <form className="compliance-question-form" onSubmit={submitQuestion}>
            <FormField label="Question">
              <input
                className={fieldClassName}
                type="text"
                value={questionText}
                onChange={(event) => setQuestionText(event.target.value)}
                placeholder="Example: Who do staff report an incident to?"
              />
            </FormField>

            <div className="form-grid">
              <FormField label="Answer type">
                <select
                  className={fieldClassName}
                  value={answerType}
                  onChange={(event) => setAnswerType(event.target.value)}
                >
                  <option>Short answer</option>
                  <option>Multiple choice</option>
                  <option>True / false</option>
                  <option>Manager marked</option>
                </select>
              </FormField>

              <FormField label="Model answer / pass criteria">
                <input
                  className={fieldClassName}
                  type="text"
                  value={correctAnswer}
                  onChange={(event) => setCorrectAnswer(event.target.value)}
                  placeholder="Optional pass criteria"
                />
              </FormField>
            </div>

            <Button type="submit" variant="primary">
              Add question
            </Button>
          </form>

          <div className="question-list compliance-section-spacing">
            {selectedQuestions.length === 0 ? (
              <div className="empty-state">
                <strong>No questions yet</strong>
                <span>Add questionnaire questions for this policy.</span>
              </div>
            ) : (
              selectedQuestions.map((question) => (
                <div className="question-item" key={question.id || question.question}>
                  <div>
                    <strong>{question.question}</strong>
                    <span>{question.correctAnswer}</span>
                  </div>
                  <Badge>{question.answerType}</Badge>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Acknowledgement" title="Complete staff acknowledgement">
            Simulate the staff questionnaire pass and acknowledgement workflow for
            the selected document.
          </SectionHeader>

          <FormField label="Staff member">
            <select
              className={fieldClassName}
              value={ackStaffName}
              onChange={(event) => setAckStaffName(event.target.value)}
            >
              {staffList.map((person) => (
                <option key={person.name}>{person.name}</option>
              ))}
            </select>
          </FormField>

          <div className="blue-box compliance-target-box">
            <strong>
              {selectedStaffAlreadyRequired ? "Required for this policy" : "Not in target audience"}
            </strong>
            <p>
              {selectedStaffForAcknowledgement?.name || "Staff member"} · {selectedStaffForAcknowledgement?.role || "Unknown role"}
            </p>
          </div>

          <div className="policy-actions">
            <Button
              type="button"
              variant="primary"
              disabled={!selectedStaffAlreadyRequired}
              onClick={() => completeAcknowledgementForStaff(ackStaffName)}
            >
              Complete acknowledgement
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!selectedStaffAlreadyRequired}
              onClick={() => reopenAcknowledgementForStaff(ackStaffName)}
            >
              Reopen
            </Button>
          </div>
        </Panel>
      </section>

      <Panel className="panel">
        <SectionHeader eyebrow="Acknowledgements" title="Role-targeted staff completion matrix">
          This table is generated from the selected policy audience and current
          staff roles. It is the start of a real compliance workflow.
        </SectionHeader>

        <DataTable
          columns={[
            { key: "staffName", label: "Staff member" },
            { key: "role", label: "Role" },
            { key: "status", label: "Status" },
            { key: "questionnaireScore", label: "Score" },
            { key: "date", label: "Date" },
            { key: "actions", label: "Actions" },
          ]}
          rows={selectedAcknowledgements}
          emptyTitle="No target staff"
          emptyMessage="No staff currently match this policy audience."
          renderCell={(row, key) => {
            if (key === "staffName") return <strong>{row.staffName}</strong>;
            if (key === "status") return <Badge>{row.status}</Badge>;
            if (key === "date") return row.date === "Not completed" ? row.date : formatDate(row.date);
            if (key === "actions") {
              return (
                <div className="action-buttons">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => completeAcknowledgementForStaff(row.staffName)}
                  >
                    Complete
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => reopenAcknowledgementForStaff(row.staffName)}
                  >
                    Reopen
                  </Button>
                </div>
              );
            }
            return row[key];
          }}
        />
      </Panel>

      <Panel className="panel">
        <SectionHeader eyebrow="Governance alerts" title="What needs attention">
          These alerts now feed into the generated Dashboard and Inbox alert
          layer, including low acknowledgement coverage.
        </SectionHeader>

        <div className="governance-alert-grid">
          {metrics.governanceAlerts.map((policy) => (
            <div className="governance-alert" key={policy.id}>
              <div>
                <strong>{policy.name}</strong>
                <span>
                  {policy.computedStatus} · {policy.acknowledgement}% acknowledged · {policy.pendingCount} pending · {policy.risk} risk
                </span>
              </div>
              <Badge>{policy.computedStatus}</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
