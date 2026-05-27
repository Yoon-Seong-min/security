import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ServerFragmentBlob } from '@cosmoslock/core';

const base = path.join(process.cwd(), 'data');
const fragmentPath = path.join(base, 'fragments.json');
const logPath = path.join(base, 'reconstruction-log.json');

async function readJson<T>(p: string, fallback: T): Promise<T> {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return fallback; }
}
async function writeJson(p: string, data: unknown) { await fs.mkdir(base, { recursive: true }); await fs.writeFile(p, JSON.stringify(data, null, 2)); }

export async function saveFragmentBlob(blob: ServerFragmentBlob) {
  const all = await readJson<Record<string, ServerFragmentBlob>>(fragmentPath, {});
  all[blob.contentId] = blob;
  await writeJson(fragmentPath, all);
}
export async function getFragmentBlob(contentId: string) { const all = await readJson<Record<string, ServerFragmentBlob>>(fragmentPath, {}); return all[contentId]; }
export async function listFragmentBlobs() { const all = await readJson<Record<string, ServerFragmentBlob>>(fragmentPath, {}); return Object.values(all); }
export async function deleteFragmentBlob(contentId: string) { const all = await readJson<Record<string, ServerFragmentBlob>>(fragmentPath, {}); delete all[contentId]; await writeJson(fragmentPath, all); }
export async function logReconstructionAttempt(event: { contentId: string; timestamp: string; success: boolean; reason: string; }) { const all = await readJson<any[]>(logPath, []); all.push(event); await writeJson(logPath, all); }
