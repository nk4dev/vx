import { getRpcUrl } from '../core/contract';
import { sendPayment } from '../payment/index';

function parseArgs(args: string[]) {
  const out: {
    to?: string;
    amount?: string;
    rpc?: string;
    key?: string;
    json: boolean;
  } = { json: args.includes('--json') };
  if (args.length >= 1 && !args[0].startsWith('-')) out.to = args[0];
  if (args.length >= 2 && !args[1].startsWith('-')) out.amount = args[1];

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
  const { to, amount, rpc: rpcFlag, key: keyFlag, json } = parseArgs(argv);

  const fail = (message: string): never => {
    if (json) console.log(JSON.stringify({ error: message }));
    else console.error(message);
    process.exit(1);
  };

  if (!to || !amount) {
    fail('Usage: vx3 pay <to> <amount> [--rpc <url>] [--key <privateKey>] [--json]');
  }

  let rpcUrl = rpcFlag;
  if (!rpcUrl) {
    try {
      rpcUrl = getRpcUrl();
    } catch (err) {
      fail(`${(err as Error).message} Or pass --rpc <url>.`);
    }
  }

  if (keyFlag && !json) {
    console.error(
      'Warning: --key exposes your private key in shell history and process listings. Prefer the PRIVATE_KEY environment variable.'
    );
  }
  const privateKey = keyFlag || process.env.PRIVATE_KEY;
  if (!privateKey) {
    fail(
      'Private key not provided. Set PRIVATE_KEY environment variable or use --key <privateKey>'
    );
  }

  if (!json) console.log(`Sending ${amount} ETH to ${to} via ${rpcUrl}`);

  try {
    const res = await sendPayment({
      rpcUrl: rpcUrl as string,
      privateKey: privateKey as string,
      to: to as string,
      amountEth: amount as string,
    });
    if (json) {
      console.log(
        JSON.stringify({
          txHash: res.txHash,
          blockNumber: res.receipt?.blockNumber ?? null,
        })
      );
    } else {
      console.log('Transaction submitted. Hash:', res.txHash);
      if (res.receipt) {
        console.log('Transaction confirmed in block', res.receipt.blockNumber);
      }
    }
    process.exit(0);
  } catch (err) {
    fail(`Payment failed: ${(err as Error).message}`);
  }
}
