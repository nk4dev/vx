import { getRpcUrl } from '../core/contract';
import { mintNFT } from '../nft/index';

function parseArgs(args: string[]) {
  const out: {
    contractAddress?: string;
    to?: string;
    tokenId?: string;
    tokenURI?: string;
    functionName?: string;
    rpc?: string;
    key?: string;
    json: boolean;
  } = { json: args.includes('--json') };

  if (args.length >= 1 && !args[0].startsWith('-')) {
    out.contractAddress = args[0];
  }

  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    const next = args[i + 1];
    if (a === '--to' && next) { out.to = next; i++; }
    else if (a === '--id' && next) { out.tokenId = next; i++; }
    else if (a === '--uri' && next) { out.tokenURI = next; i++; }
    else if (a === '--fn' && next) { out.functionName = next; i++; }
    else if ((a === '--rpc' || a === '-r') && next) { out.rpc = next; i++; }
    else if ((a === '--key' || a === '-k') && next) { out.key = next; i++; }
  }
  return out;
}

export async function handleNftCommand(argv: string[]) {
  const sub = argv[0];
  const parsed = parseArgs(argv.slice(1));
  const { json } = parsed;

  const fail = (message: string): never => {
    if (json) console.log(JSON.stringify({ error: message }));
    else console.error(message);
    process.exit(1);
  };

  if (sub !== 'mint') {
    fail('Usage: vx3 nft mint <contractAddress> [options]');
  }

  if (!parsed.contractAddress) {
    fail(
      'Usage: vx3 nft mint <contractAddress> [--to <address>] [--id <tokenId>] [--uri <tokenURI>] [--fn <functionName>] [--rpc <url>] [--key <privateKey>] [--json]'
    );
  }

  let rpcUrl = parsed.rpc;
  if (!rpcUrl) {
    try {
      rpcUrl = getRpcUrl();
    } catch (err) {
      fail(`${(err as Error).message} Or pass --rpc <url>.`);
    }
  }

  if (parsed.key && !json) {
    console.error(
      'Warning: --key exposes your private key in shell history and process listings. Prefer the PRIVATE_KEY environment variable.'
    );
  }
  const privateKey = parsed.key ?? process.env.PRIVATE_KEY;
  if (!privateKey) {
    fail(
      'Private key not provided. Set PRIVATE_KEY env var or use --key <privateKey>.'
    );
  }

  if (!json) {
    console.log(
      `Minting NFT on contract ${parsed.contractAddress} via ${rpcUrl}`
    );
  }

  try {
    const res = await mintNFT({
      rpcUrl: rpcUrl as string,
      privateKey: privateKey as string,
      contractAddress: parsed.contractAddress as string,
      to: parsed.to,
      tokenId:
        parsed.tokenId !== undefined ? BigInt(parsed.tokenId) : undefined,
      tokenURI: parsed.tokenURI,
      functionName: parsed.functionName,
    });

    if (json) {
      console.log(
        JSON.stringify({
          txHash: res.txHash,
          blockNumber: res.receipt?.blockNumber ?? null,
        })
      );
    } else {
      console.log('NFT minted. Transaction hash:', res.txHash);
      if (res.receipt) {
        console.log('Confirmed in block', res.receipt.blockNumber);
      }
    }
    process.exit(0);
  } catch (err) {
    fail(`Mint failed: ${(err as Error).message}`);
  }
}
