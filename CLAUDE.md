# MO Studio — Claude Code Guide

Internal tools hub built with Next.js (Vercel) + Python backends (Hugging Face Spaces).

## Quick commands

```bash
npm run dev        # local dev at localhost:3000
npm run build      # check for build errors before pushing
git push origin main   # triggers auto-deploy on Vercel (~60s)
```

## Project structure

```
app/
├── page.js              # Dashboard — add new tool cards here
├── globals.css          # Brand colours as CSS vars
├── login/page.js        # Password gate (don't touch)
├── middleware.js        # Auth check on all routes (don't touch)
├── [tool-name]/
│   └── page.js          # Each tool is its own page
└── api/
    └── [tool-name]/
        └── route.js     # Serverless API route for the tool
```

## How to add a new tool (the only thing teammates need to do)

### Step 1 — Add the card to the dashboard

Open `app/page.js` and add an entry to the `TOOLS` array:

```js
{
  id: 'your-tool-id',
  name: 'Your Tool Name',
  description: 'One sentence about what it does.',
  icon: '🔧',
  accent: '#2A4FD4',   // pick a colour from the palette below
  textColor: '#fff',
  href: '/your-tool-id',
},
```

### Step 2 — Create the tool page

Create `app/your-tool-id/page.js`. Always start with:

```js
'use client'
import Link from 'next/link'

export default function YourToolPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#111', padding:'0 24px 80px' }}>

      {/* Nav — copy this exactly */}
      <nav style={{ maxWidth:720, margin:'0 auto', padding:'28px 0',
        display:'flex', alignItems:'center', gap:12,
        borderBottom:'1px solid #1E1E1E', marginBottom:48 }}>
        <Link href="/" style={{ color:'#555', fontSize:'0.85rem' }}>← MO Studio</Link>
        <span style={{ color:'#333' }}>/</span>
        <span style={{ fontSize:'0.85rem', color:'#F0F0F0', fontWeight:600 }}>Your Tool Name</span>
      </nav>

      <div style={{ maxWidth:720, margin:'0 auto' }}>
        {/* Accent bar — change colour to match your tool card */}
        <div style={{ width:32, height:3, background:'#2A4FD4', borderRadius:99, marginBottom:16 }} />
        <h1 style={{ fontSize:'1.8rem', fontWeight:800, letterSpacing:'-0.03em',
          color:'#F0F0F0', marginBottom:6 }}>Your Tool Name</h1>
        <p style={{ color:'#555', fontSize:'0.9rem', marginBottom:40 }}>Short description</p>

        {/* Your tool UI goes here */}
      </div>
    </div>
  )
}
```

### Step 3 — Create the API route (if needed)

Create `app/api/your-tool-id/route.js`:

```js
export async function POST(req) {
  const body = await req.json()
  // your logic here — can call Groq, OpenAI, etc.
  return Response.json({ result: '...' })
}
```

### Step 4 — Push

```bash
git checkout -b tool/your-tool-name
git add .
git commit -m "Add: Your Tool Name"
git push origin tool/your-tool-name
# Open a PR on GitHub — Molanji reviews and merges → auto-deploys
```

---

## Brand colour palette

```
--yellow:    #F5F248   (Meeting Transcriber)
--mint:      #B8EAC4   (Contract Generator)
--maroon:    #4A1030
--blue:      #2A4FD4
--darkgreen: #0C2818
--pink:      #F0A0CC
--red:       #E03028
```

Pick the next unused colour for your tool. Use `textColor: '#111'` for yellow/mint/pink, `textColor: '#fff'` for the darker ones.

---

## Common UI patterns

### Input field
```js
<input type="text" style={{
  width:'100%', background:'#1A1A1A', border:'1px solid #2A2A2A',
  borderRadius:8, color:'#F0F0F0', padding:'10px 14px',
  fontSize:'0.875rem', outline:'none'
}} />
```

### Primary button (replace ACCENT with your tool's colour)
```js
<button style={{
  width:'100%', padding:14, background:'ACCENT',
  border:'none', borderRadius:10, color:'#111',
  fontSize:'0.95rem', fontWeight:700
}}>
  Do the thing
</button>
```

### Result box
```js
<div style={{
  background:'#141414', border:'1px solid #222', borderRadius:10,
  padding:16, fontSize:'0.875rem', lineHeight:1.7,
  color:'#CCC', maxHeight:320, overflowY:'auto',
  whiteSpace:'pre-wrap'
}}>
  {result}
</div>
```

### Download button
```js
function download(text, filename) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
```

---

## Calling Groq (free AI — for any text generation tool)

```js
// In your API route (app/api/your-tool/route.js)
import Groq from 'groq-sdk'

export async function POST(req) {
  const { input, groqKey } = await req.json()
  const groq = new Groq({ apiKey: groqKey || process.env.GROQ_API_KEY })
  const res = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',   // fast + free
    messages: [{ role: 'user', content: `Your prompt here: ${input}` }],
    temperature: 0.3,
    max_tokens: 1500,
  })
  return Response.json({ result: res.choices[0].message.content.trim() })
}
```

Get a free Groq key at console.groq.com/keys.

---

## Architecture

```
Vercel (this repo)                HF Spaces
├── Dashboard                     └── M0_Trance
├── /transcriber ──────────────────→  /transcribe  (Whisper)
│                                     /generate_mom (Groq)
├── /contracts (Groq via Vercel)
└── /your-new-tool
```

Heavy compute (audio, video, ML models) → build a new HF Space, call it from your tool page.
Light tools (text gen, formatting, APIs) → just use a Vercel API route.

---

## Environment variables

Set in Vercel dashboard (vercel.com) → Project → Settings → Environment Variables.

| Key | What it's for |
|-----|--------------|
| `SITE_PASSWORD` | Hub login password |
| `NEXT_PUBLIC_HF_SPACE_URL` | Transcriber backend URL |
| `GROQ_API_KEY` | Optional — pre-fill Groq key so users don't need to paste it |

For local dev, add them to `.env.local` (already git-ignored).

---

## Rules
- Every page must have `'use client'` at the top (all tools need interactivity)
- Always include the nav bar with `← MO Studio` back link
- Always include the accent colour bar under the page title
- Keep `app/login/page.js` and `middleware.js` untouched
- Test with `npm run build` before pushing — catches errors before Vercel does

