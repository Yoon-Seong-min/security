import { NextResponse } from 'next/server';
import { listFragmentBlobs, deleteFragmentBlob } from '@cosmoslock/server';
import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL??'', token: process.env.UPSTASH_REDIS_REST_TOKEN??'' });
export async function DELETE() {
  try {
    const blobs = await listFragmentBlobs();
    await Promise.all(blobs.map(b => deleteFragmentBlob(b.contentId)));
    await kv.del('frag:__index__');
    return NextResponse.json({ ok:true, deleted:blobs.length });
  } catch { return NextResponse.json({ error:'Failed' }, { status:500 }); }
}
