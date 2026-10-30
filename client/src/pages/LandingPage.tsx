import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Radio,
  Activity,
  Layers,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Lock,
  LogIn,
  Sliders,
  AlertCircle,
  FileText,
  Database,
  Info,
  Server,
  Cpu,
  BellRing
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative overflow-hidden bg-slate-50 text-slate-800">
      
      {/* 1. HERO SECTION */}
      <section 
        aria-labelledby="hero-heading"
        className="relative border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100/60 px-4 sm:px-6 lg:px-8 py-16 lg:py-24"
      >
        {/* Subtle decorative terrain glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(234,88,12,0.04),transparent)] pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Mission, Value, and Action */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Product Classification Tag */}
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-xs font-mono font-medium text-orange-800 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span>ENVIRONMENTAL RISK INTELLIGENCE PROTOTYPE</span>
              </div>

              {/* Primary Page Heading */}
              <h1 id="hero-heading" className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Geospatial Landslide Hazard Assessment &amp; Advisory Platform
              </h1>

              {/* Plain-Language Explanatory Body */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                ATLAS evaluates multi-parametric environmental sensor feeds through an empirical physics-based 
                Landslide Hazard Index (LHI-v2.2). The system synthesizes rainfall intensity, volumetric soil 
                moisture, tilt shear displacement, and pore-water pressure to provide early situational awareness 
                for slope stability analysis.
              </p>

              {/* Primary Call to Action Controls */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                {isAuthenticated ? (
                  <NavLink
                    to="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-orange-700 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
                  >
                    <span>Enter Operational Console</span>
                    <ArrowRight size={16} />
                  </NavLink>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-orange-700 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
                    >
                      <LogIn size={16} />
                      <span>Sign In to Console</span>
                      <ArrowRight size={16} />
                    </NavLink>

                    <a
                      href="#methodology"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none shadow-xs"
                    >
                      <span>Explore LHI Model</span>
                    </a>
                  </>
                )}

                <a
                  href="#data-integrity"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 hover:text-orange-700 transition-colors py-2 px-1 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none rounded"
                >
                  <Info size={14} />
                  <span>Research Disclaimers</span>
                </a>
              </div>

              {/* Status & Trust Metrics Bar */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 font-mono">
                <div>
                  <span className="block text-slate-600 text-[11px] uppercase tracking-wider">Computation</span>
                  <span className="text-sm font-bold text-slate-800">LHI-v2.2 Heuristic</span>
                </div>
                <div>
                  <span className="block text-slate-600 text-[11px] uppercase tracking-wider">Access Tier</span>
                  <span className="text-sm font-bold text-slate-800">Role-Based (Auth)</span>
                </div>
                <div>
                  <span className="block text-slate-600 text-[11px] uppercase tracking-wider">Telemetry Mode</span>
                  <span className="text-sm font-bold text-orange-700">Simulation Benchmark</span>
                </div>
              </div>

            </div>

            {/* Right Column: Grounded Product Image */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-slate-200 bg-white p-2.5 shadow-md overflow-hidden group">
                <img
                  src="/images/field_sensor_station.jpg"
                  alt="Remote slope-monitoring telemetry field installation featuring an automated tipping-bucket precipitation gauge, solar panel mast, and telemetry logging enclosure on a steep mountain flank"
                  className="w-full h-80 sm:h-96 object-cover rounded-xl transition-transform duration-700 motion-reduce:transition-none group-hover:scale-102"
                  loading="eager"
                />
                <div className="p-3 bg-slate-50/90 rounded-b-xl border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Radio size={14} className="text-orange-600 shrink-0" />
                    <span className="font-medium text-slate-800">Field Telemetry Station Setup</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-600">Hardware Architecture</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. PLATFORM WORKFLOW & CAPABILITIES SECTION */}
      <section 
        id="overview" 
        aria-labelledby="overview-heading"
        className="relative py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-6xl">
          
          <div className="max-w-3xl">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-orange-600">
              Operational Scope
            </span>
            <h2 id="overview-heading" className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              What You Can Do With the ATLAS Console
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Designed for geotechnical specialists, hydrologists, and emergency planning researchers, 
              ATLAS provides a unified workspace for evaluating simulated slope conditions before, during, 
              and after intensive precipitation events.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Capability 1 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700 mb-4 border border-sky-200 shadow-xs">
                  <MapPin size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Interactive Geospatial Map
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Inspect multi-region slope locations with keyless basemaps (satellite imagery, topographic relief, and OpenStreetMap). Filter by terrain angle, geological stratum, and categorical hazard levels.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                Protected Console Route: <span className="text-slate-700 font-semibold">/map</span>
              </div>
            </div>

            {/* Capability 2 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 mb-4 border border-amber-200 shadow-xs">
                  <Activity size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Dynamic Risk Calculation
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Audit the exact contribution of precipitation, soil moisture saturation, slope inclination, and pore hydrostatic pressure with full breakdown of normalized sub-scores.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                Protected Console Route: <span className="text-slate-700 font-semibold">/assessment</span>
              </div>
            </div>

            {/* Capability 3 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-700 mb-4 border border-orange-200 shadow-xs">
                  <Radio size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Threshold Alert Dispatch
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Evaluate simulated threshold breaches, inspect sensor readings, record operator acknowledgements, and observe automated cooldown mechanics to prevent notification storms.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                Protected Console Route: <span className="text-slate-700 font-semibold">/alerts</span>
              </div>
            </div>

          </div>

          {/* Topographic Imagery Showcase */}
          <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-mono font-semibold uppercase text-slate-500">Geospatial Context</span>
                <h3 className="text-xl font-bold text-slate-900">
                  Topographic &amp; Geological Vulnerability Modeling
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Landslide susceptibility is intimately connected to regional terrain geomorphology, bedrock fractures, and drainage basin geometries. ATLAS correlates slope angles from 26° to 51° with localized hydrological saturation parameters.
                </p>
                <div className="pt-2 text-xs font-mono text-slate-600 space-y-1">
                  <div>• Reference Slope Baseline: 30°</div>
                  <div>• Mohr-Coulomb Sine Angle Normalization: [0.70 – 1.35x]</div>
                </div>
              </div>
              <div className="lg:col-span-7">
                <img
                  src="/images/terrain_elevation_slope.jpg"
                  alt="High-resolution aerial satellite orthophoto of mountainous terrain showing steep drainage gullies, ridges, and valley contours for slope stability evaluation"
                  className="w-full h-64 sm:h-72 object-cover rounded-xl border border-slate-200 shadow-xs"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. LHI-V2.2 METHODOLOGY SECTION */}
      <section 
        id="methodology" 
        aria-labelledby="methodology-heading"
        className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200 bg-slate-50"
      >
        <div className="mx-auto max-w-6xl">
          
          <div className="max-w-3xl">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-orange-600">
              Scientific Transparency
            </span>
            <h2 id="methodology-heading" className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              The LHI-v2.2 Heuristic Risk Formulation
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Unlike black-box predictions, ATLAS uses an open, verifiable empirical multi-factor formula. 
              Each physical reading is normalized to a 0–100 sub-score using published geotechnical thresholds.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="text-xs font-mono font-bold text-sky-700 mb-1">Weight: 35%</div>
              <h4 className="text-sm font-bold text-slate-900">Precipitation Rate</h4>
              <p className="mt-1 text-[11px] text-slate-500">Tipping bucket optical gauge</p>
              <div className="mt-3 text-xs font-mono text-slate-700 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div>Normal: &le; 20 mm/h</div>
                <div>Warning: 25 mm/h</div>
                <div className="text-orange-700 font-semibold">Critical: 50 mm/h</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="text-xs font-mono font-bold text-amber-700 mb-1">Weight: 25%</div>
              <h4 className="text-sm font-bold text-slate-900">Soil Moisture Saturation</h4>
              <p className="mt-1 text-[11px] text-slate-500">TDR volumetric probe (1.5m depth)</p>
              <div className="mt-3 text-xs font-mono text-slate-700 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div>Normal: &le; 60 %</div>
                <div>Warning: 65 %</div>
                <div className="text-orange-700 font-semibold">Critical: 80 %</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="text-xs font-mono font-bold text-purple-700 mb-1">Weight: 25%</div>
              <h4 className="text-sm font-bold text-slate-900">Shear Displacement</h4>
              <p className="mt-1 text-[11px] text-slate-500">Bi-axial MEMS tiltmeter</p>
              <div className="mt-3 text-xs font-mono text-slate-700 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div>Normal: &le; 1.0 deg</div>
                <div>Warning: 1.2 deg</div>
                <div className="text-orange-700 font-semibold">Critical: 2.8 deg</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="text-xs font-mono font-bold text-emerald-700 mb-1">Weight: 15%</div>
              <h4 className="text-sm font-bold text-slate-900">Pore Water Pressure</h4>
              <p className="mt-1 text-[11px] text-slate-500">Vibrating wire piezometer</p>
              <div className="mt-3 text-xs font-mono text-slate-700 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div>Normal: &le; 20 kPa</div>
                <div>Warning: 28 kPa</div>
                <div className="text-orange-700 font-semibold">Critical: 45 kPa</div>
              </div>
            </div>

          </div>

          {/* Categorical Scale */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-xs font-mono shadow-xs">
            <span className="text-slate-500 uppercase text-[10px] tracking-wider block mb-2 font-bold">
              Hazard Categorization Thresholds (Composite Score / 100)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="font-bold">Low (0 – 29.9)</span>
                <span className="block text-[10px] text-emerald-700 mt-0.5">Stable hydrological baseline</span>
              </div>
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900">
                <span className="font-bold">Moderate (30 – 54.9)</span>
                <span className="block text-[10px] text-amber-700 mt-0.5">Precipitation elevation</span>
              </div>
              <div className="p-2.5 rounded bg-orange-50 border border-orange-200 text-orange-900">
                <span className="font-bold">High (55 – 74.9)</span>
                <span className="block text-[10px] text-orange-700 mt-0.5">Multi-sensor warning exceeded</span>
              </div>
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-900">
                <span className="font-bold">Critical (&ge; 75.0)</span>
                <span className="block text-[10px] text-red-700 mt-0.5">Geotechnical trigger breach</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. SENSOR HARDWARE & OPERATIONAL PIPELINE (Replaces raw developer JSON schema) */}
      <section 
        id="sensor-framework" 
        aria-labelledby="sensors-heading"
        className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-orange-600">
                Edge Ingestion Architecture
              </span>
              <h2 id="sensors-heading" className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Secure Ingestion &amp; Quality Validation Pipeline
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The platform includes an automated multi-stage telemetry pipeline designed for remote environmental 
                loggers. Incoming sensor readings pass through rate limiting, physical boundary validation, and dynamic 
                LHI recalculation without exposing raw edge internals to public views.
              </p>
              
              <ul className="space-y-2.5 text-xs text-slate-700 font-medium pt-1">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Out-of-range outlier rejection and quality scoring</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Configurable rate-of-change spike filters to prevent transient sensor glitches</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Automatic cooldown state machines to eliminate repetitive alert storms</span>
                </li>
              </ul>
            </div>

            {/* Clean Product Visual: 4-Stage Operational Ingestion Pipeline */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Server size={16} className="text-orange-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Telemetry Ingestion Pipeline
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Architecture</span>
                </div>

                {/* Stage 1 */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 font-mono text-xs font-bold shrink-0">
                    01
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">In-Situ Instrument Sampling</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Rainfall, volumetric soil moisture, tilt, and pore pressure recorded on scheduled intervals.
                    </p>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-mono text-xs font-bold shrink-0">
                    02
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Validation &amp; Noise Filtering</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Rate limiting, physical range checks, and quality assurance tagging for missing or stale nodes.
                    </p>
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 font-mono text-xs font-bold shrink-0">
                    03
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Empirical LHI-v2.2 Multi-Factor Synthesis</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Weighted normalization and Mohr-Coulomb slope angle scaling into an audit-ready 0–100 score.
                    </p>
                  </div>
                </div>

                {/* Stage 4 */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-700 font-mono text-xs font-bold shrink-0">
                    04
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Console Synchronization &amp; Advisories</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Real-time authenticated event dispatch to operator workspaces with structured cooldowns.
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. DATA INTEGRITY, LIMITATIONS & RESEARCH NOTICE SECTION */}
      <section 
        id="data-integrity" 
        aria-labelledby="integrity-heading"
        className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 bg-slate-50"
      >
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-6 sm:p-8 shadow-xs">
            <div className="flex items-start gap-3.5">
              <AlertCircle size={22} className="text-amber-700 shrink-0 mt-1" />
              <div className="space-y-3">
                <h2 id="integrity-heading" className="text-lg font-bold text-amber-950">
                  Data Verification, Prototype Status &amp; Research Limitations
                </h2>
                <div className="space-y-2 text-xs sm:text-sm text-amber-900/90 leading-relaxed font-normal">
                  <p>
                    <strong>Simulated Telemetry:</strong> All sensor locations, telemetry readings, 
                    and alert notifications displayed in this platform are generated by a synthetic simulation engine 
                    for computational testing, UI evaluation, and algorithm development.
                  </p>
                  <p>
                    <strong>No Live Emergency Feeds:</strong> The system is not connected to real-time civil defense 
                    infrastructure, municipal dispatch, or certified geotechnical field telemetry. Alert records represent 
                    demonstration scenario exercises and must not be used for life-safety or evacuation decisions.
                  </p>
                  <p>
                    <strong>Authentication Limitations:</strong> Account authentication uses local JSON Web Tokens (JWT) 
                    designed for prototype demonstration and role assignment (Admin, Operator, Viewer). It does not include 
                    multi-factor hardware tokens, enterprise single sign-on, or SOC2 compliance certification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION FOOTER BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white text-center">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            Ready to Explore the Monitoring Console?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Log in with pre-seeded demo accounts (Administrator, Monitoring Operator, or Viewer) 
            to test the geospatial maps, sensor meshes, and scenario simulator.
          </p>
          <div className="pt-2">
            <NavLink
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-7 py-3 text-sm font-semibold text-white shadow-xs hover:bg-orange-700 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
            >
              <LogIn size={16} />
              <span>Sign In to Monitoring Console</span>
              <ArrowRight size={16} />
            </NavLink>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
