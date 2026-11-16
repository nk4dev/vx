#!/usr/bin/env node
import * as path from 'path';
import { VXCompiler } from './compiler';

export interface CliArgs {
  entry?: string;
  out: string;
  optimize: boolean;
  runs: number;
  evm?: string;
  base?: string;
  metadata: boolean;
  remappings: Record<string, string>;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    out: 'artifacts/vxc',
    optimize: false,
    runs: 200,
    metadata: false,
    remappings: {},
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' || a === '-o') {
      args.out = argv[++i];
    } else if (a === '--optimize') {
      args.optimize = true;
    } else if (a === '--runs') {
      const val = Number(argv[++i]);
      if (!isNaN(val) && val >= 0) {
        args.runs = val;
      }
    } else if (a === '--evm') {
      args.evm = argv[++i];
    } else if (a === '--base') {
      args.base = argv[++i];
    } else if (a === '--metadata') {
      args.metadata = true;
    } else if (a === '--remap') {
      const raw = argv[++i] ?? '';
      const eqIdx = raw.indexOf('=');
      if (eqIdx !== -1) {
        const k = raw.slice(0, eqIdx);
        const v = raw.slice(eqIdx + 1);
        args.remappings[k] = v;
      }
    } else if (a.startsWith('--remap=')) {
      const raw = a.slice('--remap='.length);
      const eqIdx = raw.indexOf('=');
      if (eqIdx !== -1) {
        const k = raw.slice(0, eqIdx);
        const v = raw.slice(eqIdx + 1);
        args.remappings[k] = v;
      }
    } else if (!a.startsWith('-') && !args.entry) {
      args.entry = a;
    }
  }

  return args;
}

export function printHelp(): void {
  console.log(`vxc — VX3 custom Solidity compiler

Usage:
  vxc <entry.sol> [options]

Options:
  -o, --out <dir>      Output directory for artifacts (default: artifacts/vxc)
      --optimize       Enable the optimizer (default: off)
      --runs <n>       Optimizer runs (default: 200)
      --evm <version>  Target EVM version (e.g. cancun)
      --base <dir>     Base path for import resolution (default: cwd)
      --metadata       Emit Solidity metadata in artifacts (default: off)
      --remap k=v      Add an import remapping (repeatable)
  -h, --help           Show help
`);
}

export function runCli(argv: string[] = process.argv.slice(2)): number {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    return 0;
  }

  const args = parseArgs(argv);
  if (!args.entry) {
    console.error('vxc: missing entry file');
    return 1;
  }

  const compiler = new VXCompiler();
  try {
    const result = compiler.compile({
      entry: args.entry,
      basePath: args.base ? path.resolve(args.base) : process.cwd(),
      outDir: args.out,
      optimizer: { enabled: args.optimize, runs: args.runs },
      evmVersion: args.evm,
      remappings: args.remappings,
      metadata: args.metadata,
    });

    let hasError = false;
    for (const e of result.errors) {
      if (e.severity === 'error') {
        hasError = true;
        console.error(`[error] ${e.message}`);
      } else {
        console.warn(`[${e.severity}] ${e.message}`);
      }
    }

    if (hasError) {
      return 1;
    }

    console.log(
      `vxc: compiled ${result.artifacts.length} contract(s) from ${result.sources.length} source(s) → ${args.out}`
    );
    return 0;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[error] ${msg}`);
    return 1;
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  const code = runCli();
  if (code !== 0) {
    process.exit(code);
  }
}
