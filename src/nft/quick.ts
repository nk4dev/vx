// `quickMint` is what `vx3 mint nft` runs: it fills in everything a mint
// needs (RPC, signer, a collection contract) so the caller can pass nothing.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { JsonRpcProvider, type Signer } from 'ethers';
import { getRpcEndpoints, loadVxConfig, toRpcUrl } from '../core/config';
import { readEnvVar } from '../libs/env';
import type {
  DeployNFTResult,
  QuickMintOptions,
  QuickMintResult,
} from '../types/nft';
import { buildTokenURI, deployNFT, mintNFT } from './mint';

export const DEFAULT_RPC_URL = 'http://localhost:8545';
export const NFT_STORE_FILENAME = 'vx.nft.json';

// Hardhat / Anvil (31337) and Ganache / geth --dev (1337): throwaway chains
// where deploying a contract or using the node's own account costs nothing.
const LOCAL_CHAIN_IDS = new Set(['31337', '1337']);

interface StoredCollection {
  address: string;
  name: string;
  symbol: string;
}
type NftStore = Record<string, StoredCollection>;

function readStore(file: string): NftStore {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return parsed && typeof parsed === 'object' ? (parsed as NftStore) : {};
  } catch {
    return {};
  }
}

function resolveRpcUrl(opts: QuickMintOptions, cwd: string): string {
  if (opts.rpcUrl) return opts.rpcUrl;
  const endpoints = getRpcEndpoints(
    loadVxConfig({ path: path.join(cwd, 'vx.config.json'), optional: true })
  );
  return endpoints.length > 0 ? toRpcUrl(endpoints[0]) : DEFAULT_RPC_URL;
}

/**
 * Ask the node for its chain ID directly. ethers' JsonRpcProvider retries
 * forever when nothing is listening, so check reachability first.
 */
async function fetchChainId(rpcUrl: string): Promise<string> {
  const unreachable = (reason: string) =>
    new Error(
      `Cannot reach an EVM node at ${rpcUrl} (${reason}). ` +
        'Start one (e.g. "npx hardhat node") or pass --rpc <url>.'
    );
  let body: { result?: string };
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw unreachable(`HTTP ${res.status}`);
    body = (await res.json()) as { result?: string };
  } catch (err) {
    if ((err as Error).message.startsWith('Cannot reach')) throw err;
    throw unreachable((err as Error).message);
  }
  if (!body.result) throw unreachable('no eth_chainId result');
  return BigInt(body.result).toString();
}

export async function quickMint(
  opts: QuickMintOptions = {}
): Promise<QuickMintResult> {
  const cwd = opts.cwd ?? process.cwd();
  const rpcUrl = resolveRpcUrl(opts, cwd);
  const chainId = await fetchChainId(rpcUrl);
  const isLocal = LOCAL_CHAIN_IDS.has(chainId);
  const provider = new JsonRpcProvider(rpcUrl);

  // Signer: explicit key > PRIVATE_KEY > (local chains only) the node's account.
  const privateKey = opts.privateKey ?? readEnvVar('PRIVATE_KEY', cwd);
  let signer: Signer | undefined;
  if (!privateKey) {
    if (isLocal) {
      const accounts = (await provider.send('eth_accounts', [])) as string[];
      if (accounts.length > 0) signer = await provider.getSigner(accounts[0]);
    }
    if (!signer) {
      throw new Error(
        'Private key not provided. Set PRIVATE_KEY (environment or .env) or use --key <privateKey>.'
      );
    }
  }

  // Collection: explicit address > this project's saved one > a new deployment.
  const storeFile = path.join(cwd, NFT_STORE_FILENAME);
  let contractAddress = opts.contractAddress;
  let deployed: DeployNFTResult | undefined;
  if (!contractAddress) {
    const store = readStore(storeFile);
    const saved = opts.deploy ? undefined : store[chainId];
    // A restarted dev node keeps its chain ID but loses the contract.
    const savedIsLive =
      !!saved &&
      (await provider.getCode(saved.address)) !== '0x';

    if (saved && savedIsLive) {
      contractAddress = saved.address;
    } else {
      if (saved && !isLocal) {
        throw new Error(
          `${NFT_STORE_FILENAME} points at ${saved.address} for chain ${chainId}, but no contract exists there. ` +
            'Pass a contract address, or --deploy to deploy a new collection.'
        );
      }
      if (!isLocal && !opts.deploy) {
        throw new Error(
          `No NFT collection known for chain ${chainId}. ` +
            'Pass a contract address, or --deploy to deploy a new collection (costs gas).'
        );
      }
      deployed = await deployNFT({
        rpcUrl,
        privateKey,
        signer,
        name: opts.collectionName,
        symbol: opts.collectionSymbol,
      });
      contractAddress = deployed.contractAddress;
      store[chainId] = {
        address: deployed.contractAddress,
        name: deployed.name,
        symbol: deployed.symbol,
      };
      fs.writeFileSync(storeFile, `${JSON.stringify(store, null, 2)}\n`, 'utf-8');
    }
  }

  let tokenURI = opts.tokenURI;
  if (tokenURI === undefined && opts.metadata) {
    tokenURI = buildTokenURI(opts.metadata);
  }
  // The bundled collection assigns IDs itself, so a bare mint needs no input.
  const managed = !opts.contractAddress;
  if (
    managed &&
    tokenURI === undefined &&
    opts.tokenId === undefined &&
    !opts.functionName
  ) {
    tokenURI = '';
  }

  const minted = await mintNFT({
    rpcUrl,
    privateKey,
    signer,
    contractAddress,
    to: opts.to,
    tokenId: opts.tokenId,
    tokenURI,
    functionName: opts.functionName,
    abi: opts.abi,
  });

  return { ...minted, contractAddress, tokenURI, rpcUrl, chainId, deployed };
}
