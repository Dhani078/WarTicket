import { Printer, X, Ticket, QrCode } from 'lucide-react';

interface PrintTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  reservationToken: string;
  tierName?: string;
  quantity: number;
  grandTotal: number;
}

export default function PrintTicketModal({
  isOpen,
  onClose,
  orderId,
  reservationToken,
  tierName = 'VIP Lounge',
  quantity,
  grandTotal,
}: PrintTicketModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#131B2E] border border-[#334155] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative text-white">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#6366F1]" />
            <span className="font-bold text-base">E-Tiket Resmi WarTiket.id</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#1E293B] bg-[#0E1424] hover:bg-[#1E293B] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Ticket Pass */}
        <div id="printable-ticket" className="bg-[#0B0F19] border-2 border-dashed border-[#334155] rounded-2xl p-6 relative overflow-hidden space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#6366F1] uppercase block">OFFICIAL PASS</span>
              <h2 className="text-xl font-extrabold text-white">Neon Horizon Festival 2026</h2>
              <p className="text-xs text-slate-400">Aurora Arena, Jakarta • 14 November 2026</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center">
              <QrCode className="w-10 h-10 text-black" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1E293B] text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">KATEGORI TIER</span>
              <strong className="text-emerald-400 text-sm">{tierName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">JUMLAH TIKET</span>
              <strong className="text-white text-sm">{quantity} Tiket (x1 Gate Pass)</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ORDER ID</span>
              <span className="text-slate-300 text-[11px] truncate block">{orderId.slice(0, 16)}...</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">TOTAL DIBAYAR</span>
              <strong className="text-[#A5B4FC] text-sm">Rp {grandTotal.toLocaleString('id-ID')}</strong>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>VERIFIED ON NEON PG LEDGER</span>
            <span>TOKEN: {reservationToken.slice(0, 12)}...</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak / Simpan PDF
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-[#334155] rounded-xl text-sm font-semibold text-slate-300 hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
