// faf-wasm-core/types.ts — THE contract. Kernel-agnostic. Immutable.

/** Score result from any WASM kernel */
export interface ScoreResult {
  score: number;           // 0-100 (integer)
  tier: string;            // Emoji: 🏆 🥇 🥈 🥉 🟢 🟡 🔴
  populated: number;       // Filled slots
  empty: number;           // Empty slots
  ignored: number;         // Slotignored slots
  active: number;          // total - ignored (denominator)
  total: number;           // 21 (Base) or 33 (Enterprise)
  slots: Record<string, SlotState>;  // Per-slot breakdown
}

export type SlotState = "populated" | "empty" | "slotignored";

/** FAFb binary info (Rust kernel only in v1, Zig Cascade later) */
export interface FafbInfo {
  version: string;
  flags: number;
  section_count: number;
  total_size: number;
  source_checksum: string;
  sections: FafbSection[];
}

export interface FafbSection {
  name: string;
  type_id: number;
  priority: number;
  length: number;
  token_count: number;
  classification: string;  // "DNA" | "Context" | "Pointer"
  content?: string;        // Present in decompile, absent in info
}

/** Tier boundaries (universal, baked in) */
export const TIERS = {
  TROPHY:  { min: 100, emoji: "🏆", name: "Trophy" },
  GOLD:    { min: 99,  emoji: "🥇", name: "Gold" },
  SILVER:  { min: 95,  emoji: "🥈", name: "Silver" },
  BRONZE:  { min: 85,  emoji: "🥉", name: "Bronze" },
  GREEN:   { min: 70,  emoji: "🟢", name: "Green" },
  YELLOW:  { min: 55,  emoji: "🟡", name: "Yellow" },
  RED:     { min: 0,   emoji: "🔴", name: "Red" },
} as const;

/** Kernel capability flags */
export interface KernelCapabilities {
  score: boolean;
  scoreEnterprise: boolean;
  validate: boolean;
  compile: boolean;
  decompile: boolean;
  scoreBinary: boolean;
  binaryInfo: boolean;
}

/** Typed error for unsupported kernel methods */
export class KernelCapabilityError extends Error {
  constructor(method: string, engine: string) {
    super(`${method}() requires FAFb support — not available in ${engine} kernel. Use Rust kernel or wait for Zig Cascade.`);
    this.name = "KernelCapabilityError";
  }
}

/**
 * The kernel interface. Any WASM backend implements this.
 * Rust v1 (now). Zig Cascade (future). Same contract.
 */
export interface FafKernel {
  /** Score a .faf YAML string (Base 21-slot) */
  score(yaml: string): ScoreResult;

  /** Score a .faf YAML string (Enterprise 33-slot) */
  scoreEnterprise(yaml: string): ScoreResult;

  /** Validate .faf YAML structure */
  validate(yaml: string): boolean;

  /** Compile .faf YAML → FAFb binary */
  compile(yaml: string): Uint8Array;

  /** Decompile FAFb binary → structured JSON */
  decompile(bytes: Uint8Array): FafbInfo & { sections: (FafbSection & { content: string })[] };

  /** Score from pre-compiled FAFb binary */
  scoreBinary(bytes: Uint8Array): { source: string; score: number; name: string; tier: string; faf_version: string };

  /** Binary metadata (no content) */
  binaryInfo(bytes: Uint8Array): FafbInfo;

  /** Kernel version string */
  version(): string;

  /** Kernel identity */
  readonly engine: "rust" | "zig";
  readonly engineVersion: string;
}
