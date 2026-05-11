<!-- faf: faf-wasm-core | TypeScript | wasm | The kernel router for FAF WASM engines. Rust + Zig (Cascade) both live. One interface, any kernel, same score. -->
<!-- faf: claim=project.faf | family=FAF -->

# CLAUDE.md — faf-wasm-core

## What This Is

The kernel router for FAF WASM engines. Rust + Zig (Cascade) both live. One interface, any kernel, same score.

## Stack

- **Language:** TypeScript

## Context

- **Who:** Consumers of FAF via WASM — Node, Bun, browser. Direct callers — faf-wasm-sdk integrators today, Cascade/ZEPH integrators (xAI/Grok) at Stage 2. wolfejam (IP owner, public repo).
- **What:** Thin TypeScript router exposing one `FafKernel` interface and dispatching to embedded WASM engines. Two kernels live as of v1.1.0 (M7, 2026-05-11) — Rust (faf-wasm-sdk, full FafKernel surface) and Zig (Cascade, score + tier surface, sub-microsecond delivery). One npm package, one interface, multiple kernels. "One interface, any kernel, same score."
- **Why:** The FAF format is content; kernels are speed. faf-wasm-core lets consumers swap kernels without changing call sites — pick `rust` for the full FafKernel surface (Mk4 + FAFb roundtrip), `zig` for sub-microsecond Cascade delivery (score + tier). One interface lowers the integration cost of adding new engines.
- **Where:** github.com/Wolfe-Jam/faf-wasm-core (public). npm — faf-wasm-core. Runs in Node ≥18, Bun ≥1.0, modern browsers. WASM artifacts in `wasm/`, TypeScript kernel wrappers in `kernels/`.
- **When:** v1.0.0 shipped single-kernel (Rust) 2026-03-21. v1.1.0 landed 2026-05-11 (M7 — Zig Cascade kernel live, +9 tests, 44 total, parity vs Rust kernel verified on 3 fixtures). cascade.wasm artifact (2,742 B) synced from /FAF/cascade/ per kernel-doesnt-change-between-stages doctrine.
- **How:** Install via npm install faf-wasm-core, then await init('rust') or init('zig'), then call .score(yaml) / .validate(yaml) / etc. Both kernels return the same FafKernel shape. Tests run via bun test. No build step — ships TypeScript natively via bun/Node ESM.

---

*STATUS: BI-SYNC ACTIVE — 2026-05-11T03:54:14.219Z*
