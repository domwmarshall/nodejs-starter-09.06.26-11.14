import { FileText, UploadCloud, Wand2 } from "lucide-react";
import { Badge } from "../components/Badge";
import { PageHeader, Panel } from "../components/ui";

const documentTypes = [
  "Policy / SOP",
  "Training evidence",
  "Audit evidence",
  "Supplier invoice",
  "GPP CSV",
  "Fridge report",
];

export function DocumentsPage({ currentUser }) {
  return (
    <>
      <PageHeader eyebrow="Documents" title="Document intake">
        A clean intake workspace for future AI-assisted classification. No patient-identifiable data should be uploaded at this stage.
      </PageHeader>

      <section className="premium-dashboard-grid">
        <Panel className="premium-card premium-card-primary">
          <div className="premium-card-header">
            <div>
              <span>Upload</span>
              <h3>Drop documents here</h3>
            </div>
            <Badge>Human review required</Badge>
          </div>
          <div className="premium-empty-state document-dropzone">
            <UploadCloud size={24} />
            <div>
              <strong>Drag-and-drop placeholder</strong>
              <span>Future Edge Functions will classify, extract and queue documents for approval.</span>
            </div>
          </div>
        </Panel>

        <Panel className="premium-card">
          <div className="premium-card-header">
            <div>
              <span>Review</span>
              <h3>AI-ready workflow</h3>
            </div>
            <Badge>Mock mode</Badge>
          </div>
          <div className="premium-action-list">
            {documentTypes.map((type) => (
              <article className="premium-action-row" key={type}>
                <div className="premium-action-icon"><FileText size={16} /></div>
                <div>
                  <strong>{type}</strong>
                  <span>Classify · extract metadata · approve before saving</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <Panel className="premium-card">
        <div className="premium-card-header">
          <div>
            <span>Governance</span>
            <h3>Processing guardrails</h3>
          </div>
          <Badge>{currentUser?.role || "User"}</Badge>
        </div>
        <div className="premium-insight-list">
          <article className="premium-insight-row">
            <div className="premium-insight-icon"><Wand2 size={17} /></div>
            <div>
              <strong>AI outputs stay as suggestions</strong>
              <span>Nothing becomes an operational record until a user reviews and approves it.</span>
            </div>
          </article>
        </div>
      </Panel>
    </>
  );
}
