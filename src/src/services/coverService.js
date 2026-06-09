import { staff } from "../data/staff";
import {
  COVER_RISK_LEVELS,
  COVER_TEAM_LABELS,
  COVER_TEAMS,
  DAILY_COVER_RULES,
} from "../data/coverRules";
import { formatDate } from "../utils/dateUtils";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_ALIASES = {
  Sunday: ["Sun", "Sunday"],
  Monday: ["Mon", "Monday"],
  Tuesday: ["Tue", "Tues", "Tuesday"],
  Wednesday: ["Wed", "Weds", "Wednesday"],
  Thursday: ["Thu", "Thur", "Thurs", "Thursday"],
  Friday: ["Fri", "Friday"],
  Saturday: ["Sat", "Saturday"],
};

function safeDate(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

export function getDayName(dateString) {
  const date = safeDate(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return DAY_NAMES[date.getDay()];
}

export function getCoverRuleForDate(dateString) {
  const dayName = getDayName(dateString);

  return (
    DAILY_COVER_RULES.find((rule) => rule.day === dayName) || {
      day: dayName,
      open: false,
      required: {},
      notes: ["No standard opening rule configured for this day"],
    }
  );
}

export function getCoverTeamForStaff(person) {
  const staffTeam = person?.team || "Practice";

  const matchingTeam = COVER_TEAMS.find((team) =>
    team.staffTeams.includes(staffTeam)
  );

  return matchingTeam?.id || "other";
}

export function getCoverTeamLabel(teamId) {
  return COVER_TEAM_LABELS[teamId] || "Other";
}

export function isStaffWorkingOnDate(person, dateString) {
  const dayName = getDayName(dateString);

  if (Array.isArray(person?.workingPattern)) {
    return person.workingPattern.some(
      (day) => day.day === dayName && Number(day.hours || 0) > 0
    );
  }

  const pattern = String(person?.pattern || "").trim();

  if (!pattern || dayName === "Unknown") return false;
  if (/mon\s*-\s*fri/i.test(pattern)) {
    return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(
      dayName
    );
  }

  const aliases = DAY_ALIASES[dayName] || [dayName];

  return aliases.some((alias) =>
    new RegExp(`\\b${alias}\\b`, "i").test(pattern)
  );
}

export function getStaffWorkingOnDate(staffList = staff, dateString) {
  const safeStaff = Array.isArray(staffList) ? staffList : staff;

  return safeStaff.filter((person) => isStaffWorkingOnDate(person, dateString));
}

export function getLeaveForDate(requests, dateString, statuses = ["Approved"]) {
  const safeRequests = Array.isArray(requests) ? requests : [];

  return safeRequests.filter(
    (request) =>
      request.date === dateString &&
      (statuses.length === 0 || statuses.includes(request.status))
  );
}

function countByTeam(staffList) {
  return staffList.reduce((counts, person) => {
    const teamId = getCoverTeamForStaff(person);
    counts[teamId] = (counts[teamId] || 0) + 1;
    return counts;
  }, {});
}

function namesForTeam(staffList, teamId) {
  return staffList
    .filter((person) => getCoverTeamForStaff(person) === teamId)
    .map((person) => person.name)
    .join(", ");
}

function chooseRiskLevel(warnings, approvedLeave, pendingLeave, candidateRequest) {
  const hasHardGap = warnings.some((warning) => warning.severity === "High");
  const hasGap = warnings.length > 0;

  if (hasHardGap) return COVER_RISK_LEVELS.high;
  if (hasGap) return COVER_RISK_LEVELS.medium;
  if (candidateRequest?.status === "Pending") return COVER_RISK_LEVELS.low;
  if (approvedLeave.length > 0 || pendingLeave.length > 0) return COVER_RISK_LEVELS.low;

  return COVER_RISK_LEVELS.safe;
}

export function assessCoverForDate({
  date,
  staffList = staff,
  requests = [],
  candidateRequest = null,
  includePending = false,
} = {}) {
  const rule = getCoverRuleForDate(date);
  const workingStaff = getStaffWorkingOnDate(staffList, date);
  const approvedLeave = getLeaveForDate(requests, date, ["Approved"]);
  const pendingLeave = getLeaveForDate(requests, date, ["Pending"]);

  const leaveToApply = [
    ...approvedLeave,
    ...(includePending ? pendingLeave : []),
    ...(candidateRequest ? [candidateRequest] : []),
  ];

  const leaveNames = new Set(leaveToApply.map((request) => request.staffName));
  const availableStaff = workingStaff.filter(
    (person) => !leaveNames.has(person.name)
  );

  const availableCounts = countByTeam(availableStaff);

  const warnings = Object.entries(rule.required || {})
    .map(([teamId, minimumRequired]) => {
      const available = availableCounts[teamId] || 0;

      if (available >= minimumRequired) return null;

      return {
        teamId,
        team: getCoverTeamLabel(teamId),
        required: minimumRequired,
        available,
        severity: minimumRequired > 0 && available === 0 ? "High" : "Medium",
        message: `${getCoverTeamLabel(teamId)} below minimum cover: ${available}/${minimumRequired} available`,
      };
    })
    .filter(Boolean);

  const risk = chooseRiskLevel(warnings, approvedLeave, pendingLeave, candidateRequest);

  return {
    date,
    formattedDate: formatDate(date),
    day: rule.day,
    open: rule.open,
    rule,
    workingStaff,
    approvedLeave,
    pendingLeave,
    appliedLeave: leaveToApply,
    availableStaff,
    availableCounts,
    warnings,
    risk,
    riskLabel: risk.label,
    riskTone: risk.tone,
    riskScore: risk.score,
    availableSummary: COVER_TEAMS.map((team) => ({
      teamId: team.id,
      label: team.label,
      required: rule.required?.[team.id] || 0,
      available: availableCounts[team.id] || 0,
      names: namesForTeam(availableStaff, team.id),
    })),
  };
}

export function assessLeaveRequestCover({ request, staffList = staff, requests = [] }) {
  return assessCoverForDate({
    date: request.date,
    staffList,
    requests: requests.filter((item) => item.id !== request.id),
    candidateRequest: request,
  });
}

export function getLeaveRequestsWithCoverRisk({
  requests = [],
  staffList = staff,
} = {}) {
  const safeRequests = Array.isArray(requests) ? requests : [];

  return safeRequests.map((request) => {
    const coverAssessment = assessLeaveRequestCover({
      request,
      staffList,
      requests: safeRequests,
    });

    return {
      ...request,
      coverRisk: coverAssessment.riskLabel,
      coverTone: coverAssessment.riskTone,
      coverWarnings: coverAssessment.warnings,
      coverAssessment,
    };
  });
}

export function getCoverSnapshotsForDates({
  dates = [],
  staffList = staff,
  requests = [],
} = {}) {
  return dates.map((date) =>
    assessCoverForDate({
      date,
      staffList,
      requests,
    })
  );
}

export function getCoverMetrics({ requests = [], staffList = staff } = {}) {
  const safeRequests = Array.isArray(requests) ? requests : [];
  const requestsWithRisk = getLeaveRequestsWithCoverRisk({
    requests: safeRequests,
    staffList,
  });

  const approvedRequestsWithRisk = requestsWithRisk.filter(
    (request) => request.status === "Approved"
  );

  const pendingRequestsWithRisk = requestsWithRisk.filter(
    (request) => request.status === "Pending"
  );

  const riskyApprovedRequests = approvedRequestsWithRisk.filter(
    (request) => request.coverAssessment.riskScore >= 2
  );

  const riskyPendingRequests = pendingRequestsWithRisk.filter(
    (request) => request.coverAssessment.riskScore >= 2
  );

  const highRiskRequests = requestsWithRisk.filter(
    (request) => request.coverAssessment.riskScore >= 3
  );

  const affectedDates = [...new Set(requestsWithRisk.map((request) => request.date))];

  const dateSnapshots = affectedDates
    .map((date) => assessCoverForDate({ date, staffList, requests: safeRequests }))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const unsafeDates = dateSnapshots.filter((snapshot) => snapshot.riskScore >= 2);

  return {
    requestsWithRisk,
    pendingRequestsWithRisk,
    approvedRequestsWithRisk,
    riskyApprovedRequests,
    riskyPendingRequests,
    highRiskRequests,
    dateSnapshots,
    unsafeDates,
  };
}
