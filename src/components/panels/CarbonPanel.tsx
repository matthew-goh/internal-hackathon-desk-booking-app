import { useApp, getUser } from "../../store";
import { users, teamsById, config } from "../../data";
import { computeWeekCarbon, treesFromWeeklyKg } from "../../lib/carbon";

/** The five working days of the demo week. */
const WEEK = [
  "2026-06-15",
  "2026-06-16",
  "2026-06-17",
  "2026-06-18",
  "2026-06-19",
];

/**
 * Phase 4 (Carbon Negative 🌍). Turns the booking data into an environmental
 * story: every remote day is an avoided commute. Shows company savings this
 * week, an annualised projection in trees, the share of commute emissions
 * avoided, a per-team breakdown, and the viewer's personal contribution.
 */
export default function CarbonPanel() {
  const bookings = useApp((s) => s.bookings);
  const me = getUser(useApp((s) => s.currentUserId));
  const c = config.carbon;

  const week = computeWeekCarbon(users, bookings, WEEK, c);
  const trees = treesFromWeeklyKg(week.savedKg, c.treesPerTonne);
  const tonnesPerYear = (week.savedKg * 52) / 1000;
  const mine = week.byUserId[me.id];
  const maxTeam = week.byTeam[0]?.savedKg ?? 1;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold">Carbon · this week</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every day worked remotely is a commute not taken. Savings are modelled from each
        person's commute distance and mode.
      </p>

      {/* Hero */}
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
        <div className="text-xs font-medium uppercase tracking-wide text-emerald-600">
          CO₂ saved by not commuting
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-emerald-900">
            {Math.round(week.savedKg)}
          </span>
          <span className="text-lg font-medium text-emerald-700">kg this week</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-emerald-800">
          <span>
            ≈ <b>{tonnesPerYear.toFixed(1)} tonnes</b> / year
          </span>
          <span>
            🌳 like planting <b>{trees}</b> trees a year
          </span>
          <span>
            <b>{Math.round(week.avoidedShare * 100)}%</b> of commute emissions avoided
          </span>
        </div>

        {/* avoided vs emitted bar */}
        <div className="mt-4">
          <div className="flex h-3 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-3 bg-emerald-500"
              style={{ width: `${week.avoidedShare * 100}%` }}
              title="Avoided (remote days)"
            />
            <div
              className="h-3 bg-slate-300"
              style={{ width: `${(1 - week.avoidedShare) * 100}%` }}
              title="Emitted (office days)"
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>{Math.round(week.savedKg)} kg avoided</span>
            <span>{Math.round(week.emittedKg)} kg from actual commutes</span>
          </div>
        </div>
      </div>

      {/* Personal contribution */}
      {mine && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <img src={me.avatar} alt="" className="h-11 w-11 rounded-full bg-slate-100" />
            <div className="flex-1">
              <div className="text-sm font-medium">Your contribution</div>
              <div className="text-xs text-slate-500">
                {me.commute.distanceKm} km each way by {me.commute.mode} ·{" "}
                {mine.roundTripKg.toFixed(1)} kg per office day
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold text-emerald-700">
                {Math.round(mine.savedKg)} kg
              </div>
              <div className="text-xs text-slate-500">
                {mine.remote} remote / {mine.attended} office days
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-team breakdown */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-medium text-slate-700">Saved by team this week</div>
        <div className="mt-3 space-y-2">
          {week.byTeam.map(({ teamId, savedKg }) => {
            const team = teamsById[teamId];
            return (
              <div key={teamId} className="flex items-center gap-3">
                <div className="w-28 text-sm text-slate-600">{team?.name}</div>
                <div className="h-3 flex-1 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full"
                    style={{ width: `${(savedKg / maxTeam) * 100}%`, background: team?.color }}
                  />
                </div>
                <div className="w-16 text-right text-sm tabular-nums text-slate-500">
                  {Math.round(savedKg)} kg
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Factors (kg CO₂/km): car {c.factorsKgPerKm.car}, bus {c.factorsKgPerKm.bus}, train{" "}
        {c.factorsKgPerKm.train}, tube {c.factorsKgPerKm.tube}, bike/walk 0. Annual figures
        project this week across 52 weeks.
      </p>
    </div>
  );
}
