import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Layers, MapPin, Info } from 'lucide-react';
import { Location, RiskLevel } from '../types';

interface GeospatialMapProps {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (location: Location) => void;
  className?: string;
  height?: string;
  showLayerSwitcher?: boolean;
  showLegend?: boolean;
}

// Calibrated SVG risk marker generator with restrained, professional palette
export const createRiskIcon = (level: RiskLevel, score: number, isSelected: boolean = false) => {
  const colors = {
    Low: { bg: '#059669', ring: 'rgba(5, 150, 105, 0.3)', border: '#047857' },
    Moderate: { bg: '#d97706', ring: 'rgba(217, 119, 6, 0.3)', border: '#b45309' },
    High: { bg: '#ea580c', ring: 'rgba(234, 88, 12, 0.35)', border: '#c2410c' },
    Critical: { bg: '#dc2626', ring: 'rgba(220, 38, 38, 0.4)', border: '#b91c1c' }
  }[level] || { bg: '#475569', ring: 'rgba(71, 85, 105, 0.3)', border: '#334155' };

  const size = isSelected ? 36 : 30;

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      ${isSelected ? `<div style="position: absolute; inset: -4px; border-radius: 50%; border: 2px solid #ea580c; background: rgba(234,88,12,0.15);"></div>` : ''}
      <div style="width: 100%; height: 100%; border-radius: 50%; background: ${colors.bg}; border: 2px solid ${isSelected ? '#ffffff' : colors.border}; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 700; font-family: 'JetBrains Mono', monospace; font-size: 11px;">
        ${score}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-risk-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4]
  });
};

const MapPanController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// Keyless Basemap Configurations
export const BASEMAP_TILES = {
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18
  },
  topo: {
    id: 'topo',
    name: 'Topographic',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey',
    maxZoom: 18
  },
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }
};

export const GeospatialMap: React.FC<GeospatialMapProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  className = '',
  height = '500px',
  showLayerSwitcher = true,
  showLegend = true
}) => {
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'topo' | 'osm'>('satellite');
  const [tileErrorOccurred, setTileErrorOccurred] = useState<boolean>(false);

  const defaultCenter: [number, number] = selectedLocation
    ? [selectedLocation.latitude, selectedLocation.longitude]
    : locations.length > 0
    ? [locations[0].latitude, locations[0].longitude]
    : [20.5937, 78.9629];

  const currentTileConfig = BASEMAP_TILES[activeLayer] || BASEMAP_TILES.osm;

  const handleTileError = () => {
    // Graceful silent fallback without disruptive warning modal
    setTileErrorOccurred(true);
    if (activeLayer !== 'osm') {
      setActiveLayer('osm');
    }
  };

  return (
    <div 
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-md ${className}`} 
      style={{ height }}
    >
      
      {/* Non-blocking Layer Switcher */}
      {showLayerSwitcher && (
        <div 
          role="region" 
          aria-label="Map Base Layer Controls"
          className="absolute top-3 right-3 z-[400] flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 backdrop-blur-md shadow-md text-xs font-medium"
        >
          <Layers size={13} className="text-slate-500 ml-1.5 mr-0.5" />
          <button
            type="button"
            onClick={() => { setActiveLayer('satellite'); setTileErrorOccurred(false); }}
            className={`rounded-lg px-2.5 py-1 text-xs transition-colors focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:outline-none ${
              activeLayer === 'satellite' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => { setActiveLayer('topo'); setTileErrorOccurred(false); }}
            className={`rounded-lg px-2.5 py-1 text-xs transition-colors focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:outline-none ${
              activeLayer === 'topo' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Topographic
          </button>
          <button
            type="button"
            onClick={() => { setActiveLayer('osm'); setTileErrorOccurred(false); }}
            className={`rounded-lg px-2.5 py-1 text-xs transition-colors focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:outline-none ${
              activeLayer === 'osm' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            OSM {tileErrorOccurred && activeLayer === 'osm' ? '(Fallback)' : ''}
          </button>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={defaultCenter}
        zoom={selectedLocation ? 12 : 5}
        className="h-full w-full"
        zoomControl={true}
      >
        <MapPanController
          center={defaultCenter}
          zoom={selectedLocation ? 12 : 5}
        />

        <TileLayer
          key={activeLayer}
          url={currentTileConfig.url}
          attribution={currentTileConfig.attribution}
          maxZoom={currentTileConfig.maxZoom}
          eventHandlers={{
            tileerror: handleTileError
          }}
        />

        {locations.map((loc) => {
          const isSelected = selectedLocation?._id === loc._id;
          return (
            <Marker
              key={loc._id}
              position={[loc.latitude, loc.longitude]}
              icon={createRiskIcon(loc.currentRiskLevel, loc.currentRiskScore, isSelected)}
              eventHandlers={{
                click: () => onSelectLocation(loc)
              }}
            >
              <Popup>
                <div className="p-1 min-w-[220px] text-xs space-y-2 font-sans">
                  <div className="border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-900 text-sm block">{loc.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {loc.code} • {loc.region}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono py-1">
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[9px] uppercase">Slope Angle</span>
                      <span className="text-slate-900 font-bold">{loc.slopeAngle}°</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[9px] uppercase">Elevation</span>
                      <span className="text-slate-900 font-bold">{loc.elevation}m</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                    <span className="text-slate-500">Heuristic LHI:</span>
                    <span className="font-mono font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {loc.currentRiskScore}/100 ({loc.currentRiskLevel})
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 italic pt-0.5">
                    Click pin to synchronize telemetry detail panel
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      {showLegend && (
        <div 
          role="region" 
          aria-label="Hazard Score Legend"
          className="absolute bottom-3 left-3 z-[400] rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-md backdrop-blur-md text-xs"
        >
          <p className="font-mono font-semibold uppercase tracking-wider text-slate-700 text-[10px] mb-1.5">
            LHI Threshold Index
          </p>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-600" /> &lt;30 Low
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-600" /> 30-54 Mod
            </span>
            <span className="flex items-center gap-1 text-orange-700 font-medium">
              <span className="h-2 w-2 rounded-full bg-orange-600" /> 55-74 High
            </span>
            <span className="flex items-center gap-1 text-rose-700 font-bold">
              <span className="h-2 w-2 rounded-full bg-rose-600" /> &ge;75 Crit
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

export default GeospatialMap;
