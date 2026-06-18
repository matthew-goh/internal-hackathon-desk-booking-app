import { useState } from "react";
import {
  useApp,
  getUser,
  canBookSpace,
  canManage,
} from "../store";
import { users, teamsById } from "../data";
import { STATUS_STYLE } from "../lib/status";
import type { Booking, Space } from "../data/types";

/**
 * Phase 2: book a free space (optionally for a teammate, who becomes a
 * co-owner) or manage an existing booking you own — check in, reassign, or
 * release it. Either owner can manage; that's the co-ownership pain-point fix.
 */
export default function BookingPanel({
  space,
  booking,
  onClose,
}: {
  space: Space;
  booking?: Booking;
  onClose: () => void;
}) {
  const currentUserId = useApp((s) => s.currentUserId);
  const me = getUser(currentUserId);
  const book = useApp((s) => s.book);
  const release = useApp((s) => s.release);
  const checkIn = useApp((s) => s.checkIn);
  const reassign = useApp((s) => s.reassign);

  const [assignee, setAssignee] = useState(currentUserId);

  const state = booking ? booking.status : "free";
  const style = STATUS_STYLE[state];

  return (
    <>
      <div
        className="animate-fade-in fixed inset-0 z-30 bg-slate-900/20"
        onClick={onClose}
        aria-hidden
      />
      <div className="animate-slide-in-right fixed right-0 top-0 z-40 flex h-full w-80 flex-col border-l border-slate-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 p-4">
        <div>
          <div className="text-lg font-semibold">{space.label}</div>
          <div className="text-xs capitalize text-slate-500">
            {space.type}
            {space.seats != null && ` · ${space.seats} seats`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ background: style.dot }}
          >
            {style.label}
          </span>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {booking ? (
          <ManageBooking
            booking={booking}
            canManage={canManage(booking, me)}
            onCheckIn={() => checkIn(booking.id)}
            onRelease={() => {
              release(booking.id);
              onClose();
            }}
            onReassign={(id) => reassign(booking.id, id)}
          />
        ) : canBookSpace(me, space) ? (
          <BookForm
            assignee={assignee}
            setAssignee={setAssignee}
            selfId={currentUserId}
            onBook={() => {
              book({ spaceId: space.id, spaceType: space.type, assignedTo: assignee });
              onClose();
            }}
          />
        ) : (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            {space.bookable === false
              ? "This space isn't bookable — it's shown for orientation."
              : "This space needs elevated access (privileged room)."}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

function BookForm({
  assignee,
  setAssignee,
  selfId,
  onBook,
}: {
  assignee: string;
  setAssignee: (id: string) => void;
  selfId: string;
  onBook: () => void;
}) {
  const forSomeoneElse = assignee !== selfId;
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-500">Book for</label>
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
        >
          <option value={selfId}>Myself</option>
          {users
            .filter((u) => u.id !== selfId)
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
        </select>
      </div>

      {forSomeoneElse && (
        <div className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800">
          {getUser(assignee).name.split(" ")[0]} becomes a <b>co-owner</b> — either of
          you can check in or release this desk.
        </div>
      )}

      <button
        onClick={onBook}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Confirm booking
      </button>
    </div>
  );
}

function ManageBooking({
  booking,
  canManage,
  onCheckIn,
  onRelease,
  onReassign,
}: {
  booking: Booking;
  canManage: boolean;
  onCheckIn: () => void;
  onRelease: () => void;
  onReassign: (userId: string) => void;
}) {
  const assignee = getUser(booking.assignedTo);
  const booker = getUser(booking.bookedBy);
  const team = teamsById[assignee.team];
  const coOwned = booking.owners.length > 1;

  return (
    <div className="space-y-4">
      {/* Occupant */}
      <div className="flex items-center gap-3">
        <img src={assignee.avatar} alt="" className="h-11 w-11 rounded-full bg-slate-100" />
        <div>
          <div className="text-sm font-medium">{assignee.name}</div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: team?.color }} />
            {team?.name}
          </div>
        </div>
      </div>

      <div className="space-y-1 text-xs text-slate-500">
        <div>{booking.allDay ? "All day" : `${booking.start}–${booking.end}`}</div>
        {coOwned ? (
          <div>
            Co-owned · booked by <b>{booker.name.split(" ")[0]}</b>, assigned to{" "}
            <b>{assignee.name.split(" ")[0]}</b>
          </div>
        ) : (
          <div>Booked by {booker.name.split(" ")[0]}</div>
        )}
      </div>

      {canManage ? (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          {booking.status !== "checked-in" && (
            <button
              onClick={onCheckIn}
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Check in
            </button>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500">Reassign to</label>
            <select
              value={booking.assignedTo}
              onChange={(e) => onReassign(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onRelease}
            className="w-full rounded-lg border border-rose-200 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            Release booking
          </button>
        </div>
      ) : (
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          You're not an owner of this booking, so you can't manage it. Owners:{" "}
          {booking.owners.map((id) => getUser(id).name.split(" ")[0]).join(", ")}.
        </div>
      )}
    </div>
  );
}
