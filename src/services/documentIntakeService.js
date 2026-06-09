import { SETTINGS_STORAGE_KEYS } from "./settingsService";

export const DOCUMENTS_STORAGE_KEY = SETTINGS_STORAGE_KEYS.documents;

export const documentTypes = [
  "Policy/SOP",
  "Staff training evidence",
  "Audit evidence",
  "Supplier invoice",
  "GPP CSV",
  "NHS payment statement",
  "Fridge report",
  "Other",
];

const classifierRules = [
  { type: "Supplier invoice", tokens: ["invoice", "supplier", "psuk", "aah", "phoenix", "purchase"] },
  { type: "GPP CSV", tokens: ["gpp", "csv", "payment", "dispensing"] },
  { type: "NHS payment statement", tokens: ["pcse", "statement", "nhs", "payment"] },
  { type: "Policy/SOP", tokens: ["policy", "sop", "procedure", "protocol"] },
  { type: "Staff training evidence", tokens: ["training", "certificate", "competency", "cpr"] },
  { type: "Audit evidence", tokens: ["audit", "fire", "legionella", "pat", "risk assessment"] },
  { type: "Fridge report", tokens: ["fridge", "temperature", "easylog", "vaccine"] },
];

function normalise(value) {
  return String(value || "").toLowerCase();
}

export function classifyDocument(fileName = "", selectedType = "Other") {
  if (selectedType && selectedType !== "Other") {
    return {
      type: selectedType,
      confidence: "User selected",
      reason: "Classification was chosen manually by the uploader.",
    };
  }

  const text = normalise(fileName);
  const match = classifierRules.find((rule) => rule.tokens.some((token) => text.includes(token)));

  if (!match) {
    return {
      type: "Other",
      confidence: "Low",
      reason: "No strong filename signal. Human review required before saving.",
    };
  }

  return {
    type: match.type,
    confidence: "Medium",
    reason: `Filename matched: ${match.tokens.filter((token) => text.includes(token)).join(", ")}`,
  };
}

export function createDocumentRecord({ file, selectedType, owner = "Practice Manager" }) {
  const classification = classifyDocument(file?.name, selectedType);
  const now = new Date().toISOString();
  const extension = String(file?.name || "").split(".").pop()?.toLowerCase() || "unknown";

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: file?.name || "Untitled upload",
    fileName: file?.name || "Unknown file",
    sizeBytes: file?.size || 0,
    mimeType: file?.type || "Unknown",
    extension,
    type: classification.type,
    confidence: classification.confidence,
    classificationReason: classification.reason,
    owner,
    status: "Pending human review",
    uploadedAt: now,
    linkedModule: getLinkedModule(classification.type),
    metadataPreview: buildMetadataPreview(file, classification.type),
    aiSuggestion: buildMockAiSuggestion(classification.type),
    approved: false,
  };
}

export function getLinkedModule(type) {
  const map = {
    "Policy/SOP": "Compliance",
    "Staff training evidence": "Training",
    "Audit evidence": "Audits",
    "Supplier invoice": "Finance",
    "GPP CSV": "Finance",
    "NHS payment statement": "Finance",
    "Fridge report": "Audits",
    Other: "Documents",
  };
  return map[type] || "Documents";
}

export function buildMetadataPreview(file, type) {
  const today = new Date().toISOString().slice(0, 10);
  const base = {
    extractedTitle: file?.name?.replace(/\.[^/.]+$/, "") || "Untitled document",
    detectedDate: today,
    reviewRequired: "Yes",
  };

  if (type === "Policy/SOP") {
    return {
      ...base,
      owner: "Policy owner required",
      reviewDate: "Not detected",
      questionnaireDraft: "5 acknowledgement questions can be generated after human review.",
    };
  }

  if (["Supplier invoice", "GPP CSV", "NHS payment statement"].includes(type)) {
    return {
      ...base,
      supplier: "Not parsed in frontend",
      invoiceNumber: "Backend extraction required",
      lineItems: "Awaiting Edge Function extraction",
    };
  }

  if (type === "Fridge report") {
    return {
      ...base,
      device: "Device mapping required",
      readings: "CSV/PDF parsing planned",
      excursions: "Human review required",
    };
  }

  return base;
}

export function buildMockAiSuggestion(type) {
  if (type === "Policy/SOP") {
    return "Draft staff acknowledgement questionnaire and extract policy owner/review date, then require manager approval before Compliance tasks are generated.";
  }

  if (type === "Supplier invoice") {
    return "Extract supplier, date, invoice number and line items via backend-only AI/OCR, then route approved lines into Finance/Dispensary profitability.";
  }

  if (type === "GPP CSV" || type === "NHS payment statement") {
    return "Validate file format, map reimbursement values and flag missing/negative-margin items for finance review.";
  }

  return "Classify, extract safe metadata only and require human approval before linking to a module.";
}

export function addDocumentRecord(records = [], record) {
  return [record, ...(Array.isArray(records) ? records : [])];
}

export function updateDocumentStatus(records = [], recordId, status) {
  return (Array.isArray(records) ? records : []).map((record) =>
    record.id === recordId
      ? {
          ...record,
          status,
          approved: status === "Approved",
          reviewedAt: new Date().toISOString(),
        }
      : record
  );
}

export function getDocumentMetrics(records = []) {
  const safe = Array.isArray(records) ? records : [];
  return {
    total: safe.length,
    pending: safe.filter((record) => record.status === "Pending human review").length,
    approved: safe.filter((record) => record.status === "Approved").length,
    aiReady: safe.filter((record) => record.aiSuggestion).length,
  };
}
