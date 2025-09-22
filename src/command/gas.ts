import { getGasFees } from "../core/data/index";
import { load_rpc_config } from "../core/rpc/connect";

function showHelp() {
  console.log(`\n⛽ VX Gas
Fetch current gas fee data from an RPC endpoint.\n
Usage: vx3 gas [--rpc <url>] [--path <vx.config.json>] [--help]\n
Options:
  --rpc <url>        Direct RPC URL (e.g., http://localhost:8545)
  -p, --path <path>  Path to vx.config.json with an RPC array/object
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
      // Try loading from vx.config.json (may be array or single object)
      const loaded = load_rpc_config();
      const first = Array.isArray(loaded) ? loaded[0] : loaded;
      if (!first || !first.protocol || !first.host || !first.port) {
        throw new Error('Invalid vx.config.json: expected fields protocol, host, port');
      }
      rpcUrl = `${first.protocol}://${first.host}:${first.port}`;
    }

    const fees = await getGasFees(rpcUrl);

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
    console.error(`Failed to fetch gas fees: ${msg}`);
    process.exit(1);
  }
}
