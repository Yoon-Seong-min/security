import { Redis } from '@upstash/redis';
import type { ServerFragmentBlob } from '@cosmoslock/core';

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
});

export interface ReconstructionLogEntry {
  contentId: string; timestamp: string; success: boolean; reason: string; userAgent?: string;
}

const FRAGMENT_PREFIX = 'frag:';
const LOG_PREFIX = 'log:';
const INDEX_KEY = 'frag:__index__';
const TTL = 60 * 60 * 24 * 90;

export async function saveFragmentBlob(blob: ServerFragmentBlob): Promise<void> {
  await kv.set(`${FRAGMENT_PREFIX}${blob.contentId}`, blob, { ex: TTL });
  const index: string[] = (await kv.get<string[]>(INDEX_KEY)) ?? [];
  if (!index.includes(blob.contentId)) {
    index.unshift(blob.contentId);
    if (index.length > 1000) index.splice(1000);
    await kv.set(INDEX_KEY, index, { ex: TTL });
  }
}

export async function getFragmentBlob(contentId: string): Promise<ServerFragmentBlob | null> {
  return kv.get<ServerFragmentBlob>(`${FRAGMENT_PREFIX}${contentId}`);
}

export async function listFragmentBlobs(): Promise<ServerFragmentBlob[]> {
  const index: string[] = (await kv.get<string[]>(INDEX_KEY)) ?? [];
  if (!index.length) return [];
  const results = await Promise.all(index.map(id => kv.get<ServerFragmentBlob>(`${FRAGMENT_PREFIX}${id}`)));
  return results.filter((b): b is ServerFragmentBlob => b !== null);
}

export async function deleteFragmentBlob(contentId: string): Promise<void> {
  await kv.del(`${FRAGMENT_PREFIX}${contentId}`);
  const index: string[] = (await kv.get<string[]>(INDEX_KEY)) ?? [];
  await kv.set(INDEX_KEY, index.filter(id => id !== contentId));
}

export async function logReconstructionAttempt(entry: ReconstructionLogEntry): Promise<void> {
  await kv.set(`${LOG_PREFIX}${entry.contentId}:${Date.now()}`, entry, { ex: TTL });
}
