import React from 'react';
import { AlertTriangle, Info, Check } from 'lucide-react';
import { RiskAssessment, Location, Sensor } from '../types';

export interface CriticalAlertBannerProps {
  assessment?: RiskAssessment | null;
  location?: Location | null;
  locations?: Location[];
  sensors?: Sensor[];
  onAcknowledge?: () => void;
  onInspectNode?: (sensorId: string) => void;
  className?: string;
}

export const CriticalAlertBanner: React.FC<CriticalAlertBannerProps> = ({
  assessment,
  location,
  locations,
  sensors = [],
  onAcknowledge,
  onInspectNode,
  className = ''
}) => {
  // Find target location with elevated critical rating
  const targetLocation = location || (locations ? locations.find(l => l.currentRiskLevel === 'Critical') : null);

  const isAssessmentCritical = assessment && (assessment.riskLevel === 'Critical' || assessment.riskScore >= 75);
  const isLocationCritical = targetLocation && (targetLocation.currentRiskLevel === 'Critical' || targetLocation.currentRiskScore >= 75);

  if (!isAssessmentCritical && !isLocationCritical) {
    return null;
  }

  const locName = targetLocation?.name || 'High-Risk Slope Sector';
  const locCode = targetLocation?.code || 'CRIT-01';
  const locRegion = targetLocation?.region || 'Monitored Range';
  const slopeAngle = targetLocation?.slopeAngle ?? 38;
  const riskScore = assessment?.riskScore ?? targetLocation?.currentRiskScore ?? 75;

  const raw = assessment?.factors?.rawMeasurements || {};
  const disclaimer = assessment?.scientificDisclaimer || 
    'Empirical multi-factor threshold breach under simulated cloudburst pulse.';

  return (
    <div
      role="region"
      aria-label="Demonstration Critical Threshold Scenario"
      className={`relative overflow-hidden rounded-2xl border border-red-200 bg-red-50/70 p-5 shadow-sm ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        
        {/* Left Side: Notice Title, Location, and Classification */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-100 px-3 py-0.5 text-xs font-mono font-bold uppercase tracking-wider text-red-800">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
              <span>[DEMO BENCHMARK] THRESHOLD EXCEEDANCE</span>
            </span>

            <span className="font-mono text-xs text-red-800 font-bold">
              LHI SCORE: {riskScore}/100
            </span>

            <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-700 font-semibold">
              SIMULATED TEST SCENARIO
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
            Simulated High Shear Risk Exercise: <span className="text-red-700">{locName}</span> ({locCode})
          </h3>

          <p className="text-xs text-slate-700 leading-relaxed">
            Multi-sensor geotechnical threshold exceedance on <strong>{slopeAngle}°</strong> slope in {locRegion}. 
            Simulated antecedent rainfall and high pore pressure generate an advisory calculation for algorithm testing.
          </p>
        </div>

        {/* Right Side: Contributing Factors Panel */}
        <div className="rounded-xl border border-red-200 bg-white p-3.5 text-xs space-y-2 lg:min-w-[320px] shadow-sm">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-1 flex justify-between items-center">
            <span>Synthetic Telemetry Inputs</span>
            <span className="text-slate-500 font-normal">SIMULATED EXERCISE</span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            {raw.rainfall ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Precipitation:</span>
                <span className="text-red-700 font-bold">
                  {raw.rainfall.value} {raw.rainfall.unit} 
                  <span className="text-[10px] text-slate-500 ml-1 font-normal">(Crit: {raw.rainfall.criticalThreshold})</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Precipitation:</span>
                <span className="text-red-700 font-bold">58.0 mm/h <span className="text-[10px] text-slate-500 ml-1 font-normal">(Crit: 50.0 mm/h)</span></span>
              </div>
            )}

            {raw.soilMoisture ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Soil Saturation:</span>
                <span className="text-red-700 font-bold">
                  {raw.soilMoisture.value} {raw.soilMoisture.unit} 
                  <span className="text-[10px] text-slate-500 ml-1 font-normal">(Crit: {raw.soilMoisture.criticalThreshold})</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Soil Saturation:</span>
                <span className="text-red-700 font-bold">88.0 % <span className="text-[10px] text-slate-500 ml-1 font-normal">(Crit: 80.0 %)</span></span>
              </div>
            )}

            {raw.porePressure ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Pore Pressure:</span>
                <span className="text-red-700 font-bold">
                  {raw.porePressure.value} {raw.porePressure.unit} 
                  <span className="text-[10px] text-slate-500 ml-1 font-normal">(Crit: {raw.porePressure.criticalThreshold})</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Pore Pressure:</span>
                <span className="text-red-700 font-bold">38.0 kPa <span className="text-[10px] text-slate-500 ml-1 font-normal">(Crit: 45.0 kPa)</span></span>
              </div>
            )}

            {raw.displacement && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Shear Displacement:</span>
                <span className="text-amber-700 font-bold">
                  {raw.displacement.value} {raw.displacement.unit} 
                  <span className="text-[10px] text-slate-500 ml-1 font-normal">(Warn: {raw.displacement.warningThreshold})</span>
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 italic">
              Computational decision-support metric.
            </span>
            {onAcknowledge && (
              <button
                onClick={onAcknowledge}
                className="rounded-lg bg-red-700 hover:bg-red-800 text-white px-3 py-1 font-semibold text-[11px] transition-colors shadow-xs"
              >
                Acknowledge Demo Alert
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Scientific & Operational Disclaimer Footer */}
      <div className="mt-3 rounded-lg bg-white/80 border border-red-200 px-3 py-1.5 text-[11px] text-slate-600 flex items-center gap-2">
        <Info size={13} className="shrink-0 text-red-600" />
        <span>
          <strong>Advisory Limitation:</strong> {disclaimer} This scenario is an algorithmic demonstration using synthetic inputs. It is not an actual emergency evacuation order or certified geotechnical failure forecast.
        </span>
      </div>
    </div>
  );
};

export default CriticalAlertBanner;
