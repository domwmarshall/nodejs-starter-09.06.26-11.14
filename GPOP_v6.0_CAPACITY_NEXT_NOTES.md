# GPOP v6.0 Capacity-aware Care Navigation + Bank Costing

## Built in this sprint

- Added cost/wage fields to Bank / locum ad hoc sessions:
  - Pay type: Hourly, Day rate, Fixed session
  - Hourly rate
  - Day/session cost
  - Funding source
  - Auto-calculated session cost from paid hours where hourly
- Preserved bank/locum sessions as real working-pattern capacity.
- Care Navigation now reads the live working-pattern schedule for the selected capacity date.
- Care Navigation now adjusts the booking practitioner based on who is visible in the working pattern:
  - Urgent pathways prefer GP/ANP/duty clinical capacity.
  - MSK only routes to FCP/physio if an FCP/physio is visible in the working pattern; otherwise it falls back to GP/ANP or warns to check SystmOne.
  - Nursing/HCA/admin routes use visible role capacity where possible.
- Added live capacity status/details to the care-nav booking output.
- Added a capacity-date control as the bridge to future SystmOne appointment-book import.

## Important limitation

This still uses current local working-pattern/leave data. It does not yet read SystmOne appointment slots, appointment types, DNA buffers, actual booked availability or clinician triage capacity. The next serious step is Supabase-backed staff/profile/working-pattern tables, then a SystmOne import adapter.
