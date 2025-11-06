import shellHandler from './input';
import localServer from '../server/dev';
import { rpc } from '../core/rpc/command';
import { SDK_VERSION, API_VERSION } from '../config';
import { handleGasCommand } from './gas';
import { init } from './pjmake';
// Use require to avoid TS resolution issues in some environments
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setup } = require('./setup');
import { handlePayCommand } from './pay';
import { handleIpfsCommand } from './ipfs';
const loadversion = SDK_VERSION

export default async function VX() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    help();
  }
  try {
    switch (args[0]) {
      case 'init':
        init();
        break;
      case 'help':
        help();
        break;
      case 'create':
        // If a name argument is provided, create non-interactively; otherwise prompt
        if (args[1]) {
          init(args[1]);
        } else {
          shellHandler();
        }
        return;
      case 'serve':
        localServer();
        return;
      case 'rpc':
        rpc();
        return;
      case 'ipfs':
        await handleIpfsCommand(args.slice(1));
        return;
      case 'setup':
        if (args[1] === 'hardhat') {
          await setup('hardhat');
          return;
        }
        console.error('Unknown setup target. Try: vx3 setup hardhat');
        return;
      case 'pay':
        // vx3 pay <to> <amount> [--rpc <url>] [--key <privateKey>]
        await handlePayCommand(args.slice(1));
        return;
      case 'gas':
        await handleGasCommand(args.slice(1));
        return;

      case 'sol':
        if (args[1] === 'hello') {
          console.log('hello world');
          process.exit(0);
        } else {
          console.error('Unknown sol subcommand');
          process.exit(1);
        }
        return;
      case '--version':
        console.log(`XNV version: ${loadversion}`);
        process.exit(0);
      case '-v':
        console.log(`XNV version: ${loadversion}`);
        process.exit(0);
      case 'info':
        console.log('Checking project...');
        const data = await fetch('https://api.varius.technology/version');
        const result = await data.json();
        console.log('Info: version', result.version);
        break;
      case 'dash':
        console.log('🚀🚀🚀🚀\n');
        console.log('build dashboard now. stay tuned!');
        break;
      default:
        console.error(`😑 < Unknown command: ${args[0]}`);
        help();
    }

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

function help() {
  const args = process.argv.slice(2);
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`XNV version: ${SDK_VERSION}`);
    process.exit(0);
  }

  const stage = "dev";

  const commandlist = [
    { command: 'init', description: 'Initialize a new project with default settings.' },
    { command: 'create', description: 'Create a new project with the specified name.' },
    { command: 'serve', description: 'Start a local development server.' },
    { command: 'setup', description: 'Project setup helpers (e.g., hardhat).' },
    { command: 'rpc', description: 'Manage or query RPC endpoints.' },
    { command: 'pay', description: 'Send a payment/transaction.' },
    { command: 'gas', description: 'Estimate gas fees for transactions.' },
    { command: 'sol', description: 'Solidity helper commands (examples).' },
    { command: 'dash', description: 'Build and serve the dashboard.' },
    { command: 'info', description: 'Display information about the current project.' },
    { command: 'help', description: 'Display this help message.' },
    { command: '--version / -v', description: 'Show SDK version.' }
  ]

  console.log(`\n🚀 VX3 SDK v${SDK_VERSION} ${stage} for VX ${API_VERSION}`);
  console.log('Available commands:');
  commandlist.forEach(cmd => {
    console.log(`  ${cmd.command.padEnd(10)} - ${cmd.description}`);
  });
  console.log('\nUse "vx3 <command> --help" for more information on a specific command.\n');

  process.exit(0);
}