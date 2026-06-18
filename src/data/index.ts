/**
 * Single import site for the fake dataset.
 * Components and the store import typed data from here — never read JSON directly.
 * Source of truth is the repo-root `data/` folder (see `data/SCHEMA.md`).
 */
import usersJson from "../../data/users.json";
import teamsJson from "../../data/teams.json";
import officeJson from "../../data/office.json";
import bookingsJson from "../../data/bookings.json";
import configJson from "../../data/config.json";

import type { User, Team, Office, Booking, Config } from "./types";

export const users = usersJson as unknown as User[];
export const teams = teamsJson as unknown as Team[];
export const office = officeJson as unknown as Office;
export const bookings = bookingsJson as unknown as Booking[];
export const config = configJson as unknown as Config;

// Convenience lookups built once at module load.
export const usersById: Record<string, User> = Object.fromEntries(
  users.map((u) => [u.id, u]),
);

export const teamsById: Record<string, Team> = Object.fromEntries(
  teams.map((t) => [t.id, t]),
);
