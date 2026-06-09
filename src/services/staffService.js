import { staff } from "../data/staff";
import { importedAbsences } from "../data/importedAbsences";
import { formatDate } from "../utils/dateUtils";
import { SETTINGS_STORAGE_KEYS } from "./settingsService";

export const STAFF_LEAVE_STORAGE_KEY = SETTINGS_STORAGE_KEYS.holidayRequests;

export const DEMO_HOLIDAY_REQUESTS = [
  {
    id: "demo-leave-1",
    staffName: "Donna Cook",
    date: "2026-07-15",
    startDate: "2026-07-15",
    endDate: "2026-07-15",
    hours: 9,
    deductedHours: 9,
    deductedShifts: 1,
    reason: "Annual leave",
    status: "Pending",
  },
  {
    id: "demo-leave-2",
    staffName: "Genevieve Rose",
    date: "2026-07-08",
    startDate: "2026-07-08",
    endDate: "2026-07-08",
    hours: 3.5,
    deductedHours: 3.5,
    deductedShifts: 1,
    reason: "Medical appointment",
    status: "Approved",
  },
  {
    id: "demo-leave-3",
    staffName: "Sarah Gannon",
    date: "2026-07-22",
    startDate: "2026-07-22",
    endDate: "2026-07-22",
    hours: 8.75,
    deductedHours: 8.75,
    deductedShifts: 1,
    reason: "Annual leave",
    status: "Rejected",
  },
];

export const DEFAULT_HOLIDAY_REQUESTS = importedAbsences.length > 0
  ? importedAbsences
  : DEMO_HOLIDAY_REQUESTS;

export function getDefaultHolidayRequests() {
  return DEFAULT_HOLIDAY_REQUESTS.map((request) => ({ ...request }));
}

export function getStaffDisplayName(person) {
  return person?.name || person?.fullName || person?.staffName || "Unknown staff";
}

export function getStaffRole(person) {
  return person?.role || person?.roleTitle || person?.jobTitle || "Not set";
}

export function getStaffTeam(person) {
  return person?.team || person?.department || "Practice";
}

export function getStaffHours(person) {
  if (Array.isArray(person?.workingPattern)) {
    return person.workingPattern.reduce(
      (total, day) => total + Number(day.hours || 0),
      0
    );
  }

  return person?.contractedHours || person?.weeklyHours || person?.hours || 0;
}

export function getStaffEntitlement(person) {
  return (
    person?.entitlement?.bookableHours ||
    person?.holidayEntitlementHours ||
    person?.holidayEntitlement ||
    person?.annualLeaveHours ||
    0
  );
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

export function getLeaveRequestDeductedHours(request = {}) {
  const value = request.deductedHours ?? request.hours ?? request.sourceAllowanceUsed ?? 0;
  return Number(value || 0);
}

export function getLeaveRequestDeductedShifts(request = {}) {
  return Number(request.deductedShifts ?? request.shifts ?? 0);
}

export function isDateWithinLeaveRequest(request = {}, dateString = "") {
  const { startDate, endDate, date } = normaliseLeaveRequestDates(request);
  const target = String(dateString || "");

  if (!target) return false;
  if (!startDate && !endDate) return date === target;

  return target >= (startDate || date) && target <= (endDate || startDate || date);
}

export function formatLeaveRequestPeriod(request = {}) {
  const { startDate, endDate } = normaliseLeaveRequestDates(request);
  if (!startDate) return "No date";
  if (!endDate || endDate === startDate) return formatDate(startDate);
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export function getHolidayRequestMetrics(requests) {
  const safeRequests = Array.isArray(requests) ? requests : DEFAULT_HOLIDAY_REQUESTS;

  const pendingRequests = safeRequests.filter(
    (request) => request.status === "Pending"
  );

  const approvedRequests = safeRequests.filter(
    (request) => request.status === "Approved"
  );

  const rejectedRequests = safeRequests.filter(
    (request) => request.status === "Rejected"
  );

  const totalPendingHours = pendingRequests.reduce(
    (total, request) => total + getLeaveRequestDeductedHours(request),
    0
  );

  const totalApprovedHours = approvedRequests.reduce(
    (total, request) => total + getLeaveRequestDeductedHours(request),
    0
  );

  return {
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    totalPendingHours,
    totalApprovedHours,
  };
}

export function createHolidayRequest({
  staffName,
  date,
  startDate,
  endDate,
  hours,
  deductedHours,
  deductedShifts,
  deductionBreakdown = [],
  reason,
  status = "Pending",
  source = "Manual",
}) {
  const normalisedStartDate = startDate || date;
  const normalisedEndDate = endDate || normalisedStartDate;
  const normalisedHours = Number(deductedHours ?? hours ?? 0);

  return {
    id: `leave-${Date.now()}`,
    staffName,
    date: normalisedStartDate,
    startDate: normalisedStartDate,
    endDate: normalisedEndDate,
    hours: normalisedHours,
    deductedHours: normalisedHours,
    deductedShifts: Number(deductedShifts || 0),
    deductionBreakdown,
    reason: reason || "Annual leave",
    status,
    source,
  };
}

export function addHolidayRequest(requests, newRequest) {
  const safeRequests = Array.isArray(requests) ? requests : DEFAULT_HOLIDAY_REQUESTS;

  return [newRequest, ...safeRequests];
}

export function updateHolidayRequestStatus(requests, requestId, newStatus) {
  const safeRequests = Array.isArray(requests) ? requests : DEFAULT_HOLIDAY_REQUESTS;

  return safeRequests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          status: newStatus,
        }
      : request
  );
}

export function getSelectedStaffProfile(staffList, selectedStaffName) {
  const safeStaff = Array.isArray(staffList) ? staffList : staff;

  return (
    safeStaff.find((person) => getStaffDisplayName(person) === selectedStaffName) ||
    safeStaff[0]
  );
}

export function getRequestsForStaff(requests, staffName) {
  const safeRequests = Array.isArray(requests) ? requests : DEFAULT_HOLIDAY_REQUESTS;

  return safeRequests.filter((request) => request.staffName === staffName);
}

export function getApprovedLeaveForDate(requests, dateString) {
  const safeRequests = Array.isArray(requests) ? requests : DEFAULT_HOLIDAY_REQUESTS;

  return safeRequests.filter(
    (request) => isDateWithinLeaveRequest(request, dateString) && request.status === "Approved"
  );
}

export function getLeaveCalendarRows(requests) {
  const safeRequests = Array.isArray(requests) ? requests : DEFAULT_HOLIDAY_REQUESTS;

  return [...safeRequests]
    .sort((a, b) => String(a.startDate || a.date).localeCompare(String(b.startDate || b.date)))
    .map((request) => ({
      ...request,
      ...normaliseLeaveRequestDates(request),
      formattedDate: formatLeaveRequestPeriod(request),
      deductedHours: getLeaveRequestDeductedHours(request),
      deductedShifts: getLeaveRequestDeductedShifts(request),
    }));
}

export function getStaffSummaryRows(staffList = staff, requests = DEFAULT_HOLIDAY_REQUESTS) {
  const safeStaff = Array.isArray(staffList) ? staffList : staff;
  const safeRequests = Array.isArray(requests) ? requests : DEFAULT_HOLIDAY_REQUESTS;

  return safeStaff.map((person) => {
    const name = getStaffDisplayName(person);
    const staffRequests = getRequestsForStaff(safeRequests, name);

    const approvedHours = staffRequests
      .filter((request) => request.status === "Approved")
      .reduce((total, request) => total + getLeaveRequestDeductedHours(request), 0);

    const pendingHours = staffRequests
      .filter((request) => request.status === "Pending")
      .reduce((total, request) => total + getLeaveRequestDeductedHours(request), 0);

    return {
      ...person,
      name,
      role: getStaffRole(person),
      team: getStaffTeam(person),
      contractedHours: getStaffHours(person),
      entitlementHours: getStaffEntitlement(person),
      approvedHours,
      pendingHours,
      remainingHours: Math.max(getStaffEntitlement(person) - approvedHours, 0),
    };
  });
}