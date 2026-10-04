import { Tier } from '../types';
import { Eye, MapPin } from 'lucide-react';

interface ArenaMapProps {
  tiers: Tier[];
  selectedTier: string;
  onSelectTier: (tierId: string) => void;
}

export default function ArenaMap({ tiers, selectedTier, onSelectTier }: ArenaMapProps) {
  const vipTier = tiers.find((t) => t.name.toLowerCase().includes('vip'));
  const gaTier = tiers.find((t) => t.name.toLowerCase().includes('general'));
  const ebTier = tiers.find((t) => t.name.toLowerCase().includes('early'));

  const isVipSel = selectedTier === vipTier?.id;
  const isGaSel = selectedTier === gaTier?.id;
  const isEbSel = selectedTier === ebTier?.id;

  return (
    <div className="p-6 bg-[#131B2E] border border-[#1E293B] rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#6366F1]" />
          <h3 className="font-bold text-white text-sm">Peta Panggung &amp; Zona Aurora Arena</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <Eye className="w-3 h-3 text-[#10B981]" /> Klik zona peta untuk memilih tier langsung
        </span>
      </div>

      {/* SVG Interactive Arena Floor */}
      <div className="relative w-full max-w-2xl mx-auto bg-[#070A12] border border-[#1E293B] rounded-2xl p-4 overflow-hidden flex items-center justify-center">
        <svg viewBox="0 0 600 360" className="w-full h-auto select-none">
          {/* Background Grid Accent */}
          <defs>
            <linearGradient id="stageGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4338CA" stopOpacity="0.2" />
            </linearGradient>
            <radialGradient id="laserGlow" cx="50%" cy="0%" r="80%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Laser Glow Area */}
          <rect x="0" y="0" width="600" height="360" fill="url(#laserGlow)" />

          {/* 1. MAIN STAGE */}
          <g transform="translate(150, 15)">
            <rect x="0" y="0" width="300" height="45" rx="10" fill="url(#stageGlow)" stroke="#818CF8" strokeWidth="2" />
            <text x="150" y="24" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold" fontFamily="monospace" letterSpacing="2">
              ★ MAIN STAGE · NEON HORIZON ★
            </text>
            <text x="150" y="38" textAnchor="middle" fill="#A5B4FC" fontSize="9" fontFamily="sans-serif">
              DJ Console · Laser Grid · Audio Towers
            </text>
          </g>

          {/* 2. VIP LOUNGE (Front Row / Elevated) */}
          <g
            onClick={() => vipTier && !vipTier.is_sold_out && onSelectTier(vipTier.id)}
            className={`cursor-pointer transition-all duration-200 ${vipTier?.is_sold_out ? 'opacity-40' : 'hover:opacity-90'}`}
          >
            <rect
              x="120"
              y="75"
              width="360"
              height="65"
              rx="12"
              fill={isVipSel ? '#312E81' : '#1E1B4B'}
              stroke={isVipSel ? '#818CF8' : '#4338CA'}
              strokeWidth={isVipSel ? 3 : 1.5}
            />
            <text x="300" y="102" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold">
              👑 VIP LOUNGE ELEVATED
            </text>
            <text x="300" y="122" textAnchor="middle" fill={vipTier?.is_sold_out ? '#F87171' : '#34D399'} fontSize="11" fontFamily="monospace">
              {vipTier?.is_sold_out ? 'HABIS (SOLD OUT)' : `Sisa ${vipTier?.available_stock ?? 0} Tiket · Rp 2.500.000`}
            </text>
          </g>

          {/* 3. EARLY BIRD (Festival Front Floor) */}
          <g
            onClick={() => ebTier && !ebTier.is_sold_out && onSelectTier(ebTier.id)}
            className={`cursor-pointer transition-all duration-200 ${ebTier?.is_sold_out ? 'opacity-40' : 'hover:opacity-90'}`}
          >
            <rect
              x="150"
              y="150"
              width="300"
              height="50"
              rx="10"
              fill={isEbSel ? '#701A75' : '#4A044E'}
              stroke={isEbSel ? '#F472B6' : '#86198F'}
              strokeWidth={isEbSel ? 3 : 1.5}
            />
            <text x="300" y="172" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
              EARLY BIRD ZONE
            </text>
            <text x="300" y="188" textAnchor="middle" fill={ebTier?.is_sold_out ? '#F87171' : '#F472B6'} fontSize="10" fontFamily="monospace">
              {ebTier?.is_sold_out ? 'HABIS' : 'Rp 650.000'}
            </text>
          </g>

          {/* 4. GENERAL ADMISSION (Main Festival Floor) */}
          <g
            onClick={() => gaTier && !gaTier.is_sold_out && onSelectTier(gaTier.id)}
            className={`cursor-pointer transition-all duration-200 ${gaTier?.is_sold_out ? 'opacity-40' : 'hover:opacity-90'}`}
          >
            <rect
              x="80"
              y="210"
              width="440"
              height="95"
              rx="14"
              fill={isGaSel ? '#064E3B' : '#062C22'}
              stroke={isGaSel ? '#34D399' : '#059669'}
              strokeWidth={isGaSel ? 3 : 1.5}
            />
            <text x="300" y="248" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold">
              FESTIVAL GENERAL ADMISSION (STANDING FLOOR)
            </text>
            <text x="300" y="272" textAnchor="middle" fill={gaTier?.is_sold_out ? '#F87171' : '#6EE7B7'} fontSize="11" fontFamily="monospace">
              {gaTier?.is_sold_out ? 'HABIS' : `Sisa ${gaTier?.available_stock ?? 0} Tiket · Rp 990.000`}
            </text>
          </g>

          {/* FOH Audio Booth */}
          <rect x="250" y="315" width="100" height="25" rx="5" fill="#1E293B" stroke="#475569" />
          <text x="300" y="331" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">
            FOH SOUND BOOTH
          </text>
        </svg>
      </div>
    </div>
  );
}
