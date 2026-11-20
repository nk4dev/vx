import * as path from 'path';
import { VXCompiler, parseArgs, type CliArgs } from '@vx3/solc-compiler';

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
      --via-ir         Compile via Yul IR pipeline
      --metadata       Emit Solidity metadata
  -I, --include <dir>  Add an import search path (repeatable)
      --remap k=v      Add an import remapping (repeatable)
`);
    return;
  }

  let args: CliArgs;
  try {
    args = parseArgs(argv);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`vx3 compile: ${msg}`);
    process.exit(1);
  }

  if (!args.entry) {
    console.error('vx3 compile: missing entry .sol file');
    process.exit(1);
  }

  const compiler = new VXCompiler();
  const result = compiler.compile({
    entry: args.entry,
    basePath: args.base ? path.resolve(args.base) : process.cwd(),
    outDir: args.out,
    optimizer: { enabled: args.optimize, runs: args.runs },
    evmVersion: args.evm,
    viaIR: args.viaIR,
    remappings: args.remappings,
    includePaths: args.includePaths,
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
