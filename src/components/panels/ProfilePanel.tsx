import { useApp, getUser } from "../../store";
import { users, teamsById, config } from "../../data";
import {
  badgesFor,
  reliability,
  reliabilityLabel,
  nextMilestone,
} from "../../lib/streaks";

/**
 * Phase 6 (Goal 4): gamified profile. Streak + milestone, reliability, earned
 * badges, a gentle no-show nudge, and a current-streak leaderboard — all from
 * each user's streak record. Switch "View as" to compare a star (Sofia) with a
 * no-show-heavy user (Diego).
 */
export default function ProfilePanel() {
  const me = getUser(useApp((s) => s.currentUserId));
  const bookings = useApp((s) => s.bookings);
  const team = teamsById[me.team];
  const role = config.accessRights[me.accessRights];
  const { streak, commute } = me;

  const helpedOthers = bookings.some(
    (b) => b.bookedBy === me.id && b.assignedTo !== me.id,
  );
  const badges = badgesFor(me, { helpedOthers });
  const earned = badges.filter((b) => b.earned).length;
  const r = reliability(me);
  const milestone = nextMilestone(streak.current);

  const factor = config.carbon.factorsKgPerKm[commute.mode];
  const perDayKg = +(commute.distanceKm * 2 * factor).toFixed(2);

  const leaderboard = [...users]
    .sort((a, b) => b.streak.current - a.streak.current || b.streak.longest - a.streak.longest)
    .slice(0, 8);

  const nudge =
    streak.current === 0
      ? "Your streak reset — book and check in to start a new one."
      : r < 0.8
        ? "A few no-shows lately. Checking in (or releasing early) keeps your streak alive."
        : null;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={me.avatar}
            alt=""
            className="h-20 w-20 rounded-full bg-slate-100 ring-2 ring-white"
            style={{ boxShadow: `0 0 0 3px ${team?.color ?? "#e2e8f0"}` }}
          />
          {streak.current > 0 && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-white px-1.5 text-sm shadow ring-1 ring-slate-200">
              🔥{streak.current}
            </span>
          )}
        </div>
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

      {/* Streak + reliability */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-semibold">🔥 {streak.current} days</div>
              <div className="text-xs text-slate-500">
                Current streak · best {streak.longest}
              </div>
            </div>
          </div>
          {milestone.remaining > 0 ? (
            <>
              <div className="mt-3 h-2 rounded-full bg-orange-100">
                <div
                  className="h-2 rounded-full bg-orange-500"
                  style={{ width: `${(streak.current / milestone.target) * 100}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {milestone.remaining} more to hit {milestone.target} 🔥
              </div>
            </>
          ) : (
            <div className="mt-3 text-xs text-slate-500">Top tier — keep it going!</div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-semibold">{Math.round(r * 100)}%</div>
          <div className="text-xs text-slate-500">
            Reliability · {reliabilityLabel(r)}
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${r * 100}%`,
                background: r >= 0.9 ? "#10b981" : r >= 0.8 ? "#f59e0b" : "#f43f5e",
              }}
            />
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {streak.fulfilled} kept · {streak.noShows} no-shows
          </div>
        </div>
      </div>

      {nudge && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 shadow-sm">
          💡 {nudge}
        </div>
      )}

      {/* Badges */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">Badges</div>
          <div className="text-xs text-slate-400">
            {earned} of {badges.length} earned
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`flex items-center gap-2 rounded-lg border p-2 ${
                b.earned
                  ? "border-slate-200 bg-white"
                  : "border-dashed border-slate-200 bg-slate-50 opacity-50"
              }`}
              title={b.desc}
            >
              <span className="text-xl">{b.icon}</span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{b.label}</div>
                <div className="truncate text-xs text-slate-400">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carbon teaser */}
      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="text-xs font-medium uppercase tracking-wide text-emerald-600">
          Commute &amp; carbon
        </div>
        <div className="mt-1 text-sm text-emerald-900">
          {commute.distanceKm} km each way by {commute.mode}. Each remote day avoids ~
          <span className="font-semibold">{perDayKg} kg CO₂</span>.
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-medium text-slate-700">Streak leaderboard</div>
        <div className="mt-3 space-y-1">
          {leaderboard.map((u, i) => {
            const isMe = u.id === me.id;
            return (
              <div
                key={u.id}
                className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${
                  isMe ? "bg-indigo-50 ring-1 ring-indigo-200" : ""
                }`}
              >
                <span className="w-5 text-center text-sm font-semibold text-slate-400">
                  {i + 1}
                </span>
                <img src={u.avatar} alt="" className="h-8 w-8 rounded-full bg-slate-100" />
                <span className={`flex-1 truncate text-sm ${isMe ? "font-semibold" : ""}`}>
                  {u.name}
                  {isMe && <span className="ml-1 text-xs text-slate-400">(you)</span>}
                </span>
                <span className="text-sm font-medium tabular-nums text-orange-600">
                  🔥 {u.streak.current}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
