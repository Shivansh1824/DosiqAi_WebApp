import React, { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';

/**
 * ImageZoomModal
 * Full-screen clinical document lightbox for inspecting photographed prescriptions and lab reports.
 */
export const ImageZoomModal = ({ imageSrc, title = 'Document Preview', onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (imageSrc) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageSrc, onClose]);

  if (!imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div
        className="w-full max-w-4xl flex items-center justify-between py-3 px-4 text-white shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <ZoomIn className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-300">{title}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main image container */}
      <div
        className="relative max-w-4xl max-h-[80vh] flex items-center justify-center overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-black/60"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={imageSrc}
          alt="Zoomed Document"
          className="max-h-[80vh] max-w-full w-auto h-auto object-contain rounded-xl select-none"
        />
      </div>

      <p className="text-[11px] text-slate-400 mt-3 font-medium">
        Click anywhere outside or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Esc</kbd> to close
      </p>
    </div>
  );
};
