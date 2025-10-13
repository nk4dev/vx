<<<<<<< HEAD
import { JsonRpcProvider } from 'ethers';

export default async function gas(args: string[] = []) {
    try {
        if (args.includes('--help') || args.includes('-h')) {
            console.log('Usage: vx3 gas --rpc <RPC_URL>');
            process.exit(0);
        }

        // find --rpc value
        const rpcIndex = args.findIndex(a => a === '--rpc' || a === '-r');
        if (rpcIndex === -1 || !args[rpcIndex + 1]) {
            console.error('Error: --rpc <RPC_URL> is required.');
            process.exit(1);
        }

        const rpcUrl = args[rpcIndex + 1];

        const provider = new JsonRpcProvider(rpcUrl);

        console.log(`Connecting to RPC: ${rpcUrl}`);

        const feeData = await provider.getFeeData();

        // feeData fields: gasPrice (BigNumber | null), maxFeePerGas, maxPriorityFeePerGas
        const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = feeData as any;

        const toGwei = (bn: any) => bn ? Number(bn) / 1e9 : null;

        console.log('Gas fee data:');
        if (gasPrice) {
            console.log(`  gasPrice (wei): ${gasPrice.toString()}`);
            console.log(`  gasPrice (gwei): ${toGwei(gasPrice)}`);
        } else {
            console.log('  gasPrice: null');
        }

        if (maxFeePerGas) {
            console.log(`  maxFeePerGas (wei): ${maxFeePerGas.toString()}`);
            console.log(`  maxFeePerGas (gwei): ${toGwei(maxFeePerGas)}`);
        }

        if (maxPriorityFeePerGas) {
            console.log(`  maxPriorityFeePerGas (wei): ${maxPriorityFeePerGas.toString()}`);
            console.log(`  maxPriorityFeePerGas (gwei): ${toGwei(maxPriorityFeePerGas)}`);
        }

        process.exit(0);
    } catch (error: any) {
        console.error('Failed to fetch gas info:', error && error.message ? error.message : error);
        process.exit(1);
    }
=======
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
>>>>>>> 1f004345e7a0bec7a09572c3dbf0ea719f453837
}
