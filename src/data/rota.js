export const rooms = [
  { id: "room-gp1", name: "GP Room 1", type: "Clinical", capacity: 1, priorityRoles: ["GP Partner", "Salaried GP", "Registrar"] },
  { id: "room-gp2", name: "GP Room 2", type: "Clinical", capacity: 1, priorityRoles: ["GP Partner", "Registrar"] },
  { id: "room-nurse", name: "Nurse Room", type: "Clinical", capacity: 1, priorityRoles: ["Practice Nurse", "HCA"] },
  { id: "room-treatment", name: "Treatment Room", type: "Clinical", capacity: 1, priorityRoles: ["Practice Nurse", "HCA"] },
  { id: "room-dispensary", name: "Dispensary", type: "Dispensary", capacity: 3, priorityRoles: ["Dispenser", "ARRS Pharmacist"] },
  { id: "room-reception", name: "Reception", type: "Front desk", capacity: 2, priorityRoles: ["Reception / Care Navigator"] },
];

export const shiftTemplates = [
  { id: "duty-gp-am", title: "Duty GP AM", role: "GP Partner", start: "08:30", end: "13:00", roomId: "room-gp1", required: true, priority: "High" },
  { id: "duty-gp-pm", title: "Duty GP PM", role: "GP Partner", start: "14:00", end: "18:00", roomId: "room-gp1", required: true, priority: "High" },
  { id: "registrar-am", title: "Registrar clinic", role: "Registrar", start: "09:00", end: "12:40", roomId: "room-gp2", required: false, priority: "Medium" },
  { id: "nurse-am", title: "Nurse clinic", role: "Practice Nurse", start: "09:00", end: "13:00", roomId: "room-nurse", required: true, priority: "Medium" },
  { id: "hca-am", title: "HCA clinic", role: "HCA", start: "09:00", end: "14:00", roomId: "room-treatment", required: true, priority: "Medium" },
  { id: "dispensary-cover", title: "Dispensary cover", role: "Dispenser", start: "08:30", end: "18:00", roomId: "room-dispensary", required: true, priority: "High" },
  { id: "reception-cover", title: "Reception cover", role: "Reception / Care Navigator", start: "08:30", end: "18:00", roomId: "room-reception", required: true, priority: "High" },
];

export const demoShifts = [
  { id: "shift-mon-gp-am", date: "2026-07-06", templateId: "duty-gp-am", staffName: "Dr Moore", role: "GP Partner", roomId: "room-gp1", start: "08:30", end: "13:00", status: "Assigned" },
  { id: "shift-mon-gp-pm", date: "2026-07-06", templateId: "duty-gp-pm", staffName: "Dr Prosper", role: "Registrar", roomId: "room-gp2", start: "14:00", end: "17:00", status: "Assigned" },
  { id: "shift-mon-hca", date: "2026-07-06", templateId: "hca-am", staffName: "HCA", role: "HCA", roomId: "room-treatment", start: "09:00", end: "14:00", status: "Assigned" },
  { id: "shift-tue-gp-am", date: "2026-07-07", templateId: "duty-gp-am", staffName: "Dr Moore", role: "GP Partner", roomId: "room-gp1", start: "08:30", end: "13:00", status: "Assigned" },
  { id: "shift-tue-dispensary", date: "2026-07-07", templateId: "dispensary-cover", staffName: "Unassigned", role: "Dispenser", roomId: "room-dispensary", start: "08:30", end: "13:00", status: "Missing" },
  { id: "shift-wed-gp", date: "2026-07-08", templateId: "duty-gp-am", staffName: "Dr Taylor", role: "GP Partner", roomId: "room-gp1", start: "08:30", end: "13:00", status: "Assigned" },
  { id: "shift-wed-pm", date: "2026-07-08", templateId: "duty-gp-pm", staffName: "Dr Taylor", role: "GP Partner", roomId: "room-gp1", start: "14:00", end: "18:00", status: "Assigned" },
  { id: "shift-thu-gp", date: "2026-07-09", templateId: "duty-gp-am", staffName: "Unassigned", role: "GP Partner", roomId: "room-gp1", start: "08:30", end: "13:00", status: "Missing" },
  { id: "shift-fri-anp", date: "2026-07-10", templateId: "duty-gp-am", staffName: "Ali Cannon", role: "ANP", roomId: "room-gp1", start: "08:30", end: "13:00", status: "Assigned" },
];

export const rotaRules = [
  { id: "rule-duty-gp", title: "Duty GP/clinician", severity: "High", check: "At least one GP/ANP clinician on site during open hours" },
  { id: "rule-nurse", title: "Nurse/HCA cover", severity: "Medium", check: "Nurse/HCA room should not be double-booked" },
  { id: "rule-dispensary", title: "Dispensary cover", severity: "High", check: "Dispensary must have assigned cover during dispensing hours" },
  { id: "rule-reception", title: "Reception cover", severity: "High", check: "Reception should have visible cover while phones/front desk are open" },
  { id: "rule-room-conflict", title: "Room conflict", severity: "Medium", check: "No more staff assigned to a room than its capacity" },
];
