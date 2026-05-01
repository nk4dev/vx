import * as path from 'path';

interface ParsedArgs {
  entry?: string;
  out: string;
  optimize: boolean;
  runs: number;
  evm?: string;
  base?: string;
  metadata: boolean;
  remappings: Record<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
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

export async function handleCompileCommand(argv: string[]): Promise<void> {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(`vx3 compile — invoke the VXC custom Solidity compiler

Usage:
  vx3 compile <entry.sol> [options]

Options:
  -o, --out <dir>      Output directory (default: artifacts/vxc)
      --optimize       Enable optimizer
      --runs <n>       Optimizer runs (default: 200)
      --evm <version>  Target EVM version
      --base <dir>     Base path for import resolution
      --metadata       Emit Solidity metadata
      --remap k=v      Add an import remapping (repeatable)
`);
    return;
  }

  const args = parseArgs(argv);
  if (!args.entry) {
    console.error('vx3 compile: missing entry .sol file');
    process.exit(1);
  }

  let VXCompiler: typeof import('../../packages/vxc/src/compiler').VXCompiler;
  try {
    // Prefer the built package; fall back to the workspace source.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ VXCompiler } = require('@vx3/vxc'));
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ VXCompiler } = require('../../packages/vxc/src/compiler'));
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

  console.log(
    `✅ vxc: compiled ${result.artifacts.length} contract(s) from ${result.sources.length} source(s) → ${args.out}`
  );
}
