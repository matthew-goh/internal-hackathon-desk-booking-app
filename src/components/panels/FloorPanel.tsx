import { useState } from "react";
import { useApp, getUser, floorsVisibleTo, bookingsOnDate } from "../../store";
import SpaceMap from "../SpaceMap";
import BookingPanel from "../BookingPanel";
import { STATUS_STYLE, ORDERED_STATES, bookingsBySpace } from "../../lib/status";

/**
 * Phase 1: interactive SVG floor map. Floor tabs switch between the Main Floor
 * and the (role-gated) Apartment; the map colours every space by its status for
 * the selected date and reveals the occupant on hover.
 */
export default function FloorPanel() {
  const currentUserId = useApp((s) => s.currentUserId);
  const selectedDate = useApp((s) => s.selectedDate);
  const bookings = useApp((s) => s.bookings);

  const floors = floorsVisibleTo(getUser(currentUserId));
  const [floorId, setFloorId] = useState("main");
  const floor = floors.find((f) => f.id === floorId) ?? floors[0];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedSpace = floor.spaces.find((s) => s.id === selectedId) ?? null;

  const floorSpaceIds = new Set(floor.spaces.map((s) => s.id));
  const dayBookings = bookingsOnDate(bookings, selectedDate).filter((b) =>
    floorSpaceIds.has(b.spaceId),
  );
  const bySpace = bookingsBySpace(dayBookings);

  const desks = floor.spaces.filter((s) => s.type === "desk");
  const bookedDesks = desks.filter((d) => bySpace[d.id]).length;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Floor tabs — the Apartment only appears for csuite/admin */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          {floors.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFloorId(f.id);
                setSelectedId(null);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                floor.id === f.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.name}
              {f.restricted && <span className="ml-1.5 text-xs">🔒</span>}
            </button>
          ))}
        </div>
        {desks.length > 0 && (
          <div className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{desks.length - bookedDesks}</span>{" "}
            of {desks.length} desks free
          </div>
        )}
      </div>

      <SpaceMap
        floor={floor}
        dayBookings={dayBookings}
        selectedId={selectedId}
        onSelect={(s) => setSelectedId(s.id)}
      />

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        {ORDERED_STATES.map((state) => (
          <div key={state} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full border"
              style={{
                background: STATUS_STYLE[state].fill,
                borderColor: STATUS_STYLE[state].stroke,
              }}
            />
            {STATUS_STYLE[state].label}
          </div>
        ))}
        <span className="ml-auto text-slate-400">Hover for details · click to book</span>
      </div>

      {selectedSpace && (
        <BookingPanel
          key={selectedSpace.id}
          space={selectedSpace}
          booking={bySpace[selectedSpace.id]}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
