'use client'
import { useState } from 'react'
import Link from 'next/link'

const CONTRACT_TYPES = [
  { value: 'nda',         label: 'Non-Disclosure Agreement (NDA)' },
  { value: 'service',     label: 'Service Agreement' },
  { value: 'freelance',   label: 'Freelance Contract' },
  { value: 'employment',  label: 'Employment Offer Letter' },
  { value: 'partnership', label: 'Partnership Agreement' },
]

const accent = '#B8EAC4'
const accentText = '#111'

export default function ContractsPage() {
  const [type, setType]       = useState('nda')
  const [partyA, setPartyA]   = useState('')
  const [partyB, setPartyB]   = useState('')
  const [terms, setTerms]     = useState('')
  const [groqKey, setGroqKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [contract, setContract] = useState('')
  const [error, setError]     = useState('')

  async function generate() {
    if (!partyA || !partyB || !terms) return
    setLoading(true); setError(''); setContract('')
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, partyA, partyB, terms, groqKey }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)
      setContract(data.contract)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function download() {
    const blob = new Blob([contract], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const label = CONTRACT_TYPES.find(t => t.value === type)?.label || 'Contract'
    a.href = url
    a.download = `${partyA.replace(/\s+/g,'_')}_${label.replace(/\s+/g,'_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function Input({ label, value, onChange, placeholder, multiline }) {
    const base = {
      width:'100%', background:'#1A1A1A', border:'1px solid #2A2A2A',
      borderRadius:8, color:'#F0F0F0', padding:'10px 14px',
      fontSize:'0.875rem', outline:'none', resize: multiline ? 'vertical' : 'none',
    }
    return (
      <div style={{ marginBottom:16 }}>
        <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600,
          color:'#555', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>
          {label}
        </label>
        {multiline
          ? <textarea rows={4} value={value} onChange={e=>onChange(e.target.value)}
              placeholder={placeholder} style={base} />
          : <input type="text" value={value} onChange={e=>onChange(e.target.value)}
              placeholder={placeholder} style={base} />
        }
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#111', padding:'0 24px 80px' }}>
      {/* Nav */}
      <nav style={{ maxWidth:720, margin:'0 auto', padding:'28px 0',
        display:'flex', alignItems:'center', gap:12,
        borderBottom:'1px solid #1E1E1E', marginBottom:48 }}>
        <Link href="/" style={{ color:'#555', fontSize:'0.85rem' }}>← MO Studio</Link>
        <span style={{ color:'#333' }}>/</span>
        <span style={{ fontSize:'0.85rem', color:'#F0F0F0', fontWeight:600 }}>Contract Generator</span>
      </nav>

      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <div style={{ marginBottom:32 }}>
          <div style={{ width:32, height:3, background:accent, borderRadius:99, marginBottom:16 }} />
          <h1 style={{ fontSize:'1.8rem', fontWeight:800,
            letterSpacing:'-0.03em', color:'#F0F0F0', marginBottom:6 }}>
            Contract Generator
          </h1>
          <p style={{ color:'#555', fontSize:'0.9rem' }}>
            Generate professional contracts in seconds · powered by Groq (free)
          </p>
        </div>

        {/* Form */}
        <div style={{ background:'#1A1A1A', border:'1px solid #222',
          borderRadius:16, padding:28, marginBottom:20,
          borderTop:`3px solid ${accent}` }}>

          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600,
              color:'#555', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>
              Contract Type
            </label>
            <select value={type} onChange={e=>setType(e.target.value)} style={{
              width:'100%', background:'#111', border:'1px solid #2A2A2A',
              borderRadius:8, color:'#F0F0F0', padding:'10px 14px',
              fontSize:'0.875rem', outline:'none',
            }}>
              {CONTRACT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <div>
              <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600,
                color:'#555', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>
                Party A (your side)
              </label>
              <input type="text" value={partyA} onChange={e=>setPartyA(e.target.value)}
                placeholder="e.g. Molanji Ltd." style={{
                  width:'100%', background:'#111', border:'1px solid #2A2A2A',
                  borderRadius:8, color:'#F0F0F0', padding:'10px 14px',
                  fontSize:'0.875rem', outline:'none',
                }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600,
                color:'#555', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>
                Party B (other side)
              </label>
              <input type="text" value={partyB} onChange={e=>setPartyB(e.target.value)}
                placeholder="e.g. Acme Corp." style={{
                  width:'100%', background:'#111', border:'1px solid #2A2A2A',
                  borderRadius:8, color:'#F0F0F0', padding:'10px 14px',
                  fontSize:'0.875rem', outline:'none',
                }} />
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600,
              color:'#555', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>
              Key Terms / Scope
            </label>
            <textarea rows={4} value={terms} onChange={e=>setTerms(e.target.value)}
              placeholder="e.g. Web design project, 3-month duration, £5,000 fee, monthly payments, UK law…"
              style={{ width:'100%', background:'#111', border:'1px solid #2A2A2A',
                borderRadius:8, color:'#F0F0F0', padding:'10px 14px',
                fontSize:'0.875rem', outline:'none', resize:'vertical' }} />
          </div>

          {/* Groq key */}
          <div style={{ display:'flex', gap:8, marginBottom:20 }}>
            <input type="password" value={groqKey} onChange={e=>setGroqKey(e.target.value)}
              placeholder="Groq API key (free) — or set in Vercel env vars"
              style={{ flex:1, background:'#111', border:'1px solid #2A2A2A',
                borderRadius:8, color:'#F0F0F0', padding:'10px 14px',
                fontSize:'0.85rem', outline:'none' }} />
            <a href="https://console.groq.com/keys" target="_blank" style={{
              background:'#0C2818', border:`1px solid ${accent}`,
              color:accent, borderRadius:8, padding:'10px 14px',
              fontSize:'0.78rem', fontWeight:600, whiteSpace:'nowrap',
              display:'flex', alignItems:'center',
            }}>
              Get free key ↗
            </a>
          </div>

          <button disabled={!partyA||!partyB||!terms||loading} onClick={generate} style={{
            width:'100%', padding:14,
            background:(!partyA||!partyB||!terms||loading)?'#141414':accent,
            border:'none', borderRadius:10,
            color:(!partyA||!partyB||!terms||loading)?'#444':accentText,
            fontSize:'0.95rem', fontWeight:700,
            transition:'background 0.2s',
          }}>
            {loading ? 'Generating contract…' : '✦ Generate Contract'}
          </button>
        </div>

        {error && (
          <div style={{ background:'rgba(224,48,40,0.1)', border:'1px solid rgba(224,48,40,0.3)',
            borderRadius:8, padding:'12px 16px', color:'#E03028',
            fontSize:'0.85rem', marginBottom:20 }}>
            {error}
          </div>
        )}

        {/* Result */}
        {contract && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:'0.7rem', fontWeight:600, color:'#555',
                textTransform:'uppercase', letterSpacing:'0.07em' }}>
                Generated Contract
              </span>
              <button onClick={download} style={{
                background:'rgba(184,234,196,0.12)', border:'1px solid rgba(184,234,196,0.3)',
                color:accent, borderRadius:6, padding:'5px 14px',
                fontSize:'0.78rem', fontWeight:600,
              }}>
                ⬇ Download .txt
              </button>
            </div>
            <div style={{ background:'#0A1A12', border:'1px solid #0C2818',
              borderRadius:12, padding:24, fontSize:'0.875rem',
              lineHeight:1.85, color:'#D1FAE5', whiteSpace:'pre-wrap',
              wordBreak:'break-word', maxHeight:520, overflowY:'auto',
              fontFamily:'ui-monospace, monospace' }}>
              {contract}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
