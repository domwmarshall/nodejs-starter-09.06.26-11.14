# GPOP Clinical Safety Plan

Status: v6.0 scaffold. The care-navigation module is care-navigation support and governance support only. It is not diagnostic software and must not replace clinical judgement.

## Clinical safety standard direction

GPOP should align with DCB0129 manufacturer expectations for health IT systems that may influence clinical workflow. NHS England describes DCB0129 as a standard to help manufacturers evidence clinical safety, and DCB0160 as the related deployment/use standard for health organisations.

Primary URLs:
- https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems
- https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/

## Safety principles

1. GPOP does not diagnose.
2. GPOP does not autonomously triage.
3. GPOP supports care-navigation documentation, pathway selection and governance.
4. Red-flag logic is explicit, deterministic and visible.
5. AI-generated pathway drafts cannot become live without human clinical approval.
6. Every material pathway edit, approval and use is audit logged.
7. Every pathway has a clinical owner, approval status, source metadata, review date and version.
8. Prototype pathways are locked from live patient use.

## Required safety artefacts

- Clinical Safety Officer / named clinical lead
- Clinical Safety Case Report structure
- Hazard log
- Safety case assumptions
- Pathway version history
- Pathway approval records
- Source provenance records
- Test evidence for red-flag lockouts
- Post-market / live-use incident review process

## Seed hazard log

The v6.0 starter app includes a seed hazard log in `starterClinicalPathways.js`, including:
- high-risk symptom incorrectly routed as routine
- emergency wording used without local approval
- reception script misses an important red flag
- time-critical symptom not escalated quickly
- medication query routed without medicines oversight
- admin workflow accidentally generates clinical advice
- safeguarding or mental-health risk not recognised

## Live-use gate

No care-navigation pathway can be used live until:
- production auth and RLS are in place
- audit log uses authenticated user/practice IDs
- pathway is clinically approved
- practice SOP and staff training are complete
- DPIA/IG review confirms whether any PID can be processed
- relevant NICE/NHS/local source licence terms are satisfied
