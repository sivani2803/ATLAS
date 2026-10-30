import React, { useState, useEffect } from 'react';
import {
  Radio,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Battery,
  Layers,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SensorGauge } from '../components/SensorGauge';
import { Sensor, Location, SensorType } from '../types';

export const SensorsPage: React.FC = () => {
  const { isOperator, isAdmin } = useAuth();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [formData, setFormData] = useState({
    sensorId: '',
    name: '',
    type: 'soil_moisture' as SensorType,
    location: '',
    unit: '%',
    warningThreshold: 65,
    criticalThreshold: 80,
    depthMeters: 1.0
  });

  const fetchSensors = async () => {
    try {
      const [sensData, locsData] = await Promise.all([
        api.getSensors(),
        api.getLocations()
      ]);
      setSensors(sensData);
      setLocations(locsData);
    } catch (err) {
      console.error('Failed to fetch sensor mesh:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, []);

  const handleOpenRegister = () => {
    setEditingSensor(null);
    setFormData({
      sensorId: `SEN-NEW-${Date.now().toString().slice(-4)}`,
      name: 'Sub-surface Moisture Probe',
      type: 'soil_moisture',
      location: locations[0]?._id || '',
      unit: '%',
      warningThreshold: 65,
      criticalThreshold: 80,
      depthMeters: 1.0
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sensor: Sensor) => {
    setEditingSensor(sensor);
    setFormData({
      sensorId: sensor.sensorId,
      name: sensor.name,
      type: sensor.type,
      location: typeof sensor.location === 'object' ? sensor.location._id : sensor.location,
      unit: sensor.unit,
      warningThreshold: sensor.thresholds.warning,
      criticalThreshold: sensor.thresholds.critical,
      depthMeters: sensor.depthMeters || 1.0
    });
    setIsModalOpen(true);
  };

  const handleSaveSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSensor) {
        await api.updateSensor(editingSensor._id, {
          name: formData.name,
          thresholds: {
            warning: Number(formData.warningThreshold),
            critical: Number(formData.criticalThreshold)
          },
          depthMeters: Number(formData.depthMeters)
        });
      } else {
        await api.createSensor({
          sensorId: formData.sensorId,
          name: formData.name,
          type: formData.type,
          location: formData.location,
          unit: formData.unit,
          thresholds: {
            warning: Number(formData.warningThreshold),
            critical: Number(formData.criticalThreshold)
          },
          depthMeters: Number(formData.depthMeters)
        });
      }
      setIsModalOpen(false);
      fetchSensors();
    } catch (err: any) {
      alert(`Operation failed: ${err.message}`);
    }
  };

  const handleDeleteSensor = async (id: string, sensorId: string) => {
    if (!window.confirm(`Permanently decommission sensor ${sensorId}?`)) return;
    try {
      await api.deleteSensor(id);
      fetchSensors();
    } catch (err: any) {
      alert(`Decommissioning failed: ${err.message}`);
    }
  };

  const filteredSensors = sensors.filter((s) => {
    const locId = typeof s.location === 'object' ? s.location?._id : s.location;
    const matchesSearch =
      s.sensorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || s.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || locId === locationFilter;
    return matchesSearch && matchesType && matchesStatus && matchesLocation;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-orange-600" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-orange-700">
              Sensor Registry &amp; Telemetry Mesh (Demo Mode)
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Simulated In-Situ Geotechnical Sensors
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setRefreshing(true); fetchSensors(); }}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          {isOperator && (
            <button
              onClick={handleOpenRegister}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-orange-700 transition-colors"
            >
              <Plus size={15} />
              <span>Register Node</span>
            </button>
          )}
        </div>
      </div>

      {/* Demonstration Notice */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-xs text-amber-950">
        <p className="text-[11px] leading-relaxed">
          <strong className="text-amber-900 font-semibold">Simulated Sensor Network:</strong> The instrumentation nodes 
          configured below (tipping rain gauges, TDR volumetric moisture probes, MEMS tiltmeters, and piezometers) 
          are synthetic test assets. Telemetry readings are generated through benchmark models and interactive pulse scenarios.
        </p>
      </div>


      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search sensor ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none shadow-xs"
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none shadow-xs"
        >
          <option value="all">All Sensor Types</option>
          <option value="soil_moisture">Soil Moisture (TDR)</option>
          <option value="tiltmeter">Tiltmeter (MEMS)</option>
          <option value="rain_gauge">Rain Gauge (Tipping)</option>
          <option value="pore_pressure">Pore Water Pressure (Piezometer)</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none shadow-xs"
        >
          <option value="all">All Statuses</option>
          <option value="online">Online & Streaming</option>
          <option value="stale">Stale Telemetry</option>
          <option value="offline">Offline</option>
        </select>

        {/* Location Filter */}
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none shadow-xs"
        >
          <option value="all">All Monitored Slopes</option>
          {locations.map((l) => (
            <option key={l._id} value={l._id}>{l.name} ({l.code})</option>
          ))}
        </select>
      </div>

      {/* Sensor Cards Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-xs text-slate-500">
          Loading sensor inventory...
        </div>
      ) : filteredSensors.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          <Radio size={36} className="mx-auto mb-3 text-slate-400" />
          <h3 className="text-base font-bold text-slate-900">No Sensors Found</h3>
          <p className="mt-1 text-xs">No sensors match your active filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSensors.map((s) => {
            const locationName = typeof s.location === 'object' ? s.location?.name : 'Assigned Location';
            const locationCode = typeof s.location === 'object' ? s.location?.code : '';
            const isCritical = s.lastReadingValue !== null && s.lastReadingValue !== undefined && s.lastReadingValue >= s.thresholds.critical;
            const isWarning = !isCritical && s.lastReadingValue !== null && s.lastReadingValue !== undefined && s.lastReadingValue >= s.thresholds.warning;

            return (
              <div
                key={s._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md space-y-4"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider block">
                      {locationCode} • {s.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{s.name}</h3>
                    <p className="font-mono text-xs text-orange-700 font-semibold">{s.sensorId}</p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                      s.status === 'online'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-300 bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${s.status === 'online' ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                    {s.status}
                  </span>
                </div>

                {/* Main Gauge Visual */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-slate-500 font-medium">Telemetry Reading</span>
                    <span className="font-mono text-2xl font-extrabold text-slate-900">
                      {s.lastReadingValue !== null && s.lastReadingValue !== undefined ? s.lastReadingValue : '--'}
                      <span className="text-xs font-normal text-slate-500 ml-1">{s.unit}</span>
                    </span>
                  </div>

                  <SensorGauge
                    type={s.type}
                    value={s.lastReadingValue || 0}
                    unit={s.unit}
                    thresholds={s.thresholds}
                  />
                </div>

                {/* Metadata & Diagnostics Bar */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <span className="truncate">
                      {s.lastReadingAt ? new Date(s.lastReadingAt).toLocaleTimeString() : 'No readings'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5">
                    <Battery size={13} className="text-emerald-600" />
                    <span className="font-mono">{s.batteryLevel ?? 95}% Battery</span>
                  </div>
                </div>

                {/* Action Buttons for Authorized Operators */}
                {isOperator && (
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2.5">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <Edit2 size={12} />
                      <span>Configure</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteSensor(s._id, s.sensorId)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sensor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingSensor ? `Configure ${editingSensor.sensorId}` : 'Register In-Situ Sensor'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSensor} className="mt-4 space-y-4 text-xs">
              {!editingSensor && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Sensor Identifier (Unique ID)</label>
                  <input
                    type="text"
                    required
                    value={formData.sensorId}
                    onChange={(e) => setFormData({ ...formData, sensorId: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Sensor Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-2 text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              {!editingSensor && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Sensor Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        const t = e.target.value as SensorType;
                        const u = t === 'soil_moisture' ? '%' : t === 'rain_gauge' ? 'mm/h' : t === 'tiltmeter' ? 'deg' : 'kPa';
                        setFormData({ ...formData, type: t, unit: u });
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-2 text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                    >
                      <option value="soil_moisture">Soil Moisture</option>
                      <option value="tiltmeter">Bi-Axial Tiltmeter</option>
                      <option value="rain_gauge">Rain Gauge</option>
                      <option value="pore_pressure">Piezometer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Monitored Slope Location</label>
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-2 text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                    >
                      {locations.map((l) => (
                        <option key={l._id} value={l._id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-amber-800 mb-1">Warning Threshold ({formData.unit})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.warningThreshold}
                    onChange={(e) => setFormData({ ...formData, warningThreshold: parseFloat(e.target.value) })}
                    className="w-full rounded-lg border border-amber-300 bg-amber-50/30 px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-rose-800 mb-1">Critical Threshold ({formData.unit})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.criticalThreshold}
                    onChange={(e) => setFormData({ ...formData, criticalThreshold: parseFloat(e.target.value) })}
                    className="w-full rounded-lg border border-rose-300 bg-rose-50/30 px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Installation Depth (Meters)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.depthMeters}
                  onChange={(e) => setFormData({ ...formData, depthMeters: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
                >
                  {editingSensor ? 'Update Sensor' : 'Register Sensor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
