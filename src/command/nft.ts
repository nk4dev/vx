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
  } = {};

  if (args.length >= 1 && !args[0].startsWith('-')) {
    out.contractAddress = args[0];
  }

  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    const next = args[i + 1];
    if ((a === '--to') && next) { out.to = next; i++; }
    else if ((a === '--id') && next) { out.tokenId = next; i++; }
    else if ((a === '--uri') && next) { out.tokenURI = next; i++; }
    else if ((a === '--fn') && next) { out.functionName = next; i++; }
    else if ((a === '--rpc' || a === '-r') && next) { out.rpc = next; i++; }
    else if ((a === '--key' || a === '-k') && next) { out.key = next; i++; }
  }
  return out;
}

export async function handleNftCommand(argv: string[]) {
  const sub = argv[0];

  if (sub === 'mint') {
    const parsed = parseArgs(argv.slice(1));

    if (!parsed.contractAddress) {
      console.error(
        'Usage: vx nft mint <contractAddress> [--to <address>] [--id <tokenId>] [--uri <tokenURI>] [--fn <functionName>] [--rpc <url>] [--key <privateKey>]'
      );
      process.exit(1);
    }

    const rpcUrl =
      parsed.rpc ?? (typeof getRpcUrl === 'function' ? getRpcUrl() : undefined);
    if (!rpcUrl) {
      console.error(
        'RPC URL not provided and no vx.config.json found. Use --rpc <url> or create vx.config.json.'
      );
      process.exit(1);
    }

    const privateKey = parsed.key ?? process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error(
        'Private key not provided. Set PRIVATE_KEY env var or use --key <privateKey>.'
      );
      process.exit(1);
    }

    console.log(`Minting NFT on contract ${parsed.contractAddress} via ${rpcUrl}`);

    try {
      const res = await mintNFT({
        rpcUrl,
        privateKey,
        contractAddress: parsed.contractAddress,
        to: parsed.to,
        tokenId: parsed.tokenId !== undefined ? BigInt(parsed.tokenId) : undefined,
        tokenURI: parsed.tokenURI,
        functionName: parsed.functionName,
      });

      console.log('NFT minted. Transaction hash:', res.txHash);
      if (res.receipt) {
        const r = res.receipt as any;
        console.log('Confirmed in block', r.blockNumber);
      }
      process.exit(0);
    } catch (err) {
      console.error('Mint failed:', (err as Error).message);
      process.exit(1);
    }
  } else {
    console.error('Usage: vx nft mint <contractAddress> [options]');
    process.exit(1);
  }
}
