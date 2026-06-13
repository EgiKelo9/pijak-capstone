'use client'

import { clsx, type ClassValue } from "clsx"
import { CSSProperties, useState } from "react";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString?: string | Date) {
  if (!dateString) return '';
  const date = new Date(dateString as string | number | Date)
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export const CLUSTER_COLORS = ['#2BBAEE', '#5DD9C1', '#94a3b8', '#7dd3fc', '#a5b4fc', '#86efac', '#fcd34d', '#f9a8d4', '#c4b5fd'];

export const SEGMENT_LABELS = [
  { label: 'Fast Moving',   color: '#10b981', bg: '#d1fae5' },
  { label: 'High Moving',   color: '#34d399', bg: '#ecfdf5' },
  { label: 'Growing',       color: '#2BBAEE', bg: '#e0f7ff' },
  { label: 'Medium Moving', color: '#60a5fa', bg: '#eff6ff' },
  { label: 'Steady',        color: '#a78bfa', bg: '#f5f3ff' },
  { label: 'Slowing Down',  color: '#f59e0b', bg: '#fef3c7' },
  { label: 'Low Moving',    color: '#fb923c', bg: '#fff7ed' },
  { label: 'At Risk',       color: '#f87171', bg: '#fef2f2' },
  { label: 'Nearly Dead',   color: '#ef4444', bg: '#fee2e2' },
  { label: 'Dead Stock',    color: '#991b1b', bg: '#fecaca' },
];

export function getSegmentLabel(rank: number, total: number) {
  if (total === 1) return SEGMENT_LABELS[0];
  const idx = Math.round((rank / (total - 1)) * (SEGMENT_LABELS.length - 1));
  return SEGMENT_LABELS[Math.min(idx, SEGMENT_LABELS.length - 1)];
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}rb`;
  return n.toFixed(1);
}

export function useHoverStyle(baseStyle?: CSSProperties) {
  const [hovered, setHovered] = useState(false);
  const style: CSSProperties = {
    ...baseStyle,
    transform: hovered ? 'translateY(-3px) scale(1.01)' : 'translateY(0) scale(1)',
    boxShadow: hovered ? '0 12px 32px rgba(43,186,238,0.13)' : '0 1px 4px rgba(0,0,0,0.06)',
    transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
    cursor: 'pointer',
  };
  return { hovered, setHovered, style };
}

function isSecureCookie(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:';
}

export function setCookie(name: string, value: string, maxAge: number, options?: { sameSite?: 'Strict' | 'Lax' | 'None' }): void {
  const sameSite = options?.sameSite || 'Strict';
  const secureFlag = isSecureCookie() ? '; Secure' : '';
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=${sameSite}${secureFlag}`;
}

export function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}