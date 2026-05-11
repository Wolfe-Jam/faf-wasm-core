<!-- faf: faf-wasm-core | TypeScript | wasm | The kernel router for FAF WASM engines. Routes to faf-wasm-sdk (Rust) today, Zig Cascade tomorrow. One interface, any engine. -->
<!-- faf: claim=project.faf | family=FAF -->

# CLAUDE.md — faf-wasm-core

## What This Is

The kernel router for FAF WASM engines. Routes to faf-wasm-sdk (Rust) today, Zig Cascade tomorrow. One interface, any engine.

## Stack

- **Language:** TypeScript

## Context

- **Who:** Consumers of FAF via WASM — Node, Bun, browser. Direct callers — faf-wasm-sdk integrators today, Cascade/ZEPH integrators (xAI/Grok) at Stage 2. wolfejam (IP owner, public repo).
- **What:** Thin TypeScript router exposing one `FafKernel` interface and dispatching to embedded WASM engines. Rust kernel (faf-wasm-sdk) live today; Zig kernel (Cascade) wires in via M7. One npm package, one interface, multiple kernels. "One interface, any kernel, same score."
- **Why:** The FAF format is content; kernels are speed. faf-wasm-core lets consumers swap kernels without changing call sites — pick `rust` for proven Mk4 today, `zig` for sub-microsecond Cascade tomorrow. One interface lowers the integration cost of adding new engines.
- **Where:** github.com/Wolfe-Jam/faf-wasm-core (public). npm — faf-wasm-core. Runs in Node ≥18, Bun ≥1.0, modern browsers. WASM artifacts in `wasm/`, TypeScript kernel wrappers in `kernels/`.
- **When:** v1.0.0 shipped single-kernel (Rust). M7 in progress 2026-05-11 — wiring Zig Cascade as second kernel + bumping to v1.1.0. cascade.wasm artifact synced from /FAF/cascade/ per kernel-doesnt-change-between-stages doctrine.
- **How:** Install via npm install faf-wasm-core, then await init('rust') or init('zig'), then call .score(yaml) / .validate(yaml) / etc. Both kernels return the same FafKernel shape. Tests run via bun test. No build step — ships TypeScript natively via bun/Node ESM.

---

*STATUS: BI-SYNC ACTIVE — 2026-05-11T02:52:24.110Z*
