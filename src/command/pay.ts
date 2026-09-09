import { getRpcUrl } from '../core/contract';
import { sendPayment } from '../payment/index';

function parseArgs(args: string[]) {
  const out: { to?: string; amount?: string; rpc?: string; key?: string } = {};
  if (args.length >= 1) out.to = args[0];
  if (args.length >= 2) out.amount = args[1];

  for (let i = 2; i < args.length; i++) {
    const a = args[i];
    if ((a === '--rpc' || a === '-r') && args[i + 1]) {
      out.rpc = args[i + 1];
      i++;
    } else if ((a === '--key' || a === '-k') && args[i + 1]) {
      out.key = args[i + 1];
      i++;
    }
  }
  return out;
}

export async function handlePayCommand(argv: string[]) {
  const { to, amount, rpc: rpcFlag, key: keyFlag } = parseArgs(argv);

  if (!to || !amount) {
    console.error(
      'Usage: vx3 pay <to> <amount> [--rpc <url>] [--key <privateKey>]'
    );
    process.exit(1);
  }

  let rpcUrl = rpcFlag;
  if (!rpcUrl) {
    try {
      rpcUrl = getRpcUrl();
    } catch (err) {
      console.error(
        `${(err as Error).message} Or pass --rpc <url>.`
      );
      process.exit(1);
    }
  }

  if (keyFlag) {
    console.error(
      'Warning: --key exposes your private key in shell history and process listings. Prefer the PRIVATE_KEY environment variable.'
    );
  }
  const privateKey = keyFlag || process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error(
      'Private key not provided. Set PRIVATE_KEY environment variable or use --key <privateKey>'
    );
    process.exit(1);
  }

  console.log(`Sending ${amount} ETH to ${to} via ${rpcUrl}`);

  try {
    const res = await sendPayment({
      rpcUrl,
      privateKey,
      to,
      amountEth: amount,
    });
    console.log('Transaction submitted. Hash:', res.txHash);
    if (res.receipt) {
      console.log('Transaction confirmed in block', res.receipt.blockNumber);
      console.log(JSON.stringify(res.receipt, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error('Payment failed:', (err as Error).message);
    process.exit(1);
  }
}
