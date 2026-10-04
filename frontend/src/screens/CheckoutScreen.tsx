import React from 'react';
import { ShieldCheck, QrCode, Building2, CreditCard } from 'lucide-react';
import { Tier, PaymentMethod, Attendee } from '../types';
import QrisCard from '../components/QrisCard';

interface CheckoutScreenProps {
  activeTier: Tier;
  quantity: number;
  reservationToken: string;
  orderId: string;
  buyerName: string;
  setBuyerName: (name: string) => void;
  buyerNik: string;
  setBuyerNik: (nik: string) => void;
  buyerEmail: string;
  setBuyerEmail: (email: string) => void;
  attendees: Attendee[];
  setAttendees: React.Dispatch<React.SetStateAction<Attendee[]>>;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (pm: PaymentMethod) => void;
  isProcessing: boolean;
  onPay: () => void;
  onCancel: () => void;
}

export default function CheckoutScreen({
  activeTier,
  quantity,
  reservationToken,
  orderId,
  buyerName,
  setBuyerName,
  buyerNik,
  setBuyerNik,
  buyerEmail,
  setBuyerEmail,
  attendees,
  setAttendees,
  paymentMethod,
  setPaymentMethod,
  isProcessing,
  onPay,
  onCancel
}: CheckoutScreenProps) {
  const platformFee = 5000;
  const subtotal = activeTier.price * quantity;
  const grandTotal = subtotal + platformFee;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Attendee details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Buyer Data */}
          <div className="bg-[#131B2E] border border-[#1E293B] p-6 rounded-2xl">
            <div className="flex items-center gap-3 border-b border-[#1E293B] pb-4 mb-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6366F1]/20 font-mono text-xs font-bold text-[#A5B4FC]">
                1
              </span>
              <h3 className="font-bold text-white text-base">Data Pemesan (Buyer Details)</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Lengkap Sesuai KTP</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full h-11 rounded-xl border border-[#334155] bg-[#0B0F19] px-4 text-sm text-white focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nomor Induk Kependudukan (NIK)</label>
                  <input
                    type="text"
                    value={buyerNik}
                    onChange={(e) => setBuyerNik(e.target.value)}
                    className="w-full h-11 rounded-xl border border-[#334155] bg-[#0B0F19] px-4 font-mono text-sm text-white focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Pengiriman Tiket</label>
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full h-11 rounded-xl border border-[#334155] bg-[#0B0F19] px-4 text-sm text-white focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Attendee Allocation */}
          <div className="bg-[#131B2E] border border-[#1E293B] p-6 rounded-2xl">
            <div className="flex items-center gap-3 border-b border-[#1E293B] pb-4 mb-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6366F1]/20 font-mono text-xs font-bold text-[#A5B4FC]">
                2
              </span>
              <h3 className="font-bold text-white text-base">Alokasi Tiket Pengunjung</h3>
            </div>

            <div className="space-y-4">
              {Array.from({ length: quantity }).map((_, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#334155] bg-[#0B0F19]/60 space-y-3">
                  <span className="text-xs font-mono font-semibold text-[#A5B4FC]">
                    TIKET {idx + 1} · {activeTier.name.toUpperCase()}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nama Pengunjung Sesuai ID"
                      defaultValue={idx === 0 ? buyerName : attendees[idx]?.name || ''}
                      onChange={(e) => {
                        const newAtt = [...attendees];
                        newAtt[idx] = { ...newAtt[idx], name: e.target.value };
                        setAttendees(newAtt);
                      }}
                      className="h-10 rounded-lg border border-[#334155] bg-[#0B0F19] px-3 text-xs text-white outline-none focus:border-[#6366F1]"
                    />
                    <input
                      type="email"
                      placeholder="Email Pengunjung"
                      defaultValue={idx === 0 ? buyerEmail : attendees[idx]?.email || ''}
                      onChange={(e) => {
                        const newAtt = [...attendees];
                        newAtt[idx] = { ...newAtt[idx], email: e.target.value };
                        setAttendees(newAtt);
                      }}
                      className="h-10 rounded-lg border border-[#334155] bg-[#0B0F19] px-3 text-xs text-white outline-none focus:border-[#6366F1]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="bg-[#131B2E] border border-[#1E293B] p-6 rounded-2xl">
            <div className="flex items-center gap-3 border-b border-[#1E293B] pb-4 mb-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6366F1]/20 font-mono text-xs font-bold text-[#A5B4FC]">
                3
              </span>
              <h3 className="font-bold text-white text-base">Metode Pembayaran</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  paymentMethod === 'qris'
                    ? 'border-[#10B981] bg-[#064E3B]/20 ring-1 ring-[#10B981]'
                    : 'border-[#1E293B] bg-[#0B0F19] hover:border-slate-600'
                }`}
              >
                <QrCode className="w-6 h-6 text-[#10B981] mb-2" />
                <div>
                  <div className="font-bold text-sm text-white">QRIS Instant</div>
                  <div className="text-[11px] text-slate-400">GoPay, OVO, BCA, Dana</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('va')}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  paymentMethod === 'va'
                    ? 'border-[#6366F1] bg-[#6366F1]/10 ring-1 ring-[#6366F1]'
                    : 'border-[#1E293B] bg-[#0B0F19] hover:border-slate-600'
                }`}
              >
                <Building2 className="w-6 h-6 text-[#6366F1] mb-2" />
                <div>
                  <div className="font-bold text-sm text-white">Virtual Account</div>
                  <div className="text-[11px] text-slate-400">BCA, Mandiri, BNI, BRI</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cc')}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  paymentMethod === 'cc'
                    ? 'border-[#6366F1] bg-[#6366F1]/10 ring-1 ring-[#6366F1]'
                    : 'border-[#1E293B] bg-[#0B0F19] hover:border-slate-600'
                }`}
              >
                <CreditCard className="w-6 h-6 text-[#6366F1] mb-2" />
                <div>
                  <div className="font-bold text-sm text-white">Credit Card</div>
                  <div className="text-[11px] text-slate-400">Visa, Mastercard, JCB</div>
                </div>
              </button>
            </div>

            {paymentMethod === 'qris' && <QrisCard grandTotal={grandTotal} />}
          </div>
        </div>

        {/* Right Column: Order Summary & Action */}
        <div className="space-y-6">
          <div className="bg-[#131B2E] border border-[#1E293B] p-6 rounded-2xl sticky top-32">
            <h3 className="font-bold text-white text-base border-b border-[#1E293B] pb-4 mb-4">
              Ringkasan Tagihan
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {activeTier.name} (x{quantity})
                </span>
                <span className="font-mono text-white">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Biaya Platform Concurrency</span>
                <span className="font-mono text-white">Rp {platformFee.toLocaleString('id-ID')}</span>
              </div>

              <div className="pt-3 border-t border-[#1E293B] flex justify-between text-sm font-bold">
                <span className="text-white">Total Tagihan</span>
                <span className="font-mono text-[#10B981] text-base">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1E293B] space-y-2">
              <div className="text-[11px] text-slate-400 font-mono">
                <span>Token Kunci: </span>
                <strong className="text-[#A5B4FC]">{reservationToken}</strong>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                <span>Order Ref: </span>
                <span className="text-slate-300">{orderId.slice(0, 18)}...</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={onPay}
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Memproses Transaksi...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Bayar Sekarang ({paymentMethod.toUpperCase()})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 border border-[#334155] rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                Batalkan Reservasi
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-[#1E293B] flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>Idempotent Payment & SSL 256-bit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
