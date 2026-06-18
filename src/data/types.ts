/**
 * Types for the Mercator booking dataset.
 * These mirror `data/SCHEMA.md` — keep them in sync if the JSON shape changes.
 */

export type TeamId =
  | "engineering"
  | "product"
  | "design"
  | "sales"
  | "marketing"
  | "finance"
  | "people"
  | "leadership";

export interface Team {
  id: TeamId;
  name: string;
  color: string;
  homeZone: string;
}

// ---- Users ----

export type AccessTier = "user" | "manager" | "csuite" | "admin";

export type CommuteMode = "car" | "bus" | "train" | "tube" | "bike" | "walk";

export interface Commute {
  mode: CommuteMode;
  distanceKm: number;
}

export interface Streak {
  current: number;
  longest: number;
  totalBookings: number;
  fulfilled: number;
  noShows: number;
  lastActive: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  team: TeamId;
  title: string;
  accessRights: AccessTier;
  avatar: string;
  commute: Commute;
  streak: Streak;
}

// ---- Office ----

export type SpaceType = "desk" | "room" | "pod" | "lounge" | "kitchen";

export type Amenity =
  | "monitor"
  | "dual-monitor"
  | "charging"
  | "standing-desk"
  | "window"
  | "screen"
  | "whiteboard"
  | "video-conf"
  | "phone";

export interface Space {
  id: string;
  type: SpaceType;
  label: string;
  x: number;
  y: number;
  /** Rooms, lounges, pods and kitchens carry width/height; desks are point icons. */
  width?: number;
  height?: number;
  zone?: string;
  seats?: number;
  amenities?: Amenity[];
  /** false = shown on the map but not reservable (kitchen, Main-floor lounge). */
  bookable?: boolean;
  /** true = not everyone may book it; see allowedRoles. */
  privileged?: boolean;
  allowedRoles?: AccessTier[];
}

export interface Zone {
  id: string;
  label: string;
  team: TeamId;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloorMap {
  width: number;
  height: number;
  background: string;
}

export interface Floor {
  id: string;
  name: string;
  /** true = whole floor gated by allowedRoles (the Flat). */
  restricted: boolean;
  allowedRoles?: AccessTier[];
  map: FloorMap;
  zones: Zone[];
  spaces: Space[];
}

export interface Office {
  floors: Floor[];
}

// ---- Bookings ----

export type BookingStatus = "confirmed" | "checked-in" | "no-show" | "cancelled";

export interface Booking {
  id: string;
  spaceId: string;
  spaceType: SpaceType;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  allDay: boolean;
  status: BookingStatus;
  bookedBy: string;
  assignedTo: string;
  /** Everyone who may manage this booking (co-ownership). */
  owners: string[];
  checkInTime: string | null;
  createdAt: string;
  note?: string;
}

// ---- Config ----

export interface AccessRule {
  label: string;
  rank: number;
  canBookForOthers: boolean;
  canAccessFlat: boolean;
  canManageAnyBooking: boolean;
}

export interface CarbonConfig {
  factorsKgPerKm: Record<CommuteMode, number>;
  officeDayBaselineKg: number;
  treesPerTonne: number;
}

export interface Config {
  company: string;
  today: string;
  workingHours: { start: string; end: string };
  accessRights: Record<AccessTier, AccessRule>;
  carbon: CarbonConfig;
}
