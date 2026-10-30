import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  accentColor?: 'emerald' | 'amber' | 'orange' | 'red' | 'blue' | 'purple';
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'blue',
  onClick,
  className = ''
}) => {
  const accentClasses = {
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200 group-hover:border-emerald-300',
    amber: 'text-amber-800 bg-amber-50 border-amber-200 group-hover:border-amber-300',
    orange: 'text-orange-700 bg-orange-50 border-orange-200 group-hover:border-orange-300',
    red: 'text-rose-700 bg-rose-50 border-rose-200 group-hover:border-rose-300',
    blue: 'text-sky-700 bg-sky-50 border-sky-200 group-hover:border-sky-300',
    purple: 'text-indigo-700 bg-indigo-50 border-indigo-200 group-hover:border-indigo-300'
  }[accentColor];

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl bg-white border border-slate-200 p-5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {value}
            </span>
            {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
          </div>
        </div>
        <div className={`rounded-lg border p-2.5 transition-colors ${accentClasses}`}>
          <Icon size={20} />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`font-medium ${
                trend.isPositive === true
                  ? 'text-emerald-700 font-semibold'
                  : trend.isPositive === false
                  ? 'text-rose-700 font-semibold'
                  : 'text-slate-600'
              }`}
            >
              {trend.value} {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
