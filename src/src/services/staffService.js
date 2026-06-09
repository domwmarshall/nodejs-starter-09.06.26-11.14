import { staff } from "../data/staff";
import { formatDate } from "../utils/dateUtils";
import { SETTINGS_STORAGE_KEYS } from "./settingsService";

export const STAFF_LEAVE_STORAGE_KEY = SETTINGS_STORAGE_KEYS.holidayRequests;

export const DEFAULT_HOLIDAY_REQUESTS = [
  {
    id: 1,
    staffName: "Reception User",
    date: "2026-07-01",
    hours: 7.5,
    reason: "Annual leave",
    status: "Pending",
  },
  {
    id: 2,
    staffName: "Nurse User",
    date: "2026-07-08",
    hours: 4,
    reason: "Medical appointment",
    status: "Approved",
  },
  {
    id: 3,
    staffName: "GP User",
    date: "2026-07-22",
    hours: 7.5,
    reason: "Annual leave",
    status: "Rejected",
  },
];

export function getDefaultHolidayRequests() {
  return DEFAULT_HOLIDAY_REQUESTS;
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
    (total, request) => total + Number(request.hours || 0),
    0
  );

  const totalApprovedHours = approvedRequests.reduce(
    (total, request) => total + Number(request.hours || 0),
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
  hours,
  reason,
  status = "Pending",
}) {
  return {
    id: Date.now(),
    staffName,
    date,
    hours: Number(hours || 0),
    reason: reason || "Annual leave",
    status,
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
    (request) => request.date === dateString && request.status === "Approved"
  );
}

export function getLeaveCalendarRows(requests) {
  const safeRequests = Array.isArray(requests) ? requests : DEFAULT_HOLIDAY_REQUESTS;

  return [...safeRequests]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((request) => ({
      ...request,
      formattedDate: formatDate(request.date),
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
      .reduce((total, request) => total + Number(request.hours || 0), 0);

    const pendingHours = staffRequests
      .filter((request) => request.status === "Pending")
      .reduce((total, request) => total + Number(request.hours || 0), 0);

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