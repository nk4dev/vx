import { quickMint, NFT_STORE_FILENAME } from '../nft/index';
import { KEY_FLAG_WARNING } from '../libs/env';
import type { NFTMetadata } from '../types/nft';

const USAGE = `vx3 mint nft — mint an NFT in one step

Usage:
  vx3 mint nft [contractAddress] [options]

With no arguments this mints the next token of this project's collection to
your own address. The collection is deployed on first use (local dev chains,
or anywhere with --deploy) and remembered in ${NFT_STORE_FILENAME}.

Options:
      --to <address>          Recipient (default: the signer)
      --uri <tokenURI>        Metadata URI (ipfs://..., https://...)
      --name <text>           Metadata name        } inlined into a data: URI
      --description <text>    Metadata description } when --uri is not given
      --image <url>           Metadata image URL   }
      --id <tokenId>          Token ID, for mint(address,uint256) contracts
      --fn <functionName>     Mint function to call on a custom contract
      --deploy                Deploy a new collection before minting
      --collection-name <s>   Name for a newly deployed collection
      --collection-symbol <s> Symbol for a newly deployed collection
  -r, --rpc <url>             RPC URL (default: vx.config.json, then localhost:8545)
  -k, --key <privateKey>      Signing key (prefer PRIVATE_KEY in the environment or .env;
                              a local dev node's first account is used when unset)
      --json                  Machine-readable output
  -h, --help                  Show this help

"vx3 nft mint" is the same command.`;

const VALUE_FLAGS: Record<string, string> = {
  '--to': 'to',
  '--id': 'tokenId',
  '--uri': 'tokenURI',
  '--name': 'name',
  '--description': 'description',
  '--image': 'image',
  '--fn': 'functionName',
  '--collection-name': 'collectionName',
  '--collection-symbol': 'collectionSymbol',
  '--rpc': 'rpc',
  '-r': 'rpc',
  '--key': 'key',
  '-k': 'key',
};

interface ParsedArgs {
  contractAddress?: string;
  values: Record<string, string>;
  deploy: boolean;
  json: boolean;
  help: boolean;
  error?: string;
}

function parseArgs(args: string[]): ParsedArgs {
  const out: ParsedArgs = {
    values: {},
    deploy: false,
    json: args.includes('--json'),
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--json') continue;
    if (a === '--deploy') out.deploy = true;
    else if (a === '--help' || a === '-h') out.help = true;
    else if (a in VALUE_FLAGS) {
      const next = args[i + 1];
      // Never fall back silently: a forgotten value must not mint through
      // whatever RPC / key / recipient happens to be the default.
      if (next === undefined || next.startsWith('-')) {
        out.error = `Missing value for ${a}`;
        break;
      }
      out.values[VALUE_FLAGS[a]] = next;
      i++;
    } else if (a.startsWith('-')) {
      out.error = `Unknown option ${a}`;
      break;
    } else if (out.contractAddress === undefined) {
      out.contractAddress = a;
    } else {
      out.error = `Unexpected argument ${a}`;
      break;
    }
  }
  return out;
}

function shorten(value: string, max = 72): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** `vx3 mint <kind> ...` — today the only kind is `nft`. */
export async function handleMintCommand(argv: string[]) {
  if (argv[0] !== 'nft') {
    const json = argv.includes('--json');
    const help = argv.length === 0 || argv[0] === '--help' || argv[0] === '-h';
    if (help && !json) {
      console.log(USAGE);
      return;
    }
    const message = 'Usage: vx3 mint nft [contractAddress] [options]';
    if (json) console.log(JSON.stringify({ error: message }));
    else console.error(message);
    process.exit(1);
  }
  await handleNftCommand(['mint', ...argv.slice(1)]);
}

export async function handleNftCommand(argv: string[]) {
  const sub = argv[0];
  const parsed = parseArgs(argv.slice(1));
  const { json, values } = parsed;

  const fail = (message: string): never => {
    if (json) console.log(JSON.stringify({ error: message }));
    else console.error(message);
    process.exit(1);
  };

  if (sub !== 'mint') {
    fail('Usage: vx3 nft mint [contractAddress] [options]');
  }
  if (parsed.help) {
    console.log(USAGE);
    return;
  }
  if (parsed.error) fail(`${parsed.error} (see "vx3 mint nft --help")`);

  let tokenId: bigint | undefined;
  if (values.tokenId !== undefined) {
    try {
      tokenId = BigInt(values.tokenId);
    } catch {
      fail(`Invalid --id ${values.tokenId}: expected an integer`);
    }
  }

  const metadata: NFTMetadata = {};
  if (values.name !== undefined) metadata.name = values.name;
  if (values.description !== undefined) metadata.description = values.description;
  if (values.image !== undefined) metadata.image = values.image;
  const hasMetadata = Object.keys(metadata).length > 0;
  if (hasMetadata && values.tokenURI !== undefined) {
    fail('Use either --uri or --name/--description/--image, not both.');
  }
  if (parsed.deploy && parsed.contractAddress) {
    fail('Use either a contract address or --deploy, not both.');
  }

  if (values.key && !json) {
    console.error(KEY_FLAG_WARNING);
  }

  try {
    const res = await quickMint({
      contractAddress: parsed.contractAddress,
      to: values.to,
      tokenId,
      tokenURI: values.tokenURI,
      metadata: hasMetadata ? metadata : undefined,
      functionName: values.functionName,
      rpcUrl: values.rpc,
      privateKey: values.key,
      deploy: parsed.deploy,
      collectionName: values.collectionName,
      collectionSymbol: values.collectionSymbol,
    });
    const blockNumber = res.receipt?.blockNumber ?? null;

    if (json) {
      console.log(
        JSON.stringify({
          txHash: res.txHash,
          blockNumber,
          tokenId: res.tokenId ?? null,
          contractAddress: res.contractAddress,
          to: res.to,
          tokenURI: res.tokenURI ?? null,
          chainId: res.chainId,
          rpcUrl: res.rpcUrl,
          deployed: res.deployed ?? null,
        })
      );
    } else {
      if (res.deployed) {
        console.log(
          `Deployed collection "${res.deployed.name}" (${res.deployed.symbol}) at ${res.deployed.contractAddress}`
        );
        console.log(`Saved to ${NFT_STORE_FILENAME} — the next "vx3 mint nft" reuses it.`);
      }
      console.log(res.tokenId !== undefined ? `Minted NFT #${res.tokenId}` : 'Minted NFT');
      console.log(`  contract  ${res.contractAddress}`);
      console.log(`  owner     ${res.to}`);
      if (res.tokenURI) console.log(`  tokenURI  ${shorten(res.tokenURI)}`);
      console.log(
        `  tx        ${res.txHash}${blockNumber !== null ? ` (block ${blockNumber})` : ''}`
      );
      console.log(`  network   chain ${res.chainId} via ${res.rpcUrl}`);
    }
    process.exit(0);
  } catch (err) {
    // ethers errors carry the whole transaction in `message`; the revert
    // reason / short message is the part a person can act on.
    const e = err as Error & { reason?: string | null; shortMessage?: string };
    fail(`Mint failed: ${e.reason || e.shortMessage || e.message}`);
  }
}
