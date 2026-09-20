import React, { useState } from 'react';
import { Camera, CheckCircle2, RefreshCw, Send, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { broadcastMobilePhoto } from '../../lib/documentService';
import { DosiqLogo } from '../common/DosiqLogo';

/**
 * MobileUploadView
 * Rendered when the user scans the QR code from their smartphone.
 * Allows snapping a paper document photo with native camera and sending to desktop via Supabase Realtime.
 */
export const MobileUploadView = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const sessionId = queryParams.get('session');
  const memberName = queryParams.get('member') || 'Family Member';
  const docType = queryParams.get('type') || 'Prescription';

  const [imagePreview, setImagePreview] = useState(null);
  const [fileDetails, setFileDetails] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  // Handle native camera capture from file input
  const handleCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress slightly for fast cross-device realtime broadcast
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 1400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setImagePreview(compressedDataUrl);
        setFileDetails({
          name: file.name || `camera_${Date.now()}.jpg`,
          size: Math.round(compressedDataUrl.length * 0.75),
          type: 'image/jpeg',
        });
      };
      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  };

  // Broadcast photo to desktop via Supabase Realtime
  const handleSendToDesktop = async () => {
    if (!sessionId || !imagePreview) return;

    try {
      setSending(true);
      setError(null);

      await broadcastMobilePhoto(sessionId, {
        name: fileDetails?.name || `phone_capture_${Date.now()}.jpg`,
        size: fileDetails?.size || 150000,
        type: 'image/jpeg',
        dataUrl: imagePreview,
        capturedVia: 'mobile_camera',
      });

      setSending(false);
      setSent(true);
    } catch (err) {
      console.error('Failed to broadcast mobile photo:', err);
      setSending(false);
      setError('Connection timeout. Please ensure your computer screen is still open and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-5 safe-area-inset">
      
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <DosiqLogo size="small" showBadge={false} />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Vault Sync</span>
          </div>
        </div>

        {/* Target Dossier Info */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Target Patient:</span>
            <span className="text-white font-bold">{memberName}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Category:</span>
            <span className="text-emerald-400 font-bold">{docType}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="my-auto py-6 flex flex-col items-center text-center">
        {sent ? (
          <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Document Synced!</h2>
              <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">
                The photo has been transmitted to your computer screen. You can now finalize the upload on desktop.
              </p>
            </div>
            <button
              onClick={() => {
                setImagePreview(null);
                setSent(false);
              }}
              className="mt-4 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Snap Another Photo
            </button>
          </div>
        ) : imagePreview ? (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="relative w-full max-w-xs aspect-[3/4] rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-2xl bg-black">
              <img src={imagePreview} alt="Captured Document" className="w-full h-full object-contain" />
              <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                {Math.round((fileDetails?.size || 0) / 1024)} KB
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-left max-w-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col w-full max-w-xs gap-2 mt-2">
              <button
                type="button"
                onClick={handleSendToDesktop}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitting to Desktop…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send to Dosiq Vault</span>
                  </>
                )}
              </button>

              <label
                htmlFor="retake-photo"
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer text-center border border-slate-800 transition-colors"
              >
                Retake Photo
                <input
                  id="retake-photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleCapture}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 w-full max-w-xs">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-lg font-black text-white">Snap Document Photo</h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Take a clear, flat photo of the paper {docType.toLowerCase()} under good lighting.
              </p>
            </div>

            <label
              htmlFor="native-camera-input"
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 cursor-pointer transition-all"
            >
              <Camera className="w-5 h-5" />
              <span>Open Camera</span>
              <input
                id="native-camera-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCapture}
              />
            </label>
          </div>
        )}
      </div>

      {/* Footer reassurance */}
      <div className="text-center text-[10px] text-slate-500 font-medium pb-2">
        <span>Session ID: {sessionId ? `${sessionId.slice(0, 16)}…` : 'Direct'} · End-to-End Encrypted</span>
      </div>
    </div>
  );
};
