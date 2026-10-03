import { useEffect, useState, type ReactNode } from "react"

export type Device = "desktop" | "mobile"

export function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

export function useCountdown(start: number) {
  const [s, setS] = useState(start)
  useEffect(() => {
    const t = setInterval(() => setS((v) => (v > 0 ? v - 1 : start)), 1000)
    return () => clearInterval(t)
  }, [start])
  return s
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <rect width="28" height="28" rx="8" fill="#6366F1" />
        <path d="M8 9h12M8 14h8M8 19h4" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="20" cy="19" r="2.4" fill="#10B981" />
      </svg>
      {!compact && <span className="text-[18px] font-bold tracking-tight">QueueDrop</span>}
      {compact && <span className="text-[16px] font-bold tracking-tight">QueueDrop</span>}
    </div>
  )
}

export function Icon({ d, size = 16, className = "" }: { d: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  )
}
export const I = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  menu: "M4 7h16M4 12h16M4 17h16",
  check: "M5 13l4 4L19 7",
  arrow: "M5 12h14M13 6l6 6-6 6",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  cal: "M7 3v4M17 3v4M4 9h16M5 5h14v15H5z",
  pin: "M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  warn: "M12 3l10 18H2zM12 10v5M12 18v.01",
  chev: "M6 9l6 6 6-6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
}

type BtnState = "default" | "hover" | "loading" | "disabled"
export function PrimaryButton({
  children,
  state = "default",
  device = "desktop",
  full,
  onClick,
}: {
  children: ReactNode
  state?: BtnState
  device?: Device
  full?: boolean
  onClick?: () => void
}) {
  const disabled = state === "disabled"
  const base = disabled
    ? "bg-[#1E293B] text-[#475569] cursor-not-allowed"
    : `text-white cursor-pointer active:bg-brand-active ${state === "hover" ? "bg-brand-hover" : "bg-brand hover:bg-brand-hover"}`
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-6 text-[14px] font-semibold transition-colors ${base} ${
        device === "desktop" ? "h-12" : "h-11"
      } ${full ? "w-full" : ""} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}
    >
      {state === "loading" && (
        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white" style={{ animation: "qd-spin .7s linear infinite" }} />
      )}
      {state === "loading" ? "Processing…" : children}
    </button>
  )
}

export function TelemetryBadge({ compact }: { compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-live bg-live-dim px-3 py-1.5 font-mono text-[12px] font-medium leading-4 text-[#A7F3D0]">
      <span className="qd-dot h-2 w-2 shrink-0 rounded-full bg-live" />
      {compact ? "12ms" : "Direct Edge: 12ms latency | 99.9% Uptime"}
    </div>
  )
}

export function HoldingBanner({ time, device = "desktop" }: { time: string; device?: Device }) {
  return (
    <div className="sticky top-0 z-30 flex h-12 w-full shrink-0 items-center justify-center gap-3 bg-warn-dim px-4 text-[13px] text-amber-50">
      <Icon d={I.clock} size={16} className="shrink-0 text-warn" />
      <p className="truncate font-medium">
        <span className="font-bold tracking-wide">{device === "desktop" ? "TICKETS RESERVED:" : "RESERVED:"}</span>{" "}
        {device === "desktop" ? "Complete checkout in " : "Pay in "}
        <span className="rounded-[6px] bg-black/30 px-1.5 py-0.5 font-mono font-bold text-warn">[{time}]</span>
        {device === "desktop" ? " before release to pool." : " or release"}
      </p>
    </div>
  )
}

export type Tier = {
  id: string
  name: string
  price: number
  perks: string[]
  soldOut?: boolean
  claimed?: number
  left?: number
}

export function Stepper({ qty, onChange, disabled }: { qty: number; onChange: (n: number) => void; disabled?: boolean }) {
  const b = "flex h-9 w-9 items-center justify-center text-[18px] text-ink transition-colors enabled:hover:bg-white/10 disabled:text-mute"
  return (
    <div className="inline-flex items-center rounded-[10px] border border-line bg-canvas">
      <button aria-label="Decrease" disabled={disabled || qty <= 0} onClick={(e) => (e.stopPropagation(), onChange(qty - 1))} className={`${b} rounded-l-[10px]`}>
        −
      </button>
      <span className="w-9 text-center font-mono text-[14px] font-medium">{qty}</span>
      <button aria-label="Increase" disabled={disabled || qty >= 8} onClick={(e) => (e.stopPropagation(), onChange(qty + 1))} className={`${b} rounded-r-[10px]`}>
        +
      </button>
    </div>
  )
}

export function TierCard({
  tier,
  selected,
  qty,
  device = "desktop",
  onSelect,
  onQty,
}: {
  tier: Tier
  selected?: boolean
  qty: number
  device?: Device
  onSelect?: () => void
  onQty?: (n: number) => void
}) {
  const so = tier.soldOut
  const pad = device === "desktop" ? "p-6" : "p-4"
  return (
    <div
      role="button"
      tabIndex={so ? -1 : 0}
      onClick={so ? undefined : onSelect}
      onKeyDown={(e) => !so && (e.key === "Enter" || e.key === " ") && onSelect?.()}
      className={`relative flex w-full flex-col gap-4 rounded-[16px] border bg-surface ${pad} transition-all ${so ? "opacity-40" : "cursor-pointer"} ${
        selected && !so
          ? "border-brand shadow-[0_0_0_1px_#6366F1,0_0_32px_rgba(99,102,241,0.35)]"
          : "border-line hover:border-[#475569]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[18px] font-semibold leading-6">{tier.name}</h3>
        {so ? (
          <span className="rounded-[6px] bg-danger px-2 py-1 font-mono text-[12px] font-medium leading-4 text-white">SOLD OUT</span>
        ) : tier.left ? (
          <span className="rounded-[6px] border border-warn/50 bg-warn-dim px-2 py-1 font-mono text-[12px] font-medium leading-4 text-warn">Only {tier.left} left</span>
        ) : (
          <span className="rounded-[6px] bg-warn-dim px-2 py-1 font-mono text-[12px] font-medium leading-4 text-warn">High Demand</span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-[32px] font-bold leading-10 tracking-tight ${so ? "line-through decoration-2" : ""}`}>${tier.price}</span>
        <span className="text-[14px] text-ink2">/ ticket</span>
      </div>

      {tier.claimed !== undefined && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between font-mono text-[12px] font-medium leading-4">
            <span className="text-warn">{tier.claimed}% CLAIMED</span>
            <span className="text-mute">{100 - tier.claimed}% LEFT</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#1E293B]">
            <div className="h-full rounded-full bg-warn" style={{ width: `${tier.claimed}%` }} />
          </div>
        </div>
      )}
      {tier.left !== undefined && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between font-mono text-[12px] font-medium leading-4">
            <span className="text-danger">CRITICAL STOCK</span>
            <span className="text-mute">{tier.left} / 120</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#1E293B]">
            <div className="h-full rounded-full bg-danger" style={{ width: "93%" }} />
          </div>
        </div>
      )}
      {so && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between font-mono text-[12px] font-medium leading-4">
            <span className="text-danger">100% CLAIMED</span>
            <span className="text-mute">0 LEFT</span>
          </div>
          <div className="h-2 rounded-full bg-danger" />
        </div>
      )}

      <ul className="flex flex-1 flex-col gap-2.5 text-[14px] leading-5 text-ink2">
        {tier.perks.map((p) => (
          <li key={p} className="flex items-start gap-2.5">
            <Icon d={I.check} size={16} className="mt-0.5 shrink-0 text-live" />
            {p}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-line pt-4">
        <span className="text-[14px] font-medium text-ink2">Quantity</span>
        <Stepper qty={so ? 0 : qty} disabled={so} onChange={(n) => onQty?.(n)} />
      </div>
      {selected && !so && (
        <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-0.5 text-[12px] font-semibold leading-4 text-white">Selected</span>
      )}
    </div>
  )
}

export function Radar({ size = 96 }: { size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {[0, 0.8, 1.6].map((d) => (
        <span key={d} className="absolute inset-0 rounded-full border border-live" style={{ animation: `qd-ring 2.4s ${d}s ease-out infinite` }} />
      ))}
      <span className="absolute inset-0 rounded-full border border-live/40" />
      <span className="absolute inset-[18%] rounded-full border border-live/40" />
      <span className="absolute inset-[36%] rounded-full border border-live/40" />
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: "conic-gradient(from 0deg, rgba(16,185,129,0) 0deg, rgba(16,185,129,0.55) 70deg, rgba(16,185,129,0) 72deg)", animation: "qd-sweep 2.4s linear infinite" }}
      />
      <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-live shadow-[0_0_12px_#10B981]" />
    </div>
  )
}
