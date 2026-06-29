import { query } from '@/lib/db'

export async function GET() {
  const { rows } = await query(
    `SELECT id, client_name, status, client_profile, scope, pricing, created_at, updated_at
     FROM pricing_projects ORDER BY created_at DESC`
  )
  return Response.json({ projects: rows })
}

export async function POST(req) {
  const body = await req.json()
  const { client_name, status, client_profile, scope, pricing } = body

  const { rows } = await query(
    `INSERT INTO pricing_projects (client_name, status, client_profile, scope, pricing)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, created_at`,
    [
      client_name,
      status || 'proposal_sent',
      JSON.stringify(client_profile),
      JSON.stringify(scope),
      JSON.stringify(pricing),
    ]
  )
  return Response.json({ id: rows[0].id, created_at: rows[0].created_at })
}
