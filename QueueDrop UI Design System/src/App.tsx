import { useEffect, useState, type ReactNode } from "react"
import { Device, HoldingBanner, PrimaryButton, TelemetryBadge, TierCard } from "./components/ui"
import EventDetail, { TIERS } from "./screens/EventDetail"
import QueueRoom from "./screens/QueueRoom"
import Checkout from "./screens/Checkout"

function Frame({ w, h, scale, label, children }: { w: number; h: number; scale: number; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[12px] font-medium leading-4 text-mute">{label}</span>
      <div className="overflow-hidden rounded-[16px] border border-line shadow-[0_20px_60px_rgba(0,0,0,0.5)]" style={{ width: w * scale, height: h * scale }}>
        <div className="no-scrollbar relative overflow-y-auto overflow-x-hidden bg-canvas" style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Pair({ vw, dh, mh, mobileWidth = 390, children }: { vw: number; dh: number; mh: number; mobileWidth?: number; children: (d: Device) => ReactNode }) {
  const avail = vw - 64
  const side = Math.min(1, (avail - 48) / (1440 + 390))
  const stacked = side < 0.6
  const ds = stacked ? Math.min(1, avail / 1440) : side
  const ms = stacked ? Math.min(1, avail / mobileWidth) : side
  return (
    <div className={`flex gap-12 ${stacked ? "flex-col" : "flex-row items-start"}`}>
      <Frame w={1440} h={dh} scale={ds} label={`DESKTOP · 1440 × ${dh}`}>
        {children("desktop")}
      </Frame>
      <Frame w={390} h={mh} scale={ms} label={`MOBILE · 390 × ${mh}`}>
        {children("mobile")}
      </Frame>
    </div>
  )
}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[12px] leading-4 text-mute">{label}</span>
      {children}
    </div>
  )
}

function Components() {
  const states = ["default", "hover", "loading", "disabled"] as const
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-6">
        <h2 className="text-[24px] font-semibold">Button/Primary</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {(["desktop", "mobile"] as const).map((dv) =>
            states.map((s) => (
              <Specimen key={dv + s} label={`State=${s}, Device=${dv} (H:${dv === "desktop" ? 48 : 44})`}>
                <PrimaryButton state={s} device={dv}>
                  Lock &amp; Reserve
                </PrimaryButton>
              </Specimen>
            )),
          )}
        </div>
      </section>
      <section className="flex flex-col gap-6">
        <h2 className="text-[24px] font-semibold">Card/TicketTier</h2>
        <div className="grid grid-cols-1 gap-6 pt-3 md:grid-cols-3">
          <Specimen label="State=Default, Device=Desktop">
            <TierCard tier={TIERS[1]} qty={1} />
          </Specimen>
          <Specimen label="State=Selected, Device=Desktop">
            <TierCard tier={TIERS[2]} qty={2} selected />
          </Specimen>
          <Specimen label="State=SoldOut, Device=Desktop">
            <TierCard tier={TIERS[0]} qty={0} />
          </Specimen>
        </div>
        <div className="grid max-w-[1200px] grid-cols-1 gap-6 pt-3 sm:grid-cols-3">
          <Specimen label="State=Default, Device=Mobile">
            <TierCard tier={TIERS[1]} qty={1} device="mobile" />
          </Specimen>
          <Specimen label="State=Selected, Device=Mobile">
            <TierCard tier={TIERS[2]} qty={2} selected device="mobile" />
          </Specimen>
          <Specimen label="State=SoldOut, Device=Mobile">
            <TierCard tier={TIERS[0]} qty={0} device="mobile" />
          </Specimen>
        </div>
      </section>
      <section className="flex flex-col gap-6">
        <h2 className="text-[24px] font-semibold">Pill/TelemetryBadge</h2>
        <div className="flex flex-wrap items-center gap-6">
          <TelemetryBadge />
          <TelemetryBadge compact />
        </div>
      </section>
      <section className="flex flex-col gap-6">
        <h2 className="text-[24px] font-semibold">Banner/HoldingCountdown</h2>
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-[10px]">
            <HoldingBanner time="09:44" />
          </div>
          <div className="w-[390px] max-w-full overflow-hidden rounded-[10px]">
            <HoldingBanner time="09:44" device="mobile" />
          </div>
        </div>
      </section>
    </div>
  )
}

const TABS = [
  { id: "s1", label: "1 · Event & Tiers" },
  { id: "s2", label: "2 · Queue Room" },
  { id: "s3", label: "3 · Checkout" },
  { id: "c", label: "Components" },
]

export default function App() {
  const [tab, setTab] = useState("s1")
  const [vw, setVw] = useState(typeof window === "undefined" ? 1920 : window.innerWidth)
  useEffect(() => {
    const f = () => setVw(window.innerWidth)
    window.addEventListener("resize", f)
    return () => window.removeEventListener("resize", f)
  }, [])

  return (
    <div className="min-h-screen px-8 pb-20">
      <header className="flex flex-wrap items-end justify-between gap-6 py-8">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[12px] font-medium leading-4 tracking-widest text-brand">QUEUEDROP · DESIGN SYSTEM v1</span>
          <h1 className="text-[26px] font-bold leading-8 tracking-tight">Flash-sale ticketing, desktop &amp; mobile</h1>
        </div>
        <nav className="flex gap-1 rounded-[10px] border border-line bg-surface p-1" aria-label="Screens">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-[6px] px-3.5 py-2 text-[14px] font-medium transition-colors ${tab === t.id ? "bg-brand text-white" : "text-ink2 hover:text-ink"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      {tab === "s1" && (
        <Pair vw={vw} dh={1100} mh={1050}>
          {(d) => <EventDetail device={d} />}
        </Pair>
      )}
      {tab === "s2" && (
        <Pair vw={vw} dh={900} mh={844}>
          {(d) => <QueueRoom device={d} />}
        </Pair>
      )}
      {tab === "s3" && (
        <Pair vw={vw} dh={1024} mh={1180}>
          {(d) => <Checkout device={d} />}
        </Pair>
      )}
      {tab === "c" && <Components />}
    </div>
  )
}
