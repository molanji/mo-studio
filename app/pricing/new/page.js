'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  calcStudioDerived, calcClientProfile, calcScope, calcPricing,
  DELIVERABLES, formatRs,
} from '@/lib/pricingCalc'

const accent = '#2A4FD4'

const inputStyle = {
  width: '100%', background: '#111', border: '1px solid #2A2A2A',
  borderRadius: 8, color: '#F0F0F0', padding: '9px 12px',
  fontSize: '0.85rem', outline: 'none',
}

function Field({ label, children, span }) {
  return (
    <div style={{ marginBottom: 14, gridColumn: span ? `span ${span}` : undefined }}>
      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600,
        color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

const RISK_COLORS = { Low: '#B8EAC4', Medium: '#F5F248', High: '#E03028' }
const MARGIN_COLORS = { red: '#E03028', amber: '#F5F248', green: '#B8EAC4' }

export default function NewQuotePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState(null)
  const [saving, setSaving] = useState(false)

  const [clientName, setClientName] = useState('')
  const [profile, setProfile] = useState({
    industry: 'd2c', client_size: 'bootstrapped', found_via: 'referral',
    decision_maker: 'unknown', budget_range: 'not_disclosed',
    first_time: 'unknown', rush_project: 'no', country: 'india',
  })

  const [scope, setScope] = useState({
    added_deliverables: [],
    founders_on_project: 1,
    freelancer_involved: 'no',
    freelancer_cost: 0,
    revision_rounds: 2,
    days_per_revision_round: 1,
    third_party_items: [
      { label: 'Stock Assets', amount: 0 },
      { label: 'Plugins / Software', amount: 0 },
      { label: 'Printing / Production', amount: 0 },
    ],
    contingency_percent: 10,
  })

  // Add-deliverable UI state
  const [dropdownKey, setDropdownKey] = useState('')
  const [addTime, setAddTime] = useState(1)
  const [addUnit, setAddUnit] = useState('days')
  const [addQty, setAddQty] = useState(1)
  const [customLabel, setCustomLabel] = useState('')
  const [saveToLib, setSaveToLib] = useState(false)
  const [savingToLib, setSavingToLib] = useState(false)

  const [extraRevisionRounds, setExtraRevisionRounds] = useState(0)

  useEffect(() => {
    fetch('/api/pricing/config').then(r => r.json()).then(d => {
      setConfig(d.config)
      setScope(s => ({ ...s, contingency_percent: d.config.contingency_default_percent }))
    })
  }, [])

  if (!config) {
    return <div style={{ minHeight: '100vh', background: '#111', display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: '#555' }}>Loading…</div>
  }

  const derived = calcStudioDerived(config)
  const configWithDerived = { ...config, derived }
  const clientProfile = calcClientProfile(profile, config)
  const scopeResult = calcScope(scope, clientProfile.dayRate, config.working_hours_per_day || 8)
  scopeResult.foundersOnProject = Number(scope.founders_on_project)
  scopeResult.freelancerCost = scope.freelancer_involved === 'yes' ? Number(scope.freelancer_cost) : 0
  scopeResult.daysPerRevisionRound = Number(scope.days_per_revision_round)
  const pricing = calcPricing({ scopeResult, clientProfile, config: configWithDerived, extraRevisionRounds })

  // Full deliverables list: built-in + saved custom ones from config
  const allDeliverables = [
    ...DELIVERABLES,
    ...(config.custom_deliverables || []).map(d => ({ ...d, isCustom: true })),
  ]

  // Only show options not already added
  const addedKeys = new Set(scope.added_deliverables.map(d => d.key))
  const availableOptions = allDeliverables.filter(d => !addedKeys.has(d.key))

  function updateAddedDeliverable(idx, field, value) {
    setScope(s => {
      const next = [...s.added_deliverables]
      next[idx] = { ...next[idx], [field]: value }
      return { ...s, added_deliverables: next }
    })
  }

  function removeAddedDeliverable(idx) {
    setScope(s => ({ ...s, added_deliverables: s.added_deliverables.filter((_, i) => i !== idx) }))
  }

  function handleDropdownChange(val) {
    setDropdownKey(val)
    if (val && val !== '__custom__') {
      const found = allDeliverables.find(d => d.key === val)
      if (found) { setAddTime(found.defaultDays); setAddUnit('days'); setAddQty(1) }
    } else {
      setAddTime(1)
      setAddUnit('days')
      setAddQty(1)
    }
  }

  async function handleAdd() {
    if (!dropdownKey) return

    if (dropdownKey === '__custom__') {
      if (!customLabel.trim()) return
      const newItem = {
        key: `custom_${Date.now()}`,
        label: customLabel.trim(),
        timeValue: Number(addTime) || 1,
        timeUnit: addUnit,
        quantity: 1,
        perUnit: false,
        isCustom: true,
      }
      setScope(s => ({ ...s, added_deliverables: [...s.added_deliverables, newItem] }))
      if (saveToLib) {
        setSavingToLib(true)
        const defaultDays = addUnit === 'hours'
          ? (Number(addTime) / (config.working_hours_per_day || 8))
          : Number(addTime)
        const newCustom = [
          ...(config.custom_deliverables || []),
          { key: newItem.key, label: newItem.label, defaultDays },
        ]
        const newConfig = { ...config, custom_deliverables: newCustom }
        await fetch('/api/pricing/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newConfig),
        })
        setConfig(newConfig)
        setSavingToLib(false)
      }
      setCustomLabel('')
      setSaveToLib(false)
    } else {
      const found = allDeliverables.find(d => d.key === dropdownKey)
      if (!found || addedKeys.has(found.key)) return
      setScope(s => ({
        ...s,
        added_deliverables: [...s.added_deliverables, {
          key: found.key,
          label: found.label,
          timeValue: Number(addTime) || found.defaultDays,
          timeUnit: addUnit,
          quantity: Number(addQty) || 1,
          perUnit: found.perUnit || false,
          unitLabel: found.unitLabel,
          isCustom: found.isCustom || false,
        }],
      }))
    }

    setDropdownKey('')
    setAddTime(1)
    setAddUnit('days')
    setAddQty(1)
  }

  async function saveQuote() {
    setSaving(true)
    const res = await fetch('/api/pricing/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: clientName || 'Untitled Client',
        status: 'proposal_sent',
        client_profile: { ...profile, ...clientProfile },
        scope: { ...scope, ...scopeResult },
        pricing,
      }),
    })
    const data = await res.json()
    router.push(`/pricing/${data.id}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#111', padding: '0 24px 80px' }}>
      <nav style={{ maxWidth: 760, margin: '0 auto', padding: '28px 0',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #1E1E1E', marginBottom: 32 }}>
        <Link href="/pricing" style={{ color: '#555', fontSize: '0.85rem' }}>← Pricing Tool</Link>
        <span style={{ color: '#333' }}>/</span>
        <span style={{ fontSize: '0.85rem', color: '#F0F0F0', fontWeight: 600 }}>New Quote</span>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {['Client Profile', 'Scope Builder', 'Pricing'].map((label, i) => (
            <div key={label} style={{
              flex: 1, padding: '10px 14px', borderRadius: 8,
              background: step === i + 1 ? accent : '#1A1A1A',
              border: `1px solid ${step === i + 1 ? accent : '#222'}`,
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600,
                color: step === i + 1 ? '#fff' : '#555' }}>
                {i + 1}. {label}
              </span>
            </div>
          ))}
        </div>

        {/* STEP 1 — Client Profiling */}
        {step === 1 && (
          <div>
            <Field label="Client Name">
              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
                placeholder="e.g. Acme Corp" style={inputStyle} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Industry">
                <Select value={profile.industry} onChange={v => setProfile(p => ({ ...p, industry: v }))}
                  options={[['d2c','D2C'],['startup','Startup'],['fmcg','FMCG'],['entertainment','Entertainment'],
                    ['hospitality','Hospitality'],['enterprise','Enterprise'],['other','Other']]} />
              </Field>
              <Field label="Client Size">
                <Select value={profile.client_size} onChange={v => setProfile(p => ({ ...p, client_size: v }))}
                  options={[['bootstrapped','Bootstrapped / pre-revenue'],['seed','Seed funded (<Rs 5cr)'],
                    ['series_a_plus','Series A+ funded'],['established','Established (Rs 10-100cr)'],
                    ['enterprise','Large enterprise (Rs 100cr+)'],['international','International (USD budget)']]} />
              </Field>
              <Field label="How did they find Molanji">
                <Select value={profile.found_via} onChange={v => setProfile(p => ({ ...p, found_via: v }))}
                  options={[['referral','Referral'],['portfolio','Portfolio/Website'],['instagram','Instagram'],
                    ['cold_outreach','Cold outreach'],['other','Other']]} />
              </Field>
              <Field label="Decision Maker Identified?">
                <Select value={profile.decision_maker} onChange={v => setProfile(p => ({ ...p, decision_maker: v }))}
                  options={[['yes','Yes'],['no','No'],['unknown','Unknown']]} />
              </Field>
              <Field label="Budget Range Indicated">
                <Select value={profile.budget_range} onChange={v => setProfile(p => ({ ...p, budget_range: v }))}
                  options={[['under_1l','Under Rs 1 lakh'],['1_3l','Rs 1-3 lakh'],['3_7l','Rs 3-7 lakh'],
                    ['7_15l','Rs 7-15 lakh'],['15l_plus','Rs 15 lakh+'],['not_disclosed','Not disclosed']]} />
              </Field>
              <Field label="First time hiring an agency?">
                <Select value={profile.first_time} onChange={v => setProfile(p => ({ ...p, first_time: v }))}
                  options={[['yes','Yes'],['no','No'],['unknown','Unknown']]} />
              </Field>
              <Field label="Rush Project?">
                <Select value={profile.rush_project} onChange={v => setProfile(p => ({ ...p, rush_project: v }))}
                  options={[['no','No'],['yes','Yes (+25% premium)']]} />
              </Field>
              <Field label="Country">
                <Select value={profile.country} onChange={v => setProfile(p => ({ ...p, country: v }))}
                  options={[['india','India'],['international','International']]} />
              </Field>
            </div>

            {/* Live outputs */}
            <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12,
              padding: 20, marginTop: 8, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#555', marginBottom: 4 }}>RATE TIER</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#F0F0F0' }}>
                    {formatRs(clientProfile.dayRate)}/day
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#555', marginBottom: 4 }}>RISK SCORE</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: RISK_COLORS[clientProfile.riskScore] }}>
                    {clientProfile.riskScore}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#555', marginBottom: 4 }}>ENGAGEMENT MODEL</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#F0F0F0' }}>
                    {clientProfile.suggestedEngagement}
                  </p>
                </div>
              </div>
              {clientProfile.riskScore === 'High' && (
                <div style={{ marginTop: 14, background: 'rgba(224,48,40,0.12)',
                  border: '1px solid rgba(224,48,40,0.3)', borderRadius: 8,
                  padding: '10px 14px', color: '#E03028', fontSize: '0.8rem' }}>
                  ⚠ Consider qualifying this lead further before investing in a proposal
                </div>
              )}
            </div>

            <button onClick={() => setStep(2)} style={{
              width: '100%', padding: 14, background: accent, border: 'none',
              borderRadius: 10, color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>
              Next: Scope Builder →
            </button>
          </div>
        )}

        {/* STEP 2 — Scope Builder */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F0F0F0', marginBottom: 6 }}>
              Deliverables
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#555', marginBottom: 12 }}>
              Pick from the dropdown and set days. Add your own if it's not in the list.
            </p>

            {/* Added items list */}
            <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12,
              padding: 16, marginBottom: 12 }}>
              {scope.added_deliverables.length === 0 ? (
                <p style={{ color: '#444', fontSize: '0.82rem', textAlign: 'center', padding: '16px 0' }}>
                  Nothing added yet. Use the dropdown below.
                </p>
              ) : scope.added_deliverables.map((item, idx) => (
                <div key={item.key} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 0', borderBottom: '1px solid #1E1E1E',
                }}>
                  <span style={{ flex: 1, fontSize: '0.85rem', color: '#F0F0F0' }}>
                    {item.label}
                    {item.isCustom && (
                      <span style={{ marginLeft: 6, fontSize: '0.65rem', color: '#444',
                        background: '#222', borderRadius: 4, padding: '1px 5px' }}>custom</span>
                    )}
                  </span>
                  {item.perUnit && (
                    <>
                      <input type="number" value={item.quantity} min={1}
                        onChange={e => updateAddedDeliverable(idx, 'quantity', Number(e.target.value))}
                        style={{ ...inputStyle, width: 55 }} />
                      <span style={{ fontSize: '0.72rem', color: '#555', whiteSpace: 'nowrap' }}>
                        {item.unitLabel || 'units'}
                      </span>
                    </>
                  )}
                  <input type="number" value={item.timeValue ?? item.days ?? 0}
                    step={item.timeUnit === 'hours' ? 1 : 0.5}
                    onChange={e => updateAddedDeliverable(idx, 'timeValue', e.target.value)}
                    style={{ ...inputStyle, width: 60 }} />
                  <select value={item.timeUnit || 'days'}
                    onChange={e => updateAddedDeliverable(idx, 'timeUnit', e.target.value)}
                    style={{ ...inputStyle, width: 72, padding: '9px 6px' }}>
                    <option value="days">days</option>
                    <option value="hours">hrs</option>
                  </select>
                  <button onClick={() => removeAddedDeliverable(idx)} style={{
                    background: 'transparent', border: 'none', color: '#555',
                    fontSize: '1.2rem', padding: '0 4px', cursor: 'pointer', lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Add row */}
            <div style={{ background: '#1A1A1A', border: '1px dashed #2A2A2A', borderRadius: 12,
              padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center',
                marginBottom: dropdownKey === '__custom__' ? 12 : 0 }}>
                <select value={dropdownKey} onChange={e => handleDropdownChange(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}>
                  <option value="">— Select deliverable to add —</option>
                  {availableOptions.map(d => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                  <option value="__custom__">+ Custom (not in list)</option>
                </select>

                {dropdownKey && dropdownKey !== '__custom__' && (() => {
                  const found = allDeliverables.find(d => d.key === dropdownKey)
                  return found?.perUnit ? (
                    <input type="number" value={addQty} min={1}
                      onChange={e => setAddQty(Number(e.target.value))}
                      style={{ ...inputStyle, width: 55 }} placeholder={found.unitLabel} />
                  ) : null
                })()}

                {dropdownKey && dropdownKey !== '__custom__' && (
                  <input type="number" value={addTime}
                    step={addUnit === 'hours' ? 1 : 0.5}
                    onChange={e => setAddTime(Number(e.target.value))}
                    style={{ ...inputStyle, width: 60 }} />
                )}

                {dropdownKey && dropdownKey !== '__custom__' && (
                  <select value={addUnit} onChange={e => setAddUnit(e.target.value)}
                    style={{ ...inputStyle, width: 72, padding: '9px 6px' }}>
                    <option value="days">days</option>
                    <option value="hours">hrs</option>
                  </select>
                )}

                {dropdownKey && (
                  <button onClick={handleAdd} style={{
                    background: accent, border: 'none', borderRadius: 8,
                    color: '#fff', padding: '9px 16px', fontSize: '0.85rem',
                    fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                    Add
                  </button>
                )}
              </div>

              {dropdownKey === '__custom__' && (
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <input type="text" value={customLabel}
                      onChange={e => setCustomLabel(e.target.value)}
                      placeholder="Deliverable name (e.g. Brand audit)"
                      style={{ ...inputStyle, flex: 1 }} />
                    <input type="number" value={addTime}
                      step={addUnit === 'hours' ? 1 : 0.5}
                      onChange={e => setAddTime(Number(e.target.value))}
                      style={{ ...inputStyle, width: 60 }} />
                    <select value={addUnit} onChange={e => setAddUnit(e.target.value)}
                      style={{ ...inputStyle, width: 72, padding: '9px 6px' }}>
                      <option value="days">days</option>
                      <option value="hours">hrs</option>
                    </select>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: '0.8rem', color: '#666', cursor: 'pointer' }}>
                    <input type="checkbox" checked={saveToLib}
                      onChange={e => setSaveToLib(e.target.checked)}
                      style={{ accentColor: accent }} />
                    {savingToLib ? 'Saving to library…' : 'Save to my deliverables library for future quotes'}
                  </label>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
              <Field label="Founders on Project">
                <Select value={String(scope.founders_on_project)}
                  onChange={v => setScope(s => ({ ...s, founders_on_project: Number(v) }))}
                  options={[['1','1'],['1.5','1.5'],['2','2'],['3','3']]} />
              </Field>
              <Field label="External Freelancer Involved?">
                <Select value={scope.freelancer_involved}
                  onChange={v => setScope(s => ({ ...s, freelancer_involved: v }))}
                  options={[['no','No'],['yes','Yes']]} />
              </Field>
              {scope.freelancer_involved === 'yes' && (
                <Field label="Freelancer Cost (Rs, one-time)" span={2}>
                  <input type="number" value={scope.freelancer_cost} style={inputStyle}
                    onChange={e => setScope(s => ({ ...s, freelancer_cost: e.target.value }))} />
                </Field>
              )}
              <Field label="Revision Rounds Included">
                <input type="number" value={scope.revision_rounds} style={inputStyle}
                  onChange={e => setScope(s => ({ ...s, revision_rounds: e.target.value }))} />
              </Field>
              <Field label="Days per Revision Round">
                <input type="number" value={scope.days_per_revision_round} style={inputStyle}
                  onChange={e => setScope(s => ({ ...s, days_per_revision_round: e.target.value }))} />
              </Field>
            </div>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F0F0F0', margin: '20px 0 12px' }}>
              Third-Party Costs (Rs)
            </h3>
            <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12,
              padding: 16, marginBottom: 8 }}>
              {scope.third_party_items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input type="text" value={item.label} placeholder="Cost label"
                    style={{ ...inputStyle, flex: 2 }}
                    onChange={e => setScope(s => {
                      const next = [...s.third_party_items]
                      next[i] = { ...next[i], label: e.target.value }
                      return { ...s, third_party_items: next }
                    })} />
                  <input type="number" value={item.amount} placeholder="0"
                    style={{ ...inputStyle, flex: 1 }}
                    onChange={e => setScope(s => {
                      const next = [...s.third_party_items]
                      next[i] = { ...next[i], amount: e.target.value }
                      return { ...s, third_party_items: next }
                    })} />
                  <button onClick={() => setScope(s => ({
                    ...s, third_party_items: s.third_party_items.filter((_, j) => j !== i),
                  }))} style={{
                    background: 'transparent', border: 'none', color: '#555',
                    fontSize: '1.2rem', padding: '0 4px', cursor: 'pointer', lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              ))}
              <button onClick={() => setScope(s => ({
                ...s, third_party_items: [...s.third_party_items, { label: '', amount: 0 }],
              }))} style={{
                background: 'transparent', border: '1px dashed #333', borderRadius: 8,
                color: '#666', padding: '7px 14px', fontSize: '0.8rem', marginTop: 4, cursor: 'pointer' }}>
                + Add cost item
              </button>
            </div>

            <Field label="Contingency %">
              <input type="number" value={scope.contingency_percent} style={{ ...inputStyle, maxWidth: 120 }}
                onChange={e => setScope(s => ({ ...s, contingency_percent: e.target.value }))} />
            </Field>

            {/* Live scope summary */}
            <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12,
              padding: 20, marginTop: 16, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: scopeResult.excluded.length ? 14 : 0 }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#555', marginBottom: 4 }}>TOTAL DAYS</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F0F0F0' }}>{scopeResult.totalDays}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#555', marginBottom: 4 }}>TOTAL HOURS</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F0F0F0' }}>{scopeResult.totalHours}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#555', marginBottom: 4 }}>3RD PARTY TOTAL</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F0F0F0' }}>{formatRs(scopeResult.thirdPartyCostsTotal)}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#555', marginBottom: 4 }}>CONTINGENCY</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F0F0F0' }}>{formatRs(scopeResult.contingencyAmount)}</p>
                </div>
              </div>
              {scopeResult.excluded.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: '#444' }}>
                  <strong style={{ color: '#666' }}>Not included:</strong> {scopeResult.excluded.join(', ')}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: 14, background: 'transparent', border: '1px solid #2A2A2A',
                borderRadius: 10, color: '#888', fontSize: '0.9rem', fontWeight: 600 }}>
                ← Back
              </button>
              <button onClick={() => setStep(3)} style={{
                flex: 2, padding: 14, background: accent, border: 'none',
                borderRadius: 10, color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>
                Next: Pricing →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Pricing Calculator */}
        {step === 3 && (
          <div>
            <div style={{ background: '#1A1A1A', border: `2px solid ${MARGIN_COLORS[pricing.marginStatus]}`,
              borderRadius: 14, padding: 28, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#555', marginBottom: 6 }}>RECOMMENDED PRICE</p>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: '#F0F0F0' }}>
                    {formatRs(pricing.recommendedPrice)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.7rem', color: '#555', marginBottom: 6 }}>GROSS MARGIN</p>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: MARGIN_COLORS[pricing.marginStatus] }}>
                    {pricing.grossMarginPercent}%
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ background: '#111', borderRadius: 8, padding: 12 }}>
                  <p style={{ fontSize: '0.68rem', color: '#555', marginBottom: 4 }}>FLOOR (never go below)</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#E03028' }}>{formatRs(pricing.floorPrice)}</p>
                </div>
                <div style={{ background: '#111', borderRadius: 8, padding: 12 }}>
                  <p style={{ fontSize: '0.68rem', color: '#555', marginBottom: 4 }}>RECOMMENDED</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#B8EAC4' }}>{formatRs(pricing.recommendedPrice)}</p>
                </div>
                <div style={{ background: '#111', borderRadius: 8, padding: 12 }}>
                  <p style={{ fontSize: '0.68rem', color: '#555', marginBottom: 4 }}>STRETCH</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F5F248' }}>{formatRs(pricing.stretchPrice)}</p>
                </div>
              </div>

              {pricing.recommendedPrice < pricing.floorPrice && (
                <div style={{ marginTop: 16, background: 'rgba(224,48,40,0.12)',
                  border: '1px solid rgba(224,48,40,0.3)', borderRadius: 8,
                  padding: '12px 14px', color: '#E03028', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  ⚠ <strong>Underpriced:</strong> the day-rate price ({formatRs(pricing.recommendedPrice)}) is below
                  the floor needed to hit a healthy margin ({formatRs(pricing.floorPrice)}). This usually means too many
                  founders are assigned relative to the days estimated — internal cost scales with founders-on-project,
                  but the day rate doesn't. Either reduce founders on this project, increase the day estimate, or
                  charge closer to the floor price. Do not send this quote without review.
                </div>
              )}
            </div>

            <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 14,
              padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Full Breakdown</h3>
              {[
                ['Base project price', pricing.baseProjectPrice],
                ['Rush premium', pricing.rushPremium],
                ['Freelancer + 3rd party passthrough', pricing.passthroughTotal],
                ['Contingency', pricing.contingencyAmount],
                ['Total project value (ex GST)', pricing.totalProjectValueExGst, true],
                ['GST (18%)', pricing.gstAmount],
                ['Total payable (inc GST)', pricing.totalPayableIncGst, true],
                ['TDS client deducts (10%)', -pricing.tdsAmount],
                ['Actual cash Molanji receives', pricing.actualCashReceived, true],
                ['Effective hourly rate', pricing.effectiveHourlyRate],
                ['Additional revision round cost', pricing.additionalRevisionRoundCost],
              ].map(([label, val, bold]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                  borderBottom: '1px solid #1E1E1E',
                }}>
                  <span style={{ fontSize: '0.85rem', color: bold ? '#F0F0F0' : '#888', fontWeight: bold ? 700 : 400 }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: bold ? '#F0F0F0' : '#CCC', fontWeight: bold ? 700 : 400 }}>
                    {formatRs(val)}
                  </span>
                </div>
              ))}

              <div style={{ marginTop: 16 }}>
                <Field label="Extra Revision Rounds Requested (beyond standard)">
                  <input type="number" value={extraRevisionRounds} style={{ ...inputStyle, maxWidth: 120 }}
                    onChange={e => setExtraRevisionRounds(Number(e.target.value))} />
                </Field>
                {extraRevisionRounds > 0 && (
                  <p style={{ fontSize: '0.8rem', color: '#F5F248' }}>
                    + {formatRs(pricing.extraRevisionCostTotal)} for {extraRevisionRounds} extra round(s)
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={{
                flex: 1, padding: 14, background: 'transparent', border: '1px solid #2A2A2A',
                borderRadius: 10, color: '#888', fontSize: '0.9rem', fontWeight: 600 }}>
                ← Back
              </button>
              <button onClick={saveQuote} disabled={saving} style={{
                flex: 2, padding: 14, background: '#B8EAC4', border: 'none',
                borderRadius: 10, color: '#111', fontSize: '0.95rem', fontWeight: 700,
                opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : '✓ Save Quote'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
