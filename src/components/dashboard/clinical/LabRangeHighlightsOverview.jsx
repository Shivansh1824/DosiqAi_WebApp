import React from 'react';
import { SlidersHorizontal, ArrowRight } from 'lucide-react';
import { BiomarkerRangeGauge } from './BiomarkerRangeGauge';

/**
 * LabRangeHighlightsOverview
 * 
 * Featured visualizer strip rendered in the Overview tab.
 * Gives immediate graphical Min-to-Max reference visibility for out-of-range or primary biomarkers.
 */
export const LabRangeHighlightsOverview = ({ panels = [], onViewAllRanges }) => {
  // Extract all metrics
  const allMetrics = [];
  panels.forEach(panel => {
    (panel.metrics || []).forEach(m => {
      allMetrics.push({
        ...m,
        category_name: m.category_name || panel.category_name || 'Biomarker',
      });
    });
  });

  if (allMetrics.length === 0) return null;

  // Prioritize abnormal metrics, followed by key benchmarks
  const abnormalMetrics = allMetrics.filter(m => m.is_abnormal);
  const featuredMetrics = abnormalMetrics.length > 0
    ? abnormalMetrics.slice(0, 4)
    : allMetrics.slice(0, 4);

  return (
    <div className="gsap-summary-card bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              {abnormalMetrics.length > 0
                ? 'Reference Range Highlights (Attention Required)'
                : 'Key Biomarker Reference Ranges'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Visual Min/Max spectrums & patient value indicators
            </p>
          </div>
        </div>

        {onViewAllRanges && (
          <button
            type="button"
            onClick={onViewAllRanges}
            className="flex items-center gap-1.5 text-xs font-black text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-3.5 py-1.5 rounded-xl border border-sky-200/70 transition-colors"
          >
            <span>View All Range Charts ({allMetrics.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid of 1 or 2 featured range gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {featuredMetrics.map((metric, idx) => (
          <BiomarkerRangeGauge
            key={`overview-range-${metric.test_name}-${idx}`}
            metric={metric}
            mode="full"
            animate={true}
          />
        ))}
      </div>
    </div>
  );
};
