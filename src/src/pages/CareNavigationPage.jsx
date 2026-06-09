import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCopy,
  FileText,
  PlusCircle,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { DataTable } from "../components/DataTable";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { formatDate } from "../utils/dateUtils";

import {
  CARE_NAVIGATION_NOTES_STORAGE_KEY,
  CARE_NAVIGATION_PATHWAYS_STORAGE_KEY,
  addCareNavigationNote,
  addCareNavigationPathway,
  addPathwayClinicType,
  addPathwayRedFlag,
  buildBookingText,
  buildSystmOneNote,
  createCareNavigationNote,
  createCareNavigationPathway,
  filterCareNavigationPathways,
  getCareNavigationMetrics,
  getCareNavigationPathwayById,
  getDefaultCareNavigationGovernanceChecklist,
  getDefaultCareNavigationPathways,
  getDefaultSampleCareNavigationCalls,
  getGovernanceChecklistMetrics,
  getInitialClinicType,
  getPathwaySafetyStatus,
  getRedFlagOutcome,
  getSafeCareNavigationNotes,
  getSafeCareNavigationPathways,
  updateCareNavigationPathway,
} from "../services/careNavigationService";

import {
  AlertBanner,
  Button,
  FormField,
  PageHeader,
  Panel,
  fieldClassName,
} from "../components/ui";

const careNavigationGovernanceChecklist = getDefaultCareNavigationGovernanceChecklist();

export function CareNavigationPage() {
  const [pathways, setPathways] = useLocalStorageState(
    CARE_NAVIGATION_PATHWAYS_STORAGE_KEY,
    getDefaultCareNavigationPathways()
  );
  const [notes, setNotes] = useLocalStorageState(
    CARE_NAVIGATION_NOTES_STORAGE_KEY,
    getDefaultSampleCareNavigationCalls()
  );

  const safePathways = useMemo(() => getSafeCareNavigationPathways(pathways), [pathways]);
  const safeNotes = useMemo(() => getSafeCareNavigationNotes(notes), [notes]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedPathwayId, setSelectedPathwayId] = useState(safePathways[0].id);

  const [presentingRequest, setPresentingRequest] = useState("");
  const [duration, setDuration] = useState("");
  const [knownIssue, setKnownIssue] = useState("No");
  const [selectedClinicType, setSelectedClinicType] = useState(getInitialClinicType(safePathways[0]));
  const [selectedRedFlags, setSelectedRedFlags] = useState([]);
  const [redFlagSummary, setRedFlagSummary] = useState("");
  const [supportingAction, setSupportingAction] = useState("None");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [newPathwayName, setNewPathwayName] = useState("Medication query");
  const [newPathwayDescription, setNewPathwayDescription] = useState("Reception workflow for medicine-related requests.");
  const [newPathwayOwner, setNewPathwayOwner] = useState("Clinical Lead");
  const [newPathwayRisk, setNewPathwayRisk] = useState("High");
  const [newPathwaySource, setNewPathwaySource] = useState("Local draft");
  const [newRedFlag, setNewRedFlag] = useState("");
  const [newClinicType, setNewClinicType] = useState("");

  const selectedPathway = useMemo(
    () => getCareNavigationPathwayById(safePathways, selectedPathwayId),
    [safePathways, selectedPathwayId]
  );

  const filteredPathways = useMemo(
    () => filterCareNavigationPathways(safePathways, searchTerm, statusFilter),
    [safePathways, searchTerm, statusFilter]
  );

  const pathwayMetrics = useMemo(
    () => getCareNavigationMetrics(safePathways, safeNotes),
    [safePathways, safeNotes]
  );

  const governanceMetrics = useMemo(
    () => getGovernanceChecklistMetrics(careNavigationGovernanceChecklist),
    []
  );

  const selectedSafetyStatus = useMemo(
    () => getPathwaySafetyStatus(selectedPathway),
    [selectedPathway]
  );

  const redFlagOutcome = useMemo(
    () => getRedFlagOutcome(selectedRedFlags),
    [selectedRedFlags]
  );

  function changeSelectedPathway(pathwayId) {
    const nextPathway = getCareNavigationPathwayById(safePathways, pathwayId);
    setSelectedPathwayId(nextPathway.id);
    setSelectedClinicType(getInitialClinicType(nextPathway));
    setSelectedRedFlags([]);
    setRedFlagSummary("");
    setAdditionalNotes("");
    setSaveMessage("");
  }

  function toggleRedFlag(redFlag) {
    setSelectedRedFlags((currentFlags) =>
      currentFlags.includes(redFlag)
        ? currentFlags.filter((item) => item !== redFlag)
        : [...currentFlags, redFlag]
    );
  }

  function submitPathway(event) {
    event.preventDefault();
    const newPathway = createCareNavigationPathway({
      name: newPathwayName,
      description: newPathwayDescription,
      owner: newPathwayOwner,
      risk: newPathwayRisk,
      source: newPathwaySource,
    });
    setPathways((currentPathways) => addCareNavigationPathway(currentPathways, newPathway));
    changeSelectedPathway(newPathway.id);
    setNewPathwayName("");
  }

  function addRedFlag(event) {
    event.preventDefault();
    setPathways((currentPathways) => addPathwayRedFlag(currentPathways, selectedPathway.id, newRedFlag));
    setNewRedFlag("");
  }

  function addClinicType(event) {
    event.preventDefault();
    setPathways((currentPathways) => addPathwayClinicType(currentPathways, selectedPathway.id, newClinicType));
    setNewClinicType("");
  }

  const bookingTextPreview = buildBookingText({
    selectedPathway,
    presentingRequest,
    selectedClinicType,
    redFlagOutcome,
  });

  const systmOneNotePreview = buildSystmOneNote({
    selectedPathway,
    presentingRequest,
    duration,
    knownIssue,
    selectedClinicType,
    supportingAction,
    selectedRedFlags,
    redFlagSummary,
    additionalNotes,
  });

  function saveMockNote() {
    const newNote = createCareNavigationNote({
      selectedPathway,
      presentingRequest,
      selectedClinicType,
      supportingAction,
      selectedRedFlags,
      notePreview: systmOneNotePreview,
    });

    setNotes((currentNotes) => addCareNavigationNote(currentNotes, newNote));
    setSaveMessage("Mock care navigation note saved to history.");
  }

  function resetCareNavigation() {
    const confirmed = window.confirm("Reset care navigation pathways and notes to demo data?");
    if (!confirmed) return;
    const defaultPathways = getDefaultCareNavigationPathways();
    setPathways(defaultPathways);
    setNotes(getDefaultSampleCareNavigationCalls());
    setSelectedPathwayId(defaultPathways[0].id);
  }

  return (
    <>
      <PageHeader eyebrow="Care Navigation" title="Governed care navigation builder">
        Build pathway drafts, configure red-flag prompts, generate SystmOne-ready
        note text and save mock call outcomes. Still prototype-only and blocked
        from real patient use.
      </PageHeader>

      <AlertBanner tone="danger" title="Not for real patient use" icon={AlertTriangle}>
        This module remains a prototype. It can design structure, text and
        governance controls, but must not be used with real patients until
        clinical safety, pathway approval, audit logging and IG controls are in place.
      </AlertBanner>

      <section className="metric-grid">
        <MetricCard title="Pathways" value={pathwayMetrics.totalPathways} detail="Configurable pathway library" icon={Stethoscope} />
        <MetricCard title="Draft" value={pathwayMetrics.draftPathways.length} detail="Require clinical review" icon={FileText} />
        <MetricCard title="Locked" value={pathwayMetrics.lockedPathways.length} detail="Blocked from prototype use" icon={ShieldCheck} />
        <MetricCard title="Saved notes" value={safeNotes.length} detail="Mock call records" icon={ClipboardCopy} />
      </section>

      {selectedRedFlags.length > 0 ? (
        <AlertBanner tone="danger" title="Red-flag routine booking lock" icon={AlertTriangle}>
          One or more red-flag prompts are selected. The generated booking text
          changes to urgent clinician review and routine booking should be stopped.
        </AlertBanner>
      ) : null}

      <section className="content-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Pathway library" title="Care navigation pathways">
            Search, select and configure pathways. Approved/draft status controls
            the safety label and governance warnings.
          </SectionHeader>

          <div className="compliance-toolbar">
            <label className="search-input">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search pathways, sources, owners..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <label className="filter-select">
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option>All</option>
                <option>Draft</option>
                <option>Locked</option>
                <option>Approved</option>
                <option>Retired</option>
              </select>
            </label>
          </div>

          <DataTable
            columns={[
              { key: "name", label: "Pathway" },
              { key: "version", label: "Version" },
              { key: "source", label: "Source" },
              { key: "owner", label: "Owner" },
              { key: "status", label: "Status" },
              { key: "risk", label: "Risk" },
              { key: "reviewStatus", label: "Review" },
            ]}
            rows={filteredPathways}
            emptyTitle="No pathways found"
            emptyMessage="Try clearing the search box or changing the status filter."
            renderCell={(row, key) => {
              if (key === "name") {
                return (
                  <Button type="button" variant="ghost" size="sm" className="text-button" style={{ padding: 0, justifyContent: "flex-start" }} onClick={() => changeSelectedPathway(row.id)}>
                    {row.name}
                  </Button>
                );
              }

              if (key === "status" || key === "risk" || key === "reviewStatus") {
                return <Badge>{key === "risk" ? `${row.risk} risk` : row[key]}</Badge>;
              }

              return row[key];
            }}
          />
        </Panel>

        <Panel as="aside" className="panel policy-detail-panel">
          <SectionHeader eyebrow="Selected pathway" title={selectedPathway.name}>
            {selectedPathway.description}
          </SectionHeader>

          <div className="policy-detail-grid">
            <div><span>Version</span><strong>{selectedPathway.version}</strong></div>
            <div><span>Status</span><Badge>{selectedPathway.status}</Badge></div>
            <div><span>Risk</span><Badge>{selectedPathway.risk} risk</Badge></div>
            <div><span>Owner</span><strong>{selectedPathway.owner}</strong></div>
            <div><span>Source</span><strong>{selectedPathway.source}</strong></div>
            <div><span>Review status</span><Badge>{selectedPathway.reviewStatus}</Badge></div>
            <div><span>Safety label</span><Badge>{selectedSafetyStatus.label}</Badge></div>
            <div><span>Safety detail</span><strong>{selectedSafetyStatus.detail}</strong></div>
          </div>

          <div className="policy-actions">
            <Button type="button" variant="primary" onClick={() => setPathways((currentPathways) => updateCareNavigationPathway(currentPathways, selectedPathway.id, { status: "Approved", reviewStatus: "Mock approval recorded", risk: "Medium", lastReviewed: new Date().toISOString().slice(0, 10) }))}>Mock approve</Button>
            <Button type="button" variant="danger" onClick={() => setPathways((currentPathways) => updateCareNavigationPathway(currentPathways, selectedPathway.id, { status: "Locked", reviewStatus: "Locked pending governance", risk: "High" }))}>Lock</Button>
            <Button type="button" variant="secondary" onClick={resetCareNavigation}>Reset</Button>
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Call builder" title="Reception call workflow">
            Complete a structured prototype note and see how red flags affect the
            generated booking text.
          </SectionHeader>

          <form className="care-nav-form">
            <FormField label="Selected pathway">
              <select className={fieldClassName} value={selectedPathwayId} onChange={(event) => changeSelectedPathway(event.target.value)}>
                {safePathways.map((pathway) => <option key={pathway.id} value={pathway.id}>{pathway.name}</option>)}
              </select>
            </FormField>
            <FormField label="Presenting request"><input className={fieldClassName} placeholder="Example: back pain, rash, sore throat" value={presentingRequest} onChange={(event) => setPresentingRequest(event.target.value)} /></FormField>
            <FormField label="Duration"><input className={fieldClassName} placeholder="Example: 3 days" value={duration} onChange={(event) => setDuration(event.target.value)} /></FormField>
            <FormField label="Recurring / known issue?"><select className={fieldClassName} value={knownIssue} onChange={(event) => setKnownIssue(event.target.value)}><option>No</option><option>Yes</option><option>Not known</option></select></FormField>
            <FormField label="Suggested clinic/action type"><select className={fieldClassName} value={selectedClinicType} onChange={(event) => setSelectedClinicType(event.target.value)}>{selectedPathway.suggestedClinicTypes.map((clinicType) => <option key={clinicType}>{clinicType}</option>)}</select></FormField>
            <FormField label="Supporting action"><select className={fieldClassName} value={supportingAction} onChange={(event) => setSupportingAction(event.target.value)}><option>None</option><option>Text patient image upload link</option><option>Ask patient to provide urine sample</option><option>Ask patient to collect stool sample pot</option><option>Ask patient to collect throat swab</option><option>Book with clinician first</option></select></FormField>

            <div className="training-role-box">
              <strong>Red flag prompts</strong>
              <div className="question-list">
                {selectedPathway.redFlagPlaceholders.map((redFlag) => (
                  <button key={redFlag} type="button" className={selectedRedFlags.includes(redFlag) ? "question-item question-item-active" : "question-item"} onClick={() => toggleRedFlag(redFlag)}>
                    <strong>{redFlag}</strong>
                    <Badge>{selectedRedFlags.includes(redFlag) ? "Selected" : "Not selected"}</Badge>
                  </button>
                ))}
              </div>
            </div>

            <FormField label="Red-flag free text"><textarea className={fieldClassName} placeholder="Prototype only. Do not use for real patient safety decisions." value={redFlagSummary} onChange={(event) => setRedFlagSummary(event.target.value)} /></FormField>
            <FormField label="Additional notes"><textarea className={fieldClassName} placeholder="Optional non-clinical note details" value={additionalNotes} onChange={(event) => setAdditionalNotes(event.target.value)} /></FormField>
          </form>
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Generated output" title="Booking text and SystmOne note">
            Short text is designed for the booking slot. Longer text is a mock
            clinical admin note preview only.
          </SectionHeader>

          <div className="blue-box">
            <strong>Booking slot text</strong>
            <p>{bookingTextPreview}</p>
          </div>

          <pre className="note-preview dashboard-section-spacing">{systmOneNotePreview}</pre>

          <div className="policy-actions">
            <Button type="button" variant="primary" onClick={saveMockNote}>Save mock note</Button>
            <Button type="button" variant="secondary" onClick={() => setSaveMessage("Copy action simulated in prototype.")}>Copy text</Button>
          </div>

          {saveMessage ? <p className="request-preview">{saveMessage}</p> : null}
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Pathway builder" title="Create pathway draft">
            Add draft pathways and then add red flags or clinic/action options.
          </SectionHeader>

          <form className="audit-submit-form" onSubmit={submitPathway}>
            <FormField label="Pathway name"><input className={fieldClassName} value={newPathwayName} onChange={(event) => setNewPathwayName(event.target.value)} /></FormField>
            <FormField label="Description"><textarea className={fieldClassName} value={newPathwayDescription} onChange={(event) => setNewPathwayDescription(event.target.value)} /></FormField>
            <FormField label="Owner"><input className={fieldClassName} value={newPathwayOwner} onChange={(event) => setNewPathwayOwner(event.target.value)} /></FormField>
            <FormField label="Risk"><select className={fieldClassName} value={newPathwayRisk} onChange={(event) => setNewPathwayRisk(event.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></FormField>
            <FormField label="Source"><input className={fieldClassName} value={newPathwaySource} onChange={(event) => setNewPathwaySource(event.target.value)} /></FormField>
            <Button type="submit" variant="primary" leftIcon={PlusCircle}>Create pathway</Button>
          </form>
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Configure selected pathway" title="Prompts and actions">
            Add pathway-specific red flags and clinic/action options.
          </SectionHeader>

          <form className="inline-form" onSubmit={addRedFlag}>
            <input value={newRedFlag} onChange={(event) => setNewRedFlag(event.target.value)} placeholder="Add red flag prompt" />
            <Button type="submit" variant="danger">Add red flag</Button>
          </form>

          <form className="inline-form dashboard-section-spacing" onSubmit={addClinicType}>
            <input value={newClinicType} onChange={(event) => setNewClinicType(event.target.value)} placeholder="Add clinic/action type" />
            <Button type="submit" variant="primary">Add action</Button>
          </form>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Governance" title="Approval checklist">
            Required before this module can be used in a live practice setting.
          </SectionHeader>

          <div className="governance-alert-grid">
            {careNavigationGovernanceChecklist.map((item) => (
              <div className="governance-alert" key={item.id}>
                <div><strong>{item.item}</strong><span>{item.note}</span></div>
                <Badge>{item.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Governance summary" title="Clinical safety position">
            Summary of pathway and checklist readiness.
          </SectionHeader>

          <div className="governance-alert-grid">
            <div className="governance-alert"><div><strong>Clinically unsafe pathways</strong><span>{pathwayMetrics.clinicallyUnsafePathways.length} pathway(s) require clinical/governance review.</span></div><Badge>High risk</Badge></div>
            <div className="governance-alert"><div><strong>Required checklist items</strong><span>{governanceMetrics.requiredItems.length} required governance item(s) still need completion.</span></div><Badge>Required</Badge></div>
            <div className="governance-alert"><div><strong>Production status</strong><span>Care navigation must remain prototype-only until approved.</span></div><Badge>Locked</Badge></div>
          </div>
        </Panel>
      </section>

      <Panel className="panel">
        <SectionHeader eyebrow="Mock history" title="Recent care navigation notes">
          Example records only. Real use would require authentication, audit logs,
          pathway versioning and secure storage.
        </SectionHeader>

        <DataTable
          columns={[
            { key: "date", label: "Date" },
            { key: "pathway", label: "Pathway" },
            { key: "contactType", label: "Contact type" },
            { key: "presentingRequest", label: "Request" },
            { key: "selectedClinicType", label: "Clinic/action" },
            { key: "status", label: "Status" },
          ]}
          rows={safeNotes}
          renderCell={(row, key) => {
            if (key === "date") return formatDate(row.date);
            if (key === "pathway") return <strong>{row.pathway}</strong>;
            if (key === "status" || key === "selectedClinicType") return <Badge>{row[key]}</Badge>;
            return row[key];
          }}
        />
      </Panel>
    </>
  );
}
