import { useState, useEffect } from 'react';
import { Zap, MapPin, Calendar, ChevronRight, Search, SlidersHorizontal, Clock, LayoutGrid, Map } from 'lucide-react';
import { EventData } from '../types';
import TierGrid from '../components/TierGrid';
import ArenaMap from '../components/ArenaMap';

interface CatalogScreenProps {
  event: EventData;
  selectedTier: string;
  setSelectedTier: (id: string) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  onReserve: () => void;
}

export default function CatalogScreen({
  event,
  selectedTier,
  setSelectedTier,
  quantity,
  setQuantity,
  onReserve
}: CatalogScreenProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'available' | 'price_asc' | 'price_desc'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [heroSeconds, setHeroSeconds] = useState(2 * 3600 + 14 * 60 + 9);

  useEffect(() => {
    const t = setInterval(() => setHeroSeconds((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const formatHeroTimer = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  let filteredTiers = event.tiers.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterMode === 'available') return !t.is_sold_out;
    return true;
  });

  if (filterMode === 'price_asc') {
    filteredTiers = [...filteredTiers].sort((a, b) => a.price - b.price);
  } else if (filterMode === 'price_desc') {
    filteredTiers = [...filteredTiers].sort((a, b) => b.price - a.price);
  }

  const activeTierObj = event.tiers.find((t) => t.id === selectedTier);

  return (
    <div>
      {/* Event Hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-[#1E293B] bg-[#1a1040]">
        <img
          src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&h=640&fit=crop&auto=format"
          alt="Neon Horizon Festival"
          className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0B0F19] via-[#1a1040]/70 to-[#e11d9a]/30" />
        <div className="qd-scan absolute inset-0 pointer-events-none" />

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-md bg-[#6366F1]/20 border border-[#6366F1]/40 px-2.5 py-1 text-xs font-mono font-medium text-[#A5B4FC]">
              <Zap className="w-3.5 h-3.5 text-[#6366F1]" /> FLASH-SALE ACTIVE · REDIS LUA GUARANTEED
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 pt-1">
              <span className="inline-flex items-center gap-1.5 bg-black/40 border border-slate-700/60 px-3 py-1 rounded-md backdrop-blur">
                <MapPin className="w-4 h-4 text-slate-400" /> {event.venue}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-black/40 border border-slate-700/60 px-3 py-1 rounded-md backdrop-blur">
                <Calendar className="w-4 h-4 text-slate-400" />{' '}
                {new Date(event.event_date).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          <div className="bg-black/60 border border-[#334155] rounded-xl p-4 text-right backdrop-blur shrink-0 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-end gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> SALE ENDS IN
            </span>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {formatHeroTimer(heroSeconds)}
            </div>
            <span className="text-[10px] font-mono text-emerald-400 block">Maks. 2 Tiket / User</span>
          </div>
        </div>
      </div>

      {/* Filter, Search & View Switcher Bar */}
      <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kategori tiket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-[#1E293B] bg-[#131B2E] text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#6366F1]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter chips & View Switcher */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs text-slate-500 font-mono hidden lg:inline-flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3 h-3" /> Filter:
            </span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'available', label: 'Tersedia' },
              { id: 'price_asc', label: 'Harga: Termurah' },
              { id: 'price_desc', label: 'Harga: Termahal' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterMode(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  filterMode === f.id
                    ? 'bg-[#6366F1] text-white shadow-sm'
                    : 'bg-[#131B2E] border border-[#1E293B] text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0B0F19] border border-[#1E293B] rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#6366F1] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'map' ? 'bg-[#6366F1] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" /> <span>Peta Arena</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Tier Grid or Interactive Arena Map */}
      {viewMode === 'map' ? (
        <ArenaMap
          tiers={event.tiers}
          selectedTier={selectedTier}
          onSelectTier={(id) => setSelectedTier(id)}
        />
      ) : filteredTiers.length === 0 ? (
        <div className="py-16 text-center bg-[#131B2E] border border-[#1E293B] rounded-2xl p-8 space-y-3">
          <p className="text-slate-400 text-sm">Tidak ada kategori tiket yang cocok dengan filter pencarian.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterMode('all');
            }}
            className="px-4 py-2 rounded-xl bg-[#6366F1] text-xs font-semibold text-white hover:bg-[#4F46E5] transition-colors cursor-pointer"
          >
            Reset Filter &amp; Tampilkan Semua
          </button>
        </div>
      ) : (
        <TierGrid
          tiers={filteredTiers}
          selectedTier={selectedTier}
          onSelectTier={(id) => setSelectedTier(id)}
        />
      )}

      {/* Bottom Bar: Quantity & Reserve Button */}
      <div className="mt-8 p-6 bg-[#131B2E] border border-[#1E293B] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Jumlah Pembelian:</span>
            <div className="flex items-center border border-[#334155] rounded-xl overflow-hidden bg-[#0B0F19]">
              <button
                onClick={() => setQuantity(1)}
                className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  quantity === 1 ? 'bg-[#6366F1] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                1 Tiket
              </button>
              <button
                onClick={() => setQuantity(2)}
                className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  quantity === 2 ? 'bg-[#6366F1] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                2 Tiket
              </button>
            </div>
          </div>

          {activeTierObj && (
            <div className="text-right sm:text-left">
              <span className="text-xs text-slate-400 font-medium">Estimasi Subtotal:</span>
              <div className="text-xl font-bold font-mono text-white">
                Rp {(activeTierObj.price * quantity).toLocaleString('id-ID')}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onReserve}
          disabled={!selectedTier || activeTierObj?.is_sold_out}
          className="w-full sm:w-auto bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(99,102,241,0.4)] cursor-pointer"
        >
          <span>Kunci & Amankan Tiket</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
