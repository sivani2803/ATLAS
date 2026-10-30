import React from 'react';
import { SensorThresholds, SensorType } from '../types';

interface SensorGaugeProps {
  type: SensorType;
  value: number;
  unit: string;
  thresholds: SensorThresholds;
  className?: string;
}

export const SensorGauge: React.FC<SensorGaugeProps> = ({
  type,
  value,
  unit,
  thresholds,
  className = ''
}) => {
  const isCritical = value >= thresholds.critical;
  const isWarning = !isCritical && value >= thresholds.warning;

  // Max scale estimation based on critical threshold
  const maxScale = Math.max(thresholds.critical * 1.35, value * 1.15, 10);
  const percentage = Math.min(100, Math.max(0, (value / maxScale) * 100));

  const barColor = isCritical
    ? 'bg-rose-600'
    : isWarning
    ? 'bg-amber-500'
    : 'bg-emerald-600';

  const statusLabel = isCritical
    ? 'Critical Exceedance'
    : isWarning
    ? 'Warning Threshold'
    : 'Normal Range';

  const statusTextClass = isCritical
    ? 'text-rose-700 font-bold'
    : isWarning
    ? 'text-amber-800 font-bold'
    : 'text-emerald-700 font-semibold';

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Measurement Level</span>
        <span className={`uppercase tracking-wider text-[11px] ${statusTextClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 border border-slate-300/80">
        <div
          className={`h-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
        {/* Warning Marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-600 z-10"
          style={{ left: `${(thresholds.warning / maxScale) * 100}%` }}
          title={`Warning Threshold: ${thresholds.warning} ${unit}`}
        />
        {/* Critical Marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-rose-600 z-10"
          style={{ left: `${(thresholds.critical / maxScale) * 100}%` }}
          title={`Critical Threshold: ${thresholds.critical} ${unit}`}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>0</span>
        <span className="text-amber-700 font-medium">Warn: {thresholds.warning}{unit}</span>
        <span className="text-rose-700 font-medium">Crit: {thresholds.critical}{unit}</span>
      </div>
    </div>
  );
};
