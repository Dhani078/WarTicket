import { CreditCard, ShieldCheck } from 'lucide-react';

export default function CreditCardCard() {
  return (
    <div className="mt-4 p-4 rounded-xl border border-[#6366F1]/40 bg-[#6366F1]/10 space-y-3">
      <div className="flex items-center justify-between text-xs text-[#A5B4FC]">
        <span className="font-semibold flex items-center gap-1.5">
          <CreditCard className="w-4 h-4" /> Kartu Kredit / Debit Online
        </span>
        <span className="flex items-center gap-1 text-[11px] text-[#10B981]">
          <ShieldCheck className="w-3.5 h-3.5" /> 3-D Secure OTP
        </span>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          placeholder="4000 1234 5678 9010"
          defaultValue="4000 1234 5678 9010"
          className="w-full h-10 rounded-lg border border-[#334155] bg-[#0B0F19] px-3 font-mono text-xs text-white outline-none focus:border-[#6366F1]"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="MM/YY"
            defaultValue="11/28"
            className="h-10 rounded-lg border border-[#334155] bg-[#0B0F19] px-3 font-mono text-xs text-white outline-none focus:border-[#6366F1]"
          />
          <input
            type="password"
            placeholder="CVV (3 digit)"
            defaultValue="789"
            maxLength={4}
            className="h-10 rounded-lg border border-[#334155] bg-[#0B0F19] px-3 font-mono text-xs text-white outline-none focus:border-[#6366F1]"
          />
        </div>
      </div>
    </div>
  );
}
