import { AlertTriangle } from 'lucide-react';

interface QueueModalProps {
  queueSpot: number;
  queueProgress: number;
}

export default function QueueModal({ queueSpot, queueProgress }: QueueModalProps) {
  return (
    <div className="fixed inset-0 bg-[#0B0F19]/90 backdrop-blur-xl flex items-center justify-center p-6 z-50">
      <div className="bg-[#131B2E] border border-[#334155] p-8 rounded-3xl max-w-lg w-full text-center relative overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
        {/* Radar scanner visual */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          {[0, 0.8, 1.6].map((delay) => (
            <span
              key={delay}
              className="absolute inset-0 rounded-full border border-[#10B981]"
              style={{ animation: `qd-ring 2.4s ${delay}s ease-out infinite` }}
            />
          ))}
          <span className="absolute inset-0 rounded-full border border-[#10B981]/40" />
          <span className="absolute inset-[25%] rounded-full border border-[#10B981]/40" />
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(16,185,129,0) 0deg, rgba(16,185,129,0.55) 70deg, rgba(16,185,129,0) 72deg)',
              animation: 'qd-sweep 2.4s linear infinite'
            }}
          />
          <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#10B981] shadow-[0_0_12px_#10B981]" />
        </div>

        <span className="font-mono text-xs font-semibold tracking-[0.2em] text-[#10B981] uppercase">
          Atomically Verifying Spot
        </span>
        <h2 className="text-4xl font-extrabold font-mono text-white mt-1">#{queueSpot}</h2>
        <p className="text-xs text-slate-400 mt-1">
          dari <span className="font-mono text-slate-200">7.200</span> antrean aktif di cluster Upstash Redis
        </p>

        {/* Progress bar */}
        <div className="mt-6 p-4 bg-[#0B0F19] rounded-2xl border border-[#1E293B] space-y-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">ESTIMASI RESPON: <strong className="text-white">00:01s</strong></span>
            <span className="text-slate-400">DRAIN RATE: <strong className="text-[#10B981]">150 req/s</strong></span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#1E293B]">
            <div
              className="qd-bar h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${queueProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>DISPATCHED</span>
            <span>LUA EXECUTION</span>
            <span>RESERVED</span>
          </div>
        </div>

        <div className="mt-6 p-3.5 bg-amber-950/40 rounded-xl border border-amber-500/40 text-left flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            <strong className="text-[#F59E0B]">Jangan me-refresh atau menutup browser.</strong> Kunci atomik sedang
            didaftarkan ke Upstash Redis dengan TTL 600 detik.
          </div>
        </div>
      </div>
    </div>
  );
}
