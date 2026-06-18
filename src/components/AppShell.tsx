import type { ReactNode } from "react";
import { useApp, getUser, type View } from "../store";
import { users } from "../data";
import { config } from "../data";

const NAV: { id: View; label: string; icon: string }[] = [
  { id: "floor", label: "Floor", icon: "🗺️" },
  { id: "today", label: "Today", icon: "📍" },
  { id: "insights", label: "Insights", icon: "📊" },
  { id: "profile", label: "Profile", icon: "🙂" },
];

/** Mon–Fri of the demo week. */
const WEEK = [
  { date: "2026-06-15", day: "Mon", num: "15" },
  { date: "2026-06-16", day: "Tue", num: "16" },
  { date: "2026-06-17", day: "Wed", num: "17" },
  { date: "2026-06-18", day: "Thu", num: "18" },
  { date: "2026-06-19", day: "Fri", num: "19" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { view, setView, selectedDate, setSelectedDate, currentUserId, setCurrentUserId } =
    useApp();
  const me = getUser(currentUserId);

  return (
    <div className="flex h-full">
      {/* Left nav */}
      <aside className="flex w-56 flex-col gap-1 border-r border-slate-200 bg-white p-4">
        <div className="mb-6 px-2">
          <div className="text-lg font-semibold tracking-tight">Mercator</div>
          <div className="text-xs text-slate-500">Office Booking</div>
        </div>
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
              view === item.id
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
          {/* Date picker */}
          <div className="flex items-center gap-1.5">
            {WEEK.map((d) => (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className={`flex w-12 flex-col items-center rounded-lg py-1.5 text-xs transition ${
                  selectedDate === d.date
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <span className="font-medium">{d.day}</span>
                <span className="text-base font-semibold leading-none">{d.num}</span>
              </button>
            ))}
            <span className="ml-2 text-xs text-slate-400">Jun 2026</span>
          </div>

          {/* "View as" user switcher */}
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">View as</span>
            <img
              src={me.avatar}
              alt=""
              className="h-8 w-8 rounded-full bg-slate-100 ring-1 ring-slate-200"
            />
            <select
              value={currentUserId}
              onChange={(e) => setCurrentUserId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {config.accessRights[u.accessRights].label}
                </option>
              ))}
            </select>
          </label>
        </header>

        {/* Panel content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
