import { buildTokenURI, deployNFT, mintNFT } from './mint';
import { quickMint } from './quick';

export {
  buildTokenURI,
  deployNFT,
  mintNFT,
  DEFAULT_COLLECTION_NAME,
  DEFAULT_COLLECTION_SYMBOL,
} from './mint';
export { quickMint, DEFAULT_RPC_URL, NFT_STORE_FILENAME } from './quick';
export { COLLECTION_ABI, COLLECTION_BYTECODE } from './collection';

export default { mintNFT, deployNFT, quickMint, buildTokenURI };
