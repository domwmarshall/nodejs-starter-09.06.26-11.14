import {
  careNavigationPathways,
  careNavigationGovernanceChecklist,
  sampleCareNavigationCalls,
} from "../data/careNavigation";
import { starterClinicalPathways } from "../data/starterClinicalPathways";
import { SETTINGS_STORAGE_KEYS } from "./settingsService";

export const CARE_NAVIGATION_PATHWAYS_STORAGE_KEY = `${SETTINGS_STORAGE_KEYS.careNavigationPathways}:v6-pathway-scale-sex-bank-v1`;
export const CARE_NAVIGATION_NOTES_STORAGE_KEY = SETTINGS_STORAGE_KEYS.careNavigationNotes;

function normalise(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueList(values = []) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
}

function mapStarterPathway(pathway) {
  return {
    id: pathway.id,
    name: pathway.name,
    category: pathway.category || "Care navigation",
    synonyms: pathway.synonyms || [],
    version: pathway.version || "v1 prototype",
    status: pathway.status === "Approved" ? "Approved" : pathway.risk === "High" ? "Locked" : "Draft",
    approvalStatus: pathway.approvalStatus || "Requires clinical review",
    risk: pathway.risk || "Medium",
    source: pathway.source || "Source metadata placeholder",
    sourceUrl: pathway.sourceUrl || "",
    sourceOrganisation: pathway.sourceOrganisation || "Local governance",
    sourceRetrievedDate: pathway.sourceRetrievedDate || "Not retrieved",
    owner: pathway.owner || "Named clinical owner required",
    reviewStatus: pathway.reviewStatus || "Clinical review required",
    lastReviewed: pathway.lastReviewed || "Not reviewed",
    nextReview: pathway.nextReview || "Not set",
    safetyStatus: pathway.safetyStatus || "Prototype only",
    description: pathway.description || "Care-navigation pathway metadata placeholder.",
    suggestedClinicTypes: uniqueList(pathway.suggestedClinicTypes || pathway.suggestedActions || ["Routine GP appointment"]),
    supportingActions: uniqueList(pathway.supportingActions || ["None", "Safety-net wording"]),
    redFlagPlaceholders: uniqueList(pathway.redFlagQuestions || pathway.redFlagPlaceholders || []),
    routineQuestions: uniqueList(pathway.routineQuestions || []),
    bookingSlotText: pathway.bookingSlotText || "Care nav completed — book according to selected pathway",
    systmOneTemplate: pathway.systmOneTemplate || "Care navigation call completed. Red flags and routine questions documented.",
    hazardReferences: pathway.hazardReferences || [],
  };
}

function getStarterMappedPathways() {
  const existingNames = new Set(careNavigationPathways.map((item) => normalise(item.name)));
  const mappedStarter = starterClinicalPathways
    .map(mapStarterPathway)
    .filter((item) => !existingNames.has(normalise(item.name)));

  return [...careNavigationPathways, ...mappedStarter];
}

export function getDefaultCareNavigationPathways() {
  return getStarterMappedPathways();
}

export function getDefaultCareNavigationGovernanceChecklist() {
  return careNavigationGovernanceChecklist;
}

export function getDefaultSampleCareNavigationCalls() {
  return sampleCareNavigationCalls;
}

export function getSafeCareNavigationPathways(pathways) {
  const defaults = getDefaultCareNavigationPathways();
  const incoming = Array.isArray(pathways) && pathways.length > 0 ? pathways : defaults;
  const merged = [...incoming];
  const seen = new Set(merged.map((pathway) => normalise(pathway.id || pathway.name)));

  defaults.forEach((pathway) => {
    const key = normalise(pathway.id || pathway.name);
    const nameKey = normalise(pathway.name);
    if (!seen.has(key) && !merged.some((item) => normalise(item.name) === nameKey)) {
      merged.push(pathway);
      seen.add(key);
    }
  });

  return merged.map((pathway) => ({
    ...pathway,
    redFlagPlaceholders: uniqueList(pathway.redFlagPlaceholders || pathway.redFlagQuestions || []),
    suggestedClinicTypes: uniqueList(pathway.suggestedClinicTypes || pathway.suggestedActions || ["Routine GP appointment"]),
    routineQuestions: uniqueList(pathway.routineQuestions || []),
    synonyms: uniqueList(pathway.synonyms || []),
  }));
}

export function getSafeCareNavigationNotes(notes) {
  return Array.isArray(notes) ? notes : sampleCareNavigationCalls;
}

function pathwaySearchText(pathway) {
  return normalise([
    pathway.name,
    pathway.category,
    pathway.description,
    ...(pathway.synonyms || []),
  ].join(" "));
}

function editDistanceWithinOne(a, b) {
  if (!a || !b) return false;
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a === b) return true;

  let mismatches = 0;
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }

    mismatches += 1;
    if (mismatches > 1) return false;

    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }

  return true;
}

function includesPhrase(text, phrase) {
  const safeText = normalise(text);
  const safePhrase = normalise(phrase);
  if (!safeText || !safePhrase) return false;
  return safeText === safePhrase || safeText.includes(safePhrase);
}

function getFuzzyScore(pathway, searchTerm) {
  const term = normalise(searchTerm);
  if (!term) return 1;

  const nameText = normalise(pathway.name);
  const categoryText = normalise(pathway.category);
  const synonymText = normalise((pathway.synonyms || []).join(" "));
  const descriptionText = normalise(pathway.description || "");
  const primaryText = normalise([nameText, categoryText, synonymText].join(" "));

  if (nameText === term) return 300;
  if (nameText.includes(term)) return 250;
  if (includesPhrase(synonymText, term)) return 230;
  if (categoryText === term) return 140;
  if (categoryText.includes(term) && term.length >= 4) return 110;

  const queryTokens = term.split(" ").filter((token) => token.length >= 3);
  if (queryTokens.length === 0) return 0;

  const nameTokens = new Set(nameText.split(" ").filter((token) => token.length >= 3));
  const synonymTokens = new Set(synonymText.split(" ").filter((token) => token.length >= 3));
  const categoryTokens = new Set(categoryText.split(" ").filter((token) => token.length >= 3));
  const primaryTokens = primaryText.split(" ").filter((token) => token.length >= 3);

  let score = 0;
  let strongMatches = 0;

  queryTokens.forEach((token) => {
    if (nameTokens.has(token)) { score += 90; strongMatches += 1; return; }
    if (synonymTokens.has(token)) { score += 82; strongMatches += 1; return; }
    if (categoryTokens.has(token)) { score += 46; strongMatches += 1; return; }
    if (token.length >= 4 && primaryTokens.some((candidate) => candidate.startsWith(token) || candidate.includes(token))) { score += 30; strongMatches += 1; return; }
    if (token.length >= 5 && primaryTokens.some((candidate) => editDistanceWithinOne(candidate, token))) { score += 18; strongMatches += 1; return; }
  });

  // Description is deliberately weak and only used for multi-word searches. This stops
  // generic clinical prompts or old cached pathway content pulling unrelated results.
  if (queryTokens.length > 1 && score < 90) {
    const matchedDescriptionTokens = queryTokens.filter((token) => descriptionText.split(" ").includes(token)).length;
    if (matchedDescriptionTokens) score += matchedDescriptionTokens * 10;
  }

  if (strongMatches === 0) return 0;
  return score;
}

export function filterCareNavigationPathways(pathways, searchTerm, statusFilter) {
  const safePathways = getSafeCareNavigationPathways(pathways);
  const term = normalise(searchTerm);

  const queryTokenCount = term.split(" ").filter((token) => token.length >= 3).length;
  const minimumSearchScore = term ? Math.max(60, queryTokenCount * 42) : 0;

  return safePathways
    .map((pathway) => ({ ...pathway, fuzzyScore: getFuzzyScore(pathway, term) }))
    .filter((pathway) => {
      const matchesSearch = !term || pathway.fuzzyScore >= minimumSearchScore;
      const matchesStatus = statusFilter === "All" || pathway.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => (b.fuzzyScore || 0) - (a.fuzzyScore || 0) || String(a.name).localeCompare(String(b.name)));
}

export function getCareNavigationPathwayById(pathways, pathwayId) {
  const safePathways = getSafeCareNavigationPathways(pathways);

  return safePathways.find((pathway) => String(pathway.id) === String(pathwayId)) || safePathways[0];
}

export function getCareNavigationMetrics(pathways = getDefaultCareNavigationPathways(), notes = sampleCareNavigationCalls) {
  const safePathways = getSafeCareNavigationPathways(pathways);
  const safeNotes = getSafeCareNavigationNotes(notes);

  const draftPathways = safePathways.filter((pathway) => pathway.status === "Draft" || pathway.status === "Prototype");
  const lockedPathways = safePathways.filter((pathway) => pathway.status === "Locked");
  const approvedPathways = safePathways.filter((pathway) => pathway.status === "Approved");
  const retiredPathways = safePathways.filter((pathway) => pathway.status === "Retired");
  const highRiskPathways = safePathways.filter((pathway) => pathway.risk === "High");
  const clinicallyUnsafePathways = safePathways.filter(
    (pathway) =>
      pathway.risk === "High" ||
      pathway.status === "Draft" ||
      pathway.status === "Locked" ||
      pathway.status === "Prototype" ||
      String(pathway.reviewStatus || pathway.approvalStatus || "").toLowerCase().includes("required")
  );
  const savedNotes = safeNotes.filter((note) => note.source === "generated" || note.id);

  return {
    totalPathways: safePathways.length,
    draftPathways,
    lockedPathways,
    approvedPathways,
    retiredPathways,
    highRiskPathways,
    clinicallyUnsafePathways,
    savedNotes,
  };
}

export function getInitialClinicType(pathway) {
  return pathway?.suggestedClinicTypes?.[0] || "Not selected";
}

export function getPathwaySafetyStatus(pathway) {
  if (!pathway) {
    return { label: "Not selected", detail: "No pathway selected.", risk: "High", canProceed: false };
  }

  if (pathway.status === "Locked") {
    return { label: "Locked", detail: "This pathway is locked and should not be used.", risk: "High", canProceed: false };
  }

  if (pathway.status === "Draft" || pathway.status === "Prototype") {
    return {
      label: pathway.status,
      detail: "This pathway requires clinical review before use.",
      risk: pathway.risk || "High",
      canProceed: false,
    };
  }

  if (pathway.status === "Approved") {
    return {
      label: "Approved pathway",
      detail: "Marked approved in local data; still requires DCB0129-style governance before live use.",
      risk: pathway.risk || "Medium",
      canProceed: true,
    };
  }

  return { label: pathway.status || "Unknown", detail: "Pathway status requires review.", risk: pathway.risk || "Medium", canProceed: false };
}

export function getRedFlagOutcome(selectedRedFlags = []) {
  const safeFlags = Array.isArray(selectedRedFlags) ? selectedRedFlags.filter(Boolean) : [];

  if (safeFlags.length > 0) {
    return {
      label: "Red flag selected",
      risk: "High",
      bookingText: "CARE NAV RED FLAG — urgent clinician review required",
      action: "Stop routine booking. Escalate to the duty clinician or emergency pathway according to approved local SOP.",
      canBookRoutine: false,
      summary: safeFlags.join("; "),
    };
  }

  return {
    label: "No red flag selected",
    risk: "Medium",
    bookingText: "Care nav completed — book according to selected pathway",
    action: "Proceed only within approved local pathway and available appointment capacity.",
    canBookRoutine: true,
    summary: "No red flags selected in structured workflow.",
  };
}

export function buildBookingText({ selectedPathway, presentingRequest, selectedClinicType, redFlagOutcome }) {
  if (redFlagOutcome?.canBookRoutine === false) return redFlagOutcome.bookingText;

  if (selectedPathway?.bookingSlotText && presentingRequest) {
    return `${selectedPathway.bookingSlotText} · request: ${presentingRequest}`;
  }

  return [
    `Care nav: ${presentingRequest || "request not entered"}`,
    selectedPathway?.name ? `pathway ${selectedPathway.name}` : "pathway not selected",
    selectedClinicType ? `book ${selectedClinicType}` : "clinic/action not selected",
  ].join(" · ");
}

export function buildSystmOneNote({
  selectedPathway,
  presentingRequest,
  duration,
  knownIssue,
  selectedClinicType,
  supportingAction,
  selectedRedFlags = [],
  redFlagAnswers = {},
  redFlagSummary,
  routineAnswers = {},
  additionalNotes,
}) {
  const redFlagOutcome = getRedFlagOutcome(selectedRedFlags);
  const bookingText = buildBookingText({ selectedPathway, presentingRequest, selectedClinicType, redFlagOutcome });
  const redFlagQuestions = (selectedPathway?.redFlagPlaceholders || []).slice(0, 10);
  const routineQuestions = (selectedPathway?.routineQuestions || []).slice(0, 10);

  const formatQuestionAnswers = (questions, answers, fallback) => {
    if (!questions.length) return fallback;
    return questions.map((question) => `- ${question}: ${answers?.[question] || "Not asked"}`).join("\n");
  };

  return [
    "Care navigation telephone note:",
    "Contact type: Telephone / reception care navigation",
    `Presenting request: ${presentingRequest || "(not entered)"}`,
    `Selected pathway: ${selectedPathway?.name || "(not selected)"} (${selectedPathway?.version || "no version"})`,
    `Pathway status: ${selectedPathway?.status || "unknown"} / ${selectedPathway?.approvalStatus || selectedPathway?.reviewStatus || "not approved"}`,
    `Clinical owner: ${selectedPathway?.owner || "not assigned"}`,
    `Source metadata: ${selectedPathway?.source || "not recorded"}`,
    `Review date: ${selectedPathway?.nextReview || "not set"}`,
    `Duration: ${duration || "(not entered)"}`,
    `Recurring / known issue: ${knownIssue}`,
    `Selected clinic/action: ${selectedClinicType}`,
    `Supporting action: ${supportingAction}`,
    "",
    "Booking slot text:",
    bookingText,
    "",
    "Red-flag prompts:",
    formatQuestionAnswers(redFlagQuestions, redFlagAnswers, "(No red-flag prompts configured)"),
    `Red-flag outcome: ${redFlagOutcome.label}`,
    `Red-flag summary: ${redFlagOutcome.summary}`,
    redFlagSummary ? `Additional red-flag wording: ${redFlagSummary}` : "Additional red-flag wording: (none entered)",
    "",
    "Routine prompts:",
    formatQuestionAnswers(routineQuestions, routineAnswers, "(No routine prompts configured)"),
    "",
    "Recommended action:",
    redFlagOutcome.action,
    "",
    "Additional notes:",
    additionalNotes || "(none entered)",
    "",
    "Safety status:",
    "Governed care-navigation support only. Not diagnosis. Do not use with real patients without clinical safety sign-off.",
  ].join("\n");
}

export function createCareNavigationPathway({ name, description, owner, risk, source }) {
  return {
    id: `pathway-${Date.now()}`,
    name: name || "New pathway",
    category: "Local draft",
    synonyms: [],
    version: "v1 draft",
    source: source || "Local draft",
    owner: owner || "Clinical Lead",
    status: "Draft",
    approvalStatus: "Requires clinical review",
    risk: risk || "High",
    reviewStatus: "Clinical review required",
    lastReviewed: "Not reviewed",
    nextReview: new Date().toISOString().slice(0, 10),
    description: description || "Locally configured care navigation pathway draft.",
    suggestedClinicTypes: ["Routine GP appointment", "Same-day GP review", "Nurse appointment"],
    supportingActions: ["None", "Safety-net wording"],
    redFlagPlaceholders: ["Any symptom that suggests immediate clinical risk?"],
    routineQuestions: ["Duration", "Severity / impact", "Previous episodes"],
  };
}

export function addCareNavigationPathway(pathways, newPathway) {
  return [newPathway, ...getSafeCareNavigationPathways(pathways)];
}

export function updateCareNavigationPathway(pathways, pathwayId, changes) {
  return getSafeCareNavigationPathways(pathways).map((pathway) =>
    String(pathway.id) === String(pathwayId) ? { ...pathway, ...changes } : pathway
  );
}

export function addPathwayRedFlag(pathways, pathwayId, redFlag) {
  const safeRedFlag = String(redFlag || "").trim();
  if (!safeRedFlag) return getSafeCareNavigationPathways(pathways);

  return getSafeCareNavigationPathways(pathways).map((pathway) =>
    String(pathway.id) === String(pathwayId)
      ? {
          ...pathway,
          redFlagPlaceholders: uniqueList([...(pathway.redFlagPlaceholders || []), safeRedFlag]),
        }
      : pathway
  );
}

export function addPathwayClinicType(pathways, pathwayId, clinicType) {
  const safeClinicType = String(clinicType || "").trim();
  if (!safeClinicType) return getSafeCareNavigationPathways(pathways);

  return getSafeCareNavigationPathways(pathways).map((pathway) =>
    String(pathway.id) === String(pathwayId)
      ? {
          ...pathway,
          suggestedClinicTypes: uniqueList([...(pathway.suggestedClinicTypes || []), safeClinicType]),
        }
      : pathway
  );
}

export function createCareNavigationNote({
  selectedPathway,
  presentingRequest,
  selectedClinicType,
  supportingAction,
  selectedRedFlags = [],
  notePreview,
}) {
  const redFlagOutcome = getRedFlagOutcome(selectedRedFlags);

  return {
    id: `care-note-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    pathway: selectedPathway?.name || "Unknown pathway",
    pathwayId: selectedPathway?.id,
    pathwayVersion: selectedPathway?.version,
    contactType: "Telephone / reception care navigation",
    presentingRequest: presentingRequest || "Not entered",
    selectedClinicType,
    supportingAction,
    status: redFlagOutcome.canBookRoutine ? "Draft note" : "Escalation required",
    risk: redFlagOutcome.risk,
    redFlags: redFlagOutcome.summary,
    notePreview,
    source: "generated",
  };
}

export function addCareNavigationNote(notes, newNote) {
  return [newNote, ...getSafeCareNavigationNotes(notes)];
}

export function getGovernanceChecklistMetrics(checklist = careNavigationGovernanceChecklist) {
  const safeChecklist = Array.isArray(checklist) ? checklist : careNavigationGovernanceChecklist;

  const requiredItems = safeChecklist.filter((item) => item.status === "Required");
  const completedItems = safeChecklist.filter((item) => item.status === "Complete");
  const plannedItems = safeChecklist.filter((item) => item.status === "Planned");

  return { requiredItems, completedItems, plannedItems, totalItems: safeChecklist.length };
}
