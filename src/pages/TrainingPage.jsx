import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  GraduationCap,
  PlusCircle,
  Search,
  UserCheck,
} from "lucide-react";

import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { DataTable } from "../components/DataTable";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { formatDate } from "../utils/dateUtils";

import { staff as baseStaff } from "../data/staff";

import {
  TRAINING_COURSES_STORAGE_KEY,
  TRAINING_RECORDS_STORAGE_KEY,
  addTrainingCourse,
  assignMissingTraining,
  completeTrainingRecord,
  createTrainingCourse,
  createTrainingRecord,
  enrichTrainingRecords,
  filterTrainingRecords,
  getDefaultTrainingCourses,
  getDefaultTrainingRecords,
  getMissingTrainingAssignments,
  getRecordsForCourse,
  getSafeTrainingCourses,
  getSafeTrainingRecords,
  getTrainingCourseById,
  getTrainingMetrics,
  reopenTrainingRecord,
  resetTrainingDemoData,
  addTrainingRecord,
} from "../services/trainingService";

import {
  AlertBanner,
  Button,
  FormField,
  PageHeader,
  Panel,
  fieldClassName,
} from "../components/ui";

const ROLE_OPTIONS = [
  "GP",
  "Practice Nurse",
  "Reception / Care Navigator",
  "Practice Manager",
  "Dispenser",
  "Pharmacist",
];

export function TrainingPage({ staffList = baseStaff }) {
  const [courses, setCourses] = useLocalStorageState(
    TRAINING_COURSES_STORAGE_KEY,
    getDefaultTrainingCourses()
  );
  const [records, setRecords] = useLocalStorageState(
    TRAINING_RECORDS_STORAGE_KEY,
    getDefaultTrainingRecords()
  );

  const safeCourses = useMemo(() => getSafeTrainingCourses(courses), [courses]);
  const safeRecords = useMemo(() => getSafeTrainingRecords(records), [records]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCourseId, setSelectedCourseId] = useState(safeCourses[0].id);

  const [newCourseName, setNewCourseName] = useState("Chaperone training");
  const [newCourseCategory, setNewCourseCategory] = useState("Clinical governance");
  const [newCourseOwner, setNewCourseOwner] = useState("Practice Manager");
  const [newCourseRisk, setNewCourseRisk] = useState("Medium");
  const [newCourseRenewal, setNewCourseRenewal] = useState(12);
  const [newCourseDescription, setNewCourseDescription] = useState(
    "Local training requirement with role-based assignment."
  );
  const [newCourseRoles, setNewCourseRoles] = useState([
    "Practice Nurse",
    "Reception / Care Navigator",
  ]);

  const [assignStaffName, setAssignStaffName] = useState(staffList[0]?.name || "");
  const [assignCourseId, setAssignCourseId] = useState(safeCourses[0].id);

  const enrichedRecords = useMemo(
    () => enrichTrainingRecords(safeRecords, safeCourses),
    [safeRecords, safeCourses]
  );

  const filteredRecords = useMemo(
    () => filterTrainingRecords(enrichedRecords, searchTerm, statusFilter),
    [enrichedRecords, searchTerm, statusFilter]
  );

  const selectedCourse = useMemo(
    () => getTrainingCourseById(selectedCourseId, safeCourses),
    [selectedCourseId, safeCourses]
  );

  const selectedCourseRecords = useMemo(
    () => getRecordsForCourse(safeRecords, selectedCourse.id, safeCourses),
    [safeRecords, safeCourses, selectedCourse.id]
  );

  const metrics = useMemo(
    () => getTrainingMetrics(safeRecords, safeCourses, staffList),
    [safeRecords, safeCourses, staffList]
  );

  const missingAssignments = useMemo(
    () => getMissingTrainingAssignments(selectedCourse, safeRecords, staffList),
    [selectedCourse, safeRecords, staffList]
  );

  function toggleRequiredRole(role) {
    setNewCourseRoles((currentRoles) =>
      currentRoles.includes(role)
        ? currentRoles.filter((item) => item !== role)
        : [...currentRoles, role]
    );
  }

  function submitCourse(event) {
    event.preventDefault();

    const newCourse = createTrainingCourse({
      name: newCourseName,
      category: newCourseCategory,
      requiredFor: newCourseRoles,
      renewalMonths: newCourseRenewal,
      owner: newCourseOwner,
      risk: newCourseRisk,
      description: newCourseDescription,
    });

    setCourses((currentCourses) => addTrainingCourse(currentCourses, newCourse));
    setSelectedCourseId(newCourse.id);
    setAssignCourseId(newCourse.id);
    setNewCourseName("");
  }

  function assignTraining(event) {
    event.preventDefault();

    const person = staffList.find((item) => item.name === assignStaffName) || staffList[0];
    const assignedRecord = createTrainingRecord({
      staffName: person.name,
      role: person.role,
      courseId: assignCourseId,
      status: "Overdue",
      expiryDate: new Date().toISOString().slice(0, 10),
      evidence: "Assigned by GPOP",
    });

    setRecords((currentRecords) => addTrainingRecord(currentRecords, assignedRecord));
  }

  function completeRecord(record) {
    const course = getTrainingCourseById(record.courseId, safeCourses);
    setRecords((currentRecords) => completeTrainingRecord(currentRecords, record.id, course));
  }

  function resetTraining() {
    const confirmed = window.confirm("Reset training courses and records to demo data?");
    if (!confirmed) return;

    const resetData = resetTrainingDemoData();
    setCourses(resetData.courses);
    setRecords(resetData.records);
    setSelectedCourseId(resetData.courses[0].id);
  }

  return (
    <>
      <PageHeader eyebrow="Training" title="Training engine">
        Role-based training assignment, renewal tracking, missing-assignment
        detection and persistent training records.
      </PageHeader>

      <section className="metric-grid">
        <MetricCard
          title="Courses"
          value={safeCourses.length}
          detail="Configurable course library"
          icon={GraduationCap}
        />
        <MetricCard
          title="Overdue"
          value={metrics.overdueRecords.length}
          detail="Training records expired"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Due soon"
          value={metrics.dueSoonRecords.length}
          detail="Renewals approaching"
          icon={Clock}
        />
        <MetricCard
          title="Completion"
          value={`${metrics.completionRate}%`}
          detail={`${metrics.missingAssignments.length} missing assignment(s)`}
          icon={CheckCircle2}
        />
      </section>

      {metrics.highRiskOverdueRecords.length > 0 ? (
        <AlertBanner tone="danger" title="High-risk overdue training" icon={AlertTriangle}>
          {metrics.highRiskOverdueRecords.length} high-risk training record
          {metrics.highRiskOverdueRecords.length === 1 ? " is" : "s are"} overdue and
          should be escalated.
        </AlertBanner>
      ) : null}

      <section className="content-grid">
        <Panel className="panel panel-large">
          <SectionHeader eyebrow="Training matrix" title="Staff training records">
            Search, filter and complete training records. These records now
            persist in browser storage and drive Dashboard/Inbox alerts.
          </SectionHeader>

          <div className="compliance-toolbar">
            <label className="search-input">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search staff, courses, roles..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <label className="filter-select">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option>All</option>
                <option>Complete</option>
                <option>Due soon</option>
                <option>Overdue</option>
                <option>Not assigned</option>
              </select>
            </label>
          </div>

          <DataTable
            columns={[
              { key: "staffName", label: "Staff member" },
              { key: "role", label: "Role" },
              { key: "courseName", label: "Course" },
              { key: "expiryDate", label: "Expiry" },
              { key: "status", label: "Status" },
              { key: "risk", label: "Risk" },
              { key: "evidence", label: "Evidence" },
              { key: "actions", label: "Actions" },
            ]}
            rows={filteredRecords}
            emptyTitle="No training records found"
            emptyMessage="Try clearing the search box or changing the status filter."
            renderCell={(row, key) => {
              if (key === "staffName") return <strong>{row.staffName}</strong>;

              if (key === "courseName") {
                return (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-button"
                    style={{ padding: 0, justifyContent: "flex-start" }}
                    onClick={() => setSelectedCourseId(row.courseId)}
                  >
                    {row.courseName}
                  </Button>
                );
              }

              if (key === "expiryDate") {
                return row.expiryDate ? (
                  <div className="stacked-cell">
                    <strong>{formatDate(row.expiryDate)}</strong>
                    <span>
                      {row.daysUntilExpiry < 0
                        ? `${Math.abs(row.daysUntilExpiry)} days overdue`
                        : `${row.daysUntilExpiry} days remaining`}
                    </span>
                  </div>
                ) : (
                  <span className="muted-text">Not completed</span>
                );
              }

              if (key === "status") return <Badge>{row.status}</Badge>;
              if (key === "risk") return <Badge>{row.risk} risk</Badge>;

              if (key === "actions") {
                return (
                  <div className="action-buttons">
                    <Button type="button" size="sm" variant="primary" onClick={() => completeRecord(row)}>
                      Complete
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setRecords((currentRecords) => reopenTrainingRecord(currentRecords, row.id))}
                    >
                      Reopen
                    </Button>
                  </div>
                );
              }

              return row[key];
            }}
          />
        </Panel>

        <Panel as="aside" className="panel policy-detail-panel">
          <SectionHeader eyebrow="Selected course" title={selectedCourse.name}>
            {selectedCourse.description}
          </SectionHeader>

          <div className="policy-detail-grid">
            <div>
              <span>Category</span>
              <strong>{selectedCourse.category}</strong>
            </div>
            <div>
              <span>Owner</span>
              <strong>{selectedCourse.owner}</strong>
            </div>
            <div>
              <span>Renewal cycle</span>
              <strong>{selectedCourse.renewalMonths} months</strong>
            </div>
            <div>
              <span>Risk</span>
              <Badge>{selectedCourse.risk} risk</Badge>
            </div>
            <div>
              <span>Status</span>
              <Badge>{selectedCourse.status}</Badge>
            </div>
            <div>
              <span>Assigned records</span>
              <strong>{selectedCourseRecords.length}</strong>
            </div>
          </div>

          <div className="training-role-box">
            <strong>Required for roles</strong>
            <div className="role-chip-list">
              {selectedCourse.requiredFor.map((role) => (
                <span className="role-chip" key={role}>
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="policy-actions">
            <Button type="button" variant="secondary" onClick={resetTraining}>
              Reset training demo data
            </Button>
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel className="panel">
          <SectionHeader eyebrow="Course builder" title="Add mandatory course">
            Create a local course and define which roles require it.
          </SectionHeader>

          <form className="audit-submit-form" onSubmit={submitCourse}>
            <FormField label="Course name">
              <input
                className={fieldClassName}
                value={newCourseName}
                onChange={(event) => setNewCourseName(event.target.value)}
              />
            </FormField>
            <FormField label="Category">
              <input
                className={fieldClassName}
                value={newCourseCategory}
                onChange={(event) => setNewCourseCategory(event.target.value)}
              />
            </FormField>
            <FormField label="Owner">
              <input
                className={fieldClassName}
                value={newCourseOwner}
                onChange={(event) => setNewCourseOwner(event.target.value)}
              />
            </FormField>
            <FormField label="Risk">
              <select className={fieldClassName} value={newCourseRisk} onChange={(event) => setNewCourseRisk(event.target.value)}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </FormField>
            <FormField label="Renewal months">
              <input
                className={fieldClassName}
                type="number"
                min="1"
                value={newCourseRenewal}
                onChange={(event) => setNewCourseRenewal(event.target.value)}
              />
            </FormField>
            <FormField label="Description">
              <textarea
                className={fieldClassName}
                value={newCourseDescription}
                onChange={(event) => setNewCourseDescription(event.target.value)}
              />
            </FormField>

            <div className="training-role-box">
              <strong>Required roles</strong>
              <div className="role-chip-list">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={newCourseRoles.includes(role) ? "role-chip role-chip-active" : "role-chip"}
                    onClick={() => toggleRequiredRole(role)}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" variant="primary" leftIcon={PlusCircle}>
              Add course
            </Button>
          </form>
        </Panel>

        <Panel className="panel">
          <SectionHeader eyebrow="Assign" title="Assign training manually">
            Add a record for a staff member and course.
          </SectionHeader>

          <form className="audit-submit-form" onSubmit={assignTraining}>
            <FormField label="Staff member">
              <select className={fieldClassName} value={assignStaffName} onChange={(event) => setAssignStaffName(event.target.value)}>
                {staffList.map((person) => (
                  <option key={person.name}>{person.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Course">
              <select className={fieldClassName} value={assignCourseId} onChange={(event) => setAssignCourseId(event.target.value)}>
                {safeCourses.map((course) => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </FormField>
            <Button type="submit" variant="primary" leftIcon={UserCheck}>
              Assign training
            </Button>
          </form>

          <div className="governance-alert-grid dashboard-section-spacing">
            {missingAssignments.slice(0, 6).map((person) => (
              <div className="governance-alert" key={`${person.name}-${person.courseId}`}>
                <div>
                  <strong>{person.name}</strong>
                  <span>{person.role} · {person.detail}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setRecords((currentRecords) => assignMissingTraining(currentRecords, person))}
                >
                  Assign
                </Button>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel className="panel">
        <SectionHeader eyebrow="Training alerts" title="What needs attention">
          Overdue, due-soon and missing assignments now generate operational alerts.
        </SectionHeader>

        <div className="governance-alert-grid">
          {[...metrics.overdueRecords, ...metrics.dueSoonRecords].map((record) => (
            <div className="governance-alert" key={record.id}>
              <div>
                <strong>{record.staffName}</strong>
                <span>
                  {record.courseName} · {record.status} · expires {formatDate(record.expiryDate)}
                </span>
              </div>
              <Badge>{record.status}</Badge>
            </div>
          ))}

          {metrics.missingAssignments.slice(0, 8).map((person) => (
            <div className="governance-alert" key={`missing-${person.name}-${person.courseId}`}>
              <div>
                <strong>{person.name}</strong>
                <span>{person.courseName} · missing for {person.role}</span>
              </div>
              <Badge>Missing</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
