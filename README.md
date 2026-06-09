# GPOP v6.0 Foundation Build

GPOP (General Practice Operations Portal) is a React/Vite/Supabase prototype being built toward a production-quality UK General Practice operations platform.

This version continues from the supplied working project rather than rebuilding from scratch.

## What changed in v6.0

- Expanded governed Care Navigation into a functional pathway search and note-building workspace.
- Added a starter clinical pathway library with synonyms, category filters, red-flag lockout, supporting actions and SystmOne-style notes.
- Added seed clinical hazard log and clinical safety documentation.
- Added NICE integration plan and mock/offline adapter skeleton.
- Added EasyLog Cloud / EasyCloud fridge integration plan and mock/offline adapter skeleton.
- Added fridge device/readings service foundation.
- Added central Documents intake module with drag/drop upload UI, mock classification, metadata preview and human approval.
- Added feature-level toggles and role dashboard preset data.
- Added Supabase Auth / practice membership scaffold page.
- Added rota, rooms, shifts, missing-shift alerts and drag/drop-ready calendar components.
- Added v6.0 Supabase schema draft migration for auth, documents, clinical, fridge and rota tables.

## Safety notes

- Do not upload patient-identifiable data.
- Care Navigation is prototype-only and must not be used with real patients.
- NICE content is not copied into the app; only source metadata placeholders are used.
- EasyLog Cloud is not scraped; integration is mocked until API access is obtained.
- API keys must not be placed in frontend code.

## Run locally

```bash
npm install
npm run dev
npm run build
```

## Environment

Use `.env.example` as a template. `.env` is excluded from the returned zip.
