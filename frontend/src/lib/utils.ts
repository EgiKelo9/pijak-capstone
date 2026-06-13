import { clsx, type ClassValue } from "clsx"
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