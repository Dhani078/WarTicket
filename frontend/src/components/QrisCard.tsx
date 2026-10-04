import { QrCode } from 'lucide-react';

interface QrisCardProps {
  grandTotal: number;
}

export default function QrisCard({ grandTotal }: QrisCardProps) {
  return (
    <div className="mt-4 p-4 rounded-xl border border-[#10B981]/40 bg-[#064E3B]/10 flex flex-col sm:flex-row items-center gap-4">
      {/* SVG QR Code Simulation with Indonesian QRIS Styling */}
      <div className="bg-white p-2.5 rounded-xl shadow-lg shrink-0 flex flex-col items-center justify-center">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" className="rounded">
          <rect width="100" height="100" fill="white" />
          {/* Top-left marker */}
          <rect x="8" y="8" width="24" height="24" fill="#0F172A" rx="4" />
          <rect x="14" y="14" width="12" height="12" fill="white" rx="2" />
          <rect x="17" y="17" width="6" height="6" fill="#0F172A" />
          {/* Top-right marker */}
          <rect x="68" y="8" width="24" height="24" fill="#0F172A" rx="4" />
          <rect x="74" y="14" width="12" height="12" fill="white" rx="2" />
          <rect x="77" y="17" width="6" height="6" fill="#0F172A" />
          {/* Bottom-left marker */}
          <rect x="8" y="68" width="24" height="24" fill="#0F172A" rx="4" />
          <rect x="14" y="74" width="12" height="12" fill="white" rx="2" />
          <rect x="17" y="77" width="6" height="6" fill="#0F172A" />
          {/* Data patterns */}
          <rect x="36" y="12" width="6" height="6" fill="#0F172A" />
          <rect x="46" y="8" width="6" height="6" fill="#0F172A" />
          <rect x="56" y="14" width="6" height="6" fill="#0F172A" />
          <rect x="36" y="24" width="6" height="6" fill="#0F172A" />
          <rect x="48" y="20" width="6" height="6" fill="#0F172A" />
          <rect x="12" y="38" width="6" height="6" fill="#0F172A" />
          <rect x="22" y="44" width="6" height="6" fill="#0F172A" />
          <rect x="36" y="38" width="8" height="8" fill="#10B981" />
          <rect x="48" y="44" width="8" height="8" fill="#6366F1" />
          <rect x="62" y="38" width="6" height="6" fill="#0F172A" />
          <rect x="74" y="44" width="6" height="6" fill="#0F172A" />
          <rect x="84" y="38" width="6" height="6" fill="#0F172A" />
          <rect x="38" y="58" width="6" height="6" fill="#0F172A" />
          <rect x="48" y="68" width="6" height="6" fill="#0F172A" />
          <rect x="58" y="58" width="6" height="6" fill="#0F172A" />
          <rect x="68" y="68" width="6" height="6" fill="#0F172A" />
          <rect x="78" y="78" width="6" height="6" fill="#0F172A" />
          <rect x="88" y="68" width="6" height="6" fill="#0F172A" />
        </svg>
        <span className="font-mono text-[9px] font-bold text-slate-800 tracking-wider mt-1">QRIS STANDAR</span>
      </div>

      <div className="space-y-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-[#10B981]">
          <QrCode className="w-4 h-4" />
          <span>QRIS Dinamis Otomatis</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Scan dengan BCA Mobile, Livin', GoPay, OVO, Dana, atau ShopeePay untuk verifikasi instan.
        </p>
        <div className="pt-1 text-xs font-mono text-slate-400">
          Nominal: <strong className="text-white">Rp {grandTotal.toLocaleString('id-ID')}</strong>
        </div>
      </div>
    </div>
  );
}
