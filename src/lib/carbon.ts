import type { Booking, CarbonConfig, User } from "../data/types";

/**
 * Carbon model (Goal: Carbon Negative 🌍).
 * An office day means a round-trip commute; a remote day avoids it.
 *   savedKg  = remote days  × round-trip commute emissions
 *   emittedKg = office days  × round-trip commute emissions
 * "Attended" = the person has a confirmed or checked-in booking that day
 * (no-shows and cancellations don't count as a commute).
 */

export function roundTripKg(user: User, factors: CarbonConfig["factorsKgPerKm"]): number {
  return 2 * user.commute.distanceKm * (factors[user.commute.mode] ?? 0);
}

export interface UserCarbon {
  user: User;
  attended: number;
  remote: number;
  roundTripKg: number;
  savedKg: number;
  emittedKg: number;
}

export interface WeekCarbon {
  perUser: UserCarbon[];
  byUserId: Record<string, UserCarbon>;
  savedKg: number;
  emittedKg: number;
  potentialKg: number;
  /** Share of potential commute emissions avoided by remote working. */
  avoidedShare: number;
  byTeam: { teamId: string; savedKg: number }[];
}

export function computeWeekCarbon(
  users: User[],
  bookings: Booking[],
  dates: string[],
  carbon: CarbonConfig,
): WeekCarbon {
  // userId -> set of dates they were in the office
  const attendedByUser = new Map<string, Set<string>>();
  for (const b of bookings) {
    if (!dates.includes(b.date)) continue;
    if (b.status !== "checked-in" && b.status !== "confirmed") continue;
    let set = attendedByUser.get(b.assignedTo);
    if (!set) {
      set = new Set();
      attendedByUser.set(b.assignedTo, set);
    }
    set.add(b.date);
  }

  const perUser: UserCarbon[] = users.map((user) => {
    const attended = attendedByUser.get(user.id)?.size ?? 0;
    const remote = dates.length - attended;
    const rt = roundTripKg(user, carbon.factorsKgPerKm);
    return {
      user,
      attended,
      remote,
      roundTripKg: rt,
      savedKg: remote * rt,
      emittedKg: attended * rt,
    };
  });

  const savedKg = perUser.reduce((s, p) => s + p.savedKg, 0);
  const emittedKg = perUser.reduce((s, p) => s + p.emittedKg, 0);
  const potentialKg = savedKg + emittedKg;

  const teamMap = new Map<string, number>();
  for (const p of perUser) {
    teamMap.set(p.user.team, (teamMap.get(p.user.team) ?? 0) + p.savedKg);
  }
  const byTeam = [...teamMap.entries()]
    .map(([teamId, kg]) => ({ teamId, savedKg: kg }))
    .sort((a, b) => b.savedKg - a.savedKg);

  return {
    perUser,
    byUserId: Object.fromEntries(perUser.map((p) => [p.user.id, p])),
    savedKg,
    emittedKg,
    potentialKg,
    avoidedShare: potentialKg ? savedKg / potentialKg : 0,
    byTeam,
  };
}

/** Annual tonnes of saved CO2 expressed as equivalent trees. */
export function treesFromWeeklyKg(weeklyKg: number, treesPerTonne: number): number {
  return Math.round(((weeklyKg * 52) / 1000) * treesPerTonne);
}
