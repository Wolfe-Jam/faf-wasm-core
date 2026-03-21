# Changelog

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
