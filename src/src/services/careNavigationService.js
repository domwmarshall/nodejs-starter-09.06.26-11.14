import {
  careNavigationPathways,
  careNavigationGovernanceChecklist,
  sampleCareNavigationCalls,
} from "../data/careNavigation";
import { SETTINGS_STORAGE_KEYS } from "./settingsService";

export const CARE_NAVIGATION_PATHWAYS_STORAGE_KEY = SETTINGS_STORAGE_KEYS.careNavigationPathways;
export const CARE_NAVIGATION_NOTES_STORAGE_KEY = SETTINGS_STORAGE_KEYS.careNavigationNotes;

export function getDefaultCareNavigationPathways() {
  return careNavigationPathways;
}

export function getDefaultCareNavigationGovernanceChecklist() {
  return careNavigationGovernanceChecklist;
}

export function getDefaultSampleCareNavigationCalls() {
  return sampleCareNavigationCalls;
}

export function getSafeCareNavigationPathways(pathways) {
  return Array.isArray(pathways) && pathways.length > 0 ? pathways : careNavigationPathways;
}

export function getSafeCareNavigationNotes(notes) {
  return Array.isArray(notes) ? notes : sampleCareNavigationCalls;
}

export function filterCareNavigationPathways(pathways, searchTerm, statusFilter) {
  const safePathways = getSafeCareNavigationPathways(pathways);
  const safeSearchTerm = String(searchTerm || "").toLowerCase();

  return safePathways.filter((pathway) => {
    const searchText = `${pathway.name || ""} ${pathway.source || ""} ${
      pathway.owner || ""
    } ${pathway.description || ""}`.toLowerCase();

    const matchesSearch = searchText.includes(safeSearchTerm);
    const matchesStatus = statusFilter === "All" || pathway.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

export function getCareNavigationPathwayById(pathways, pathwayId) {
  const safePathways = getSafeCareNavigationPathways(pathways);

  return safePathways.find((pathway) => String(pathway.id) === String(pathwayId)) || safePathways[0];
}

export function getCareNavigationMetrics(pathways = careNavigationPathways, notes = sampleCareNavigationCalls) {
  const safePathways = getSafeCareNavigationPathways(pathways);
  const safeNotes = getSafeCareNavigationNotes(notes);

  const draftPathways = safePathways.filter((pathway) => pathway.status === "Draft");
  const lockedPathways = safePathways.filter((pathway) => pathway.status === "Locked");
  const approvedPathways = safePathways.filter((pathway) => pathway.status === "Approved");
  const retiredPathways = safePathways.filter((pathway) => pathway.status === "Retired");
  const highRiskPathways = safePathways.filter((pathway) => pathway.risk === "High");
  const clinicallyUnsafePathways = safePathways.filter(
    (pathway) =>
      pathway.risk === "High" ||
      pathway.status === "Draft" ||
      pathway.status === "Locked" ||
      String(pathway.reviewStatus || "").toLowerCase().includes("required")
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

  if (pathway.status === "Draft") {
    return {
      label: "Draft",
      detail: "This pathway requires clinical review before use.",
      risk: pathway.risk || "High",
      canProceed: false,
    };
  }

  if (pathway.status === "Approved") {
    return {
      label: "Approved prototype pathway",
      detail: "Marked approved in mock data, but still requires production governance before live use.",
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
    summary: "No red flags selected in prototype workflow.",
  };
}

export function buildBookingText({ selectedPathway, presentingRequest, selectedClinicType, redFlagOutcome }) {
  if (redFlagOutcome?.canBookRoutine === false) return redFlagOutcome.bookingText;

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
  redFlagSummary,
  additionalNotes,
}) {
  const redFlagOutcome = getRedFlagOutcome(selectedRedFlags);
  const bookingText = buildBookingText({ selectedPathway, presentingRequest, selectedClinicType, redFlagOutcome });

  return [
    "Care navigation telephone note:",
    "Contact type: Telephone / reception care navigation",
    `Presenting request: ${presentingRequest || "(not entered)"}`,
    `Selected pathway: ${selectedPathway?.name || "(not selected)"} (${selectedPathway?.version || "no version"})`,
    `Duration: ${duration || "(not entered)"}`,
    `Recurring / known issue: ${knownIssue}`,
    `Selected clinic/action: ${selectedClinicType}`,
    `Supporting action: ${supportingAction}`,
    "",
    "Booking slot text:",
    bookingText,
    "",
    "Red-flag section:",
    `${redFlagOutcome.label}: ${redFlagOutcome.summary}`,
    redFlagSummary || "(No additional red-flag free text entered)",
    "",
    "Recommended action:",
    redFlagOutcome.action,
    "",
    "Additional notes:",
    additionalNotes || "(none entered)",
    "",
    "Safety status:",
    "Prototype only — not approved for real patient care. Do not use without clinical safety sign-off.",
  ].join("\n");
}

export function createCareNavigationPathway({ name, description, owner, risk, source }) {
  return {
    id: `pathway-${Date.now()}`,
    name: name || "New pathway",
    version: "v1 draft",
    source: source || "Local draft",
    owner: owner || "Clinical Lead",
    status: "Draft",
    risk: risk || "High",
    reviewStatus: "Clinical review required",
    lastReviewed: "Not reviewed",
    nextReview: new Date().toISOString().slice(0, 10),
    description: description || "Locally configured care navigation pathway draft.",
    suggestedClinicTypes: ["Routine GP appointment", "Same day GP review", "Nurse appointment"],
    redFlagPlaceholders: ["Any symptom that suggests immediate clinical risk?"],
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
          redFlagPlaceholders: [...(pathway.redFlagPlaceholders || []), safeRedFlag],
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
          suggestedClinicTypes: [...(pathway.suggestedClinicTypes || []), safeClinicType],
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
