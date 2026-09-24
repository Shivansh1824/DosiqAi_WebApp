import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, AlertTriangle, CheckCircle2, Search, Filter } from 'lucide-react';
import { BiomarkerRangeGauge } from './BiomarkerRangeGauge';

/**
 * LabRangeChartsView
 * 
 * Standalone graphical range charts section showcasing all lab parameters
 * along their lower bound (Min), optimal bracket, and upper bound (Max) spectrums.
 */
export const LabRangeChartsView = ({ panels = [] }) => {
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'abnormal' | 'normal'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten all metrics from categories with panel metadata attached
  const allMetrics = useMemo(() => {
    const list = [];
    panels.forEach(panel => {
      (panel.metrics || []).forEach(m => {
        list.push({
          ...m,
          category_name: m.category_name || panel.category_name || 'General Biomarker',
        });
      });
    });
    return list;
  }, [panels]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set();
    allMetrics.forEach(m => {
      if (m.category_name) set.add(m.category_name);
    });
    return Array.from(set);
  }, [allMetrics]);

  // Filtered metrics
  const filteredMetrics = useMemo(() => {
    return allMetrics.filter(m => {
      // Status filter
      if (statusFilter === 'abnormal' && !m.is_abnormal) return false;
      if (statusFilter === 'normal' && m.is_abnormal) return false;

      // Category filter
      if (selectedCategory !== 'all' && m.category_name !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = m.test_name?.toLowerCase().includes(query);
        const catMatch = m.category_name?.toLowerCase().includes(query);
        if (!nameMatch && !catMatch) return false;
      }

      return true;
    });
  }, [allMetrics, statusFilter, selectedCategory, searchQuery]);

  const totalAbnormal = allMetrics.filter(m => m.is_abnormal).length;
  const totalNormal = allMetrics.length - totalAbnormal;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Section Header Banner ── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
              Reference Range Visualizer
            </span>
            <span className="text-xs font-bold text-slate-400">
              {allMetrics.length} Parameters Measured
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Biomarker Range Charts & Spectrums
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Every test plotted along its clinical Min value, target normal bracket, and Max value with patient needle indicators.
          </p>
        </div>

        {/* Quick KPI pills */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-slate-500 font-bold">Total:</span>
            <span className="font-black text-slate-900">{allMetrics.length}</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-800 font-bold">Optimal:</span>
            <span className="font-black text-emerald-900">{totalNormal}</span>
          </div>

          {totalAbnormal > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-rose-800 font-bold">Attention:</span>
              <span className="font-black text-rose-900">{totalAbnormal}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({allMetrics.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('abnormal')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              statusFilter === 'abnormal'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Attention ({totalAbnormal})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('normal')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              statusFilter === 'normal'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Optimal ({totalNormal})
          </button>
        </div>

        {/* Search Bar & Category Filter */}
        <div className="flex items-center gap-2 flex-1 sm:justify-end">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search biomarker or method..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
            />
          </div>

          {categories.length > 1 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              <option value="all">All Panels ({categories.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Category Pill Bar (if multiple categories) ── */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Panels
          </button>
          {categories.map(cat => {
            const count = allMetrics.filter(m => m.category_name === cat).length;
            const isCatActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  isCatActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ── Grid of Graphical Range Gauges ── */}
      {filteredMetrics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMetrics.map((metric, idx) => (
            <BiomarkerRangeGauge
              key={`${metric.test_name}-${idx}`}
              metric={metric}
              mode="full"
              animate={true}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3">
          <Filter className="w-8 h-8 text-slate-300" />
          <h4 className="text-sm font-black text-slate-800">No Biomarkers Found</h4>
          <p className="text-xs text-slate-500 max-w-sm">
            No test parameters matched your current search and filter criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-2 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 px-3.5 py-1.5 rounded-xl border border-sky-200"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
