import { logReconstructionAttempt } from '@cosmoslock/server';
export async function POST(req: Request) { await logReconstructionAttempt(await req.json()); return Response.json({ ok: true }); }
