import { useApp } from "../../store";
import { teamsById, config } from "../../data";

/**
 * Phase 0 placeholder showing the current ("view as") user. Proves the user
 * switcher, streak data and commute profile are wired. Streak badges + the
 * personal carbon figure get their real treatment in Phase 4.
 */
export default function ProfilePanel() {
  const me = useApp((s) => s.currentUser());
  const team = teamsById[me.team];
  const role = config.accessRights[me.accessRights];
  const { streak, commute } = me;

  // Quick personal carbon teaser: one avoided round-trip commute.
  const factor = config.carbon.factorsKgPerKm[commute.mode];
  const perDayKg = +(commute.distanceKm * 2 * factor).toFixed(2);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-4">
        <img
          src={me.avatar}
          alt=""
          className="h-20 w-20 rounded-full bg-slate-100 ring-1 ring-slate-200"
        />
        <div>
          <h1 className="text-2xl font-semibold">{me.name}</h1>
          <div className="text-sm text-slate-500">
            {me.title} · {team?.name}
          </div>
          <span
            className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ background: team?.color }}
          >
            {role.label}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Current streak" value={`${streak.current}🔥`} />
        <Stat label="Longest streak" value={`${streak.longest}`} />
        <Stat label="Fulfilled" value={`${streak.fulfilled}`} />
        <Stat label="No-shows" value={`${streak.noShows}`} />
      </div>

      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-emerald-600">
          Commute &amp; carbon
        </div>
        <div className="mt-1 text-sm text-emerald-900">
          {commute.distanceKm} km each way by {commute.mode}. Each remote day instead of
          coming in avoids ~<span className="font-semibold">{perDayKg} kg CO₂</span>.
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
