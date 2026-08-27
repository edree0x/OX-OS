import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAll } from '../services/entityService'
import { collectEntityIds, resolveWidget, defaultFor } from '../lib/metrics'
import { useAppConfig } from './useAppConfig'
import type { WidgetConfig } from '../types'

export function useDashboardWidgets() {
  const config = useAppConfig()
  const widgets = config?.dashboard || []
  const ids = useMemo(() => collectEntityIds(widgets), [widgets])

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', ids],
    queryFn: async () => {
      const map: Record<string, Record<string, unknown>[]> = {}
      for (const id of ids) map[id] = await listAll(id)
      return map
    },
    enabled: ids.length > 0,
  })

  const resolved = widgets.map((w: WidgetConfig) => {
    const entId = (w.metric.split(':')[1] || '').split('.')[0]
    const fields = config?.entities.find((e) => e.id === entId)?.fields
    return {
      ...w,
      fields,
      data: data ? resolveWidget(w, data) : defaultFor(w),
    }
  })

  return { widgets: resolved, isLoading: ids.length > 0 && isLoading }
}
