function randomId(prefix = 'id'): string {
  const cryptoObj = globalThis.crypto;

  if (cryptoObj?.randomUUID) {
    return `${prefix}_${cryptoObj.randomUUID()}`;
  }

  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    return `${prefix}_${Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  // Demo fallback only. Not production-secure.
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}



export type SplitMode = 'char' | 'word' | 'token';

export interface OriginalData { contentId: string; plaintext: string; createdAt: string; splitMode: SplitMode; }
export interface DataElement { elementId: string; value: string; originalIndex: number; isDecoy: boolean; }
export interface Coordinate { row: string; column: number; label: string; }
export interface ServerFragmentBlob {
  version: '0.1'; contentId: string; splitMode: SplitMode;
  grid: { rows: string[]; columns: number[]; };
  fragments: Array<{ coordinate: string; elementId: string; value: string; isDecoy: boolean; }>;
  fragmentHash: string; createdAt: string;
}
export interface UserCoordinateMap {
  version: '0.1'; contentId: string; splitMode: SplitMode; originalLength: number;
  reconstructionSequence: Array<{ originalIndex: number; coordinate: string; elementId: string; }>;
  serverFragmentHash: string; createdAt: string;
}
export interface ValidationResult { valid: boolean; reason?: string; }

const rows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const tokenize = (text: string) => text.match(/\p{L}+|\p{N}+|\s+|[^\s\p{L}\p{N}]/gu) ?? [];

export function splitOriginalData(plaintext: string, splitMode: SplitMode): DataElement[] {
  const parts = splitMode === 'char' ? Array.from(plaintext) : splitMode === 'word' ? plaintext.split(/(\s+)/) : tokenize(plaintext);
  return parts.filter((p) => p.length > 0).map((value, originalIndex) => ({ elementId: randomId('id'), value, originalIndex, isDecoy: false }));
}

export function generateCoordinateGrid(size: number) {
  const rowCount = Math.max(2, Math.ceil(Math.sqrt(size) / 2));
  const colCount = Math.max(2, Math.ceil(size / rowCount));
  return { rows: rows.slice(0, rowCount), columns: Array.from({ length: colCount }, (_, i) => i + 1) };
}

function shuffle<T>(arr: T[]): T[] { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

export function createScrambledArrangement(elements: DataElement[], grid: { rows: string[]; columns: number[]; }, decoyRatio = 0) {
  const coordinates = shuffle(grid.rows.flatMap((r) => grid.columns.map((c) => `${r}${c}`)));
  const needed = elements.length + Math.floor(elements.length * decoyRatio);
  while (coordinates.length < needed) coordinates.push(`${grid.rows[0]}${grid.columns[0]}-${coordinates.length}`);
  const decoys: DataElement[] = Array.from({ length: Math.floor(elements.length * decoyRatio) }, (_, i) => ({ elementId: randomId('id'), value: `decoy-${i}`, originalIndex: -1, isDecoy: true }));
  const all = shuffle([...elements, ...decoys]);
  return all.map((element, i) => ({ coordinate: coordinates[i], elementId: element.elementId, value: element.value, isDecoy: element.isDecoy, originalIndex: element.originalIndex }));
}

export function generateCoordinateMap(arrangement: ReturnType<typeof createScrambledArrangement>, contentId: string, splitMode: SplitMode, fragmentHash: string): UserCoordinateMap {
  const ordered = arrangement.filter((x) => !x.isDecoy).sort((a, b) => a.originalIndex - b.originalIndex);
  return { version: '0.1', contentId, splitMode, originalLength: ordered.length, reconstructionSequence: ordered.map((x) => ({ originalIndex: x.originalIndex, coordinate: x.coordinate, elementId: x.elementId })), serverFragmentHash: fragmentHash, createdAt: new Date().toISOString() };
}

function sha256(message: string): string {
  const words: number[] = [];
  const text = new TextEncoder().encode(message);
  for (let i = 0; i < text.length; i += 1) words.push(text[i]);
  words.push(0x80);
  while ((words.length % 64) !== 56) words.push(0);
  const bitLength = text.length * 8;
  for (let i = 7; i >= 0; i -= 1) words.push((bitLength >>> (i * 8)) & 0xff);

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const rotr = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));
  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const w = new Uint32Array(64);
  for (let chunkStart = 0; chunkStart < words.length; chunkStart += 64) {
    for (let i = 0; i < 16; i += 1) {
      const offset = chunkStart + i * 4;
      w[i] = ((words[offset] << 24) | (words[offset + 1] << 16) | (words[offset + 2] << 8) | (words[offset + 3])) >>> 0;
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = (rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)) >>> 0;
      const s1 = (rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)) >>> 0;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, hTemp] = h;
    for (let i = 0; i < 64; i += 1) {
      const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (hTemp + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;
      hTemp = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
    h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0;
    h[7] = (h[7] + hTemp) >>> 0;
  }

  return h.map((word) => word.toString(16).padStart(8, '0')).join('');
}

function hashFragments(blob: Omit<ServerFragmentBlob, 'fragmentHash'>): string {
  return sha256(JSON.stringify(blob));
}

export function protectData(input: { plaintext: string; splitMode: SplitMode; decoyRatio?: number; }) {
  const contentId = randomId('content');
  const elements = splitOriginalData(input.plaintext, input.splitMode);
  const grid = generateCoordinateGrid(elements.length + Math.floor(elements.length * (input.decoyRatio ?? 0)));
  const arrangement = createScrambledArrangement(elements, grid, input.decoyRatio ?? 0);
  const createdAt = new Date().toISOString();
  const noHash = { version: '0.1' as const, contentId, splitMode: input.splitMode, grid, fragments: arrangement.map(({ coordinate, elementId, value, isDecoy }) => ({ coordinate, elementId, value, isDecoy })), createdAt };
  const fragmentHash = hashFragments(noHash);
  const serverFragmentBlob: ServerFragmentBlob = { ...noHash, fragmentHash };
  const userCoordinateMap = generateCoordinateMap(arrangement, contentId, input.splitMode, fragmentHash);
  return { serverFragmentBlob, userCoordinateMap };
}

export function validateIntegrity(serverFragmentBlob: ServerFragmentBlob): ValidationResult {
  const { fragmentHash, ...rest } = serverFragmentBlob;
  const calc = hashFragments(rest);
  return calc === fragmentHash ? { valid: true } : { valid: false, reason: 'Server fragment hash mismatch.' };
}

export function validateReconstructionInputs(input: { serverFragmentBlob?: ServerFragmentBlob; userCoordinateMap?: UserCoordinateMap; }): ValidationResult {
  if (!input.serverFragmentBlob) return { valid: false, reason: 'Missing server fragment blob.' };
  if (!input.userCoordinateMap) return { valid: false, reason: 'Missing user-held reconstruction coordinates.' };
  if (input.serverFragmentBlob.contentId !== input.userCoordinateMap.contentId) return { valid: false, reason: 'contentId mismatch.' };
  if (input.serverFragmentBlob.fragmentHash !== input.userCoordinateMap.serverFragmentHash) return { valid: false, reason: 'Server fragment hash does not match coordinate map.' };
  const integrity = validateIntegrity(input.serverFragmentBlob);
  if (!integrity.valid) return integrity;
  return { valid: true };
}

export function reconstructOriginalData(serverFragmentBlob: ServerFragmentBlob, userCoordinateMap: UserCoordinateMap): string {
  const fragIndex = new Map(serverFragmentBlob.fragments.map((f) => [f.coordinate, f]));
  const pieces = userCoordinateMap.reconstructionSequence.sort((a, b) => a.originalIndex - b.originalIndex).map((seq) => {
    const frag = fragIndex.get(seq.coordinate);
    if (!frag) throw new Error(`Missing fragment at coordinate ${seq.coordinate}`);
    if (frag.elementId !== seq.elementId) throw new Error(`Element mismatch at coordinate ${seq.coordinate}`);
    return frag.value;
  });
  return pieces.join('');
}

export function reconstructData(input: { serverFragmentBlob: ServerFragmentBlob; userCoordinateMap: UserCoordinateMap; }): { plaintext: string } {
  const valid = validateReconstructionInputs(input);
  if (!valid.valid) throw new Error(valid.reason);
  return { plaintext: reconstructOriginalData(input.serverFragmentBlob, input.userCoordinateMap) };
}

export function detectTampering(serverFragmentBlob: ServerFragmentBlob, userCoordinateMap: UserCoordinateMap): ValidationResult {
  return validateReconstructionInputs({ serverFragmentBlob, userCoordinateMap });
}
