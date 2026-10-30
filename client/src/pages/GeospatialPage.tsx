import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Radio,
  Activity,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Compass,
  Layers,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { GeospatialMap } from '../components/GeospatialMap';
import { Location, Sensor, RiskAssessment } from '../types';

export const GeospatialPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationSensors, setLocationSensors] = useState<Sensor[]>([]);
  const [locationAssessment, setLocationAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [panelLoading, setPanelLoading] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const fetchLocations = async () => {
    try {
      const data = await api.getLocations();
      setLocations(data);
      if (data.length > 0 && !selectedLocation) {
        handleSelectLocation(data[0]);
      }
    } catch (err) {
      console.error('Failed to load locations for map:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSelectLocation = async (loc: Location) => {
    setSelectedLocation(loc);
    setPanelLoading(true);
    try {
      const detail = await api.getLocationById(loc._id);
      setLocationSensors(detail.sensors || []);
      setLocationAssessment(detail.latestAssessment || null);
    } catch (err) {
      console.error('Failed to load location details:', err);
    } finally {
      setPanelLoading(false);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'all' || loc.currentRiskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Loading Geospatial Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full flex flex-col overflow-hidden bg-slate-50">

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-[450] flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Search Box */}
        <div className="relative w-64 shadow-md">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search slopes or regions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/95 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 backdrop-blur-md focus:border-orange-500 focus:outline-none shadow-md"
          />
        </div>

        {/* Risk Filter Buttons */}
        <div className="flex rounded-xl border border-slate-200 bg-white/95 p-1 backdrop-blur-md shadow-md text-xs font-semibold">
          {['all', 'Low', 'Moderate', 'High', 'Critical'].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`rounded-lg px-2.5 py-1 transition-colors ${riskFilter === r
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchLocations}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 backdrop-blur-md shadow-md transition-colors"
          title="Refresh Slope Coordinates & Data"
        >
          <RefreshCw size={13} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Main Map Component with Keyless Esri/OSM Layers & Error Fallback */}
      <div className="relative flex-1 w-full h-full">
        <GeospatialMap
          locations={filteredLocations}
          selectedLocation={selectedLocation}
          onSelectLocation={handleSelectLocation}
          height="100%"
          className="rounded-none border-0"
          showLayerSwitcher={true}
          showLegend={true}
        />

        {/* Sliding Location Intelligence Side Panel */}
        {selectedLocation && (
          <div className="absolute top-4 right-4 bottom-6 z-[450] w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur-xl flex flex-col overflow-y-auto animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[10px] text-orange-700 font-bold uppercase tracking-wider">
                  {selectedLocation.code} • {selectedLocation.region}
                </span>
                <h3 className="mt-0.5 text-base font-extrabold text-slate-900">
                  {selectedLocation.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <RiskBadge
                  level={selectedLocation.currentRiskLevel}
                  score={selectedLocation.currentRiskScore}
                  size="md"
                />
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  title="Close panel"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              {selectedLocation.description || 'Continuous telemetry slope monitoring section.'}
            </p>

            {/* Geological & Topographical Specifications */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Slope Angle</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{selectedLocation.slopeAngle}°</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Elevation</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{selectedLocation.elevation} m</span>
              </div>
            </div>

            <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Sub-surface Geology</span>
              <span className="text-slate-800 text-[11px] font-mono">{selectedLocation.geologyType}</span>
            </div>

            <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <span className="text-slate-500 text-[10px] uppercase font-mono">Coordinates</span>
              <span className="font-mono text-slate-700 text-[11px]">
                {selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E
              </span>
            </div>

            {/* In-situ Sensor Telemetry Readings */}
            <div className="mt-5 flex-1">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Attached Sensors ({locationSensors.length})
                </h4>
                <span className="text-[10px] font-mono text-slate-500">SIMULATED INPUTS</span>
              </div>

              {panelLoading ? (
                <div className="py-8 text-center text-xs text-slate-500">Querying simulated sensors...</div>
              ) : (
                <div className="space-y-2">
                  {locationSensors.map((s) => (
                    <div
                      key={s._id}
                      className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 transition-colors hover:bg-slate-100/70"
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
                        <span>Warn: {s.thresholds?.warning ?? '--'}{s.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assessment Details */}
            {locationAssessment && (
              <div className="mt-5 border-t border-slate-100 pt-3 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Confidence Rating:</span>
                  <span className="text-slate-900 font-medium">{locationAssessment.confidenceRating}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Data Quality:</span>
                  <span className="font-mono text-emerald-700 font-semibold uppercase">{locationAssessment.dataQuality?.status || 'Good'}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
