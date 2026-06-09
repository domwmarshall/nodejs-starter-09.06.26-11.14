import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Landmark,
  Mail,
  Phone,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { SyncStatusBanner } from "../components/SyncStatusBanner";
import { DataTable } from "../components/DataTable";
import { formatDate } from "../utils/dateUtils";

import { staff as baseStaff } from "../data/staff";
import { PRACTICE_ROOMS } from "../data/workforce";

import {
  createHolidayRequest,
  formatLeaveRequestPeriod,
  getHolidayRequestMetrics,
  getLeaveRequestDeductedHours,
  getLeaveRequestDeductedShifts,
  getRequestsForStaff,
  getSelectedStaffProfile,
  getStaffDisplayName,
  getStaffRole,
} from "../services/staffService";

import {
  assessLeaveRequestRangeCover,
  getCoverMetrics,
  getLeaveRequestsWithCoverRisk,
} from "../services/coverService";

import {
  calculateLeaveDeductionForRange,
  createContractAmendment,
  enrichWorkforceProfiles,
  getPatternCycle,
  getPatternWeekHours,
  getRoomScheduleForDate,
  getWeekNumberForDate,
  getWorkforceAlerts,
  getWorkforceFinancialSummary,
} from "../services/workforceService";

import {
  AlertBanner,
  Button,
  FormField,
  PageHeader,
  Panel,
  fieldClassName,
} from "../components/ui";

const WORKING_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const BANK_LOCUM_PATTERN_TYPE = "Bank / locum ad hoc";
const PATTERN_CYCLE_OPTIONS = [
  { label: "Weekly", weeks: 1 },
  { label: "Fortnightly", weeks: 2 },
  { label: "Four-week cycle", weeks: 4 },
  { label: BANK_LOCUM_PATTERN_TYPE, weeks: 1, adHoc: true },
];

function getCycleWeeksFromType(type = "Weekly") {
  return PATTERN_CYCLE_OPTIONS.find((option) => option.label === type)?.weeks || 1;
}

function getPatternCycleForForm(profile = {}) {
  const cycle = getPatternCycle(profile);
  return {
    type: cycle.type || "Weekly",
    weeks: Number(cycle.weeks || 1),
    anchorDate: cycle.anchorDate || "2026-04-06",
    notes: cycle.notes || "",
  };
}

function formatMoney(value = 0) {
  return `£${Number(value || 0).toLocaleString("en-GB")}`;
}

function formatHours(value = 0) {
  return `${Number(value || 0).toLocaleString("en-GB")} hrs`;
}

function getInitials(name = "") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function parseTimeToMinutes(value = "") {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function minutesToTime(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "";
  const total = Number(value);
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function splitShift(shift = "") {
  const [startTime = "", finishTime = ""] = String(shift || "").split("-").map((part) => part.trim());
  return { startTime, finishTime };
}

function getShiftDurationHours(startTime = "", finishTime = "") {
  const start = parseTimeToMinutes(startTime);
  const finish = parseTimeToMinutes(finishTime);
  if (start === null || finish === null) return null;

  let durationMinutes = finish - start;
  if (durationMinutes < 0) durationMinutes += 24 * 60;

  return Math.round((durationMinutes / 60) * 100) / 100;
}

function calculatePaidHours(startTime = "", finishTime = "", breakMinutes = 0, fallbackHours = 0) {
  const durationHours = getShiftDurationHours(startTime, finishTime);
  if (durationHours === null) return Math.round(Number(fallbackHours || 0) * 100) / 100;

  const unpaidBreakHours = Number(breakMinutes || 0) / 60;
  return Math.max(Math.round((durationHours - unpaidBreakHours) * 100) / 100, 0);
}

function calculateBankSessionCost({ payType = "Hourly", hours = 0, hourlyRate = 0, dayRate = 0, sessionCost = 0 } = {}) {
  const explicitCost = Number(sessionCost || 0);
  if (explicitCost > 0) return Math.round(explicitCost * 100) / 100;

  if (payType === "Day rate") return Math.round(Number(dayRate || 0) * 100) / 100;
  return Math.round(Number(hours || 0) * Number(hourlyRate || 0) * 100) / 100;
}

function normaliseWorkSegment(source = {}, index = 0, fallbackRoom = "Reception") {
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

function getSegmentTotalHours(segments = []) {
  return Math.round((Array.isArray(segments) ? segments : []).reduce((total, segment) => total + Number(segment.hours || 0), 0) * 100) / 100;
}

function normaliseBankShift(source = {}, index = 0, fallbackRoom = "GP room 1") {
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

function normalisePatternDay(source = {}, week, day) {
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

function normalisePattern(pattern = [], cycleWeeks = 1) {
  const safePattern = Array.isArray(pattern) ? pattern : [];
  const weeks = Number(cycleWeeks || 1);
  const hasWeekNumbers = safePattern.some((item) => item.week !== undefined);

  return Array.from({ length: weeks }, (_, index) => index + 1).flatMap((week) =>
    WORKING_DAYS.map((day) => {
      const existing = safePattern.find((item) =>
        item.day === day && (hasWeekNumbers ? Number(item.week || 1) === week : week === 1)
      );
      const weekOneFallback = safePattern.find((item) =>
        item.day === day && Number(item.week || 1) === 1
      );
      const source = existing || (hasWeekNumbers && week > 1 ? {} : weekOneFallback) || {};

      return normalisePatternDay(source, week, day);
    })
  );
}

function getAveragePatternHours(pattern = [], cycleWeeks = 1) {
  const total = normalisePattern(pattern, cycleWeeks).reduce(
    (sum, day) => sum + Number(day.hours || 0),
    0
  );

  return Math.round((total / Number(cycleWeeks || 1)) * 10) / 10;
}

function buildProfileForm(profile = {}) {
  const cycle = getPatternCycleForForm(profile);

  return {
    role: profile.role || "",
    team: profile.team || "",
    employmentStatus: profile.employmentStatus || "Active",
    contractType: profile.contractType || "Permanent",
    startDate: profile.startDate || "",
    lineManager: profile.lineManager || "Practice Manager",
    workEmail: profile.workEmail || profile.contact?.workEmail || "",
    personalEmail: profile.personalEmail || profile.contact?.personalEmail || "",
    phone: profile.phone || profile.contact?.phone || "",
    emergencyContactName: profile.emergencyContactName || profile.contact?.emergencyContactName || "",
    emergencyContactPhone: profile.emergencyContactPhone || profile.contact?.emergencyContactPhone || "",
    payType: profile.payType || "Hourly",
    hourlyRate: profile.hourlyRate || "",
    annualSalary: profile.annualSalary || "",
    dayRate: profile.dayRate || "",
    budget: profile.budget || "Practice",
    fundingSource: profile.fundingSource || profile.funding?.source || profile.budget || "Practice",
    fundingPercent: profile.fundingPercent ?? profile.funding?.percent ?? 100,
    arrsClaimablePercent: profile.arrsClaimablePercent ?? 0,
    fundingNotes: profile.fundingNotes || profile.funding?.notes || "",
    nhsPensionMember: Boolean(profile.nhsPensionMember ?? profile.pension?.nhsPensionMember ?? true),
    pensionScheme: profile.pensionScheme || profile.pension?.scheme || "NHS Pension",
    pensionStatus: profile.pensionStatus || profile.pension?.status || "Enrolled",
    holidayWeeks: profile.holidayWeeks || 5.6,
    worksBankHolidays: Boolean(profile.worksBankHolidays),
    primaryRoom: profile.primaryRoom || "Reception",
    secondaryRoom: profile.secondaryRoom || "Manager office",
    dbsStatus: profile.dbsStatus || profile.compliance?.dbsStatus || "Not recorded",
    dbsRenewalDate: profile.dbsRenewalDate || profile.compliance?.dbsRenewalDate || "",
    professionalRegistration: profile.professionalRegistration || profile.compliance?.professionalRegistration || "",
    registrationExpiry: profile.registrationExpiry || profile.compliance?.registrationExpiry || "",
    notes: profile.notes || "",
    patternCycleType: cycle.type,
    patternCycleWeeks: cycle.weeks,
    patternAnchorDate: cycle.anchorDate,
    patternNotes: cycle.notes,
    workingPattern: normalisePattern(profile.workingPattern || [], cycle.weeks),
    bankShifts: Array.isArray(profile.bankShifts) ? profile.bankShifts.map((shift, index) => normaliseBankShift(shift, index, profile.primaryRoom || "GP room 1")) : [],
  };
}

function CoverWarningList({ warnings }) {
  if (!warnings || warnings.length === 0) {
    return <span className="muted-text">Minimum cover maintained.</span>;
  }

  return (
    <div className="cover-warning-list">
      {warnings.map((warning) => {
        const cleanMessage = String(warning.message || "")
          .replace(String(warning.team || ""), "")
          .trim();

        return (
          <div key={`${warning.teamId}-${warning.message}`}>
            <strong>{warning.team}</strong>
            <span>{cleanMessage || warning.message}</span>
          </div>
        );
      })}
    </div>
  );
}

function StaffDirectoryCard({ person, isSelected, onSelect }) {
  const leavePercent = person.entitlement?.bookableHours
    ? Math.min((Number(person.approvedHours || 0) / Number(person.entitlement.bookableHours || 1)) * 100, 100)
    : 0;
  const cycle = getPatternCycle(person);

  return (
    <button
      type="button"
      className={["staff-person-card", isSelected ? "staff-person-card-active" : ""].filter(Boolean).join(" ")}
      onClick={onSelect}
    >
      <div className="staff-person-topline">
        <span className="staff-avatar">{getInitials(person.name)}</span>
        <span className="staff-status-dot" />
      </div>

      <strong>{person.name}</strong>
      <small>{person.role} · {person.team}</small>

      <div className="staff-card-meta">
        <span>{formatHours(person.contractedHours)}/wk avg</span>
        <span>{cycle.type}</span>
        <span>{person.fundingSource || person.budget}</span>
      </div>

      <div className="staff-mini-progress" aria-label="Leave used">
        <span style={{ width: `${leavePercent}%` }} />
      </div>
    </button>
  );
}

function StaffFact({ label, value }) {
  return (
    <div className="staff-fact-card">
      <span>{label}</span>
      <strong>{value || "Not recorded"}</strong>
    </div>
  );
}

function StaffPatternEditor({
  pattern = [],
  cycleType = "Weekly",
  cycleWeeks = 1,
  anchorDate = "2026-04-06",
  setPattern,
  setCycleType,
  setAnchorDate,
  bankShifts = [],
  setBankShifts,
  primaryRoom = "Reception",
  disabled,
}) {
  const weeks = Number(cycleWeeks || getCycleWeeksFromType(cycleType));
  const safePattern = normalisePattern(pattern, weeks);
  const safeBankShifts = Array.isArray(bankShifts)
    ? bankShifts.map((shift, index) => normaliseBankShift(shift, index, primaryRoom || "GP room 1"))
    : [];
  const weekNumbers = Array.from({ length: weeks }, (_, index) => index + 1);
  const isBankLocumPattern = cycleType === BANK_LOCUM_PATTERN_TYPE;
  const averageHours = isBankLocumPattern ? 0 : getAveragePatternHours(safePattern, weeks);
  const bankHours = getSegmentTotalHours(safeBankShifts);

  function updateDay(week, day, field, value) {
    setPattern((current) =>
      normalisePattern(current, weeks).map((item) => {
        if (Number(item.week || 1) !== Number(week) || item.day !== day) return item;

        const nextItem = {
          ...item,
          [field]: field === "breakMinutes" ? Number(value || 0) : value,
        };
        const recalculatedHours = calculatePaidHours(
          nextItem.startTime,
          nextItem.finishTime,
          nextItem.breakMinutes,
          nextItem.hours
        );

        return {
          ...nextItem,
          segments: Array.isArray(nextItem.segments) ? nextItem.segments : [],
          hours: recalculatedHours,
          shift: nextItem.startTime && nextItem.finishTime
            ? `${nextItem.startTime}-${nextItem.finishTime}`
            : "",
        };
      })
    );
  }

  function updateDaySegments(week, day, updater) {
    setPattern((current) =>
      normalisePattern(current, weeks).map((item) => {
        if (Number(item.week || 1) !== Number(week) || item.day !== day) return item;
        const currentSegments = Array.isArray(item.segments) ? item.segments : [];
        const nextSegments = typeof updater === "function" ? updater(currentSegments) : updater;
        const normalisedSegments = (Array.isArray(nextSegments) ? nextSegments : [])
          .map((segment, index) => normaliseWorkSegment(segment, index, item.room || primaryRoom || "Reception"));

        return {
          ...item,
          segments: normalisedSegments,
          hours: normalisedSegments.length ? getSegmentTotalHours(normalisedSegments) : calculatePaidHours(item.startTime, item.finishTime, item.breakMinutes, item.hours),
        };
      })
    );
  }

  function addSplitSegment(day) {
    const fallbackStart = day.segments?.length ? "14:00" : (day.startTime || "09:00");
    const fallbackFinish = day.segments?.length ? "16:00" : (day.finishTime || "12:00");
    updateDaySegments(day.week, day.day, (segments) => [
      ...segments,
      normaliseWorkSegment({
        startTime: fallbackStart,
        finishTime: fallbackFinish,
        room: day.room || primaryRoom || "Reception",
        activity: day.segments?.length ? "Second session" : "Clinical/admin session",
      }, segments.length, day.room || primaryRoom || "Reception"),
    ]);
  }

  function updateSegment(day, index, field, value) {
    updateDaySegments(day.week, day.day, (segments) => segments.map((segment, segmentIndex) => {
      if (segmentIndex !== index) return segment;
      return normaliseWorkSegment({
        ...segment,
        [field]: field === "breakMinutes" ? Number(value || 0) : value,
      }, index, day.room || primaryRoom || "Reception");
    }));
  }

  function removeSegment(day, index) {
    updateDaySegments(day.week, day.day, (segments) => segments.filter((_, segmentIndex) => segmentIndex !== index));
  }

  function addBankShift() {
    if (typeof setBankShifts !== "function") return;
    setBankShifts((current) => [
      ...current,
      normaliseBankShift({
        date: new Date().toISOString().slice(0, 10),
        startTime: "09:00",
        finishTime: "17:00",
        breakMinutes: 30,
        room: primaryRoom || "GP room 1",
        activity: "Locum GP / bank session",
        status: "Planned",
        payType: "Hourly",
        hourlyRate: 0,
        dayRate: 0,
        fundingSource: "Practice",
      }, Array.isArray(current) ? current.length : 0, primaryRoom || "GP room 1"),
    ]);
  }

  function updateBankShift(index, field, value) {
    if (typeof setBankShifts !== "function") return;
    setBankShifts((current) => current.map((shift, shiftIndex) => {
      if (shiftIndex !== index) return shift;
      const numericFields = new Set(["breakMinutes", "hourlyRate", "dayRate", "sessionCost"]);
      return normaliseBankShift({
        ...shift,
        [field]: numericFields.has(field) ? Number(value || 0) : value,
      }, index, primaryRoom || "GP room 1");
    }));
  }

  function removeBankShift(index) {
    if (typeof setBankShifts !== "function") return;
    setBankShifts((current) => current.filter((_, shiftIndex) => shiftIndex !== index));
  }

  function handleCycleTypeChange(nextType) {
    const nextWeeks = getCycleWeeksFromType(nextType);
    setCycleType(nextType, nextWeeks);
  }

  return (
    <div className={["staff-pattern-editor", "staff-pattern-editor-split", isBankLocumPattern ? "staff-pattern-editor-bank-mode" : ""].filter(Boolean).join(" ")}>
      <div className="staff-cycle-controls staff-cycle-controls-roomy">
        <FormField label="Work pattern type">
          <select
            className={fieldClassName}
            value={cycleType}
            disabled={disabled}
            onChange={(event) => handleCycleTypeChange(event.target.value)}
          >
            {PATTERN_CYCLE_OPTIONS.map((option) => (
              <option key={option.label}>{option.label}</option>
            ))}
          </select>
        </FormField>

        {!isBankLocumPattern ? (
          <FormField label="Cycle anchor Monday">
            <input
              className={fieldClassName}
              type="date"
              value={anchorDate}
              disabled={disabled || weeks === 1}
              onChange={(event) => setAnchorDate(event.target.value)}
            />
          </FormField>
        ) : null}

        <div className="staff-cycle-summary">
          <span>{isBankLocumPattern ? "Ad hoc sessions" : "Contracted pattern"}</span>
          <strong>{isBankLocumPattern ? formatHours(bankHours) : `${formatHours(averageHours)} / week`}</strong>
          <small>{isBankLocumPattern ? `${safeBankShifts.length} scheduled bank/locum session(s)` : (weeks === 1 ? "Standard weekly pattern" : `${weeks}-week rota cycle`)}</small>
        </div>
      </div>

      {isBankLocumPattern ? (
        <div className="staff-bank-shifts-panel staff-bank-mode-panel">
          <div className="staff-bank-shifts-header">
            <div>
              <strong>Bank / locum sessions</strong>
              <span>Add one-off clinical, HCA, reception or dispensary sessions. No weekly pattern is required.</span>
            </div>
            <Button type="button" size="sm" variant="primary" disabled={disabled} onClick={addBankShift}>Add session</Button>
          </div>

          {safeBankShifts.length === 0 ? (
            <div className="staff-bank-empty-card">
              <strong>No ad hoc sessions yet</strong>
              <span>Add random dates/times for locum GPs, bank HCA cover, extra dispensary support or reception cover.</span>
            </div>
          ) : (
            <div className="staff-bank-shift-list staff-bank-shift-list-cards">
              {safeBankShifts.map((shift, index) => (
                <div className="staff-bank-shift-card" key={shift.id || `bank-${index}`}>
                  <FormField label="Date">
                    <input className={fieldClassName} type="date" value={shift.date} disabled={disabled} onChange={(event) => updateBankShift(index, "date", event.target.value)} />
                  </FormField>
                  <FormField label="Start">
                    <input className={fieldClassName} type="time" value={shift.startTime} disabled={disabled} onChange={(event) => updateBankShift(index, "startTime", event.target.value)} />
                  </FormField>
                  <FormField label="Finish">
                    <input className={fieldClassName} type="time" value={shift.finishTime} disabled={disabled} onChange={(event) => updateBankShift(index, "finishTime", event.target.value)} />
                  </FormField>
                  <FormField label="Break mins">
                    <input className={fieldClassName} type="number" min="0" max="300" step="5" value={shift.breakMinutes} disabled={disabled} onChange={(event) => updateBankShift(index, "breakMinutes", event.target.value)} />
                  </FormField>
                  <FormField label="Room / area">
                    <select className={fieldClassName} value={shift.room} disabled={disabled} onChange={(event) => updateBankShift(index, "room", event.target.value)}>
                      {PRACTICE_ROOMS.map((room) => <option key={room.id}>{room.name}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Activity">
                    <input className={fieldClassName} value={shift.activity} disabled={disabled} placeholder="e.g. Locum GP AM" onChange={(event) => updateBankShift(index, "activity", event.target.value)} />
                  </FormField>
                  <FormField label="Status">
                    <select className={fieldClassName} value={shift.status} disabled={disabled} onChange={(event) => updateBankShift(index, "status", event.target.value)}>
                      <option>Planned</option>
                      <option>Confirmed</option>
                      <option>Completed</option>
                      <option>Cancelled</option>
                    </select>
                  </FormField>
                  <FormField label="Pay type">
                    <select className={fieldClassName} value={shift.payType || "Hourly"} disabled={disabled} onChange={(event) => updateBankShift(index, "payType", event.target.value)}>
                      <option>Hourly</option>
                      <option>Day rate</option>
                      <option>Fixed session</option>
                    </select>
                  </FormField>
                  <FormField label="Hourly rate">
                    <input className={fieldClassName} type="number" min="0" step="0.01" value={shift.hourlyRate || 0} disabled={disabled || shift.payType === "Day rate" || shift.payType === "Fixed session"} onChange={(event) => updateBankShift(index, "hourlyRate", event.target.value)} />
                  </FormField>
                  <FormField label="Day / session rate">
                    <input className={fieldClassName} type="number" min="0" step="0.01" value={shift.payType === "Day rate" ? (shift.dayRate || 0) : (shift.sessionCost || 0)} disabled={disabled || shift.payType === "Hourly"} onChange={(event) => updateBankShift(index, shift.payType === "Day rate" ? "dayRate" : "sessionCost", event.target.value)} />
                  </FormField>
                  <FormField label="Funding">
                    <select className={fieldClassName} value={shift.fundingSource || "Practice"} disabled={disabled} onChange={(event) => updateBankShift(index, "fundingSource", event.target.value)}>
                      <option>Practice</option>
                      <option>ARRS</option>
                      <option>PCN</option>
                      <option>Locum cover</option>
                      <option>Other</option>
                    </select>
                  </FormField>
                  <div className="staff-bank-shift-actions staff-bank-cost-summary">
                    <output className="staff-paid-hours">{formatHours(shift.hours)}</output>
                    <output className="staff-session-cost">{formatMoney(shift.sessionCost || 0)} cost</output>
                    <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={() => removeBankShift(index)}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="staff-pattern-week-grid staff-pattern-week-grid-split">
          {weekNumbers.map((week) => {
            const weekPattern = safePattern.filter((day) => Number(day.week || 1) === week);
            const weekHours = weekPattern.reduce((total, day) => total + Number(day.hours || 0), 0);

            return (
              <div className="staff-pattern-week-card" key={week}>
                <div className="staff-pattern-week-header">
                  <strong>Week {week}</strong>
                  <span>{formatHours(weekHours)}</span>
                </div>

                {weekPattern.map((day) => (
                  <div className="staff-split-day-card" key={`${week}-${day.day}`}>
                    <div className="staff-split-day-header">
                      <div>
                        <strong>{day.day}</strong>
                        <span>{formatHours(day.hours || 0)} total</span>
                      </div>
                      <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={() => addSplitSegment(day)}>
                        Add split session
                      </Button>
                    </div>

                    <div className="staff-pattern-row staff-pattern-row-split-base">
                      <strong>Whole day</strong>
                      <input className={fieldClassName} type="time" value={day.startTime} disabled={disabled || day.segments.length > 0} onChange={(event) => updateDay(week, day.day, "startTime", event.target.value)} />
                      <input className={fieldClassName} type="time" value={day.finishTime} disabled={disabled || day.segments.length > 0} onChange={(event) => updateDay(week, day.day, "finishTime", event.target.value)} />
                      <input className={fieldClassName} type="number" min="0" max="300" step="5" value={day.breakMinutes} disabled={disabled || day.segments.length > 0} onChange={(event) => updateDay(week, day.day, "breakMinutes", event.target.value)} />
                      <output className="staff-paid-hours">{formatHours(day.segments.length ? getSegmentTotalHours(day.segments) : calculatePaidHours(day.startTime, day.finishTime, day.breakMinutes, day.hours))}</output>
                    </div>

                    {day.segments.length > 0 ? (
                      <div className="staff-split-segment-list">
                        {day.segments.map((segment, index) => (
                          <div className="staff-split-segment-row" key={segment.id || `${day.day}-segment-${index}`}>
                            <input className={fieldClassName} type="time" value={segment.startTime} disabled={disabled} onChange={(event) => updateSegment(day, index, "startTime", event.target.value)} aria-label={`${day.day} split ${index + 1} start`} />
                            <input className={fieldClassName} type="time" value={segment.finishTime} disabled={disabled} onChange={(event) => updateSegment(day, index, "finishTime", event.target.value)} aria-label={`${day.day} split ${index + 1} finish`} />
                            <input className={fieldClassName} type="number" min="0" max="300" step="5" value={segment.breakMinutes} disabled={disabled} onChange={(event) => updateSegment(day, index, "breakMinutes", event.target.value)} aria-label={`${day.day} split ${index + 1} break`} />
                            <select className={fieldClassName} value={segment.room} disabled={disabled} onChange={(event) => updateSegment(day, index, "room", event.target.value)}>
                              {PRACTICE_ROOMS.map((room) => <option key={room.id}>{room.name}</option>)}
                            </select>
                            <input className={fieldClassName} value={segment.activity} disabled={disabled} placeholder="e.g. Treatment room / Dispensary" onChange={(event) => updateSegment(day, index, "activity", event.target.value)} />
                            <output className="staff-paid-hours">{formatHours(segment.hours)}</output>
                            <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={() => removeSegment(day, index)}>Remove</Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StaffPage({
  holidayRequests = [],
  addHolidayRequest,
  updateHolidayRequestStatus,
  currentUser,
  staffList = baseStaff,
  addContractAmendment,
  addStaffProfile,
  updateStaffProfile,
  resetWorkforceProfiles,
  syncStatus = {},
}) {
  const [selectedStaffName, setSelectedStaffName] = useState(
    getStaffDisplayName(staffList[0] || baseStaff[0])
  );

  const [newRequestStaffName, setNewRequestStaffName] = useState(
    getStaffDisplayName(staffList[0] || baseStaff[0])
  );
  const [newRequestStartDate, setNewRequestStartDate] = useState("2026-07-15");
  const [newRequestEndDate, setNewRequestEndDate] = useState("2026-07-15");
  const [newRequestReason, setNewRequestReason] = useState("Annual leave");

  const [newStaffRecord, setNewStaffRecord] = useState({
    name: "",
    role: "Role to confirm",
    team: "Unassigned",
    startDate: "",
  });

  const [amendmentDate, setAmendmentDate] = useState("2026-08-01");
  const [amendmentSummary, setAmendmentSummary] = useState("Change working pattern / budget allocation");
  const [amendmentWeeklyHours, setAmendmentWeeklyHours] = useState("");
  const [amendmentBudget, setAmendmentBudget] = useState("Practice");
  const [amendmentPayType, setAmendmentPayType] = useState("Hourly");
  const [amendmentHourlyRate, setAmendmentHourlyRate] = useState("");
  const [amendmentAnnualSalary, setAmendmentAnnualSalary] = useState("");
  const [amendmentPrimaryRoom, setAmendmentPrimaryRoom] = useState("Nurse room 1");
  const [amendmentSecondaryRoom, setAmendmentSecondaryRoom] = useState("Clinical room 3");

  const workforceRows = useMemo(
    () => enrichWorkforceProfiles(staffList, holidayRequests),
    [staffList, holidayRequests]
  );

  const selectedStaff = useMemo(
    () => getSelectedStaffProfile(workforceRows, selectedStaffName),
    [workforceRows, selectedStaffName]
  );

  const newRequestProfile = useMemo(
    () => getSelectedStaffProfile(workforceRows, newRequestStaffName),
    [workforceRows, newRequestStaffName]
  );

  const newRequestDeduction = useMemo(
    () => calculateLeaveDeductionForRange(newRequestProfile, newRequestStartDate, newRequestEndDate),
    [newRequestProfile, newRequestStartDate, newRequestEndDate]
  );

  const [profileForm, setProfileForm] = useState(() => buildProfileForm(selectedStaff));

  useEffect(() => {
    setProfileForm(buildProfileForm(selectedStaff));
  }, [selectedStaff?.name, selectedStaff?.updatedAt]);

  const coverMetrics = useMemo(
    () => getCoverMetrics({ requests: holidayRequests, staffList }),
    [holidayRequests, staffList]
  );

  const leaveRequestsWithCoverRisk = useMemo(
    () =>
      getLeaveRequestsWithCoverRisk({
        requests: holidayRequests,
        staffList,
      }).map((request) => {
        const profile = getSelectedStaffProfile(workforceRows, request.staffName);
        const calculated = calculateLeaveDeductionForRange(
          profile,
          request.startDate || request.date,
          request.endDate || request.startDate || request.date
        );
        const existingHours = getLeaveRequestDeductedHours(request);
        const shouldUseCalculated = request.requiresDeductionRecalculation || existingHours === 0;

        return {
          ...request,
          deductedHours: shouldUseCalculated ? calculated.totalHours : existingHours,
          hours: shouldUseCalculated ? calculated.totalHours : existingHours,
          deductedShifts: request.deductedShifts ?? calculated.deductedShifts,
          deductionBreakdown: request.deductionBreakdown?.length ? request.deductionBreakdown : calculated.breakdown,
        };
      }),
    [holidayRequests, staffList, workforceRows]
  );

  const selectedStaffRequests = useMemo(
    () => getRequestsForStaff(leaveRequestsWithCoverRisk, selectedStaffName),
    [leaveRequestsWithCoverRisk, selectedStaffName]
  );

  const metrics = useMemo(
    () => getHolidayRequestMetrics(leaveRequestsWithCoverRisk),
    [leaveRequestsWithCoverRisk]
  );

  const financialSummary = useMemo(
    () => getWorkforceFinancialSummary(staffList),
    [staffList]
  );

  const workforceAlerts = useMemo(
    () =>
      getWorkforceAlerts({
        profiles: staffList,
        requests: holidayRequests,
        dates: [newRequestStartDate, newRequestEndDate, "2026-07-08", "2026-07-09"].filter(Boolean),
      }),
    [staffList, holidayRequests, newRequestStartDate, newRequestEndDate]
  );

  const newRequestCoverPreview = useMemo(
    () =>
      assessLeaveRequestRangeCover({
        request: {
          id: "new-request-preview",
          staffName: newRequestStaffName,
          date: newRequestStartDate,
          startDate: newRequestStartDate,
          endDate: newRequestEndDate,
          hours: newRequestDeduction.totalHours,
          deductedHours: newRequestDeduction.totalHours,
          deductedShifts: newRequestDeduction.deductedShifts,
          reason: newRequestReason,
          status: "Pending",
        },
        staffList,
        requests: holidayRequests,
        dates: newRequestDeduction.workingDays.map((day) => day.date),
      }),
    [newRequestStaffName, newRequestStartDate, newRequestEndDate, newRequestDeduction, newRequestReason, holidayRequests, staffList]
  );

  const roomSchedulePreview = useMemo(
    () =>
      getRoomScheduleForDate({
        profiles: staffList,
        requests: holidayRequests,
        date: newRequestStartDate,
      }),
    [staffList, holidayRequests, newRequestStartDate]
  );

  const selectedProgress = selectedStaff.entitlement?.bookableHours > 0
    ? Math.min((selectedStaff.approvedHours / selectedStaff.entitlement.bookableHours) * 100, 100)
    : 0;

  const canManageStaff = String(currentUser?.moduleAccess?.staff || "")
    .toLowerCase()
    .includes("manage");

  const selectedIsBankLocumPattern = profileForm.patternCycleType === BANK_LOCUM_PATTERN_TYPE;
  const selectedPatternWeeks = Number(profileForm.patternCycleWeeks || getCycleWeeksFromType(profileForm.patternCycleType));
  const selectedBankHours = getSegmentTotalHours(profileForm.bankShifts || []);
  const selectedWeeklyHours = selectedIsBankLocumPattern ? 0 : getAveragePatternHours(profileForm.workingPattern, selectedPatternWeeks);
  const selectedWeekHours = Array.from({ length: selectedPatternWeeks }, (_, index) => index + 1)
    .map((week) => ({
      week,
      hours: normalisePattern(profileForm.workingPattern, selectedPatternWeeks)
        .filter((day) => Number(day.week || 1) === week)
        .reduce((total, day) => total + Number(day.hours || 0), 0),
    }));

  function setProfileField(field, value) {
    setProfileForm((current) => ({ ...current, [field]: value }));
  }

  function setProfilePattern(updater) {
    setProfileForm((current) => ({
      ...current,
      workingPattern: typeof updater === "function"
        ? updater(current.workingPattern)
        : normalisePattern(updater, Number(current.patternCycleWeeks || 1)),
    }));
  }

  function setProfileCycleType(nextType, nextWeeks) {
    const isBankLocum = nextType === BANK_LOCUM_PATTERN_TYPE;
    setProfileForm((current) => ({
      ...current,
      patternCycleType: nextType,
      patternCycleWeeks: isBankLocum ? 1 : nextWeeks,
      workingPattern: isBankLocum ? current.workingPattern : normalisePattern(current.workingPattern, nextWeeks),
      contractType: isBankLocum && current.contractType === "Permanent" ? "Bank" : current.contractType,
    }));
  }

  function setProfileCycleAnchor(nextAnchorDate) {
    setProfileForm((current) => ({
      ...current,
      patternAnchorDate: nextAnchorDate,
    }));
  }

  function setProfileBankShifts(updater) {
    setProfileForm((current) => ({
      ...current,
      bankShifts: typeof updater === "function"
        ? updater(current.bankShifts || [])
        : (Array.isArray(updater) ? updater : []),
    }));
  }

  function setNewStaffRecordField(field, value) {
    setNewStaffRecord((current) => ({ ...current, [field]: value }));
  }

  function submitNewStaffProfile(event) {
    event.preventDefault();

    if (!canManageStaff) {
      alert("Only staff administrators can add staff records.");
      return;
    }

    if (!String(newStaffRecord.name || "").trim()) {
      alert("Please enter the staff member name.");
      return;
    }

    if (typeof addStaffProfile !== "function") {
      alert("Adding staff is not connected yet.");
      return;
    }

    const staffName = String(newStaffRecord.name || "").trim();

    addStaffProfile({
      name: staffName,
      role: newStaffRecord.role || "Role to confirm",
      team: newStaffRecord.team || "Unassigned",
      startDate: newStaffRecord.startDate || "",
      employmentStatus: "Onboarding",
      contractType: "Permanent",
      payType: "Hourly",
      budget: "Practice",
      fundingSource: "Practice",
      pensionStatus: "Unknown",
      notes: "Created manually from the Staff records page. Complete contact, pension, funding and work-pattern details before live use.",
    });

    setSelectedStaffName(staffName);
    setNewRequestStaffName(staffName);
    setNewStaffRecord({
      name: "",
      role: "Role to confirm",
      team: "Unassigned",
      startDate: "",
    });
  }

  function submitProfileUpdate(event) {
    event.preventDefault();

    if (!canManageStaff) {
      alert("Only staff administrators can edit staff records.");
      return;
    }

    if (typeof updateStaffProfile !== "function") {
      alert("Staff profile saving is not connected yet.");
      return;
    }

    updateStaffProfile(selectedStaff.name, {
      role: profileForm.role,
      team: profileForm.team,
      employmentStatus: profileForm.employmentStatus,
      contractType: profileForm.contractType,
      startDate: profileForm.startDate,
      lineManager: profileForm.lineManager,
      workEmail: profileForm.workEmail,
      personalEmail: profileForm.personalEmail,
      phone: profileForm.phone,
      emergencyContactName: profileForm.emergencyContactName,
      emergencyContactPhone: profileForm.emergencyContactPhone,
      payType: profileForm.payType,
      hourlyRate: Number(profileForm.hourlyRate || 0),
      annualSalary: Number(profileForm.annualSalary || 0),
      dayRate: Number(profileForm.dayRate || 0),
      budget: profileForm.budget,
      fundingSource: profileForm.fundingSource,
      fundingPercent: Number(profileForm.fundingPercent || 0),
      arrsClaimablePercent: Number(profileForm.arrsClaimablePercent || 0),
      fundingNotes: profileForm.fundingNotes,
      nhsPensionMember: Boolean(profileForm.nhsPensionMember),
      pensionScheme: profileForm.pensionScheme,
      pensionStatus: profileForm.pensionStatus,
      holidayWeeks: Number(profileForm.holidayWeeks || 0),
      worksBankHolidays: Boolean(profileForm.worksBankHolidays),
      primaryRoom: profileForm.primaryRoom,
      secondaryRoom: profileForm.secondaryRoom,
      dbsStatus: profileForm.dbsStatus,
      dbsRenewalDate: profileForm.dbsRenewalDate,
      professionalRegistration: profileForm.professionalRegistration,
      registrationExpiry: profileForm.registrationExpiry,
      notes: profileForm.notes,
      patternCycle: {
        type: profileForm.patternCycleType,
        weeks: Number(profileForm.patternCycleWeeks || getCycleWeeksFromType(profileForm.patternCycleType)),
        anchorDate: profileForm.patternAnchorDate,
        notes: profileForm.patternNotes,
      },
      patternCycleType: profileForm.patternCycleType,
      patternCycleWeeks: Number(profileForm.patternCycleWeeks || getCycleWeeksFromType(profileForm.patternCycleType)),
      patternAnchorDate: profileForm.patternAnchorDate,
      patternNotes: profileForm.patternNotes,
      workingPattern: selectedIsBankLocumPattern
        ? []
        : normalisePattern(
            profileForm.workingPattern,
            Number(profileForm.patternCycleWeeks || getCycleWeeksFromType(profileForm.patternCycleType))
          ),
      bankShifts: Array.isArray(profileForm.bankShifts) ? profileForm.bankShifts.map((shift, index) => normaliseBankShift(shift, index, profileForm.primaryRoom || "GP room 1")) : [],
      contact: {
        workEmail: profileForm.workEmail,
        personalEmail: profileForm.personalEmail,
        phone: profileForm.phone,
        emergencyContactName: profileForm.emergencyContactName,
        emergencyContactPhone: profileForm.emergencyContactPhone,
      },
      employment: {
        status: profileForm.employmentStatus,
        contractType: profileForm.contractType,
        startDate: profileForm.startDate,
        lineManager: profileForm.lineManager,
      },
      pension: {
        nhsPensionMember: Boolean(profileForm.nhsPensionMember),
        scheme: profileForm.pensionScheme,
        status: profileForm.pensionStatus,
      },
      funding: {
        source: profileForm.fundingSource,
        percent: Number(profileForm.fundingPercent || 0),
        notes: profileForm.fundingNotes,
      },
      compliance: {
        dbsStatus: profileForm.dbsStatus,
        dbsRenewalDate: profileForm.dbsRenewalDate,
        professionalRegistration: profileForm.professionalRegistration,
        registrationExpiry: profileForm.registrationExpiry,
      },
    });
  }

  function submitHolidayRequest(event) {
    event.preventDefault();

    if (!newRequestStaffName || !newRequestStartDate || !newRequestEndDate) {
      alert("Please complete staff member, start date and end date.");
      return;
    }

    if (newRequestEndDate < newRequestStartDate) {
      alert("End date cannot be before the start date.");
      return;
    }

    if (newRequestDeduction.deductedShifts === 0 && newRequestReason === "Annual leave") {
      const proceed = window.confirm("This date range does not include any scheduled shifts for this staff member. Add it anyway?");
      if (!proceed) return;
    }

    const newRequest = createHolidayRequest({
      staffName: newRequestStaffName,
      date: newRequestStartDate,
      startDate: newRequestStartDate,
      endDate: newRequestEndDate,
      hours: newRequestDeduction.totalHours,
      deductedHours: newRequestDeduction.totalHours,
      deductedShifts: newRequestDeduction.deductedShifts,
      deductionBreakdown: newRequestDeduction.breakdown,
      reason: newRequestReason,
    });

    addHolidayRequest(newRequest);
    setSelectedStaffName(newRequestStaffName);
    setNewRequestReason("Annual leave");
  }

  function submitContractAmendment(event) {
    event.preventDefault();

    if (typeof addContractAmendment !== "function") {
      alert("Contract amendments are not connected yet.");
      return;
    }

    addContractAmendment(
      selectedStaff.name,
      createContractAmendment({
        effectiveDate: amendmentDate,
        summary: amendmentSummary,
        weeklyHours: amendmentWeeklyHours,
        budget: amendmentBudget,
        payType: amendmentPayType,
        hourlyRate: amendmentHourlyRate,
        annualSalary: amendmentAnnualSalary,
        primaryRoom: amendmentPrimaryRoom,
        secondaryRoom: amendmentSecondaryRoom,
      })
    );
  }

  return (
    <>
      <PageHeader eyebrow="Workforce" title="Staff records and workforce control">
        Individual staff records now sit behind the workforce view. Admin users can maintain contact details, contract terms, working pattern, pension status, funding source, room preferences and compliance notes.
      </PageHeader>

      <SyncStatusBanner status={syncStatus} moduleName="Workforce">
        <span className="sync-status-mini">Changes still save locally first in this alpha; use Access → Seed / upsert to push the current working copy into Supabase.</span>
      </SyncStatusBanner>

      <section className="metric-grid staff-metric-strip">
        <MetricCard
          title="Staff profiles"
          value={workforceRows.length}
          detail="Database-ready workforce records"
          icon={Users}
        />
        <MetricCard
          title="Pending leave"
          value={metrics.pendingRequests.length}
          detail={`${metrics.totalPendingHours} pending hours`}
          icon={Clock}
        />
        <MetricCard
          title="Monthly wage cost"
          value={formatMoney(financialSummary.totalMonthlyCost)}
          detail={`${formatMoney(financialSummary.arrsClaimableMonthly)} ARRS claimable`}
          icon={Landmark}
        />
        <MetricCard
          title="Cover risks"
          value={coverMetrics.riskyPendingRequests.length + coverMetrics.riskyApprovedRequests.length}
          detail={`${workforceAlerts.roomConflicts.length} room conflict(s)`}
          icon={AlertTriangle}
        />
      </section>

      {workforceAlerts.unpaidPendingLeave.length > 0 ? (
        <AlertBanner tone="danger" title="Leave request exceeds calculated balance" icon={AlertTriangle}>
          {workforceAlerts.unpaidPendingLeave.length} staff member(s) have pending leave
          that would exceed their calculated remaining bookable holiday balance.
        </AlertBanner>
      ) : null}

      {coverMetrics.riskyPendingRequests.length > 0 ? (
        <AlertBanner tone="warning" title="Pending leave may affect minimum cover" icon={CalendarDays}>
          {coverMetrics.riskyPendingRequests.length} pending leave request
          {coverMetrics.riskyPendingRequests.length === 1 ? " has" : "s have"}{" "}
          medium/high cover warnings. Check the cover impact before approving.
        </AlertBanner>
      ) : null}

      <section className="staff-admin-layout">
        <Panel className="panel staff-directory-panel">
          <SectionHeader eyebrow="People" title="Staff directory">
            No more crushed workforce table. Select a staff member to view or maintain their full record.
          </SectionHeader>

          {canManageStaff ? (
            <form className="staff-add-profile-form" onSubmit={submitNewStaffProfile}>
              <FormField label="Add staff member">
                <input
                  className={fieldClassName}
                  value={newStaffRecord.name}
                  placeholder="Full name"
                  onChange={(event) => setNewStaffRecordField("name", event.target.value)}
                />
              </FormField>
              <FormField label="Role">
                <input
                  className={fieldClassName}
                  value={newStaffRecord.role}
                  onChange={(event) => setNewStaffRecordField("role", event.target.value)}
                />
              </FormField>
              <FormField label="Team">
                <select
                  className={fieldClassName}
                  value={newStaffRecord.team}
                  onChange={(event) => setNewStaffRecordField("team", event.target.value)}
                >
                  <option>Unassigned</option>
                  <option>Management</option>
                  <option>Clinical</option>
                  <option>Nursing</option>
                  <option>Reception</option>
                  <option>Dispensary</option>
                  <option>PCN / ARRS</option>
                </select>
              </FormField>
              <FormField label="Start date">
                <input
                  className={fieldClassName}
                  type="date"
                  value={newStaffRecord.startDate}
                  onChange={(event) => setNewStaffRecordField("startDate", event.target.value)}
                />
              </FormField>
              <Button type="submit" variant="secondary">
                <UserPlus size={16} /> Add staff
              </Button>
            </form>
          ) : null}

          <div className="staff-directory-grid">
            {workforceRows.map((person) => (
              <StaffDirectoryCard
                key={person.name}
                person={person}
                isSelected={person.name === selectedStaff.name}
                onSelect={() => setSelectedStaffName(person.name)}
              />
            ))}
          </div>
        </Panel>

        <Panel as="aside" className="panel staff-profile-panel">
          <div className="staff-profile-hero">
            <div className="staff-profile-avatar">{getInitials(selectedStaff.name)}</div>
            <div>
              <p className="eyebrow">Selected staff</p>
              <h2>{getStaffDisplayName(selectedStaff)}</h2>
              <span>{getStaffRole(selectedStaff)} · {selectedStaff.team}</span>
            </div>
            <Badge>{selectedStaff.employmentStatus}</Badge>
          </div>

          <div className="staff-contact-actions">
            <a href={`mailto:${selectedStaff.workEmail || ""}`}>
              <Mail size={15} /> {selectedStaff.workEmail || "No work email"}
            </a>
            <a href={selectedStaff.phone ? `tel:${selectedStaff.phone}` : undefined}>
              <Phone size={15} /> {selectedStaff.phone || "No phone"}
            </a>
          </div>

          <div className="staff-fact-grid">
            <StaffFact label="Average weekly hours" value={formatHours(selectedStaff.contractedHours)} />
            <StaffFact label="Pattern cycle" value={getPatternCycle(selectedStaff).type} />
            <StaffFact label="Bookable leave" value={formatHours(selectedStaff.entitlement.bookableHours)} />
            <StaffFact label="Remaining leave" value={formatHours(selectedStaff.remainingHours)} />
            <StaffFact label="Monthly cost" value={formatMoney(selectedStaff.monthlyCost)} />
            <StaffFact label="Funding" value={`${selectedStaff.fundingSource || selectedStaff.budget} · ${selectedStaff.fundingPercent || 100}%`} />
            <StaffFact label="Pension" value={selectedStaff.nhsPensionMember ? selectedStaff.pensionScheme : "Not enrolled"} />
            <StaffFact label="Primary room" value={selectedStaff.primaryRoom} />
            <StaffFact label="DBS" value={selectedStaff.dbsStatus} />
          </div>

          <div className="staff-pattern-summary-card">
            <span>Pattern summary</span>
            <strong>{selectedStaff.patternLabel}</strong>
          </div>

          <div className="progress-section">
            <div className="progress-label">
              <span>Bookable leave used</span>
              <strong>{Math.round(selectedProgress)}%</strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill progress-fill-green" style={{ width: `${selectedProgress}%` }} />
            </div>
          </div>
        </Panel>
      </section>

      <Panel className="panel staff-record-panel">
        <SectionHeader eyebrow="Admin controlled" title="Individual staff record">
          {canManageStaff
            ? "Edit the selected staff member. These fields are structured for Supabase staff_profiles, staff_contacts, staff_contracts and staff_working_patterns tables."
            : "This role can view the selected staff record but cannot edit admin-controlled fields."}
        </SectionHeader>

        <form className="staff-record-form" onSubmit={submitProfileUpdate}>
          <div className="staff-form-section">
            <div>
              <h3><UserCog size={18} /> Role and employment</h3>
              <p>Core HR details used for permissions, rota grouping and management reporting.</p>
            </div>
            <div className="staff-form-grid">
              <FormField label="Role">
                <input className={fieldClassName} value={profileForm.role} disabled={!canManageStaff} onChange={(event) => setProfileField("role", event.target.value)} />
              </FormField>
              <FormField label="Team">
                <input className={fieldClassName} value={profileForm.team} disabled={!canManageStaff} onChange={(event) => setProfileField("team", event.target.value)} />
              </FormField>
              <FormField label="Employment status">
                <select className={fieldClassName} value={profileForm.employmentStatus} disabled={!canManageStaff} onChange={(event) => setProfileField("employmentStatus", event.target.value)}>
                  <option>Active</option>
                  <option>Onboarding</option>
                  <option>On leave</option>
                  <option>Leaver</option>
                </select>
              </FormField>
              <FormField label="Contract type">
                <select className={fieldClassName} value={profileForm.contractType} disabled={!canManageStaff} onChange={(event) => setProfileField("contractType", event.target.value)}>
                  <option>Permanent</option>
                  <option>Fixed term</option>
                  <option>Locum</option>
                  <option>ARRS</option>
                  <option>Bank</option>
                </select>
              </FormField>
              <FormField label="Start date">
                <input className={fieldClassName} type="date" value={profileForm.startDate} disabled={!canManageStaff} onChange={(event) => setProfileField("startDate", event.target.value)} />
              </FormField>
              <FormField label="Line manager">
                <input className={fieldClassName} value={profileForm.lineManager} disabled={!canManageStaff} onChange={(event) => setProfileField("lineManager", event.target.value)} />
              </FormField>
            </div>
          </div>

          <div className="staff-form-section">
            <div>
              <h3><Mail size={18} /> Contact and emergency</h3>
              <p>Admin controlled contact details. Do not put patient-identifiable data here.</p>
            </div>
            <div className="staff-form-grid">
              <FormField label="Work email">
                <input className={fieldClassName} type="email" value={profileForm.workEmail} disabled={!canManageStaff} onChange={(event) => setProfileField("workEmail", event.target.value)} />
              </FormField>
              <FormField label="Personal email">
                <input className={fieldClassName} type="email" value={profileForm.personalEmail} disabled={!canManageStaff} onChange={(event) => setProfileField("personalEmail", event.target.value)} />
              </FormField>
              <FormField label="Mobile / phone">
                <input className={fieldClassName} value={profileForm.phone} disabled={!canManageStaff} onChange={(event) => setProfileField("phone", event.target.value)} />
              </FormField>
              <FormField label="Emergency contact">
                <input className={fieldClassName} value={profileForm.emergencyContactName} disabled={!canManageStaff} onChange={(event) => setProfileField("emergencyContactName", event.target.value)} />
              </FormField>
              <FormField label="Emergency phone">
                <input className={fieldClassName} value={profileForm.emergencyContactPhone} disabled={!canManageStaff} onChange={(event) => setProfileField("emergencyContactPhone", event.target.value)} />
              </FormField>
            </div>
          </div>

          <div className="staff-form-section">
            <div>
              <h3><Landmark size={18} /> Pay, pension and funding</h3>
              <p>Funding supports practice, dispensary, PCN and ARRS reporting.</p>
            </div>
            <div className="staff-form-grid">
              <FormField label="Pay type">
                <select className={fieldClassName} value={profileForm.payType} disabled={!canManageStaff} onChange={(event) => setProfileField("payType", event.target.value)}>
                  <option>Hourly</option>
                  <option>Salary</option>
                  <option>Daily</option>
                </select>
              </FormField>
              <FormField label="Hourly rate">
                <input className={fieldClassName} type="number" step="0.01" value={profileForm.hourlyRate} disabled={!canManageStaff} onChange={(event) => setProfileField("hourlyRate", event.target.value)} />
              </FormField>
              <FormField label="Annual salary">
                <input className={fieldClassName} type="number" step="100" value={profileForm.annualSalary} disabled={!canManageStaff} onChange={(event) => setProfileField("annualSalary", event.target.value)} />
              </FormField>
              <FormField label="Budget">
                <select className={fieldClassName} value={profileForm.budget} disabled={!canManageStaff} onChange={(event) => setProfileField("budget", event.target.value)}>
                  <option>Practice</option>
                  <option>Dispensary</option>
                  <option>ARRS</option>
                  <option>PCN</option>
                </select>
              </FormField>
              <FormField label="Funding source">
                <select className={fieldClassName} value={profileForm.fundingSource} disabled={!canManageStaff} onChange={(event) => setProfileField("fundingSource", event.target.value)}>
                  <option>Practice</option>
                  <option>Dispensary</option>
                  <option>ARRS</option>
                  <option>PCN</option>
                  <option>ICB</option>
                  <option>Locum</option>
                </select>
              </FormField>
              <FormField label="Funding %">
                <input className={fieldClassName} type="number" min="0" max="100" step="1" value={profileForm.fundingPercent} disabled={!canManageStaff} onChange={(event) => setProfileField("fundingPercent", event.target.value)} />
              </FormField>
              <FormField label="ARRS claimable %">
                <input className={fieldClassName} type="number" min="0" max="100" step="1" value={profileForm.arrsClaimablePercent} disabled={!canManageStaff} onChange={(event) => setProfileField("arrsClaimablePercent", event.target.value)} />
              </FormField>
              <FormField label="NHS pension member">
                <select className={fieldClassName} value={profileForm.nhsPensionMember ? "Yes" : "No"} disabled={!canManageStaff} onChange={(event) => setProfileField("nhsPensionMember", event.target.value === "Yes")}>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </FormField>
              <FormField label="Pension status">
                <select className={fieldClassName} value={profileForm.pensionStatus} disabled={!canManageStaff} onChange={(event) => setProfileField("pensionStatus", event.target.value)}>
                  <option>Enrolled</option>
                  <option>Opted out</option>
                  <option>Not enrolled</option>
                  <option>Unknown</option>
                </select>
              </FormField>
              <FormField label="Funding notes" className="staff-field-wide">
                <input className={fieldClassName} value={profileForm.fundingNotes} disabled={!canManageStaff} onChange={(event) => setProfileField("fundingNotes", event.target.value)} />
              </FormField>
            </div>
          </div>

          <div className="staff-form-section">
            <div>
              <h3><CalendarDays size={18} /> Working pattern</h3>
              <p>
                {selectedIsBankLocumPattern
                  ? `${formatHours(selectedBankHours)} scheduled across ${profileForm.bankShifts?.length || 0} bank/locum session(s).`
                  : `${formatHours(selectedWeeklyHours)} average per week across the selected cycle.`}
                {!selectedIsBankLocumPattern && selectedPatternWeeks > 1 ? ` ${selectedWeekHours.map((item) => `Week ${item.week}: ${item.hours}h`).join(" · ")}.` : ""}
                {selectedIsBankLocumPattern ? " These one-off sessions drive rota presence, rooms and cover without creating a weekly pattern." : " This drives leave, cover warnings, rota rules and room allocation."}
              </p>
            </div>
            <StaffPatternEditor
              pattern={profileForm.workingPattern}
              cycleType={profileForm.patternCycleType}
              cycleWeeks={profileForm.patternCycleWeeks}
              anchorDate={profileForm.patternAnchorDate}
              setPattern={setProfilePattern}
              setCycleType={setProfileCycleType}
              setAnchorDate={setProfileCycleAnchor}
              bankShifts={profileForm.bankShifts}
              setBankShifts={setProfileBankShifts}
              primaryRoom={profileForm.primaryRoom}
              disabled={!canManageStaff}
            />
          </div>

          <div className="staff-form-section">
            <div>
              <h3><ShieldCheck size={18} /> Rooms and compliance</h3>
              <p>Operational preferences and staff compliance metadata.</p>
            </div>
            <div className="staff-form-grid">
              <FormField label="Holiday weeks">
                <input className={fieldClassName} type="number" step="0.1" value={profileForm.holidayWeeks} disabled={!canManageStaff} onChange={(event) => setProfileField("holidayWeeks", event.target.value)} />
              </FormField>
              <FormField label="Works bank holidays">
                <select className={fieldClassName} value={profileForm.worksBankHolidays ? "Yes" : "No"} disabled={!canManageStaff} onChange={(event) => setProfileField("worksBankHolidays", event.target.value === "Yes")}>
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </FormField>
              <FormField label="Primary room">
                <select className={fieldClassName} value={profileForm.primaryRoom} disabled={!canManageStaff} onChange={(event) => setProfileField("primaryRoom", event.target.value)}>
                  {PRACTICE_ROOMS.map((room) => <option key={room.id}>{room.name}</option>)}
                </select>
              </FormField>
              <FormField label="Secondary room">
                <select className={fieldClassName} value={profileForm.secondaryRoom} disabled={!canManageStaff} onChange={(event) => setProfileField("secondaryRoom", event.target.value)}>
                  {PRACTICE_ROOMS.map((room) => <option key={room.id}>{room.name}</option>)}
                </select>
              </FormField>
              <FormField label="DBS status">
                <select className={fieldClassName} value={profileForm.dbsStatus} disabled={!canManageStaff} onChange={(event) => setProfileField("dbsStatus", event.target.value)}>
                  <option>Not recorded</option>
                  <option>Current</option>
                  <option>Due soon</option>
                  <option>Expired</option>
                  <option>Not required</option>
                </select>
              </FormField>
              <FormField label="DBS renewal date">
                <input className={fieldClassName} type="date" value={profileForm.dbsRenewalDate} disabled={!canManageStaff} onChange={(event) => setProfileField("dbsRenewalDate", event.target.value)} />
              </FormField>
              <FormField label="Professional registration">
                <input className={fieldClassName} value={profileForm.professionalRegistration} disabled={!canManageStaff} placeholder="GMC / NMC / GPhC number" onChange={(event) => setProfileField("professionalRegistration", event.target.value)} />
              </FormField>
              <FormField label="Registration expiry">
                <input className={fieldClassName} type="date" value={profileForm.registrationExpiry} disabled={!canManageStaff} onChange={(event) => setProfileField("registrationExpiry", event.target.value)} />
              </FormField>
              <FormField label="Admin notes" className="staff-field-wide">
                <textarea className={fieldClassName} rows="3" value={profileForm.notes} disabled={!canManageStaff} onChange={(event) => setProfileField("notes", event.target.value)} />
              </FormField>
            </div>
          </div>

          <div className="policy-actions staff-form-actions">
            <Button type="submit" variant="primary" disabled={!canManageStaff}>Save staff record</Button>
            <Button type="button" variant="secondary" onClick={() => setProfileForm(buildProfileForm(selectedStaff))}>Discard changes</Button>
            <Button type="button" variant="secondary" onClick={resetWorkforceProfiles}>Reset workforce defaults</Button>
          </div>
        </form>
      </Panel>

      <section className="content-grid staff-ops-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Leave requests" title="Request queue with cover and balance impact">
            Approve, reject or reopen leave requests. Each request is checked against remaining balance and minimum cover.
          </SectionHeader>

          <DataTable
            columns={[
              { key: "staffName", label: "Staff member" },
              { key: "date", label: "Period" },
              { key: "hours", label: "Deduction" },
              { key: "reason", label: "Reason" },
              { key: "coverRisk", label: "Cover impact" },
              { key: "status", label: "Status" },
              { key: "actions", label: "Actions" },
            ]}
            rows={leaveRequestsWithCoverRisk}
            emptyTitle="No leave requests"
            emptyMessage="Create a leave request using the form on this page."
            renderCell={(row, key) => {
              if (key === "staffName") return <strong>{row.staffName}</strong>;
              if (key === "date") return formatLeaveRequestPeriod(row);
              if (key === "hours") return (
                <div className="stacked-cell">
                  <strong>{formatHours(getLeaveRequestDeductedHours(row))}</strong>
                  <span>{getLeaveRequestDeductedShifts(row) || row.deductedShifts || 0} shift(s)</span>
                </div>
              );
              if (key === "status") return <Badge>{row.status}</Badge>;
              if (key === "coverRisk") {
                return (
                  <div className="stacked-cell">
                    <Badge>{row.coverRisk}</Badge>
                    <span>
                      {row.coverWarnings.length > 0
                        ? row.coverWarnings.map((warning) => warning.team).join(", ")
                        : "Minimum cover maintained"}
                    </span>
                  </div>
                );
              }

              if (key === "actions") {
                return (
                  <div className="action-buttons">
                    <Button
                      type="button"
                      size="sm"
                      variant={row.coverAssessment.riskScore >= 3 ? "danger" : "primary"}
                      onClick={() => updateHolidayRequestStatus(row.id, "Approved")}
                    >
                      Approve
                    </Button>
                    <Button type="button" size="sm" variant="danger" onClick={() => updateHolidayRequestStatus(row.id, "Rejected")}>Reject</Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => updateHolidayRequestStatus(row.id, "Pending")}>Reopen</Button>
                  </div>
                );
              }

              return row[key];
            }}
          />
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="New request" title="Add leave request">
            Create a leave request with live cover, room and balance preview.
          </SectionHeader>

          <form className="holiday-request-form" onSubmit={submitHolidayRequest}>
            <h3><UserPlus size={20} /> New leave request</h3>

            <div className="form-grid">
              <FormField label="Staff member">
                <select className={fieldClassName} value={newRequestStaffName} onChange={(event) => setNewRequestStaffName(event.target.value)}>
                  {workforceRows.map((person) => <option key={person.name}>{person.name}</option>)}
                </select>
              </FormField>

              <FormField label="Start date">
                <input
                  className={fieldClassName}
                  type="date"
                  value={newRequestStartDate}
                  onChange={(event) => {
                    const nextStart = event.target.value;
                    setNewRequestStartDate(nextStart);
                    if (!newRequestEndDate || newRequestEndDate < nextStart) {
                      setNewRequestEndDate(nextStart);
                    }
                  }}
                />
              </FormField>

              <FormField label="End date">
                <input
                  className={fieldClassName}
                  type="date"
                  value={newRequestEndDate}
                  min={newRequestStartDate}
                  onChange={(event) => setNewRequestEndDate(event.target.value)}
                />
              </FormField>

              <FormField label="Reason">
                <select className={fieldClassName} value={newRequestReason} onChange={(event) => setNewRequestReason(event.target.value)}>
                  <option>Annual leave</option>
                  <option>Medical appointment</option>
                  <option>Unpaid leave</option>
                  <option>Training</option>
                  <option>Other</option>
                </select>
              </FormField>
            </div>

            <div className="cover-preview-card leave-range-preview-card">
              <div><ShieldCheck size={20} /><strong>Operational preview</strong></div>
              <Badge>{newRequestCoverPreview.riskLabel}</Badge>
              <p>
                {formatDate(newRequestStartDate)}{newRequestEndDate !== newRequestStartDate ? ` – ${formatDate(newRequestEndDate)}` : ""} · {newRequestDeduction.calendarDays} calendar day(s) · {newRequestDeduction.deductedShifts} shift(s) · {formatHours(newRequestDeduction.totalHours)} deducted.
              </p>

              <div className="leave-deduction-summary">
                <div>
                  <span>Staff member</span>
                  <strong>{newRequestProfile.name}</strong>
                </div>
                <div>
                  <span>Remaining before request</span>
                  <strong>{formatHours(newRequestProfile.remainingHours)}</strong>
                </div>
                <div>
                  <span>Remaining after request</span>
                  <strong>{formatHours(Math.max(Number(newRequestProfile.remainingHours || 0) - Number(newRequestDeduction.totalHours || 0), 0))}</strong>
                </div>
              </div>

              <div className="leave-breakdown-list">
                {newRequestDeduction.breakdown.map((day) => (
                  <div className={day.isWorkingDay ? "leave-breakdown-row" : "leave-breakdown-row leave-breakdown-row-muted"} key={day.date}>
                    <strong>{day.formattedDate}</strong>
                    <span>{day.day} · W{day.cycleWeek}</span>
                    <span>{day.isWorkingDay ? `${day.startTime || "--"}-${day.finishTime || "--"} · ${day.breakMinutes} min break` : "Not a scheduled shift"}</span>
                    <Badge>{formatHours(day.hours)}</Badge>
                  </div>
                ))}
              </div>

              <CoverWarningList warnings={newRequestCoverPreview.warnings} />
              {roomSchedulePreview.conflicts.length > 0 ? (
                <div className="cover-warning-list">
                  {roomSchedulePreview.conflicts.map((conflict) => (
                    <div key={conflict.staffName}>
                      <strong>Room conflict</strong>
                      <span>{conflict.message}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <Button type="submit" variant="primary">Add leave request</Button>
          </form>
        </Panel>
      </section>

      <section className="content-grid staff-ops-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Contract amendments" title="Selected staff HR timeline">
            Add a contract amendment and the workforce profile recalculates hours, payroll, holiday and room preferences.
          </SectionHeader>

          <form className="audit-submit-form" onSubmit={submitContractAmendment}>
            <FormField label="Effective date">
              <input className={fieldClassName} type="date" value={amendmentDate} onChange={(event) => setAmendmentDate(event.target.value)} />
            </FormField>

            <FormField label="Summary">
              <input className={fieldClassName} value={amendmentSummary} onChange={(event) => setAmendmentSummary(event.target.value)} />
            </FormField>

            <div className="form-grid">
              <FormField label="Weekly hours">
                <input className={fieldClassName} type="number" step="0.5" placeholder={`${selectedStaff.contractedHours}`} value={amendmentWeeklyHours} onChange={(event) => setAmendmentWeeklyHours(event.target.value)} />
              </FormField>

              <FormField label="Budget">
                <select className={fieldClassName} value={amendmentBudget} onChange={(event) => setAmendmentBudget(event.target.value)}>
                  <option>Practice</option>
                  <option>Dispensary</option>
                  <option>ARRS</option>
                  <option>PCN</option>
                </select>
              </FormField>

              <FormField label="Pay type">
                <select className={fieldClassName} value={amendmentPayType} onChange={(event) => setAmendmentPayType(event.target.value)}>
                  <option>Hourly</option>
                  <option>Salary</option>
                  <option>Daily</option>
                </select>
              </FormField>

              <FormField label="Hourly rate">
                <input className={fieldClassName} type="number" step="0.1" value={amendmentHourlyRate} onChange={(event) => setAmendmentHourlyRate(event.target.value)} />
              </FormField>

              <FormField label="Annual salary">
                <input className={fieldClassName} type="number" step="100" value={amendmentAnnualSalary} onChange={(event) => setAmendmentAnnualSalary(event.target.value)} />
              </FormField>

              <FormField label="Primary room">
                <select className={fieldClassName} value={amendmentPrimaryRoom} onChange={(event) => setAmendmentPrimaryRoom(event.target.value)}>
                  {PRACTICE_ROOMS.map((room) => <option key={room.id}>{room.name}</option>)}
                </select>
              </FormField>

              <FormField label="Secondary room">
                <select className={fieldClassName} value={amendmentSecondaryRoom} onChange={(event) => setAmendmentSecondaryRoom(event.target.value)}>
                  {PRACTICE_ROOMS.map((room) => <option key={room.id}>{room.name}</option>)}
                </select>
              </FormField>
            </div>

            <div className="policy-actions">
              <Button type="submit" variant="primary">Apply amendment</Button>
            </div>
          </form>
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Amendment history" title="Contract timeline">
            Contract history for the selected staff member.
          </SectionHeader>

          <div className="governance-alert-grid">
            {(selectedStaff.contractAmendments || []).map((amendment) => (
              <div className="governance-alert" key={amendment.id}>
                <div>
                  <strong>{formatDate(amendment.effectiveDate)}</strong>
                  <span>{amendment.summary} · {amendment.weeklyHours} hrs · {amendment.budget}</span>
                </div>
                <Badge>Contract</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="content-grid staff-ops-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Rooms" title={`Room allocation preview · ${formatDate(newRequestStartDate)}`}>
            Primary and secondary rooms are allocated by clinical priority, with blocked rooms and approved leave removed.
          </SectionHeader>

          <DataTable
            columns={[
              { key: "staffName", label: "Staff" },
              { key: "role", label: "Role" },
              { key: "room", label: "Room" },
              { key: "status", label: "Status" },
            ]}
            rows={roomSchedulePreview.assignments}
            emptyTitle="No room assignments"
            emptyMessage="No staff are scheduled for this date or all are on approved leave."
            renderCell={(row, key) => {
              if (key === "staffName") return <strong>{row.staffName}</strong>;
              if (key === "role" || key === "status") return <Badge>{row[key]}</Badge>;
              return row[key];
            }}
          />
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Workforce exceptions" title="Items needing management review">
            Low leave balances, leave over balance and room conflicts.
          </SectionHeader>

          <div className="governance-alert-grid">
            {[...workforceAlerts.lowLeaveBalances, ...workforceAlerts.unpaidPendingLeave].slice(0, 8).map((profile) => (
              <div className="governance-alert" key={`leave-balance-${profile.name}`}>
                <div>
                  <strong>{profile.name}</strong>
                  <span>{profile.remainingHours} hrs remaining · {profile.pendingHours} hrs pending</span>
                </div>
                <Badge>Leave balance</Badge>
              </div>
            ))}

            {workforceAlerts.roomConflicts.slice(0, 6).map((conflict) => (
              <div className="governance-alert" key={`room-${conflict.date}-${conflict.staffName}`}>
                <div>
                  <strong>{conflict.staffName}</strong>
                  <span>{conflict.formattedDate} · {conflict.message}</span>
                </div>
                <Badge>Room conflict</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel className="panel">
        <SectionHeader eyebrow="Selected staff" title="Leave history">
          Leave records linked to the currently selected staff member.
        </SectionHeader>

        <DataTable
          columns={[
            { key: "date", label: "Period" },
            { key: "hours", label: "Deduction" },
            { key: "reason", label: "Reason" },
            { key: "status", label: "Status" },
          ]}
          rows={selectedStaffRequests}
          emptyTitle="No leave history"
          emptyMessage="This staff member has no leave requests recorded yet."
          renderCell={(row, key) => {
            if (key === "date") return formatLeaveRequestPeriod(row);
            if (key === "hours") return `${formatHours(getLeaveRequestDeductedHours(row))} · ${getLeaveRequestDeductedShifts(row) || 0} shift(s)`;
            if (key === "status") return <Badge>{row.status}</Badge>;
            return row[key];
          }}
        />
      </Panel>
    </>
  );
}
