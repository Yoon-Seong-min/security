import { getFragmentBlob, deleteFragmentBlob } from '@cosmoslock/server';
import { NextResponse } from 'next/server';
export async function GET(_: Request, { params }: { params: { contentId: string } }) {
  try {
    const blob = await getFragmentBlob(params.contentId);
    if (!blob) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(blob);
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
export async function DELETE(_: Request, { params }: { params: { contentId: string } }) {
  try { await deleteFragmentBlob(params.contentId); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
