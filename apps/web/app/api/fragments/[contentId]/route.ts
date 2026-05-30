import { getFragmentBlob, deleteFragmentBlob } from '@cosmoslock/server';
import { NextResponse } from 'next/server';

export async function GET(
  _: Request,
  context: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await context.params;
    const blob = await getFragmentBlob(contentId);
    if (!blob) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(blob);
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await context.params;
    await deleteFragmentBlob(contentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
