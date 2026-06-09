import { staff } from "../data/staff";
import { trainingCourses, trainingRecords } from "../data/training";
import { daysUntil } from "../utils/dateUtils";
import { SETTINGS_STORAGE_KEYS } from "./settingsService";

export const TRAINING_COURSES_STORAGE_KEY = SETTINGS_STORAGE_KEYS.trainingCourses;
export const TRAINING_RECORDS_STORAGE_KEY = SETTINGS_STORAGE_KEYS.trainingRecords;

const DEFAULT_EVIDENCE = "No evidence uploaded";

export function getDefaultTrainingCourses() {
  return trainingCourses;
}

export function getDefaultTrainingRecords() {
  return trainingRecords;
}

export function getSafeTrainingCourses(courses) {
  return Array.isArray(courses) && courses.length > 0 ? courses : trainingCourses;
}

export function getSafeTrainingRecords(records) {
  return Array.isArray(records) ? records : trainingRecords;
}

export function getRecordCourse(record, courses = trainingCourses) {
  return getSafeTrainingCourses(courses).find((course) => course.id === record.courseId);
}

export function getTrainingStatus(expiryDate, currentStatus) {
  if (currentStatus === "Not assigned") return currentStatus;
  if (!expiryDate) return "Not assigned";

  const remaining = daysUntil(expiryDate);
  if (remaining < 0) return "Overdue";
  if (remaining <= 60) return "Due soon";
  return "Complete";
}

export function addMonths(dateString, months) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setMonth(date.getMonth() + Number(months || 12));
  return date.toISOString().slice(0, 10);
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function enrichTrainingRecords(records = trainingRecords, courses = trainingCourses) {
  const safeRecords = getSafeTrainingRecords(records);
  const safeCourses = getSafeTrainingCourses(courses);

  return safeRecords.map((record) => {
    const course = getRecordCourse(record, safeCourses);
    const computedStatus = getTrainingStatus(record.expiryDate, record.status);

    return {
      ...record,
      courseName: course?.name || "Unknown course",
      category: course?.category || "Unknown",
      risk: course?.risk || "Medium",
      owner: course?.owner || "Practice Manager",
      renewalMonths: course?.renewalMonths || 12,
      status: computedStatus,
      daysUntilExpiry: record.expiryDate ? daysUntil(record.expiryDate) : null,
      evidence: record.evidence || DEFAULT_EVIDENCE,
    };
  });
}

export function filterTrainingRecords(records, searchTerm, statusFilter) {
  const safeRecords = Array.isArray(records) ? records : [];
  const safeSearchTerm = String(searchTerm || "").toLowerCase();

  return safeRecords.filter((record) => {
    const searchText = `${record.staffName || ""} ${record.role || ""} ${
      record.courseName || ""
    } ${record.category || ""} ${record.evidence || ""}`.toLowerCase();

    const matchesSearch = searchText.includes(safeSearchTerm);
    const matchesStatus = statusFilter === "All" || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

export function getTrainingCourseById(courseId, courses = trainingCourses) {
  const safeCourses = getSafeTrainingCourses(courses);

  return safeCourses.find((course) => String(course.id) === String(courseId)) || safeCourses[0];
}

export function getTrainingMetrics(records = trainingRecords, courses = trainingCourses, staffList = staff) {
  const safeCourses = getSafeTrainingCourses(courses);
  const enrichedRecords = enrichTrainingRecords(records, safeCourses);
  const missingAssignments = getAllMissingTrainingAssignments(safeCourses, records, staffList);

  const overdueRecords = enrichedRecords.filter((record) => record.status === "Overdue");
  const dueSoonRecords = enrichedRecords.filter((record) => record.status === "Due soon");
  const completeRecords = enrichedRecords.filter((record) => record.status === "Complete");
  const highRiskOverdueRecords = enrichedRecords.filter(
    (record) => record.status === "Overdue" && record.risk === "High"
  );

  const requiredTotal = enrichedRecords.length + missingAssignments.length;
  const completionRate = requiredTotal > 0 ? Math.round((completeRecords.length / requiredTotal) * 100) : 0;

  return {
    enrichedRecords,
    overdueRecords,
    dueSoonRecords,
    completeRecords,
    highRiskOverdueRecords,
    missingAssignments,
    completionRate,
    requiredTotal,
  };
}

export function getRecordsForCourse(records, courseId, courses = trainingCourses) {
  const enrichedRecords = enrichTrainingRecords(records, courses);

  return enrichedRecords.filter((record) => String(record.courseId) === String(courseId));
}

export function getMissingTrainingAssignments(selectedCourse, records, staffList = staff) {
  if (!selectedCourse) return [];

  const safeRecords = getSafeTrainingRecords(records);

  return staffList
    .filter((person) => selectedCourse.requiredFor.includes(person.role))
    .map((person) => {
      const hasRecord = safeRecords.some(
        (record) => record.staffName === person.name && String(record.courseId) === String(selectedCourse.id)
      );

      return {
        ...person,
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        risk: selectedCourse.risk,
        owner: selectedCourse.owner,
        hasRecord,
        status: hasRecord ? "Assigned" : "Missing",
        detail: hasRecord ? "Training record exists" : "No training record found",
      };
    })
    .filter((person) => !person.hasRecord);
}

export function getAllMissingTrainingAssignments(courses, records, staffList = staff) {
  return getSafeTrainingCourses(courses).flatMap((course) =>
    getMissingTrainingAssignments(course, records, staffList)
  );
}

export function createTrainingCourse({
  name,
  category,
  requiredFor,
  renewalMonths,
  owner,
  risk,
  description,
}) {
  return {
    id: `course-${Date.now()}`,
    name: name || "New training course",
    category: category || "General",
    requiredFor: Array.isArray(requiredFor) && requiredFor.length > 0 ? requiredFor : ["Practice Manager"],
    renewalMonths: Number(renewalMonths || 12),
    owner: owner || "Practice Manager",
    risk: risk || "Medium",
    status: "Active",
    description: description || "Locally configured training course.",
  };
}

export function addTrainingCourse(courses, newCourse) {
  return [newCourse, ...getSafeTrainingCourses(courses)];
}

export function createTrainingRecord({
  staffName,
  role,
  courseId,
  status = "Assigned",
  completedDate = "",
  expiryDate = "",
  evidence = DEFAULT_EVIDENCE,
}) {
  return {
    id: `training-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    staffName,
    role,
    courseId,
    status,
    completedDate,
    expiryDate,
    evidence,
  };
}

export function addTrainingRecord(records, newRecord) {
  const safeRecords = getSafeTrainingRecords(records);
  const alreadyExists = safeRecords.some(
    (record) => record.staffName === newRecord.staffName && String(record.courseId) === String(newRecord.courseId)
  );

  if (alreadyExists) return safeRecords;
  return [newRecord, ...safeRecords];
}

export function completeTrainingRecord(records, recordId, course) {
  const completionDate = todayIso();
  const expiryDate = addMonths(completionDate, course?.renewalMonths || 12);

  return getSafeTrainingRecords(records).map((record) =>
    String(record.id) === String(recordId)
      ? {
          ...record,
          status: "Complete",
          completedDate: completionDate,
          expiryDate,
          evidence: "Completion recorded in GPOP",
        }
      : record
  );
}

export function reopenTrainingRecord(records, recordId) {
  return getSafeTrainingRecords(records).map((record) =>
    String(record.id) === String(recordId)
      ? {
          ...record,
          status: "Overdue",
          evidence: "Reopened for follow-up",
        }
      : record
  );
}

export function assignMissingTraining(records, missingAssignment) {
  const assignedRecord = createTrainingRecord({
    staffName: missingAssignment.name,
    role: missingAssignment.role,
    courseId: missingAssignment.courseId,
    status: "Overdue",
    completedDate: "",
    expiryDate: todayIso(),
    evidence: "Assigned by GPOP",
  });

  return addTrainingRecord(records, assignedRecord);
}

export function resetTrainingDemoData() {
  return {
    courses: getDefaultTrainingCourses(),
    records: getDefaultTrainingRecords(),
  };
}
