import { useAppConfig } from '../../hooks/useAppConfig'
import { useConfigStore } from '../../stores/configStore'
import { Card, Button } from '../ui/primitives'
import { notify } from '../ui/Toast'
import FeatureFlagsPicker from './FeatureFlagsPicker'
import { mergeFeatureEntities } from '../../config/presets'
import type { FeatureFlags } from '../../types'

export default function FeatureFlagsPanel() {
  const config = useAppConfig()
  const updateConfig = useConfigStore((s) => s.updateConfig)

  if (!config) return null

  const current: Partial<FeatureFlags> = config.featureFlags || {}

  const setFlags = (next: Partial<FeatureFlags>) => {
    updateConfig({
      featureFlags: next,
      entities: mergeFeatureEntities(config.entities, next),
    })
    notify('Modules updated', 'success')
  }

  return (
    <Card className="p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Modules</h3>
        <p className="text-xs text-slate-400">Enable and adjust the depth of each module. New entities appear in the sidebar.</p>
      </div>
      <FeatureFlagsPicker value={current} onChange={setFlags} />
    </Card>
  )
}
