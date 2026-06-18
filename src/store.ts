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

  // ---- derived selectors ----
  currentUser: () => User;
  bookingsOn: (date: string) => Booking[];
  /** Floors the current user is allowed to see (the Flat is gated). */
  visibleFloors: () => Floor[];
}

function canSeeFloor(floor: Floor, user: User): boolean {
  if (!floor.restricted) return true;
  return (floor.allowedRoles ?? []).includes(user.accessRights);
}

export const useApp = create<AppState>((set, get) => ({
  bookings: seedBookings,
  selectedDate: "2026-06-18",
  currentUserId: "u-04", // Sofia Reyes (admin) — all floors visible by default
  view: "floor",

  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setCurrentUserId: (currentUserId) => set({ currentUserId }),
  setView: (view) => set({ view }),

  currentUser: () => usersById[get().currentUserId],
  bookingsOn: (date) =>
    get().bookings.filter((b) => b.date === date && b.status !== "cancelled"),
  visibleFloors: () => {
    const user = get().currentUser();
    return office.floors.filter((f) => canSeeFloor(f, user));
  },
}));
