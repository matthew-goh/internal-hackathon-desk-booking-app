import { useRef, useState } from "react";
import type { Booking, Floor, Space } from "../data/types";
import { usersById, teamsById } from "../data";
import { STATUS_STYLE, bookingsBySpace, type SpaceState } from "../lib/status";

const DESK = 52;

interface Props {
  floor: Floor;
  dayBookings: Booking[];
  onSelect: (space: Space) => void;
  selectedId?: string | null;
}

/**
 * Data-driven SVG plan of a floor. Every space is positioned from office.json,
 * coloured by its booking status for the selected day, shows an occupant card
 * on hover, and opens the booking panel on click.
 */
export default function SpaceMap({ floor, dayBookings, onSelect, selectedId }: Props) {
  const bySpace = bookingsBySpace(dayBookings);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const stateOf = (s: Space): SpaceState =>
    bySpace[s.id] ? bySpace[s.id].status : "free";

  const hoveredSpace = floor.spaces.find((s) => s.id === hovered) ?? null;

  return (
    <div ref={containerRef} className="relative" onMouseMove={onMove}>
      <svg viewBox={`0 0 ${floor.map.width} ${floor.map.height}`} className="h-auto w-full">
        {/* Floor shell — real polygon outline, or a rounded rectangle fallback */}
        {floor.map.outline ? (
          <polygon
            points={floor.map.outline.map(([x, y]) => `${x},${y}`).join(" ")}
            fill={floor.map.background}
            stroke="#94a3b8"
            strokeWidth={3}
            strokeLinejoin="round"
          />
        ) : (
          <rect
            x={0}
            y={0}
            width={floor.map.width}
            height={floor.map.height}
            rx={16}
            fill={floor.map.background}
            stroke="#cbd5e1"
          />
        )}

        {/* Zone backdrops (team neighbourhoods) */}
        {floor.zones.map((z) => (
          <g key={z.id}>
            <rect
              x={z.x}
              y={z.y}
              width={z.width}
              height={z.height}
              rx={16}
              fill={teamsById[z.team]?.color ?? "#94a3b8"}
              opacity={0.06}
            />
            <text x={z.x + 12} y={z.y + 22} className="fill-slate-400" fontSize={13}>
              {z.label}
            </text>
          </g>
        ))}

        {floor.spaces.map((s) => {
          const booking = bySpace[s.id];
          const state = stateOf(s);
          if (s.type === "desk" || s.type === "pod")
            return (
              <DeskIcon
                key={s.id}
                space={s}
                state={state}
                booking={booking}
                selected={selectedId === s.id}
                onEnter={() => setHovered(s.id)}
                onLeave={() => setHovered(null)}
                onClick={() => onSelect(s)}
              />
            );
          return (
            <RoomBox
              key={s.id}
              space={s}
              state={state}
              booking={booking}
              selected={selectedId === s.id}
              onEnter={() => setHovered(s.id)}
              onLeave={() => setHovered(null)}
              onClick={() => onSelect(s)}
            />
          );
        })}
      </svg>

      {hoveredSpace && (
        <Tooltip space={hoveredSpace} booking={bySpace[hoveredSpace.id]} pos={pos} />
      )}
    </div>
  );
}

interface IconProps {
  space: Space;
  state: SpaceState;
  booking?: Booking;
  selected?: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function DeskIcon({ space, state, booking, selected, onEnter, onLeave, onClick }: IconProps) {
  const size = space.width ?? DESK;
  const cx = size / 2;
  const style = STATUS_STYLE[state];
  const isPod = space.type === "pod";
  const occupant = booking ? usersById[booking.assignedTo] : undefined;
  const clipId = `clip-${space.id}`;

  return (
    <g
      transform={`translate(${space.x}, ${space.y})`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      className="cursor-pointer"
    >
      <rect
        width={size}
        height={size}
        rx={10}
        fill={style.fill}
        stroke={selected ? "#4f46e5" : style.stroke}
        strokeWidth={selected ? 4 : 2}
      />
      {occupant ? (
        <>
          <clipPath id={clipId}>
            <circle cx={cx} cy={22} r={14} />
          </clipPath>
          <image
            href={occupant.avatar}
            x={cx - 14}
            y={8}
            width={28}
            height={28}
            clipPath={`url(#${clipId})`}
          />
          {/* Desks show their number; pods would overflow, so rely on the hover card */}
          {!isPod && (
            <text x={cx} y={size - 8} textAnchor="middle" fontSize={11} className="fill-slate-500">
              {space.label}
            </text>
          )}
        </>
      ) : isPod ? (
        <text x={cx} y={cx + 5} textAnchor="middle" fontSize={20}>
          ☎️
        </text>
      ) : (
        <text
          x={cx}
          y={cx + 5}
          textAnchor="middle"
          fontSize={15}
          className="fill-slate-400"
          fontWeight={600}
        >
          {space.label}
        </text>
      )}
    </g>
  );
}

function RoomBox({ space, state, booking, selected, onEnter, onLeave, onClick }: IconProps) {
  const w = space.width ?? 160;
  const h = space.height ?? 100;
  const isFeature = space.type === "feature" || space.type === "kitchen";
  const interactive = !isFeature && space.bookable !== false;
  const style = STATUS_STYLE[state];
  const occupant = booking ? usersById[booking.assignedTo] : undefined;

  // Bookable rooms read green (like the real plan); features/lounges stay neutral.
  let fill: string;
  let stroke: string;
  if (isFeature) {
    fill = "#f1f5f9";
    stroke = "#e2e8f0";
  } else if (interactive) {
    fill = booking ? style.fill : "#ecfdf5";
    stroke = selected ? "#4f46e5" : booking ? style.stroke : "#86efac";
  } else {
    // non-bookable lounge (Salad, Guest Lounge)
    fill = "#f0fdf4";
    stroke = "#bbf7d0";
  }

  const labelFits = w >= 64;

  return (
    <g
      transform={`translate(${space.x}, ${space.y})`}
      onMouseEnter={interactive ? onEnter : undefined}
      onMouseLeave={interactive ? onLeave : undefined}
      onClick={interactive ? onClick : undefined}
      className={interactive ? "cursor-pointer" : undefined}
    >
      <rect
        width={w}
        height={h}
        rx={12}
        fill={fill}
        stroke={stroke}
        strokeWidth={selected ? 4 : 2}
        strokeDasharray={isFeature ? "4 3" : undefined}
      />

      {isFeature ? (
        <>
          {space.icon && (
            <text x={w / 2} y={labelFits ? h / 2 - 4 : h / 2 + 6} textAnchor="middle" fontSize={18}>
              {space.icon}
            </text>
          )}
          {labelFits && (
            <text x={w / 2} y={h / 2 + 16} textAnchor="middle" fontSize={11} className="fill-slate-400">
              {space.label}
            </text>
          )}
        </>
      ) : (
        <>
          <text x={w / 2} y={h / 2 - 4} textAnchor="middle" fontSize={15} fontWeight={600} className="fill-slate-600">
            {space.label}
          </text>
          {space.seats != null && (
            <text x={w / 2} y={h / 2 + 16} textAnchor="middle" fontSize={12} className="fill-slate-400">
              {space.seats} seats
            </text>
          )}
          {occupant && (
            <text x={w / 2} y={h - 12} textAnchor="middle" fontSize={12} className="fill-slate-500">
              {style.label} · {occupant.name.split(" ")[0]}
            </text>
          )}
        </>
      )}
    </g>
  );
}

function Tooltip({
  space,
  booking,
  pos,
}: {
  space: Space;
  booking?: Booking;
  pos: { x: number; y: number };
}) {
  const occupant = booking ? usersById[booking.assignedTo] : undefined;
  const booker = booking ? usersById[booking.bookedBy] : undefined;
  const team = occupant ? teamsById[occupant.team] : undefined;
  const state: SpaceState = booking ? booking.status : "free";
  const style = STATUS_STYLE[state];
  const coOwned = booking ? booking.owners.length > 1 : false;

  return (
    <div
      className="pointer-events-none absolute z-50 w-60 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
      style={{ left: pos.x + 14, top: pos.y + 14 }}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{space.label}</div>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
          style={{ background: style.dot }}
        >
          {style.label}
        </span>
      </div>

      {occupant ? (
        <div className="mt-2 flex items-center gap-2">
          <img src={occupant.avatar} alt="" className="h-9 w-9 rounded-full bg-slate-100" />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{occupant.name}</div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: team?.color }}
              />
              {team?.name}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-sm text-slate-500">
          {space.type === "desk" ? "Free desk" : "Available to book"}
        </div>
      )}

      {booking && (
        <div className="mt-2 space-y-0.5 text-xs text-slate-500">
          <div>{booking.allDay ? "All day" : `${booking.start}–${booking.end}`}</div>
          {coOwned && booker && occupant && booker.id !== occupant.id && (
            <div>
              Co-owned · booked by {booker.name.split(" ")[0]}
            </div>
          )}
        </div>
      )}

      {!booking && space.amenities && space.amenities.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {space.amenities.map((a) => (
            <span key={a} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
              {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
