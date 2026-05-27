import { listFragmentBlobs, saveFragmentBlob } from '@cosmoslock/server';
export async function GET() { return Response.json(await listFragmentBlobs()); }
export async function POST(req: Request) { const blob = await req.json(); await saveFragmentBlob(blob); return Response.json({ ok: true }); }
