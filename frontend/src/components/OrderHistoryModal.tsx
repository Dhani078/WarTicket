import { X, History, ExternalLink, Calendar, Ticket } from 'lucide-react';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: any) => void;
}

export default function OrderHistoryModal({ isOpen, onClose, onSelectOrder }: OrderHistoryModalProps) {
  if (!isOpen) return null;

  let savedOrders: any[] = [];
  try {
    const raw = localStorage.getItem('wartiket_orders');
    if (raw) savedOrders = JSON.parse(raw);
  } catch {
    // Ignore error
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#131B2E] border border-[#334155] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative text-white">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#6366F1]" />
            <span className="font-bold text-base">Riwayat Tiket Saya</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#1E293B] bg-[#0E1424] hover:bg-[#1E293B] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {savedOrders.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Ticket className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">Belum ada riwayat pesanan tiket di browser ini.</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
            {savedOrders.map((ord, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{ord.tierName || 'Tiket Festival'}</span>
                    <span className="px-2 py-0.5 rounded bg-[#064E3B] text-[#10B981] font-mono text-[10px] font-bold">
                      PAID
                    </span>
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    ID: {ord.orderId?.slice(0, 14)}... • {ord.quantity}x
                  </div>
                  <div className="text-slate-500 text-[10px] flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(ord.timestamp || Date.now()).toLocaleDateString('id-ID')}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectOrder(ord);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#6366F1]/20 hover:bg-[#6366F1] text-[#A5B4FC] hover:text-white font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Pass</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 border border-[#334155] rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
