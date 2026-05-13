'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (res.ok) {
      router.push(params.get('from') || '/')
      router.refresh()
    } else {
      setError('Wrong password')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#111', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', gap: 5, marginBottom: 16,
          }}>
            {['#F5F248','#B8EAC4','#4A1030','#2A4FD4','#0C2818','#F0A0CC','#E03028'].map((c, i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: 2,
                background: c,
              }} />
            ))}
          </div>
          <h1 style={{
            fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em',
            color: '#F0F0F0',
          }}>MO Studio</h1>
          <p style={{ color: '#555', fontSize: '0.875rem', marginTop: 6 }}>
            Internal tools — team access only
          </p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} style={{
          background: '#1A1A1A', border: '1px solid #2A2A2A',
          borderRadius: 16, padding: 32,
        }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600,
            color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em',
            marginBottom: 8 }}>
            Password
          </label>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Enter studio password"
            autoFocus
            required
            style={{
              width: '100%', background: '#111', border: `1px solid ${error ? '#E03028' : '#2A2A2A'}`,
              borderRadius: 8, color: '#F0F0F0', padding: '10px 14px',
              fontSize: '0.95rem', outline: 'none', marginBottom: error ? 8 : 16,
            }}
          />
          {error && (
            <p style={{ color: '#E03028', fontSize: '0.8rem', marginBottom: 14 }}>{error}</p>
          )}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 12,
            background: loading ? '#333' : '#F5F248',
            border: 'none', borderRadius: 8,
            color: '#111', fontWeight: 700, fontSize: '0.95rem',
            transition: 'opacity 0.15s',
          }}>
            {loading ? 'Entering…' : 'Enter Studio →'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
