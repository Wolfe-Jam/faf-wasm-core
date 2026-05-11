# Changelog

## 1.1.0 (2026-05-11) — Zig Cascade kernel live

**Stage 2 of the Cascade rollout.** The Zig kernel slot — placeholder
since v1.0.0 — is now wired to a real Cascade build.

- `kernels/zig.ts` — real loader replaces the throw-stub placeholder
- `wasm/cascade.wasm` (NEW, 2,742 B) — Zig kernel artifact, mk4-routed,
  post `wasm-opt -Oz --strip-debug`
- `index.ts` `capabilities()` honest for Zig: `score` + `tier` today;
  `validate(yaml)`, `compile`, `decompile`, `scoreBinary`, `binaryInfo`,
  `scoreEnterprise` remain Rust-kernel territory
- **Score parity vs Rust kernel verified** — 3 fixtures, byte-equal score
- **Stage-parity by construction** — the same `cascade.wasm` bytes (md5)
  ship to every consumer location; no per-consumer drift possible
- **44 tests passing** (was 35; +9 new Zig kernel tests + parity receipt)
- `init('rust')` and `init('zig')` both return the same `FafKernel` shape;
  consumers swap engines without changing call sites
- *"One interface, any kernel, same score"* — now enforceable, not aspirational

## 1.0.0 (2026-03-20)

Initial release.

- `FafKernel` interface — the contract for any WASM engine
- Rust kernel adapter wrapping faf-wasm-sdk (Mk4, 322KB)
- Zig kernel placeholder (Cascade — future)
- `init()`, `getKernel()`, `capabilities()`, `score()`, `reset()`
- `ScoreResult`, `FafbInfo`, `SlotState`, `TIERS`, `KernelCapabilityError`
- 36 tests passing
- 284μs per score
- Zero dependencies
