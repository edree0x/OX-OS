import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SECTOR_LIST, buildConfig, mergeFeatureEntities } from '../config/presets'
import { useConfigStore } from '../stores/configStore'
import { useAuthStore } from '../stores/authStore'
import { Card, Button } from '../components/ui/primitives'
import { Icon } from '../components/ui/Icon'
import { notify } from '../components/ui/Toast'
import FeatureFlagsPicker from '../components/setup/FeatureFlagsPicker'
import { BrandLogo } from '../components/branding/BrandLogo'
import type { FeatureFlags, CompanyProfile } from '../types'

const STEPS = ['Sector', 'Business', 'Features', 'Confirm']
const PRESETS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f43f5e', '#0f172a', '#2563eb']

export default function SetupWizard() {
  const saveConfig = useConfigStore((s) => s.setConfig)
  const updateConfig = useConfigStore((s) => s.updateConfig)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [sector, setSector] = useState(SECTOR_LIST[0].id)
  const [appName, setAppName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [companyName, setCompanyName] = useState('')
  const [tagline, setTagline] = useState('')
  const [phone, setPhone] = useState('')
  const [primary, setPrimary] = useState('#6366f1')
  const [accent, setAccent] = useState('#0ea5e9')
  const [flags, setFlags] = useState<Partial<FeatureFlags>>({
    inventory: 'basic',
    accounting: 'basic',
    purchasing: 'none',
    customerCredit: 'none',
    branches: 'none',
    workflow: 'none',
    reports: 'basic',
  })

  const preset = SECTOR_LIST.find((s) => s.id === sector)!
  const next = () => setStep((s) => s + 1)
  const back = () => setStep((s) => Math.max(0, s - 1))

  const finish = async () => {
    const entityIds = preset.entities.map((e) => e.id)
    const config = buildConfig({
      appName: appName || preset.label,
      sector,
      entityIds,
      customEntities: [],
      features: { auth: true, reports: true, pos: !!preset.posEntityId, rbac: true },
    })
    config.entities = mergeFeatureEntities(config.entities, flags)
    const company: CompanyProfile = {
      name: companyName.trim() || undefined,
      tagline: tagline.trim() || undefined,
      phone: phone.trim() || undefined,
      logoText: preset.label,
    }
    config.company = company
    config.branding = { primaryColor: primary, accentColor: accent }
    config.featureFlags = flags
    saveConfig(config)
    if (currency !== 'USD') updateConfig({ currency })
    try {
      await login('admin', 'admin')
      notify('Setup complete — welcome!', 'success')
    } catch {
      notify('Could not sign in automatically — please log in manually', 'error')
    }
    navigate('/')
  }

  const field = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100'
  const label = 'block text-sm font-medium text-slate-700 dark:text-slate-200'

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <BrandLogo className="h-9 w-9" />
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Setup Wizard</h1>
            <p className="text-xs text-slate-400">
              Step {step + 1} of {STEPS.length} — {STEPS[step]}
            </p>
          </div>
        </div>

        {step === 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SECTOR_LIST.map((s) => (
              <button
                key={s.id}
                onClick={() => setSector(s.id)}
                className={`flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition hover:border-indigo-400 ${
                  sector === s.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                }`}
              >
                <Icon name={s.icon} className="h-6 w-6 text-indigo-500" />
                <span className="text-sm font-semibold text-slate-700">{s.label}</span>
                <span className="text-xs text-slate-400">{s.entities.length} modules</span>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className={label}>App / business name</label>
              <input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder={preset.label} className={field} />
            </div>
            <div className="space-y-1">
              <label className={label}>Currency</label>
              <input value={currency} onChange={(e) => setCurrency(e.target.value)} className={field} />
            </div>
            <div className="space-y-1">
              <label className={label}>Legal company name (optional)</label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={field} />
            </div>
            <div className="space-y-1">
              <label className={label}>Tagline (optional)</label>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={field} />
            </div>
            <div className="space-y-1">
              <label className={label}>Phone (optional)</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
            </div>

            <div className="sm:col-span-2">
              <label className={label}>Primary color</label>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setPrimary(c)}
                    aria-label={`Set primary color ${c}`}
                    className={`h-8 w-8 rounded-full border-2 ${primary === c ? 'border-slate-800' : 'border-slate-200'}`}
                    style={{ background: c }}
                  />
                ))}
                <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-slate-300" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && <FeatureFlagsPicker value={flags} onChange={setFlags} />}

        {step === 3 && (
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-slate-400">Sector:</span> <span className="font-medium text-slate-700">{preset.label}</span>
            </p>
            <p>
              <span className="text-slate-400">Name:</span> <span className="font-medium text-slate-700">{appName || preset.label}</span>
            </p>
            <p>
              <span className="text-slate-400">Currency:</span> <span className="font-medium text-slate-700">{currency}</span>
            </p>
            {companyName && (
              <p>
                <span className="text-slate-400">Company:</span> <span className="font-medium text-slate-700">{companyName}</span>
              </p>
            )}
            <p className="text-slate-400">Modules: {preset.entities.map((e) => e.name).join(', ')}</p>
            <p className="text-slate-400">
              Enabled: {Object.entries(flags).filter(([, v]) => v !== 'none').length} modules
            </p>
            {preset.views.includes('tablemap') && <p className="text-slate-400">Table map enabled.</p>}
            {preset.views.includes('kanban') && <p className="text-slate-400">Kanban board enabled.</p>}
            <p className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700">
              Login afterwards with <b>admin / admin</b>. You can change everything later in Settings.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>
              Next
              <Icon name="chevron-down" className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => void finish()}>
              <Icon name="check" className="h-4 w-4" />
              Finish & start
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
