# Staff import — Work Patterns CSV dated 07/06/2026

Source file used during build: `Work Patterns - 07_06_2026.csv`.

Imported into the local fallback seed data:

- Millie Buesnel
- Alison Cannon
- Shirley Carter
- Alison Clarke
- Caitlin Clarke
- Donna Cook
- Prosper Ehiwarior
- Sarah Gannon
- Dominic Marshall
- Jenny Moore
- Angela Pope
- Shakthi Rajput
- Genevieve Rose
- Deborah Squires
- Toni Ward
- Susan Willoughby

## What was imported

The CSV supplied weekly availability and paid hours by weekday. GPOP now stores this as structured working-pattern data with:

- start time
- finish time
- unpaid break minutes
- calculated paid hours
- weekly / fortnightly cycle metadata
- source note on the staff record

For rows where the CSV gave start/finish plus paid hours, unpaid break was inferred as:

`finish - start - paid hours`

For example, `08:30 - 18:00` with `8 hrs 30 mins` becomes a 60-minute unpaid break.

## What still needs admin confirmation

The CSV did not include role, team, pay, pension, funding, phone, email, DBS or professional registration data.

Where the role is already known from the existing GPOP context, it has been prefilled. Otherwise the role is deliberately set to `Role to confirm` and the team to `Unassigned` so the system does not pretend to know live HR data.

Before using the workforce data operationally, confirm:

- job role
- team / rota cover group
- NHS pension status
- pay type and rate / salary
- funding source and funding percentage
- ARRS claimable percentage where applicable
- line manager
- work email and phone
- DBS / professional registration metadata
- whether the imported pattern is current and contractual

## Database direction

The app still uses localStorage fallback for staff records while Supabase staff tables are being wired. The schema already includes staff profiles, contacts, contracts and working patterns. The next database step is to create a staff-import workflow that writes these records to Supabase under the active `practice_id` with audit logging.
