import type { Signer, TransactionReceipt } from 'ethers';

export interface MintNFTOptions {
  rpcUrl: string;
  /** Signing key. Required unless `signer` is given. */
  privateKey?: string;
  /** Ready-made signer (e.g. a local node's unlocked account). Wins over `privateKey`. */
  signer?: Signer;
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

export interface MintNFTResult {
  txHash: string;
  receipt: TransactionReceipt | null;
  /** Recipient of the token. */
  to: string;
  /** Minted token ID, read from the ERC-721 Transfer event (when emitted). */
  tokenId?: string;
}

export interface DeployNFTOptions {
  rpcUrl: string;
  /** Signing key. Required unless `signer` is given. */
  privateKey?: string;
  signer?: Signer;
  /** Collection name (default: "VX Collection"). */
  name?: string;
  /** Collection symbol (default: "VXC"). */
  symbol?: string;
}

export interface DeployNFTResult {
  contractAddress: string;
  txHash: string | null;
  name: string;
  symbol: string;
}

/** ERC-721 metadata fields that `quickMint` can inline as a data: URI. */
export interface NFTMetadata {
  name?: string;
  description?: string;
  /** Image URL (https://, ipfs://, ...). */
  image?: string;
}

export interface QuickMintOptions {
  /** Existing ERC-721 contract. Omit to use (or deploy) this project's collection. */
  contractAddress?: string;
  to?: string;
  tokenId?: number | bigint;
  tokenURI?: string;
  /** Inlined into a data: URI when `tokenURI` is not given. */
  metadata?: NFTMetadata;
  functionName?: string;
  abi?: string[];
  /** Defaults to vx.config.json, then http://localhost:8545. */
  rpcUrl?: string;
  /** Defaults to PRIVATE_KEY (env, then ./.env), then a local dev node's first account. */
  privateKey?: string;
  /**
   * Deploy a fresh collection. Implied on local dev chains when the project
   * has none yet; must be set explicitly on any other chain.
   */
  deploy?: boolean;
  collectionName?: string;
  collectionSymbol?: string;
  /** Project directory holding vx.config.json / vx.nft.json / .env (default: cwd). */
  cwd?: string;
}

export interface QuickMintResult extends MintNFTResult {
  contractAddress: string;
  tokenURI?: string;
  rpcUrl: string;
  chainId: string;
  /** Present when this call deployed a new collection. */
  deployed?: DeployNFTResult;
}
