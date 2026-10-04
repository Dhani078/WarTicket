import { useState, useEffect } from 'react';
import { EventData, Tier, StepType, PaymentMethod, Attendee } from './types';
import Header from './components/Header';
import HoldingBanner from './components/HoldingBanner';
import ErrorBanner from './components/ErrorBanner';
import Footer from './components/Footer';
import CatalogScreen from './screens/CatalogScreen';
import QueueModal from './screens/QueueModal';
import CheckoutScreen from './screens/CheckoutScreen';
import SuccessScreen from './screens/SuccessScreen';
import TelemetryModal from './components/TelemetryModal';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [event, setEvent] = useState<EventData | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [userId] = useState<string>(() => {
    return '00000000-0000-4000-8000-' + Math.floor(Math.random() * 0xffffffffffff).toString(16).padStart(12, '0');
  });
  const [step, setStep] = useState<StepType>('tiers');
  const [reservationToken, setReservationToken] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [queueProgress, setQueueProgress] = useState<number>(10);
  const [queueSpot, setQueueSpot] = useState<number>(342);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState<boolean>(false);
  const [buyerName, setBuyerName] = useState<string>('Raka Pratama');
  const [buyerNik, setBuyerNik] = useState<string>('3174091288000021');
  const [buyerEmail, setBuyerEmail] = useState<string>('raka@studio.id');
  const [attendees, setAttendees] = useState<Attendee[]>([
    { name: 'Raka Pratama', email: 'raka@studio.id' },
    { name: '', email: '' }
  ]);

  const loadEvent = () => {
    setIsRefreshing(true);
    setErrorMessage('');
    fetch(`${API_BASE}/api/v1/events/active`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    loadEvent();
  }, []);

  // Live stock polling when browsing catalog
  useEffect(() => {
    if (step === 'tiers') {
      const poller = setInterval(() => {
        fetch(`${API_BASE}/api/v1/events/active`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data: EventData | null) => {
            if (data) setEvent(data);
          })
          .catch(() => {});
      }, 4000);
      return () => clearInterval(poller);
    }
  }, [step]);

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

  const handleCancelReserve = async () => {
    if (reservationToken && orderId) {
      try {
        await fetch(`${API_BASE}/api/v1/tickets/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservation_token: reservationToken, order_id: orderId })
        });
      } catch {
        // Fallback silently; background worker reconciles if network drops
      }
    }
    setStep('tiers');
    loadEvent();
  };

  const activeTierObj = event?.tiers.find((t) => t.id === selectedTier);
  const platformFee = 5000;
  const subtotal = activeTierObj ? activeTierObj.price * quantity : 0;
  const grandTotal = subtotal + platformFee;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between selection:bg-[#6366F1] selection:text-white">
      <Header
        onRefresh={loadEvent}
        isRefreshing={isRefreshing}
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
        onGoHome={() => {
          setStep('tiers');
          loadEvent();
        }}
      />

      {step === 'checkout' && <HoldingBanner timeLeft={timeLeft} />}

      <ErrorBanner message={errorMessage} onClose={() => setErrorMessage('')} />

      <main className="max-w-6xl w-full mx-auto px-4 md:px-8 lg:px-16 py-8 flex-1">
        {step === 'tiers' && (
          <>
            {event ? (
              <CatalogScreen
                event={event}
                selectedTier={selectedTier}
                setSelectedTier={setSelectedTier}
                quantity={quantity}
                setQuantity={setQuantity}
                onReserve={handleStartReserve}
              />
            ) : (
              <div className="text-center py-20">
                <div className="w-12 h-12 rounded-full border-4 border-[#6366F1] border-t-transparent animate-spin mx-auto mb-4" />
                <p className="text-slate-400 font-mono text-sm">Menghubungkan ke database Neon PostgreSQL...</p>
              </div>
            )}
          </>
        )}

        {step === 'queue' && <QueueModal queueSpot={queueSpot} queueProgress={queueProgress} />}

        {step === 'checkout' && activeTierObj && (
          <CheckoutScreen
            activeTier={activeTierObj}
            quantity={quantity}
            reservationToken={reservationToken}
            orderId={orderId}
            buyerName={buyerName}
            setBuyerName={setBuyerName}
            buyerNik={buyerNik}
            setBuyerNik={setBuyerNik}
            buyerEmail={buyerEmail}
            setBuyerEmail={setBuyerEmail}
            attendees={attendees}
            setAttendees={setAttendees}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            isProcessing={isProcessingPayment}
            onPay={handlePayment}
            onCancel={handleCancelReserve}
          />
        )}

        {step === 'success' && (
          <SuccessScreen
            orderId={orderId}
            reservationToken={reservationToken}
            quantity={quantity}
            tierName={activeTierObj?.name}
            grandTotal={grandTotal}
            onReset={() => {
              setStep('tiers');
              setTimeLeft(600);
              loadEvent();
            }}
          />
        )}
      </main>

      <TelemetryModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />

      <Footer />
    </div>
  );
}
