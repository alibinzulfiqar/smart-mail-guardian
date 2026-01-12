import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getRiskColor(riskLevel: string): string {
  switch (riskLevel.toLowerCase()) {
    case 'safe':
      return 'text-green-500';
    case 'suspicious':
      return 'text-orange-500';
    case 'dangerous':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

export function getRiskBgColor(riskLevel: string): string {
  switch (riskLevel.toLowerCase()) {
    case 'safe':
      return 'bg-green-500/10';
    case 'suspicious':
      return 'bg-orange-500/10';
    case 'dangerous':
      return 'bg-red-500/10';
    default:
      return 'bg-gray-500/10';
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}
