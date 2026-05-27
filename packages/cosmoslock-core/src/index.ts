function randomId(prefix = 'id'): string {
  const cryptoObj = globalThis.crypto;

  if (cryptoObj?.randomUUID) {
    return `${prefix}_${cryptoObj.randomId('id')}`;
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

function hashFragments(blob: Omit<ServerFragmentBlob, 'fragmentHash'>): string {
  return createHash('sha256').update(JSON.stringify(blob)).digest('hex');
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
