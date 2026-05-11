import { describe, test, expect, beforeAll, afterEach } from "bun:test";
import { init, getKernel, capabilities, score, reset, TIERS, KernelCapabilityError } from "../index";
import type { FafKernel, ScoreResult } from "../types";

const MINIMAL_FAF = `project:
  name: test-project
  goal: Testing the kernel router
  main_language: TypeScript`;

const FULL_FAF = `faf_version: "2.5.0"
project:
  name: test-project
  goal: Full scoring test
  main_language: TypeScript
  type: webapp
stack:
  frontend: React
  css_framework: Tailwind
  ui_library: shadcn
  state_management: zustand
  backend: Express
  api_type: REST
  runtime: Bun
  database: PostgreSQL
  connection: Prisma
  hosting: Vercel
  build: Vite
  cicd: GitHub Actions
human_context:
  who: Solo developer
  what: Building a web app
  why: Learn and ship
  where: localhost
  when: "2026"
  how: TypeScript + React`;

afterEach(() => {
  reset();
});

// =========================================================================
// INITIALIZATION
// =========================================================================

describe("Kernel Initialization", () => {
  test("init() loads Rust kernel by default", async () => {
    const kernel = await init();
    expect(kernel.engine).toBe("rust");
  });

  test("init('rust') loads Rust kernel explicitly", async () => {
    const kernel = await init("rust");
    expect(kernel.engine).toBe("rust");
  });

  test("init('zig') loads Cascade kernel (v0.2.0, mk4-routed)", async () => {
    const kernel = await init("zig");
    expect(kernel.engine).toBe("zig");
    expect(kernel.engineVersion).toBe("0.2.0");
  });

  test("getKernel() throws before init", () => {
    expect(() => getKernel()).toThrow("Call init() first");
  });

  test("getKernel() returns kernel after init", async () => {
    await init();
    const kernel = getKernel();
    expect(kernel.engine).toBe("rust");
  });

  test("init() returns cached kernel on second call", async () => {
    const k1 = await init();
    const k2 = await init();
    expect(k1).toBe(k2);
  });

  test("reset() clears cached kernel", async () => {
    await init();
    reset();
    expect(() => getKernel()).toThrow("Call init() first");
  });
});

// =========================================================================
// SCORING
// =========================================================================

describe("Score — Base (21-slot)", () => {
  let kernel: FafKernel;

  beforeAll(async () => {
    kernel = await init("rust");
  });

  test("score() returns valid ScoreResult", () => {
    const result = kernel.score(MINIMAL_FAF);
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("tier");
    expect(result).toHaveProperty("populated");
    expect(result).toHaveProperty("empty");
    expect(result).toHaveProperty("active");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("slots");
  });

  test("score is 0-100 integer", () => {
    const result = kernel.score(MINIMAL_FAF);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result.score)).toBe(true);
  });

  test("populated + empty + ignored = total", () => {
    const result = kernel.score(MINIMAL_FAF);
    expect(result.populated + result.empty + result.ignored).toBe(result.total);
  });

  test("active = total - ignored", () => {
    const result = kernel.score(MINIMAL_FAF);
    expect(result.active).toBe(result.total - result.ignored);
  });

  test("full .faf scores high", () => {
    const result = kernel.score(FULL_FAF);
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  test("tier is an emoji", () => {
    const result = kernel.score(MINIMAL_FAF);
    const validTiers = Object.values(TIERS).map(t => t.emoji);
    expect(validTiers).toContain(result.tier);
  });

  test("slots is a record of SlotState values", () => {
    const result = kernel.score(MINIMAL_FAF);
    const validStates = ["populated", "empty", "slotignored"];
    for (const state of Object.values(result.slots)) {
      expect(validStates).toContain(state);
    }
  });

  test("convenience score() function works", async () => {
    reset();
    const result = await score(MINIMAL_FAF);
    expect(result.score).toBeGreaterThan(0);
    expect(result.tier).toBeTruthy();
  });
});

describe("Score — Enterprise (33-slot)", () => {
  let kernel: FafKernel;

  beforeAll(async () => {
    kernel = await init("rust");
  });

  test("scoreEnterprise() returns 33-slot result", () => {
    const result = kernel.scoreEnterprise(MINIMAL_FAF);
    expect(result.total).toBe(33);
  });

  test("enterprise scores lower than base for same input", () => {
    const base = kernel.score(MINIMAL_FAF);
    const enterprise = kernel.scoreEnterprise(MINIMAL_FAF);
    expect(enterprise.score).toBeLessThanOrEqual(base.score);
  });
});

// =========================================================================
// VALIDATION
// =========================================================================

describe("Validation", () => {
  let kernel: FafKernel;

  beforeAll(async () => {
    kernel = await init("rust");
  });

  test("validate() accepts valid YAML", () => {
    expect(kernel.validate(MINIMAL_FAF)).toBe(true);
  });

  test("validate() rejects empty string", () => {
    expect(kernel.validate("")).toBe(false);
  });

  test("validate() rejects plain text", () => {
    expect(kernel.validate("not yaml at all")).toBe(false);
  });

  test("validate() rejects array YAML", () => {
    expect(kernel.validate("- item1\n- item2")).toBe(false);
  });
});

// =========================================================================
// COMPILE / DECOMPILE ROUNDTRIP
// =========================================================================

describe("FAFb Binary — Compile + Decompile", () => {
  let kernel: FafKernel;

  beforeAll(async () => {
    kernel = await init("rust");
  });

  test("compile() returns Uint8Array", () => {
    const bytes = kernel.compile(MINIMAL_FAF);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(32); // At least header size
  });

  test("compiled binary starts with FAFB magic", () => {
    const bytes = kernel.compile(MINIMAL_FAF);
    const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    expect(magic).toBe("FAFB");
  });

  test("compile → decompile roundtrip preserves data", () => {
    const bytes = kernel.compile(MINIMAL_FAF);
    const info = kernel.decompile(bytes);
    expect(info).toHaveProperty("version");
    expect(info).toHaveProperty("sections");
    expect(info.sections.length).toBeGreaterThan(0);
  });

  test("compile is deterministic", () => {
    const bytes1 = kernel.compile(MINIMAL_FAF);
    const bytes2 = kernel.compile(MINIMAL_FAF);
    expect(bytes1).toEqual(bytes2);
  });

  test("scoreBinary() returns binary metadata", () => {
    const bytes = kernel.compile(MINIMAL_FAF);
    const binaryScore = kernel.scoreBinary(bytes);
    expect(binaryScore).toHaveProperty("source");
    expect(binaryScore).toHaveProperty("name");
    expect(binaryScore.name).toBe("test-project");
  });

  test("binaryInfo() returns metadata without content", () => {
    const bytes = kernel.compile(MINIMAL_FAF);
    const info = kernel.binaryInfo(bytes);
    expect(info).toHaveProperty("version");
    expect(info).toHaveProperty("section_count");
    expect(info.section_count).toBeGreaterThan(0);
  });
});

// =========================================================================
// CAPABILITIES
// =========================================================================

describe("Capabilities", () => {
  test("Rust kernel has full capabilities", async () => {
    await init("rust");
    const caps = capabilities();
    expect(caps.score).toBe(true);
    expect(caps.scoreEnterprise).toBe(true);
    expect(caps.validate).toBe(true);
    expect(caps.compile).toBe(true);
    expect(caps.decompile).toBe(true);
    expect(caps.scoreBinary).toBe(true);
    expect(caps.binaryInfo).toBe(true);
  });

  test("Zig kernel — score only (v0.2.0 surface)", async () => {
    await init("zig");
    const caps = capabilities();
    expect(caps.score).toBe(true);
    expect(caps.scoreEnterprise).toBe(false);
    expect(caps.validate).toBe(false);
    expect(caps.compile).toBe(false);
    expect(caps.decompile).toBe(false);
    expect(caps.scoreBinary).toBe(false);
    expect(caps.binaryInfo).toBe(false);
  });

  test("capabilities() throws before init", () => {
    expect(() => capabilities()).toThrow("Call init() first");
  });
});

// =========================================================================
// ZIG (CASCADE) KERNEL — score parity + capability gaps
// =========================================================================

describe("Zig Cascade kernel (v0.2.0)", () => {
  let zig: FafKernel;
  let rust: FafKernel;

  test("loads and reports engine='zig', version='0.2.0'", async () => {
    zig = await init("zig");
    expect(zig.engine).toBe("zig");
    expect(zig.version()).toBe("0.2.0");
    expect(zig.engineVersion).toBe("0.2.0");
  });

  test("score(MINIMAL_FAF) returns mk4 21-base-slot score", async () => {
    reset();
    zig = await init("zig");
    const r = zig.score(MINIMAL_FAF);
    // 3 populated of 21 slots: (3*100 + 21/2)/21 = 14
    expect(r.score).toBe(14);
    expect(r.tier).toBe(TIERS.RED.emoji);
    expect(r.total).toBe(21);
  });

  test("score(FULL_FAF) returns 100 (all 21 base slots populated)", async () => {
    reset();
    zig = await init("zig");
    const r = zig.score(FULL_FAF);
    expect(r.score).toBe(100);
    expect(r.tier).toBe(TIERS.TROPHY.emoji);
  });

  test("score parity with Rust kernel — same .faf → same score", async () => {
    reset();
    rust = await init("rust");
    const rustScore = rust.score(FULL_FAF).score;
    reset();
    zig = await init("zig");
    const zigScore = zig.score(FULL_FAF).score;
    expect(zigScore).toBe(rustScore);
  });

  test("scoreEnterprise throws KernelCapabilityError", async () => {
    reset();
    zig = await init("zig");
    expect(() => zig.scoreEnterprise(MINIMAL_FAF)).toThrow(KernelCapabilityError);
  });

  test("validate(yaml) throws KernelCapabilityError (cascade validates FAFb bytes, not YAML)", async () => {
    reset();
    zig = await init("zig");
    expect(() => zig.validate(MINIMAL_FAF)).toThrow(KernelCapabilityError);
  });

  test("compile / decompile / scoreBinary / binaryInfo all throw", async () => {
    reset();
    zig = await init("zig");
    expect(() => zig.compile(MINIMAL_FAF)).toThrow(KernelCapabilityError);
    const fakeBytes = new Uint8Array([0x46, 0x41, 0x46, 0x42]); // "FAFB"
    expect(() => zig.decompile(fakeBytes)).toThrow(KernelCapabilityError);
    expect(() => zig.scoreBinary(fakeBytes)).toThrow(KernelCapabilityError);
    expect(() => zig.binaryInfo(fakeBytes)).toThrow(KernelCapabilityError);
  });
});

// =========================================================================
// TIERS
// =========================================================================

describe("Tier Constants", () => {
  test("TIERS has all 7 levels", () => {
    expect(Object.keys(TIERS)).toHaveLength(7);
  });

  test("TROPHY requires 100", () => {
    expect(TIERS.TROPHY.min).toBe(100);
    expect(TIERS.TROPHY.emoji).toBe("🏆");
  });

  test("RED starts at 0", () => {
    expect(TIERS.RED.min).toBe(0);
    expect(TIERS.RED.emoji).toBe("🔴");
  });

  test("tiers are ordered descending by min", () => {
    const mins = Object.values(TIERS).map(t => t.min);
    for (let i = 1; i < mins.length; i++) {
      expect(mins[i]).toBeLessThan(mins[i - 1]);
    }
  });
});

// =========================================================================
// KERNEL VERSION
// =========================================================================

describe("Version", () => {
  test("version() returns semver string", async () => {
    const kernel = await init("rust");
    const v = kernel.version();
    expect(v).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("engineVersion matches version()", async () => {
    const kernel = await init("rust");
    expect(kernel.engineVersion).toBe(kernel.version());
  });
});

// =========================================================================
// ERROR TYPES
// =========================================================================

describe("KernelCapabilityError", () => {
  test("has correct message format", () => {
    const err = new KernelCapabilityError("compile", "zig");
    expect(err.message).toContain("compile()");
    expect(err.message).toContain("zig");
    expect(err.name).toBe("KernelCapabilityError");
  });
});
