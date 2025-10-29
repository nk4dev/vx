import { init } from './pjmake';
import shellhaldler from './input';
import localServer from '../server/dev';
import { rpc } from '../core/rpc/command';
import { SDK_VERSION, API_VERSION } from '../config';
import { handleGasCommand } from './gas';
const loadversion = SDK_VERSION

const args = process.argv.slice(2);
// epcmager.main();


export default async function VX() {
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
        shellhaldler();
        return;
      case 'serve':
        localServer();
        return;
      case 'rpc':
        rpc();
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
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`XNV version: ${SDK_VERSION}`);
    process.exit(0);
  }

  const stage = "dev";

  const commandlist = [
    {
      command: 'init',
      description: 'Initialize a new project with default settings.'
    }, {
      command: 'create',
      description: 'Create a new project with the specified name.'
    }, {
      command: 'serve',
      description: 'Start a local development server.'
    }, {
      command: 'contract',
      description: 'Interact with a smart contract (browser-based example).'
    }, {
      command: 'dash',
      description: 'Build and serve the dashboard.'
    }, {
      command: 'help',
      description: 'Display this help message.'
    }, {
      command: 'info',
      description: 'Display information about the current project.'
    }, {
      command: 'gas',
      description: 'Estimate gas fees for transactions.'
    }
  ]

  console.log(`\n🚀 VX3 SDK v${SDK_VERSION} ${stage} for VX ${API_VERSION}`);
  console.log('Available commands:');
  commandlist.forEach(cmd => {
    console.log(`  ${cmd.command.padEnd(10)} - ${cmd.description}`);
  });
  console.log('\nUse "vx3 <command> --help" for more information on a specific command.\n');

  process.exit(0);
}