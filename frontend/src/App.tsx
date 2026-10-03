import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Ticket,
  Calendar,
  MapPin,
  ChevronRight,
  QrCode,
  CreditCard,
  Building2,
  RefreshCw
} from 'lucide-react';

interface Tier {
  id: string;
  name: string;
  price: number;
  available_stock: number;
  is_sold_out: boolean;
}

interface EventData {
  id: string;
  title: string;
  venue: string;
  event_date: string;
  tiers: Tier[];
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [event, setEvent] = useState<EventData | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [userId] = useState<string>(() => {
    // Generate valid UUIDv4 format for database compatibility
    return '00000000-0000-4000-8000-' + Math.floor(Math.random() * 0xffffffffffff).toString(16).padStart(12, '0');
  });
  const [step, setStep] = useState<'tiers' | 'queue' | 'checkout' | 'success'>('tiers');
  const [reservationToken, setReservationToken] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [queueProgress, setQueueProgress] = useState<number>(10);
  const [queueSpot, setQueueSpot] = useState<number>(342);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'va' | 'cc'>('qris');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [buyerName, setBuyerName] = useState<string>('Raka Pratama');
  const [buyerNik, setBuyerNik] = useState<string>('3174091288000021');
  const [buyerEmail, setBuyerEmail] = useState<string>('raka@studio.id');
  const [attendees, setAttendees] = useState<Array<{ name: string; email: string }>>([
    { name: 'Raka Pratama', email: 'raka@studio.id' },
    { name: '', email: '' }
  ]);

  const loadEvent = () => {
    setErrorMessage('');
    fetch(`${API_BASE}/api/v1/events/active`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: EventData) => {
        setEvent(data);
        const available = data.tiers.find((t: Tier) => !t.is_sold_out);
        if (available && !selectedTier) {
          setSelectedTier(available.id);
        }
      })
      .catch(() => {
        setErrorMessage('Gagal memuat katalog event. Pastikan backend aktif di http://localhost:8000.');
      });
  };

  useEffect(() => {
    loadEvent();
  }, []);

  // Countdown timer during checkout
  useEffect(() => {
    if (step === 'checkout' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setErrorMessage('Waktu reservasi habis. Tiket telah dilepaskan kembali ke publik.');
            setStep('tiers');
            loadEvent();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  // Queue visual animation
  useEffect(() => {
    if (step === 'queue') {
      const interval = setInterval(() => {
        setQueueProgress((p) => Math.min(95, p + 18));
        setQueueSpot((s) => Math.max(1, Math.floor(s * 0.4)));
      }, 400);
      return () => clearInterval(interval);
    } else {
      setQueueProgress(10);
      setQueueSpot(342);
    }
  }, [step]);

  const handleStartReserve = async () => {
    setErrorMessage('');
    setStep('queue');

    try {
      const res = await fetch(`${API_BASE}/api/v1/tickets/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier_id: selectedTier,
          user_id: userId,
          quantity: quantity
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReservationToken(data.data.reservation_token);
        setOrderId(data.data.order_id);
        setTimeLeft(data.data.holding_time_seconds || 600);
        setStep('checkout');
      } else {
        setErrorMessage(data.detail || 'Gagal mengamankan tiket.');
        setStep('tiers');
        loadEvent();
      }
    } catch {
      setErrorMessage('Koneksi terputus saat menghubungi queue engine Upstash Redis.');
      setStep('tiers');
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/v1/webhooks/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotency_key: `pay_${reservationToken}`,
          order_id: orderId,
          status: 'SUCCESS'
        })
      });
      const data = await res.json();
      if (res.ok && (data.status === 'processed' || data.status === 'ignored')) {
        setStep('success');
      } else {
        setErrorMessage(data.detail || 'Gagal memproses pembayaran pesanan.');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const activeTierObj = event?.tiers.find((t) => t.id === selectedTier);
  const platformFee = 5000;
  const subtotal = activeTierObj ? activeTierObj.price * quantity : 0;
  const grandTotal = subtotal + platformFee;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between selection:bg-[#6366F1] selection:text-white">
      {/* Top Bar */}
      <header className="h-16 border-b border-[#1E293B] px-4 md:px-8 lg:px-16 flex items-center justify-between bg-[#131B2E]/70 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#6366F1] flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.5)]">
            <Ticket className="text-white w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-wider text-white">
              WarTiket<span className="text-[#6366F1]">.id</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 border border-slate-700 rounded px-1.5 py-0.5">
              QueueDrop v1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#064E3B] border border-[#10B981]/50 px-3 py-1 rounded-full text-xs font-mono text-[#A7F3D0]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="hidden sm:inline">Direct Edge: 12ms | Zero Oversell Engine</span>
            <span className="sm:hidden">12ms • Live</span>
          </div>
          <button
            onClick={loadEvent}
            title="Refresh Data"
            className="p-1.5 rounded-lg border border-[#1E293B] bg-[#0E1424] hover:bg-[#1E293B] text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Holding Countdown Banner in Checkout */}
      {step === 'checkout' && (
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
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="mx-4 md:mx-8 lg:mx-16 mt-4 p-4 bg-red-950/80 border border-red-500 rounded-xl flex items-center justify-between text-red-200 text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-red-300 hover:text-white font-mono text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 md:px-8 lg:px-16 py-8 flex-1">
        {/* STEP 1: CATALOG & TIERS */}
        {step === 'tiers' && (
          <div>
            {event ? (
              <>
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

                    <div className="bg-black/60 border border-[#334155] rounded-xl p-4 text-right backdrop-blur shrink-0">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                        MAX TRANSACTION
                      </span>
                      <div className="text-2xl font-bold font-mono text-emerald-400">2 Tiket / User</div>
                    </div>
                  </div>
                </div>

                {/* Section Title */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Pilih Kategori Tiket</h2>
                    <p className="text-sm text-slate-400">
                      Alokasi stok realtime dijamin oleh Redis atomic script tanpa risiko overselling.
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-400 bg-[#131B2E] border border-[#1E293B] px-3 py-1 rounded-lg">
                    {event.tiers.length} Tiers Available
                  </span>
                </div>

                {/* Tier Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {event.tiers.map((tier) => {
                    const isSelected = selectedTier === tier.id;
                    const perksList =
                      tier.name.toLowerCase().includes('vip')
                        ? ['Elevated Lounge Area', 'Fast Track Entrance Gate', 'Free Exclusive Merchandise', 'Free Flow Beverage']
                        : tier.name.toLowerCase().includes('early')
                        ? ['Early Entry 16:00 WIB', 'Standing Festival Gate A', 'Wristband Souvenir']
                        : ['General Festival Access', 'Standing Festival Gate B', 'Standard Security Screening'];

                    return (
                      <div
                        key={tier.id}
                        onClick={() => !tier.is_sold_out && setSelectedTier(tier.id)}
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
                            <span
                              className={`text-2xl md:text-3xl font-bold font-mono text-white ${
                                tier.is_sold_out ? 'line-through text-slate-500' : ''
                              }`}
                            >
                              Rp {tier.price.toLocaleString('id-ID')}
                            </span>
                            <span className="text-xs text-slate-400">/ tiket</span>
                          </div>

                          {/* Perks */}
                          <ul className="mt-6 space-y-2 text-xs text-slate-300">
                            {perksList.map((p, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Bottom action */}
                        <div className="mt-6 pt-4 border-t border-[#1E293B] flex items-center justify-between">
                          <span className="text-xs text-slate-400">Maks. 2 tiket</span>
                          <button
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

                {/* Bottom Bar: Quantity & Reserve Button */}
                <div className="mt-8 p-6 bg-[#131B2E] border border-[#1E293B] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 font-medium">Jumlah Pembelian:</span>
                      <div className="flex items-center border border-[#334155] rounded-xl overflow-hidden bg-[#0B0F19]">
                        <button
                          onClick={() => setQuantity(1)}
                          className={`px-4 py-2 text-sm font-semibold transition-colors ${
                            quantity === 1 ? 'bg-[#6366F1] text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          1 Tiket
                        </button>
                        <button
                          onClick={() => setQuantity(2)}
                          className={`px-4 py-2 text-sm font-semibold transition-colors ${
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
                    onClick={handleStartReserve}
                    disabled={!selectedTier || activeTierObj?.is_sold_out}
                    className="w-full sm:w-auto bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(99,102,241,0.4)]"
                  >
                    <span>Kunci & Amankan Tiket</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="w-12 h-12 rounded-full border-4 border-[#6366F1] border-t-transparent animate-spin mx-auto mb-4" />
                <p className="text-slate-400 font-mono text-sm">Menghubungkan ke database Neon PostgreSQL...</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: ATOMIC QUEUE ROOM */}
        {step === 'queue' && (
          <div className="fixed inset-0 bg-[#0B0F19]/90 backdrop-blur-xl flex items-center justify-center p-6 z-50">
            <div className="bg-[#131B2E] border border-[#334155] p-8 rounded-3xl max-w-lg w-full text-center relative overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
              {/* Radar scanner visual */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                {[0, 0.8, 1.6].map((delay) => (
                  <span
                    key={delay}
                    className="absolute inset-0 rounded-full border border-[#10B981]"
                    style={{ animation: `qd-ring 2.4s ${delay}s ease-out infinite` }}
                  />
                ))}
                <span className="absolute inset-0 rounded-full border border-[#10B981]/40" />
                <span className="absolute inset-[25%] rounded-full border border-[#10B981]/40" />
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg, rgba(16,185,129,0) 0deg, rgba(16,185,129,0.55) 70deg, rgba(16,185,129,0) 72deg)',
                    animation: 'qd-sweep 2.4s linear infinite'
                  }}
                />
                <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#10B981] shadow-[0_0_12px_#10B981]" />
              </div>

              <span className="font-mono text-xs font-semibold tracking-[0.2em] text-[#10B981] uppercase">
                Atomically Verifying Spot
              </span>
              <h2 className="text-4xl font-extrabold font-mono text-white mt-1">#{queueSpot}</h2>
              <p className="text-xs text-slate-400 mt-1">
                dari <span className="font-mono text-slate-200">7.200</span> antrean aktif di cluster Upstash Redis
              </p>

              {/* Progress bar */}
              <div className="mt-6 p-4 bg-[#0B0F19] rounded-2xl border border-[#1E293B] space-y-3">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">ESTIMASI RESPON: <strong className="text-white">00:01s</strong></span>
                  <span className="text-slate-400">DRAIN RATE: <strong className="text-[#10B981]">150 req/s</strong></span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#1E293B]">
                  <div
                    className="qd-bar h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${queueProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>DISPATCHED</span>
                  <span>LUA EXECUTION</span>
                  <span>RESERVED</span>
                </div>
              </div>

              <div className="mt-6 p-3.5 bg-amber-950/40 rounded-xl border border-amber-500/40 text-left flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <strong className="text-[#F59E0B]">Jangan me-refresh atau menutup browser.</strong> Kunci atomik sedang
                  didaftarkan ke Upstash Redis dengan TTL 600 detik.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CHECKOUT */}
        {step === 'checkout' && activeTierObj && (
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
                          TIKET {idx + 1} · {activeTierObj.name.toUpperCase()}
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
                      onClick={() => setPaymentMethod('qris')}
                      className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
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
                      onClick={() => setPaymentMethod('va')}
                      className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
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
                      onClick={() => setPaymentMethod('cc')}
                      className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
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
                        {activeTierObj.name} (x{quantity})
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
                      onClick={handlePayment}
                      disabled={isProcessingPayment}
                      className="w-full py-3.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                    >
                      {isProcessingPayment ? (
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
                      onClick={() => {
                        setStep('tiers');
                        loadEvent();
                      }}
                      className="w-full py-2.5 border border-[#334155] rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors"
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
        )}

        {/* STEP 4: SUCCESS RECEIPT */}
        {step === 'success' && (
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
                <span className="text-white">{quantity}x {activeTierObj?.name}</span>
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
              onClick={() => {
                setStep('tiers');
                setTimeLeft(600);
                loadEvent();
              }}
              className="mt-8 w-full py-3.5 bg-[#6366F1] hover:bg-[#4F46E5] rounded-xl text-white font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            >
              Kembali ke Beranda Katalog
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="h-14 border-t border-[#1E293B] flex items-center justify-between px-6 lg:px-16 text-xs text-slate-500 font-mono bg-[#0B0F19]">
        <span>WarTiket Engine • 0 Oversell Proof-of-Concept</span>
        <span>Upstash Redis + Neon PgBouncer</span>
      </footer>
    </div>
  );
}
