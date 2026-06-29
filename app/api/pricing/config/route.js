import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { rows } = await query('SELECT data, updated_at FROM studio_config WHERE id = 1')
  if (rows.length === 0) {
    return Response.json({ error: 'No config found — run migration' }, { status: 404 })
  }
  return Response.json({ config: rows[0].data, updated_at: rows[0].updated_at })
}

export async function PUT(req) {
  const body = await req.json()
  await query(
    'UPDATE studio_config SET data = $1, updated_at = now() WHERE id = 1',
    [JSON.stringify(body)]
  )
  return Response.json({ ok: true })
}
