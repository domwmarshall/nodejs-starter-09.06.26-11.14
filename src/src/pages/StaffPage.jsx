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
import { DataTable } from "../components/DataTable";
import { formatDate } from "../utils/dateUtils";

import { staff as baseStaff } from "../data/staff";
import { PRACTICE_ROOMS } from "../data/workforce";

import {
  createHolidayRequest,
  getHolidayRequestMetrics,
  getRequestsForStaff,
  getSelectedStaffProfile,
  getStaffDisplayName,
  getStaffRole,
} from "../services/staffService";

import {
  assessLeaveRequestCover,
  getCoverMetrics,
  getLeaveRequestsWithCoverRisk,
} from "../services/coverService";

import {
  createContractAmendment,
  enrichWorkforceProfiles,
  getRoomScheduleForDate,
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

function normalisePattern(pattern = []) {
  return WORKING_DAYS.map((day) => {
    const existing = pattern.find((item) => item.day === day) || {};
    return {
      day,
      hours: Number(existing.hours || 0),
      shift: existing.shift || (Number(existing.hours || 0) > 0 ? "08:30-17:00" : ""),
    };
  });
}

function buildProfileForm(profile = {}) {
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
    workingPattern: normalisePattern(profile.workingPattern || []),
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
        <span>{formatHours(person.contractedHours)}/wk</span>
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

function StaffPatternEditor({ pattern = [], setPattern, disabled }) {
  function updateDay(day, field, value) {
    setPattern((current) =>
      normalisePattern(current).map((item) =>
        item.day === day
          ? { ...item, [field]: field === "hours" ? Number(value || 0) : value }
          : item
      )
    );
  }

  return (
    <div className="staff-pattern-editor">
      {normalisePattern(pattern).map((day) => (
        <div className="staff-pattern-row" key={day.day}>
          <strong>{day.day.slice(0, 3)}</strong>
          <input
            className={fieldClassName}
            type="number"
            min="0"
            step="0.5"
            value={day.hours}
            disabled={disabled}
            onChange={(event) => updateDay(day.day, "hours", event.target.value)}
            aria-label={`${day.day} hours`}
          />
          <input
            className={fieldClassName}
            value={day.shift}
            disabled={disabled}
            placeholder="08:30-17:00"
            onChange={(event) => updateDay(day.day, "shift", event.target.value)}
            aria-label={`${day.day} shift`}
          />
        </div>
      ))}
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
  updateStaffProfile,
  resetWorkforceProfiles,
}) {
  const [selectedStaffName, setSelectedStaffName] = useState(
    getStaffDisplayName(staffList[0] || baseStaff[0])
  );

  const [newRequestStaffName, setNewRequestStaffName] = useState(
    getStaffDisplayName(staffList[0] || baseStaff[0])
  );
  const [newRequestDate, setNewRequestDate] = useState("2026-07-15");
  const [newRequestHours, setNewRequestHours] = useState(7.5);
  const [newRequestReason, setNewRequestReason] = useState("Annual leave");

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

  const [profileForm, setProfileForm] = useState(() => buildProfileForm(selectedStaff));

  useEffect(() => {
    setProfileForm(buildProfileForm(selectedStaff));
  }, [selectedStaff?.name, selectedStaff?.updatedAt]);

  const selectedStaffRequests = useMemo(
    () => getRequestsForStaff(holidayRequests, selectedStaffName),
    [holidayRequests, selectedStaffName]
  );

  const metrics = useMemo(
    () => getHolidayRequestMetrics(holidayRequests),
    [holidayRequests]
  );

  const coverMetrics = useMemo(
    () => getCoverMetrics({ requests: holidayRequests, staffList }),
    [holidayRequests, staffList]
  );

  const leaveRequestsWithCoverRisk = useMemo(
    () =>
      getLeaveRequestsWithCoverRisk({
        requests: holidayRequests,
        staffList,
      }),
    [holidayRequests, staffList]
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
        dates: [newRequestDate, "2026-07-08", "2026-07-09"],
      }),
    [staffList, holidayRequests, newRequestDate]
  );

  const newRequestCoverPreview = useMemo(
    () =>
      assessLeaveRequestCover({
        request: {
          id: "new-request-preview",
          staffName: newRequestStaffName,
          date: newRequestDate,
          hours: Number(newRequestHours || 0),
          reason: newRequestReason,
          status: "Pending",
        },
        staffList,
        requests: holidayRequests,
      }),
    [newRequestStaffName, newRequestDate, newRequestHours, newRequestReason, holidayRequests, staffList]
  );

  const roomSchedulePreview = useMemo(
    () =>
      getRoomScheduleForDate({
        profiles: staffList,
        requests: holidayRequests,
        date: newRequestDate,
      }),
    [staffList, holidayRequests, newRequestDate]
  );

  const selectedProgress = selectedStaff.entitlement?.bookableHours > 0
    ? Math.min((selectedStaff.approvedHours / selectedStaff.entitlement.bookableHours) * 100, 100)
    : 0;

  const canManageStaff = String(currentUser?.moduleAccess?.staff || "")
    .toLowerCase()
    .includes("manage");

  const selectedWeeklyHours = normalisePattern(profileForm.workingPattern).reduce(
    (total, day) => total + Number(day.hours || 0),
    0
  );

  function setProfileField(field, value) {
    setProfileForm((current) => ({ ...current, [field]: value }));
  }

  function setProfilePattern(updater) {
    setProfileForm((current) => ({
      ...current,
      workingPattern: typeof updater === "function" ? updater(current.workingPattern) : updater,
    }));
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
      workingPattern: normalisePattern(profileForm.workingPattern),
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

    if (!newRequestStaffName || !newRequestDate || !newRequestHours) {
      alert("Please complete staff member, date and hours.");
      return;
    }

    const newRequest = createHolidayRequest({
      staffName: newRequestStaffName,
      date: newRequestDate,
      hours: newRequestHours,
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
            <StaffFact label="Weekly hours" value={formatHours(selectedStaff.contractedHours)} />
            <StaffFact label="Bookable leave" value={formatHours(selectedStaff.entitlement.bookableHours)} />
            <StaffFact label="Remaining leave" value={formatHours(selectedStaff.remainingHours)} />
            <StaffFact label="Monthly cost" value={formatMoney(selectedStaff.monthlyCost)} />
            <StaffFact label="Funding" value={`${selectedStaff.fundingSource || selectedStaff.budget} · ${selectedStaff.fundingPercent || 100}%`} />
            <StaffFact label="Pension" value={selectedStaff.nhsPensionMember ? selectedStaff.pensionScheme : "Not enrolled"} />
            <StaffFact label="Primary room" value={selectedStaff.primaryRoom} />
            <StaffFact label="DBS" value={selectedStaff.dbsStatus} />
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
              <p>{formatHours(selectedWeeklyHours)} per week. This drives leave, cover warnings, rota rules and room allocation.</p>
            </div>
            <StaffPatternEditor
              pattern={profileForm.workingPattern}
              setPattern={setProfilePattern}
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
            <Button type="button" variant="secondary" onClick={resetWorkforceProfiles}>Reset workforce demo</Button>
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
              { key: "date", label: "Date" },
              { key: "hours", label: "Hours" },
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
              if (key === "date") return formatDate(row.date);
              if (key === "hours") return `${row.hours} hrs`;
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

              <FormField label="Date">
                <input className={fieldClassName} type="date" value={newRequestDate} onChange={(event) => setNewRequestDate(event.target.value)} />
              </FormField>

              <FormField label="Hours">
                <input className={fieldClassName} type="number" min="0" step="0.5" value={newRequestHours} onChange={(event) => setNewRequestHours(event.target.value)} />
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

            <div className="cover-preview-card">
              <div><ShieldCheck size={20} /><strong>Operational preview</strong></div>
              <Badge>{newRequestCoverPreview.riskLabel}</Badge>
              <p>{formatDate(newRequestDate)} · {newRequestCoverPreview.day} · {newRequestCoverPreview.availableStaff.length} staff available after this request.</p>
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
          <SectionHeader eyebrow="Rooms" title={`Room allocation preview · ${formatDate(newRequestDate)}`}>
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
            { key: "date", label: "Date" },
            { key: "hours", label: "Hours" },
            { key: "reason", label: "Reason" },
            { key: "status", label: "Status" },
          ]}
          rows={selectedStaffRequests}
          emptyTitle="No leave history"
          emptyMessage="This staff member has no leave requests recorded yet."
          renderCell={(row, key) => {
            if (key === "date") return formatDate(row.date);
            if (key === "hours") return `${row.hours} hrs`;
            if (key === "status") return <Badge>{row.status}</Badge>;
            return row[key];
          }}
        />
      </Panel>
    </>
  );
}
