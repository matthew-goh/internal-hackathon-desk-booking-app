import { useApp } from "../../store";

/**
 * Phase 0 placeholder. A few whole-dataset aggregates to prove the data reads
 * correctly. Phase 3 (utilisation) and Phase 4 (carbon) flesh this out.
 */
export default function InsightsPanel() {
  const bookings = useApp((s) => s.bookings);

  const desk = bookings.filter((b) => b.spaceType === "desk");
  const resolved = desk.filter(
    (b) => b.status === "checked-in" || b.status === "no-show",
  );
  const noShows = resolved.filter((b) => b.status === "no-show").length;
  const noShowRate = resolved.length
    ? Math.round((noShows / resolved.length) * 100)
    : 0;

  const byDate = new Map<string, number>();
  for (const b of desk) byDate.set(b.date, (byDate.get(b.date) ?? 0) + 1);
  const busiest = [...byDate.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold">Insights</h1>
      <p className="mt-1 text-sm text-slate-500">
        Whole-week aggregates. Real utilisation + carbon dashboards arrive in later
        phases.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total bookings" value={`${bookings.length}`} />
        <Stat label="No-show rate" value={`${noShowRate}%`} />
        <Stat
          label="Busiest day"
          value={busiest ? busiest[0].slice(5) : "—"}
          sub={busiest ? `${busiest[1]} desks` : undefined}
        />
        <Stat label="Days loaded" value={`${byDate.size}`} />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-medium text-slate-700">Desk bookings per day</div>
        <div className="mt-3 flex items-end gap-4">
          {[...byDate.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, n]) => (
              <div key={date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-indigo-500"
                  style={{ height: `${n * 6 + 4}px` }}
                />
                <div className="text-xs tabular-nums text-slate-500">{n}</div>
                <div className="text-xs text-slate-400">{date.slice(5)}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
