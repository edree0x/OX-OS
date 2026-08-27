import { useMemo } from 'react'
import { useAppConfig } from './useAppConfig'
import { getActiveModules } from '../modules/registry'
import type { ModuleDef } from '../types'

export function useModules(): ModuleDef[] {
  const config = useAppConfig()
  return useMemo(() => (config ? getActiveModules(config) : []), [config])
}
