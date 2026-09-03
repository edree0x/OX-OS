import { useAppConfig } from '../../hooks/useAppConfig'
import { initials } from '../../lib/branding'

export function BrandLogo({ className = 'h-8 w-8 text-sm', text }: { className?: string; text?: string }) {
  const config = useAppConfig()
  const logo = config?.company?.logo
  if (logo) {
    return (
      <img
        src={logo}
        alt={config?.company?.name || config?.appName || 'logo'}
        className={`${className} rounded-lg object-contain`}
      />
    )
  }
  const wordmark = text || config?.company?.logoText || config?.company?.name || config?.appName || 'E'
  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)] font-bold text-white`}
    >
      {initials(wordmark)}
    </div>
  )
}

export function BrandWordmark({ className = 'text-lg' }: { className?: string }) {
  const config = useAppConfig()
  return <span className={`truncate font-semibold text-slate-800 dark:text-slate-100 ${className}`}>{config?.company?.name || config?.appName}</span>
}
