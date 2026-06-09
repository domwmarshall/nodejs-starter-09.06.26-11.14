import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { DataTable } from "../components/DataTable";
import { RotaGrid } from "../components/calendar/RotaGrid";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

import { staff as baseStaff } from "../data/staff";

import {
  getHolidayRequestMetrics,
  getLeaveCalendarRows,
} from "../services/staffService";

import {
  getCoverMetrics,
  getCoverSnapshotsForDates,
} from "../services/coverService";

import { getRoomScheduleForDate } from "../services/workforceService";

import {
  getDefaultRooms,
  getDefaultShifts,
  getRotaDates,
  getShiftsForDate,
  moveShift,
} from "../services/rotaService";
import { getRotaAlertMetrics, getRotaAlertsForDate } from "../services/rotaAlertService";
import { suggestShiftFill } from "../services/shiftFillerService";
import { SETTINGS_STORAGE_KEYS } from "../services/settingsService";
import { logActivity } from "../services/activityLogService";

import {
  AlertBanner,
  Button,
  PageHeader,
  Panel,
} from "../components/ui";

const defaultCalendarDates = [
  "2026-07-06",
  "2026-07-07",
  "2026-07-08",
  "2026-07-09",
  "2026-07-10",
];

function getCalendarDates(holidayRequests) {
  const requestDates = Array.isArray(holidayRequests)
    ? holidayRequests.map((request) => request.date).filter(Boolean)
    : [];

  return [...new Set([...defaultCalendarDates, ...requestDates])].sort();
}

function formatDateChip(date) {
  const parsed = new Date(date);
  return {
    day: parsed.toLocaleDateString("en-GB", { weekday: "short" }),
    label: parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
  };
}

export function CalendarPage({ holidayRequests = [], staffList = baseStaff, currentUser }) {
  const rooms = getDefaultRooms();
  const [shifts, setShifts] = useLocalStorageState(SETTINGS_STORAGE_KEYS.rotaShifts, getDefaultShifts());
  const [selectedDate, setSelectedDate] = useState(getRotaDates(shifts)[0] || defaultCalendarDates[0]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [rotaMessage, setRotaMessage] = useState("");

  const safeShifts = Array.isArray(shifts) && shifts.length ? shifts : getDefaultShifts();
  const rotaDates = useMemo(() => getRotaDates(safeShifts), [safeShifts]);
  const selectedDateShifts = useMemo(() => getShiftsForDate(safeShifts, selectedDate), [safeShifts, selectedDate]);
  const rotaAlerts = useMemo(
    () => getRotaAlertsForDate({ date: selectedDate, shifts: selectedDateShifts, staffList }),
    [selectedDate, selectedDateShifts, staffList]
  );
  const rotaAlertMetrics = useMemo(() => getRotaAlertMetrics(rotaAlerts), [rotaAlerts]);
  const selectedShiftSuggestion = useMemo(
    () => selectedShift ? suggestShiftFill({ shift: selectedShift, staffList }) : null,
    [selectedShift, staffList]
  );

  const metrics = useMemo(
    () => getHolidayRequestMetrics(holidayRequests),
    [holidayRequests]
  );

  const coverMetrics = useMemo(
    () => getCoverMetrics({ requests: holidayRequests, staffList }),
    [holidayRequests, staffList]
  );

  const leaveCalendarRows = useMemo(
    () => getLeaveCalendarRows(holidayRequests),
    [holidayRequests]
  );

  const weekRows = useMemo(
    () =>
      getCoverSnapshotsForDates({
        dates: getCalendarDates(holidayRequests),
        staffList,
        requests: holidayRequests,
      }),
    [holidayRequests, staffList]
  );

  const roomRows = useMemo(
    () =>
      weekRows.map((snapshot) => {
        const roomSchedule = getRoomScheduleForDate({
          profiles: staffList,
          requests: holidayRequests,
          date: snapshot.date,
        });

        return {
          ...snapshot,
          roomSchedule,
          roomConflictCount: roomSchedule.conflicts.length,
          roomAssignedCount: roomSchedule.assignments.length,
        };
      }),
    [weekRows, staffList, holidayRequests]
  );

  function handleDropShift(shiftId, roomId) {
    const shift = safeShifts.find((item) => item.id === shiftId);
    setShifts((currentShifts) => moveShift(currentShifts, shiftId, { roomId }));
    const room = rooms.find((item) => item.id === roomId);
    setRotaMessage(`${shift?.staffName || "Shift"} moved to ${room?.name || "selected room"}.`);

    void logActivity({
      eventType: "rota_shift_room_changed",
      module: "Rota",
      title: "Shift room changed",
      detail: `${shift?.title || shift?.role || shiftId} moved to ${room?.name || roomId}.`,
      actorName: currentUser?.name || "Workspace user",
      actorRole: currentUser?.role || "Unknown role",
      metadata: { shiftId, roomId, date: selectedDate },
    });
  }

  function applyFirstSuggestion() {
    if (!selectedShift || !selectedShiftSuggestion?.suggestedStaff?.length) return;
    const staffName = selectedShiftSuggestion.suggestedStaff[0];
    setShifts((currentShifts) => moveShift(currentShifts, selectedShift.id, { staffName, status: "Assigned" }));
    setSelectedShift((current) => current ? { ...current, staffName, status: "Assigned" } : current);
    setRotaMessage(`${staffName} assigned to ${selectedShift.title || selectedShift.role}.`);

    void logActivity({
      eventType: "rota_shift_filler_applied",
      module: "Rota",
      title: "Shift filler suggestion applied",
      detail: `${staffName} assigned to ${selectedShift.title || selectedShift.role}.`,
      actorName: currentUser?.name || "Workspace user",
      actorRole: currentUser?.role || "Unknown role",
      metadata: { shiftId: selectedShift.id, staffName, date: selectedDate, confidence: selectedShiftSuggestion.confidence },
    });
  }

  function resetRota() {
    setShifts(getDefaultShifts());
    setSelectedShift(null);
    setSelectedDate(getRotaDates(getDefaultShifts())[0]);
    setRotaMessage("Rota reset to the demo v6.0 foundation data.");
  }

  return (
    <>
      <PageHeader eyebrow="Rota" title="Calendar, rooms and missing-shift command centre">
        Rota view showing room allocation, drag/drop-ready shift cards, missing shifts, shift filler suggestions and leave cover checks.
      </PageHeader>

      <section className="metric-grid">
        <MetricCard
          title="Approved leave"
          value={metrics.approvedRequests.length}
          detail={`${metrics.totalApprovedHours} approved hours`}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Pending leave"
          value={metrics.pendingRequests.length}
          detail={`${metrics.totalPendingHours} pending hours`}
          icon={Clock}
        />
        <MetricCard
          title="Missing shifts"
          value={rotaAlertMetrics.high}
          detail={`${rotaAlertMetrics.total} rota alert(s) today`}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Rota mode"
          value="v6.0"
          detail="Shift filler foundation"
          icon={CalendarDays}
        />
      </section>

      {coverMetrics.unsafeDates.length > 0 || rotaAlerts.length > 0 ? (
        <AlertBanner
          tone="warning"
          title="Rota and cover warnings found"
          icon={AlertTriangle}
        >
          {coverMetrics.unsafeDates.length} date{coverMetrics.unsafeDates.length === 1 ? " has" : "s have"} minimum-cover warnings and {rotaAlerts.length} rota alert{rotaAlerts.length === 1 ? " is" : "s are"} showing for the selected day.
        </AlertBanner>
      ) : (
        <AlertBanner tone="success" title="Cover checker active" icon={ShieldCheck}>
          No medium/high cover warnings are currently showing for the displayed dates. Pending leave still needs manager review before approval.
        </AlertBanner>
      )}

      <section className="content-grid rota-command-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Rota foundation" title="Room View / Workforce View / Master Rota View">
            Select a day, drag shift cards between rooms and review missing-shift alerts before they feed the Dashboard and Inbox.
          </SectionHeader>

          <div className="calendar-date-strip">
            {rotaDates.map((date) => {
              const chip = formatDateChip(date);
              return (
                <button key={date} type="button" className={date === selectedDate ? "date-chip date-chip-active" : "date-chip"} onClick={() => { setSelectedDate(date); setSelectedShift(null); }}>
                  <span>{chip.day}</span>
                  <strong>{chip.label}</strong>
                </button>
              );
            })}
          </div>

          <RotaGrid
            date={selectedDate}
            rooms={rooms}
            shifts={selectedDateShifts}
            staffList={staffList}
            onDropShift={handleDropShift}
            onSelectShift={setSelectedShift}
          />
          {rotaMessage ? <p className="request-preview">{rotaMessage}</p> : null}
        </Panel>

        <Panel as="aside" className="panel">
          <SectionHeader eyebrow="Missing shifts" title="Side rail alerts">
            High-risk gaps should become dashboard and inbox alerts, especially duty GP, reception and dispensary cover.
          </SectionHeader>

          <div className="governance-alert-grid">
            {rotaAlerts.length ? rotaAlerts.map((alert) => (
              <div className="governance-alert" key={alert.id}>
                <div><strong>{alert.title}</strong><span>{alert.detail}</span></div>
                <Badge>{alert.severity}</Badge>
              </div>
            )) : <div className="premium-empty-state"><CheckCircle2 size={18} /><div><strong>No rota alerts</strong><span>Selected day has no generated gaps.</span></div></div>}
          </div>
        </Panel>
      </section>

      <section className="content-grid rota-detail-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Shift details" title={selectedShift ? `${selectedShift.title || selectedShift.role}` : "Select a shift"}>
            Click a shift card to see fill suggestions and room details.
          </SectionHeader>

          {selectedShift ? (
            <div className="settings-profile-grid">
              <div><span>Staff</span><strong>{selectedShift.staffName}</strong></div>
              <div><span>Role</span><strong>{selectedShift.role}</strong></div>
              <div><span>Time</span><strong>{selectedShift.start}-{selectedShift.end}</strong></div>
              <div><span>Status</span><Badge>{selectedShift.status}</Badge></div>
              <div><span>Room</span><strong>{rooms.find((room) => room.id === selectedShift.roomId)?.name || "Not set"}</strong></div>
              <div><span>Confidence</span><Badge>{selectedShiftSuggestion?.confidence || "Not checked"}</Badge></div>
            </div>
          ) : (
            <div className="premium-empty-state"><MousePointer2 size={18} /><div><strong>No shift selected</strong><span>Click a card in the rota grid.</span></div></div>
          )}
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Shift filler" title="Suggested cover">
            Suggestions exclude nothing yet beyond role matching; manager confirmation is still required before applying.
          </SectionHeader>

          {selectedShiftSuggestion ? (
            <>
              <div className="governance-alert-grid">
                <div className="governance-alert"><div><strong>Suggested staff</strong><span>{selectedShiftSuggestion.suggestedStaff.length ? selectedShiftSuggestion.suggestedStaff.join(", ") : "No obvious role match"}</span></div><Badge>{selectedShiftSuggestion.confidence}</Badge></div>
                <div className="governance-alert"><div><strong>Primary room</strong><span>{selectedShiftSuggestion.primaryRoom || "Not set"}</span></div><Badge>Room</Badge></div>
                <div className="governance-alert"><div><strong>Other rooms</strong><span>{selectedShiftSuggestion.secondaryRooms.length ? selectedShiftSuggestion.secondaryRooms.join(", ") : "None suggested"}</span></div><Badge>Optional</Badge></div>
              </div>
              <div className="policy-actions">
                <Button type="button" variant="primary" onClick={applyFirstSuggestion} leftIcon={Sparkles} disabled={!selectedShiftSuggestion.suggestedStaff.length}>Apply first suggestion</Button>
                <Button type="button" variant="secondary" onClick={resetRota}>Reset rota</Button>
              </div>
            </>
          ) : (
            <div className="premium-empty-state"><Sparkles size={18} /><div><strong>Waiting for shift</strong><span>Select an unassigned or assigned shift to calculate suggestions.</span></div></div>
          )}
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Cover view" title="Leave and minimum-cover checker">
            This checks the displayed dates against GP/clinical, nursing, reception, dispensary and management cover rules.
          </SectionHeader>

          <DataTable
            columns={[
              { key: "day", label: "Day" },
              { key: "date", label: "Date" },
              { key: "availableSummary", label: "Available cover" },
              { key: "approvedLeave", label: "Approved leave" },
              { key: "pendingLeave", label: "Pending leave" },
              { key: "riskLabel", label: "Cover status" },
            ]}
            rows={weekRows}
            renderCell={(row, key) => {
              if (key === "day") return <strong>{row.day}</strong>;
              if (key === "date") return row.formattedDate;

              if (key === "availableSummary") {
                return (
                  <div className="stacked-cell">
                    {row.availableSummary
                      .filter((item) => item.required > 0)
                      .map((item) => (
                        <span key={item.teamId}>
                          {item.label}: {item.available}/{item.required}
                        </span>
                      ))}
                  </div>
                );
              }

              if (key === "approvedLeave" || key === "pendingLeave") {
                const leaveRows = row[key];

                if (leaveRows.length === 0) {
                  return <span className="muted-text">None</span>;
                }

                return (
                  <div className="stacked-cell">
                    {leaveRows.map((leave) => (
                      <span key={`${key}-${leave.id}`}>
                        {leave.staffName} · {leave.hours} hrs
                      </span>
                    ))}
                  </div>
                );
              }

              if (key === "riskLabel") {
                return (
                  <div className="stacked-cell">
                    <Badge>{row.riskLabel}</Badge>
                    <span>
                      {row.warnings.length > 0
                        ? row.warnings.map((warning) => warning.team).join(", ")
                        : "Minimum cover maintained"}
                    </span>
                  </div>
                );
              }

              return row[key];
            }}
          />
        </Panel>

        <Panel as="aside" className="panel">
          <SectionHeader eyebrow="Cover engine" title="What is checked">
            Current minimum-cover rules are simple and editable later.
          </SectionHeader>

          <div className="settings-mini-list">
            <div>
              <CheckCircle2 size={18} />
              <span>Staff working pattern is checked by date</span>
            </div>
            <div>
              <Users size={18} />
              <span>Approved leave is removed from available cover</span>
            </div>
            <div>
              <Clock size={18} />
              <span>Pending leave is shown separately for review</span>
            </div>
            <div>
              <CalendarDays size={18} />
              <span>Cover warnings feed Staff and Dashboard</span>
            </div>
          </div>
        </Panel>
      </section>

      <Panel className="panel">
        <SectionHeader eyebrow="Rooms" title="Room allocation by day">
          Staff are assigned to primary or secondary rooms by role priority, with blocked rooms and approved leave removed.
        </SectionHeader>

        <DataTable
          columns={[
            { key: "day", label: "Day" },
            { key: "date", label: "Date" },
            { key: "roomAssignedCount", label: "Assigned" },
            { key: "blockedRooms", label: "Blocked rooms" },
            { key: "roomConflictCount", label: "Conflicts" },
            { key: "roomSchedule", label: "Assignments" },
          ]}
          rows={roomRows}
          renderCell={(row, key) => {
            if (key === "day") return <strong>{row.day}</strong>;
            if (key === "date") return row.formattedDate;
            if (key === "roomAssignedCount") return `${row.roomAssignedCount} staff`;
            if (key === "roomConflictCount") return <Badge>{row.roomConflictCount > 0 ? `${row.roomConflictCount} conflict(s)` : "Clear"}</Badge>;
            if (key === "blockedRooms") {
              if (row.roomSchedule.blockedRooms.length === 0) return <span className="muted-text">None</span>;
              return (
                <div className="stacked-cell">
                  {row.roomSchedule.blockedRooms.map((block) => (
                    <span key={block.id}>{block.room} · {block.time}</span>
                  ))}
                </div>
              );
            }
            if (key === "roomSchedule") {
              return (
                <div className="stacked-cell">
                  {row.roomSchedule.assignments.slice(0, 5).map((assignment) => (
                    <span key={`${row.date}-${assignment.staffName}`}>
                      {assignment.staffName} → {assignment.room}
                    </span>
                  ))}
                </div>
              );
            }
            return row[key];
          }}
        />
      </Panel>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Cover warnings" title="Dates needing review">
            Dates where approved leave may leave a role below minimum cover.
          </SectionHeader>

          <div className="governance-alert-grid">
            {coverMetrics.unsafeDates.map((snapshot) => (
              <div className="governance-alert" key={`unsafe-${snapshot.date}`}>
                <div>
                  <strong>
                    {snapshot.day} · {snapshot.formattedDate}
                  </strong>
                  <span>
                    {snapshot.warnings.map((warning) => warning.message).join(" · ")}
                  </span>
                </div>
                <Badge>{snapshot.riskLabel}</Badge>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Leave list" title="All leave requests">
            This list is shared with the Staff page through the staff service layer.
          </SectionHeader>

          <DataTable
            columns={[
              { key: "formattedDate", label: "Date" },
              { key: "staffName", label: "Staff member" },
              { key: "hours", label: "Hours" },
              { key: "reason", label: "Reason" },
              { key: "status", label: "Status" },
            ]}
            rows={leaveCalendarRows}
            emptyTitle="No leave requests"
            emptyMessage="Add leave requests from the Staff page."
            renderCell={(row, key) => {
              if (key === "staffName") return <strong>{row.staffName}</strong>;
              if (key === "hours") return `${row.hours} hrs`;
              if (key === "status") return <Badge>{row.status}</Badge>;
              return row[key];
            }}
          />
        </Panel>
      </section>
    </>
  );
}
