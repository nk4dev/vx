import { Command } from 'commander';
import { SDK_VERSION, API_VERSION, NAME } from '../config';
import shellHandler from './input';
import localServer from '../server/dev';
import { rpc } from '../core/rpc/command';
import { handleGasCommand } from './gas';
import { init } from './pjmake';
import { setup } from './setup';
import { handlePayCommand } from './pay';
import { handleIpfsCommand } from './ipfs';
import { handleGenerateCommand } from './generate';
import { handleCompileCommand } from './compile';
import { handleDashCommand } from './dash';
import { handleNftCommand } from './nft';

type RawHandler = (args: string[]) => unknown;

/**
 * Register a "pass-through" subcommand: commander owns the name / description /
 * help listing, but every token after the subcommand is forwarded verbatim to
 * the existing handler, which does its own flag parsing.
 */
function passThrough(
  program: Command,
  name: string,
  description: string,
  handler: RawHandler
): void {
  program
    .command(name)
    .description(description)
    .helpOption(false)
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .argument('[args...]')
    .action(async (args: string[] = []) => {
      await handler(args);
    });
}

export function buildProgram(): Command {
  const program = new Command();

  program
    .name('vx3')
    .description(`${NAME} SDK — Web3 developer toolkit (platform API v${API_VERSION})`)
    .version(SDK_VERSION, '-v, --version', 'Show SDK version')
    .enablePositionalOptions()
    .showHelpAfterError('(run "vx3 help" for usage)')
    .configureHelp({ sortSubcommands: false });

  program
    .command('init')
    .description('Initialize a new project in the current directory')
    .argument('[name]', 'project directory name')
    .action((name?: string) => init(name));

  program
    .command('create')
    .description('Scaffold a new project (interactive when name is omitted)')
    .argument('[name]', 'project directory name')
    .action((name?: string) => {
      if (name) init(name);
      else shellHandler();
    });

  program
    .command('api')
    .description('Start the local helper API server (proxies block/gas/pay to your RPC)')
    .helpOption(false)
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .action(() => {
      localServer();
    });

  // Backwards-compatible alias for `api`.
  program
    .command('node', { hidden: true })
    .helpOption(false)
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .action(() => {
      localServer();
    });

  program
    .command('rpc')
    .description('Manage RPC endpoints in vx.config.json (subcommands: init, list)')
    .helpOption(false)
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .argument('[args...]')
    .action(() => rpc());

  program
    .command('setup')
    .description('Add Hardhat or a React frontend to the current project')
    .argument('<target>', 'hardhat | react')
    .action(async (target: string) => {
      if (target !== 'hardhat' && target !== 'react') {
        console.error('Unknown setup target. Available: hardhat, react');
        process.exitCode = 1;
        return;
      }
      await setup(target);
    });

  passThrough(program, 'pay', 'Send a transaction: vx3 pay <to> <amount> [--rpc <url>]', handlePayCommand);
  passThrough(program, 'gas', 'Estimate current gas fees for the configured RPC', handleGasCommand);
  passThrough(program, 'ipfs', 'Pin / fetch content via IPFS', handleIpfsCommand);
  passThrough(program, 'generate', 'Generate a framework template (react, vue)', handleGenerateCommand);
  passThrough(program, 'compile', 'Compile Solidity with the VXC custom compiler', handleCompileCommand);
  passThrough(program, 'nft', 'NFT operations: vx3 nft mint <contract> [...]', handleNftCommand);
  passThrough(program, 'dash', 'Open the real-time developer dashboard', handleDashCommand);

  program
    .command('sol')
    .description('Solidity helper samples')
    .argument('[sub]', 'e.g. "hello"')
    .action((sub?: string) => {
      if (sub === 'hello') {
        console.log('hello world');
        return;
      }
      console.error('Unknown sol subcommand');
      process.exitCode = 1;
    });

  program
    .command('info')
    .description('Show the remote VX platform version')
    .action(async () => {
      console.log('Checking project...');
      try {
        const res = await fetch('https://api.varius.technology/version', {
          signal: AbortSignal.timeout(5000),
        });
        const json = (await res.json()) as { version?: string };
        console.log('Info: version', json.version);
      } catch (err) {
        console.error(
          `Could not reach api.varius.technology: ${(err as Error).message}`
        );
        process.exitCode = 1;
      }
    });

  return program;
}

export default async function main(argv?: string[]): Promise<void> {
  const program = buildProgram();

  // With no arguments, show help instead of doing nothing.
  const effectiveArgv = argv ?? process.argv;
  if (effectiveArgv.length <= 2) {
    program.outputHelp();
    return;
  }

  try {
    await program.parseAsync(effectiveArgv);
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}

export { main };
