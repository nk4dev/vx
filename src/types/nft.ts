export interface MintNFTOptions {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
  /** Recipient address. Defaults to the signer's address. */
  to?: string;
  /** Token ID for mint(address, uint256) style contracts. */
  tokenId?: number | bigint;
  /** Metadata URI for safeMint(address, string) style contracts. */
  tokenURI?: string;
  /** Override the contract function name (default: auto-detected). */
  functionName?: string;
  /** Custom ABI fragments. Defaults to common ERC-721 signatures. */
  abi?: string[];
  gasLimit?: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

import type { TransactionReceipt } from 'ethers';

export interface MintNFTResult {
  txHash: string;
  receipt: TransactionReceipt | null;
}
