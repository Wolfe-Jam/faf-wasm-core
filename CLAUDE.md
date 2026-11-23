<!-- faf:start -->
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
- **When:** On npm since March 2026; two kernels live since May 2026 (Rust and Zig Cascade).
- **How:** One FafKernel interface over embedded WASM engines; each kernel computes the score, and the TypeScript wrapper maps the tier.

---

*STATUS: SYNC ACTIVE — 2026-11-23T04:57:19.464Z*
<!-- faf:end -->
