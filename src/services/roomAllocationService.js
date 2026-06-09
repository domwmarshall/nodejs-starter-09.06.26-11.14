import { rooms } from "../data/rota";

export function getRoomOccupancy(shifts = []) {
  return rooms.map((room) => {
    const assigned = shifts.filter((shift) => shift.roomId === room.id && shift.status !== "Missing");
    return {
      ...room,
      assigned,
      occupancy: assigned.length,
      isOverCapacity: assigned.length > room.capacity,
    };
  });
}

export function getRoomConflicts(shifts = []) {
  return getRoomOccupancy(shifts).filter((room) => room.isOverCapacity).map((room) => ({
    id: `room-conflict-${room.id}`,
    roomId: room.id,
    title: `${room.name} over capacity`,
    severity: "Medium",
    detail: `${room.occupancy}/${room.capacity} assignments in this room.`,
  }));
}
