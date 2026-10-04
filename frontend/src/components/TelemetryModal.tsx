import { useState, useEffect } from 'react';
import { Activity, ShieldCheck, RefreshCw, X, Server, Database, Cpu } from 'lucide-react';

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export default function TelemetryModal({ isOpen, onClose }: TelemetryModalProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState(12);

  const fetchStats = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/stats`);
      const end = performance.now();
      setLatency(Math.max(4, Math.round(end - start)));
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
      const interval = setInterval(fetchStats, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#131B2E] border border-[#334155] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Direct Edge Telemetry</h3>
              <p className="text-xs text-slate-400 font-mono">Live High-Concurrency Telemetry Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-1.5 rounded-lg border border-[#1E293B] bg-[#0E1424] hover:bg-[#1E293B] text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#6366F1]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[#1E293B] bg-[#0E1424] hover:bg-[#1E293B] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Realtime KPI Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-center">
            <span className="text-[10px] font-mono text-slate-400 block mb-1 flex items-center justify-center gap-1">
              <Cpu className="w-3 h-3 text-[#10B981]" /> EDGE LATENCY
            </span>
            <span className="font-mono text-xl font-extrabold text-[#10B981]">{latency}ms</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-center">
            <span className="text-[10px] font-mono text-slate-400 block mb-1 flex items-center justify-center gap-1">
              <Server className="w-3 h-3 text-[#6366F1]" /> REDIS LOCKS
            </span>
            <span className="font-mono text-xl font-extrabold text-[#6366F1]">
              {stats?.active_redis_reservations ?? 0}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-center">
            <span className="text-[10px] font-mono text-slate-400 block mb-1 flex items-center justify-center gap-1">
              <Database className="w-3 h-3 text-amber-400" /> PAID ORDERS
            </span>
            <span className="font-mono text-xl font-extrabold text-white">
              {stats?.orders?.PAID?.count ?? 0}
            </span>
          </div>
        </div>

        {/* Tier Real-time Breakdown */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 font-mono">STOCK INTEGRITY MATRIX</span>
          <div className="space-y-1.5">
            {stats?.tiers?.map((t: any) => (
              <div key={t.id} className="p-2.5 rounded-lg bg-[#0B0F19] border border-[#1E293B] flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-white">{t.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Sold: <strong className="text-emerald-400">{t.sold_stock_db}</strong></span>
                  <span className="text-slate-400">Redis: <strong className="text-[#A5B4FC]">{t.available_stock_redis}</strong></span>
                  <span className="text-slate-500">/ {t.total_stock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-[#064E3B]/20 border border-[#10B981]/40 rounded-xl flex items-center gap-2.5 text-xs text-[#A7F3D0]">
          <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
          <span>Zero Oversell Invariant: Sold DB + Active Redis Reserve + Available = Total Stock (Enforced)</span>
        </div>
      </div>
    </div>
  );
}
