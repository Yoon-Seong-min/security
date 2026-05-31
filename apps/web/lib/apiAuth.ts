import { NextRequest } from 'next/server';

export function checkApiToken(req: NextRequest): boolean {
  // In development without token set, allow all (for local testing)
  const apiToken = process.env.COSMOSLOCK_API_TOKEN;
  if (!apiToken) return true;

  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${apiToken}`;
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
