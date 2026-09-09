import { exit } from 'node:process';
import { rpc_create_config } from './config';
import { view_rpc_config } from './connect';

export function rpc() {
  const subcommand = process.argv[3];
  switch (subcommand) {
    case 'init':
      try {
        const written = rpc_create_config();
        console.log(`Created ${written}`);
        exit(0);
      } catch (err) {
        console.error(
          `Failed to create vx.config.json: ${(err as Error).message}`
        );
        exit(1);
      }
      break;
    case 'list':
      try {
        console.log(`RPC : ${view_rpc_config()}`);
        exit(0);
      } catch (err) {
        console.error((err as Error).message);
        exit(1);
      }
      break;
    case '-h':
    case '--help':
      help();
      break;
    case undefined:
      console.error('No subcommand provided for rpc. Use "init" or "list".');
      exit(1);
      break;
    default:
      console.error(`Unknown RPC command: ${subcommand}`);
      exit(1);
  }
}

function help() {
  console.log('Usage: vx3 rpc <command>');
  console.log('Commands:');
  console.log('  init    Create a starter vx.config.json');
  console.log('  list    Show the configured RPC URL');
  exit(0);
}
