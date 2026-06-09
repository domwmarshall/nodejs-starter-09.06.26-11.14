# GPOP NICE Integration Plan

Status: **architecture scaffold only**. GPOP must not pretend it has permission to use NICE content in AI workflows until the correct NICE syndication access, licence and governance controls are in place.

## Source position checked June 2026

NICE provides a syndication service/API intended to let third parties reuse NICE national content in their own systems. NICE describes the API as a REST-style/web-services route for quality-assured digital content reuse, and its API guide was last updated in July 2023. NICE also has an application form for API access; the application page says the API covers published guidance, quality standards and Information for the public, and does **not** contain Clinical Knowledge Summaries.

Primary URLs:
- https://www.nice.org.uk/reusing-our-content/nice-syndication-api
- https://www.nice.org.uk/corporate/ecd10
- https://www.nice.org.uk/reusing-our-content/nice-syndication-api/nice-syndication-api-application-form

## Access steps for product owner

1. Read the NICE syndication API guide and licence terms.
2. Submit the NICE syndication API application form.
3. Describe GPOP as a UK general practice operations platform with governed care-navigation support, not autonomous diagnosis software.
4. State exactly which content types are needed: guidance metadata, title, source organisation, source URL, publication/review dates and pathway source references.
5. Be explicit whether AI will be used. For GPOP v6.0, AI must not train on NICE content and must not generate live clinical logic from NICE content without licence and human clinical approval.
6. Confirm licence terms for commercial SaaS reuse across GP practices, PCNs and ICBs.
7. Confirm whether storing local copies, excerpts, derived pathways, search indexes or embeddings is permitted.
8. Confirm required attribution wording and refresh cadence.

## Technical architecture

Frontend:
- `src/services/niceSourceService.js` exposes a safe adapter in mock/offline mode.
- `src/services/clinicalPathwayService.js` maps source metadata to governed pathway versions.
- `src/data/starterClinicalPathways.js` contains **prototype local pathways only**, not copied NICE content.

Backend/Supabase Edge Functions planned:
- `supabase/functions/nice-search`
- `supabase/functions/nice-sync-guidance`
- `supabase/functions/clinical-source-refresh`

Environment variables:
- `VITE_NICE_API_ENABLED=false` may be used by the frontend for visibility only.
- `NICE_API_KEY` must be stored server-side only as an Edge Function secret. It must never be exposed in React/Vite browser code.

## Database tables planned

- `clinical_sources`
- `clinical_source_versions`
- `clinical_pathways`
- `clinical_pathway_versions`
- `clinical_pathway_questions`
- `clinical_pathway_actions`
- `clinical_pathway_approvals`
- `clinical_hazard_log`
- `clinical_safety_cases`

Each source record should store only controlled metadata unless licence permits more:
- source organisation
- source title
- source URL/API path
- retrieved date
- publication/review date
- content type
- licence/attribution fields
- refresh status
- pathway links

## AI restrictions

AI may assist with:
- summarising draft pathway content for human review where licensing allows
- suggesting plain-English questionnaire wording from approved source material
- mapping a presenting problem to an already approved local pathway
- identifying missing governance metadata

AI must not:
- train on NICE content
- scrape NICE content
- store uncontrolled NICE content or embeddings without permission
- generate unapproved clinical logic for live use
- alter approved pathways without review
- hide source provenance
- produce definitive clinical outcomes

## Human clinical review gate

A pathway cannot move from Prototype/Draft to Approved until:
- named clinical owner is recorded
- source metadata is recorded
- red flags and escalation rules are explicitly approved
- review date is set
- hazard references are linked
- approval event is audit logged
- clinical safety case is updated
