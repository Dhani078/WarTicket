import { useState } from 'react';
import { Building2, Copy, Check } from 'lucide-react';

interface VaCardProps {
  grandTotal: number;
}

export default function VirtualAccountCard({ grandTotal }: VaCardProps) {
  const [bank, setBank] = useState('BCA');
  const [copied, setCopied] = useState(false);

  const vaNumbers: Record<string, string> = {
    BCA: '88012 3174 0912 8821',
    Mandiri: '89108 3174 0912 8821',
    BNI: '82770 3174 0912 8821',
    BRI: '80201 3174 0912 8821',
  };

  const va = vaNumbers[bank] || vaNumbers.BCA;

  const handleCopy = () => {
    navigator.clipboard?.writeText(va.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 p-4 rounded-xl border border-[#6366F1]/40 bg-[#6366F1]/10 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#A5B4FC] flex items-center gap-1.5">
          <Building2 className="w-4 h-4" /> Transfer Virtual Account Otomatis
        </span>
        <div className="flex gap-1.5">
          {['BCA', 'Mandiri', 'BNI', 'BRI'].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBank(b)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                bank === b ? 'bg-[#6366F1] text-white shadow' : 'bg-[#0B0F19] text-slate-400 hover:text-white'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 bg-[#0B0F19] rounded-lg border border-[#334155] flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-slate-400 block">NOMOR VIRTUAL ACCOUNT ({bank})</span>
          <span className="font-mono text-sm font-bold text-white tracking-wider">{va}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="px-2.5 py-1 rounded bg-[#1E293B] hover:bg-[#334155] text-xs font-mono text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Tersalin' : 'Salin'}</span>
        </button>
      </div>

      <div className="flex justify-between text-[11px] font-mono text-slate-400">
        <span>Batas waktu bayar: 10 menit</span>
        <span>Total: <strong className="text-white">Rp {grandTotal.toLocaleString('id-ID')}</strong></span>
      </div>
    </div>
  );
}
