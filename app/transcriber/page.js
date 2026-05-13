'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'

const HF_URL = process.env.NEXT_PUBLIC_HF_SPACE_URL || 'https://molanji-m0-trance.hf.space'

export default function TranscriberPage() {
  const [file, setFile]           = useState(null)
  const [language, setLanguage]   = useState('auto')
  const [format, setFormat]       = useState('text')
  const [model, setModel]         = useState('base')
  const [progress, setProgress]   = useState(0)
  const [label, setLabel]         = useState('')
  const [running, setRunning]     = useState(false)
  const [transcript, setTranscript] = useState('')
  const [mom, setMom]             = useState('')
  const [groqKey, setGroqKey]     = useState('')
  const [momRunning, setMomRunning] = useState(false)
  const [error, setError]         = useState('')
  const [stats, setStats]         = useState('')
  const tickerRef = useRef(null)

  function handleDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer?.files[0] || e.target.files[0]
    if (f) setFile(f)
    setTranscript(''); setMom(''); setError('')
  }

  async function transcribe() {
    if (!file) return
    setRunning(true); setError(''); setTranscript(''); setMom('')
    let pct = 5
    setProgress(pct); setLabel('Processing locally…')
    tickerRef.current = setInterval(() => {
      pct += (98 - pct) * 0.04 + 0.2
      setProgress(Math.min(pct, 97))
      if (pct > 20) setLabel('Transcribing with Whisper…')
      if (pct > 60) setLabel('Still working — large file takes a few minutes…')
      if (pct > 85) setLabel('Almost done…')
    }, 1200)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('language', language)
      fd.append('output_format', format)
      fd.append('model_size', model)
      const t0 = Date.now()
      const res = await fetch(`${HF_URL}/transcribe`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Transcription failed')
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
      setTranscript(data.text)
      setStats(`${data.text.split(/\s+/).filter(Boolean).length} words · ${elapsed}s`)
    } catch (e) {
      setError(e.message)
    } finally {
      clearInterval(tickerRef.current)
      setProgress(100); setLabel('Done!')
      setTimeout(() => setRunning(false), 600)
    }
  }

  async function generateMom() {
    if (!transcript || !groqKey) return
    setMomRunning(true); setMom(''); setError('')
    try {
      const res = await fetch(`${HF_URL}/generate_mom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, groq_key: groqKey }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)
      setMom(data.mom)
    } catch (e) {
      setError('MOM error: ' + e.message)
    } finally {
      setMomRunning(false)
    }
  }

  function download(text, suffix, ext) {
    const base = (file?.name || 'recording').replace(/\.[^.]+$/, '')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${base}_${suffix}.${ext}`; a.click()
    URL.revokeObjectURL(url)
  }

  const accent = '#F5F248'

  return (
    <div style={{ minHeight: '100vh', background: '#111', padding: '0 24px 80px' }}>
      {/* Nav */}
      <nav style={{ maxWidth: 720, margin: '0 auto', padding: '28px 0',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #1E1E1E', marginBottom: 48 }}>
        <Link href="/" style={{ color: '#555', fontSize: '0.85rem',
          display: 'flex', alignItems: 'center', gap: 6 }}>
          ← MO Studio
        </Link>
        <span style={{ color: '#333' }}>/</span>
        <span style={{ fontSize: '0.85rem', color: '#F0F0F0', fontWeight: 600 }}>
          Meeting Transcriber
        </span>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 32, height: 3, background: accent,
            borderRadius: 99, marginBottom: 16 }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800,
            letterSpacing: '-0.03em', color: '#F0F0F0', marginBottom: 6 }}>
            Meeting Transcriber
          </h1>
          <p style={{ color: '#555', fontSize: '0.9rem' }}>
            100% local · no API key needed · audio stays on the server
          </p>
        </div>

        {/* Upload */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
          style={{
            border: `2px dashed ${file ? accent : '#2A2A2A'}`,
            borderRadius: 14, padding: '44px 24px', textAlign: 'center',
            cursor: 'pointer', transition: 'border-color 0.2s',
            background: file ? 'rgba(245,242,72,0.03)' : 'transparent',
            marginBottom: 16,
          }}>
          <input id="file-input" type="file"
            accept=".m4a,.mp3,.mp4,.wav,.webm,.ogg,.flac"
            style={{ display: 'none' }} onChange={handleDrop} />
          <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>🎙️</div>
          {file ? (
            <p style={{ color: accent, fontWeight: 600, fontSize: '0.9rem' }}>
              {file.name} &nbsp;·&nbsp; {(file.size/1024/1024).toFixed(1)} MB
            </p>
          ) : (
            <>
              <p style={{ color: '#666', marginBottom: 6 }}>
                <strong style={{ color: '#999' }}>Click to upload</strong> or drag & drop
              </p>
              <p style={{ color: '#444', fontSize: '0.75rem' }}>
                .m4a · .mp3 · .wav · .mp4 · .webm · up to 200 MB
              </p>
            </>
          )}
        </div>

        {/* Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {[
            { label: 'Language', id: 'lang', value: language, setter: setLanguage, options: [
              ['auto','Auto-detect'],['en','English'],['es','Spanish'],['fr','French'],
              ['de','German'],['hi','Hindi'],['ar','Arabic'],['zh','Chinese'],['ja','Japanese'],
            ]},
            { label: 'Output Format', id: 'fmt', value: format, setter: setFormat, options: [
              ['text','Plain text'],['timestamps','With timestamps'],['srt','SRT'],['vtt','WebVTT'],
            ]},
          ].map(({ label, id, value, setter, options }) => (
            <div key={id}>
              <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600,
                color:'#555', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>
                {label}
              </label>
              <select value={value} onChange={e => setter(e.target.value)} style={{
                width:'100%', background:'#1A1A1A', border:'1px solid #2A2A2A',
                borderRadius:8, color:'#F0F0F0', padding:'8px 12px', fontSize:'0.85rem',
                outline:'none',
              }}>
                {options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600,
            color:'#555', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>
            Model — Accuracy vs Speed
          </label>
          <select value={model} onChange={e => setModel(e.target.value)} style={{
            width:'100%', background:'#1A1A1A', border:'1px solid #2A2A2A',
            borderRadius:8, color:'#F0F0F0', padding:'8px 12px', fontSize:'0.85rem', outline:'none',
          }}>
            <option value="tiny">Tiny — fastest, basic accuracy</option>
            <option value="base">Base — good balance ✦ recommended</option>
            <option value="small">Small — better accuracy</option>
            <option value="medium">Medium — high accuracy (slow)</option>
            <option value="large-v3">Large v3 — best accuracy (very slow)</option>
          </select>
        </div>

        <button disabled={!file || running} onClick={transcribe} style={{
          width:'100%', padding:14, background: (!file||running) ? '#1E1E1E' : accent,
          border:'none', borderRadius:10, color: '#111',
          fontSize:'0.95rem', fontWeight:700, marginBottom:16,
          opacity: (!file||running) ? 0.5 : 1,
        }}>
          {running ? label || 'Transcribing…' : 'Transcribe'}
        </button>

        {/* Progress */}
        {running && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ height:3, background:'#1E1E1E', borderRadius:99, overflow:'hidden', marginBottom:6 }}>
              <div style={{
                height:'100%', width: progress + '%',
                background: `linear-gradient(90deg, ${accent}, #fff, ${accent})`,
                backgroundSize:'200% 100%',
                borderRadius:99, transition:'width 0.5s',
                animation:'sweep 1.8s linear infinite',
              }} />
            </div>
            <p style={{ fontSize:'0.78rem', color:'#555', textAlign:'center' }}>{label}</p>
          </div>
        )}

        {error && (
          <div style={{ background:'rgba(224,48,40,0.1)', border:'1px solid rgba(224,48,40,0.3)',
            borderRadius:8, padding:'12px 16px', color:'#E03028',
            fontSize:'0.85rem', marginBottom:16 }}>
            {error}
          </div>
        )}

        {/* Transcript result */}
        {transcript && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:'0.7rem', fontWeight:600, color:'#555',
                textTransform:'uppercase', letterSpacing:'0.07em' }}>Transcript</span>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:'0.72rem', color:'#444' }}>{stats}</span>
                <button onClick={() => download(transcript, 'transcript',
                  format==='srt'?'srt':format==='vtt'?'vtt':'txt')} style={{
                  background:'rgba(245,242,72,0.12)', border:'1px solid rgba(245,242,72,0.25)',
                  color: accent, borderRadius:6, padding:'4px 12px',
                  fontSize:'0.78rem', fontWeight:600,
                }}>⬇ Download</button>
              </div>
            </div>
            <div style={{ background:'#141414', border:'1px solid #222', borderRadius:10,
              padding:16, fontSize:'0.875rem', lineHeight:1.7, color:'#CCC',
              maxHeight:280, overflowY:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
              {transcript}
            </div>
          </div>
        )}

        {/* MOM section */}
        {transcript && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input
                type="password"
                value={groqKey}
                onChange={e => setGroqKey(e.target.value)}
                placeholder="Paste free Groq API key for MOM…"
                style={{ flex:1, background:'#1A1A1A', border:'1px solid #2A2A2A',
                  borderRadius:8, color:'#F0F0F0', padding:'8px 12px',
                  fontSize:'0.85rem', outline:'none' }}
              />
              <a href="https://console.groq.com/keys" target="_blank"
                style={{ color:'#0C2818', background:'#B8EAC4',
                  borderRadius:8, padding:'8px 12px', fontSize:'0.78rem',
                  fontWeight:600, whiteSpace:'nowrap', display:'flex',
                  alignItems:'center' }}>
                Get free key ↗
              </a>
            </div>
            <button disabled={!groqKey || momRunning} onClick={generateMom} style={{
              width:'100%', padding:12,
              background: (!groqKey||momRunning) ? '#1A1A1A' : '#0C2818',
              border: '1px solid #B8EAC4',
              borderRadius:10, color:'#B8EAC4',
              fontSize:'0.9rem', fontWeight:700,
              opacity:(!groqKey||momRunning)?0.5:1,
            }}>
              {momRunning ? 'Generating MOM…' : '✦ Generate Minutes of Meeting (MOM)'}
            </button>
          </div>
        )}

        {mom && (
          <div style={{ marginTop:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:'0.7rem', fontWeight:600, color:'#555',
                textTransform:'uppercase', letterSpacing:'0.07em' }}>Minutes of Meeting</span>
              <button onClick={() => download(mom, 'MOM', 'txt')} style={{
                background:'rgba(184,234,196,0.12)', border:'1px solid rgba(184,234,196,0.3)',
                color:'#B8EAC4', borderRadius:6, padding:'4px 12px',
                fontSize:'0.78rem', fontWeight:600,
              }}>⬇ Download MOM</button>
            </div>
            <div style={{ background:'#0A1A12', border:'1px solid #0C2818',
              borderRadius:10, padding:20, fontSize:'0.875rem',
              lineHeight:1.8, color:'#B8EAC4', maxHeight:380, overflowY:'auto',
              whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
              {mom}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes sweep { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  )
}
