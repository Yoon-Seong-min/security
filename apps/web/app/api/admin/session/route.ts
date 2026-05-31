import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = req.cookies.get('cl_admin_session');
  return NextResponse.json({ authenticated: session?.value === 'authenticated' });
}
