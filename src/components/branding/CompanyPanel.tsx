import { useRef, useState } from 'react'
import { useAppConfig } from '../../hooks/useAppConfig'
import { useConfigStore } from '../../stores/configStore'
import { Card, Button } from '../ui/primitives'
import { Icon } from '../ui/Icon'
import { notify } from '../ui/Toast'
import { BrandLogo } from './BrandLogo'
import { applyBranding, DEFAULT_BRANDING } from '../../lib/branding'
import type { CompanyProfile, Branding } from '../../types'

const PRESETS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f43f5e', '#0f172a', '#2563eb']

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export default function CompanyPanel() {
  const config = useAppConfig()
  const updateConfig = useConfigStore((s) => s.updateConfig)
  const logoRef = useRef<HTMLInputElement>(null)

  const company: CompanyProfile = config?.company ?? {}
  const branding: Branding = config?.branding ?? DEFAULT_BRANDING

  const [name, setName] = useState(company.name ?? '')
  const [tagline, setTagline] = useState(company.tagline ?? '')
  const [address, setAddress] = useState(company.address ?? '')
  const [phone, setPhone] = useState(company.phone ?? '')
  const [email, setEmail] = useState(company.email ?? '')
  const [website, setWebsite] = useState(company.website ?? '')
  const [taxId, setTaxId] = useState(company.taxId ?? '')
  const [header, setHeader] = useState(company.receiptHeader ?? '')
  const [footer, setFooter] = useState(company.receiptFooter ?? '')
  const [primary, setPrimary] = useState(branding.primaryColor)
  const [accent, setAccent] = useState(branding.accentColor)

  const field = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100'
  const label = 'block text-sm font-medium text-slate-700 dark:text-slate-200'

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 1024 * 1024) {
      notify('Logo must be under 1MB', 'error')
      return
    }
    const dataUrl = await readFileAsDataURL(file)
    updateConfig({ company: { ...company, logo: dataUrl } })
    notify('Logo updated', 'success')
  }

  const save = () => {
    if (!config) return
    updateConfig({
      company: {
        ...company,
        name: name.trim() || undefined,
        tagline: tagline.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        taxId: taxId.trim() || undefined,
        receiptHeader: header.trim() || undefined,
        receiptFooter: footer.trim() || undefined,
      },
      branding: { ...branding, primaryColor: primary, accentColor: accent },
    })
    applyBranding({ ...branding, primaryColor: primary, accentColor: accent })
    notify('Company profile saved', 'success')
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="home" className="h-5 w-5 text-[var(--brand-primary)]" />
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Company &amp; brand</h3>
          <p className="text-xs text-slate-400">Your logo, colors and details appear across the app and every printed document.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <BrandLogo className="h-16 w-16" />
          <div className="space-y-2">
            <Button size="sm" variant="outline" onClick={() => logoRef.current?.click()}>
              <Icon name="upload" className="h-4 w-4" />
              Upload logo
            </Button>
            {company.logo && (
              <Button size="sm" variant="ghost" onClick={() => updateConfig({ company: { ...company, logo: undefined } })}>
                Remove logo
              </Button>
            )}
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Company name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>Tagline</label>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>Website</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>Tax / VAT ID</label>
            <input value={taxId} onChange={(e) => setTaxId(e.target.value)} className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={field} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Primary color</label>
            <div className="flex flex-wrap items-center gap-2">
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-9 w-10 cursor-pointer rounded border border-slate-300" />
              <input value={primary} onChange={(e) => setPrimary(e.target.value)} className={`${field} w-32`} />
            </div>
          </div>
          <div>
            <label className={label}>Accent color</label>
            <div className="flex flex-wrap items-center gap-2">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-9 w-10 cursor-pointer rounded border border-slate-300" />
              <input value={accent} onChange={(e) => setAccent(e.target.value)} className={`${field} w-32`} />
            </div>
          </div>
        </div>

        <div>
          <label className={label}>Presets</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setPrimary(c)}
                aria-label={`Set primary color ${c}`}
                className="h-8 w-8 rounded-full border border-slate-300"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Receipt header</label>
            <input value={header} onChange={(e) => setHeader(e.target.value)} placeholder="Optional extra line on receipts" className={field} />
          </div>
          <div>
            <label className={label}>Receipt footer</label>
            <input value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="Thank you / contact line" className={field} />
          </div>
        </div>

        <div>
          <Button onClick={save}>Save company profile</Button>
        </div>
      </div>
    </Card>
  )
}
