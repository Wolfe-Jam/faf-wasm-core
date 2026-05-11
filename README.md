# faf-wasm-core

The kernel router for FAF WASM engines. **One interface, any kernel, same score.**

Scores [`.faf`](https://faf.one) files (IANA-registered AI-context format) via embedded WASM. Two kernels live today: **Rust** (faf-wasm-sdk, full Mk4 + FAFb roundtrip) and **Zig Cascade** (mk4-routed, sub-microsecond on `validate`/`tier` native; 2.7 KB WASM artifact). Score parity between kernels verified on the same `.faf` inputs.

## Install

```bash
npm install faf-wasm-core
```

## Usage

```typescript
import { init } from "faf-wasm-core";

const kernel = await init("rust");  // full FafKernel surface
// or:
const kernel = await init("zig");   // Cascade — sub-μs delivery, score-only today

const result = kernel.score(yaml);

// result.score = 100
// result.tier  = "🏆"
// (Rust kernel also returns populated / empty / ignored / slots breakdown.
//  Zig kernel v0.2.0 returns the score + tier only — full slot breakdown
//  is Rust-kernel territory today.)
```

## The Interface

Every kernel implements `FafKernel`:

```typescript
interface FafKernel {
  score(yaml: string): ScoreResult;
  scoreEnterprise(yaml: string): ScoreResult;
  validate(yaml: string): boolean;
  compile(yaml: string): Uint8Array;
  decompile(bytes: Uint8Array): FafbInfo;
  scoreBinary(bytes: Uint8Array): ScoreBinaryResult;
  binaryInfo(bytes: Uint8Array): FafbInfo;
  version(): string;
  readonly engine: "rust" | "zig";
  readonly engineVersion: string;
}
```

## Capabilities

Not every kernel supports every method:

| Method | Rust | Zig (Cascade v0.2.0) |
|--------|------|----------------------|
| `score` | Yes | Yes (mk4 21-base-slot, score + tier only) |
| `scoreEnterprise` | Yes | No |
| `validate` (yaml) | Yes | No (cascade validates FAFb bytes, not YAML — different surface) |
| `compile` | Yes | No |
| `decompile` | Yes | No |
| `scoreBinary` | Yes | No |
| `binaryInfo` | Yes | No |

Unsupported methods throw `KernelCapabilityError` with a clear "use the Rust kernel" message. Query at runtime via `capabilities()`.

## What's Inside

- **329 KB** embedded Rust WASM (faf-wasm-sdk, Mk4 + FAFb roundtrip)
- **2.7 KB** embedded Zig WASM (cascade.wasm v0.2.0, mk4-routed)
- **Zero npm dependencies**
- **44 tests** passing — including 9 Zig-kernel tests + score-parity-vs-rust receipt

## Consumers

- [bun-sticky](https://github.com/Wolfe-Jam/bun-sticky-faf) — Bun CLI (embeds core)
- [builder.faf.one](https://builder.faf.one) — Browser scorer

## Part of the FAF Ecosystem

[FAF](https://faf.one) (Foundational AI-context Format) — IANA-registered (`application/vnd.faf+yaml`). 36,000+ downloads across npm, PyPI, and crates.io.

## License

MIT
