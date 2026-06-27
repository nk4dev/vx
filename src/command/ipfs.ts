import { fetchCid } from '../core/ipfs';

export async function handleIpfsCommand(args: string[]): Promise<void> {
  if (!args || args.length === 0) {
    console.error('Usage: vx3 ipfs fetch <cid> [gatewayUrl]');
    process.exit(1);
  }

  const sub = args[0];
  if (sub !== 'fetch') {
    console.error('Unknown ipfs subcommand. Supported: fetch');
    process.exit(1);
  }

  const cid = args[1];
  const gateway = args[2];

  if (!cid) {
    console.error('Usage: vx3 ipfs fetch <cid> [gatewayUrl]');
    process.exit(1);
  }

  try {
    const result = await fetchCid(cid, gateway);
    console.log(`Fetched from: ${result.source}`);
    if (typeof result.data === 'string') {
      console.log(result.data);
    } else {
      // print length and first bytes
      console.log(`<binary data: ${result.data.byteLength} bytes>`);
    }
    process.exit(0);
  } catch (err) {
    console.error(`IPFS fetch error: ${err.message}`);
    process.exit(1);
  }
}
