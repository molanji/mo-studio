'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatRs, formatCurrency, BILLING_REGIONS } from '@/lib/pricingCalc'

const accent = '#2A4FD4'
const MARGIN_COLORS = { red: '#E03028', amber: '#F5F248', green: '#B8EAC4' }
const RISK_COLORS = { Low: '#B8EAC4', Medium: '#F5F248', High: '#E03028' }

const STATUS_OPTIONS = ['inquiry', 'proposal_sent', 'signed', 'active', 'completed', 'ghosted']

export default function ViewQuotePage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/pricing/projects/${id}`).then(r => r.json()).then(d => {
      setProject(d.project)
      setLoading(false)
    })
  }, [id])

  async function updateStatus(status) {
    await fetch(`/api/pricing/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setProject(p => ({ ...p, status }))
  }

  async function deleteProject() {
    if (!confirm('Delete this quote? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/pricing/projects/${id}`, { method: 'DELETE' })
    router.push('/pricing')
  }

  if (loading || !project) {
    return <div style={{ minHeight: '100vh', background: '#111', display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: '#555' }}>Loading…</div>
  }

  const { client_profile: profile, scope, pricing } = project

  return (
    <div style={{ minHeight: '100vh', background: '#111', padding: '0 24px 80px' }}>
      <nav style={{ maxWidth: 760, margin: '0 auto', padding: '28px 0',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #1E1E1E', marginBottom: 32 }}>
        <Link href="/pricing" style={{ color: '#555', fontSize: '0.85rem' }}>← Pricing Tool</Link>
        <span style={{ color: '#333' }}>/</span>
        <span style={{ fontSize: '0.85rem', color: '#F0F0F0', fontWeight: 600 }}>{project.client_name}</span>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ width: 32, height: 3, background: accent, borderRadius: 99, marginBottom: 16 }} />
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em',
              color: '#F0F0F0', marginBottom: 6 }}>{project.client_name}</h1>
            <p style={{ color: '#555', fontSize: '0.85rem' }}>
              Created {new Date(project.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={project.status} onChange={e => updateStatus(e.target.value)} style={{
              background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8,
              color: '#F0F0F0', padding: '8px 14px', fontSize: '0.85rem' }}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <Link href={`/pricing/${id}/quote`} style={{
              background: '#B8EAC4', border: 'none', borderRadius: 8,
              color: '#0C2818', padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700,
              whiteSpace: 'nowrap' }}>
              Generate Quote
            </Link>
            <Link href={`/pricing/${id}/edit`} style={{
              background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8,
              color: '#888', padding: '8px 14px', fontSize: '0.82rem', fontWeight: 600,
              whiteSpace: 'nowrap' }}>
              Edit
            </Link>
            <button onClick={deleteProject} disabled={deleting} title="Delete quote" style={{
              background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8,
              color: '#555', padding: '8px 12px', fontSize: '0.9rem', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E03028'; e.currentTarget.style.color = '#E03028' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#555' }}>
              {deleting ? '…' : '🗑'}
            </button>
          </div>
        </div>

        {/* Pricing summary */}
        <div style={{ background: '#1A1A1A', border: `2px solid ${MARGIN_COLORS[pricing.marginStatus]}`,
          borderRadius: 14, padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: '0.7rem', color: '#555', marginBottom: 6 }}>RECOMMENDED PRICE</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#F0F0F0' }}>{formatRs(pricing.recommendedPrice)}</p>
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
              <p style={{ fontSize: '0.68rem', color: '#555', marginBottom: 4 }}>FLOOR</p>
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
              the floor needed to hit a healthy margin ({formatRs(pricing.floorPrice)}). Usually caused by too many
              founders assigned relative to days estimated. Do not proceed without review.
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 14,
          padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Full Breakdown</h3>
          {(() => {
            const fc = (inr) => pricing.isInternational && pricing.exchangeRateToInr > 1
              ? ` (${formatCurrency(inr / pricing.exchangeRateToInr, pricing.billingCurrency)})`
              : ''
            const intlRows = pricing.isInternational ? [
              [`Total (ex taxes)${fc(pricing.totalProjectValueExGst)}`, pricing.totalProjectValueExGst, true],
              ['Export of services — GST zero-rated', 0],
              ...(pricing.grossUpWithholding && pricing.withholdingRate > 0 ? [
                [`Withholding gross-up (${Math.round(pricing.withholdingRate*100)}%)${fc(pricing.withholdingAmountInr)}`, pricing.withholdingAmountInr],
                [`Invoice amount${fc(pricing.totalPayableIncGst)}`, pricing.totalPayableIncGst, true],
                [`Client withholds (${Math.round(pricing.withholdingRate*100)}%)${fc(pricing.withholdingAmountInr)}`, -pricing.withholdingAmountInr],
              ] : [
                [`Invoice amount${fc(pricing.totalPayableIncGst)}`, pricing.totalPayableIncGst, true],
              ]),
              [`Net Molanji receives${fc(pricing.actualCashReceived)}`, pricing.actualCashReceived, true],
            ] : [
              ['Total project value (ex GST)', pricing.totalProjectValueExGst, true],
              ['GST (18%)', pricing.gstAmount],
              ['Total payable (inc GST)', pricing.totalPayableIncGst, true],
              ['TDS client deducts (10%)', -pricing.tdsAmount],
              ['Actual cash Molanji receives', pricing.actualCashReceived, true],
            ]
            return [
              ['Base project price', pricing.baseProjectPrice],
              ['Rush premium', pricing.rushPremium],
              ['Freelancer + 3rd party passthrough', pricing.passthroughTotal],
              ['Contingency', pricing.contingencyAmount],
              ...intlRows,
              ...(pricing.findersFeeAmount > 0 ? [
                [`Finder's fee (${pricing.findersFeePercent}%)`, -pricing.findersFeeAmount],
                ['Net to Molanji after finder\'s fee', pricing.netAfterFindersFee, true],
              ] : []),
              ['Effective hourly rate', pricing.effectiveHourlyRate],
            ]
          })().map(([label, val, bold]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', padding: '8px 0',
              borderBottom: '1px solid #1E1E1E',
            }}>
              <span style={{ fontSize: '0.85rem', color: bold ? '#F0F0F0' : '#888', fontWeight: bold ? 700 : 400 }}>{label}</span>
              <span style={{ fontSize: '0.85rem', color: bold ? '#F0F0F0' : '#CCC', fontWeight: bold ? 700 : 400 }}>{formatRs(val)}</span>
            </div>
          ))}
        </div>

        {/* Client profile */}
        <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 14,
          padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Client Profile</h3>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: '0.7rem', color: '#555', marginBottom: 4 }}>RISK SCORE</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: RISK_COLORS[profile.riskScore] }}>{profile.riskScore}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: '#555', marginBottom: 4 }}>ENGAGEMENT MODEL</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#F0F0F0' }}>{profile.suggestedEngagement}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: '#555', marginBottom: 4 }}>DAY RATE</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#F0F0F0' }}>{formatRs(profile.dayRate)}</p>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.7 }}>
            Industry: {profile.industry} · Client size: {profile.client_size?.replace('_',' ')} ·
            Found via: {profile.found_via?.replace('_',' ')} · Decision maker: {profile.decision_maker} ·
            Budget: {profile.budget_range?.replace('_',' ')} · Rush: {profile.rush_project}
          </p>
          {pricing.isInternational && (
            <p style={{ fontSize: '0.78rem', color: '#555', marginTop: 8 }}>
              Billing region: {BILLING_REGIONS[profile.billing_region]?.label || profile.billing_region} ·
              Currency: {pricing.billingCurrency} ·
              Rate: ₹{(pricing.exchangeRateToInr || 1).toFixed(2)}/{pricing.billingCurrency}
              {pricing.withholdingRate > 0 && ` · Withholding: ${Math.round(pricing.withholdingRate*100)}%${pricing.grossUpWithholding ? ' (grossed up)' : ''}`}
            </p>
          )}
        </div>

        {/* Scope */}
        <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Scope</h3>
          <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: 10 }}>
            <strong style={{ color: '#F0F0F0' }}>Included:</strong>{' '}
            {scope.included?.map(i => i.label).join(', ') || 'None'}
          </p>
          {scope.excluded?.length > 0 && (
            <p style={{ fontSize: '0.8rem', color: '#444' }}>
              <strong style={{ color: '#666' }}>Not included:</strong> {scope.excluded.join(', ')}
            </p>
          )}
          <p style={{ fontSize: '0.85rem', color: '#888', marginTop: 10 }}>
            Total: {scope.totalDays} days · {scope.totalHours} hours
          </p>
        </div>
      </div>
    </div>
  )
}
