import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL??'', token: process.env.UPSTASH_REDIS_REST_TOKEN??'' });
const TOTAL_KEY = 'visitor:total';
const dailyKey = () => `visitor:daily:${new Date().toISOString().slice(0,10)}`;
export async function POST() {
  try {
    const total = await kv.incr(TOTAL_KEY);
    const daily = await kv.incr(dailyKey());
    await kv.expire(dailyKey(), 60*60*48);
    return NextResponse.json({ total, daily });
  } catch { return NextResponse.json({ total:0, daily:0 }); }
}
export async function GET() {
  try {
    const total = (await kv.get<number>(TOTAL_KEY))??0;
    const daily = (await kv.get<number>(dailyKey()))??0;
    return NextResponse.json({ total, daily });
  } catch { return NextResponse.json({ total:0, daily:0 }); }
}
