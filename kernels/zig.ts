// faf-wasm-core/kernels/zig.ts — Cascade kernel (Zig).
//
// Loads cascade.wasm (private engine artifact, synced from /FAF/cascade
// post-build per kernel-doesnt-change-between-stages doctrine). Exposes
// the score export through FafKernel.score; the kernel methods that
// cascade doesn't surface yet (scoreEnterprise, validate-on-yaml, compile,
// decompile, scoreBinary, binaryInfo) throw KernelCapabilityError so
// consumers see a clean signal rather than a silent wrong answer.
//
// cascade.score routes through mk4.calculate(yaml, .base) since v0.2.0.
// Score parity vs the Rust kernel verified on the same .faf inputs
// (3/3 fixtures, byte-equal — see /FAF/cascade/TEST-LOG.md). The "one
// interface, any kernel, same score" promise of the router is
// enforceable from this kernel forward.

import type { FafKernel, ScoreResult, FafbInfo, FafbSection } from "../types";
import { KernelCapabilityError, TIERS } from "../types";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Zig packs static data + stack at low memory addresses. Inputs go past
// one WASM page (64 KB) to avoid corrupting the runtime. Mirrors the
// same trick used in /FAF/cascade/tests/wasm_harness.mjs.
const INPUT_OFFSET = 65536;

type CascadeExports = {
  score(ptr: number, len: number): number;
  validate(ptr: number, len: number): number;
  tier(s: number): number;
  memory: WebAssembly.Memory;
};

function tierEmojiFor(score: number): string {
  if (score >= TIERS.TROPHY.min) return TIERS.TROPHY.emoji;
  if (score >= TIERS.GOLD.min) return TIERS.GOLD.emoji;
  if (score >= TIERS.SILVER.min) return TIERS.SILVER.emoji;
  if (score >= TIERS.BRONZE.min) return TIERS.BRONZE.emoji;
  if (score >= TIERS.GREEN.min) return TIERS.GREEN.emoji;
  if (score >= TIERS.YELLOW.min) return TIERS.YELLOW.emoji;
  return TIERS.RED.emoji;
}

export async function loadZigKernel(): Promise<FafKernel> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const wasmPath = join(__dirname, "..", "wasm", "cascade.wasm");
  const wasmBytes = readFileSync(wasmPath);
  const { instance } = await WebAssembly.instantiate(wasmBytes);
  const exports = instance.exports as CascadeExports;

  const enc = new TextEncoder();

  function writeInput(bytes: Uint8Array): [number, number] {
    const mem = new Uint8Array(exports.memory.buffer);
    mem.fill(0, INPUT_OFFSET, INPUT_OFFSET + bytes.length + 1);
    mem.set(bytes, INPUT_OFFSET);
    return [INPUT_OFFSET, bytes.length];
  }

  return {
    engine: "zig" as const,
    engineVersion: "0.2.0",

    score(yaml: string): ScoreResult {
      const bytes = enc.encode(yaml);
      const [ptr, len] = writeInput(bytes);
      const s = exports.score(ptr, len);
      // cascade ABI v0.2.0 returns only the score byte. populated /
      // empty / ignored / slots are not exposed yet — Rust kernel
      // remains the source for the full slot breakdown. Score parity
      // with Rust kernel is confirmed for the headline number.
      return {
        score: s,
        tier: tierEmojiFor(s),
        populated: 0,
        empty: 0,
        ignored: 0,
        active: 21,
        total: 21,
        slots: {},
      };
    },

    scoreEnterprise(): ScoreResult {
      throw new KernelCapabilityError("scoreEnterprise", "zig");
    },

    validate(_yaml: string): boolean {
      // cascade.validate takes FAFb BYTES, not YAML. The YAML-shape
      // validator lives in the Rust kernel today. Surface the gap
      // honestly rather than return a wrong answer.
      throw new KernelCapabilityError("validate(yaml)", "zig");
    },

    compile(_yaml: string): Uint8Array {
      throw new KernelCapabilityError("compile", "zig");
    },

    decompile(_bytes: Uint8Array): FafbInfo & { sections: (FafbSection & { content: string })[] } {
      throw new KernelCapabilityError("decompile", "zig");
    },

    scoreBinary(_bytes: Uint8Array) {
      throw new KernelCapabilityError("scoreBinary", "zig");
    },

    binaryInfo(_bytes: Uint8Array): FafbInfo {
      throw new KernelCapabilityError("binaryInfo", "zig");
    },

    version(): string {
      return "0.2.0";
    },
  };
}
