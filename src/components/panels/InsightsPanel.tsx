import { useApp } from "../../store";
import { office } from "../../data";
import { STATUS_STYLE } from "../../lib/status";

const WEEK = [
  { date: "2026-06-15", day: "Mon" },
  { date: "2026-06-16", day: "Tue" },
  { date: "2026-06-17", day: "Wed" },
  { date: "2026-06-18", day: "Thu" },
  { date: "2026-06-19", day: "Fri" },
];

const DESK_CAPACITY = office.floors
  .find((f) => f.id === "main")!
  .spaces.filter((s) => s.type === "desk").length;

/**
 * Phase 3/5: week-level planning view (README: "planning the office is
 * guesswork"). Turns occupancy into utilisation, peak/quiet days, and a
 * no-show rate a facilities manager can act on.
 */
export default function InsightsPanel() {
  const bookings = useApp((s) => s.bookings);

  const perDay = WEEK.map(({ date, day }) => {
    const desks = bookings.filter(
      (b) => b.date === date && b.spaceType === "desk" && b.status !== "cancelled",
    );
    return {
      date,
      day,
      total: desks.length,
      checkedIn: desks.filter((b) => b.status === "checked-in").length,
      confirmed: desks.filter((b) => b.status === "confirmed").length,
      noShow: desks.filter((b) => b.status === "no-show").length,
    };
  });

  const totals = perDay.map((d) => d.total);
  const peak = perDay.reduce((a, b) => (b.total > a.total ? b : a));
  const quiet = perDay.reduce((a, b) => (b.total < a.total ? b : a));
  const avg = Math.round(totals.reduce((s, n) => s + n, 0) / perDay.length);
  const utilisation = Math.round((avg / DESK_CAPACITY) * 100);

  const resolved = perDay.reduce((s, d) => s + d.checkedIn + d.noShow, 0);
  const noShows = perDay.reduce((s, d) => s + d.noShow, 0);
  const noShowRate = resolved ? Math.round((noShows / resolved) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold">Insights · planning</h1>
      <p className="mt-1 text-sm text-slate-500">
        How the office is really used this week — the numbers behind capacity and
        catering decisions.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Avg desks / day" value={`${avg}`} sub={`of ${DESK_CAPACITY}`} />
        <Stat label="Utilisation" value={`${utilisation}%`} />
        <Stat label="Peak day" value={peak.day} sub={`${peak.total} desks`} />
        <Stat label="No-show rate" value={`${noShowRate}%`} sub={`${noShows} ghosts`} />
      </div>

      {/* Weekly attendance chart */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-medium text-slate-700">Desk occupancy this week</div>
        <div className="mt-5 flex items-end justify-around gap-3" style={{ height: 180 }}>
          {perDay.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end justify-center">
                <div className="flex w-10 flex-col-reverse overflow-hidden rounded-md">
                  <Seg n={d.checkedIn} color={STATUS_STYLE["checked-in"].dot} />
                  <Seg n={d.confirmed} color={STATUS_STYLE.confirmed.dot} />
                  <Seg n={d.noShow} color={STATUS_STYLE["no-show"].dot} />
                </div>
              </div>
              <div className="text-sm font-semibold tabular-nums">{d.total}</div>
              <div className="text-xs text-slate-400">{d.day}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-4 text-xs text-slate-500">
          <Key color={STATUS_STYLE["checked-in"].dot} label="Checked in" />
          <Key color={STATUS_STYLE.confirmed.dot} label="Confirmed" />
          <Key color={STATUS_STYLE["no-show"].dot} label="No-show" />
          <span className="ml-auto text-slate-400">Capacity {DESK_CAPACITY} desks</span>
        </div>
      </div>

      {/* Planning takeaway */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
        <div className="text-sm font-medium text-slate-700">What this means</div>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          <li>
            • <b>{peak.day}</b> peaks at {peak.total}/{DESK_CAPACITY} (
            {Math.round((peak.total / DESK_CAPACITY) * 100)}%) — plan catering and support
            around midweek.
          </li>
          <li>
            • <b>{quiet.day}</b> sits at just {quiet.total} desks — a candidate to close a
            wing or save on heating/cleaning.
          </li>
          <li>
            • A <b>{noShowRate}% no-show rate</b> means reserved-but-empty desks; auto-release
            on no check-in would recover them.
          </li>
        </ul>
      </div>
    </div>
  );
}

function Seg({ n, color }: { n: number; color: string }) {
  if (n <= 0) return null;
  return <div style={{ height: n * 5 + 2, background: color }} title={`${n}`} />;
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
