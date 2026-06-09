# GPOP v6.0 Functional Product Core

Source of truth: uploaded project zip continued in place. This update does not rebuild from scratch.

## Implemented in this package

- Added navigation entries for Documents and Access/Auth so existing v6.0 scaffold pages are reachable.
- Expanded settings/module configuration for Documents, Access, feature flags and role dashboard presets.
- Built a functional Supabase Auth scaffold page with local fallback session, practice/profile/membership/invite structure, role selection and activity logging.
- Built a functional Document Intake page with drag/drop/file picker, safe metadata-only records, mock classification, approval queue, module routing and activity logging.
- Expanded Care Navigation service with starter pathway library mapping, fuzzy search, synonym matching, routine prompt metadata, source/governance metadata and safer SystmOne note output.
- Upgraded Calendar/Rota page with v6.0 rota foundation: day selector, room view, drag/drop-ready shift cards, missing shift alerts, shift detail panel, shift filler suggestions and activity logging.
- Added dashboard feature flag awareness and role dashboard preset chips.
- Preserved Supabase activity logging fallback behaviour.

## Guardrails retained

- No patient-identifiable data added.
- Clinical pathway functionality remains governed care-navigation support only, not autonomous diagnosis.
- NICE and EasyCloud remain backend/Edge Function integration plans/scaffolds only.
- No frontend service-role secrets.
- npm install and npm run build have passed.

## v6.0 UX Rescue Pass - 2026-06-08

Focused fix based on live browser testing feedback:

- Dashboard now has click-through drilldown buttons for open actions, cover risks and fridge status, plus a View all control for the high-priority queue.
- Staff UI has additional anti-crush CSS: wider record cards, better form grids, static profile panel on constrained screens and better wrapping for dense data cards.
- Rota UI has a no-overlap layout: the main rota command grid now uses a single full-width row, room cards auto-fit, shift cards wrap safely and the availability rail sits below rather than colliding with room columns.
- Care Navigation rebuilt into a receptionist-first console:
  - searchable left pathway library
  - selected pathway detail accordion
  - click-through call workflow steps
  - red-flag lockout step
  - routine question step with answer capture
  - routing/supporting-action step
  - SystmOne output step
- Care Navigation starter pathway shells expanded to 149 total prototype pathways. These are metadata/routing shells only and remain governed/prototype content until clinician sign-off.
- Existing localStorage pathway arrays are now merged with the expanded default library, so previously loaded browsers can see new default pathway shells without needing a reset.
- Access/Auth metric cards now have spacing fixes so labels and values no longer concatenate visually.

Validation:

- npm install passed.
- npm run build passed.
- The only build note is the existing Vite large chunk warning.

Safety posture:

- No patient-identifiable data added.
- No frontend secrets added.
- No autonomous diagnosis added.
- Care Navigation remains governed support only and approval-gated.

## v6.0 Care Navigation reception-console rescue

- Rebuilt Care Navigation into a single-screen receptionist-first console.
- Added live fuzzy search pathway results with fast selection and auto-select when the current selected pathway falls outside the active search.
- Replaced the multi-accordion workflow with compact triage panels.
- Added simple Yes / No / Not asked controls for red-flag prompts and routine pathway prompts.
- Red-flag Yes answers now automatically lock routine booking output and change the SystmOne text to urgent clinician review.
- Added compact call intake, supporting action, live booking text and SystmOne note preview on the same screen.
- Moved builder, governance and local history into a collapsed admin/governance drawer so reception users do not have to scroll through admin controls.
- Updated SystmOne note generation so question answers are written into the note rather than left as “not entered”.
- Care navigation remains governed support only and must not be used for autonomous diagnosis or live patient triage without clinical sign-off.
