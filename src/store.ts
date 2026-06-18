import { create } from "zustand";
import { bookings as seedBookings, office, usersById } from "./data";
import type { Booking, Floor, User } from "./data/types";

export type View = "floor" | "today" | "insights" | "profile";

interface AppState {
  /** Working copy of bookings — later phases add/cancel/check-in here. */
  bookings: Booking[];
  selectedDate: string;
  currentUserId: string;
  view: View;

  setSelectedDate: (date: string) => void;
  setCurrentUserId: (id: string) => void;
  setView: (view: View) => void;
}

export const useApp = create<AppState>((set) => ({
  bookings: seedBookings,
  selectedDate: "2026-06-18",
  currentUserId: "u-04", // Sofia Reyes (admin) — all floors visible by default
  view: "floor",

  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setCurrentUserId: (currentUserId) => set({ currentUserId }),
  setView: (view) => set({ view }),
}));

/*
 * Pure selectors. Components subscribe to RAW state with useApp (primitives /
 * the stable bookings array) and call these helpers in the render body.
 * They must NOT be called inside a useApp selector — they return fresh
 * arrays each call, which would break useSyncExternalStore's snapshot
 * equality and loop forever.
 */

export const getUser = (id: string): User => usersById[id];

export function bookingsOnDate(bookings: Booking[], date: string): Booking[] {
  return bookings.filter((b) => b.date === date && b.status !== "cancelled");
}

function canSeeFloor(floor: Floor, user: User): boolean {
  if (!floor.restricted) return true;
  return (floor.allowedRoles ?? []).includes(user.accessRights);
}

/** Floors the user is allowed to see (the Apartment is gated). */
export function floorsVisibleTo(user: User): Floor[] {
  return office.floors.filter((f) => canSeeFloor(f, user));
}
