#!/usr/bin/env node
import * as path from 'path';
import { VXCompiler } from './compiler';

interface CliArgs {
  entry?: string;
  out: string;
  optimize: boolean;
  runs: number;
  evm?: string;
  base?: string;
  metadata: boolean;
  remappings: Record<string, string>;
}

function parse(argv: string[]): CliArgs {
  const args: CliArgs = {
    out: 'artifacts/vxc',
    optimize: false,
    runs: 200,
    metadata: false,
    remappings: {},
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' || a === '-o') args.out = argv[++i];
    else if (a === '--optimize') args.optimize = true;
    else if (a === '--runs') args.runs = Number(argv[++i]);
    else if (a === '--evm') args.evm = argv[++i];
    else if (a === '--base') args.base = argv[++i];
    else if (a === '--metadata') args.metadata = true;
    else if (a === '--remap') {
      const [k, v] = argv[++i].split('=');
      args.remappings[k] = v;
    } else if (!args.entry) args.entry = a;
  }
  return args;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(`vxc — VX3 custom Solidity compiler

Usage:
  vxc <entry.sol> [options]

Options:
  -o, --out <dir>      Output directory for artifacts (default: artifacts/vxc)
      --optimize       Enable optimizer
      --runs <n>       Optimizer runs (default: 200)
      --evm <version>  Target EVM version
      --base <dir>     Base path for resolution (default: cwd)
      --metadata       Emit Solidity metadata in artifacts
      --remap k=v      Add an import remapping (repeatable)
`);
    process.exit(0);
  }
  const args = parse(argv);
  if (!args.entry) {
    console.error('vxc: missing entry file');
    process.exit(1);
  }

  const compiler = new VXCompiler();
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
    if (e.severity === 'error') hasError = true;
    const stream = e.severity === 'error' ? console.error : console.warn;
    stream(`[${e.severity}] ${e.message}`);
  }
  if (hasError) process.exit(1);

  console.log(`vxc: compiled ${result.artifacts.length} contract(s) from ${result.sources.length} source(s) → ${args.out}`);
}

main();
