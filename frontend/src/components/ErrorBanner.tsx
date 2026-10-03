import { AlertTriangle } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onClose: () => void;
}

export default function ErrorBanner({ message, onClose }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div className="mx-4 md:mx-8 lg:mx-16 mt-4 p-4 bg-red-950/80 border border-red-500 rounded-xl flex items-center justify-between text-red-200 text-sm">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
        <span>{message}</span>
      </div>
      <button
        onClick={onClose}
        className="text-red-300 hover:text-white font-mono text-xs ml-4 cursor-pointer"
        aria-label="Tutup pesan error"
      >
        ✕
      </button>
    </div>
  );
}
