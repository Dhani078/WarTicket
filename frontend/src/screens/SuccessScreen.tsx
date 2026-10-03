import { CheckCircle } from 'lucide-react';

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
        <div className="flex justify-between border-b border-[#1E293B] pb-2">
          <span className="text-slate-500">Order ID</span>
          <span className="text-white select-all">{orderId}</span>
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

      <button
        onClick={onReset}
        className="mt-8 w-full py-3.5 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] rounded-xl text-white font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] cursor-pointer"
      >
        Kembali ke Beranda Katalog
      </button>
    </div>
  );
}
