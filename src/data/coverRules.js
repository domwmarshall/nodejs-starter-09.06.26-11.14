export const COVER_RISK_LEVELS = {
  safe: {
    label: "Safe",
    tone: "success",
    score: 0,
  },
  low: {
    label: "Low risk",
    tone: "info",
    score: 1,
  },
  medium: {
    label: "Medium risk",
    tone: "warning",
    score: 2,
  },
  high: {
    label: "High risk",
    tone: "danger",
    score: 3,
  },
};

export const COVER_TEAMS = [
  {
    id: "clinical",
    label: "GP / clinical cover",
    staffTeams: ["Clinical", "PCN / ARRS"],
  },
  {
    id: "nursing",
    label: "Nursing / treatment room",
    staffTeams: ["Nursing"],
  },
  {
    id: "reception",
    label: "Reception / care navigation",
    staffTeams: ["Reception"],
  },
  {
    id: "dispensary",
    label: "Dispensary",
    staffTeams: ["Dispensary"],
  },
  {
    id: "management",
    label: "Management",
    staffTeams: ["Management"],
  },
];

export const DAILY_COVER_RULES = [
  {
    day: "Monday",
    open: true,
    required: {
      clinical: 1,
      nursing: 1,
      reception: 1,
      dispensary: 1,
      management: 0,
    },
    notes: ["Full clinical day", "Dispensary and reception cover required"],
  },
  {
    day: "Tuesday",
    open: true,
    required: {
      clinical: 1,
      nursing: 0,
      reception: 1,
      dispensary: 1,
      management: 0,
    },
    notes: ["Practice closes Tuesday PM", "AM GP, reception and dispensary cover required"],
  },
  {
    day: "Wednesday",
    open: true,
    required: {
      clinical: 1,
      nursing: 1,
      reception: 1,
      dispensary: 1,
      management: 0,
    },
    notes: ["Full clinical day", "HCA/nursing and dispensary cover important"],
  },
  {
    day: "Thursday",
    open: true,
    required: {
      clinical: 1,
      nursing: 1,
      reception: 1,
      dispensary: 1,
      management: 0,
    },
    notes: ["Full clinical day", "Reception and dispensary resilience needed"],
  },
  {
    day: "Friday",
    open: true,
    required: {
      clinical: 1,
      nursing: 0,
      reception: 1,
      dispensary: 1,
      management: 0,
    },
    notes: ["ANP/GP style clinical cover needed", "Close down week safely"],
  },
];

export const COVER_TEAM_LABELS = COVER_TEAMS.reduce((labels, team) => {
  labels[team.id] = team.label;
  return labels;
}, {});
