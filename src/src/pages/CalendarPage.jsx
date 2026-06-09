import { useMemo } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { DataTable } from "../components/DataTable";

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
  AlertBanner,
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

export function CalendarPage({ holidayRequests = [], staffList = baseStaff }) {
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

  return (
    <>
      <PageHeader eyebrow="Calendar" title="Calendar and leave cover overlay">
        Calendar view showing leave requests against role-based cover rules. This
        is now a working cover-checker prototype, not just a static rota note.
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
          title="Unsafe dates"
          value={coverMetrics.unsafeDates.length}
          detail="Medium/high cover warnings"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Calendar mode"
          value="Cover v1"
          detail="Role-based minimum cover"
          icon={CalendarDays}
        />
      </section>

      {coverMetrics.unsafeDates.length > 0 ? (
        <AlertBanner
          tone="warning"
          title="Cover warnings found"
          icon={AlertTriangle}
        >
          {coverMetrics.unsafeDates.length} date
          {coverMetrics.unsafeDates.length === 1 ? " has" : "s have"} minimum-cover
          warnings based on approved leave and the current staff patterns.
        </AlertBanner>
      ) : (
        <AlertBanner tone="success" title="Cover checker active" icon={ShieldCheck}>
          No medium/high cover warnings are currently showing for the displayed
          dates. Pending leave still needs manager review before approval.
        </AlertBanner>
      )}

      <section className="content-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Cover view" title="Leave and minimum-cover checker">
            This checks the displayed dates against GP/clinical, nursing,
            reception, dispensary and management cover rules.
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
          Staff are assigned to primary or secondary rooms by role priority, with
          blocked rooms and approved leave removed.
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
