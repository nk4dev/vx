import { JsonRpcProvider, Wallet, Contract, parseUnits } from 'ethers';
import type { MintNFTOptions, MintNFTResult } from '../types/nft';

const DEFAULT_ABI = [
  'function mint(address to, uint256 tokenId) public',
  'function mint(address to, string memory tokenURI) public returns (uint256)',
  'function safeMint(address to, string memory tokenURI) public returns (uint256)',
  'function safeMint(address to, uint256 tokenId) public',
];

function gweiToWei(gwei: string): bigint {
  return parseUnits(gwei, 'gwei');
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

  if (opts.tokenURI && opts.tokenId === undefined) {
    return { fn: 'safeMint', args: [to, opts.tokenURI] };
  }
  if (opts.tokenId !== undefined && !opts.tokenURI) {
    return { fn: 'mint', args: [to, opts.tokenId] };
  }
  if (opts.tokenId !== undefined && opts.tokenURI) {
    return { fn: 'mint', args: [to, opts.tokenId, opts.tokenURI] };
  }

  return { fn: 'mint', args: [to] };
}

export async function mintNFT(opts: MintNFTOptions): Promise<MintNFTResult> {
  if (!opts.rpcUrl) throw new Error('rpcUrl is required');
  if (!opts.privateKey) throw new Error('privateKey is required');
  if (!opts.contractAddress) throw new Error('contractAddress is required');

  const provider = new JsonRpcProvider(opts.rpcUrl);
  const wallet = new Wallet(opts.privateKey, provider);
  const to = opts.to ?? wallet.address;

  const abi = opts.abi ?? DEFAULT_ABI;
  const contract = new Contract(opts.contractAddress, abi, wallet);

  const { fn, args } = resolveFnAndArgs(opts, to);

  const overrides: Record<string, unknown> = {};
  if (opts.gasLimit) overrides.gasLimit = opts.gasLimit;
  if (opts.maxFeePerGas) overrides.maxFeePerGas = gweiToWei(opts.maxFeePerGas);
  if (opts.maxPriorityFeePerGas)
    overrides.maxPriorityFeePerGas = gweiToWei(opts.maxPriorityFeePerGas);

  const tx = await contract[fn](...args, overrides);
  const receipt = await tx.wait(1);

  return { txHash: tx.hash, receipt };
}

export default { mintNFT };
