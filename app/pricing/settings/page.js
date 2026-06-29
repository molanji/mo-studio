'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { calcStudioDerived, formatRs } from '@/lib/pricingCalc'

const accent = '#2A4FD4'

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600,
        color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', background: '#111', border: '1px solid #2A2A2A',
  borderRadius: 8, color: '#F0F0F0', padding: '9px 12px',
  fontSize: '0.85rem', outline: 'none',
}

export default function SettingsPage() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/pricing/config').then(r => r.json()).then(d => {
      setConfig(d.config)
      setLoading(false)
    })
  }, [])

  function update(path, value) {
    setConfig(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let obj = next
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return next
    })
    setSaved(false)
  }

  function updateFixedCost(idx, field, value) {
    setConfig(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      next.fixed_costs[idx][field] = field === 'amount' ? Number(value) : value
      return next
    })
    setSaved(false)
  }

  function addFixedCost() {
    setConfig(prev => ({ ...prev, fixed_costs: [...prev.fixed_costs, { label: '', amount: 0 }] }))
  }

  function removeFixedCost(idx) {
    setConfig(prev => ({ ...prev, fixed_costs: prev.fixed_costs.filter((_, i) => i !== idx) }))
  }

  async function save() {
    setSaving(true)
    await fetch('/api/pricing/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setSaving(false)
    setSaved(true)
  }

  if (loading || !config) {
    return <div style={{ minHeight: '100vh', background: '#111', display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: '#555' }}>Loading config…</div>
  }

  const derived = calcStudioDerived(config)

  return (
    <div style={{ minHeight: '100vh', background: '#111', padding: '0 24px 80px' }}>
      <nav style={{ maxWidth: 800, margin: '0 auto', padding: '28px 0',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #1E1E1E', marginBottom: 48 }}>
        <Link href="/" style={{ color: '#555', fontSize: '0.85rem' }}>← MO Studio</Link>
        <span style={{ color: '#333' }}>/</span>
        <Link href="/pricing" style={{ color: '#555', fontSize: '0.85rem' }}>Pricing Tool</Link>
        <span style={{ color: '#333' }}>/</span>
        <span style={{ fontSize: '0.85rem', color: '#F0F0F0', fontWeight: 600 }}>Studio Settings</span>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ width: 32, height: 3, background: accent, borderRadius: 99, marginBottom: 16 }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em',
          color: '#F0F0F0', marginBottom: 6 }}>Studio Cost Base</h1>
        <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: 32 }}>
          Single source of truth — update quarterly, not per project
        </p>

        {/* Derived summary */}
        <div style={{ background: '#0A1228', border: `1px solid ${accent}`, borderRadius: 14,
          padding: 24, marginBottom: 32 }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#7B93E8',
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
            Derived Studio Constants
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {[
              ['Monthly break-even', formatRs(derived.monthlyBreakeven)],
              ['Daily break-even / person', formatRs(derived.dailyBreakevenPerPerson)],
              ['Hourly break-even / person', formatRs(derived.hourlyBreakevenPerPerson)],
              ['Revenue needed for target margin', formatRs(derived.monthlyRevenueNeeded)],
            ].map(([label, val]) => (
              <div key={label}>
                <p style={{ fontSize: '0.72rem', color: '#6B82C8', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{val}</p>
              </div>
            ))}
          </div>
          {derived.stretchAlert && (
            <div style={{ marginTop: 16, background: 'rgba(224,48,40,0.15)',
              border: '1px solid rgba(224,48,40,0.3)', borderRadius: 8,
              padding: '10px 14px', color: '#E03028', fontSize: '0.8rem' }}>
              ⚠ Revenue needed to hit target margin is more than 2x break-even — consider reviewing cost base or margin target.
            </div>
          )}
        </div>

        {/* Founder draws */}
        <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 14,
          padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>
            Founder Draws (Monthly)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {Object.entries(config.founder_draws).map(([name, amount]) => (
              <Field key={name} label={name}>
                <input type="number" value={amount} style={inputStyle}
                  onChange={e => update(`founder_draws.${name}`, Number(e.target.value))} />
              </Field>
            ))}
          </div>
        </div>

        {/* Fixed costs */}
        <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 14,
          padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>
            Fixed Monthly Costs
          </h3>
          {config.fixed_costs.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input type="text" value={c.label} placeholder="Tool name"
                style={{ ...inputStyle, flex: 2 }}
                onChange={e => updateFixedCost(i, 'label', e.target.value)} />
              <input type="number" value={c.amount} placeholder="Amount"
                style={{ ...inputStyle, flex: 1 }}
                onChange={e => updateFixedCost(i, 'amount', e.target.value)} />
              <button onClick={() => removeFixedCost(i)} style={{
                background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8,
                color: '#E03028', padding: '0 14px', fontSize: '0.85rem' }}>×</button>
            </div>
          ))}
          <button onClick={addFixedCost} style={{
            background: 'transparent', border: '1px dashed #333', borderRadius: 8,
            color: '#666', padding: '8px 14px', fontSize: '0.8rem', marginTop: 4 }}>
            + Add cost item
          </button>
        </div>

        {/* Studio params */}
        <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 14,
          padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>
            Studio Parameters
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Field label="Target Gross Margin %">
              <input type="number" value={config.target_margin_percent} style={inputStyle}
                onChange={e => update('target_margin_percent', Number(e.target.value))} />
            </Field>
            <Field label="Working Days / Month">
              <input type="number" value={config.working_days_per_month} style={inputStyle}
                onChange={e => update('working_days_per_month', Number(e.target.value))} />
            </Field>
            <Field label="Working Hours / Day">
              <input type="number" value={config.working_hours_per_day} style={inputStyle}
                onChange={e => update('working_hours_per_day', Number(e.target.value))} />
            </Field>
            <Field label="Billable Founders">
              <input type="number" value={config.billable_founders} style={inputStyle}
                onChange={e => update('billable_founders', Number(e.target.value))} />
            </Field>
          </div>
        </div>

        {/* Rate tiers */}
        <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 14,
          padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>
            Rate Tiers (Day Rate, Rs)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {Object.entries(config.rate_tiers).map(([tier, rate]) => (
              <Field key={tier} label={tier.replace('_', ' ')}>
                <input type="number" value={rate} style={inputStyle}
                  onChange={e => update(`rate_tiers.${tier}`, Number(e.target.value))} />
              </Field>
            ))}
          </div>
        </div>

        {/* Other config */}
        <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 14,
          padding: 24, marginBottom: 32 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>
            Other Settings
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Field label="Rush Premium %">
              <input type="number" value={config.rush_premium_percent} style={inputStyle}
                onChange={e => update('rush_premium_percent', Number(e.target.value))} />
            </Field>
            <Field label="Standard Revision Rounds">
              <input type="number" value={config.standard_revision_rounds} style={inputStyle}
                onChange={e => update('standard_revision_rounds', Number(e.target.value))} />
            </Field>
            <Field label="Passthrough Markup %">
              <input type="number" value={config.passthrough_markup_percent} style={inputStyle}
                onChange={e => update('passthrough_markup_percent', Number(e.target.value))} />
            </Field>
            <Field label="Default Contingency %">
              <input type="number" value={config.contingency_default_percent} style={inputStyle}
                onChange={e => update('contingency_default_percent', Number(e.target.value))} />
            </Field>
            <Field label="Margin Red Threshold %">
              <input type="number" value={config.margin_red_threshold} style={inputStyle}
                onChange={e => update('margin_red_threshold', Number(e.target.value))} />
            </Field>
            <Field label="Margin Green Threshold %">
              <input type="number" value={config.margin_green_threshold} style={inputStyle}
                onChange={e => update('margin_green_threshold', Number(e.target.value))} />
            </Field>
          </div>
        </div>

        <button onClick={save} disabled={saving} style={{
          width: '100%', padding: 14, background: saved ? '#0C2818' : accent,
          border: saved ? '1px solid #B8EAC4' : 'none', borderRadius: 10,
          color: saved ? '#B8EAC4' : '#fff', fontSize: '0.95rem', fontWeight: 700,
          opacity: saving ? 0.6 : 1,
        }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Studio Config'}
        </button>
      </div>
    </div>
  )
}
