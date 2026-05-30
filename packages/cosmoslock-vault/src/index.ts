import { openDB } from 'idb';
import type { UserCoordinateMap } from '@cosmoslock/core';

export interface EncryptedVaultRecord {
  contentId: string; encryptedCoordinateMap: string; salt: string; iv: string; kdf: 'PBKDF2'; cipher: 'AES-GCM'; createdAt: string;
}

const enc = new TextEncoder();
const dec = new TextDecoder();
const cryptoApi = globalThis.crypto;

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');
const fromB64 = (s: string) => new Uint8Array(Buffer.from(s, 'base64'));

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const keyMaterial = await cryptoApi.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return cryptoApi.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptCoordinateMap(contentId: string, map: UserCoordinateMap, passphrase: string): Promise<EncryptedVaultRecord> {
  const salt = cryptoApi.getRandomValues(new Uint8Array(16));
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipher = await cryptoApi.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(map)));
  return { contentId, encryptedCoordinateMap: b64(new Uint8Array(cipher)), salt: b64(salt), iv: b64(iv), kdf: 'PBKDF2', cipher: 'AES-GCM', createdAt: new Date().toISOString() };
}

export async function decryptCoordinateMap(record: EncryptedVaultRecord, passphrase: string): Promise<UserCoordinateMap> {
  const key = await deriveKey(passphrase, fromB64(record.salt));
  const plain = await cryptoApi.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(record.iv) }, key, fromB64(record.encryptedCoordinateMap));
  return JSON.parse(dec.decode(plain));
}

export async function saveToIndexedDB(record: EncryptedVaultRecord) {
  const db = await openDB('cosmoslock-vault', 1, { upgrade(db) { db.createObjectStore('records', { keyPath: 'contentId' }); } });
  await db.put('records', record);
}

export async function loadFromIndexedDB(contentId: string): Promise<EncryptedVaultRecord | undefined> {
  const db = await openDB('cosmoslock-vault', 1, { upgrade(db) { db.createObjectStore('records', { keyPath: 'contentId' }); } });
  return db.get('records', contentId);
}

export function exportVaultFile(record: EncryptedVaultRecord): string { return JSON.stringify(record, null, 2); }
export function importVaultFile(json: string): EncryptedVaultRecord { return JSON.parse(json); }
