import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  MapPin,
  Radio,
  Activity,
  AlertTriangle,
  BarChart3,
  Shield,
  LogOut,
  LogIn,
  Menu,
  X,
  User as UserIcon,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { SimulationDrawer } from '../components/SimulationDrawer';

export const AppLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected, notifications, dismissNotification } = useSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isPublicPage = location.pathname === '/' || location.pathname === '/login';
  const activeAlertCount = notifications.filter(n => n.status === 'active').length;

  const consoleNavLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/map', label: 'Geospatial Map', icon: MapPin },
    { to: '/sensors', label: 'Sensor Mesh', icon: Radio },
    { to: '/assessment', label: 'Risk Intelligence', icon: Activity },
    { to: '/alerts', label: 'Alert Center', icon: AlertTriangle, badge: activeAlertCount > 0 ? activeAlertCount : undefined },
    { to: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
    ...(user?.role === 'admin' ? [{ to: '/audit', label: 'Audit Trail', icon: Shield }] : [])
  ];

  const publicNavLinks = [
    { to: '/#overview', label: 'Platform Overview' },
    { to: '/#methodology', label: 'Heuristic Model' },
    { to: '/#sensor-framework', label: 'Sensor Framework' },
    { to: '/#data-integrity', label: 'Data & Disclaimers' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-orange-100 selection:text-orange-900 antialiased font-sans">
      {/* Skip to main content for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-orange-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-md focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Brand Logo & Product Tag */}
          <div className="flex items-center gap-6">
            <NavLink
              to="/"
              className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none rounded-lg p-1"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white shadow-xs transition-transform group-hover:scale-105">
                <Compass size={20} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-base font-extrabold tracking-wider text-slate-900">
                  ATLAS<span className="text-orange-600">.</span>EARTH
                </span>
                <span className="text-[10px] tracking-widest uppercase text-slate-500 font-medium">
                  Landslide Hazard Intelligence
                </span>
              </div>
            </NavLink>

            {/* Desktop Navigation */}
            {isAuthenticated ? (
              <nav className="hidden lg:flex items-center gap-1 ml-3" aria-label="Operational Console Navigation">
                {consoleNavLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none ${
                          isActive
                            ? 'bg-orange-50 text-orange-700 border border-orange-200 font-semibold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon size={14} className="shrink-0" />
                      <span>{link.label}</span>
                      {link.badge !== undefined && (
                        <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                          {link.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            ) : (
              <nav className="hidden lg:flex items-center gap-6 ml-6" aria-label="Public Navigation">
                {publicNavLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.to}
                    className="text-xs font-medium text-slate-600 hover:text-orange-600 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none rounded py-1 px-1.5"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Authenticated Socket Status */}
                <div
                  className={`hidden md:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-mono border ${
                    isConnected
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                  title={
                    isConnected
                      ? 'Authenticated event stream connected (simulated test events)'
                      : 'Telemetry socket disconnected or establishing link...'
                  }
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>{isConnected ? 'DEMO STREAM' : 'OFFLINE'}</span>
                </div>

                {/* Explicit Demo Data Tag */}
                <span className="hidden sm:inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-medium tracking-wider text-slate-600">
                  DEMO DATASET
                </span>

                {/* User Session Info & Sign Out */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-900">{user?.name}</span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-orange-600 font-semibold">
                      {user?.role} (Demo Account)
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none shadow-xs"
                    title="Sign out of console"
                    aria-label="Sign out"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                  Prototype Evaluation
                </span>
                <NavLink
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-orange-600/30 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 hover:border-orange-600 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none shadow-xs"
                >
                  <LogIn size={13} />
                  <span>Sign In</span>
                </NavLink>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-md">
            {isAuthenticated ? (
              consoleNavLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                        isActive
                          ? 'bg-orange-50 text-orange-700 border border-orange-200 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} />
                      <span>{link.label}</span>
                    </div>
                    {link.badge !== undefined && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                        {link.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })
            ) : (
              <>
                {publicNavLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="pt-2 border-t border-slate-200">
                  <NavLink
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-xs"
                  >
                    <LogIn size={15} />
                    <span>Sign In to Console</span>
                  </NavLink>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Authenticated Floating Toast Notifications */}
      {isAuthenticated && notifications.length > 0 && (
        <div
          role="region"
          aria-label="Demonstration Alert Notifications"
          className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-auto"
        >
          {notifications.map((alert) => (
            <div
              key={alert._id}
              className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-xl ${
                alert.severity === 'Critical'
                  ? 'border-red-200 bg-red-50 text-slate-800'
                  : 'border-orange-200 bg-orange-50 text-slate-800'
              }`}
            >
              <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    [DEMO] {alert.severity} Threshold Event
                  </span>
                  <button
                    onClick={() => dismissNotification(alert._id)}
                    className="text-slate-400 hover:text-slate-700 focus-visible:ring-1 focus-visible:ring-slate-400 rounded p-0.5"
                    aria-label="Dismiss notification"
                  >
                    <X size={13} />
                  </button>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-900">{alert.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600 line-clamp-2">
                  {alert.message}
                </p>
                <button
                  onClick={() => {
                    dismissNotification(alert._id);
                    navigate('/alerts');
                  }}
                  className="mt-2 text-[11px] font-medium underline text-orange-700 hover:text-orange-900"
                >
                  Review in Alert Center &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Viewport */}
      <main id="main-content" className="flex-1 focus:outline-none">
        <Outlet />
      </main>

      {/* Simulation Controller Drawer: only shown when authenticated */}
      {isAuthenticated && <SimulationDrawer />}

      {/* Global Accessible Light Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass size={15} className="text-orange-600 shrink-0" />
            <span className="font-semibold text-slate-700">
              ATLAS Geospatial Intelligence & Environmental Risk Systems
            </span>
          </div>
          <div className="text-center sm:text-right space-y-0.5">
            <p className="text-[11px] text-slate-600">
              Landslide Hazard Index (LHI-v2.2) Decision-Support Prototype.
            </p>
            <p className="text-[10px] text-slate-400">
              Research & evaluation tool. Not a substitute for certified civil geotechnical slope assessments or official meteorological hazard directives.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
