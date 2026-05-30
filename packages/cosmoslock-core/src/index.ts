// CosmosLock Core — US Patent 12,411,980 B2
// Coordinate-based data atomization & reconstruction gate

export type SplitMode = 'char' | 'word' | 'token';

export interface DataElement {
  elementId: string;
  value: string;
  originalIndex: number;
  isDecoy: boolean;
}

export interface ServerFragmentBlob {
  version: '0.2';
  contentId: string;
  splitMode: SplitMode;
  grid: { rows: string[]; columns: number[] };
  fragments: Array<{
    coordinate: string;
    elementId: string;
    value: string;
    isDecoy: boolean;
  }>;
  fragmentHash: string;
  createdAt: string;
  label?: string; // optional user label
}

export interface UserCoordinateMap {
  version: '0.2';
  contentId: string;
  splitMode: SplitMode;
  originalLength: number;
  reconstructionSequence: Array<{
    originalIndex: number;
    coordinate: string;
    elementId: string;
  }>;
  serverFragmentHash: string;
  createdAt: string;
  label?: string;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export interface ProtectResult {
  serverFragmentBlob: ServerFragmentBlob;
  userCoordinateMap: UserCoordinateMap;
}

// ── ID generation (browser + Node compatible) ──────────────────────────────
function randomId(prefix = 'id'): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return `${prefix}_${c.randomUUID()}`;
  if (c?.getRandomValues) {
    const b = new Uint8Array(16);
    c.getRandomValues(b);
    return `${prefix}_${Array.from(b).map(x => x.toString(16).padStart(2,'0')).join('')}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// ── Split modes ────────────────────────────────────────────────────────────
const ROWS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const tokenize = (t: string) => t.match(/\p{L}+|\p{N}+|\s+|[^\s\p{L}\p{N}]/gu) ?? [];

export function splitData(plaintext: string, mode: SplitMode): DataElement[] {
  const parts =
    mode === 'char'  ? Array.from(plaintext) :
    mode === 'word'  ? plaintext.split(/(\s+)/) :
    tokenize(plaintext);
  return parts
    .filter(p => p.length > 0)
    .map((value, originalIndex) => ({ elementId: randomId('id'), value, originalIndex, isDecoy: false }));
}

// ── Coordinate grid ────────────────────────────────────────────────────────
export function generateGrid(totalSlots: number) {
  const rowCount = Math.max(2, Math.ceil(Math.sqrt(totalSlots / 2)));
  const colCount = Math.max(2, Math.ceil(totalSlots / rowCount));
  return {
    rows: ROWS.slice(0, rowCount),
    columns: Array.from({ length: colCount }, (_, i) => i + 1),
  };
}

// ── Fisher-Yates shuffle ───────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Scrambled arrangement (Patent: randomly assign coordinate info) ────────
export function scramble(
  elements: DataElement[],
  grid: { rows: string[]; columns: number[] },
  decoyRatio = 0.2,
) {
  const allCoords = shuffle(
    grid.rows.flatMap(r => grid.columns.map(c => `${r}${c}`))
  );

  const decoyCount = Math.floor(elements.length * decoyRatio);
  const decoys: DataElement[] = Array.from({ length: decoyCount }, (_, i) => ({
    elementId: randomId('id'),
    value: `decoy-${i}`,
    originalIndex: -1,
    isDecoy: true,
  }));

  const all = shuffle([...elements, ...decoys]);
  // Ensure enough coordinates
  while (allCoords.length < all.length) allCoords.push(`${grid.rows[0]}${grid.columns[0]}-${allCoords.length}`);

  return all.map((el, i) => ({
    coordinate: allCoords[i],
    elementId: el.elementId,
    value: el.value,
    isDecoy: el.isDecoy,
    originalIndex: el.originalIndex,
  }));
}

// ── Coordinate map (Patent: coordinate array info in original order) ───────
export function buildCoordinateMap(
  arrangement: ReturnType<typeof scramble>,
  contentId: string,
  splitMode: SplitMode,
  fragmentHash: string,
  label?: string,
): UserCoordinateMap {
  const seq = arrangement
    .filter(x => !x.isDecoy)
    .sort((a, b) => a.originalIndex - b.originalIndex);
  return {
    version: '0.2',
    contentId,
    splitMode,
    originalLength: seq.length,
    reconstructionSequence: seq.map(x => ({
      originalIndex: x.originalIndex,
      coordinate: x.coordinate,
      elementId: x.elementId,
    })),
    serverFragmentHash: fragmentHash,
    createdAt: new Date().toISOString(),
    ...(label ? { label } : {}),
  };
}

// ── Pure JS SHA-256 (no Node dep) ─────────────────────────────────────────
function sha256sync(message: string): string {
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ];
  const enc = new TextEncoder();
  const bytes = enc.encode(message);
  const words: number[] = [...bytes, 0x80];
  while ((words.length % 64) !== 56) words.push(0);
  const bits = bytes.length * 8;
  for (let i = 7; i >= 0; i--) words.push((bits >>> (i * 8)) & 0xff);
  const rotr = (v: number, n: number) => (v >>> n) | (v << (32 - n));
  const h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const w = new Uint32Array(64);
  for (let cs = 0; cs < words.length; cs += 64) {
    for (let i = 0; i < 16; i++) {
      const o = cs + i * 4;
      w[i] = ((words[o]<<24)|(words[o+1]<<16)|(words[o+2]<<8)|words[o+3]) >>> 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = (rotr(w[i-15],7)^rotr(w[i-15],18)^(w[i-15]>>>3))>>>0;
      const s1 = (rotr(w[i-2],17)^rotr(w[i-2],19)^(w[i-2]>>>10))>>>0;
      w[i] = (w[i-16]+s0+w[i-7]+s1)>>>0;
    }
    let [a,b,c,d,e,f,g,hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = (rotr(e,6)^rotr(e,11)^rotr(e,25))>>>0;
      const ch = ((e&f)^(~e&g))>>>0;
      const t1 = (hh+S1+ch+K[i]+w[i])>>>0;
      const S0 = (rotr(a,2)^rotr(a,13)^rotr(a,22))>>>0;
      const maj = ((a&b)^(a&c)^(b&c))>>>0;
      const t2 = (S0+maj)>>>0;
      hh=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
    }
    h[0]=(h[0]+a)>>>0; h[1]=(h[1]+b)>>>0; h[2]=(h[2]+c)>>>0; h[3]=(h[3]+d)>>>0;
    h[4]=(h[4]+e)>>>0; h[5]=(h[5]+f)>>>0; h[6]=(h[6]+g)>>>0; h[7]=(h[7]+hh)>>>0;
  }
  return h.map(x => x.toString(16).padStart(8,'0')).join('');
}

export function hashBlob(blob: Omit<ServerFragmentBlob, 'fragmentHash'>): string {
  return sha256sync(JSON.stringify(blob));
}

// ── Main protect function ─────────────────────────────────────────────────
export function protectData(input: {
  plaintext: string;
  splitMode: SplitMode;
  decoyRatio?: number;
  label?: string;
}): ProtectResult {
  const contentId = randomId('content');
  const elements = splitData(input.plaintext, input.splitMode);
  const decoyRatio = input.decoyRatio ?? 0.2;
  const grid = generateGrid(elements.length + Math.floor(elements.length * decoyRatio));
  const arrangement = scramble(elements, grid, decoyRatio);
  const createdAt = new Date().toISOString();

  const noHash: Omit<ServerFragmentBlob, 'fragmentHash'> = {
    version: '0.2',
    contentId,
    splitMode: input.splitMode,
    grid,
    fragments: arrangement.map(({ coordinate, elementId, value, isDecoy }) => ({
      coordinate, elementId, value, isDecoy,
    })),
    createdAt,
    ...(input.label ? { label: input.label } : {}),
  };

  const fragmentHash = hashBlob(noHash);
  const serverFragmentBlob: ServerFragmentBlob = { ...noHash, fragmentHash };
  const userCoordinateMap = buildCoordinateMap(arrangement, contentId, input.splitMode, fragmentHash, input.label);

  return { serverFragmentBlob, userCoordinateMap };
}

// ── Validation ────────────────────────────────────────────────────────────
export function validateIntegrity(blob: ServerFragmentBlob): ValidationResult {
  const { fragmentHash, ...rest } = blob;
  return hashBlob(rest) === fragmentHash
    ? { valid: true }
    : { valid: false, reason: 'Fragment hash mismatch — server data may be tampered.' };
}

export function validateInputs(input: {
  serverFragmentBlob?: ServerFragmentBlob;
  userCoordinateMap?: UserCoordinateMap;
}): ValidationResult {
  if (!input.serverFragmentBlob) return { valid: false, reason: 'Missing server fragment blob.' };
  if (!input.userCoordinateMap)  return { valid: false, reason: 'Missing user coordinate map.' };
  if (input.serverFragmentBlob.contentId !== input.userCoordinateMap.contentId)
    return { valid: false, reason: 'Content ID mismatch.' };
  if (input.serverFragmentBlob.fragmentHash !== input.userCoordinateMap.serverFragmentHash)
    return { valid: false, reason: 'Hash mismatch between server and coordinate map.' };
  return validateIntegrity(input.serverFragmentBlob);
}

// ── Reconstruct ───────────────────────────────────────────────────────────
export function reconstructData(input: {
  serverFragmentBlob: ServerFragmentBlob;
  userCoordinateMap: UserCoordinateMap;
}): { plaintext: string } {
  const check = validateInputs(input);
  if (!check.valid) throw new Error(check.reason);

  const fragIndex = new Map(input.serverFragmentBlob.fragments.map(f => [f.coordinate, f]));
  const pieces = input.userCoordinateMap.reconstructionSequence
    .sort((a, b) => a.originalIndex - b.originalIndex)
    .map(seq => {
      const frag = fragIndex.get(seq.coordinate);
      if (!frag) throw new Error(`Missing fragment at ${seq.coordinate}`);
      if (frag.elementId !== seq.elementId) throw new Error(`Element mismatch at ${seq.coordinate}`);
      return frag.value;
    });

  return { plaintext: pieces.join('') };
}
