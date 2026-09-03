import type { FeatureTier } from '../../types'

const MODULES: { key: keyof NonNullable<import('../../types').AppConfig['featureFlags']>; label: string; desc: string }[] = [
  { key: 'inventory', label: 'Inventory', desc: 'Stock movements, balances, reorder alerts' },
  { key: 'accounting', label: 'Accounting', desc: 'Invoices, payments and financial reports' },
  { key: 'purchasing', label: 'Purchasing', desc: 'Suppliers and purchase orders' },
  { key: 'customerCredit', label: 'Customer credit', desc: 'AR balances, limits, payment history' },
  { key: 'branches', label: 'Branches', desc: 'Multiple locations under one company' },
  { key: 'workflow', label: 'Workflow', desc: 'Status transitions and approvals' },
  { key: 'reports', label: 'Reports', desc: 'Period reports, exports, KPIs' },
]

const TIERS: { value: FeatureTier; label: string }[] = [
  { value: 'none', label: 'Off' },
  { value: 'basic', label: 'Basic' },
  { value: 'advanced', label: 'Advanced' },
]

export default function FeatureFlagsPicker({
  value,
  onChange,
}: {
  value: Partial<NonNullable<import('../../types').AppConfig['featureFlags']>>
  onChange: (v: Partial<NonNullable<import('../../types').AppConfig['featureFlags']>>) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Choose how deep each module should be. You can change this later in Settings.</p>
      {MODULES.map((m) => {
        const current = value[m.key] ?? 'basic'
        return (
          <div key={m.key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{m.label}</p>
              <p className="text-xs text-slate-400">{m.desc}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              {TIERS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => onChange({ ...value, [m.key]: t.value })}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    current === t.value
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
