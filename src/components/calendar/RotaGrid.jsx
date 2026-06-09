import { useMemo } from "react";
import { AlertTriangle, CalendarDays } from "lucide-react";

import { Badge } from "../Badge";
import { RoomColumn } from "./RoomColumn";
import { StaffAvailabilityRail } from "./StaffAvailabilityRail";
import { getRoomOccupancy } from "../../services/roomAllocationService";
import { getRotaAlertsForDate } from "../../services/rotaAlertService";

export function RotaGrid({ date, rooms = [], shifts = [], staffList = [], onDropShift, onSelectShift }) {
  const occupancyRows = useMemo(() => getRoomOccupancy(shifts), [shifts]);
  const alerts = useMemo(() => getRotaAlertsForDate({ date, shifts, staffList }), [date, shifts, staffList]);

  return (
    <div className="rota-grid-shell">
      <div className="rota-grid-toolbar">
        <div>
          <p className="command-card-eyebrow">Master rota / room view</p>
          <h3><CalendarDays size={18} /> {new Date(date).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short" })}</h3>
        </div>
        <Badge>{alerts.length ? `${alerts.length} alert(s)` : "Clear"}</Badge>
      </div>

      {alerts.length ? (
        <div className="rota-alert-strip">
          {alerts.slice(0, 4).map((alert) => (
            <div className="rota-alert-pill" key={alert.id}>
              <AlertTriangle size={14} />
              <strong>{alert.title}</strong>
              <span>{alert.severity}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rota-workspace">
        <div className="room-grid">
          {rooms.map((room) => (
            <RoomColumn
              key={room.id}
              room={room}
              shifts={occupancyRows.find((row) => row.id === room.id)?.assigned || []}
              onDropShift={onDropShift}
              onSelectShift={onSelectShift}
            />
          ))}
        </div>
        <StaffAvailabilityRail staffList={staffList} />
      </div>
    </div>
  );
}
