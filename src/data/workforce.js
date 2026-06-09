export const FISCAL_YEAR = {
  label: "2026/27",
  start: "2026-04-01",
  end: "2027-03-31",
};

export const BANK_HOLIDAYS_2026_27 = [
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-06", name: "Easter Monday" },
  { date: "2026-05-04", name: "Early May bank holiday" },
  { date: "2026-05-25", name: "Spring bank holiday" },
  { date: "2026-08-31", name: "Summer bank holiday" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2026-12-28", name: "Boxing Day substitute" },
  { date: "2027-01-01", name: "New Year's Day" },
];

export const ROOM_PRIORITY = {
  GP: 1,
  "Practice Nurse": 2,
  Pharmacist: 3,
  "Reception / Care Navigator": 4,
  Dispenser: 5,
  "Practice Manager": 6,
};

export const PRACTICE_ROOMS = [
  { id: "gp-room-1", name: "GP room 1", type: "Clinical", status: "Available" },
  { id: "gp-room-2", name: "GP room 2", type: "Clinical", status: "Available" },
  { id: "nurse-room-1", name: "Nurse room 1", type: "Clinical", status: "Available" },
  { id: "clinical-room-3", name: "Clinical room 3", type: "Clinical", status: "Available" },
  { id: "reception", name: "Reception", type: "Front desk", status: "Available" },
  { id: "dispensary", name: "Dispensary", type: "Dispensary", status: "Available" },
  { id: "manager-office", name: "Manager office", type: "Admin", status: "Available" },
];

export const ROOM_BLOCKS = [
  {
    id: "room-block-1",
    room: "Nurse room 1",
    date: "2026-07-08",
    time: "13:00-15:00",
    reason: "IPC deep clean",
    status: "Blocked",
  },
  {
    id: "room-block-2",
    room: "Clinical room 3",
    date: "2026-07-09",
    time: "09:00-12:00",
    reason: "PCN meeting",
    status: "Blocked",
  },
];

export const DEFAULT_WORKFORCE_PROFILES = [
  {
    "id": "millie-buesnel",
    "name": "Millie Buesnel",
    "role": "Role to confirm",
    "team": "Unassigned",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "Practice Manager",
    "payType": "Hourly",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 5.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "Reception",
    "secondaryRoom": "Manager office",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": true,
    "teamNeedsConfirmation": true,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      }
    ],
    "notes": "Imported from Work Patterns CSV dated 07/06/2026. Role, team, pay, funding, pension and contact details require confirmation.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "millie-buesnel-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 0.0,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "alison-cannon",
    "name": "Alison Cannon",
    "role": "ANP",
    "team": "Clinical",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "GP Partners",
    "payType": "Hourly",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 5.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "Clinical room 3",
    "secondaryRoom": "GP room 2",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": false,
    "teamNeedsConfirmation": false,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      }
    ],
    "notes": "Role added from known GPOP context. CSV did not include active hours; pattern requires confirmation.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "alison-cannon-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 0.0,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "shirley-carter",
    "name": "Shirley Carter",
    "role": "Role to confirm",
    "team": "Unassigned",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "Practice Manager",
    "payType": "Hourly",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 5.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "Reception",
    "secondaryRoom": "Manager office",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": true,
    "teamNeedsConfirmation": true,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "08:30",
        "finishTime": "18:00",
        "breakMinutes": 60,
        "hours": 8.5,
        "shift": "08:30-18:00"
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "08:30",
        "finishTime": "18:00",
        "breakMinutes": 60,
        "hours": 8.5,
        "shift": "08:30-18:00"
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      }
    ],
    "notes": "Imported from Work Patterns CSV dated 07/06/2026. Role, team, pay, funding, pension and contact details require confirmation.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "shirley-carter-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 17.0,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "alison-clarke",
    "name": "Alison Clarke",
    "role": "Role to confirm",
    "team": "Unassigned",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "Practice Manager",
    "payType": "Hourly",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 5.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "Reception",
    "secondaryRoom": "Manager office",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": true,
    "teamNeedsConfirmation": true,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      }
    ],
    "notes": "Imported from Work Patterns CSV dated 07/06/2026. Role, team, pay, funding, pension and contact details require confirmation.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "alison-clarke-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 0.0,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "caitlin-clarke",
    "name": "Caitlin Clarke",
    "role": "GP Partner",
    "team": "Management",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "GP Partners",
    "payType": "Salary",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 6.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "GP room 1",
    "secondaryRoom": "Manager office",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": false,
    "teamNeedsConfirmation": false,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      }
    ],
    "notes": "Role added from known GPOP context. CSV did not include active hours; pattern requires confirmation.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "caitlin-clarke-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 0.0,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "donna-cook",
    "name": "Donna Cook",
    "role": "Role to confirm",
    "team": "Unassigned",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "Practice Manager",
    "payType": "Hourly",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 5.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "Reception",
    "secondaryRoom": "Manager office",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": true,
    "teamNeedsConfirmation": true,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "08:30",
        "finishTime": "18:00",
        "breakMinutes": 30,
        "hours": 9.0,
        "shift": "08:30-18:00"
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "08:30",
        "finishTime": "13:00",
        "breakMinutes": 0,
        "hours": 4.5,
        "shift": "08:30-13:00"
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "08:30",
        "finishTime": "18:00",
        "breakMinutes": 30,
        "hours": 9.0,
        "shift": "08:30-18:00"
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "08:30",
        "finishTime": "18:00",
        "breakMinutes": 30,
        "hours": 9.0,
        "shift": "08:30-18:00"
      }
    ],
    "notes": "Imported from Work Patterns CSV dated 07/06/2026. Role, team, pay, funding, pension and contact details require confirmation.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "donna-cook-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 31.5,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "prosper-ehiwarior",
    "name": "Prosper Ehiwarior",
    "role": "GP Registrar",
    "team": "Clinical",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "GP Partner / Trainer",
    "payType": "Salary",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 6.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "GP room 2",
    "secondaryRoom": "GP room 1",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": false,
    "teamNeedsConfirmation": false,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      }
    ],
    "notes": "Role added from known GPOP context. CSV did not include active hours; pattern requires confirmation.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "prosper-ehiwarior-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 0.0,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "sarah-gannon",
    "name": "Sarah Gannon",
    "role": "Role to confirm",
    "team": "Unassigned",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "Practice Manager",
    "payType": "Hourly",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 5.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "Reception",
    "secondaryRoom": "Manager office",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": true,
    "teamNeedsConfirmation": true,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "08:15",
        "finishTime": "18:00",
        "breakMinutes": 60,
        "hours": 8.75,
        "shift": "08:15-18:00"
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "08:30",
        "finishTime": "13:00",
        "breakMinutes": 0,
        "hours": 4.5,
        "shift": "08:30-13:00"
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "08:15",
        "finishTime": "18:00",
        "breakMinutes": 60,
        "hours": 8.75,
        "shift": "08:15-18:00"
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "08:15",
        "finishTime": "18:00",
        "breakMinutes": 60,
        "hours": 8.75,
        "shift": "08:15-18:00"
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "08:15",
        "finishTime": "18:00",
        "breakMinutes": 60,
        "hours": 8.75,
        "shift": "08:15-18:00"
      }
    ],
    "notes": "Imported from Work Patterns CSV dated 07/06/2026. Role, team, pay, funding, pension and contact details require confirmation.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "sarah-gannon-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 39.5,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "dominic-marshall",
    "name": "Dominic Marshall",
    "role": "Practice Manager",
    "team": "Management",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "GP Partners",
    "payType": "Salary",
    "annualSalary": 40000,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 7.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "Manager office",
    "secondaryRoom": "Reception",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": false,
    "teamNeedsConfirmation": false,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Fortnightly",
      "weeks": 2,
      "anchorDate": "2026-04-06",
      "notes": "Long week / short week pattern. Preserved from the existing GPOP staff record because the uploaded CSV lists 0 hrs for Dominic."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "08:00",
        "finishTime": "16:30",
        "breakMinutes": 30,
        "hours": 8.0,
        "shift": "08:00-16:30"
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "08:00",
        "finishTime": "16:30",
        "breakMinutes": 30,
        "hours": 8.0,
        "shift": "08:00-16:30"
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "08:00",
        "finishTime": "16:30",
        "breakMinutes": 30,
        "hours": 8.0,
        "shift": "08:00-16:30"
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "08:00",
        "finishTime": "16:30",
        "breakMinutes": 30,
        "hours": 8.0,
        "shift": "08:00-16:30"
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "08:00",
        "finishTime": "16:30",
        "breakMinutes": 30,
        "hours": 8.0,
        "shift": "08:00-16:30"
      },
      {
        "week": 2,
        "day": "Monday",
        "startTime": "08:30",
        "finishTime": "17:00",
        "breakMinutes": 60,
        "hours": 7.5,
        "shift": "08:30-17:00"
      },
      {
        "week": 2,
        "day": "Tuesday",
        "startTime": "09:00",
        "finishTime": "15:00",
        "breakMinutes": 60,
        "hours": 5.0,
        "shift": "09:00-15:00"
      },
      {
        "week": 2,
        "day": "Wednesday",
        "startTime": "08:30",
        "finishTime": "17:00",
        "breakMinutes": 60,
        "hours": 7.5,
        "shift": "08:30-17:00"
      },
      {
        "week": 2,
        "day": "Thursday",
        "startTime": "09:00",
        "finishTime": "15:00",
        "breakMinutes": 60,
        "hours": 5.0,
        "shift": "09:00-15:00"
      },
      {
        "week": 2,
        "day": "Friday",
        "startTime": "08:00",
        "finishTime": "18:30",
        "breakMinutes": 30,
        "hours": 10.0,
        "shift": "08:00-18:30"
      }
    ],
    "notes": "Existing GPOP profile preserved: fortnightly long-week/short-week pattern. Confirm live contracted pattern before payroll use.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "dominic-marshall-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 37.5,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "jenny-moore",
    "name": "Jenny Moore",
    "role": "GP",
    "team": "Clinical",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "GP Partners",
    "payType": "Salary",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 6.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "GP room 1",
    "secondaryRoom": "GP room 2",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": false,
    "teamNeedsConfirmation": false,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      }
    ],
    "notes": "Role added from known GPOP context. CSV did not include active hours; pattern requires confirmation.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "jenny-moore-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 0.0,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "angela-pope",
    "name": "Angela Pope",
    "role": "Role to confirm",
    "team": "Unassigned",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "Practice Manager",
    "payType": "Hourly",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 5.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "Reception",
    "secondaryRoom": "Manager office",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": true,
    "teamNeedsConfirmation": true,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "09:00",
        "finishTime": "13:00",
        "breakMinutes": 0,
        "hours": 4.0,
        "shift": "09:00-13:00"
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "14:00",
        "finishTime": "18:30",
        "breakMinutes": 0,
        "hours": 4.5,
        "shift": "14:00-18:30"
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "09:00",
        "finishTime": "13:00",
        "breakMinutes": 0,
        "hours": 4.0,
        "shift": "09:00-13:00"
      }
    ],
    "notes": "Imported from Work Patterns CSV dated 07/06/2026. Role, team, pay, funding, pension and contact details require confirmation.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "angela-pope-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 12.5,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "shakthi-rajput",
    "name": "Shakthi Rajput",
    "role": "Role to confirm",
    "team": "Unassigned",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "Practice Manager",
    "payType": "Hourly",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 5.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "Reception",
    "secondaryRoom": "Manager office",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": true,
    "teamNeedsConfirmation": true,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "09:00",
        "finishTime": "18:00",
        "breakMinutes": 60,
        "hours": 8.0,
        "shift": "09:00-18:00"
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "09:00",
        "finishTime": "11:00",
        "breakMinutes": 0,
        "hours": 2.0,
        "shift": "09:00-11:00"
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "09:00",
        "finishTime": "16:00",
        "breakMinutes": 60,
        "hours": 6.0,
        "shift": "09:00-16:00"
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      }
    ],
    "notes": "Imported from Work Patterns CSV dated 07/06/2026. Role, team, pay, funding, pension and contact details require confirmation.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "shakthi-rajput-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 16.0,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "genevieve-rose",
    "name": "Genevieve Rose",
    "role": "HCA",
    "team": "Nursing",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "Practice Nurse / Practice Manager",
    "payType": "Hourly",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 5.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "Nurse room 1",
    "secondaryRoom": "Clinical room 3",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": false,
    "teamNeedsConfirmation": false,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "09:00",
        "finishTime": "16:30",
        "breakMinutes": 30,
        "hours": 7.0,
        "shift": "09:00-16:30"
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "09:00",
        "finishTime": "15:30",
        "breakMinutes": 30,
        "hours": 6.0,
        "shift": "09:00-15:30"
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "09:00",
        "finishTime": "16:30",
        "breakMinutes": 30,
        "hours": 7.0,
        "shift": "09:00-16:30"
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "09:00",
        "finishTime": "16:30",
        "breakMinutes": 30,
        "hours": 7.0,
        "shift": "09:00-16:30"
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      }
    ],
    "notes": "Working pattern imported from Work Patterns CSV dated 07/06/2026. Confirm role, pay, pension and contact details.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "genevieve-rose-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 27.0,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "deborah-squires",
    "name": "Deborah Squires",
    "role": "Patient Coordinator",
    "team": "Reception",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "Practice Manager",
    "payType": "Hourly",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 5.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "Reception",
    "secondaryRoom": "Manager office",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": false,
    "teamNeedsConfirmation": false,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      }
    ],
    "notes": "Role added from known GPOP context. CSV did not include active hours; pattern requires confirmation.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "deborah-squires-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 0.0,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "toni-ward",
    "name": "Toni Ward",
    "role": "Role to confirm",
    "team": "Unassigned",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "Practice Manager",
    "payType": "Hourly",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 5.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "Reception",
    "secondaryRoom": "Manager office",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": true,
    "teamNeedsConfirmation": true,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "08:30",
        "finishTime": "17:00",
        "breakMinutes": 60,
        "hours": 7.5,
        "shift": "08:30-17:00"
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "08:30",
        "finishTime": "18:00",
        "breakMinutes": 60,
        "hours": 8.5,
        "shift": "08:30-18:00"
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "08:30",
        "finishTime": "18:00",
        "breakMinutes": 60,
        "hours": 8.5,
        "shift": "08:30-18:00"
      }
    ],
    "notes": "Imported from Work Patterns CSV dated 07/06/2026. Role, team, pay, funding, pension and contact details require confirmation.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "toni-ward-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 24.5,
        "budget": "Practice"
      }
    ]
  },
  {
    "id": "susan-willoughby",
    "name": "Susan Willoughby",
    "role": "Role to confirm",
    "team": "Unassigned",
    "status": "Active",
    "employmentStatus": "Active",
    "contractType": "Permanent",
    "startDate": "2026-04-01",
    "lineManager": "Practice Manager",
    "payType": "Hourly",
    "annualSalary": 0,
    "hourlyRate": 0,
    "dayRate": 0,
    "budget": "Practice",
    "fundingSource": "Practice",
    "fundingPercent": 100,
    "arrsClaimablePercent": 0,
    "holidayWeeks": 5.6,
    "worksBankHolidays": false,
    "nhsPensionMember": true,
    "pensionScheme": "NHS Pension",
    "pensionStatus": "Unknown",
    "primaryRoom": "Reception",
    "secondaryRoom": "Manager office",
    "dbsStatus": "Not recorded",
    "professionalRegistration": "",
    "roleNeedsConfirmation": true,
    "teamNeedsConfirmation": true,
    "sourceRecordDate": "2026-06-07",
    "patternCycle": {
      "type": "Weekly",
      "weeks": 1,
      "anchorDate": "2026-04-06",
      "notes": "Imported from Work Patterns CSV dated 07/06/2026."
    },
    "workingPattern": [
      {
        "week": 1,
        "day": "Monday",
        "startTime": "08:30",
        "finishTime": "18:00",
        "breakMinutes": 60,
        "hours": 8.5,
        "shift": "08:30-18:00"
      },
      {
        "week": 1,
        "day": "Tuesday",
        "startTime": "08:30",
        "finishTime": "13:00",
        "breakMinutes": 0,
        "hours": 4.5,
        "shift": "08:30-13:00"
      },
      {
        "week": 1,
        "day": "Wednesday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      },
      {
        "week": 1,
        "day": "Thursday",
        "startTime": "08:30",
        "finishTime": "18:00",
        "breakMinutes": 60,
        "hours": 8.5,
        "shift": "08:30-18:00"
      },
      {
        "week": 1,
        "day": "Friday",
        "startTime": "",
        "finishTime": "",
        "breakMinutes": 0,
        "hours": 0.0,
        "shift": ""
      }
    ],
    "notes": "Imported from Work Patterns CSV dated 07/06/2026. Role, team, pay, funding, pension and contact details require confirmation.",
    "importSource": "Work Patterns - 07_06_2026.csv",
    "contractAmendments": [
      {
        "id": "susan-willoughby-import-20260607",
        "effectiveDate": "2026-04-01",
        "summary": "Imported working pattern from Work Patterns CSV dated 07/06/2026",
        "weeklyHours": 21.5,
        "budget": "Practice"
      }
    ]
  }
];
