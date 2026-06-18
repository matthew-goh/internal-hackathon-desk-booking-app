import { getUser } from "../store";
import { teamsById } from "../data";
import { STATUS_STYLE } from "../lib/status";
import type { Booking, Floor } from "../data/types";

/**
 * Phase 3 (Goal 3): the "who's in today" roster beside the map. Lists everyone
 * with a booking on the selected day — avatar, team, which space, and live
 * status. Click a row to highlight and open that booking on the map.
 */
const RANK: Record<string, number> = { "checked-in": 0, confirmed: 1, "no-show": 2 };

export default function DayRoster({
  floor,
  dayBookings,
  selectedId,
  onSelect,
}: {
  floor: Floor;
  dayBookings: Booking[];
  selectedId: string | null;
  onSelect: (spaceId: string) => void;
}) {
  const labelOf = (spaceId: string) =>
    floor.spaces.find((s) => s.id === spaceId)?.label ?? spaceId;

  const rows = [...dayBookings].sort(
    (a, b) =>
      (RANK[a.status] ?? 3) - (RANK[b.status] ?? 3) ||
      labelOf(a.spaceId).localeCompare(labelOf(b.spaceId), undefined, { numeric: true }),
  );

  const checkedIn = rows.filter((b) => b.status === "checked-in").length;

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <div className="text-sm font-semibold">Who's in today</div>
        <div className="text-xs text-slate-500">
          {rows.length} booked · {checkedIn} checked in
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {rows.length === 0 && (
          <div className="p-4 text-sm text-slate-400">No bookings on this floor.</div>
        )}
        {rows.map((b) => {
          const person = getUser(b.assignedTo);
          const team = teamsById[person.team];
          const style = STATUS_STYLE[b.status];
          const coOwned = b.owners.length > 1;
          return (
            <button
              key={b.id}
              onClick={() => onSelect(b.spaceId)}
              className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-slate-50 ${
                selectedId === b.spaceId ? "bg-indigo-50 ring-1 ring-indigo-200" : ""
              }`}
            >
              <div className="relative">
                <img src={person.avatar} alt="" className="h-9 w-9 rounded-full bg-slate-100" />
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
                  style={{ background: style.dot }}
                  title={style.label}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium">{person.name}</span>
                  {coOwned && <span title="Co-owned" className="text-xs">👥</span>}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: team?.color }} />
                  {team?.name}
                </div>
              </div>
              <span className="shrink-0 font-mono text-xs text-slate-400">{labelOf(b.spaceId)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
