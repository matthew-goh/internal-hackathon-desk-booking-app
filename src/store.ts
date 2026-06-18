import { create } from "zustand";
import { bookings as seedBookings, office, usersById, config } from "./data";
import type { Booking, Floor, Space, SpaceType, User } from "./data/types";

export type View = "floor" | "today" | "insights" | "carbon" | "profile";

interface BookInput {
  spaceId: string;
  spaceType: SpaceType;
  assignedTo: string;
}

interface AppState {
  /** Working copy of bookings — mutated by the actions below. */
  bookings: Booking[];
  selectedDate: string;
  currentUserId: string;
  view: View;
  /** Admin-pinned "why is it busy" note, keyed by date. */
  dayNotes: Record<string, string>;

  setSelectedDate: (date: string) => void;
  setCurrentUserId: (id: string) => void;
  setView: (view: View) => void;
  setDayNote: (date: string, note: string) => void;

  // ---- booking actions (Phase 2) ----
  book: (input: BookInput) => void;
  release: (bookingId: string) => void;
  checkIn: (bookingId: string) => void;
  reassign: (bookingId: string, userId: string) => void;
}

function nowHHMM(): string {
  return new Date().toTimeString().slice(0, 5);
}

export const useApp = create<AppState>((set) => ({
  bookings: seedBookings,
  selectedDate: "2026-06-18",
  currentUserId: "u-04", // Sofia Reyes (admin) — all floors visible by default
  view: "floor",
  dayNotes: {},

  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setCurrentUserId: (currentUserId) => set({ currentUserId }),
  setView: (view) => set({ view }),
  setDayNote: (date, note) =>
    set((s) => {
      const dayNotes = { ...s.dayNotes };
      if (note.trim()) dayNotes[date] = note.trim();
      else delete dayNotes[date];
      return { dayNotes };
    }),

  book: ({ spaceId, spaceType, assignedTo }) =>
    set((s) => {
      const bookedBy = s.currentUserId;
      const owners = Array.from(new Set([bookedBy, assignedTo]));
      const booking: Booking = {
        id: `bk-${Date.now()}`,
        spaceId,
        spaceType,
        date: s.selectedDate,
        start: "09:00",
        end: "17:00",
        allDay: true,
        status: "confirmed",
        bookedBy,
        assignedTo,
        owners,
        checkInTime: null,
        createdAt: new Date().toISOString(),
      };
      return { bookings: [...s.bookings, booking] };
    }),

  release: (bookingId) =>
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: "cancelled" } : b,
      ),
    })),

  checkIn: (bookingId) =>
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId
          ? { ...b, status: "checked-in", checkInTime: nowHHMM() }
          : b,
      ),
    })),

  reassign: (bookingId, userId) =>
    set((s) => ({
      bookings: s.bookings.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          assignedTo: userId,
          owners: Array.from(new Set([b.bookedBy, userId])),
        };
      }),
    })),
}));

/*
 * Pure selectors / permission helpers. Components subscribe to RAW state with
 * useApp and call these in the render body. They must NOT be called inside a
 * useApp selector — they return fresh arrays each call, which would break
 * useSyncExternalStore's snapshot equality and loop forever.
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

/** Can this user reserve this space? Honours bookable + privileged-room gates. */
export function canBookSpace(user: User, space: Space): boolean {
  if (space.bookable === false || space.type === "kitchen") return false;
  if (space.privileged) return (space.allowedRoles ?? []).includes(user.accessRights);
  return true;
}

export const isOwner = (booking: Booking, userId: string): boolean =>
  booking.owners.includes(userId);

/** Owners can manage; admins (canManageAnyBooking) can manage anyone's. */
export function canManage(booking: Booking, user: User): boolean {
  return (
    isOwner(booking, user.id) ||
    config.accessRights[user.accessRights].canManageAnyBooking
  );
}
