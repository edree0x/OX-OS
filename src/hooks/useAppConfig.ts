import { useConfigStore } from '../stores/configStore'
import { setCurrency } from '../lib/utils'

export function useAppConfig() {
  const config = useConfigStore((s) => s.config)
  if (config?.currency) setCurrency(config.currency)
  return config
}

export function useIsConfigured() {
  return useConfigStore((s) => s.config !== null)
}
