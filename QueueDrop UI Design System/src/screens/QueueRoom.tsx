import { Device, I, Icon, Radar } from "../components/ui"
import { useEffect, useState } from "react"
import EventDetail from "./EventDetail"

const TOTAL_WAIT = 38

function QueueCard({ device }: { device: Device }) {
  const d = device === "desktop"
  const [wait, setWait] = useState(TOTAL_WAIT)
  useEffect(() => {
    const t = setInterval(() => setWait((w) => (w > 0 ? w - 1 : TOTAL_WAIT)), 1000)
    return () => clearInterval(t)
  }, [])
  const pos = Math.max(1, Math.round((314 * wait) / TOTAL_WAIT))
  const pct = ((TOTAL_WAIT - wait) / TOTAL_WAIT) * 100

  return (
    <div
      className={`flex flex-col items-center gap-6 border border-line bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.6)] ${
        d ? "w-[560px] rounded-[20px] p-10" : "w-[358px] rounded-[20px] p-6"
      }`}
    >
      <Radar size={96} />
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="font-mono text-[12px] font-medium leading-4 tracking-[0.2em] text-live">YOUR REAL-TIME SPOT</span>
        <span className="font-mono text-[56px] font-bold leading-none tracking-tight">#{pos}</span>
        <span className="text-[14px] text-ink2">
          out of <span className="font-mono text-ink">7,200</span> waiting requests
        </span>
      </div>

      <div className="flex w-full flex-col gap-4 rounded-[16px] border border-line bg-canvas p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[12px] leading-4 text-mute">ESTIMATED WAIT</span>
            <span className="font-mono text-[18px] font-bold">00:{String(wait).padStart(2, "0")}s</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-line pl-4">
            <span className="font-mono text-[12px] leading-4 text-mute">DRAIN RATE</span>
            <span className="font-mono text-[18px] font-bold text-live">150/sec</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#1E293B]">
            <div className="qd-bar h-full rounded-full transition-[width] duration-1000 ease-linear" style={{ width: `${Math.max(pct, 4)}%` }} />
          </div>
          <div className="flex justify-between font-mono text-[12px] leading-4 text-mute">
            <span>JOINED</span>
            <span>{Math.round(pct)}%</span>
            <span>ENTRY</span>
          </div>
        </div>
      </div>

      <div className="flex w-full items-start gap-3 rounded-[10px] border border-warn/50 bg-warn-dim/60 p-4 text-[14px] leading-5 text-amber-100">
        <Icon d={I.warn} size={18} className="mt-0.5 shrink-0 text-warn" />
        <p>
          <span className="font-semibold text-warn">Cryptographic browser token active.</span> Do not refresh.
        </p>
      </div>
    </div>
  )
}

export default function QueueRoom({ device }: { device: Device }) {
  if (device === "mobile") {
    return (
      <div className="relative flex min-h-full w-full flex-col items-center justify-center bg-canvas px-4 py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_70%)]" />
        <div className="relative">
          <QueueCard device="mobile" />
        </div>
      </div>
    )
  }
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <EventDetail device="desktop" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-[rgba(11,15,25,0.85)] backdrop-blur-[12px]">
        <QueueCard device="desktop" />
      </div>
    </div>
  )
}
