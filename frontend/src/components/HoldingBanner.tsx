import { Clock } from 'lucide-react';

interface HoldingBannerProps {
  timeLeft: number;
}

export default function HoldingBanner({ timeLeft }: HoldingBannerProps) {
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="sticky top-16 z-30 flex h-12 w-full shrink-0 items-center justify-center gap-3 bg-[#78350F]/80 border-b border-[#F59E0B]/50 px-4 text-[13px] text-amber-50 backdrop-blur-md">
      <Clock className="w-4 h-4 shrink-0 text-[#F59E0B]" />
      <p className="truncate font-medium">
        <span className="font-bold tracking-wide">TIKET DIKUNCI EKSKLUSIF:</span> Selesaikan pembayaran dalam{' '}
        <span className="rounded bg-black/40 px-2 py-0.5 font-mono font-bold text-[#F59E0B]">
          [{formatTimer(timeLeft)}]
        </span>{' '}
        sebelum dilepas kembali ke antrean publik.
      </p>
    </div>
  );
}
