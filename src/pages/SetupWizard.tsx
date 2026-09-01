import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SECTOR_LIST, buildConfig } from '../config/presets'
import { useConfigStore } from '../stores/configStore'
import { useAuthStore } from '../stores/authStore'
import { Card, Button } from '../components/ui/primitives'
import { Icon } from '../components/ui/Icon'
import { notify } from '../components/ui/Toast'

const STEPS = ['Sector', 'Details', 'Confirm']

export default function SetupWizard() {
  const saveConfig = useConfigStore((s) => s.setConfig)
  const updateConfig = useConfigStore((s) => s.updateConfig)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [sector, setSector] = useState(SECTOR_LIST[0].id)
  const [appName, setAppName] = useState('')
  const [currency, setCurrency] = useState('USD')

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

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">E</div>
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
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Business name</label>
              <input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder={preset.label} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Currency</label>
              <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
        )}

        {step === 2 && (
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
            <p className="text-slate-400">Modules: {preset.entities.map((e) => e.name).join(', ')}</p>
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
