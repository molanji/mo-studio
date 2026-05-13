import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const TOOLS = [
  {
    id: 'transcriber',
    name: 'Meeting Transcriber',
    description: 'Upload any audio recording and get a full transcript + structured Minutes of Meeting.',
    icon: '🎙️',
    accent: '#F5F248',
    textColor: '#111',
    href: '/transcriber',
    status: 'live',
  },
  {
    id: 'contracts',
    name: 'Contract Generator',
    description: 'Generate professional contracts — NDAs, service agreements, freelance — in seconds.',
    icon: '📄',
    accent: '#B8EAC4',
    textColor: '#111',
    href: '/contracts',
    status: 'live',
  },
]

const DOTS = ['#F5F248','#B8EAC4','#4A1030','#2A4FD4','#0C2818','#F0A0CC','#E03028']

export default function Dashboard() {
  return (
    <div style={{ minHeight: '100vh', background: '#111', padding: '0 24px 80px' }}>

      {/* Header */}
      <header style={{
        maxWidth: 960, margin: '0 auto',
        padding: '40px 0 56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #1E1E1E',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {DOTS.map((c, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: 2, background: c,
              }} />
            ))}
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800,
            letterSpacing: '-0.02em', color: '#F0F0F0' }}>
            MO Studio
          </span>
        </div>
        <LogoutBtn />
      </header>

      {/* Hero */}
      <div style={{ maxWidth: 960, margin: '0 auto', paddingTop: 64 }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
          Your Tools
        </p>
        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800,
          letterSpacing: '-0.03em', color: '#F0F0F0', lineHeight: 1.1,
          marginBottom: 12 }}>
          Everything you need,<br />all in one place.
        </h2>
        <p style={{ color: '#555', fontSize: '1rem', marginBottom: 64 }}>
          {TOOLS.length} tools available
        </p>

        {/* Tool grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {TOOLS.map(tool => (
            <Link key={tool.id} href={tool.href} style={{ display: 'block', textDecoration: 'none' }}>
              <div style={{
                background: '#1A1A1A',
                border: '1px solid #222',
                borderRadius: 16,
                padding: 28,
                height: '100%',
                cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.15s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = tool.accent
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#222'
                e.currentTarget.style.transform = 'translateY(0)'
              }}>
                {/* Accent stripe */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: 3, background: tool.accent,
                  borderRadius: '16px 16px 0 0',
                }} />

                {/* Status badge */}
                {tool.status === 'live' && (
                  <div style={{
                    position: 'absolute', top: 18, right: 18,
                    background: 'rgba(12,40,24,0.8)',
                    border: '1px solid #0C2818',
                    borderRadius: 99, padding: '3px 10px',
                    fontSize: '0.7rem', fontWeight: 600, color: '#B8EAC4',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%',
                      background: '#B8EAC4', display: 'inline-block' }} />
                    Live
                  </div>
                )}

                <div style={{ fontSize: '2rem', marginBottom: 16, marginTop: 8 }}>
                  {tool.icon}
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700,
                  color: '#F0F0F0', marginBottom: 8, letterSpacing: '-0.01em' }}>
                  {tool.name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#666', lineHeight: 1.6,
                  marginBottom: 24 }}>
                  {tool.description}
                </p>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: tool.accent, color: tool.textColor,
                  borderRadius: 8, padding: '7px 16px',
                  fontSize: '0.8rem', fontWeight: 700,
                }}>
                  Open tool →
                </div>
              </div>
            </Link>
          ))}

          {/* Coming soon placeholder */}
          <div style={{
            background: '#141414', border: '1px dashed #222',
            borderRadius: 16, padding: 28,
            display: 'flex', flexDirection: 'column',
            alignItems: 'flex-start', justifyContent: 'center',
            minHeight: 200,
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.3 }}>＋</div>
            <p style={{ color: '#444', fontSize: '0.875rem' }}>
              More tools coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Small client component just for logout button
import LogoutBtn from './LogoutBtn'
