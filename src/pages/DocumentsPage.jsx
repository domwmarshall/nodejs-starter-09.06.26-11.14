import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  FileCheck2,
  FileText,
  Route,
  ShieldAlert,
  UploadCloud,
  Wand2,
} from "lucide-react";

import { Badge } from "../components/Badge";
import { DataTable } from "../components/DataTable";
import { MetricCard } from "../components/MetricCard";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import {
  DOCUMENTS_STORAGE_KEY,
  addDocumentRecord,
  createDocumentRecord,
  documentTypes,
  getDocumentMetrics,
  updateDocumentStatus,
} from "../services/documentIntakeService";
import { logActivity } from "../services/activityLogService";
import { AlertBanner, Button, FormField, PageHeader, Panel, fieldClassName } from "../components/ui";

function formatFileSize(bytes = 0) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function MetadataPreview({ record }) {
  if (!record) {
    return (
      <div className="premium-empty-state">
        <FileText size={18} />
        <div><strong>No document selected</strong><span>Upload or select a queued document to preview extracted safe metadata.</span></div>
      </div>
    );
  }

  return (
    <div className="metadata-preview-card">
      <strong>{record.title}</strong>
      <pre>{JSON.stringify(record.metadataPreview, null, 2)}</pre>
    </div>
  );
}

export function DocumentsPage({ currentUser }) {
  const [documents, setDocuments] = useLocalStorageState(DOCUMENTS_STORAGE_KEY, []);
  const [selectedType, setSelectedType] = useState("Other");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  const metrics = useMemo(() => getDocumentMetrics(documents), [documents]);
  const selectedDocument = useMemo(
    () => documents.find((record) => record.id === selectedDocumentId) || documents[0] || null,
    [documents, selectedDocumentId]
  );

  function ingestFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const records = files.map((file) => createDocumentRecord({
      file,
      selectedType,
      owner: currentUser?.name || "Practice Manager",
    }));

    setDocuments((currentRecords) => records.reduce((nextRecords, record) => addDocumentRecord(nextRecords, record), currentRecords));
    setSelectedDocumentId(records[0].id);
    setMessage(`${records.length} document${records.length === 1 ? "" : "s"} added to human review queue.`);

    records.forEach((record) => {
      void logActivity({
        eventType: "document_intake_added",
        module: "Documents",
        title: "Document added to intake queue",
        detail: `${record.fileName} classified as ${record.type}.`,
        actorName: currentUser?.name || "Workspace user",
        actorRole: currentUser?.role || "Unknown role",
        metadata: {
          documentId: record.id,
          type: record.type,
          confidence: record.confidence,
          linkedModule: record.linkedModule,
        },
      });
    });
  }

  function changeDocumentStatus(recordId, status) {
    const record = documents.find((item) => item.id === recordId);
    setDocuments((currentRecords) => updateDocumentStatus(currentRecords, recordId, status));
    setMessage(`${record?.title || "Document"} marked as ${status}.`);

    void logActivity({
      eventType: "document_intake_status_changed",
      module: "Documents",
      title: `Document ${status.toLowerCase()}`,
      detail: `${record?.fileName || recordId} routed to ${record?.linkedModule || "Documents"}.`,
      actorName: currentUser?.name || "Workspace user",
      actorRole: currentUser?.role || "Unknown role",
      metadata: { documentId: recordId, status, linkedModule: record?.linkedModule },
    });
  }

  return (
    <>
      <PageHeader eyebrow="Documents" title="Document intake and human approval queue">
        Upload policies, invoices, GPP CSVs, training evidence, audit evidence and fridge reports into a safe metadata-only queue. Backend AI is planned, but nothing is silently accepted.
      </PageHeader>

      <AlertBanner tone="warning" title="No patient-identifiable data" icon={ShieldAlert}>
        Do not upload real patient-identifiable documents at this stage. The frontend stores metadata only; future extraction should run through backend/Edge Functions with human approval.
      </AlertBanner>

      <section className="metric-grid">
        <MetricCard title="Documents" value={metrics.total} detail="Local intake records" icon={FileText} />
        <MetricCard title="Pending" value={metrics.pending} detail="Need human review" icon={Wand2} />
        <MetricCard title="Approved" value={metrics.approved} detail="Routed after review" icon={CheckCircle2} />
        <MetricCard title="AI-ready" value={metrics.aiReady} detail="Suggestions generated" icon={Route} />
      </section>

      <section className="document-intake-layout">
        <Panel className="panel panel-large">
          <div
            className={`drop-zone ${dragActive ? "drop-zone-active" : ""}`}
            onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
            onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              ingestFiles(event.dataTransfer.files);
            }}
          >
            <UploadCloud size={32} />
            <div>
              <strong>Drop operational documents here</strong>
              <p>Policies, SOPs, invoices, GPP CSVs, fridge reports, audit evidence and training certificates.</p>
            </div>
            <label className="file-picker-button">
              Choose files
              <input ref={inputRef} type="file" multiple onChange={(event) => ingestFiles(event.target.files)} />
            </label>
          </div>

          <div className="intake-preview-grid">
            <FormField label="Manual document type">
              <select className={fieldClassName} value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
                {documentTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </FormField>
            <div className="document-type-card">
              <span>Approval model</span>
              <strong>Review-first</strong>
              <p>Classification/extraction suggestions stay draft until a manager approves them.</p>
            </div>
          </div>

          {message ? <p className="request-preview">{message}</p> : null}
        </Panel>

        <Panel className="panel intake-preview-panel">
          <div className="premium-card-header">
            <div><span>Selected document</span><h3>{selectedDocument?.type || "Waiting"}</h3></div>
            <Badge>{selectedDocument?.status || "No record"}</Badge>
          </div>
          <MetadataPreview record={selectedDocument} />
          {selectedDocument ? (
            <div className="policy-actions">
              <Button type="button" variant="primary" onClick={() => changeDocumentStatus(selectedDocument.id, "Approved")} leftIcon={FileCheck2}>Approve routing</Button>
              <Button type="button" variant="secondary" onClick={() => changeDocumentStatus(selectedDocument.id, "Needs more information")}>Needs info</Button>
            </div>
          ) : null}
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel">
          <div className="premium-card-header"><div><span>Mock AI suggestion</span><h3>Review before use</h3></div><Badge>Backend-only later</Badge></div>
          <div className="blue-box">
            <strong>Suggested action</strong>
            <p>{selectedDocument?.aiSuggestion || "Upload a file to generate a safe mock suggestion."}</p>
          </div>
          <div className="settings-mini-list">
            <div><CheckCircle2 size={18} /><span>No AI keys in frontend code</span></div>
            <div><CheckCircle2 size={18} /><span>Human approval before operational records are created</span></div>
            <div><CheckCircle2 size={18} /><span>Source document metadata is retained for audit</span></div>
          </div>
        </Panel>

        <Panel className="panel">
          <div className="premium-card-header"><div><span>Routing</span><h3>Module destinations</h3></div><Badge>v6.0</Badge></div>
          <div className="governance-alert-grid">
            {documentTypes.map((type) => (
              <div className="governance-alert" key={type}><div><strong>{type}</strong><span>Classify · extract metadata · approve · route to correct module.</span></div><Badge>review</Badge></div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel className="panel">
        <div className="premium-card-header"><div><span>Queue</span><h3>Document intake history</h3></div><Badge>{documents.length} record(s)</Badge></div>
        <DataTable
          columns={[
            { key: "title", label: "Document" },
            { key: "type", label: "Type" },
            { key: "confidence", label: "Confidence" },
            { key: "linkedModule", label: "Routes to" },
            { key: "sizeBytes", label: "Size" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
          rows={documents}
          emptyTitle="No documents uploaded"
          emptyMessage="Drop files into the intake zone above."
          renderCell={(row, key) => {
            if (key === "title") return <button type="button" className="text-button" onClick={() => setSelectedDocumentId(row.id)}><strong>{row.title}</strong><span>{row.classificationReason}</span></button>;
            if (["type", "confidence", "linkedModule", "status"].includes(key)) return <Badge>{row[key]}</Badge>;
            if (key === "sizeBytes") return formatFileSize(row.sizeBytes);
            if (key === "actions") return <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedDocumentId(row.id)}>Preview</Button>;
            return row[key];
          }}
        />
      </Panel>
    </>
  );
}
