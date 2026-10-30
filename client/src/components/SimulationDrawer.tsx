import React, { useState } from 'react';
import { CloudRain, SunMedium, Activity, RefreshCw, ChevronUp, ChevronDown, Radio, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export const SimulationDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handlePulse = async (scenario: 'normal' | 'storm_cloudburst' | 'dry_spell') => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.triggerSimulationPulse(scenario);
      setFeedback(`Dispatched ${res.sensorsUpdated} sensor telemetry events (${scenario}). Pipeline recomputed.`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all demonstration sensors, assessments, and readings to baseline?')) return;
    setLoading(true);
    setFeedback(null);
    try {
      await api.resetDemoData();
      setFeedback('Demonstration dataset reset to baseline state.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setFeedback(`Reset failed: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col items-end">
        {/* Toggle Pill */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-full border border-orange-500/50 bg-white/95 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-orange-700 shadow-lg backdrop-blur-md transition-all hover:border-orange-500 hover:bg-orange-50"
        >
          <Radio size={14} className="animate-pulse text-orange-600" />
          <span>Simulation Controller</span>
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {/* Panel Content */}
        {isOpen && (
          <div className="mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-orange-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Telemetry Engine (Demo Mode)
                </h4>
              </div>
              <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-mono text-orange-800 border border-orange-300 font-semibold">
                ACTIVE
              </span>
            </div>

            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
              Triggers realistic sensor streams through the authenticated backend ingestion API, recalculates the Landslide Hazard Index, and broadcasts Socket.IO events.
            </p>

            <div className="mt-3.5 space-y-2">
              <button
                disabled={loading}
                onClick={() => handlePulse('storm_cloudburst')}
                className="w-full flex items-center justify-between rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-xs font-semibold text-red-800 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <CloudRain size={14} className="text-red-600" />
                  Simulate Cloudburst Storm
                </span>
                <span className="text-[10px] text-red-700 font-mono">+Rain/+Pore</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handlePulse('normal')}
                className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Activity size={14} className="text-sky-600" />
                  Stochastic Fluctuation
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Ambient</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handlePulse('dry_spell')}
                className="w-full flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <SunMedium size={14} className="text-emerald-600" />
                  Dry Spell / Stabilization
                </span>
                <span className="text-[10px] text-emerald-700 font-mono">-Moisture</span>
              </button>
            </div>

            {feedback && (
              <div className="mt-3 rounded border border-sky-300 bg-sky-50 p-2 text-[11px] text-sky-800">
                {feedback}
              </div>
            )}

            <div className="mt-4 border-t border-slate-200 pt-2.5">
              <button
                disabled={loading}
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>Reset Demo Dataset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
