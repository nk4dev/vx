import { exit } from 'node:process';
import { rpc_create_config } from './config';
import { load_rpc_config, view_rpc_config } from './connect';

export function rpc() {
  const subcommand = process.argv[3];
  switch (subcommand) {
    case 'init':
      rpc_create_config();
      break;
    case 'list':
      view_rpc_config();
      break;
    case '-h':
      help();
      break;
    case '--help':
      help();
      break;
    case undefined:
      console.error('No subcommand provided for rpc. Use "init" or "list".');
      exit(1);
    default:
      console.error(`Unknown RPC command: ${subcommand}`);
  }
}

function help() {
  console.log('Usage: vx3 rpc <command>');
  console.log('Commands:');
  console.log('  init    Initialize RPC configuration');
  console.log('  list    List RPC configurations');
  exit(1);
}
