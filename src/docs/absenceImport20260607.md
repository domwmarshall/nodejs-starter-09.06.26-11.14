# Absence Import — 07/06/2026

Source file: `Absences - Fleggburgh Surgery - D82600.csv`.

Imported into `src/data/importedAbsences.js` as default leave/absence seed data.

## Import behaviour

- Preserves staff name, role from source, leave type, start date, end date, status, allowance unit, allowance used, request date and description.
- Uses source allowance hours when the source file records hours.
- Flags records for recalculation where the source file used days or reported zero allowance used.
- Supports multi-day absences using `startDate` and `endDate`.
- Manual leave bookings now calculate deduction from the staff member's working pattern.

## Deduction logic

For each date in the selected range, GPOP checks the staff member's working pattern cycle and adds a deduction only when the staff member is scheduled to work.

Paid deducted hours are based on the working-pattern row:

`finish time - start time - unpaid break minutes`

The preview shows calendar days, working shifts and deducted hours before the request is saved.

## Bank holiday weighting

The previous approach deducted scheduled bank holidays directly from annual leave. This version separates:

- annual leave hours from holiday weeks
- pro-rata bank holiday entitlement hours
- actual scheduled bank holiday hours
- resulting bank holiday weighting balance

This is deliberately transparent so the practice can decide whether to show the positive/negative bank-holiday balance as adjustment, bookable leave, or a separate HR warning.
