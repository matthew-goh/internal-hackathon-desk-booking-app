import { useEffect, useState } from "react";
import { useApp, getUser, bookingsOnDate } from "../../store";
import { teamsById, office, config } from "../../data";

const SPACE_LABEL: Record<string, string> = Object.fromEntries(
  office.floors.flatMap((f) => f.spaces).map((s) => [s.id, s.label]),
);

/**
 * Phase 3 (Goal 2): "What does busy mean today?" Instead of a headcount, this
 * explains the day — is one team driving it, is it scattered, and is *your*
 * team in — and flags ghost bookings (reserved but never used).
 */
export default function TodayPanel() {
  const selectedDate = useApp((s) => s.selectedDate);
  const bookings = useApp((s) => s.bookings);
  const me = getUser(useApp((s) => s.currentUserId));
  const dayNotes = useApp((s) => s.dayNotes);
  const setDayNote = useApp((s) => s.setDayNote);
  const dayBookings = bookingsOnDate(bookings, selectedDate);

  const note = dayNotes[selectedDate];
  const isAdmin = config.accessRights[me.accessRights].canManageAnyBooking;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  // Close the editor when the day changes.
  useEffect(() => setEditing(false), [selectedDate]);

  const desks = dayBookings.filter((b) => b.spaceType === "desk");
  const total = desks.length;

  const checkedIn = desks.filter((b) => b.status === "checked-in").length;
  const pending = desks.filter((b) => b.status === "confirmed").length;
  const noShowBookings = desks.filter((b) => b.status === "no-show");
  const noShows = noShowBookings.length;
  const [showGhosts, setShowGhosts] = useState(false);

  // Team breakdown of who's in.
  const byTeam = new Map<string, number>();
  for (const b of desks) {
    const team = getUser(b.assignedTo)?.team;
    if (team) byTeam.set(team, (byTeam.get(team) ?? 0) + 1);
  }
  const ranked = [...byTeam.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const topShare = top ? Math.round((top[1] / total) * 100) : 0;
  const teamsPresent = ranked.length;
  const myTeamCount = byTeam.get(me.team) ?? 0;

  // The "why" — distinguish a team day from a scattered day from a peak.
  let headline: string;
  let why: string;
  if (total === 0) {
    headline = "Nobody's booked in";
    why = "The office is empty today.";
  } else if (total <= 6) {
    headline = `Quiet — just ${total} in`;
    why = `A handful of people across ${teamsPresent} team${teamsPresent === 1 ? "" : "s"}. Mostly a remote day.`;
  } else if (total >= 22) {
    headline = `Peak — ${total} in, nearly full`;
    why = `All ${teamsPresent} teams represented. Expect a busy office.`;
  } else if (top && topShare >= 45 && top[1] >= 4) {
    headline = `${teamsById[top[0]]?.name} team day`;
    why = `${top[1]} of ${total} desks are ${teamsById[top[0]]?.name} — one team is driving it, not the whole office.`;
  } else {
    headline = `Mixed — ${total} in across ${teamsPresent} teams`;
    why = "No single team is driving it; lots of scattered bookings.";
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold">What's busy · {selectedDate}</h1>

      {/* Headline + why (admins can pin a custom note) */}
      <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wide text-indigo-500">
            The day at a glance
          </div>
          {isAdmin && !editing && (
            <button
              onClick={() => {
                setDraft(note ?? "");
                setEditing(true);
              }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              {note ? "✎ Edit" : "✎ Add note"}
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-2">
            <input
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setDayNote(selectedDate, draft);
                  setEditing(false);
                }
                if (e.key === "Escape") setEditing(false);
              }}
              placeholder="e.g. Business Tax Account team day"
              className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  setDayNote(selectedDate, draft);
                  setEditing(false);
                }}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-white"
              >
                Cancel
              </button>
              {note && (
                <button
                  onClick={() => {
                    setDayNote(selectedDate, "");
                    setEditing(false);
                  }}
                  className="ml-auto rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-white"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-indigo-900">
              {note && <span title="Pinned by an admin">📌</span>}
              {note || headline}
            </div>
            <div className="mt-0.5 text-sm text-indigo-700">
              {note ? `System read: ${headline.toLowerCase()} · ${why}` : why}
            </div>
          </>
        )}
      </div>

      {/* Your team + ghost bookings — the two things people actually want to know */}
      <div className="mt-4 grid items-start gap-3 sm:grid-cols-2">
        <div
          className="rounded-xl border p-4"
          style={{
            borderColor: `${teamsById[me.team]?.color}55`,
            background: `${teamsById[me.team]?.color}10`,
          }}
        >
          <div className="text-xs font-medium text-slate-500">
            Your team · {teamsById[me.team]?.name}
          </div>
          <div className="mt-1 text-lg font-semibold">
            {myTeamCount > 0 ? `${myTeamCount} in today` : "Nobody in"}
          </div>
          <div className="text-xs text-slate-500">
            {myTeamCount > 0
              ? "You'd have teammates around."
              : "You'd be on your own from your team."}
          </div>
        </div>

        <div
          className={`rounded-xl border p-4 ${
            noShows > 0 ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"
          }`}
        >
          <div className="text-xs font-medium text-slate-500">Ghost bookings 👻</div>
          <div className="mt-1 text-lg font-semibold">
            {noShows > 0 ? `${noShows} reserved, never used` : "None"}
          </div>
          <div className="text-xs text-slate-500">
            {noShows > 0
              ? "Desks the system thinks are taken but sat empty."
              : pending > 0
                ? `${pending} confirmed but not yet checked in.`
                : "Everyone who booked showed up."}
          </div>

          {noShows > 0 && (
            <>
              <button
                onClick={() => setShowGhosts((v) => !v)}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                aria-expanded={showGhosts}
              >
                {showGhosts ? "Hide" : "Show who"}
                <span className={`transition-transform ${showGhosts ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>

              {showGhosts && (
                <ul className="mt-2 space-y-1.5 border-t border-rose-100 pt-2">
                  {noShowBookings.map((b) => {
                    const person = getUser(b.assignedTo);
                    const t = teamsById[person.team];
                    return (
                      <li key={b.id} className="flex items-center gap-2">
                        <img
                          src={person.avatar}
                          alt=""
                          className="h-7 w-7 rounded-full bg-white"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{person.name}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ background: t?.color }}
                            />
                            {t?.name}
                          </div>
                        </div>
                        <span className="shrink-0 font-mono text-xs text-slate-400">
                          Desk {SPACE_LABEL[b.spaceId] ?? b.spaceId}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="People in" value={total} />
        <Stat label="Checked in" value={checkedIn} />
        <Stat label="Not yet in" value={pending} />
        <Stat label="Teams in" value={teamsPresent} />
      </div>

      {/* Team breakdown */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-medium text-slate-700">Who's making it busy</div>
        <div className="mt-3 space-y-2">
          {ranked.map(([teamId, n]) => {
            const team = teamsById[teamId];
            const isMine = teamId === me.team;
            return (
              <div key={teamId} className="flex items-center gap-3">
                <div className={`w-28 text-sm ${isMine ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                  {team?.name}
                  {isMine && <span className="ml-1 text-xs text-slate-400">(you)</span>}
                </div>
                <div className="h-3 flex-1 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full"
                    style={{ width: `${(n / total) * 100}%`, background: team?.color ?? "#94a3b8" }}
                  />
                </div>
                <div className="w-8 text-right text-sm tabular-nums text-slate-500">{n}</div>
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
