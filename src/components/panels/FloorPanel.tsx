import { useState } from "react";
import { useApp } from "../../store";

/**
 * Phase 0 placeholder. Proves: floor data loads, the Flat is role-gated, and
 * bookings resolve per selected date. The SVG map replaces the body in Phase 1.
 */
export default function FloorPanel() {
  const floors = useApp((s) => s.visibleFloors());
  const selectedDate = useApp((s) => s.selectedDate);
  const bookingsOn = useApp((s) => s.bookingsOn);

  const [floorId, setFloorId] = useState("main");
  const floor = floors.find((f) => f.id === floorId) ?? floors[0];

  const floorSpaceIds = new Set(floor.spaces.map((s) => s.id));
  const dayBookings = bookingsOn(selectedDate).filter((b) =>
    floorSpaceIds.has(b.spaceId),
  );

  const desks = floor.spaces.filter((s) => s.type === "desk");
  const bookable = floor.spaces.filter((s) => s.bookable !== false && s.type !== "kitchen");
  const bookedSpaceIds = new Set(dayBookings.map((b) => b.spaceId));
  const bookedDesks = desks.filter((d) => bookedSpaceIds.has(d.id)).length;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Floor tabs — The Flat only appears for csuite/admin */}
      <div className="mb-5 flex gap-1.5">
        {floors.map((f) => (
          <button
            key={f.id}
            onClick={() => setFloorId(f.id)}
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

      <h1 className="text-xl font-semibold">{floor.name}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Showing {selectedDate}. The interactive map lands in Phase 1 — these counts
        confirm the data layer is wired.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Desks" value={desks.length} />
        <Stat label="Bookable spaces" value={bookable.length} />
        <Stat label="Desks booked" value={bookedDesks} />
        <Stat label="Desks free" value={desks.length - bookedDesks} />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-medium text-slate-700">
          Bookings on this floor today ({dayBookings.length})
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-600 sm:grid-cols-3">
          {dayBookings.map((b) => (
            <li key={b.id} className="flex justify-between">
              <span className="font-mono text-xs text-slate-400">{b.spaceId}</span>
              <span>{b.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
