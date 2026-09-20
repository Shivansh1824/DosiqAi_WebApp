import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, CheckCircle2, QrCode, Sparkles, ExternalLink, Wifi } from 'lucide-react';
import { subscribeToMobileSync } from '../../lib/documentService';

/**
 * QrCodeSyncCard
 * Renders a crisp scannable QR Code that opens the MobileUploadView on a smartphone.
 * Subscribes to Supabase Realtime channel to receive the captured photo live.
 */
export const QrCodeSyncCard = ({
  sessionId,
  activeProfile,
  docType,
  onPhotoReceived,
  isSynced,
}) => {
  const patientName = activeProfile?.name || activeProfile?.relationship || 'Family Member';

  // Resolve host: If accessing via localhost on laptop, replace with Wi-Fi network IP so mobile phones can connect
  let baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (isLocalhost && typeof __DEV_LOCAL_IP__ !== 'undefined' && __DEV_LOCAL_IP__ !== 'localhost') {
    const port = window.location.port ? `:${window.location.port}` : '';
    baseOrigin = `${window.location.protocol}//${__DEV_LOCAL_IP__}${port}`;
  }

  // Construct absolute URL for phone camera scanner
  const syncUrl = baseOrigin
    ? `${baseOrigin}/?mobile_upload=true&session=${sessionId}&member=${encodeURIComponent(patientName)}&type=${encodeURIComponent(docType || 'Prescription')}`
    : '';

  // Subscribe to real-time broadcast channel from the mobile device
  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = subscribeToMobileSync(sessionId, (payload) => {
      onPhotoReceived?.(payload);
    });
    return () => {
      unsubscribe?.();
    };
  }, [sessionId, onPhotoReceived]);

  return (
    <div className="flex flex-col md:flex-row items-center gap-5 p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden">
      
      {/* Subtle background glow */}
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #10B981, transparent 70%)' }}
      />

      {/* QR Code Container */}
      <div className="relative shrink-0 flex flex-col items-center gap-2">
        <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-700/50 flex items-center justify-center">
          {syncUrl ? (
            <QRCodeSVG
              value={syncUrl}
              size={144}
              level="M"
              includeMargin={false}
              fgColor="#022c22"
              bgColor="#ffffff"
            />
          ) : (
            <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-slate-400">
              <QrCode className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Status Pill */}
        {isSynced ? (
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full animate-in zoom-in-95">
            <CheckCircle2 className="w-3 h-3" /> Synced from Phone
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Awaiting phone scan…</span>
          </span>
        )}
      </div>

      {/* Instructions & Context */}
      <div className="flex-1 flex flex-col gap-2.5 text-left min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-sm font-black text-white tracking-tight">
            Scan &amp; Snap from Phone
          </h4>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          Have physical paper or a clinic slip? Point your smartphone camera at this QR code to capture a high-res photo.
        </p>

        {/* 3 Step bullets */}
        <div className="flex flex-col gap-1.5 pt-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 font-bold text-[9px] flex items-center justify-center shrink-0">1</span>
            <span>Scan QR with iPhone or Android camera</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 font-bold text-[9px] flex items-center justify-center shrink-0">2</span>
            <span>Snap physical document with phone camera</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 font-bold text-[9px] flex items-center justify-center shrink-0">3</span>
            <span>Tap "Send" — it syncs here automatically</span>
          </div>
        </div>

        {/* Local Wi-Fi note when in local development */}
        {isLocalhost && typeof __DEV_LOCAL_IP__ !== 'undefined' && __DEV_LOCAL_IP__ !== 'localhost' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[10px] text-emerald-300 font-medium">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>LAN Host: <strong className="text-white">{__DEV_LOCAL_IP__}:5173</strong> (phone &amp; Mac must be on same Wi-Fi)</span>
          </div>
        )}

        {/* Quick link for testing in new tab on same machine if needed */}
        {syncUrl && (
          <div className="pt-1">
            <a
              href={syncUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>Test mobile scanner tab</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}
      </div>

    </div>
  );
};
