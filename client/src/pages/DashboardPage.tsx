import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Radio,
  MapPin,
  AlertTriangle,
  Activity,
  CloudRain,
  Droplets,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  Clock,
  Wifi,
  WifiOff,
  ShieldAlert,
  ChevronRight,
  Check,
  Maximize2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { MetricCard } from '../components/MetricCard';
import { RiskBadge } from '../components/RiskBadge';
import { GeospatialMap } from '../components/GeospatialMap';
import { CriticalAlertBanner } from '../components/CriticalAlertBanner';
import { DashboardSummary, Location, Alert, Sensor, RiskAssessment } from '../types';

export const DashboardPage: React.FC = () => {
  const { isConnected, lastReading, lastAssessment } = useSocket();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedSensors, setSelectedSensors] = useState<Sensor[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessment | null>(null);
  const [loadingSensors, setLoadingSensors] = useState<boolean>(false);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [freshnessSeconds, setFreshnessSeconds] = useState<number>(0);

  const fetchData = async () => {
    try {
      setError(null);
      const [sumRes, locRes, trendRes, alertRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getLocations(),
        api.getTrends({ timeRange: '24h' }),
        api.getAlerts({ limit: 8, status: 'active' })
      ]);

      setSummary(sumRes);
      setLocations(locRes);
      setAlerts(alertRes?.alerts || sumRes?.recentAlerts || []);
      setFreshnessSeconds(0);

      // Select first or highest-risk location by default
      if (locRes && locRes.length > 0 && !selectedLocation) {
        const criticalLoc = locRes.find((l: Location) => l.currentRiskLevel === 'Critical') || locRes[0];
        handleSelectLocation(criticalLoc);
      }

      // Process readings for Recharts trend preview
      if (trendRes?.readings) {
        const groupedByHour: Record<string, { time: string; rain: number; moisture: number; count: number }> = {};

        trendRes.readings.slice(-60).forEach((r: any) => {
          const d = new Date(r.observedAt);
          const key = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          if (!groupedByHour[key]) {
            groupedByHour[key] = { time: key, rain: 0, moisture: 0, count: 0 };
          }
          if (r.sensorType === 'rain_gauge') groupedByHour[key].rain = r.value;
          if (r.sensorType === 'soil_moisture') groupedByHour[key].moisture = r.value;
        });

        setTrendData(Object.values(groupedByHour));
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Error communicating with backend telemetry API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Freshness timer
  useEffect(() => {
    const timer = setInterval(() => {
      setFreshnessSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // When live reading arrives via Socket.IO
  useEffect(() => {
    if (lastReading) {
      setFreshnessSeconds(0);
      setSummary(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          latestReadings: [lastReading, ...(prev.latestReadings || []).slice(0, 9)],
          systemFreshness: new Date().toISOString()
        };
      });
    }
  }, [lastReading]);

  // When risk assessment arrives via Socket.IO
  useEffect(() => {
    if (lastAssessment) {
      setLocations(prev =>
        prev.map(l =>
          l._id === lastAssessment.locationId
            ? { ...l, currentRiskScore: lastAssessment.riskScore, currentRiskLevel: lastAssessment.riskLevel }
            : l
        )
      );
    }
  }, [lastAssessment]);

  const handleSelectLocation = async (loc: Location) => {
    setSelectedLocation(loc);
    setLoadingSensors(true);
    try {
      const detail = await api.getLocationById(loc._id);
      setSelectedSensors(detail.sensors || []);
      setSelectedAssessment(detail.latestAssessment || null);
    } catch (err) {
      console.error('Failed to fetch details for location:', loc.code, err);
    } finally {
      setLoadingSensors(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    setAcknowledgingId(alertId);
    try {
      await api.acknowledgeAlert(alertId, 'Acknowledged from Operator Console');
      setAlerts(prev =>
        prev.map(a => (a._id === alertId ? { ...a, status: 'acknowledged' } : a))
      );
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Critical locations calculation
  const criticalLocations = locations.filter(l => l.currentRiskLevel === 'Critical');
  const isElevatedState = criticalLocations.length > 0 || (summary?.alerts.critical && summary.alerts.critical > 0);

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Loading Geospatial Telemetry Feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center">
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-8 text-red-200 shadow-2xl backdrop-blur-md">
          <AlertOctagon size={40} className="mx-auto mb-3 text-red-400" />
          <h3 className="text-lg font-bold text-white">Telemetry Service Disconnection</h3>
          <p className="mt-2 text-xs text-red-300 font-mono">{error}</p>
          <button
            onClick={fetchData}
            className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition-colors shadow-lg"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* 1. TOP OPERATIONAL STATUS STRIP (Priority 3.B) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">

        {/* Left: Operational Health */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${isElevatedState ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
            />
            <span
              className={`text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${isElevatedState
                ? 'bg-amber-50 text-amber-900 border border-amber-300'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                }`}
            >
              {isElevatedState ? '[DEMO] ELEVATED THRESHOLD' : 'BASELINE NOMINAL'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 border-l border-slate-200 pl-3 font-mono">
            <span>Simulated Nodes:</span>
            <span className="font-semibold text-slate-900">
              {summary?.sensors.online || 24} / {summary?.sensors.total || 24} Active
            </span>
          </div>
        </div>

        {/* Center/Right: Freshness, WebSocket & Manual Refresh */}
        <div className="flex items-center gap-4 text-xs">
          {/* Freshness Counter */}
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock size={13} className="text-slate-400" />
            <span>Ingestion:</span>
            <span className="font-mono text-orange-700 font-semibold">
              {freshnessSeconds === 0 ? 'Just now' : `${freshnessSeconds}s ago`}
            </span>
          </div>

          {/* WebSocket Live Indicator */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            {isConnected ? (
              <>
                <Wifi size={13} className="text-emerald-600" />
                <span className="font-mono text-[11px] text-emerald-800 font-semibold uppercase">
                  SOCKET FEED (DEMO)
                </span>
              </>
            ) : (
              <>
                <WifiOff size={13} className="text-amber-600" />
                <span className="font-mono text-[11px] text-amber-800 font-semibold uppercase">
                  POLLING SYNC (DEMO)
                </span>
              </>
            )}
          </div>


          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50 shadow-xs"
            title="Refresh state"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Prominent Critical Alert Banner (if any slopes in Critical state) */}
      <CriticalAlertBanner locations={locations} />

      {/* 2. PRIMARY WORKSPACE: DOMINANT GEOSPATIAL MAP & SYNCHRONIZED LOCATION DETAIL (Priority 3.B) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Dominant Map Canvas (8 cols on desktop) */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-orange-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Primary Geospatial Risk Workspace
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-mono">
                {locations.length} Slopes Monitored
              </span>
              <NavLink
                to="/map"
                className="flex items-center gap-1 text-orange-700 hover:text-orange-800 font-semibold"
                title="Full Viewport Map"
              >
                <span>Fullscreen</span>
                <Maximize2 size={12} />
              </NavLink>
            </div>
          </div>

          <div className="relative flex-1 min-h-[460px] w-full rounded-xl overflow-hidden border border-slate-200">
            <GeospatialMap
              locations={locations}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              height="100%"
              showLayerSwitcher={true}
              showLegend={true}
            />
          </div>
        </div>

        {/* Synchronized Location Detail Intelligence Panel (4 cols on desktop) */}
        <div className="lg:col-span-4 flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-hidden">
          {selectedLocation ? (
            <div className="flex flex-col h-full space-y-4">

              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-[10px] text-orange-700 font-bold uppercase tracking-wider">
                    {selectedLocation.code} • {selectedLocation.region}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                    {selectedLocation.name}
                  </h3>
                </div>
                <RiskBadge
                  level={selectedLocation.currentRiskLevel}
                  score={selectedLocation.currentRiskScore}
                  size="md"
                />
              </div>

              {/* Geographic & Geotechnical Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                  <span className="text-[10px] uppercase text-slate-500 block">Slope Angle</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedLocation.slopeAngle}°</span>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                  <span className="text-[10px] uppercase text-slate-500 block">Elevation</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedLocation.elevation} m</span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-xs">
                <span className="text-[10px] uppercase text-slate-500 block">Sub-surface Geology</span>
                <span className="font-mono text-slate-700 text-[11px]">{selectedLocation.geologyType}</span>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-xs flex justify-between items-center">
                <span className="text-[10px] uppercase text-slate-500">Coordinates</span>
                <span className="font-mono text-slate-700 text-[11px]">
                  {selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E
                </span>
              </div>

              {/* In-situ Sensor Telemetry Readings */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Active Telemetry Readings
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">SIMULATED INPUTS</span>
                </div>

                {loadingSensors ? (
                  <div className="py-6 text-center text-xs text-slate-500">Querying simulated sensors...</div>
                ) : selectedSensors.length > 0 ? (
                  <div className="space-y-2 overflow-y-auto max-h-52 pr-1">
                    {selectedSensors.map((s) => (
                      <div
                        key={s._id}
                        className="rounded-lg border border-slate-200 bg-slate-50/70 p-2 text-xs flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-slate-800">{s.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">
                            Warn: {s.thresholds?.warning ?? '--'}{s.unit} | Crit: {s.thresholds?.critical ?? '--'}{s.unit}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-orange-700 font-semibold text-sm">
                            {s.lastReadingValue !== null && s.lastReadingValue !== undefined
                              ? `${s.lastReadingValue} ${s.unit}`
                              : 'Waiting'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500">No sensors registered on this ridge.</div>
                )}
              </div>

              {/* Assessment Formula Link */}
              <div className="pt-2 border-t border-slate-100">
                <NavLink
                  to="/assessment"
                  className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700 hover:text-orange-700 hover:bg-slate-100 transition-colors font-medium"
                >
                  <span>Inspect LHI-v2.2 Heuristic Formula</span>
                  <ChevronRight size={14} />
                </NavLink>
              </div>

            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-500">
              <MapPin size={32} className="text-slate-400 mb-2" />
              <p className="text-xs">Select any slope pin on the geospatial map to inspect simulated geotechnical telemetry.</p>
            </div>
          )}
        </div>

      </div>

      {/* 3. SUPPORTING METRICS (Priority 3.B) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monitored Slopes"
          value={summary?.locations.total || locations.length}
          unit="Locations"
          subtitle="Simulated Ridge Benchmark Sectors"
          icon={MapPin}
          accentColor="blue"
        />

        <MetricCard
          title="Sensors Active"
          value={summary?.sensors.online || 24}
          unit={`/ ${summary?.sensors.total || 24}`}
          subtitle={`${summary?.sensors.uptimePercentage || 100}% Simulated Availability`}
          icon={Radio}
          trend={{ value: `${summary?.sensors.offline || 0}`, label: 'offline', isPositive: summary?.sensors.offline === 0 }}
          accentColor="emerald"
        />

        <MetricCard
          title="Active Demo Alarms"
          value={summary?.alerts.active || alerts.length}
          unit="Alerts"
          subtitle={`${summary?.alerts.critical || 0} Priority benchmark events`}
          icon={AlertTriangle}
          trend={{ value: `${summary?.alerts.critical || 0}`, label: 'benchmark threshold', isPositive: summary?.alerts.critical === 0 }}
          accentColor={summary?.alerts.critical && summary.alerts.critical > 0 ? 'red' : 'amber'}
        />

        <MetricCard
          title="Hazard Algorithm"
          value="LHI-v2.2"
          subtitle="Multi-Factor Empirical Heuristic"
          icon={Activity}
          trend={{ value: 'Calibrated', label: 'Empirical' }}
          accentColor="purple"
        />
      </div>


      {/* 4. LOWER INTELLIGENCE PANELS: TELEMETRY TRENDS & RECENT ALERTS FEED (Priority 3.B) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Rainfall & Soil Saturation Trend (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Simulated Hydrological Trend (Last 24 Hours)
              </h3>
              <p className="text-xs text-slate-500">Precipitation rate vs. Volumetric soil saturation (test data)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-sky-700 font-medium">
                <span className="h-2 w-2 rounded-full bg-sky-600" />
                Rainfall (mm/h)
              </span>
              <span className="flex items-center gap-1.5 text-orange-700 font-medium">
                <span className="h-2 w-2 rounded-full bg-orange-600" />
                Soil Moisture (%)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="moistGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}
                  />
                  <Area type="monotone" dataKey="rain" stroke="#0284c7" fillOpacity={1} fill="url(#rainGrad)" name="Rain (mm/h)" />
                  <Area type="monotone" dataKey="moisture" stroke="#ea580c" fillOpacity={1} fill="url(#moistGrad)" name="Soil Moisture (%)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                Accumulating 24-hour telemetry trend points from edge sensors...
              </div>
            )}
          </div>
        </div>

        {/* Recent Alerts Feed with Acknowledge Action (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Demonstration Alarms Feed
              </h3>
              <p className="text-xs text-slate-500">Simulated threshold trigger events</p>
            </div>

            <NavLink
              to="/alerts"
              className="text-xs font-semibold text-orange-700 hover:text-orange-800"
            >
              View All
            </NavLink>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-64 pr-1">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert._id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ${alert.severity === 'Critical'
                            ? 'bg-rose-50 text-rose-800 border border-rose-300'
                            : alert.severity === 'High'
                              ? 'bg-orange-50 text-orange-800 border border-orange-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-300'
                            }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="font-semibold text-slate-900 text-xs truncate">
                          {alert.title}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                        {alert.message}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                        <span>{new Date(alert.createdAt).toLocaleTimeString()}</span>
                        <span>Status: {alert.status}</span>
                      </div>
                    </div>

                    {/* Acknowledge Button */}
                    {alert.status === 'active' && (
                      <button
                        onClick={() => handleAcknowledgeAlert(alert._id)}
                        disabled={acknowledgingId === alert._id}
                        className="shrink-0 flex items-center gap-1 rounded-lg border border-orange-300 bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
                        title="Acknowledge alert"
                      >
                        <Check size={11} />
                        <span>{acknowledgingId === alert._id ? 'Saving...' : 'Ack'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-44 flex-col items-center justify-center text-center text-xs text-slate-500">
                <CheckCircle2 size={24} className="text-emerald-600 mb-1.5" />
                <span>Zero active alarms across all monitored slopes.</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
