import type { Branding } from '../types'

export const DEFAULT_BRANDING: Branding = {
  primaryColor: '#6366f1',
  accentColor: '#0ea5e9',
  neutral: false,
}

/** Adjust a hex color's lightness for hover/darken variants. */
export function shade(hex: string, percent: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  const t = percent < 0 ? 0 : 255
  const p = Math.abs(percent) / 100
  const rr = Math.round((t - r) * p + r)
  const gg = Math.round((t - g) * p + g)
  const bb = Math.round((t - b) * p + b)
  return `#${((1 << 24) + (rr << 16) + (gg << 8) + bb).toString(16).slice(1)}`
}

/** Compute a full set of CSS variables for the brand. */
export function brandCssVariables(branding: Branding): Record<string, string> {
  const primary = branding.primaryColor || DEFAULT_BRANDING.primaryColor
  const accent = branding.accentColor || DEFAULT_BRANDING.accentColor
  return {
    '--brand-primary': primary,
    '--brand-primary-hover': shade(primary, -12),
    '--brand-primary-soft': primary + '1a',
    '--brand-primary-soft-strong': primary + '2b',
    '--brand-accent': accent,
    '--brand-accent-hover': shade(accent, -12),
  }
}

/** Write brand CSS variables onto the documentElement. */
export function applyBranding(branding?: Branding) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const resolved = branding && !branding.neutral ? branding : DEFAULT_BRANDING
  const vars = brandCssVariables(resolved)
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v)
  }
}

/** Monogram initials from a company/app name (fallback wordmark). */
export function initials(name?: string): string {
  if (!name) return 'E'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'E'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
