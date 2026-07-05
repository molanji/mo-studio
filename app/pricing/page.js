'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatRs } from '@/lib/pricingCalc'

const accent = '#2A4FD4'

const STATUS_COLORS = {
  inquiry: '#666',
  proposal_sent: '#F0A0CC',
  signed: '#B8EAC4',
  active: '#2A4FD4',
  completed: '#6ee7b7',
  ghosted: '#E03028',
}

const MARGIN_COLORS = { red: '#E03028', amber: '#F5F248', green: '#B8EAC4' }

export default function PricingDashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    fetch('/api/pricing/projects').then(r => r.json()).then(d => {
      setProjects(d.projects || [])
      setLoading(false)
    })
  }, [])

  async function deleteProject(e, id) {
    e.preventDefault()
    if (!confirm('Delete this quote? This cannot be undone.')) return
    setDeleting(id)
    await fetch(`/api/pricing/projects/${id}`, { method: 'DELETE' })
    setProjects(prev => prev.filter(p => p.id !== id))
    setDeleting(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#111', padding: '0 24px 80px' }}>
      <nav style={{ maxWidth: 900, margin: '0 auto', padding: '28px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #1E1E1E', marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#555', fontSize: '0.85rem' }}>← MO Studio</Link>
          <span style={{ color: '#333' }}>/</span>
          <span style={{ fontSize: '0.85rem', color: '#F0F0F0', fontWeight: 600 }}>Pricing Tool</span>
        </div>
        <Link href="/pricing/settings" style={{
          fontSize: '0.8rem', color: '#7B93E8', border: '1px solid #2A2A2A',
          borderRadius: 8, padding: '6px 14px' }}>
          ⚙ Studio Settings
        </Link>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div style={{ width: 32, height: 3, background: accent, borderRadius: 99, marginBottom: 16 }} />
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em',
              color: '#F0F0F0', marginBottom: 6 }}>Pricing Tool</h1>
            <p style={{ color: '#555', fontSize: '0.9rem' }}>
              Every quote, grounded in real costs and margins
            </p>
          </div>
          <Link href="/pricing/new" style={{
            background: accent, color: '#fff', borderRadius: 10,
            padding: '12px 22px', fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
            + New Quote
          </Link>
        </div>

        {loading ? (
          <p style={{ color: '#555', fontSize: '0.85rem' }}>Loading quotes…</p>
        ) : projects.length === 0 ? (
          <div style={{ background: '#141414', border: '1px dashed #222', borderRadius: 14,
            padding: 48, textAlign: 'center' }}>
            <p style={{ color: '#444', fontSize: '0.9rem', marginBottom: 16 }}>No quotes yet</p>
            <Link href="/pricing/new" style={{
              background: accent, color: '#fff', borderRadius: 8,
              padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700 }}>
              Create your first quote →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {projects.map(p => (
              <Link key={p.id} href={`/pricing/${p.id}`} style={{ display: 'block' }}>
                <div style={{
                  background: '#1A1A1A', border: '1px solid #222', borderRadius: 12,
                  padding: '16px 20px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 16,
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#F0F0F0', fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
                      {p.client_name}
                    </p>
                    <p style={{ color: '#555', fontSize: '0.75rem' }}>
                      {new Date(p.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                    </p>
                  </div>

                  {p.pricing?.recommendedPrice && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#F0F0F0', fontWeight: 700, fontSize: '0.95rem' }}>
                        {formatRs(p.pricing.recommendedPrice)}
                      </p>
                      <p style={{ color: MARGIN_COLORS[p.pricing.marginStatus] || '#555', fontSize: '0.72rem' }}>
                        {p.pricing.grossMarginPercent}% margin
                      </p>
                    </div>
                  )}

                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, padding: '4px 10px',
                    borderRadius: 99, color: STATUS_COLORS[p.status] || '#666',
                    border: `1px solid ${STATUS_COLORS[p.status] || '#666'}`,
                    whiteSpace: 'nowrap',
                  }}>
                    {p.status.replace('_', ' ')}
                  </span>

                  <button onClick={e => deleteProject(e, p.id)} disabled={deleting === p.id}
                    title="Delete quote"
                    style={{
                      background: 'transparent', border: 'none', color: '#444',
                      fontSize: '1rem', padding: '4px 6px', cursor: 'pointer',
                      borderRadius: 6, lineHeight: 1,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#E03028'}
                    onMouseLeave={e => e.currentTarget.style.color = '#444'}>
                    {deleting === p.id ? '…' : '🗑'}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
