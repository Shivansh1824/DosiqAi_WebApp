import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, CheckCircle2, QrCode, ExternalLink } from 'lucide-react';
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

  // Log sync URL to browser console for easy copy/testing
  useEffect(() => {
    if (syncUrl) {
      console.log('[Dosiq Mobile Sync URL]:', syncUrl);
    }
  }, [syncUrl]);

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
    <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-lg relative overflow-hidden">
      
      {/* Subtle background glow */}
      <div
        className="absolute -right-8 -top-8 w-36 h-36 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #10B981, transparent 70%)' }}
      />

      {/* QR Code Container (Compact 100px) */}
      <div className="relative shrink-0 flex flex-col items-center gap-1.5">
        <div className="p-2 bg-white rounded-xl shadow-md border border-slate-700/50 flex items-center justify-center">
          {syncUrl ? (
            <QRCodeSVG
              value={syncUrl}
              size={100}
              level="M"
              includeMargin={false}
              fgColor="#022c22"
              bgColor="#ffffff"
            />
          ) : (
            <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-slate-400">
              <QrCode className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Status Pill */}
        {isSynced ? (
          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-in zoom-in-95">
            <CheckCircle2 className="w-2.5 h-2.5" /> Synced from Phone
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Awaiting phone…</span>
          </span>
        )}
      </div>

      {/* Instructions & Context */}
      <div className="flex-1 flex flex-col gap-1.5 text-left min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-3 h-3" />
            </div>
            <h4 className="text-xs font-black text-white tracking-tight">
              Scan &amp; Snap from Phone
            </h4>
          </div>

          {syncUrl && (
            <a
              href={syncUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>Test tab</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>

        <p className="text-[11px] text-slate-300 leading-snug font-medium">
          Point phone camera at this QR to capture paper document.
        </p>

        {/* 3 Step bullets (compact) */}
        <div className="flex flex-col gap-1 pt-0.5 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-slate-300 font-bold text-[8px] flex items-center justify-center shrink-0">1</span>
            <span>Scan QR with iPhone/Android camera</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-slate-300 font-bold text-[8px] flex items-center justify-center shrink-0">2</span>
            <span>Snap physical document with camera &amp; tap "Send"</span>
          </div>
        </div>
      </div>

    </div>
  );
};
