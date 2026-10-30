import React from 'react';
import { ShieldCheck, AlertTriangle, Flame, AlertOctagon } from 'lucide-react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  size = 'md',
  showScore = true,
  className = ''
}) => {
  const config = {
    Low: {
      color: 'text-emerald-800',
      bg: 'bg-emerald-50 border-emerald-300',
      glow: '',
      icon: ShieldCheck,
      label: 'Low Hazard'
    },
    Moderate: {
      color: 'text-amber-800',
      bg: 'bg-amber-50 border-amber-300',
      glow: '',
      icon: AlertTriangle,
      label: 'Moderate Hazard'
    },
    High: {
      color: 'text-orange-800',
      bg: 'bg-orange-50 border-orange-300',
      glow: '',
      icon: Flame,
      label: 'High Hazard'
    },
    Critical: {
      color: 'text-red-800',
      bg: 'bg-red-50 border-red-300 font-bold',
      glow: '',
      icon: AlertOctagon,
      label: 'Critical Hazard'
    }
  }[level] || {
    color: 'text-slate-700',
    bg: 'bg-slate-100 border-slate-300',
    glow: '',
    icon: ShieldCheck,
    label: level
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold'
  }[size];

  const iconSizes = {
    sm: 13,
    md: 15,
    lg: 18
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all duration-300 ${config.bg} ${config.color} ${sizeClasses} ${className}`}
      role="status"
      aria-label={`Risk level: ${config.label}${score !== undefined ? ` (Score: ${score}/100)` : ''}`}
    >
      <Icon size={iconSizes} className="shrink-0" aria-hidden="true" />
      <span className="uppercase tracking-wider font-semibold">{level}</span>
      {showScore && score !== undefined && (
        <span className="opacity-90 font-mono text-[11px] ml-0.5">
          ({score})
        </span>
      )}
    </span>
  );
};
