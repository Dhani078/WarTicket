import { useState } from 'react';
import { Tag, Check, AlertCircle } from 'lucide-react';

interface VoucherInputProps {
  subtotal: number;
  onApplyPromo: (discount: number, code: string) => void;
  appliedCode: string;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export default function VoucherInput({ subtotal, onApplyPromo, appliedCode }: VoucherInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/promos/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), subtotal })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        onApplyPromo(data.discount_amount, data.code);
        setCode('');
      } else {
        setError(data.detail || 'Kode voucher tidak valid.');
      }
    } catch {
      setError('Gagal memvalidasi promo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Kode promo (Cth: WAR50K, LIBURLAND)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#334155] bg-[#0B0F19] text-xs text-white uppercase placeholder:normal-case placeholder:text-slate-500 outline-none focus:border-[#6366F1]"
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-3 py-1.5 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
        >
          {loading ? 'Cek...' : 'Terapkan'}
        </button>
      </div>

      {appliedCode && (
        <div className="flex items-center justify-between text-xs text-[#10B981] bg-[#064E3B]/20 border border-[#10B981]/30 px-3 py-1.5 rounded-lg">
          <span className="flex items-center gap-1.5 font-mono">
            <Check className="w-3.5 h-3.5" /> Voucher {appliedCode} Terpasang
          </span>
          <button
            type="button"
            onClick={() => onApplyPromo(0, '')}
            className="text-[10px] text-slate-400 hover:text-white underline"
          >
            Hapus
          </button>
        </div>
      )}

      {error && (
        <div className="text-[11px] text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}
    </div>
  );
}
