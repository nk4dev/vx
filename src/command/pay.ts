import { getRpcUrl } from '../core/contract';
import { sendPayment } from '../payment/index';

function parseArgs(args: string[]) {
  const out: {
    to?: string;
    amount?: string;
    rpc?: string;
    key?: string;
    json: boolean;
    error?: string;
  } = { json: args.includes('--json') };
  if (args.length >= 1 && !args[0].startsWith('-')) out.to = args[0];
  if (args.length >= 2 && !args[1].startsWith('-')) out.amount = args[1];

  for (let i = 2; i < args.length; i++) {
    const a = args[i];
    const isRpc = a === '--rpc' || a === '-r';
    const isKey = a === '--key' || a === '-k';
    if (!isRpc && !isKey) continue;
    // Never fall back silently: a forgotten value must not send the payment
    // through whatever RPC / key happens to be configured.
    const value = args[i + 1];
    if (!value || value.startsWith('-')) {
      out.error = `Missing value for ${a}`;
      break;
    }
    if (isRpc) out.rpc = value;
    else out.key = value;
    i++;
  }
  return out;
}

export async function handlePayCommand(argv: string[]) {
  const {
    to,
    amount,
    rpc: rpcFlag,
    key: keyFlag,
    json,
    error: argError,
  } = parseArgs(argv);

  const fail = (message: string): never => {
    if (json) console.log(JSON.stringify({ error: message }));
    else console.error(message);
    process.exit(1);
  };

  if (argError) fail(argError);
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
