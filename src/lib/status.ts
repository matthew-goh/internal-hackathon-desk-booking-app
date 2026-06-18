import type { Booking, BookingStatus } from "../data/types";

/** A space is either free, or carries the status of its booking for the day. */
export type SpaceState = BookingStatus | "free";

export interface StatusStyle {
  label: string;
  /** Map fill / border / legend-dot colours. */
  fill: string;
  stroke: string;
  dot: string;
}

export const STATUS_STYLE: Record<SpaceState, StatusStyle> = {
  free: { label: "Available", fill: "#ffffff", stroke: "#cbd5e1", dot: "#cbd5e1" },
  confirmed: { label: "Booked", fill: "#fffbeb", stroke: "#f59e0b", dot: "#f59e0b" },
  "checked-in": { label: "Checked in", fill: "#ecfdf5", stroke: "#10b981", dot: "#10b981" },
  "no-show": { label: "No-show", fill: "#fef2f2", stroke: "#f43f5e", dot: "#f43f5e" },
  cancelled: { label: "Cancelled", fill: "#f8fafc", stroke: "#e2e8f0", dot: "#e2e8f0" },
};

/**
 * Index the day's bookings by space id. Rooms can hold several bookings a day;
 * we keep the most "present" one (checked-in > confirmed > no-show) so the map
 * reflects whether someone is actually there.
 */
export function bookingsBySpace(dayBookings: Booking[]): Record<string, Booking> {
  const rank: Record<BookingStatus, number> = {
    "checked-in": 3,
    confirmed: 2,
    "no-show": 1,
    cancelled: 0,
  };
  const out: Record<string, Booking> = {};
  for (const b of dayBookings) {
    const cur = out[b.spaceId];
    if (!cur || rank[b.status] > rank[cur.status]) out[b.spaceId] = b;
  }
  return out;
}

export const ORDERED_STATES: SpaceState[] = [
  "free",
  "confirmed",
  "checked-in",
  "no-show",
];
