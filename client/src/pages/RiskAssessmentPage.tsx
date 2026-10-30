import React, { useState, useEffect } from 'react';
import {
  Activity,
  MapPin,
  Radio,
  Layers,
  RefreshCw,
  Info,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
  ArrowRight,
  Database,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/RiskBadge';
import { GeospatialMap } from '../components/GeospatialMap';
import { CriticalAlertBanner } from '../components/CriticalAlertBanner';
import { SensorGauge } from '../components/SensorGauge';
import { Location, Sensor, RiskAssessment, RiskLevel } from '../types';

export const RiskAssessmentPage: React.FC = () => {
  const { isOperator } = useAuth();
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessment | null>(null);
  const [locationSensors, setLocationSensors] = useState<Sensor[]>([]);
  const [configData, setConfigData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Active View Tab on /assessment: 'map' | 'mesh' | 'formula'
  const [activeTab, setActiveTab] = useState<'map' | 'mesh' | 'formula'>('map');

  const fetchAssessmentData = async () => {
    try {
      const [assList, locList, cfg] = await Promise.all([
        api.getLatestAssessments(),
        api.getLocations(),
        api.getAssessmentConfig()
      ]);

      setAssessments(assList || []);
      setLocations(locList || []);
      setConfigData(cfg);

      if (locList.length > 0 && !selectedLocation) {
        handleSelectLocation(locList[0]);
      } else if (selectedLocation) {
        // sync updated location
        const updated = locList.find(l => l._id === selectedLocation._id);
        if (updated) setSelectedLocation(updated);
      }
    } catch (err) {
      console.error('Failed to load risk assessment suite:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessmentData();
  }, []);

  const handleSelectLocation = async (loc: Location) => {
    setSelectedLocation(loc);

    // Find assessment for this location
    const ass = assessments.find(a => {
      const id = typeof a.location === 'object' ? a.location?._id : a.location;
      return id === loc._id;
    });
    if (ass) setSelectedAssessment(ass);

    // Query sensors for this location
    try {
      const detail = await api.getLocationById(loc._id);
      setLocationSensors(detail.sensors || []);
      if (detail.latestAssessment) {
        setSelectedAssessment(detail.latestAssessment);
      }
    } catch (err) {
      console.error('Failed to load location sensors:', err);
    }
  };

  const handleRecalculate = async (locationId: string) => {
    setRecalculating(true);
    setFeedback(null);
    try {
      const res = await api.recalculateLocationRisk(locationId);
      setFeedback(`Landslide Hazard Index re-evaluated for ${selectedLocation?.name}: Score ${res.riskScore}/100 (${res.riskLevel}).`);
      fetchAssessmentData();
    } catch (err: any) {
      setFeedback(`Evaluation failed: ${err.message}`);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <p className="text-xs uppercase tracking-wider text-slate-400">Loading Geospatial Risk Intelligence...</p>
        </div>
      </div>
    );
  }

  // Find if there is any critical location to display the prominent alert banner
  const criticalAssessment = assessments.find(a => a.riskLevel === 'Critical') || selectedAssessment;
  const criticalLocation = criticalAssessment
    ? locations.find(l => {
      const id = typeof criticalAssessment.location === 'object' ? criticalAssessment.location?._id : criticalAssessment.location;
      return l._id === id;
    })
    : null;

  const rawMeas = selectedAssessment?.factors?.rawMeasurements || {};

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Top Header & Operational Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-orange-600" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-orange-700">
              Environmental Risk Intelligence (Demo Mode)
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Landslide Hazard Index (LHI-v2.2) Evaluator
          </h1>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm text-xs font-medium">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-colors focus-visible:ring-1 focus-visible:ring-orange-500 ${activeTab === 'map'
                ? 'bg-orange-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <MapPin size={14} />
            <span>Geospatial Map</span>
          </button>

          <button
            onClick={() => setActiveTab('mesh')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-colors focus-visible:ring-1 focus-visible:ring-orange-500 ${activeTab === 'mesh'
                ? 'bg-orange-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Radio size={14} />
            <span>Sensor Mesh</span>
          </button>

          <button
            onClick={() => setActiveTab('formula')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-colors focus-visible:ring-1 focus-visible:ring-orange-500 ${activeTab === 'formula'
                ? 'bg-orange-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Sliders size={14} />
            <span>LHI-v2.2 Formula Studio</span>
          </button>
        </div>
      </div>

      {/* Demonstration Notice */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-xs text-amber-950">
        <p className="text-[11px] leading-relaxed">
          <strong className="text-amber-900 font-semibold">Empirical Heuristic Analysis:</strong> The multi-factor 
          hazard calculations displayed below synthesize simulated sensor parameters (precipitation rate, volumetric moisture, 
          shear strain, pore water pressure) through the LHI-v2.2 algorithm for testing and sensitivity research.
        </p>
      </div>


      {/* Prominent Critical Alert Banner (Priority 3.D & Priority 2 resolution) */}
      {criticalAssessment && criticalLocation && criticalAssessment.riskLevel === 'Critical' && (
        <CriticalAlertBanner
          assessment={criticalAssessment}
          location={criticalLocation}
          sensors={locationSensors}
          onAcknowledge={() => setFeedback('Incident alert acknowledged by operator.')}
        />
      )}

      {feedback && (
        <div className="rounded-xl border border-sky-300 bg-sky-50 p-3 text-xs text-sky-800">
          {feedback}
        </div>
      )}

      {/* VIEW 1: GEOSPATIAL MAP VIEW (Priority 1 Fix) */}
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Map Workspace (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-slate-700">
                Interactive Geospatial Telemetry Map (Verified Keyless Base Layers)
              </span>
              <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                Active Nodes: {locations.length} Slopes Plotted
              </span>
            </div>

            {/* Reusable Map with verified Esri Satellite / Topo / OSM layers */}
            <GeospatialMap
              locations={locations}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              height="580px"
              showLayerSwitcher={true}
              showLegend={true}
            />
          </div>

          {/* Synchronized Location Intelligence Panel */}
          {selectedLocation && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-[10px] text-orange-700 font-bold uppercase tracking-wider">
                    {selectedLocation.code} • {selectedLocation.region}
                  </span>
                  <h3 className="mt-0.5 text-lg font-extrabold text-slate-900">
                    {selectedLocation.name}
                  </h3>
                </div>
                <RiskBadge
                  level={selectedLocation.currentRiskLevel}
                  score={selectedLocation.currentRiskScore}
                  size="md"
                />
              </div>

              {/* Geographic Characteristics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Slope Angle</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedLocation.slopeAngle}°</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Elevation</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedLocation.elevation} m</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Bedrock & Geology</span>
                <span className="text-slate-800 text-[11px] leading-relaxed">{selectedLocation.geologyType}</span>
              </div>

              {/* In-situ Sensor Telemetry Readings */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Live Telemetry Sensors ({locationSensors.length})
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-700 font-semibold">SYNCED</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {locationSensors.map((s) => (
                    <div
                      key={s._id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-colors hover:bg-slate-100/70"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{s.name}</span>
                        <span className="font-mono text-orange-700 font-bold">
                          {s.lastReadingValue !== null && s.lastReadingValue !== undefined
                            ? `${s.lastReadingValue} ${s.unit}`
                            : 'Awaiting'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>ID: {s.sensorId}</span>
                        <span>Warn: {s.thresholds.warning}{s.unit} • Crit: {s.thresholds.critical}{s.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assessment Actions */}
              {isOperator && (
                <button
                  onClick={() => handleRecalculate(selectedLocation._id)}
                  disabled={recalculating}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-700 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <RefreshCw size={14} className={recalculating ? 'animate-spin' : ''} />
                  <span>Recalculate LHI Risk Score</span>
                </button>
              )}
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: SENSOR MESH & TELEMETRY DIAGNOSTICS VIEW (Priority 2 Fix) */}
      {activeTab === 'mesh' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                In-Situ Telemetry Node Diagnostics: {selectedLocation?.name}
              </h3>
              <p className="text-xs text-slate-500">
                Distinguishing raw physical sensor measurements from calculated factor severity scores
              </p>
            </div>

            {/* Location Selector for Mesh View */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Select Ridge:</span>
              <select
                value={selectedLocation?._id || ''}
                onChange={(e) => {
                  const loc = locations.find(l => l._id === e.target.value);
                  if (loc) handleSelectLocation(loc);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-orange-500 focus:outline-none shadow-xs"
              >
                {locations.map((l) => (
                  <option key={l._id} value={l._id}>{l.name} ({l.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sensor Cards Grid with Raw Measurements vs Normalized Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Node 1: Rainfall */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-sky-700 uppercase font-bold">Rainfall Infiltration Node</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Optical Tipping Bucket Gauge</h4>
                  <p className="text-[11px] font-mono text-slate-500">SEN-{selectedLocation?.code}-RAIN</p>
                </div>
                <span className="rounded bg-sky-50 border border-sky-300 px-2 py-0.5 text-[10px] font-mono text-sky-800 font-bold">
                  WEIGHT: 35%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Raw Measurement</span>
                  <span className="font-mono text-2xl font-extrabold text-slate-900">
                    {rawMeas.rainfall?.value !== null && rawMeas.rainfall?.value !== undefined ? rawMeas.rainfall.value : '--'}
                    <span className="text-xs font-normal text-slate-500 ml-1">mm/h</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Normalized Factor</span>
                  <span className="font-mono text-2xl font-extrabold text-sky-700">
                    {selectedAssessment?.factors?.rainfallScore ?? 0}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ 100</span>
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 pt-2">
                <span>Warn: 25.0 mm/h • Crit: 50.0 mm/h</span>
                <span className="text-emerald-700 font-medium">Spike Filter: Nominal</span>
              </div>
            </div>

            {/* Node 2: Soil Moisture */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-orange-700 uppercase font-bold">Soil Moisture Node</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">TDR Volumetric Moisture Probe</h4>
                  <p className="text-[11px] font-mono text-slate-500">SEN-{selectedLocation?.code}-SOIL</p>
                </div>
                <span className="rounded bg-orange-50 border border-orange-300 px-2 py-0.5 text-[10px] font-mono text-orange-800 font-bold">
                  WEIGHT: 25%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Raw Measurement</span>
                  <span className="font-mono text-2xl font-extrabold text-slate-900">
                    {rawMeas.soilMoisture?.value !== null && rawMeas.soilMoisture?.value !== undefined ? rawMeas.soilMoisture.value : '--'}
                    <span className="text-xs font-normal text-slate-500 ml-1">% vol</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Normalized Factor</span>
                  <span className="font-mono text-2xl font-extrabold text-orange-700">
                    {selectedAssessment?.factors?.soilMoistureScore ?? 0}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ 100</span>
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 pt-2">
                <span>Warn: 65.0% • Crit: 80.0%</span>
                <span className="text-emerald-700 font-medium">Depth: 1.5m</span>
              </div>
            </div>

            {/* Node 3: Displacement */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-800 uppercase font-bold">Slope Strain Node</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Bi-Axial MEMS Tiltmeter</h4>
                  <p className="text-[11px] font-mono text-slate-500">SEN-{selectedLocation?.code}-TILT</p>
                </div>
                <span className="rounded bg-amber-50 border border-amber-300 px-2 py-0.5 text-[10px] font-mono text-amber-800 font-bold">
                  WEIGHT: 25%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Raw Measurement</span>
                  <span className="font-mono text-2xl font-extrabold text-slate-900">
                    {rawMeas.displacement?.value !== null && rawMeas.displacement?.value !== undefined ? rawMeas.displacement.value : '--'}
                    <span className="text-xs font-normal text-slate-500 ml-1">deg</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Normalized Factor</span>
                  <span className="font-mono text-2xl font-extrabold text-amber-800">
                    {selectedAssessment?.factors?.displacementScore ?? 0}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ 100</span>
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 pt-2">
                <span>Warn: 1.20° • Crit: 2.80°</span>
                <span className="text-emerald-700 font-medium">Axial Drift: Stable</span>
              </div>
            </div>

            {/* Node 4: Pore Water Pressure */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-indigo-700 uppercase font-bold">Hydrostatic Pressure Node</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Vibrating Wire Piezometer</h4>
                  <p className="text-[11px] font-mono text-slate-500">SEN-{selectedLocation?.code}-PORE</p>
                </div>
                <span className="rounded bg-indigo-50 border border-indigo-300 px-2 py-0.5 text-[10px] font-mono text-indigo-800 font-bold">
                  WEIGHT: 15%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Raw Measurement</span>
                  <span className="font-mono text-2xl font-extrabold text-slate-900">
                    {rawMeas.porePressure?.value !== null && rawMeas.porePressure?.value !== undefined ? rawMeas.porePressure.value : '--'}
                    <span className="text-xs font-normal text-slate-500 ml-1">kPa</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Normalized Factor</span>
                  <span className="font-mono text-2xl font-extrabold text-indigo-700">
                    {selectedAssessment?.factors?.porePressureScore ?? 0}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ 100</span>
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 pt-2">
                <span>Warn: 28.0 kPa • Crit: 45.0 kPa</span>
                <span className="text-emerald-700 font-medium">Depth: 6.5m Sub-surface</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW 3: FORMULA & SENSITIVITY STUDIO */}
      {activeTab === 'formula' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Landslide Hazard Index Formulation Architecture (LHI-v2.2)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              The Landslide Hazard Index integrates geotechnical limit-equilibrium mechanics with empirical sensor telemetry.
              It synthesizes hydrological triggers with in-situ geomechanical shear observations, scaled by the Mohr-Coulomb slope inclination factor (&kappa;<sub>slope</sub>).
            </p>

            <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/70 text-xs font-mono text-slate-800 space-y-2">
              <p className="text-slate-500 text-[10px] uppercase font-semibold">Core Equation:</p>
              <p className="text-sm font-bold text-orange-800">
                LHI = (0.35 &times; S_rain + 0.25 &times; S_soil + 0.25 &times; S_tilt + 0.15 &times; S_pore) &times; &kappa;_slope - P_stale
              </p>
              <p className="text-slate-600 text-[11px] pt-1">
                Where &kappa;_slope = sin(&theta;) / sin(30°) clamped between [0.70, 1.35].
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-800 block text-xs">Low Hazard</span>
                <span className="font-mono text-slate-900 font-bold text-sm">0.00 – 29.99</span>
                <span className="text-[10px] text-emerald-700 block mt-1">Normal baseline background</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <span className="font-bold text-amber-800 block text-xs">Moderate Hazard</span>
                <span className="font-mono text-slate-900 font-bold text-sm">30.00 – 54.99</span>
                <span className="text-[10px] text-amber-700 block mt-1">Heightened watch protocol</span>
              </div>

              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                <span className="font-bold text-orange-800 block text-xs">High Hazard</span>
                <span className="font-mono text-slate-900 font-bold text-sm">55.00 – 74.99</span>
                <span className="text-[10px] text-orange-700 block mt-1">Active advisory dispatch</span>
              </div>

              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <span className="font-bold text-rose-800 block text-xs">Critical Hazard</span>
                <span className="font-mono text-slate-900 font-bold text-sm">75.00 – 100.0</span>
                <span className="text-[10px] text-rose-700 block mt-1">Priority threshold response protocol</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
