import { GripVertical } from "lucide-react";
import { Badge } from "../Badge";
import { getRoleColourClass } from "../../services/rotaService";

export function ShiftCard({ shift, onSelect }) {
  return (
    <button
      type="button"
      className={["shift-card", getRoleColourClass(shift.role), shift.status === "Missing" ? "shift-card-missing" : ""].filter(Boolean).join(" ")}
      draggable
      onClick={() => onSelect?.(shift)}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", shift.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      title="Drag/drop-ready prototype card"
    >
      <GripVertical size={15} className="shift-grip" />
      <span className="shift-time">{shift.start}-{shift.end}</span>
      <strong>{shift.staffName}</strong>
      <span>{shift.role}</span>
      <Badge>{shift.status}</Badge>
    </button>
  );
}
