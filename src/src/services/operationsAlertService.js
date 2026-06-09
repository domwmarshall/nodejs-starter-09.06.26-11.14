import { policies } from "../data/compliance";
import {
  buildPolicyAcknowledgementMatrix,
  enrichPolicies,
  getDefaultPolicyAcknowledgements,
  getDefaultPolicyQuestions,
  getPolicyQuestions,
} from "./complianceService";
import { trainingCourses, trainingRecords } from "../data/training";
import { auditTemplates } from "../data/audits";
import { financeTasks } from "../data/finance";
import { supplierInvoiceLines } from "../data/dispensaryFinance";
import { moduleSettings } from "../data/settings";
import { staff } from "../data/staff";
import { daysUntil, getDueText, getReviewStatus } from "../utils/dateUtils";
import { getAuditMetrics, getDefaultAuditSubmissions } from "./auditService";
import { getCoverMetrics } from "./coverService";
import {
  getDispensaryActionQueue,
  getDispensaryProfitability,
  getFinanceTaskMetrics,
} from "./financeService";
import {
  getAllMissingTrainingAssignments,
  getTrainingMetrics,
} from "./trainingService";
import {
  getCareNavigationMetrics,
  getDefaultSampleCareNavigationCalls,
} from "./careNavigationService";
import { getModuleAccessForUser } from "./userService";

function priorityScore(priority) {
  if (priority === "Critical") return 4;
  if (priority === "High") return 3;
  if (priority === "Medium") return 2;
  if (priority === "Low") return 1;
  return 0;
}

function makeAlert({
  id,
  title,
  module,
  priority = "Medium",
  assignedTo = "Practice Manager",
  dueDate = "",
  status = "Open",
  type = "Generated",
  description = "",
  action = "",
}) {
  return {
    id,
    title,
    module,
    priority,
    assignedTo,
    dueDate,
    status,
    type,
    description,
    action,
    dueText: dueDate ? getDueText(dueDate) : "No due date",
    source: "generated",
  };
}

export function getGeneratedOperationalAlerts({
  holidayRequests = [],
  staffList = staff,
  auditTemplates: activeAuditTemplates = auditTemplates,
  auditSubmissions = getDefaultAuditSubmissions(),
  activeFinanceTasks = financeTasks,
  activeInvoiceLines = supplierInvoiceLines,
  activeModuleSettings = moduleSettings,
  activePolicies = policies,
  activePolicyAcknowledgements = getDefaultPolicyAcknowledgements(),
  activePolicyQuestions = getDefaultPolicyQuestions(),
  activeTrainingCourses = trainingCourses,
  activeTrainingRecords = trainingRecords,
  activeCarePathways = [],
  activeCareNotes = getDefaultSampleCareNavigationCalls(),
} = {}) {
  const alerts = [];

  const coverMetrics = getCoverMetrics({ requests: holidayRequests, staffList });

  coverMetrics.riskyPendingRequests.forEach((request) => {
    alerts.push(
      makeAlert({
        id: `cover-pending-${request.id}`,
        title: `${request.staffName} leave request may affect cover`,
        module: "Calendar",
        priority: request.coverRisk === "High" ? "High" : "Medium",
        assignedTo: "Practice Manager",
        dueDate: request.date,
        type: "Cover risk",
        description: request.coverWarnings.map((warning) => warning.message).join(" · ") || "Potential cover issue.",
        action: "Review cover before approving this leave request.",
      })
    );
  });

  coverMetrics.riskyApprovedRequests.forEach((request) => {
    alerts.push(
      makeAlert({
        id: `cover-approved-${request.id}`,
        title: `${request.staffName} approved leave creates a cover warning`,
        module: "Calendar",
        priority: request.coverRisk === "High" ? "High" : "Medium",
        assignedTo: "Practice Manager",
        dueDate: request.date,
        type: "Cover warning",
        description: request.coverWarnings.map((warning) => warning.message).join(" · ") || "Minimum cover warning.",
        action: "Arrange cover, amend shifts or book locum/bank support.",
      })
    );
  });

  const policyAcknowledgementMatrix = buildPolicyAcknowledgementMatrix(
    activePolicies,
    activePolicyAcknowledgements,
    staffList
  );

  const enrichedPolicies = enrichPolicies(activePolicies, policyAcknowledgementMatrix);

  enrichedPolicies.forEach((policy) => {
    const reviewStatus = getReviewStatus(policy.reviewDue, policy.status);
    const policyQuestions = getPolicyQuestions(policy.id, activePolicyQuestions);

    if (reviewStatus === "Overdue" || reviewStatus === "Due soon") {
      alerts.push(
        makeAlert({
          id: `policy-${policy.id}`,
          title: `${policy.name} review ${reviewStatus.toLowerCase()}`,
          module: "Compliance",
          priority: reviewStatus === "Overdue" ? "High" : "Medium",
          assignedTo: policy.owner,
          dueDate: policy.reviewDue,
          type: "Policy review",
          description: `${policy.acknowledgement}% acknowledged · ${policy.risk} risk · ${policy.targetAudience}.`,
          action: "Review policy, update revision, then send acknowledgement reminders.",
        })
      );
    }

    if (policy.acknowledgement < 90 && policy.totalRequired > 0) {
      alerts.push(
        makeAlert({
          id: `policy-ack-${policy.id}`,
          title: `${policy.name}: ${policy.pendingCount} acknowledgement(s) outstanding`,
          module: "Compliance",
          priority: policy.risk === "High" ? "High" : "Medium",
          assignedTo: policy.owner,
          dueDate: policy.reviewDue,
          type: "Policy acknowledgement",
          description: `${policy.completedCount}/${policy.totalRequired} staff have acknowledged this ${policy.targetAudience} document.`,
          action: "Send reminders and require questionnaire completion before acknowledgement.",
        })
      );
    }

    if (policy.questionnaire === "Enabled" && policyQuestions.length === 0) {
      alerts.push(
        makeAlert({
          id: `policy-question-${policy.id}`,
          title: `${policy.name} needs questionnaire questions`,
          module: "Compliance",
          priority: policy.risk === "High" ? "High" : "Medium",
          assignedTo: policy.owner,
          dueDate: policy.reviewDue,
          type: "Questionnaire gap",
          description: "Acknowledgement is enabled but no knowledge-check questions exist.",
          action: "Add policy-specific questionnaire questions before staff acknowledgement.",
        })
      );
    }
  });

  const trainingMetrics = getTrainingMetrics(
    activeTrainingRecords,
    activeTrainingCourses,
    staffList
  );

  [...trainingMetrics.overdueRecords, ...trainingMetrics.dueSoonRecords]
    .slice(0, 20)
    .forEach((record) => {
      alerts.push(
        makeAlert({
          id: `training-${record.id}`,
          title: `${record.staffName}: ${record.courseName}`,
          module: "Training",
          priority: record.status === "Overdue" || record.risk === "High" ? "High" : "Medium",
          assignedTo: record.staffName,
          dueDate: record.expiryDate,
          type: "Training renewal",
          description: `${record.status} · ${record.risk} risk · ${record.category}.`,
          action: "Send reminder or assign protected time to complete the course.",
        })
      );
    });

  getAllMissingTrainingAssignments(activeTrainingCourses, activeTrainingRecords, staffList)
    .slice(0, 12)
    .forEach((assignment) => {
      alerts.push(
        makeAlert({
          id: `training-missing-${assignment.name}-${assignment.courseId}`,
          title: `${assignment.name} missing ${assignment.courseName}`,
          module: "Training",
          priority: assignment.risk === "High" ? "High" : "Medium",
          assignedTo: assignment.name,
          dueDate: "",
          type: "Training assignment",
          description: `${assignment.role} requires this course but no record exists.`,
          action: "Assign the course and set completion deadline.",
        })
      );
    });

  const auditMetrics = getAuditMetrics(activeAuditTemplates, auditSubmissions);

  auditMetrics.overdueAudits.forEach((audit) => {
    alerts.push(
      makeAlert({
        id: `audit-overdue-${audit.id}`,
        title: `${audit.name} is overdue`,
        module: "Audits",
        priority: audit.risk === "High" ? "High" : "Medium",
        assignedTo: audit.assignedTo,
        dueDate: audit.nextDue,
        type: "Audit overdue",
        description: `${audit.category} · ${audit.frequency}`,
        action: "Complete the audit or reassign ownership.",
      })
    );
  });

  auditMetrics.actionRequiredSubmissions.forEach((submission) => {
    alerts.push(
      makeAlert({
        id: `audit-action-${submission.id}`,
        title: `${submission.auditName} needs follow-up`,
        module: "Audits",
        priority: "High",
        assignedTo: "Practice Manager",
        dueDate: submission.completedDate,
        type: "Audit action",
        description: submission.actionRequired,
        action: "Record corrective action and close the audit issue.",
      })
    );
  });

  const financeMetrics = getFinanceTaskMetrics(activeFinanceTasks);

  financeMetrics.overdueTasks.forEach((task) => {
    alerts.push(
      makeAlert({
        id: `finance-overdue-${task.id}`,
        title: task.title,
        module: "Finance",
        priority: task.priority || "Medium",
        assignedTo: task.owner,
        dueDate: task.dueDate,
        type: "Finance task",
        description: task.note,
        action: "Review finance task and update status.",
      })
    );
  });

  const dispensaryProfitability = getDispensaryProfitability({ invoiceLines: activeInvoiceLines });

  getDispensaryActionQueue(dispensaryProfitability)
    .slice(0, 8)
    .forEach((action) => {
      alerts.push(
        makeAlert({
          id: `dispensary-${action.id}`,
          title: `${action.drugName}: ${action.issue}`,
          module: "Finance",
          priority: action.priority || "Medium",
          assignedTo: "Practice Manager",
          dueDate: "2026-06-28",
          type: "Dispensary margin",
          description: action.suggestedAction,
          action: "Review dispensary profitability and update ordering/prescribing action log.",
        })
      );
    });

  const careMetrics = getCareNavigationMetrics(activeCarePathways, activeCareNotes);

  careMetrics.clinicallyUnsafePathways.slice(0, 10).forEach((pathway) => {
    alerts.push(
      makeAlert({
        id: `care-pathway-${pathway.id}`,
        title: `${pathway.name} requires clinical governance`,
        module: "Care Navigation",
        priority: pathway.risk === "High" ? "High" : "Medium",
        assignedTo: pathway.owner || "Clinical Lead",
        dueDate: pathway.nextReview || "",
        type: "Care navigation governance",
        description: `${pathway.status} · ${pathway.reviewStatus}`,
        action: "Keep prototype-only until pathway is clinically reviewed and approved.",
      })
    );
  });

  activeModuleSettings
    .filter((module) => module.dataRisk === "High" || module.governanceStatus?.includes("required"))
    .forEach((module) => {
      alerts.push(
        makeAlert({
          id: `module-risk-${module.id}`,
          title: `${module.name} requires governance control`,
          module: "Settings",
          priority: module.dataRisk === "High" ? "High" : "Medium",
          assignedTo: "Practice Manager",
          dueDate: "",
          type: "Governance",
          description: `${module.dataRisk} risk · ${module.governanceStatus}`,
          action: "Keep module locked or document governance controls before wider use.",
        })
      );
    });

  return alerts.sort((a, b) => {
    const priorityDifference = priorityScore(b.priority) - priorityScore(a.priority);
    if (priorityDifference !== 0) return priorityDifference;
    return String(a.dueDate || "9999").localeCompare(String(b.dueDate || "9999"));
  });
}

export function getAlertsForUser(alerts = [], user) {
  if (!user) return alerts;

  if (user.role === "Practice Manager" || user.role === "GP Partner") return alerts;

  return alerts.filter((alert) => {
    const moduleId = alert.module.toLowerCase().replace("care navigation", "care-navigation");
    const access = getModuleAccessForUser(user, moduleId);

    return alert.assignedTo === user.name || alert.assignedTo === user.role || access !== "No access" || alert.module === "Inbox";
  });
}

export function getOperationalAlertMetrics(alerts = []) {
  const openAlerts = alerts.filter((alert) => alert.status !== "Done");
  const highPriorityAlerts = openAlerts.filter((alert) => alert.priority === "High");
  const mediumPriorityAlerts = openAlerts.filter((alert) => alert.priority === "Medium");
  const overdueAlerts = openAlerts.filter((alert) => alert.dueDate && daysUntil(alert.dueDate) < 0);

  return { openAlerts, highPriorityAlerts, mediumPriorityAlerts, overdueAlerts };
}
