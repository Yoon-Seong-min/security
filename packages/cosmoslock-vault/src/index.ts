import { openDB } from 'idb';
import type { UserCoordinateMap } from '@cosmoslock/core';

export interface EncryptedVaultRecord {
  contentId: string;
  encryptedCoordinateMap: string;
  salt: string;
  iv: string;
  kdf: 'PBKDF2';
  cipher: 'AES-GCM';
  createdAt: string;
  label?: string;
}

function toB64(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase) as unknown as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations: 200000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptCoordinateMap(contentId: string, map: UserCoordinateMap, passphrase: string): Promise<EncryptedVaultRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
    key,
    new TextEncoder().encode(JSON.stringify(map)) as unknown as ArrayBuffer
  );
  return {
    contentId,
    encryptedCoordinateMap: toB64(new Uint8Array(cipher)),
    salt: toB64(salt),
    iv: toB64(iv),
    kdf: 'PBKDF2',
    cipher: 'AES-GCM',
    createdAt: new Date().toISOString(),
    ...(map.label ? { label: map.label } : {}),
  };
}

export async function decryptCoordinateMap(record: EncryptedVaultRecord, passphrase: string): Promise<UserCoordinateMap> {
  const salt = fromB64(record.salt);
  const iv = fromB64(record.iv);
  const key = await deriveKey(passphrase, salt);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
    key,
    fromB64(record.encryptedCoordinateMap) as unknown as ArrayBuffer
  );
  return JSON.parse(new TextDecoder().decode(plain));
}

async function getDB() {
  return openDB('cosmoslock-vault', 2, {
    upgrade(db, v) { if (v < 1) db.createObjectStore('records', { keyPath: 'contentId' }); },
  });
}

export async function saveToIndexedDB(record: EncryptedVaultRecord): Promise<void> { await (await getDB()).put('records', record); }
export async function loadFromIndexedDB(contentId: string): Promise<EncryptedVaultRecord | undefined> { return (await getDB()).get('records', contentId); }
export async function listFromIndexedDB(): Promise<EncryptedVaultRecord[]> { return (await getDB()).getAll('records'); }
export async function deleteFromIndexedDB(contentId: string): Promise<void> { await (await getDB()).delete('records', contentId); }

export function exportVaultFile(record: EncryptedVaultRecord): string { return JSON.stringify(record, null, 2); }
export function exportVaultBundle(records: EncryptedVaultRecord[]): string { return JSON.stringify({ version: '0.2', exportedAt: new Date().toISOString(), records }, null, 2); }
export function importVaultFile(json: string): EncryptedVaultRecord { const p = JSON.parse(json); return p.records ? p.records[0] : p; }
export function importVaultBundle(json: string): EncryptedVaultRecord[] { const p = JSON.parse(json); return p.records ?? [p]; }

export function downloadVaultFile(record: EncryptedVaultRecord): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([exportVaultFile(record)], { type: 'application/json' }));
  a.download = `cosmoslock-vault-${record.contentId.slice(0, 8)}.json`;
  a.click();
}

export function downloadVaultBundle(records: EncryptedVaultRecord[]): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([exportVaultBundle(records)], { type: 'application/json' }));
  a.download = `cosmoslock-vault-bundle-${Date.now()}.json`;
  a.click();
}
