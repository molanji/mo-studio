import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req) {
  const { password } = await req.json()

  if (password !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('mo-studio-auth', process.env.SITE_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
  return res
}
