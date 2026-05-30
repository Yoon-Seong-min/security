import { listFragmentBlobs, saveFragmentBlob } from '@cosmoslock/server';
import { NextResponse } from 'next/server';
export async function GET() {
  try { return NextResponse.json(await listFragmentBlobs()); }
  catch (err) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
export async function POST(req: Request) {
  try {
    const blob = await req.json();
    await saveFragmentBlob(blob);
    return NextResponse.json({ ok: true, contentId: blob.contentId });
  } catch (err) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
