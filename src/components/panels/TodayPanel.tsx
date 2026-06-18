import { useApp } from "../../store";
import { usersById, teamsById } from "../../data";

/**
 * Phase 0 placeholder previewing Goal 2 ("what does busy mean?").
 * Groups the day's desk bookings by team to explain the headcount, not just count it.
 * Phase 3 turns this into the real Insights view.
 */
export default function TodayPanel() {
  const selectedDate = useApp((s) => s.selectedDate);
  const dayBookings = useApp((s) => s.bookingsOn(selectedDate));

  const deskBookings = dayBookings.filter((b) => b.spaceType === "desk");

  const counts = {
    checkedIn: deskBookings.filter((b) => b.status === "checked-in").length,
    confirmed: deskBookings.filter((b) => b.status === "confirmed").length,
    noShow: deskBookings.filter((b) => b.status === "no-show").length,
  };

  // Team breakdown of who's in.
  const byTeam = new Map<string, number>();
  for (const b of deskBookings) {
    const team = usersById[b.assignedTo]?.team;
    if (team) byTeam.set(team, (byTeam.get(team) ?? 0) + 1);
  }
  const ranked = [...byTeam.entries()].sort((a, b) => b[1] - a[1]);
  const total = deskBookings.length;
  const top = ranked[0];
  const topShare = top ? Math.round((top[1] / total) * 100) : 0;

  let headline = "Quiet day — most people are remote";
  if (total >= 20) headline = "Peak day — nearly every team is in";
  else if (total <= 6) headline = "Quiet day — most people are remote";
  else if (top && topShare >= 50)
    headline = `Busy because ${teamsById[top[0]]?.name} is in (${topShare}%)`;
  else headline = "A mixed day — several teams, no single driver";

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold">Today · {selectedDate}</h1>

      <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-indigo-500">
          What's busy
        </div>
        <div className="mt-1 text-lg font-semibold text-indigo-900">{headline}</div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="People in" value={total} />
        <Stat label="Checked in" value={counts.checkedIn} />
        <Stat label="Not yet in" value={counts.confirmed} />
        <Stat label="No-shows 👻" value={counts.noShow} />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-medium text-slate-700">Who's making it busy</div>
        <div className="mt-3 space-y-2">
          {ranked.map(([teamId, n]) => {
            const team = teamsById[teamId];
            return (
              <div key={teamId} className="flex items-center gap-3">
                <div className="w-24 text-sm text-slate-600">{team?.name}</div>
                <div className="h-3 flex-1 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full"
                    style={{
                      width: `${(n / total) * 100}%`,
                      background: team?.color ?? "#94a3b8",
                    }}
                  />
                </div>
                <div className="w-8 text-right text-sm tabular-nums text-slate-500">
                  {n}
                </div>
              </div>
            );
          })}
          {ranked.length === 0 && (
            <div className="text-sm text-slate-400">No desk bookings this day.</div>
          )}
        </div>
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
