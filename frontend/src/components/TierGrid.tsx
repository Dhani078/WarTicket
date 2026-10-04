import { Tier } from '../types';

interface TierGridProps {
  tiers: Tier[];
  selectedTier: string;
  onSelectTier: (id: string) => void;
}

export default function TierGrid({ tiers, selectedTier, onSelectTier }: TierGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tiers.map((tier: Tier) => {
        const isSelected = selectedTier === tier.id;
        const perksList = tier.name.toLowerCase().includes('vip')
          ? ['Elevated Lounge Area', 'Fast Track Entrance Gate', 'Free Exclusive Merch', 'Free Flow Beverage']
          : tier.name.toLowerCase().includes('early')
          ? ['Early Entry 16:00 WIB', 'Standing Festival Gate A', 'Commemorative Wristband']
          : ['General Festival Access', 'Standing Festival Gate B', 'Standard Security Screening'];

        return (
          <div
            key={tier.id}
            onClick={() => !tier.is_sold_out && onSelectTier(tier.id)}
            className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 ${
              tier.is_sold_out
                ? 'opacity-40 border-[#1E293B] bg-[#0E1424] cursor-not-allowed'
                : isSelected
                ? 'border-[#6366F1] bg-[#131B2E] shadow-[0_0_0_2px_#6366F1,0_0_32px_rgba(99,102,241,0.25)] cursor-pointer'
                : 'border-[#1E293B] bg-[#131B2E] hover:border-slate-600 cursor-pointer'
            }`}
          >
            {isSelected && !tier.is_sold_out && (
              <span className="absolute -top-3 left-6 rounded-full bg-[#6366F1] px-3 py-0.5 text-xs font-semibold text-white shadow-md">
                Dipilih
              </span>
            )}

            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-lg text-white">{tier.name}</h3>
                {tier.is_sold_out ? (
                  <span className="text-xs bg-red-950 text-red-400 border border-red-800 px-2.5 py-1 rounded font-mono font-semibold">
                    HABIS
                  </span>
                ) : (
                  <span className="text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2.5 py-1 rounded font-mono">
                    Sisa: {tier.available_stock}
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className={`text-2xl md:text-3xl font-bold font-mono text-white ${tier.is_sold_out ? 'line-through text-slate-500' : ''}`}>
                  Rp {tier.price.toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-slate-400">/ tiket</span>
              </div>

              <ul className="mt-6 space-y-2 text-xs text-slate-300">
                {perksList.map((p, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1E293B] flex items-center justify-between">
              <span className="text-xs text-slate-400">Maks. 2 tiket</span>
              <button
                type="button"
                disabled={tier.is_sold_out}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider transition-colors ${
                  tier.is_sold_out
                    ? 'bg-[#1E293B] text-slate-500 cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#6366F1] text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                    : 'bg-[#1E293B] text-slate-300 hover:bg-[#2A374F]'
                }`}
              >
                {tier.is_sold_out ? 'SOLD OUT' : isSelected ? 'TERPILIH' : 'PILIH TIER'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
