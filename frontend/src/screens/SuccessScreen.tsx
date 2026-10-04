import { useState } from 'react';
import { CheckCircle, Copy, Check, Printer } from 'lucide-react';
import PrintTicketModal from '../components/PrintTicketModal';

interface SuccessScreenProps {
  orderId: string;
  reservationToken: string;
  quantity: number;
  tierName?: string;
  grandTotal: number;
  onReset: () => void;
}

export default function SuccessScreen({
  orderId,
  reservationToken,
  quantity,
  tierName = 'VIP',
  grandTotal,
  onReset
}: SuccessScreenProps) {
  const [copied, setCopied] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-20 h-20 bg-[#064E3B] border border-[#10B981] rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#10B981] shadow-[0_0_40px_rgba(16,185,129,0.3)]">
        <CheckCircle className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-extrabold text-white">Pembayaran Sukses!</h2>
      <p className="text-sm text-slate-400 mt-2">
        Tiket Anda telah terdaftar permanen di buku besar Neon PostgreSQL dengan garansi zero overselling.
      </p>

      <div className="mt-8 p-6 bg-[#131B2E] border border-[#1E293B] rounded-2xl font-mono text-xs text-left space-y-3 shadow-xl">
        <div className="flex justify-between items-center border-b border-[#1E293B] pb-2">
          <span className="text-slate-500">Order ID</span>
          <div className="flex items-center gap-2">
            <span className="text-white select-all">{orderId.slice(0, 14)}...</span>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-[#1E293B] rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Salin Order ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <div className="flex justify-between border-b border-[#1E293B] pb-2">
          <span className="text-slate-500">Reservation Token</span>
          <span className="text-[#A5B4FC] select-all">{reservationToken}</span>
        </div>
        <div className="flex justify-between border-b border-[#1E293B] pb-2">
          <span className="text-slate-500">Jumlah Tiket</span>
          <span className="text-white">{quantity}x {tierName}</span>
        </div>
        <div className="flex justify-between border-b border-[#1E293B] pb-2">
          <span className="text-slate-500">Total Dibayar</span>
          <span className="text-[#10B981] font-bold">Rp {grandTotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Status Transaksi</span>
          <span className="text-[#10B981] font-bold">PAID (Idempotent Verified)</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setShowPrintModal(true)}
          className="flex-1 py-3.5 bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] rounded-xl text-white font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Cetak / Unduh E-Tiket
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-3.5 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] rounded-xl text-white font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>

      <PrintTicketModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        orderId={orderId}
        reservationToken={reservationToken}
        tierName={tierName}
        quantity={quantity}
        grandTotal={grandTotal}
      />
    </div>
  );
}
