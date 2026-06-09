import { rooms, shiftTemplates } from "../data/rota";

function hasRole(shifts, roleTerms) {
  return shifts.some((shift) => {
    const role = String(shift.role || "").toLowerCase();
    const staff = String(shift.staffName || "").toLowerCase();
    return shift.status !== "Missing" && !staff.includes("unassigned") && roleTerms.some((term) => role.includes(term));
  });
}

function matchingStaff(staffList = [], roleTerms = []) {
  return staffList
    .filter((staff) => {
      const roleText = `${staff.role || ""} ${staff.team || ""} ${staff.jobTitle || ""}`.toLowerCase();
      return roleTerms.some((term) => roleText.includes(term));
    })
    .slice(0, 4)
    .map((staff) => staff.name || staff.staffName);
}

export function getMissingShiftAlerts({ date, shifts = [], staffList = [] }) {
  const alerts = [];

  const checks = [
    { id: "missing-duty-doctor", title: "Missing duty doctor / clinician", severity: "High", roleTerms: ["gp", "doctor", "registrar", "anp"], suggestion: "Assign Dr Moore, Dr Taylor, registrar or ANP cover before opening." },
    { id: "missing-nurse", title: "No nurse/HCA cover", severity: "Medium", roleTerms: ["nurse", "hca"], suggestion: "Assign nurse/HCA clinic or mark the day as reduced service." },
    { id: "missing-dispenser", title: "No dispenser cover", severity: "High", roleTerms: ["dispenser", "pharmacist"], suggestion: "Assign dispenser/pharmacist or trigger dispensary cover plan." },
    { id: "missing-reception", title: "No reception cover", severity: "High", roleTerms: ["reception", "navigator"], suggestion: "Assign reception/care navigator cover." },
  ];

  checks.forEach((check) => {
    if (!hasRole(shifts, check.roleTerms)) {
      alerts.push({
        id: `${check.id}-${date}`,
        date,
        title: check.title,
        severity: check.severity,
        detail: check.suggestion,
        suggestedStaff: matchingStaff(staffList, check.roleTerms),
      });
    }
  });

  shifts.filter((shift) => shift.status === "Missing" || String(shift.staffName).toLowerCase().includes("unassigned")).forEach((shift) => {
    alerts.push({
      id: `unassigned-${shift.id}`,
      date,
      title: `Unassigned ${shift.title || shift.role}`,
      severity: shift.priority || "Medium",
      detail: `${shift.start}-${shift.end} in ${rooms.find((room) => room.id === shift.roomId)?.name || "room not set"}`,
      suggestedStaff: matchingStaff(staffList, [String(shift.role || "").toLowerCase()]),
    });
  });

  return alerts;
}

export function suggestShiftFill({ shift, staffList = [] }) {
  const roleTerm = String(shift.role || "").toLowerCase();
  const suggestedStaff = matchingStaff(staffList, [roleTerm.split(" ")[0]]);
  return {
    shiftId: shift.id,
    suggestedStaff,
    primaryRoom: rooms.find((room) => room.id === shift.roomId)?.name,
    secondaryRooms: rooms.filter((room) => room.id !== shift.roomId && room.priorityRoles.some((role) => role.toLowerCase().includes(roleTerm.split(" ")[0]))).map((room) => room.name),
    confidence: suggestedStaff.length > 0 ? "Medium" : "Low",
    requiresManagerConfirmation: true,
  };
}

export function getRequiredShiftTemplates() {
  return shiftTemplates.filter((template) => template.required);
}
