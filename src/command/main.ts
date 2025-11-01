import { init } from './pjmake';
import shellhaldler from './input';
import localServer from '../server/dev';
import { rpc } from '../core/rpc/command';
import gas from './gas';
import { SDK_VERSION } from '../config';

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
        // pass the rest of the args (including --rpc) to the gas handler
        await gas(args.slice(1));
        return;
      case '--version':
        console.log(`VX CLI version: ${loadversion}`);
        process.exit(0);
        break;
      case '-v':
        console.log(`VX CLI version: ${loadversion}`);
        process.exit(0);
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
    console.log(`VX CLI version: ${SDK_VERSION}`);
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
    }
  ]

  console.log(`\n🚀 VX CLI v${SDK_VERSION} ${stage}`);
  console.log('Available commands:');
  commandlist.forEach(cmd => {
    console.log(`  ${cmd.command.padEnd(10)} - ${cmd.description}`);
  });
  console.log('\nUse "vx <command> --help" for more information on a specific command.\n');

  process.exit(0);
}
