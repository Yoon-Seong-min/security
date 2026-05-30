# COSMOS LOCK Coordinate Vault SDK (MVP Demo)

## Disclaimers
- **Demo only**
- **Not independently audited**
- **Not production cryptography**
- **Designed to demonstrate reconstruction-control architecture**

This repository demonstrates separation of scrambled server-side fragments from user-held reconstruction coordinates, designed to reduce reconstruction risk after a server-side breach.

## What this MVP demonstrates
- Split plaintext into elements.
- Randomly assign elements to coordinate grid positions.
- Store only scrambled fragments on server.
- Store reconstruction map only in encrypted user vault (IndexedDB/export JSON).
- Require both server blob + unlocked user vault for reconstruction.
- Detect tampering via hash and coordinate/element validation.

## Architecture mapping
Original Data → Split into Elements → Random Coordinate Arrangement → Server Fragment Store + User Coordinate Vault → Reconstruction Gate → Temporary Reconstruction.

## Storage model
### Server stores
- `ServerFragmentBlob` with randomized coordinate/value fragments and hash.
- Reconstruction attempt audit entries (no plaintext).

### User vault stores
- `EncryptedVaultRecord` encrypted coordinate map (`UserCoordinateMap`) using PBKDF2 + AES-GCM.

## Why server-only breach fails
Server fragments intentionally omit original ordering and coordinate reconstruction sequence. Without user-held reconstruction coordinates, reconstruction fails.

## Run locally
```bash
npm install
npm run dev
```
Then open `/protect`, `/breach-simulation`, `/reconstruct/[contentId]`.

## Run tests
```bash
npm test
```

## Troubleshooting: stale Next.js bundle / cryptoObj.randomId error
If you see `cryptoObj.randomId is not a function` even after updating the SDK code, the browser or Next.js dev server may still be serving an old client bundle.

1. Stop the running Next dev server completely (`Ctrl+C`).
2. Run `npm run clean` from the repo root.
3. Start the dev server again with `npm run dev`.
4. Hard refresh the browser: `Cmd+Shift+R` or `Ctrl+Shift+R`.
5. If the error persists, open browser devtools and clear site data before reconnecting.

The root issue is that `packages/cosmoslock-core/src/index.ts` must call `crypto.randomUUID()` when available, not `cryptoObj.randomId('id')`.

## Known limitations
- MVP PoC, not production audited.
- Demo passphrase UX and local storage assumptions.
- No remote KMS/HSM or hardware-backed keying.
- No formal threat model or side-channel analysis.
- Not a replacement for encryption, IAM, or EDR; intended as a complementary post-breach data resilience layer.

## Production hardening checklist
See `BACKLOG.md` for passkeys/WebAuthn, secure enclave/keystore support, cloud vault providers, policy server, enterprise controls, audit exports, and security review planning.
