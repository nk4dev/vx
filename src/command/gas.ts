import { getGasFees } from '../core/data/index';
import { getFirstRpcUrl } from '../core/config';

function showHelp() {
  console.log(`\n⛽ VX Gas
Fetch current gas fee data from an RPC endpoint.\n
Usage: vx3 gas [--rpc <url>] [--path <vx.config.json>] [--help]\n
Options:
  --rpc <url>        Direct RPC URL (e.g., http://localhost:8545)
  -p, --path <path>  Path to vx.config.json with an RPC array/object
  --json             Print the raw fee data as JSON
  --help             Show this help message\n
Examples:
  vx3 gas --rpc http://localhost:8545
  vx3 gas -p ./vx.config.json\n`);
}

export async function handleGasCommand(args: string[]) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const json = args.includes('--json');

  try {
    // Parse flags
    let rpcUrl: string | undefined;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '--rpc') {
        rpcUrl = args[i + 1];
        i++;
      }
    }

    if (!rpcUrl) {
      // Fall back to the RPC configured in vx.config.json.
      rpcUrl = getFirstRpcUrl();
    }

    const fees = await getGasFees(rpcUrl);

    if (json) {
      console.log(JSON.stringify({ rpc: rpcUrl, ...fees }, null, 2));
      process.exit(0);
    }

    const toStr = (v?: string) => (v != null ? `${v} gwei` : 'n/a');

    console.log('\n⛽ Gas fees');
    console.log(`RPC: ${rpcUrl}`);
    console.log(`baseFeePerGas     : ${toStr(fees.baseFeePerGasGwei)}`);
    console.log(`maxPriorityFee    : ${toStr(fees.maxPriorityFeePerGasGwei)}`);
    console.log(`maxFeePerGas      : ${toStr(fees.maxFeePerGasGwei)}`);
    console.log(`gasPrice (legacy) : ${toStr(fees.gasPriceGwei)}`);
    console.log('');
    process.exit(0);
  } catch (err) {
    const msg = (err as Error)?.message ?? String(err);
    if (json) console.log(JSON.stringify({ error: msg }));
    else console.error(`Failed to fetch gas fees: ${msg}`);
    process.exit(1);
  }
}
