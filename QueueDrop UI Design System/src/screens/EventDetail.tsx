import { useState } from "react"
import { Device, I, Icon, Logo, PrimaryButton, TelemetryBadge, Tier, TierCard, fmt, useCountdown } from "../components/ui"

export const TIERS: Tier[] = [
  { id: "eb", name: "Early Bird", price: 65, soldOut: true, perks: ["Standing floor access", "Early entry from 6:30 PM", "Commemorative wristband"] },
  { id: "ga", name: "General Admission", price: 99, claimed: 88, perks: ["Standing floor access", "Free digital tour poster", "Fast-lane entry via Gate B"] },
  {
    id: "vip",
    name: "VIP Lounge",
    price: 250,
    left: 8,
    perks: ["Elevated lounge with open bar", "Private entry & fast lane", "Meet & greet lottery entry", "Limited-edition tour pack"],
  },
]

function Hero({ device }: { device: Device }) {
  const t = useCountdown(2 * 3600 + 14 * 60 + 9)
  const d = device === "desktop"
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  const tag = "inline-flex items-center gap-1.5 rounded-[6px] border border-white/15 bg-black/40 px-2.5 py-1 text-[13px] font-medium backdrop-blur"
  return (
    <section
      className={`relative w-full shrink-0 overflow-hidden rounded-[16px] border border-line bg-[#1a1040] ${d ? "h-[320px]" : "h-[180px]"}`}
    >
      <img
        src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&h=640&fit=crop&auto=format"
        alt="Neon-lit festival stage with a DJ silhouette and laser beams"
        className="absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-luminosity"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0B0F19] via-[#2a1068]/70 to-[#e11d9a]/40 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/20 to-transparent" />
      <div className="qd-scan absolute inset-0" />
      <div className={`relative flex h-full items-end justify-between ${d ? "p-10" : "p-4"}`}>
        <div className={`flex flex-col ${d ? "gap-4" : "gap-2.5"}`}>
          <span className="font-mono text-[12px] font-medium leading-4 tracking-widest text-[#67E8F9]">LIVE SALE · WORLD TOUR FINALE</span>
          <h1 className={`font-bold tracking-tight ${d ? "text-[36px] leading-[44px]" : "text-[26px] leading-8"}`}>Neon Horizon 2026</h1>
          <div className="flex flex-wrap gap-2">
            <span className={tag}>
              <Icon d={I.cal} size={14} /> Sat, 14 Nov · 8:00 PM
            </span>
            <span className={tag}>
              <Icon d={I.pin} size={14} /> Aurora Arena, Jakarta
            </span>
          </div>
        </div>
        {d && (
          <div className="flex flex-col items-end gap-2 rounded-[16px] border border-white/15 bg-black/50 px-6 py-4 backdrop-blur">
            <span className="font-mono text-[12px] font-medium leading-4 text-ink2">SALE ENDS IN</span>
            <span className="font-mono text-[36px] font-bold leading-[44px] tracking-tight">
              {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

export default function EventDetail({ device }: { device: Device }) {
  const d = device === "desktop"
  const [sel, setSel] = useState("vip")
  const [qty, setQty] = useState<Record<string, number>>({ ga: 0, vip: 2 })
  const tier = TIERS.find((x) => x.id === sel)!
  const q = qty[sel] ?? 0
  const total = q * tier.price
  const px = d ? "px-12" : "px-4"

  return (
    <div className={`flex min-h-full w-full flex-col bg-canvas ${d ? "gap-8" : "gap-5"}`}>
      <header className={`flex shrink-0 items-center justify-between gap-6 border-b border-line ${px} ${d ? "h-[72px]" : "h-14"}`}>
        <Logo compact={!d} />
        {d ? (
          <>
            <div className="flex h-10 w-[420px] items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 text-ink2">
              <Icon d={I.search} />
              <input placeholder="Search artists, venues, cities" className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-mute" />
              <kbd className="rounded-[6px] border border-line px-1.5 font-mono text-[12px] text-mute">/</kbd>
            </div>
            <TelemetryBadge />
          </>
        ) : (
          <div className="flex items-center gap-4">
            <span className="qd-dot h-2.5 w-2.5 rounded-full bg-live" aria-label="Edge online" />
            <button aria-label="Menu" className="text-ink">
              <Icon d={I.menu} size={22} />
            </button>
          </div>
        )}
      </header>

      <div className={px}>
        <Hero device={device} />
      </div>

      <section className={`${px} flex flex-col gap-4`}>
        <div className="flex items-end justify-between">
          <h2 className={`font-semibold ${d ? "text-[24px] leading-8" : "text-[20px] leading-[26px]"}`}>Choose your tier</h2>
          <span className="font-mono text-[12px] font-medium leading-4 text-ink2">3 TIERS · MAX 8 PER ORDER</span>
        </div>
        <div className={`grid items-stretch ${d ? "grid-cols-3 gap-6 pt-3" : "grid-cols-1 gap-5 pt-2"}`}>
          {TIERS.map((t) => (
            <TierCard
              key={t.id}
              tier={t}
              device={device}
              selected={sel === t.id}
              qty={qty[t.id] ?? 0}
              onSelect={() => {
                setSel(t.id)
                setQty((s) => ({ ...s, [t.id]: s[t.id] || 1 }))
              }}
              onQty={(n) => {
                setSel(t.id)
                setQty((s) => ({ ...s, [t.id]: n }))
              }}
            />
          ))}
        </div>
      </section>

      <div className="min-h-4 flex-1" />
      <div
        className={`sticky bottom-0 z-20 flex shrink-0 items-center justify-between gap-4 border-t border-line bg-surface/95 backdrop-blur ${px} ${
          d ? "h-[88px]" : "h-[76px]"
        }`}
      >
        {d ? (
          <>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[12px] font-medium leading-4 text-ink2">SELECTED</span>
              <span className="text-[18px] font-semibold">
                {q}x {tier.name} <span className="font-mono text-ink2">(${total.toFixed(2)})</span>
              </span>
            </div>
            <PrimaryButton device="desktop" state={q ? "default" : "disabled"}>
              Lock &amp; Reserve Tickets <Icon d={I.arrow} />
            </PrimaryButton>
          </>
        ) : (
          <>
            <div className="flex shrink-0 flex-col">
              <span className="font-mono text-[12px] leading-4 text-ink2">{q}x {tier.id.toUpperCase()}</span>
              <span className="font-mono text-[18px] font-bold">${total.toFixed(2)}</span>
            </div>
            <div className="flex-1">
              <PrimaryButton device="mobile" full state={q ? "default" : "disabled"}>
                Reserve Tickets
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export { fmt }
