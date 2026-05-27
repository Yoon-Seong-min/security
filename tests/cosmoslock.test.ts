import { describe, it, expect } from 'vitest';
import { protectData, reconstructData, validateIntegrity, validateReconstructionInputs } from '@cosmoslock/core';
import { encryptCoordinateMap, decryptCoordinateMap } from '@cosmoslock/vault';

describe('COSMOS LOCK MVP', () => {
  it('1 char mode', () => { const p='hello'; const x=protectData({plaintext:p,splitMode:'char'}); expect(reconstructData(x).plaintext).toBe(p); });
  it('2 word mode spaces', () => { const p='hello   world'; const x=protectData({plaintext:p,splitMode:'word'}); expect(reconstructData(x).plaintext).toBe(p); });
  it('3 token punctuation', () => { const p='Hi, world! (ok?)'; const x=protectData({plaintext:p,splitMode:'token'}); expect(reconstructData(x).plaintext).toBe(p); });
  it('4 korean', () => { const p='안녕하세요 세계'; const x=protectData({plaintext:p,splitMode:'char'}); expect(reconstructData(x).plaintext).toBe(p); });
  it('5 emoji', () => { const p='🔒🌌🙂'; const x=protectData({plaintext:p,splitMode:'char'}); expect(reconstructData(x).plaintext).toBe(p); });
  it('6 newline', () => { const p='a\n\nb'; const x=protectData({plaintext:p,splitMode:'token'}); expect(reconstructData(x).plaintext).toBe(p); });
  it('7 no plaintext sequence', () => { const p='secret string'; const x=protectData({plaintext:p,splitMode:'char'}); expect(JSON.stringify(x.serverFragmentBlob)).not.toContain('secret string'); });
  it('8 fail without map', () => { const p='abc'; const x=protectData({plaintext:p,splitMode:'char'}); expect(validateReconstructionInputs({serverFragmentBlob:x.serverFragmentBlob}).valid).toBe(false); });
  it('9 fail wrong contentId', () => { const x=protectData({plaintext:'abc',splitMode:'char'}); x.userCoordinateMap.contentId='wrong'; expect(()=>reconstructData(x)).toThrow(); });
  it('10 fail tampered server', () => { const x=protectData({plaintext:'abc',splitMode:'char'}); x.serverFragmentBlob.fragments[0].value='X'; expect(()=>reconstructData(x)).toThrow(); });
  it('11 fail tampered map', () => { const x=protectData({plaintext:'abc',splitMode:'char'}); x.userCoordinateMap.reconstructionSequence[0].elementId='bad'; expect(()=>reconstructData(x)).toThrow(); });
  it('12 wrong vault passphrase', async () => { const x=protectData({plaintext:'abc',splitMode:'char'}); const enc=await encryptCoordinateMap(x.serverFragmentBlob.contentId,x.userCoordinateMap,'right'); await expect(decryptCoordinateMap(enc,'wrong')).rejects.toThrow(); });
  it('13 decoys ignored', () => { const p='abc'; const x=protectData({plaintext:p,splitMode:'char',decoyRatio:1}); expect(x.serverFragmentBlob.fragments.some(f=>f.isDecoy)).toBe(true); expect(reconstructData(x).plaintext).toBe(p); });
  it('14 hash validation success', () => { const x=protectData({plaintext:'abc',splitMode:'char'}); expect(validateIntegrity(x.serverFragmentBlob).valid).toBe(true); });
  it('15 hash validation fail', () => { const x=protectData({plaintext:'abc',splitMode:'char'}); x.serverFragmentBlob.fragments[0].value='z'; expect(validateIntegrity(x.serverFragmentBlob).valid).toBe(false); });
});
