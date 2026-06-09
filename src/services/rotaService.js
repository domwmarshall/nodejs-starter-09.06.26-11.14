import { demoShifts, rooms, rotaRules, shiftTemplates } from "../data/rota";

export function getDefaultRooms() {
  return rooms;
}

export function getDefaultShiftTemplates() {
  return shiftTemplates;
}

export function getDefaultShifts() {
  return demoShifts;
}

export function getDefaultRotaRules() {
  return rotaRules;
}

export function getShiftsForDate(shifts = demoShifts, date) {
  return (Array.isArray(shifts) ? shifts : demoShifts).filter((shift) => shift.date === date);
}

export function getRotaDates(shifts = demoShifts) {
  return [...new Set((Array.isArray(shifts) ? shifts : demoShifts).map((shift) => shift.date))].sort();
}

export function moveShift(shifts = demoShifts, shiftId, changes) {
  return (Array.isArray(shifts) ? shifts : demoShifts).map((shift) =>
    shift.id === shiftId ? { ...shift, ...changes, updatedAt: new Date().toISOString() } : shift
  );
}

export function getRoomById(roomId) {
  return rooms.find((room) => room.id === roomId) || rooms[0];
}

export function getRoleColourClass(role = "") {
  const text = role.toLowerCase();
  if (text.includes("gp") || text.includes("registrar") || text.includes("anp")) return "role-clinician";
  if (text.includes("nurse") || text.includes("hca")) return "role-nursing";
  if (text.includes("dispens")) return "role-dispensary";
  if (text.includes("reception") || text.includes("navigator")) return "role-reception";
  return "role-admin";
}
