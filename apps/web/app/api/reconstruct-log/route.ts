import { logReconstructionAttempt } from '@cosmoslock/server';
import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  try {
    await logReconstructionAttempt({ ...await req.json(), userAgent: req.headers.get('user-agent') ?? undefined });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
