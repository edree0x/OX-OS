import { describe, it, expect } from 'vitest'
import { brandCssVariables, shade, initials } from './branding'

describe('branding', () => {
  it('computes brand css variables from primary color', () => {
    const vars = brandCssVariables({ primaryColor: '#6366f1', accentColor: '#0ea5e9' })
    expect(vars['--brand-primary']).toBe('#6366f1')
    expect(vars['--brand-primary-hover']).toBeTruthy()
    expect(vars['--brand-accent']).toBe('#0ea5e9')
    // soft variants embed the alpha suffix
    expect(vars['--brand-primary-soft']).toMatch(/^#6366f11a$/)
  })

  it('shade darkens toward black for negative percent', () => {
    const darker = shade('#6366f1', -12)
    expect(darker.startsWith('#')).toBe(true)
    expect(darker.length).toBe(7)
    expect(darker).not.toBe('#6366f1')
  })

  it('builds initials from company name', () => {
    expect(initials('Acme Foods')).toBe('AF')
    expect(initials('acme')).toBe('AC')
    expect(initials()).toBe('E')
    expect(initials('   ')).toBe('E')
  })
})
