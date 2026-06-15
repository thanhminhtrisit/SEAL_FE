import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  accent?: 'blue' | 'cyan' | 'green' | 'amber' | 'red' | 'purple';
}

const accentMap = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-l-blue-600' },
  cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', border: 'border-l-cyan-600' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-l-emerald-600' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-l-amber-600' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-l-red-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-l-purple-600' },
};

export function KPICard({ title, value, subtitle, icon: Icon, trend, accent = 'blue' }: KPICardProps) {
  const colors = accentMap[accent];
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 ${colors.border} p-5 flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`${colors.bg} p-2.5 rounded-lg`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs">
          {trend.value > 0 ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : trend.value < 0 ? (
            <TrendingDown className="w-3 h-3 text-red-500" />
          ) : (
            <Minus className="w-3 h-3 text-slate-400" />
          )}
          <span className={trend.value > 0 ? 'text-emerald-600' : trend.value < 0 ? 'text-red-600' : 'text-slate-500'}>
            {Math.abs(trend.value)}%
          </span>
          <span className="text-slate-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
