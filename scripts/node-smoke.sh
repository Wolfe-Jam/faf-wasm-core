#!/usr/bin/env bash
# Packs the package, installs the tarball in an empty folder and imports it in
# Node, scoring with both kernels: what a user's `npm install` gets.
# 1.2.0 and 1.2.1 shipped index.ts as main, which Node can't load from
# node_modules; this check keeps that from coming back.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
cd "$ROOT"
npm run --silent build
npm pack --silent --pack-destination "$WORK" >/dev/null
cd "$WORK"
npm init -y >/dev/null
npm install --silent ./faf-wasm-core-*.tgz
node --input-type=module -e "
import { init, score, reset } from 'faf-wasm-core';
const yaml = 'project:\n  name: smoke\n  goal: test\n';
const got = {};
for (const k of ['rust', 'zig']) { reset(); await init(k); got[k] = (await score(yaml)).score; }
console.log('node', process.version, JSON.stringify(got));
if (typeof got.rust !== 'number' || got.rust !== got.zig) { console.error('kernels disagree or no score'); process.exit(1); }
" 2>&1 | tee "$WORK/out.txt"
if grep -q 'deprecated parameters' "$WORK/out.txt"; then echo 'wasm-bindgen init warning is back'; exit 1; fi
