import { query } from '@/lib/db'

export async function GET(req, { params }) {
  const { rows } = await query(
    `SELECT id, client_name, status, client_profile, scope, pricing, created_at, updated_at
     FROM pricing_projects WHERE id = $1`,
    [params.id]
  )
  if (rows.length === 0) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  return Response.json({ project: rows[0] })
}

export async function PUT(req, { params }) {
  const body = await req.json()
  await query(
    `UPDATE pricing_projects SET status = $1, updated_at = now() WHERE id = $2`,
    [body.status, params.id]
  )
  return Response.json({ ok: true })
}
