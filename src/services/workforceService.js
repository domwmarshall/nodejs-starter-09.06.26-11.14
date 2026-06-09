import { staff } from "../data/staff";
import {
  BANK_HOLIDAYS_2026_27,
  DEFAULT_WORKFORCE_PROFILES,
  FISCAL_YEAR,
  PRACTICE_ROOMS,
  ROOM_BLOCKS,
  ROOM_PRIORITY,
} from "../data/workforce";
import { formatDate } from "../utils/dateUtils";

export const WORKFORCE_PROFILES_STORAGE_KEY = "gpop-workforce-profiles";

const LEGACY_DEMO_STAFF_NAMES = new Set([
  "Reception User",
  "Nurse User",
  "GP User",
  "Dispenser User",
  "ARRS Pharmacist",
]);

export const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const WORKING_WEEK_DAYS = DAY_ORDER.slice(0, 5);
export const DEFAULT_PATTERN_ANCHOR_DATE = "2026-04-06";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const BANK_LOCUM_PATTERN_TYPE = "Bank / locum ad hoc";
const PATTERN_TYPE_TO_WEEKS = {
  Weekly: 1,
  Fortnightly: 2,
  "Four-week cycle": 4,
  Monthly: 4,
  [BANK_LOCUM_PATTERN_TYPE]: 1,
};

function dateDayName(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return DAY_ORDER[(date.getDay() + 6) % 7] || "Unknown";
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function slugify(value = "staff") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "staff";
}

function clampCycleWeeks(value) {
  const weeks = Number(value || 1);
  if (weeks <= 1) return 1;
  if (weeks <= 2) return 2;
  return 4;
}

export function parseTimeToMinutes(value = "") {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function splitShift(shift = "") {
  const [startTime = "", finishTime = ""] = String(shift || "").split("-").map((part) => part.trim());
  return { startTime, finishTime };
}

export function getShiftDurationHours(startTime = "", finishTime = "") {
  const start = parseTimeToMinutes(startTime);
  const finish = parseTimeToMinutes(finishTime);
  if (start === null || finish === null) return null;

  let durationMinutes = finish - start;
  if (durationMinutes < 0) durationMinutes += 24 * 60;

  return Math.round((durationMinutes / 60) * 100) / 100;
}

export function calculatePaidHours(startTime = "", finishTime = "", breakMinutes = 0, fallbackHours = 0) {
  const durationHours = getShiftDurationHours(startTime, finishTime);
  if (durationHours === null) return Math.round(Number(fallbackHours || 0) * 100) / 100;

  const unpaidBreakHours = Number(breakMinutes || 0) / 60;
  return Math.max(Math.round((durationHours - unpaidBreakHours) * 100) / 100, 0);
}

export function calculateBankSessionCost({ payType = "Hourly", hours = 0, hourlyRate = 0, dayRate = 0, sessionCost = 0 } = {}) {
  const explicitCost = Number(sessionCost || 0);
  if (explicitCost > 0) return Math.round(explicitCost * 100) / 100;
  if (payType === "Day rate") return Math.round(Number(dayRate || 0) * 100) / 100;
  return Math.round(Number(hours || 0) * Number(hourlyRate || 0) * 100) / 100;
}

export function normaliseWorkSegment(source = {}, index = 0, fallbackRoom = "Reception") {
  const startTime = source.startTime || "";
  const finishTime = source.finishTime || "";
  const breakMinutes = Number(source.breakMinutes || 0);
  const hours = calculatePaidHours(startTime, finishTime, breakMinutes, source.hours);

  return {
    id: source.id || `segment-${Date.now()}-${index}`,
    startTime,
    finishTime,
    breakMinutes,
    room: source.room || source.location || fallbackRoom,
    activity: source.activity || source.role || "Clinical/admin session",
    hours,
  };
}

export function getSegmentTotalHours(segments = []) {
  return Math.round((Array.isArray(segments) ? segments : []).reduce((total, segment) => total + Number(segment.hours || 0), 0) * 100) / 100;
}

export function normaliseBankShift(source = {}, index = 0, fallbackRoom = "GP room 1") {
  const segment = normaliseWorkSegment(source, index, fallbackRoom);
  const payType = source.payType || "Hourly";
  const hourlyRate = Number(source.hourlyRate || 0);
  const dayRate = Number(source.dayRate || 0);
  const fundingSource = source.fundingSource || source.budget || "Practice";
  const sessionCost = calculateBankSessionCost({
    payType,
    hours: segment.hours,
    hourlyRate,
    dayRate,
    sessionCost: source.sessionCost,
  });

  return {
    ...segment,
    id: source.id || `bank-${Date.now()}-${index}`,
    date: source.date || "",
    status: source.status || "Planned",
    payType,
    hourlyRate,
    dayRate,
    sessionCost,
    fundingSource,
    note: source.note || "",
  };
}

function inferBreakMinutes(source = {}, startTime = "", finishTime = "") {
  if (source.breakMinutes !== undefined && source.breakMinutes !== null && source.breakMinutes !== "") {
    return Number(source.breakMinutes || 0);
  }

  const durationHours = getShiftDurationHours(startTime, finishTime);
  const storedHours = Number(source.hours || 0);

  if (durationHours !== null && storedHours > 0 && durationHours >= storedHours) {
    return Math.max(Math.round((durationHours - storedHours) * 60), 0);
  }

  return 0;
}

export function normaliseWorkingPatternDay(source = {}, week, day) {
  const split = splitShift(source.shift);
  const startTime = source.startTime !== undefined ? source.startTime : (split.startTime || "");
  const finishTime = source.finishTime !== undefined ? source.finishTime : (split.finishTime || "");
  const breakMinutes = inferBreakMinutes(source, startTime, finishTime);
  const baseHours = calculatePaidHours(startTime, finishTime, breakMinutes, source.hours);
  const fallbackSegmentRoom = source.room || source.primaryRoom || "Reception";
  const segments = Array.isArray(source.segments) && source.segments.length > 0
    ? source.segments.map((segment, index) => normaliseWorkSegment(segment, index, fallbackSegmentRoom))
    : [];
  const hours = segments.length ? getSegmentTotalHours(segments) : baseHours;
  const shift = startTime && finishTime ? `${startTime}-${finishTime}` : source.shift || "";

  return {
    ...source,
    week,
    day,
    startTime,
    finishTime,
    breakMinutes,
    segments,
    hours,
    shift,
  };
}

export function getPatternCycle(profile = {}) {
  const rawCycle = profile.patternCycle || {};
  const type = rawCycle.type || profile.patternCycleType || "Weekly";
  const isBankLocum = type === BANK_LOCUM_PATTERN_TYPE || profile.contractType === "Bank" && Array.isArray(profile.bankShifts) && profile.bankShifts.length > 0 && !(profile.workingPattern || []).some((day) => Number(day.hours || 0) > 0);
  const weeks = isBankLocum ? 1 : clampCycleWeeks(rawCycle.weeks || profile.patternCycleWeeks || PATTERN_TYPE_TO_WEEKS[type] || 1);
  const label = isBankLocum ? BANK_LOCUM_PATTERN_TYPE : (weeks === 1 ? "Weekly" : weeks === 2 ? "Fortnightly" : "Four-week cycle");

  return {
    type: label,
    weeks,
    anchorDate: rawCycle.anchorDate || profile.patternAnchorDate || DEFAULT_PATTERN_ANCHOR_DATE,
    notes: rawCycle.notes || profile.patternNotes || "",
  };
}

export function getWeekNumberForDate(profile = {}, dateString) {
  const cycle = getPatternCycle(profile);
  if (cycle.weeks <= 1 || !dateString) return 1;

  const anchor = new Date(`${cycle.anchorDate || DEFAULT_PATTERN_ANCHOR_DATE}T12:00:00`);
  const target = new Date(`${dateString}T12:00:00`);
  const diffDays = Math.floor((target.getTime() - anchor.getTime()) / MS_PER_DAY);
  const diffWeeks = Math.floor(diffDays / 7);
  return ((diffWeeks % cycle.weeks) + cycle.weeks) % cycle.weeks + 1;
}

export function getBlankWorkingPattern(cycleWeeks = 1) {
  const weeks = clampCycleWeeks(cycleWeeks);
  return Array.from({ length: weeks }, (_, index) => index + 1).flatMap((week) =>
    WORKING_WEEK_DAYS.map((day) => normaliseWorkingPatternDay({}, week, day))
  );
}

function getDefaultWorkingPattern(pattern = [], cycleWeeks = 1) {
  const source = Array.isArray(pattern) ? pattern : [];
  const weeks = clampCycleWeeks(cycleWeeks);
  const legacyHasNoWeek = source.length > 0 && source.every((item) => item.week === undefined);

  return Array.from({ length: weeks }, (_, index) => index + 1).flatMap((week) =>
    WORKING_WEEK_DAYS.map((day) => {
      const existing = source.find((item) =>
        item.day === day && (legacyHasNoWeek ? week === 1 : Number(item.week || 1) === week)
      ) || {};

      return normaliseWorkingPatternDay(existing, week, day);
    })
  );
}

export function getPatternWeekHours(profile = {}, week = 1) {
  return (profile?.workingPattern || [])
    .filter((day) => Number(day.week || 1) === Number(week))
    .reduce((total, day) => total + Number(day.hours || 0), 0);
}

function normaliseProfile(profile = {}) {
  const fallback = staff.find((person) => person.name === profile.name) || {};
  const base = { ...fallback, ...profile };
  const contact = { ...(base.contact || {}) };
  const employment = { ...(base.employment || {}) };
  const pension = { ...(base.pension || {}) };
  const funding = { ...(base.funding || {}) };
  const compliance = { ...(base.compliance || {}) };

  const workEmail = base.workEmail || contact.workEmail || `${slugify(base.name)}@fleggburghsurgery.nhs.uk`;
  const personalEmail = base.personalEmail || contact.personalEmail || "";
  const phone = base.phone || contact.phone || "";
  const emergencyContactName = base.emergencyContactName || contact.emergencyContactName || "";
  const emergencyContactPhone = base.emergencyContactPhone || contact.emergencyContactPhone || "";

  const employmentStatus = base.employmentStatus || employment.status || "Active";
  const contractType = base.contractType || employment.contractType || "Permanent";
  const startDate = base.startDate || employment.startDate || "2026-04-01";
  const lineManager = base.lineManager || employment.lineManager || "Practice Manager";

  const nhsPensionMember = Boolean(
    base.nhsPensionMember ?? pension.nhsPensionMember ?? true
  );
  const pensionScheme = base.pensionScheme || pension.scheme || "NHS Pension";
  const pensionStatus = base.pensionStatus || pension.status || (nhsPensionMember ? "Enrolled" : "Not enrolled");

  const fundingSource = base.fundingSource || funding.source || base.budget || "Practice";
  const fundingPercent = Number(base.fundingPercent ?? funding.percent ?? 100);
  const fundingNotes = base.fundingNotes || funding.notes || "";

  const dbsStatus = base.dbsStatus || compliance.dbsStatus || "Not recorded";
  const dbsRenewalDate = base.dbsRenewalDate || compliance.dbsRenewalDate || "";
  const professionalRegistration = base.professionalRegistration || compliance.professionalRegistration || "";
  const registrationExpiry = base.registrationExpiry || compliance.registrationExpiry || "";

  return {
    ...base,
    id: base.id || slugify(base.name),
    status: base.status || employmentStatus,
    patternCycle: getPatternCycle(base),
    workingPattern: getDefaultWorkingPattern(base.workingPattern, getPatternCycle(base).weeks),
    bankShifts: Array.isArray(base.bankShifts) ? base.bankShifts.map((shift, index) => normaliseBankShift(shift, index, base.primaryRoom || "GP room 1")) : [],
    contractAmendments: Array.isArray(base.contractAmendments) ? base.contractAmendments : [],
    workEmail,
    personalEmail,
    phone,
    emergencyContactName,
    emergencyContactPhone,
    employmentStatus,
    contractType,
    startDate,
    lineManager,
    nhsPensionMember,
    pensionScheme,
    pensionStatus,
    fundingSource,
    fundingPercent,
    fundingNotes,
    dbsStatus,
    dbsRenewalDate,
    professionalRegistration,
    registrationExpiry,
    contact: {
      workEmail,
      personalEmail,
      phone,
      emergencyContactName,
      emergencyContactPhone,
    },
    employment: {
      status: employmentStatus,
      contractType,
      startDate,
      lineManager,
    },
    pension: {
      nhsPensionMember,
      scheme: pensionScheme,
      status: pensionStatus,
    },
    funding: {
      source: fundingSource,
      percent: fundingPercent,
      notes: fundingNotes,
    },
    compliance: {
      dbsStatus,
      dbsRenewalDate,
      professionalRegistration,
      registrationExpiry,
    },
  };
}

export function getDefaultWorkforceProfiles() {
  return clone(DEFAULT_WORKFORCE_PROFILES).map(normaliseProfile);
}

export function getSafeWorkforceProfiles(profiles) {
  const defaults = getDefaultWorkforceProfiles();

  if (!Array.isArray(profiles) || profiles.length === 0) {
    return defaults;
  }

  const normalisedProfiles = profiles
    .map(normaliseProfile)
    .filter((profile) => !LEGACY_DEMO_STAFF_NAMES.has(profile.name));

  const existingNames = new Set(normalisedProfiles.map((profile) => profile.name));
  const missingDefaultProfiles = defaults.filter(
    (profile) => !existingNames.has(profile.name)
  );

  return [...normalisedProfiles, ...missingDefaultProfiles].map(normaliseProfile);
}

export function getWeeklyHours(profile) {
  const cycle = getPatternCycle(profile);
  if (cycle.type === BANK_LOCUM_PATTERN_TYPE) return 0;
  const totalCycleHours = (profile?.workingPattern || []).reduce(
    (total, day) => total + Number(day.hours || 0),
    0
  );

  return Math.round((totalCycleHours / cycle.weeks) * 10) / 10;
}

export function getPatternLabel(profile) {
  const cycle = getPatternCycle(profile);
  const bankShifts = Array.isArray(profile?.bankShifts) ? profile.bankShifts.filter((shift) => shift.status !== "Cancelled") : [];
  if (cycle.type === BANK_LOCUM_PATTERN_TYPE) {
    const hours = getSegmentTotalHours(bankShifts.map((shift, index) => normaliseBankShift(shift, index, profile.primaryRoom || "GP room 1")));
    return bankShifts.length ? `Bank/locum · ${bankShifts.length} session(s) · ${hours}h scheduled` : "Bank/locum · no sessions scheduled";
  }
  const workingDays = (profile?.workingPattern || []).filter((day) => Number(day.hours || 0) > 0);

  if (workingDays.length === 0) return "No pattern set";

  const weekSummaries = Array.from({ length: cycle.weeks }, (_, index) => index + 1)
    .map((week) => `W${week} ${getPatternWeekHours(profile, week)}h`)
    .join(" · ");

  if (cycle.weeks === 1) {
    return workingDays
      .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))
      .map((day) => {
        const timeLabel = day.startTime && day.finishTime ? ` ${day.startTime}-${day.finishTime}` : "";
        return `${day.day.slice(0, 3)}${timeLabel} ${day.hours}h`;
      })
      .join(" · ");
  }

  return `${cycle.type} · avg ${getWeeklyHours(profile)}h/wk · ${weekSummaries}`;
}

export function getWorkingPatternForDate(profile, dateString) {
  const dayName = dateDayName(dateString);
  const bankShifts = (profile?.bankShifts || [])
    .filter((shift) => shift.date === dateString && shift.status !== "Cancelled")
    .map((shift, index) => normaliseBankShift(shift, index, profile.primaryRoom || "GP room 1"));

  if (bankShifts.length > 0) {
    return {
      week: getWeekNumberForDate(profile, dateString),
      day: dayName,
      startTime: bankShifts[0]?.startTime || "",
      finishTime: bankShifts[bankShifts.length - 1]?.finishTime || bankShifts[0]?.finishTime || "",
      breakMinutes: bankShifts.reduce((total, shift) => total + Number(shift.breakMinutes || 0), 0),
      hours: getSegmentTotalHours(bankShifts),
      shift: "Bank / ad hoc",
      segments: bankShifts.map((shift) => ({ ...shift, isBankShift: true })),
      isBankShift: true,
    };
  }

  const week = getWeekNumberForDate(profile, dateString);
  return (profile?.workingPattern || []).find(
    (day) => day.day === dayName && Number(day.week || 1) === week
  );
}

export function isProfileWorkingOnDate(profile, dateString) {
  return Number(getWorkingPatternForDate(profile, dateString)?.hours || 0) > 0;
}

export function getHoursForDate(profile, dateString) {
  return Number(getWorkingPatternForDate(profile, dateString)?.hours || 0);
}

export function getDateRange(startDate, endDate = startDate) {
  if (!startDate) return [];

  const dates = [];
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate || startDate}T12:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const direction = start <= end ? 1 : -1;
  const cursor = new Date(start);

  while ((direction === 1 && cursor <= end) || (direction === -1 && cursor >= end)) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + direction);
  }

  return direction === 1 ? dates : dates.reverse();
}

export function normaliseLeaveRequestDates(request = {}) {
  const startDate = request.startDate || request.fromDate || request.date || "";
  const endDate = request.endDate || request.toDate || startDate;

  return {
    startDate,
    endDate,
    date: request.date || startDate,
  };
}

export function isDateWithinLeaveRequest(request = {}, dateString = "") {
  const { startDate, endDate, date } = normaliseLeaveRequestDates(request);
  const target = String(dateString || "");

  if (!target) return false;
  if (!startDate && !endDate) return date === target;

  return target >= (startDate || date) && target <= (endDate || startDate || date);
}

export function getLeaveRequestHours(request = {}) {
  return Number(request.deductedHours ?? request.hours ?? request.sourceAllowanceUsed ?? 0);
}

export function calculateLeaveDeductionForRange(profile = {}, startDate, endDate = startDate) {
  const dates = getDateRange(startDate, endDate);
  const breakdown = dates.map((date) => {
    const pattern = getWorkingPatternForDate(profile, date) || {};
    const hours = Number(pattern.hours || 0);

    return {
      date,
      formattedDate: formatDate(date),
      day: dateDayName(date),
      cycleWeek: getWeekNumberForDate(profile, date),
      startTime: pattern.startTime || "",
      finishTime: pattern.finishTime || "",
      breakMinutes: Number(pattern.breakMinutes || 0),
      segments: pattern.segments || [],
      hours,
      isWorkingDay: hours > 0,
    };
  });

  const workingDays = breakdown.filter((day) => day.isWorkingDay);
  const totalHours = Math.round(workingDays.reduce((total, day) => total + Number(day.hours || 0), 0) * 100) / 100;

  return {
    startDate,
    endDate: endDate || startDate,
    dates,
    calendarDays: dates.length,
    deductedShifts: workingDays.length,
    totalHours,
    breakdown,
    workingDays,
  };
}

export function getBankHolidayWeighting(profile = {}, bankHolidays = BANK_HOLIDAYS_2026_27) {
  const averageWeeklyHours = getWeeklyHours(profile);
  const fullTimeWeeklyHours = 37.5;
  const fullTimeDayHours = 7.5;
  const fte = fullTimeWeeklyHours > 0 ? averageWeeklyHours / fullTimeWeeklyHours : 0;
  const proRataEntitlementHours = Math.round(bankHolidays.length * fullTimeDayHours * fte * 100) / 100;
  const scheduledBankHolidayHours = bankHolidays.reduce(
    (total, holiday) => total + getHoursForDate(profile, holiday.date),
    0
  );

  return {
    bankHolidayCount: bankHolidays.length,
    fullTimeBankHolidayHours: bankHolidays.length * fullTimeDayHours,
    averageWeeklyHours,
    fte: Math.round(fte * 1000) / 1000,
    proRataEntitlementHours,
    scheduledBankHolidayHours: Math.round(scheduledBankHolidayHours * 100) / 100,
    weightingBalanceHours: Math.round((proRataEntitlementHours - scheduledBankHolidayHours) * 100) / 100,
  };
}

export function getBankHolidayImpact(profile, bankHolidays = BANK_HOLIDAYS_2026_27) {
  const affectedBankHolidays = bankHolidays
    .map((holiday) => ({
      ...holiday,
      day: dateDayName(holiday.date),
      hours: getHoursForDate(profile, holiday.date),
      formattedDate: formatDate(holiday.date),
      cycleWeek: getWeekNumberForDate(profile, holiday.date),
    }))
    .filter((holiday) => holiday.hours > 0);

  const weighting = getBankHolidayWeighting(profile, bankHolidays);
  const reservedHours = profile.worksBankHolidays
    ? 0
    : weighting.scheduledBankHolidayHours;

  return {
    affectedBankHolidays,
    reservedHours,
    weighting,
  };
}

export function calculateHolidayEntitlement(profile) {
  const weeklyHours = getWeeklyHours(profile);
  const annualLeaveHours = Math.round(weeklyHours * Number(profile.holidayWeeks || 0) * 10) / 10;
  const bankHolidayImpact = getBankHolidayImpact(profile);
  const bankHolidayWeighting = bankHolidayImpact.weighting;
  const totalEntitlementHours = Math.round((annualLeaveHours + bankHolidayWeighting.proRataEntitlementHours) * 10) / 10;
  const bookableHours = Math.max(totalEntitlementHours - bankHolidayImpact.reservedHours, 0);

  return {
    weeklyHours,
    holidayWeeks: Number(profile.holidayWeeks || 0),
    annualLeaveHours,
    totalEntitlementHours,
    bankHolidayHours: bankHolidayImpact.reservedHours,
    bankHolidayEntitlementHours: bankHolidayWeighting.proRataEntitlementHours,
    bankHolidayWeighting,
    bookableHours: Math.round(bookableHours * 10) / 10,
    affectedBankHolidays: bankHolidayImpact.affectedBankHolidays,
  };
}

export function getUsedLeaveHours(profile, requests = [], status = "Approved") {
  return (Array.isArray(requests) ? requests : [])
    .filter((request) => request.staffName === profile.name && request.status === status)
    .reduce((total, request) => {
      const recordedHours = getLeaveRequestHours(request);
      if (recordedHours > 0 && !request.requiresDeductionRecalculation) {
        return total + recordedHours;
      }

      const { startDate, endDate } = normaliseLeaveRequestDates(request);
      const calculated = calculateLeaveDeductionForRange(profile, startDate, endDate);
      return total + (calculated.totalHours || recordedHours);
    }, 0);
}

export function enrichWorkforceProfiles(profiles, requests = []) {
  return getSafeWorkforceProfiles(profiles).map((profile) => {
    const entitlement = calculateHolidayEntitlement(profile);
    const approvedHours = getUsedLeaveHours(profile, requests, "Approved");
    const pendingHours = getUsedLeaveHours(profile, requests, "Pending");
    const remainingHours = Math.max(entitlement.bookableHours - approvedHours, 0);
    const monthlyCost = getMonthlyCost(profile);

    return {
      ...profile,
      contractedHours: entitlement.weeklyHours,
      patternLabel: getPatternLabel(profile),
      entitlement,
      approvedHours,
      pendingHours,
      remainingHours: Math.round(remainingHours * 10) / 10,
      monthlyCost,
      annualCost: monthlyCost * 12,
      arrsClaimableMonthly: Math.round(monthlyCost * (Number(profile.arrsClaimablePercent || 0) / 100)),
    };
  });
}

export function getMonthlyCost(profile) {
  const weeklyHours = getWeeklyHours(profile);

  if (profile.payType === "Salary") {
    return Math.round(Number(profile.annualSalary || 0) / 12);
  }

  if (profile.payType === "Daily") {
    const workingDays = (profile.workingPattern || []).filter((day) => Number(day.hours || 0) > 0).length;
    return Math.round(Number(profile.dayRate || 0) * workingDays * 52 / 12);
  }

  return Math.round(Number(profile.hourlyRate || 0) * weeklyHours * 52 / 12);
}

export function getWorkforceFinancialSummary(profiles) {
  const enrichedProfiles = enrichWorkforceProfiles(profiles);

  const totalMonthlyCost = enrichedProfiles.reduce((total, profile) => total + profile.monthlyCost, 0);
  const arrsClaimableMonthly = enrichedProfiles.reduce((total, profile) => total + profile.arrsClaimableMonthly, 0);

  const byBudget = enrichedProfiles.reduce((result, profile) => {
    const key = profile.budget || "Practice";
    result[key] = (result[key] || 0) + profile.monthlyCost;
    return result;
  }, {});

  return {
    totalMonthlyCost,
    annualisedCost: totalMonthlyCost * 12,
    arrsClaimableMonthly,
    practiceMonthlyCost: totalMonthlyCost - arrsClaimableMonthly,
    byBudget,
  };
}

export function getRoomScheduleForDate({ profiles = [], requests = [], date }) {
  const safeProfiles = getSafeWorkforceProfiles(profiles);
  const approvedLeaveNames = new Set(
    (Array.isArray(requests) ? requests : [])
      .filter((request) => isDateWithinLeaveRequest(request, date) && request.status === "Approved")
      .map((request) => request.staffName)
  );

  const blockedRooms = ROOM_BLOCKS.filter((block) => block.date === date);
  const blockedRoomNames = new Set(blockedRooms.map((block) => block.room));

  const workingProfiles = safeProfiles
    .filter((profile) => isProfileWorkingOnDate(profile, date))
    .filter((profile) => !approvedLeaveNames.has(profile.name))
    .sort((a, b) => (ROOM_PRIORITY[a.role] || 99) - (ROOM_PRIORITY[b.role] || 99));

  const assignments = [];
  const usedRooms = new Set();
  const conflicts = [];

  workingProfiles.forEach((profile) => {
    const dayPattern = getWorkingPatternForDate(profile, date) || {};
    const segments = Array.isArray(dayPattern.segments) && dayPattern.segments.length > 0
      ? dayPattern.segments
      : [];

    if (segments.length > 0) {
      segments.forEach((segment) => {
        const requestedRoom = segment.room || profile.primaryRoom || profile.secondaryRoom;
        if (requestedRoom && !blockedRoomNames.has(requestedRoom)) {
          assignments.push({
            staffName: profile.name,
            role: profile.role,
            team: profile.team,
            room: requestedRoom,
            time: `${segment.startTime || ""}-${segment.finishTime || ""}`,
            activity: segment.activity || (segment.isBankShift ? "Bank / locum session" : "Split session"),
            status: segment.isBankShift ? "Bank/ad hoc" : "Split assigned",
            sessionCost: Number(segment.sessionCost || 0),
            fundingSource: segment.fundingSource || profile.fundingSource || profile.budget || "Practice",
          });
          return;
        }

        conflicts.push({
          staffName: profile.name,
          role: profile.role,
          requestedRooms: requestedRoom || "No room preference set",
          message: `${profile.name} has a split/bank session with no available room on ${formatDate(date)}`,
        });
      });
      return;
    }

    const roomChoices = [profile.primaryRoom, profile.secondaryRoom].filter(Boolean);
    const assignedRoom = roomChoices.find(
      (roomName) => !usedRooms.has(roomName) && !blockedRoomNames.has(roomName)
    );

    if (assignedRoom) {
      usedRooms.add(assignedRoom);
      assignments.push({
        staffName: profile.name,
        role: profile.role,
        team: profile.team,
        room: assignedRoom,
        time: dayPattern.startTime && dayPattern.finishTime ? `${dayPattern.startTime}-${dayPattern.finishTime}` : "",
        activity: "Whole-day pattern",
        status: "Assigned",
      });
      return;
    }

    conflicts.push({
      staffName: profile.name,
      role: profile.role,
      requestedRooms: roomChoices.join(" / ") || "No room preference set",
      message: `${profile.name} has no available preferred room on ${formatDate(date)}`,
    });
  });

  return {
    date,
    formattedDate: formatDate(date),
    assignments,
    conflicts,
    blockedRooms,
    availableRooms: PRACTICE_ROOMS.filter((room) => !usedRooms.has(room.name) && !blockedRoomNames.has(room.name)),
  };
}

export function getWorkforceAlerts({ profiles = [], requests = [], dates = [] } = {}) {
  const enrichedProfiles = enrichWorkforceProfiles(profiles, requests);
  const lowLeaveBalances = enrichedProfiles.filter((profile) => profile.remainingHours < 15);
  const unpaidPendingLeave = enrichedProfiles.filter((profile) => profile.pendingHours > profile.remainingHours);
  const roomSnapshots = dates.map((date) => getRoomScheduleForDate({ profiles, requests, date }));
  const roomConflicts = roomSnapshots.flatMap((snapshot) =>
    snapshot.conflicts.map((conflict) => ({ ...conflict, date: snapshot.date, formattedDate: snapshot.formattedDate }))
  );

  return {
    lowLeaveBalances,
    unpaidPendingLeave,
    roomSnapshots,
    roomConflicts,
  };
}

export function addStaffProfile(profiles, newProfile = {}) {
  const safeProfiles = getSafeWorkforceProfiles(profiles);
  const name = String(newProfile.name || newProfile.fullName || "").trim();

  if (!name) return safeProfiles;

  const existingNames = new Set(safeProfiles.map((profile) => profile.name));
  const baseProfile = normaliseProfile({
    name,
    role: newProfile.role || "Role to confirm",
    team: newProfile.team || "Unassigned",
    employmentStatus: newProfile.employmentStatus || "Onboarding",
    status: newProfile.employmentStatus || "Onboarding",
    contractType: newProfile.contractType || "Permanent",
    startDate: newProfile.startDate || "",
    lineManager: newProfile.lineManager || "Practice Manager",
    payType: newProfile.payType || "Hourly",
    hourlyRate: Number(newProfile.hourlyRate || 0),
    annualSalary: Number(newProfile.annualSalary || 0),
    dayRate: Number(newProfile.dayRate || 0),
    budget: newProfile.budget || "Practice",
    fundingSource: newProfile.fundingSource || newProfile.budget || "Practice",
    fundingPercent: Number(newProfile.fundingPercent || 100),
    arrsClaimablePercent: Number(newProfile.arrsClaimablePercent || 0),
    holidayWeeks: Number(newProfile.holidayWeeks || 5.6),
    worksBankHolidays: Boolean(newProfile.worksBankHolidays),
    nhsPensionMember: newProfile.nhsPensionMember ?? true,
    pensionStatus: newProfile.pensionStatus || "Unknown",
    primaryRoom: newProfile.primaryRoom || "Reception",
    secondaryRoom: newProfile.secondaryRoom || "Manager office",
    patternCycle: newProfile.patternCycle || {
      type: "Weekly",
      weeks: 1,
      anchorDate: DEFAULT_PATTERN_ANCHOR_DATE,
      notes: "Created manually in Staff records.",
    },
    workingPattern: Array.isArray(newProfile.workingPattern)
      ? newProfile.workingPattern
      : getBlankWorkingPattern(1),
    bankShifts: Array.isArray(newProfile.bankShifts) ? newProfile.bankShifts : [],
    notes: newProfile.notes || "Created manually. Complete role, contact, pension, funding and working-pattern details before live use.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (existingNames.has(baseProfile.name)) {
    return updateStaffProfile(safeProfiles, baseProfile.name, baseProfile);
  }

  return [baseProfile, ...safeProfiles];
}

export function updateStaffProfile(profiles, staffName, patch = {}) {
  const safeProfiles = getSafeWorkforceProfiles(profiles);

  return safeProfiles.map((profile) => {
    if (profile.name !== staffName) return profile;

    const merged = {
      ...profile,
      ...patch,
      contact: { ...(profile.contact || {}), ...(patch.contact || {}) },
      employment: { ...(profile.employment || {}), ...(patch.employment || {}) },
      pension: { ...(profile.pension || {}), ...(patch.pension || {}) },
      funding: { ...(profile.funding || {}), ...(patch.funding || {}) },
      compliance: { ...(profile.compliance || {}), ...(patch.compliance || {}) },
      workingPattern: Array.isArray(patch.workingPattern)
        ? patch.workingPattern
        : profile.workingPattern,
      bankShifts: Array.isArray(patch.bankShifts) ? patch.bankShifts : profile.bankShifts,
      updatedAt: new Date().toISOString(),
    };

    return normaliseProfile(merged);
  });
}

export function addContractAmendment(profiles, staffName, amendment) {
  const safeProfiles = getSafeWorkforceProfiles(profiles);

  return safeProfiles.map((profile) => {
    if (profile.name !== staffName) return profile;

    const nextWorkingPattern = amendment.weeklyHours
      ? scaleWorkingPatternToWeeklyHours(profile.workingPattern, Number(amendment.weeklyHours))
      : profile.workingPattern;

    return {
      ...profile,
      budget: amendment.budget || profile.budget,
      payType: amendment.payType || profile.payType,
      hourlyRate: amendment.hourlyRate === "" ? profile.hourlyRate : Number(amendment.hourlyRate || profile.hourlyRate || 0),
      annualSalary: amendment.annualSalary === "" ? profile.annualSalary : Number(amendment.annualSalary || profile.annualSalary || 0),
      primaryRoom: amendment.primaryRoom || profile.primaryRoom,
      secondaryRoom: amendment.secondaryRoom || profile.secondaryRoom,
      workingPattern: nextWorkingPattern,
      contractAmendments: [
        {
          id: `amend-${Date.now()}`,
          effectiveDate: amendment.effectiveDate,
          summary: amendment.summary,
          weeklyHours: amendment.weeklyHours ? Number(amendment.weeklyHours) : getWeeklyHours(profile),
          budget: amendment.budget || profile.budget,
        },
        ...(profile.contractAmendments || []),
      ],
    };
  });
}

function scaleWorkingPatternToWeeklyHours(pattern = [], weeklyHours) {
  const source = Array.isArray(pattern) ? pattern : [];
  const weeks = Math.max(...source.map((day) => Number(day.week || 1)), 1);
  const workingDays = source.filter((day) => Number(day.hours || 0) > 0);
  if (workingDays.length === 0 || !weeklyHours) return source;

  const targetCycleHours = Number(weeklyHours) * weeks;
  const hoursPerDay = Math.round((targetCycleHours / workingDays.length) * 10) / 10;

  return source.map((day) => ({
    ...day,
    hours: Number(day.hours || 0) > 0 ? hoursPerDay : 0,
  }));
}

export function createContractAmendment({ effectiveDate, summary, weeklyHours, budget, payType, hourlyRate, annualSalary, primaryRoom, secondaryRoom }) {
  return {
    effectiveDate,
    summary: summary || "Contract details updated",
    weeklyHours,
    budget,
    payType,
    hourlyRate,
    annualSalary,
    primaryRoom,
    secondaryRoom,
  };
}
