import { fridgeAlerts, fridgeDevices, fridgeReadings } from "../data/fridgeDevices";

export function getFridgeDevices() {
  return fridgeDevices;
}

export function getFridgeReadings(deviceId) {
  return fridgeReadings.filter((reading) => reading.deviceId === deviceId);
}

export function getFridgeAlerts() {
  return fridgeAlerts;
}

export function getFridgeDeviceStatus(device) {
  const current = Number(device.currentTemperature);
  const inRange = current >= Number(device.targetMin) && current <= Number(device.targetMax);
  const excursionCount = getFridgeReadings(device.id).filter(
    (reading) => reading.temperature < device.targetMin || reading.temperature > device.targetMax
  ).length;

  return {
    label: inRange && excursionCount === 0 ? "Safe" : "Review",
    inRange,
    excursionCount,
    safeBand: `${device.targetMin}°C to ${device.targetMax}°C`,
  };
}

export function createManualFridgeReading({ deviceId, temperature, recordedBy }) {
  return {
    id: `manual-reading-${Date.now()}`,
    deviceId,
    temperature: Number(temperature),
    recordedBy,
    recordedAt: new Date().toISOString(),
    source: "Manual entry",
    requiresReview: Number(temperature) < 2 || Number(temperature) > 8,
  };
}

export function acknowledgeFridgeExcursion({ deviceId, actionTaken, actorName }) {
  return {
    id: `fridge-ack-${Date.now()}`,
    deviceId,
    actionTaken,
    actorName,
    acknowledgedAt: new Date().toISOString(),
    auditStatus: "Recorded in prototype audit log",
  };
}
