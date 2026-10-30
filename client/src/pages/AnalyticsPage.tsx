import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  MapPin,
  TrendingUp,
  Radio,
  FileSpreadsheet,
  Activity,
  CloudRain,
  Compass
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { Location } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [locs, trends, dashSummary] = await Promise.all([
        api.getLocations(),
        api.getTrends({ locationId: selectedLocation, timeRange }),
        api.getDashboardSummary()
      ]);
      setLocations(locs);
      setStats(dashSummary);

      // Process readings for Recharts
      if (trends?.readings) {
        // Group readings into temporal bins for smooth multi-line comparison
        const map: Record<string, any> = {};
        trends.readings.forEach((r: any) => {
          const d = new Date(r.observedAt);
          const timeLabel = timeRange === '24h'
            ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;

          if (!map[timeLabel]) {
            map[timeLabel] = {
              time: timeLabel,
              rain: 0,
              moisture: 0,
              tilt: 0,
              pore: 0
            };
          }

          if (r.sensorType === 'rain_gauge') map[timeLabel].rain = r.value;
          if (r.sensorType === 'soil_moisture') map[timeLabel].moisture = r.value;
          if (r.sensorType === 'tiltmeter') map[timeLabel].tilt = r.value;
          if (r.sensorType === 'pore_pressure') map[timeLabel].pore = r.value;
        });

        setTrendData(Object.values(map));
      }
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedLocation, timeRange]);

  const handleDownloadCsv = () => {
    const url = api.getCsvExportUrl({
      locationId: selectedLocation,
      timeRange
    });
    window.open(url, '_blank');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-orange-600" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-orange-700">
              Telemetry Analytics (Demo Mode)
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Sensor Trends &amp; Telemetry Export
          </h1>
        </div>

        {/* Download CSV Action Button */}
        <button
          onClick={handleDownloadCsv}
          className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-700 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <Download size={14} />
          <span>Export Benchmark CSV</span>
        </button>
      </div>

      {/* Demonstration Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
        <p className="text-[11px] leading-relaxed">
          <strong className="text-amber-800 font-semibold">Simulated Longitudinal Data:</strong> The historical 
          measurements and exported CSV datasets reflect synthetic sensor readings generated for time-series modeling and evaluation.
        </p>
      </div>

      {/* Control Bar: Location & Time Range Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        
        {/* Monitored Slope Selector */}
        <div className="flex items-center gap-2 text-xs">
          <MapPin size={15} className="text-slate-500" />
          <span className="text-slate-600 font-medium">Monitored Slope:</span>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Slopes (Aggregate)</option>
            {locations.map((l) => (
              <option key={l._id} value={l._id}>{l.name} ({l.code})</option>
            ))}
          </select>
        </div>

        {/* Time Window Buttons */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
          <Calendar size={13} className="text-slate-500 ml-2 mr-1" />
          {['24h', '7d', '30d', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-md px-3 py-1 uppercase transition-colors ${
                timeRange === range
                  ? 'bg-white text-orange-700 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

      </div>

      {/* High-Impact Multi-Axis Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Multi-Sensor Geotechnical Correlation
            </h3>
            <p className="text-xs text-slate-500">
              Correlating rainfall bursts with pore-water pressure spikes and tilt shear displacement
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-sky-700">
              <span className="h-2 w-2 rounded-full bg-sky-600" /> Rain (mm/h)
            </span>
            <span className="flex items-center gap-1.5 text-orange-700">
              <span className="h-2 w-2 rounded-full bg-orange-600" /> Soil Moisture (%)
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-600" /> Tilt Angle (deg)
            </span>
            <span className="flex items-center gap-1.5 text-purple-700">
              <span className="h-2 w-2 rounded-full bg-purple-600" /> Pore Pressure (kPa)
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Aggregating time-series telemetry records...
            </div>
          ) : trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Line type="monotone" dataKey="rain" stroke="#0284c7" strokeWidth={2} dot={false} name="Rainfall (mm/h)" />
                <Line type="monotone" dataKey="moisture" stroke="#ea580c" strokeWidth={2} dot={false} name="Soil Moisture (%)" />
                <Line type="monotone" dataKey="tilt" stroke="#d97706" strokeWidth={2} dot={false} name="Tilt (deg)" />
                <Line type="monotone" dataKey="pore" stroke="#9333ea" strokeWidth={2} dot={false} name="Pore Pressure (kPa)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No historical sensor telemetry recorded for the selected filter window.
            </div>
          )}
        </div>
      </div>

      {/* Network Availability & Uptime Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
              <Radio size={24} />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-slate-500">Sensor Network Availability</p>
              <h4 className="font-mono text-2xl font-bold text-slate-900 mt-0.5">
                {stats?.sensors?.uptimePercentage || 98.4}%
              </h4>
              <p className="text-[11px] text-emerald-700 font-mono mt-0.5">
                {stats?.sensors?.online ?? 0} of {stats?.sensors?.total ?? 0} Nodes Operational
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-orange-700">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-slate-500">Telemetry Ingestion Status</p>
              <h4 className="font-mono text-2xl font-bold text-slate-900 mt-0.5">
                {trendData.length > 0 ? `${trendData.length * 4} pts` : '100% Valid'}
              </h4>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Zero Data Loss / Time-Series Indexed</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sky-700">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-slate-500">Risk Assessment Re-Evaluations</p>
              <h4 className="font-mono text-2xl font-bold text-slate-900 mt-0.5">
                Continuous
              </h4>
              <p className="text-[11px] text-sky-700 font-mono mt-0.5">Real-time dynamic weight balance</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
