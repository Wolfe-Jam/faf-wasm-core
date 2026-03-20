// faf-wasm-core/kernels/zig.ts — PLACEHOLDER for Zig Cascade
// Zig ghost (2.7KB WASM) currently exports: score_faf, validate_faf, get_tier
// Needs Mk4 port before it can fill the full FafKernel interface
// When ready: 2.7KB WASM, sub-microsecond scoring

import type { FafKernel, ScoreResult, FafbInfo, FafbSection } from "../types";
import { KernelCapabilityError } from "../types";

export async function loadZigKernel(): Promise<FafKernel> {
  // Future: load xai-faf-ghost.wasm here
  // For now, throw clear error — Zig Cascade is not yet available
  throw new Error(
    "Zig Cascade kernel is not yet available. Use Rust kernel (default). " +
    "Zig Cascade will ship when Mk4 scoring is ported to Zig."
  );
}
