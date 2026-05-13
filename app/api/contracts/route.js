import Groq from 'groq-sdk'

export async function POST(req) {
  const { type, partyA, partyB, terms, groqKey } = await req.json()

  const key = groqKey || process.env.GROQ_API_KEY
  if (!key) return Response.json({ error: 'Groq API key required' }, { status: 400 })

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const typeLabels = {
    nda: 'Non-Disclosure Agreement (NDA)',
    service: 'Service Agreement',
    freelance: 'Freelance Contract',
    employment: 'Employment Offer Letter',
    partnership: 'Partnership Agreement',
  }

  const prompt = `You are a professional contract drafter. Generate a complete, well-structured ${typeLabels[type] || type} between the following parties.

Party A: ${partyA}
Party B: ${partyB}
Date: ${today}
Key Terms / Scope: ${terms}

Requirements:
- Write a complete, professional contract with all standard clauses for this contract type
- Include: Preamble, Definitions, Scope/Obligations, Payment terms (if applicable), Confidentiality, Term & Termination, Governing Law, Signatures section
- Use clear, professional legal language
- Format with numbered sections and sub-clauses
- Make it thorough but concise — no filler text

Generate the full contract now:`

  try {
    const groq = new Groq({ apiKey: key })
    const resp = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 2500,
    })
    return Response.json({ contract: resp.choices[0].message.content.trim() })
  } catch (e) {
    const msg = e.message || ''
    if (msg.includes('auth') || msg.includes('401')) {
      return Response.json({ error: 'Invalid Groq API key' }, { status: 401 })
    }
    return Response.json({ error: msg }, { status: 500 })
  }
}
