import { listFragmentBlobs, saveFragmentBlob } from '@cosmoslock/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const blobs = await listFragmentBlobs();
    return NextResponse.json(blobs);
  } catch (err) {
    console.error('GET /api/fragments', err);
    return NextResponse.json({ error: 'Failed to list fragments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const blob = await req.json();
    if (!blob?.contentId || !blob?.fragments) {
      return NextResponse.json({ error: 'Invalid blob' }, { status: 400 });
    }
    await saveFragmentBlob(blob);
    return NextResponse.json({ ok: true, contentId: blob.contentId });
  } catch (err) {
    console.error('POST /api/fragments', err);
    return NextResponse.json({ error: 'Failed to save fragment' }, { status: 500 });
  }
}
