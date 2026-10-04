import { useState, useEffect } from 'react';
import { Activity, ShieldCheck, RefreshCw, X, Server, Database, Cpu, PlusCircle } from 'lucide-react';
import { sound } from '../utils/sound';

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export default function TelemetryModal({ isOpen, onClose }: TelemetryModalProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState(12);
  const [restockingId, setRestockingId] = useState<string | null>(null);

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

  const handleRestock = async (tierId: string, additional: number) => {
    setRestockingId(tierId);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/tiers/${tierId}/adjust-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additional_stock: additional })
      });
      if (res.ok) {
        sound.playChime();
        await fetchStats();
      }
    } catch {
      // Error handled
    } finally {
      setRestockingId(null);
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
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 font-mono">STOCK INTEGRITY MATRIX</span>
            <span className="text-[10px] text-slate-500 font-mono">Quick Admin Restock</span>
          </div>
          <div className="space-y-2">
            {stats?.tiers?.map((t: any) => (
              <div key={t.id} className="p-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div>
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Sold DB: <strong className="text-emerald-400">{t.sold_stock_db}</strong> • Redis: <strong className="text-[#A5B4FC]">{t.available_stock_redis}</strong> / {t.total_stock}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    disabled={restockingId === t.id}
                    onClick={() => handleRestock(t.id, 10)}
                    className="px-2 py-1 bg-[#1E293B] hover:bg-[#6366F1] hover:text-white text-slate-300 rounded text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title="Tambah 10 stok live ke Neon DB dan Redis"
                  >
                    <PlusCircle className="w-3 h-3" /> +10
                  </button>
                  <button
                    disabled={restockingId === t.id}
                    onClick={() => handleRestock(t.id, 50)}
                    className="px-2 py-1 bg-[#1E293B] hover:bg-[#6366F1] hover:text-white text-slate-300 rounded text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title="Tambah 50 stok live ke Neon DB dan Redis"
                  >
                    <PlusCircle className="w-3 h-3" /> +50
                  </button>
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
