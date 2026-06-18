import type { User } from "../data/types";

/**
 * Streak gamification (Goal 4). All derived from each user's streak record
 * (consecutive fulfilled office days, totals, no-shows) plus a little context.
 */

/** Share of bookings actually honoured (checked in vs no-show). */
export function reliability(user: User): number {
  const resolved = user.streak.fulfilled + user.streak.noShows;
  return resolved ? user.streak.fulfilled / resolved : 1;
}

export function reliabilityLabel(r: number): string {
  if (r >= 0.92) return "Excellent";
  if (r >= 0.8) return "Good";
  return "Needs work";
}

const TIERS = [3, 5, 7, 10, 15, 21, 30];

/** Next streak milestone above the current streak. */
export function nextMilestone(current: number): { target: number; remaining: number } {
  const target = TIERS.find((t) => t > current) ?? current;
  return { target, remaining: Math.max(0, target - current) };
}

export interface Badge {
  id: string;
  icon: string;
  label: string;
  desc: string;
  earned: boolean;
}

export interface BadgeContext {
  /** Has this person booked a desk for someone else? */
  helpedOthers: boolean;
}

export function badgesFor(user: User, ctx: BadgeContext): Badge[] {
  const r = reliability(user);
  const green = ["walk", "bike", "train", "tube"].includes(user.commute.mode);
  return [
    {
      id: "onaroll",
      icon: "🔥",
      label: "On a roll",
      desc: "5+ day current streak",
      earned: user.streak.current >= 5,
    },
    {
      id: "master",
      icon: "🏆",
      label: "Streak master",
      desc: "14+ day best streak",
      earned: user.streak.longest >= 14,
    },
    {
      id: "reliable",
      icon: "✅",
      label: "Reliable",
      desc: "90%+ check-in rate",
      earned: r >= 0.9 && user.streak.totalBookings >= 20,
    },
    {
      id: "centurion",
      icon: "🎯",
      label: "Centurion",
      desc: "100+ bookings",
      earned: user.streak.totalBookings >= 100,
    },
    {
      id: "green",
      icon: "🌱",
      label: "Green commuter",
      desc: "Walks, cycles or takes the train",
      earned: green,
    },
    {
      id: "helper",
      icon: "👥",
      label: "Team helper",
      desc: "Books desks for teammates",
      earned: ctx.helpedOthers,
    },
  ];
}
