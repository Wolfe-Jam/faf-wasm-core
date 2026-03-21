# faf-wasm-core

The kernel router for FAF WASM engines. One interface, any kernel, same score.

Routes to [faf-wasm-sdk](https://github.com/Wolfe-Jam/faf-wasm-sdk) (Rust Mk4) today. Zig Cascade tomorrow. No consumer changes.

## Install

```bash
npm install faf-wasm-core
```

## Usage

```typescript
import { init } from "faf-wasm-core";

const kernel = await init("rust");  // or "zig" when Cascade ships
const result = kernel.score(yaml);

// result.score = 100
// result.populated = 11
// result.ignored = 10
// result.active = 11
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
  scoreBinary(bytes: Uint8Array): object;
  binaryInfo(bytes: Uint8Array): FafbInfo;
  version(): string;
  readonly engine: "rust" | "zig";
  readonly engineVersion: string;
}
```

## Capabilities

Not every kernel supports every method:

| Method | Rust | Zig (future) |
|--------|------|-------------|
| score | Yes | Yes |
| scoreEnterprise | Yes | No |
| validate | Yes | Yes |
| compile | Yes | No |
| decompile | Yes | No |
| scoreBinary | Yes | No |
| binaryInfo | Yes | No |

Unsupported methods throw `KernelCapabilityError`.

## What's Inside

- **322KB** embedded Rust WASM binary (Mk4 engine)
- **284us** per score
- **Zero dependencies**
- **36 tests** passing

## Consumers

- [bun-sticky](https://github.com/Wolfe-Jam/bun-sticky-faf) — Bun CLI (embeds core)
- [faf-cli](https://github.com/Wolfe-Jam/faf-cli) — Universal CLI
- [builder.faf.one](https://builder.faf.one) — Browser scorer

## Part of the FAF Ecosystem

[FAF](https://faf.one) (Foundational AI-context Format) — IANA-registered (`application/vnd.faf+yaml`). 36,000+ downloads across npm, PyPI, and crates.io.

## License

MIT
