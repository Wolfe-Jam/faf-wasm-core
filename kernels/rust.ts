// faf-wasm-core/kernels/rust.ts — Wraps faf-wasm-sdk (322KB WASM, 8 exports)
// The compiler IS the spec. This adapter doesn't rewrite — it routes.

import type { FafKernel, ScoreResult, FafbInfo, FafbSection } from "../types";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

export async function loadRustKernel(): Promise<FafKernel> {
  // Load wasm-bindgen glue
  const bindings = await import("../wasm/faf_wasm_sdk.js");

  // Load WASM binary — runtime-agnostic (works in Bun, Node, Deno)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const wasmPath = join(__dirname, "..", "wasm", "faf_wasm_sdk_bg.wasm");
  const wasmBytes = readFileSync(wasmPath);

  await bindings.default(wasmBytes);

  const engineVersion = bindings.sdk_version();

  return {
    engine: "rust" as const,
    engineVersion,

    score(yaml: string): ScoreResult {
      return JSON.parse(bindings.score_faf(yaml));
    },

    scoreEnterprise(yaml: string): ScoreResult {
      return JSON.parse(bindings.score_faf_enterprise(yaml));
    },

    validate(yaml: string): boolean {
      return bindings.validate_faf(yaml);
    },

    compile(yaml: string): Uint8Array {
      return bindings.compile_fafb(yaml);
    },

    decompile(bytes: Uint8Array): FafbInfo & { sections: (FafbSection & { content: string })[] } {
      return JSON.parse(bindings.decompile_fafb(bytes));
    },

    scoreBinary(bytes: Uint8Array) {
      return JSON.parse(bindings.score_fafb(bytes));
    },

    binaryInfo(bytes: Uint8Array): FafbInfo {
      return JSON.parse(bindings.fafb_info(bytes));
    },

    version(): string {
      return bindings.sdk_version();
    },
  };
}
