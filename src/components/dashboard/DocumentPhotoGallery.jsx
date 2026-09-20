import React from 'react';
import { X, ZoomIn, Plus, FileText } from 'lucide-react';

/**
 * DocumentPhotoGallery
 * Visual grid displaying clean photo cards of all uploaded/synced medical pages.
 * Omits text filenames/metadata per clinical user request, and provides individual deletion + zoom triggers.
 */
export const DocumentPhotoGallery = ({
  files = [],
  onRemove,
  onZoom,
  onAddClick,
}) => {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
      
      {/* Header status */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-slate-800 tracking-wide">
            {files.length === 1 ? '1 Photo Synced' : `${files.length} Photos Synced`}
          </span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            Tap photo to zoom
          </span>
        </div>

        {files.length > 1 && (
          <span className="text-[11px] text-slate-400 font-medium">
            Click (✕) to remove any page
          </span>
        )}
      </div>

      {/* Grid of Photo Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {files.map((f, idx) => (
          <div
            key={f.id || idx}
            onClick={() => f.dataUrl && onZoom?.(f.dataUrl)}
            className="group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-emerald-400/80 bg-slate-950 shadow-md hover:shadow-xl hover:scale-[1.02] cursor-pointer transition-all duration-200 flex items-center justify-center select-none"
            title="Click to zoom in"
          >
            {/* Image / Thumbnail */}
            {f.dataUrl && f.type?.startsWith('image/') ? (
              <img
                src={f.dataUrl}
                alt={`Document page ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-3 text-emerald-400 gap-2">
                <FileText className="w-10 h-10" />
                <span className="text-[10px] font-bold text-slate-300">Document</span>
              </div>
            )}

            {/* Page number badge (bottom-left) */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-bold border border-white/10 pointer-events-none">
              Page {idx + 1}
            </div>

            {/* Zoom hover indicator */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
                <ZoomIn className="w-4 h-4" />
              </div>
            </div>

            {/* Individual Cross / Delete button (top-right) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.(f.id);
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-950/75 hover:bg-rose-600 active:scale-90 text-white flex items-center justify-center shadow-lg border border-white/20 transition-all z-10"
              title="Remove this photo"
              aria-label="Remove photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Add Another Photo Card */}
        {onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-emerald-700 transition-all p-3 group"
            title="Upload another page or photo"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-center">Add Page</span>
          </button>
        )}
      </div>

    </div>
  );
};
