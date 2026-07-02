import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'purple';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-blue-100 text-blue-800',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-cyan-100 text-cyan-700',
  muted: 'bg-slate-100 text-slate-600',
  purple: 'bg-purple-100 text-purple-700',
};

const statusMap: Record<string, BadgeVariant> = {
  DRAFT: 'muted',
  PENDING_APPROVAL: 'warning',
  REJECTED: 'danger',
  APPROVED: 'default',
  OPEN: 'success',
  IN_PROGRESS: 'info',
  COMPLETED: 'purple',
  ARCHIVED: 'muted',
  SCORING_OPEN: 'info',
  SCORING_LOCKED: 'warning',
  ACTIVE: 'success',
  INACTIVE: 'muted',
  PENDING: 'warning',
  APPROVED_ACCOUNT: 'success',
  SUBMITTED: 'default',
  PROMOTED: 'success',
  DISQUALIFIED: 'danger',
  PUBLISHED: 'success',
  SCORED: 'purple',
  NOT_SCORED: 'warning',
};

export function StatusBadge({ status, label }: { status?: string | null; label?: string }) {
  const safeStatus = status ?? '';
  const variant = statusMap[safeStatus] || 'muted';
  const styles = variantStyles[variant];
  const displayLabel = label || safeStatus.replace(/_/g, ' ') || 'UNKNOWN';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-mono tracking-wide ${styles}`}>
      {displayLabel}
    </span>
  );
}

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]}`}>
      {children}
    </span>
  );
}
