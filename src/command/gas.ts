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
}
