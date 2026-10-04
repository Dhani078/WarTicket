import { Ticket, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  onOpenTelemetry?: () => void;
  onGoHome?: () => void;
}

export default function Header({
  onRefresh,
  isRefreshing = false,
  onOpenTelemetry,
  onGoHome,
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-[#1E293B] px-4 md:px-8 lg:px-16 flex items-center justify-between bg-[#131B2E]/70 backdrop-blur-md sticky top-0 z-40">
      <div
        onClick={onGoHome}
        className="flex items-center gap-3 cursor-pointer group"
        title="Kembali ke Beranda"
      >
        <div className="w-9 h-9 rounded-xl bg-[#6366F1] flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.5)] group-hover:scale-105 transition-transform">
          <Ticket className="text-white w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-wider text-white">
            WarTiket<span className="text-[#6366F1]">.id</span>
          </span>
          <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 border border-slate-700 rounded px-1.5 py-0.5">
            QueueDrop v1
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenTelemetry}
          className="flex items-center gap-2 bg-[#064E3B] border border-[#10B981]/50 hover:border-[#10B981] hover:bg-[#064E3B]/80 px-3 py-1.5 rounded-full text-xs font-mono text-[#A7F3D0] transition-all cursor-pointer shadow-sm active:scale-95"
          title="Klik untuk membuka Realtime Telemetry Monitor"
        >
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
          <span className="hidden sm:inline">Direct Edge: 12ms | Zero Oversell Engine</span>
          <span className="sm:hidden">12ms • Live</span>
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Data Katalog"
          className="p-1.5 rounded-lg border border-[#1E293B] bg-[#0E1424] hover:bg-[#1E293B] text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#6366F1]' : ''}`} />
        </button>
      </div>
    </header>
  );
}
