import { useState, type ReactNode } from "react"
import { Device, HoldingBanner, I, Icon, Logo, PrimaryButton, fmt, useCountdown } from "../components/ui"

function Field({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[14px] font-medium leading-5 text-ink2">{label}</span>
      <input
        {...p}
        className="h-11 rounded-[10px] border border-line bg-canvas px-3.5 text-[14px] text-ink outline-none transition-colors placeholder:text-mute focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
    </label>
  )
}

function Section({ title, step, children }: { title: string; step: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-[16px] border border-line bg-surface p-6 max-sm:p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/20 font-mono text-[12px] font-bold text-[#A5B4FC]">{step}</span>
        <h2 className="text-[18px] font-semibold leading-6">{title}</h2>
      </div>
      {children}
    </section>
  )
}

const METHODS = [
  { id: "qris", name: "QRIS", note: "Scan with any e-wallet · instant" },
  { id: "va", name: "Virtual Account", note: "BCA, Mandiri, BNI, BRI · up to 10 min" },
  { id: "cc", name: "Credit Card", note: "Visa, Mastercard, JCB · 3-D Secure" },
]

function Summary({ pay }: { pay: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <Lines />
      <Security />
      <PrimaryButton full onClick={pay}>
        Authorize &amp; Pay $553.00
      </PrimaryButton>
    </div>
  )
}

function Lines() {
  const row = "flex justify-between text-[14px] leading-5"
  return (
    <div className="flex flex-col gap-3">
      <div className={row}>
        <span className="text-ink2">2x VIP Lounge · Neon Horizon 2026</span>
        <span className="font-mono">$500.00</span>
      </div>
      <div className={row}>
        <span className="text-ink2">Tax (10%)</span>
        <span className="font-mono">$50.00</span>
      </div>
      <div className={row}>
        <span className="text-ink2">Platform fee</span>
        <span className="font-mono">$3.00</span>
      </div>
      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-[18px] font-semibold">Total</span>
        <span className="font-mono text-[24px] font-bold">$553.00</span>
      </div>
    </div>
  )
}

function Security() {
  return (
    <div className="flex flex-wrap gap-2">
      {["PCI-DSS Level 1", "256-bit TLS", "3-D Secure"].map((b) => (
        <span key={b} className="inline-flex items-center gap-1.5 rounded-[6px] border border-live/40 bg-live-dim/50 px-2 py-1 font-mono text-[12px] font-medium leading-4 text-[#A7F3D0]">
          <Icon d={I.shield} size={12} /> {b}
        </span>
      ))}
    </div>
  )
}

export default function Checkout({ device }: { device: Device }) {
  const d = device === "desktop"
  const t = useCountdown(584)
  const [method, setMethod] = useState("qris")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const pay = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1800)
  }
  const px = d ? "px-12" : "px-4"

  const form = (
    <div className="flex flex-col gap-6 max-sm:gap-4">
      <Section step={1} title="Buyer details">
        <div className={`grid gap-4 ${d ? "grid-cols-2" : "grid-cols-1"}`}>
          <Field label="Full name" defaultValue="Raka Pratama" />
          <Field label="National ID (KTP)" defaultValue="3174 0912 8800 0021" className="h-11 rounded-[10px] border border-line bg-canvas px-3.5 font-mono text-[14px] text-ink outline-none focus:border-brand" />
          <div className={d ? "col-span-2" : ""}>
            <Field label="Email for e-tickets" type="email" defaultValue="raka@studio.id" />
          </div>
        </div>
      </Section>
      <Section step={2} title="Attendee allocation">
        {[1, 2].map((n) => (
          <div key={n} className="flex flex-col gap-3 rounded-[10px] border border-line bg-canvas/60 p-4">
            <span className="font-mono text-[12px] font-medium leading-4 text-ink2">TICKET {n} · VIP LOUNGE</span>
            <div className={`grid gap-4 ${d ? "grid-cols-2" : "grid-cols-1"}`}>
              <Field label="Attendee name" placeholder={n === 1 ? "Raka Pratama" : "Name as on ID"} defaultValue={n === 1 ? "Raka Pratama" : ""} />
              <Field label="Attendee email" type="email" placeholder="name@email.com" defaultValue={n === 1 ? "raka@studio.id" : ""} />
            </div>
          </div>
        ))}
      </Section>
      <Section step={3} title="Payment method">
        <div className="flex flex-col gap-3" role="radiogroup">
          {METHODS.map((m) => (
            <button
              key={m.id}
              role="radio"
              aria-checked={method === m.id}
              onClick={() => setMethod(m.id)}
              className={`flex items-center gap-4 rounded-[10px] border p-4 text-left transition-all ${
                method === m.id ? "border-brand bg-brand/10 shadow-[0_0_0_1px_#6366F1]" : "border-line hover:border-[#475569]"
              }`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${method === m.id ? "border-brand" : "border-mute"}`}>
                {method === m.id && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
              </span>
              <span className="flex flex-col">
                <span className="text-[14px] font-semibold leading-5">{m.name}</span>
                <span className="text-[14px] leading-5 text-ink2">{m.note}</span>
              </span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  )

  return (
    <div className="flex min-h-full w-full flex-col bg-canvas">
      <HoldingBanner time={fmt(t)} device={device} />
      {d ? (
        <div className="flex flex-col gap-6 pt-6">
          <div className={`flex items-center justify-between ${px}`}>
            <Logo />
            <span className="flex items-center gap-2 font-mono text-[12px] font-medium leading-4 text-ink2">
              <Icon d={I.lock} size={14} /> SECURE CHECKOUT · STEP 2 OF 3
            </span>
          </div>
          <div className={`grid grid-cols-[65fr_35fr] items-start gap-6 pb-10 ${px}`}>
            {form}
            <aside className="sticky top-[72px] flex flex-col gap-5 rounded-[16px] border border-line bg-surface p-6">
              <h2 className="text-[18px] font-semibold leading-6">Order summary</h2>
              <Summary pay={pay} />
              {loading && <span className="text-center font-mono text-[12px] text-live">Contacting payment gateway…</span>}
            </aside>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4">
          <div className="rounded-[16px] border border-line bg-surface">
            <button onClick={() => setOpen(!open)} className="flex h-14 w-full items-center justify-between px-4" aria-expanded={open}>
              <span className="text-[14px] font-semibold">Order summary</span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[14px] font-bold">$553.00</span>
                <Icon d={I.chev} className={`transition-transform ${open ? "rotate-180" : ""}`} />
              </span>
            </button>
            {open && (
              <div className="flex flex-col gap-4 border-t border-line p-4">
                <Lines />
                <Security />
              </div>
            )}
          </div>
          {form}
          <div className="flex-1" />
          <div className="sticky bottom-0 z-20 -mx-4 -mb-6 flex h-[76px] items-center gap-4 border-t border-line bg-surface/95 px-4 backdrop-blur">
            <div className="flex shrink-0 flex-col">
              <span className="font-mono text-[12px] leading-4 text-ink2">TOTAL</span>
              <span className="font-mono text-[18px] font-bold">$553.00</span>
            </div>
            <div className="flex-1">
              <PrimaryButton device="mobile" full state={loading ? "loading" : "default"} onClick={pay}>
                Pay via Gateway
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
