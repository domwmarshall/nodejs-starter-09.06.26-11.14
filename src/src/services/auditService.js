import { auditTemplates, auditSubmissions } from "../data/audits";
import { daysUntil, getDueText } from "../utils/dateUtils";
import { SETTINGS_STORAGE_KEYS } from "./settingsService";

export const AUDIT_TEMPLATES_STORAGE_KEY = SETTINGS_STORAGE_KEYS.auditTemplates;
export const AUDIT_SUBMISSIONS_STORAGE_KEY = SETTINGS_STORAGE_KEYS.auditSubmissions;

export function getDefaultAuditSubmissions() {
  return auditSubmissions;
}

export function getDefaultAuditTemplates() {
  return auditTemplates;
}

export function getSafeAuditTemplates(templates) {
  return Array.isArray(templates) && templates.length > 0 ? templates : auditTemplates;
}

export function getSafeAuditSubmissions(submissions) {
  return Array.isArray(submissions) ? submissions : auditSubmissions;
}

export function getAuditStatus(nextDue, explicitStatus) {
  if (explicitStatus === "Retired") return explicitStatus;
  const remaining = daysUntil(nextDue);
  if (remaining < 0) return "Overdue";
  if (remaining <= 14) return "Due soon";
  return "Up to date";
}

export function enrichAuditTemplates(templates = auditTemplates) {
  const safeTemplates = getSafeAuditTemplates(templates);

  return safeTemplates.map((template) => ({
    ...template,
    status: getAuditStatus(template.nextDue, template.status),
    daysUntilDue: daysUntil(template.nextDue),
    dueText: getDueText(template.nextDue),
    questions: Array.isArray(template.questions) ? template.questions : [],
  }));
}

export function filterAuditTemplates(templates, searchTerm, statusFilter) {
  const safeTemplates = Array.isArray(templates) ? templates : [];
  const safeSearchTerm = String(searchTerm || "").toLowerCase();

  return safeTemplates.filter((template) => {
    const searchText = `${template.name || ""} ${template.category || ""} ${
      template.assignedTo || ""
    } ${template.owner || ""} ${template.description || ""}`.toLowerCase();

    const matchesSearch = searchText.includes(safeSearchTerm);
    const matchesStatus = statusFilter === "All" || template.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

export function getAuditTemplateById(templates, templateId) {
  const enrichedTemplates = enrichAuditTemplates(templates);

  return (
    enrichedTemplates.find((template) => String(template.id) === String(templateId)) ||
    enrichedTemplates[0]
  );
}

export function getAuditMetrics(templates = auditTemplates, submissions = auditSubmissions) {
  const enrichedTemplates = enrichAuditTemplates(templates);
  const safeSubmissions = getSafeAuditSubmissions(submissions);

  const overdueAudits = enrichedTemplates.filter((template) => template.status === "Overdue");
  const dueSoonAudits = enrichedTemplates.filter((template) => template.status === "Due soon");
  const upToDateAudits = enrichedTemplates.filter((template) => template.status === "Up to date");
  const retiredAudits = enrichedTemplates.filter((template) => template.status === "Retired");
  const actionRequiredSubmissions = safeSubmissions.filter(
    (submission) => submission.result === "Action required"
  );
  const completedSubmissions = safeSubmissions.filter(
    (submission) => submission.result === "Completed" || submission.result === "Action closed"
  );

  return {
    enrichedTemplates,
    overdueAudits,
    dueSoonAudits,
    upToDateAudits,
    retiredAudits,
    actionRequiredSubmissions,
    completedSubmissions,
  };
}

export function createAuditTemplate({
  name,
  category,
  frequency,
  assignedTo,
  owner,
  risk,
  nextDue,
  description,
  requiredEvidence,
}) {
  return {
    id: `audit-${Date.now()}`,
    name: name || "New audit template",
    category: category || "Operations",
    frequency: frequency || "Monthly",
    assignedTo: assignedTo || "Practice Manager",
    owner: owner || "Practice Manager",
    risk: risk || "Medium",
    status: "Due soon",
    nextDue: nextDue || new Date().toISOString().slice(0, 10),
    description: description || "Locally configured audit template.",
    requiredEvidence: requiredEvidence || "Completion confirmation and action notes",
    questions: ["Was the check completed?", "Were any issues identified?", "Were actions recorded?"],
  };
}

export function addAuditTemplate(templates, newTemplate) {
  return [newTemplate, ...getSafeAuditTemplates(templates)];
}

export function addAuditTemplateQuestion(templates, templateId, question) {
  const safeQuestion = String(question || "").trim();
  if (!safeQuestion) return getSafeAuditTemplates(templates);

  return getSafeAuditTemplates(templates).map((template) =>
    String(template.id) === String(templateId)
      ? {
          ...template,
          questions: [...(template.questions || []), safeQuestion],
        }
      : template
  );
}

export function updateAuditTemplate(templates, templateId, changes) {
  return getSafeAuditTemplates(templates).map((template) =>
    String(template.id) === String(templateId)
      ? {
          ...template,
          ...changes,
        }
      : template
  );
}

export function createAuditSubmission({
  template,
  completedBy,
  issuesFound,
  actionRequired,
}) {
  const issuesWereFound = issuesFound === "Yes";

  return {
    id: `submission-${Date.now()}`,
    templateId: template.id,
    auditName: template.name,
    completedBy,
    completedDate: new Date().toISOString().slice(0, 10),
    result: issuesWereFound ? "Action required" : "Completed",
    issuesFound,
    actionRequired: issuesWereFound ? actionRequired || "Action required" : "None",
  };
}

export function addAuditSubmission(submissions, newSubmission) {
  return [newSubmission, ...getSafeAuditSubmissions(submissions)];
}

export function closeAuditAction(submissions, submissionId) {
  return getSafeAuditSubmissions(submissions).map((submission) =>
    String(submission.id) === String(submissionId)
      ? {
          ...submission,
          result: "Action closed",
          actionRequired: `${submission.actionRequired} · Closed in GPOP`,
        }
      : submission
  );
}

export function getSubmissionsForTemplate(submissions, templateId) {
  return getSafeAuditSubmissions(submissions).filter(
    (submission) => String(submission.templateId) === String(templateId)
  );
}

export function getRecentAuditSubmissions(submissions, limit = 10) {
  return [...getSafeAuditSubmissions(submissions)]
    .sort((a, b) => String(b.completedDate).localeCompare(String(a.completedDate)))
    .slice(0, limit);
}
