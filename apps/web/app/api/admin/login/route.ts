import { NextRequest, NextResponse } from 'next/server';

const ADMIN_ID = process.env.ADMIN_ID ?? 'pertz';
const ADMIN_PW = process.env.ADMIN_PW ?? '15963';

export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();
    if (userId === ADMIN_ID && password === ADMIN_PW) {
      const res = NextResponse.json({ ok: true });
      res.cookies.set('cl_admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 4, // 4 hours
        path: '/',
      });
      return res;
    }
    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
