'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatRs } from '@/lib/pricingCalc'

const LOGO_SVG = `<svg viewBox="0 0 2800 563" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M638.387 281.172C638.387 112.001 750.388 0 919.559 0C1088.73 0 1202.29 112.001 1202.29 281.172C1202.29 450.342 1089.52 562.344 919.559 562.344C749.599 562.344 638.387 450.342 638.387 281.172ZM920.333 405.694C988.475 405.694 1036.25 354.792 1036.25 281.172C1036.25 207.551 988.475 156.65 920.333 156.65C852.191 156.65 805.205 207.551 805.205 281.172C805.205 354.792 852.191 405.694 920.333 405.694Z" fill="white"/><path d="M1233.62 7.82764H1386.34V411.958H1463.88V554.495H1233.62V7.82764Z" fill="white"/><path d="M1573.53 7.82764H1795.18L1898.56 554.495H1746.62L1738 492.621H1631.49L1622.1 554.495H1473.29L1573.55 7.82764H1573.53ZM1719.98 368.888L1685.52 134.717H1683.96L1649.49 368.888H1719.97H1719.98Z" fill="white"/><path d="M1914.22 7.82764H2097.49L2193.83 339.112H2195.39L2160.91 7.82764H2317.56V554.495H2135.08L2038.74 222.421H2037.18L2071.66 554.495H1914.22V7.82764Z" fill="white"/><path d="M2346.54 545.889V383.776C2373.17 403.353 2396.66 412.747 2416.24 412.747C2438.17 412.747 2449.92 401.001 2449.92 374.366V7.82764H2602.64V400.212C2602.64 508.298 2546.24 562.326 2442.86 562.326C2411.54 562.326 2377.86 556.847 2346.52 545.875L2346.54 545.889Z" fill="white"/><path d="M2647.28 7.82764H2800V554.495H2647.28V7.82764Z" fill="white"/><path d="M447.32 554.509H607.558L607.603 7.39525L425.003 7.36549L330.823 388.748L318.064 7.35059H135.465L0 554.479H160.238L210.306 137.5L213.641 554.494H396.166L500.261 137.485L447.32 554.509Z" fill="white"/></svg>`

const round100 = n => Math.round((n || 0) / 100) * 100

export default function QuotePage() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/pricing/projects/${id}`).then(r => r.json()).then(d => {
      setProject(d.project)
      setLoading(false)
    })
  }, [id])

  if (loading || !project) {
    return <div style={{ minHeight: '100vh', background: '#111', display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: '#555' }}>Loading…</div>
  }

  const { client_profile: cp, scope, pricing } = project
  const dayRate = cp?.dayRate || 0
  const included = scope?.included || []
  const excluded = (scope?.excluded || []).filter(Boolean)
  const revisionRounds = scope?.revision_rounds ?? 2

  const quoteRef = `MNJ-${String(id).padStart(4, '0')}`
  const quoteDate = new Date(project.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // Per-deliverable prices
  const deliverableRows = included
    .filter(item => item.days > 0)
    .map(item => ({
      label: item.label,
      duration: item.timeLabel || `${item.days} day${item.days !== 1 ? 's' : ''}`,
      price: round100(item.days * dayRate),
    }))

  // Totals
  const deliverableSubtotal = deliverableRows.reduce((s, r) => s + r.price, 0)
  const rushPremium = pricing?.rushPremium || 0
  const passthrough = pricing?.passthroughTotal || 0
  const contingency = pricing?.contingencyAmount || 0
  const totalExGst = pricing?.totalProjectValueExGst || 0
  const gst = pricing?.gstAmount || 0
  const totalPayable = pricing?.totalPayableIncGst || 0

  // Payment milestones (50/25/25)
  const m1 = round100(totalPayable * 0.50)
  const m2 = round100(totalPayable * 0.25)
  const m3 = totalPayable - m1 - m2

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; }
          .quote-page { padding: 0 !important; background: white !important; }
          @page { size: A4; margin: 0; }
        }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>

      {/* Top nav — hidden on print */}
      <div className="no-print" style={{
        background: '#111', padding: '16px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #1E1E1E',
      }}>
        <Link href={`/pricing/${id}`} style={{ color: '#555', fontSize: '0.85rem' }}>
          ← Back to Quote
        </Link>
        <button onClick={() => window.print()} style={{
          background: '#F5F248', border: 'none', borderRadius: 8,
          color: '#111', padding: '10px 22px', fontSize: '0.88rem',
          fontWeight: 700, cursor: 'pointer',
        }}>
          Download PDF
        </button>
      </div>

      {/* Quote document */}
      <div className="quote-page" style={{ background: '#F8F8F6', minHeight: '100vh', padding: '40px 24px 80px' }}>
        <div style={{
          maxWidth: 794, margin: '0 auto', background: 'white',
          boxShadow: '0 4px 40px rgba(0,0,0,0.10)',
        }}>

          {/* Header */}
          <div style={{
            background: '#0C2818', padding: '40px 48px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ width: 180 }} dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.65rem', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.45)',
                marginBottom: 6, textTransform: 'uppercase' }}>Quotation</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff',
                letterSpacing: '-0.01em', marginBottom: 4 }}>{quoteRef}</p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{quoteDate}</p>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '48px 48px 56px' }}>

            {/* Prepared for */}
            <div style={{ marginBottom: 44 }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em',
                color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Prepared for</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0C2818',
                letterSpacing: '-0.03em', lineHeight: 1 }}>{project.client_name}</p>
            </div>

            {/* Divider */}
            <div style={{ height: 2, background: '#0C2818', marginBottom: 32 }} />

            {/* Scope of Work */}
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em',
              color: '#999', textTransform: 'uppercase', marginBottom: 20 }}>Scope of Work</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E8E8E8' }}>
                  <th style={{ textAlign: 'left', padding: '0 0 10px',
                    fontSize: '0.68rem', fontWeight: 600, color: '#999',
                    letterSpacing: '0.1em', textTransform: 'uppercase' }}>Deliverable</th>
                  <th style={{ textAlign: 'center', padding: '0 16px 10px',
                    fontSize: '0.68rem', fontWeight: 600, color: '#999',
                    letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Duration</th>
                  <th style={{ textAlign: 'right', padding: '0 0 10px',
                    fontSize: '0.68rem', fontWeight: 600, color: '#999',
                    letterSpacing: '0.1em', textTransform: 'uppercase' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {deliverableRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F0F0F0' }}>
                    <td style={{ padding: '12px 0', fontSize: '0.88rem', color: '#1A1A1A', lineHeight: 1.4 }}>
                      {row.label}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#888',
                      textAlign: 'center', whiteSpace: 'nowrap' }}>{row.duration}</td>
                    <td style={{ padding: '12px 0', fontSize: '0.88rem', color: '#1A1A1A',
                      textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {formatRs(row.price)}
                    </td>
                  </tr>
                ))}

                {/* Rush premium */}
                {rushPremium > 0 && (
                  <tr style={{ borderBottom: '1px solid #F0F0F0' }}>
                    <td style={{ padding: '12px 0', fontSize: '0.88rem', color: '#1A1A1A' }}>
                      Rush premium (25%)
                    </td>
                    <td />
                    <td style={{ padding: '12px 0', fontSize: '0.88rem', color: '#1A1A1A',
                      textAlign: 'right', whiteSpace: 'nowrap' }}>{formatRs(rushPremium)}</td>
                  </tr>
                )}

                {/* Third-party passthrough */}
                {passthrough > 0 && (
                  <tr style={{ borderBottom: '1px solid #F0F0F0' }}>
                    <td style={{ padding: '12px 0', fontSize: '0.88rem', color: '#1A1A1A' }}>
                      Third-party costs & assets
                    </td>
                    <td />
                    <td style={{ padding: '12px 0', fontSize: '0.88rem', color: '#1A1A1A',
                      textAlign: 'right', whiteSpace: 'nowrap' }}>{formatRs(passthrough)}</td>
                  </tr>
                )}

                {/* Contingency */}
                {contingency > 0 && (
                  <tr style={{ borderBottom: '1px solid #F0F0F0' }}>
                    <td style={{ padding: '12px 0', fontSize: '0.88rem', color: '#1A1A1A' }}>
                      Contingency ({scope?.contingency_percent || 10}%)
                    </td>
                    <td />
                    <td style={{ padding: '12px 0', fontSize: '0.88rem', color: '#1A1A1A',
                      textAlign: 'right', whiteSpace: 'nowrap' }}>{formatRs(contingency)}</td>
                  </tr>
                )}

                {/* Spacer row */}
                <tr><td colSpan={3} style={{ padding: '8px 0' }} /></tr>

                {/* Total ex GST */}
                <tr style={{ borderTop: '1px solid #E8E8E8' }}>
                  <td colSpan={2} style={{ padding: '12px 0', fontSize: '0.85rem',
                    color: '#555', fontWeight: 500 }}>Total (excl. GST)</td>
                  <td style={{ padding: '12px 0', fontSize: '0.88rem', color: '#1A1A1A',
                    textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {formatRs(totalExGst)}
                  </td>
                </tr>

                {/* GST */}
                <tr>
                  <td colSpan={2} style={{ padding: '8px 0 12px', fontSize: '0.85rem', color: '#555' }}>
                    GST @ 18%
                  </td>
                  <td style={{ padding: '8px 0 12px', fontSize: '0.88rem', color: '#1A1A1A',
                    textAlign: 'right', whiteSpace: 'nowrap' }}>{formatRs(gst)}</td>
                </tr>

                {/* Total payable — highlighted */}
                <tr>
                  <td colSpan={3} style={{ padding: 0 }}>
                    <div style={{
                      background: '#0C2818', borderRadius: 6, padding: '16px 20px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                        letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total Payable</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F5F248',
                        letterSpacing: '-0.02em' }}>{formatRs(totalPayable)}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Payment Schedule */}
            <div style={{ marginTop: 48 }}>
              <div style={{ height: 2, background: '#0C2818', marginBottom: 24 }} />
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em',
                color: '#999', textTransform: 'uppercase', marginBottom: 20 }}>Payment Schedule</p>

              {[
                ['On signing', '50%', m1],
                ['On design approval', '25%', m2],
                ['On final delivery', '25%', m3],
              ].map(([label, pct, amt], i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center',
                  padding: '13px 0', borderBottom: '1px solid #F0F0F0',
                }}>
                  <span style={{ flex: 1, fontSize: '0.88rem', color: '#1A1A1A' }}>{label}</span>
                  <span style={{ fontSize: '0.8rem', color: '#999', marginRight: 32,
                    width: 36, textAlign: 'right' }}>{pct}</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0C2818',
                    minWidth: 120, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {formatRs(amt)}
                  </span>
                </div>
              ))}
            </div>

            {/* Scope notes */}
            <div style={{ marginTop: 48 }}>
              <div style={{ height: 2, background: '#0C2818', marginBottom: 24 }} />
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em',
                color: '#999', textTransform: 'uppercase', marginBottom: 20 }}>Scope Notes</p>

              <p style={{ fontSize: '0.85rem', color: '#444', lineHeight: 1.8, marginBottom: 12 }}>
                This quotation includes <strong style={{ color: '#1A1A1A' }}>{revisionRounds} rounds of revisions</strong> per deliverable.
                Additional revision rounds are available at the applicable day rate.
              </p>

              {excluded.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.82rem', color: '#999', marginBottom: 8, marginTop: 16 }}>
                    Not included in this scope:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px' }}>
                    {excluded.map((item, i) => (
                      <span key={i} style={{
                        fontSize: '0.75rem', color: '#888', background: '#F5F5F5',
                        borderRadius: 4, padding: '3px 8px',
                      }}>{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid #E8E8E8',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: 80, opacity: 0.25 }} dangerouslySetInnerHTML={{ __html: LOGO_SVG.replace(/fill="white"/g, 'fill="#0C2818"') }} />
              <p style={{ fontSize: '0.72rem', color: '#CCC', textAlign: 'right' }}>
                molanji.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
