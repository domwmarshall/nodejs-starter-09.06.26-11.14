import {
  policies,
  staffPolicyAcknowledgements,
  policyQuestionExamples,
} from "../data/compliance";

import { daysUntil, getReviewStatus } from "../utils/dateUtils";

export const COMPLIANCE_POLICIES_STORAGE_KEY = "gpop-compliance-policies";
export const COMPLIANCE_ACKNOWLEDGEMENTS_STORAGE_KEY =
  "gpop-compliance-acknowledgements";
export const COMPLIANCE_QUESTIONS_STORAGE_KEY = "gpop-compliance-questions";

const ROLE_GROUPS = {
  "All staff": [
    "Practice Manager",
    "GP Partner",
    "GP",
    "Reception / Care Navigator",
    "Practice Nurse",
    "Dispenser",
    "Pharmacist",
  ],
  Management: ["Practice Manager", "GP Partner"],
  Clinical: ["GP Partner", "GP", "Practice Nurse", "Pharmacist"],
  Reception: ["Reception / Care Navigator"],
  Nursing: ["Practice Nurse"],
  Dispensary: ["Dispenser", "Pharmacist"],
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(dateString, months) {
  const baseDate = dateString ? new Date(`${dateString}T12:00:00`) : new Date();
  baseDate.setMonth(baseDate.getMonth() + Number(months || 12));
  return baseDate.toISOString().slice(0, 10);
}

function normalisePolicy(policy, index = 0) {
  const targetAudience =
    policy.targetAudience ||
    policy.targetRole ||
    (policy.category === "Medicines Management" ? "Clinical" : "All staff");

  return {
    id: policy.id || `policy-${Date.now()}-${index}`,
    name: policy.name || "Untitled policy",
    category: policy.category || "Governance",
    owner: policy.owner || "Practice Manager",
    reviewDue: policy.reviewDue || addMonths(todayIso(), 12),
    lastReviewed: policy.lastReviewed || todayIso(),
    acknowledgement: Number(policy.acknowledgement || 0),
    questionnaire: policy.questionnaire || "Enabled",
    status: policy.status || "Approved",
    risk: policy.risk || "Medium",
    version: policy.version || "v1.0",
    summary: policy.summary || "No summary added yet.",
    reminderSchedule:
      policy.reminderSchedule || "60, 30, 14 and 7 days before review",
    targetAudience,
    targetRoles: policy.targetRoles || ROLE_GROUPS[targetAudience] || [targetAudience],
    documentType: policy.documentType || "Policy",
    evidenceRequired:
      policy.evidenceRequired || "Questionnaire pass and staff acknowledgement",
  };
}

export function getDefaultPolicies() {
  return policies.map((policy, index) => normalisePolicy(policy, index));
}

export function getDefaultPolicyAcknowledgements() {
  return staffPolicyAcknowledgements.map((item, index) => ({
    id: item.id || `ack-${item.policyId}-${index}`,
    ...item,
    policyId: item.policyId,
    date: item.date || "Not completed",
  }));
}

export function getDefaultPolicyQuestions() {
  return policyQuestionExamples.map((question, index) => ({
    id: question.id || `question-${question.policyId}-${index}`,
    policyId: question.policyId,
    question: question.question,
    answerType: question.answerType || "Short answer",
    correctAnswer:
      question.correctAnswer ||
      "Answer must demonstrate understanding of the policy and local process.",
    required: question.required !== false,
  }));
}

export function getTargetRolesForAudience(targetAudience) {
  return ROLE_GROUPS[targetAudience] || [targetAudience];
}

export function getRoleAudienceOptions() {
  return Object.keys(ROLE_GROUPS);
}

export function enrichPolicies(policyList = policies, acknowledgements = []) {
  const safePolicies = Array.isArray(policyList) ? policyList : getDefaultPolicies();

  return safePolicies.map((policy, index) => {
    const normalisedPolicy = normalisePolicy(policy, index);
    const policyAcknowledgements = getPolicyAcknowledgements(
      normalisedPolicy.id,
      acknowledgements
    );
    const completedCount = policyAcknowledgements.filter(
      (item) => item.status === "Acknowledged"
    ).length;
    const totalRequired = policyAcknowledgements.length;
    const acknowledgement =
      totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0;

    return {
      ...normalisedPolicy,
      acknowledgement,
      computedStatus: getReviewStatus(
        normalisedPolicy.reviewDue,
        normalisedPolicy.status
      ),
      daysUntilReview: daysUntil(normalisedPolicy.reviewDue),
      totalRequired,
      completedCount,
      pendingCount: Math.max(totalRequired - completedCount, 0),
    };
  });
}

export function filterPolicies(policyList, searchTerm, statusFilter, audienceFilter = "All") {
  const safePolicies = Array.isArray(policyList) ? policyList : [];
  const safeSearchTerm = String(searchTerm || "").toLowerCase();

  return safePolicies.filter((policy) => {
    const searchText = `${policy.name || ""} ${policy.category || ""} ${
      policy.owner || ""
    } ${policy.summary || ""} ${policy.targetAudience || ""}`.toLowerCase();

    const matchesSearch = searchText.includes(safeSearchTerm);

    const matchesStatus =
      statusFilter === "All" || policy.computedStatus === statusFilter;

    const matchesAudience =
      audienceFilter === "All" || policy.targetAudience === audienceFilter;

    return matchesSearch && matchesStatus && matchesAudience;
  });
}

export function getPolicyById(policyList, policyId, acknowledgements = []) {
  const enrichedPolicies = enrichPolicies(policyList, acknowledgements);

  return (
    enrichedPolicies.find((policy) => String(policy.id) === String(policyId)) ||
    enrichedPolicies[0] ||
    normalisePolicy({ id: "new", name: "No policy selected" })
  );
}

export function buildPolicyAcknowledgementMatrix(
  policyList = policies,
  acknowledgements = [],
  staffList = []
) {
  const safeStaffList = Array.isArray(staffList) ? staffList : [];
  const safeAcknowledgements = Array.isArray(acknowledgements)
    ? acknowledgements
    : [];

  return enrichPolicies(policyList, safeAcknowledgements).flatMap((policy) => {
    const targetRoles = policy.targetRoles || getTargetRolesForAudience(policy.targetAudience);

    return safeStaffList
      .filter((person) => targetRoles.includes(person.role))
      .map((person) => {
        const existing = safeAcknowledgements.find(
          (acknowledgement) =>
            String(acknowledgement.policyId) === String(policy.id) &&
            acknowledgement.staffName === person.name
        );

        return {
          id: existing?.id || `ack-${policy.id}-${person.name}`,
          policyId: policy.id,
          policyName: policy.name,
          staffName: person.name,
          role: person.role,
          status: existing?.status || "Pending",
          questionnaireScore: existing?.questionnaireScore || "Not completed",
          date: existing?.date || "Not completed",
          risk: policy.risk,
          reviewDue: policy.reviewDue,
        };
      });
  });
}

export function getPolicyAcknowledgements(policyId, acknowledgements = staffPolicyAcknowledgements) {
  const safeAcknowledgements = Array.isArray(acknowledgements)
    ? acknowledgements
    : [];

  return safeAcknowledgements.filter(
    (item) => String(item.policyId) === String(policyId)
  );
}

export function getAcknowledgementsForPolicy(policyId, acknowledgements, staffList, policyList) {
  const matrix = buildPolicyAcknowledgementMatrix(policyList, acknowledgements, staffList);

  return matrix.filter((item) => String(item.policyId) === String(policyId));
}

export function getPolicyQuestions(policyId, questionList = policyQuestionExamples) {
  const safeQuestions = Array.isArray(questionList) ? questionList : [];

  return safeQuestions.filter(
    (question) => String(question.policyId) === String(policyId)
  );
}

export function getComplianceMetrics(
  policyList = policies,
  acknowledgements = [],
  staffList = []
) {
  const acknowledgementMatrix = buildPolicyAcknowledgementMatrix(
    policyList,
    acknowledgements,
    staffList
  );
  const enrichedPolicies = enrichPolicies(policyList, acknowledgementMatrix);

  const overduePolicies = enrichedPolicies.filter(
    (policy) => policy.computedStatus === "Overdue"
  );

  const dueSoonPolicies = enrichedPolicies.filter(
    (policy) => policy.computedStatus === "Due soon"
  );

  const approvedPolicies = enrichedPolicies.filter(
    (policy) => policy.computedStatus === "Approved"
  );

  const acknowledgedRows = acknowledgementMatrix.filter(
    (item) => item.status === "Acknowledged"
  ).length;

  const averageAcknowledgement = acknowledgementMatrix.length
    ? Math.round((acknowledgedRows / acknowledgementMatrix.length) * 100)
    : 0;

  const pendingAcknowledgements = acknowledgementMatrix.filter(
    (item) => item.status !== "Acknowledged"
  );

  const governanceAlerts = enrichedPolicies.filter(
    (policy) =>
      policy.computedStatus === "Overdue" ||
      policy.computedStatus === "Due soon" ||
      policy.acknowledgement < 90 ||
      policy.risk === "High"
  );

  return {
    enrichedPolicies,
    overduePolicies,
    dueSoonPolicies,
    approvedPolicies,
    averageAcknowledgement,
    pendingAcknowledgements,
    acknowledgementMatrix,
    governanceAlerts,
  };
}

export function createPolicyDraft(formValues = {}) {
  const nextReviewMonths = Number(formValues.nextReviewMonths || 12);
  const now = Date.now();
  const targetAudience = formValues.targetAudience || "All staff";

  return normalisePolicy({
    id: `policy-${now}`,
    name: formValues.name || "New policy",
    category: formValues.category || "Governance",
    owner: formValues.owner || "Practice Manager",
    risk: formValues.risk || "Medium",
    targetAudience,
    targetRoles: getTargetRolesForAudience(targetAudience),
    reviewDue: formValues.reviewDue || addMonths(todayIso(), nextReviewMonths),
    lastReviewed: todayIso(),
    status: "Draft",
    version: formValues.version || "v1.0",
    summary: formValues.summary || "Draft policy added to GPOP.",
    documentType: formValues.documentType || "Policy",
  });
}

export function addPolicy(policyList, newPolicy) {
  const safePolicies = Array.isArray(policyList) ? policyList : [];
  return [normalisePolicy(newPolicy), ...safePolicies];
}

export function updatePolicy(policyList, policyId, updates) {
  const safePolicies = Array.isArray(policyList) ? policyList : [];

  return safePolicies.map((policy) => {
    if (String(policy.id) !== String(policyId)) return policy;

    const targetAudience = updates.targetAudience || policy.targetAudience;

    return normalisePolicy({
      ...policy,
      ...updates,
      targetAudience,
      targetRoles: getTargetRolesForAudience(targetAudience),
    });
  });
}

export function markPolicyReviewed(policyList, policyId, reviewedBy = "Practice Manager") {
  const today = todayIso();

  return updatePolicy(policyList, policyId, {
    status: "Approved",
    lastReviewed: today,
    reviewDue: addMonths(today, 12),
    reviewedBy,
  });
}

export function createPolicyQuestion({ policyId, question, answerType, correctAnswer }) {
  return {
    id: `question-${Date.now()}`,
    policyId,
    question: question || "New policy question",
    answerType: answerType || "Short answer",
    correctAnswer:
      correctAnswer || "Answer should reflect the policy and local process.",
    required: true,
  };
}

export function addPolicyQuestion(questionList, newQuestion) {
  const safeQuestions = Array.isArray(questionList) ? questionList : [];
  return [newQuestion, ...safeQuestions];
}

export function completePolicyAcknowledgement(
  acknowledgements,
  { policyId, policyName, staffName, role, score }
) {
  const safeAcknowledgements = Array.isArray(acknowledgements)
    ? acknowledgements
    : [];
  const acknowledgement = {
    id: `ack-${policyId}-${staffName}`,
    policyId,
    policyName,
    staffName,
    role,
    status: "Acknowledged",
    questionnaireScore: score || "Passed",
    date: todayIso(),
  };

  const existingIndex = safeAcknowledgements.findIndex(
    (item) =>
      String(item.policyId) === String(policyId) && item.staffName === staffName
  );

  if (existingIndex === -1) {
    return [acknowledgement, ...safeAcknowledgements];
  }

  return safeAcknowledgements.map((item, index) =>
    index === existingIndex ? { ...item, ...acknowledgement } : item
  );
}

export function reopenPolicyAcknowledgement(acknowledgements, policyId, staffName) {
  const safeAcknowledgements = Array.isArray(acknowledgements)
    ? acknowledgements
    : [];

  return safeAcknowledgements.map((item) => {
    if (String(item.policyId) !== String(policyId) || item.staffName !== staffName) {
      return item;
    }

    return {
      ...item,
      status: "Pending",
      questionnaireScore: "Not completed",
      date: "Not completed",
    };
  });
}
