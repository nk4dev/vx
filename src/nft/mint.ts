import {
  JsonRpcProvider,
  Wallet,
  Contract,
  ContractFactory,
  type Signer,
} from 'ethers';
import type {
  DeployNFTOptions,
  DeployNFTResult,
  MintNFTOptions,
  MintNFTResult,
  NFTMetadata,
} from '../types/nft';
import { gweiToWei } from '../libs/units';
import { COLLECTION_ABI, COLLECTION_BYTECODE } from './collection';

export const DEFAULT_COLLECTION_NAME = 'VX Collection';
export const DEFAULT_COLLECTION_SYMBOL = 'VXC';

// keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ZERO_TOPIC = '0x' + '0'.repeat(64);

const DEFAULT_ABI = [
  'function mint(address to, uint256 tokenId) public',
  'function mint(address to, string memory tokenURI) public returns (uint256)',
  'function safeMint(address to, string memory tokenURI) public returns (uint256)',
  'function safeMint(address to, uint256 tokenId) public',
];

function resolveSigner(
  opts: { privateKey?: string; signer?: Signer },
  provider: JsonRpcProvider
): Signer {
  if (opts.signer) return opts.signer;
  if (!opts.privateKey) throw new Error('privateKey is required');
  return new Wallet(opts.privateKey, provider);
}

function resolveFnAndArgs(
  opts: MintNFTOptions,
  to: string
): { fn: string; args: unknown[] } {
  if (opts.functionName) {
    const args: unknown[] = [to];
    if (opts.tokenId !== undefined) args.push(opts.tokenId);
    if (opts.tokenURI) args.push(opts.tokenURI);
    return { fn: opts.functionName, args };
  }

  // The default ABI declares overloaded `mint`/`safeMint` fragments so a
  // range of common ERC-721 contracts can be auto-detected. ethers rejects a
  // bare `contract['mint']` lookup as ambiguous whenever more than one
  // fragment shares that name, so the fully-qualified signature (matching
  // one of the DEFAULT_ABI entries above) must be used instead of the plain
  // name when no custom ABI/function name was supplied.
  // An empty tokenURI is a valid choice (mint now, set metadata later).
  if (opts.tokenURI !== undefined && opts.tokenId === undefined) {
    return { fn: 'safeMint(address,string)', args: [to, opts.tokenURI] };
  }
  if (opts.tokenId !== undefined && opts.tokenURI === undefined) {
    return { fn: 'mint(address,uint256)', args: [to, opts.tokenId] };
  }
  if (opts.tokenId !== undefined && opts.tokenURI !== undefined) {
    throw new Error(
      'The default ABI has no mint(address,uint256,string) overload. ' +
        'Pass --fn <name> together with a custom --abi, or provide only one of --id/--uri.'
    );
  }

  throw new Error(
    'Provide --id <tokenId> or --uri <tokenURI> (or --fn <name> with a custom ABI) to mint.'
  );
}

/** Token ID of the mint (Transfer from the zero address) in a receipt, if any. */
function mintedTokenId(
  receipt: MintNFTResult['receipt'],
  contractAddress: string
): string | undefined {
  for (const log of receipt?.logs ?? []) {
    if (
      log.address.toLowerCase() === contractAddress.toLowerCase() &&
      log.topics.length === 4 &&
      log.topics[0] === TRANSFER_TOPIC &&
      log.topics[1] === ZERO_TOPIC
    ) {
      return BigInt(log.topics[3]).toString();
    }
  }
  return undefined;
}

/** Inline ERC-721 metadata as a `data:application/json;base64,...` token URI. */
export function buildTokenURI(metadata: NFTMetadata): string {
  const json = JSON.stringify(metadata);
  return `data:application/json;base64,${Buffer.from(json).toString('base64')}`;
}

/** Deploy the bundled ERC-721 collection (contracts/VXCollection.sol). */
export async function deployNFT(
  opts: DeployNFTOptions
): Promise<DeployNFTResult> {
  if (!opts.rpcUrl) throw new Error('rpcUrl is required');
  const signer = resolveSigner(opts, new JsonRpcProvider(opts.rpcUrl));
  const name = opts.name ?? DEFAULT_COLLECTION_NAME;
  const symbol = opts.symbol ?? DEFAULT_COLLECTION_SYMBOL;

  const factory = new ContractFactory(COLLECTION_ABI, COLLECTION_BYTECODE, signer);
  const contract = await factory.deploy(name, symbol);
  await contract.waitForDeployment();

  return {
    contractAddress: await contract.getAddress(),
    txHash: contract.deploymentTransaction()?.hash ?? null,
    name,
    symbol,
  };
}

export async function mintNFT(opts: MintNFTOptions): Promise<MintNFTResult> {
  if (!opts.rpcUrl) throw new Error('rpcUrl is required');
  if (!opts.privateKey && !opts.signer) {
    throw new Error('privateKey is required');
  }
  if (!opts.contractAddress) throw new Error('contractAddress is required');

  const provider = new JsonRpcProvider(opts.rpcUrl);
  // A transaction to an address without code succeeds and mints nothing, so
  // refuse up front instead of reporting a mint that never happened.
  const code = await provider.getCode(opts.contractAddress);
  if (!code || code === '0x') {
    throw new Error(
      `No contract found at ${opts.contractAddress} on ${opts.rpcUrl}. Check the address and the network.`
    );
  }
  const signer = resolveSigner(opts, provider);
  const to = opts.to ?? (await signer.getAddress());

  const abi = opts.abi ?? DEFAULT_ABI;
  const contract = new Contract(opts.contractAddress, abi, signer);

  const { fn, args } = resolveFnAndArgs(opts, to);

  const overrides: Record<string, unknown> = {};
  if (opts.gasLimit) overrides.gasLimit = opts.gasLimit;
  if (opts.maxFeePerGas) overrides.maxFeePerGas = gweiToWei(opts.maxFeePerGas);
  if (opts.maxPriorityFeePerGas)
    overrides.maxPriorityFeePerGas = gweiToWei(opts.maxPriorityFeePerGas);

  const tx = await contract[fn](...args, overrides);
  const receipt = await tx.wait(1);

  return {
    txHash: tx.hash,
    receipt,
    to,
    tokenId: mintedTokenId(receipt, opts.contractAddress),
  };
}
