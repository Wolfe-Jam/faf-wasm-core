// faf-wasm-core — The kernel router.
// faf-wasm-sdk is the spec. This routes to it (and later, to Zig Cascade).

import type { FafKernel, ScoreResult, KernelCapabilities } from "./types.js";
export type { FafKernel, ScoreResult, FafbInfo, FafbSection, SlotState, KernelCapabilities } from "./types.js";
export { TIERS, getTierEmoji, KernelCapabilityError } from "./types.js";

let kernel: FafKernel | null = null;

/** Initialize with auto-detected or specified kernel */
export async function init(engine?: "rust" | "zig"): Promise<FafKernel> {
  if (kernel) return kernel;

  const target = engine ?? "rust";

  if (target === "rust") {
    const { loadRustKernel } = await import("./kernels/rust.js");
    kernel = await loadRustKernel();
  } else {
    const { loadZigKernel } = await import("./kernels/zig.js");
    kernel = await loadZigKernel();
  }

  return kernel;
}

/** Get current kernel (throws if not initialized) */
export function getKernel(): FafKernel {
  if (!kernel) throw new Error("Call init() first");
  return kernel;
}

/** Query what the active kernel supports */
export function capabilities(): KernelCapabilities {
  const k = getKernel();
  if (k.engine === "rust") {
    return {
      score: true, scoreEnterprise: true, validate: true,
      compile: true, decompile: true, scoreBinary: true, binaryInfo: true,
    };
  }
  // Zig Cascade v0.2.0: score only. validate(yaml) is rust-kernel
  // territory — cascade.validate operates on FAFb bytes, not YAML.
  // FAFb-roundtrip methods are not exposed by the cascade ABI yet.
  return {
    score: true, scoreEnterprise: false, validate: false,
    compile: false, decompile: false, scoreBinary: false, binaryInfo: false,
  };
}

/** Convenience: score and get typed result in one call */
export async function score(yaml: string): Promise<ScoreResult> {
  const k = await init();
  return k.score(yaml);
}

/** Reset kernel (for testing) */
export function reset(): void {
  kernel = null;
}
