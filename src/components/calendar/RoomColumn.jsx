import { Plus } from "lucide-react";
import { Badge } from "../Badge";
import { ShiftCard } from "./ShiftCard";

export function RoomColumn({ room, shifts = [], onDropShift, onSelectShift }) {
  return (
    <div
      className="room-column"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const shiftId = event.dataTransfer.getData("text/plain");
        onDropShift?.(shiftId, room.id);
      }}
    >
      <div className="room-column-header">
        <div>
          <strong>{room.name}</strong>
          <span>{room.type}</span>
        </div>
        <Badge>{shifts.length}/{room.capacity}</Badge>
      </div>
      <div className="room-shift-stack">
        {shifts.length ? shifts.map((shift) => <ShiftCard key={shift.id} shift={shift} onSelect={onSelectShift} />) : (
          <div className="empty-room-drop"><Plus size={16} />Drop shift here</div>
        )}
      </div>
    </div>
  );
}
