import { JsonRpcProvider, Wallet, parseEther } from 'ethers';

export type SendPaymentOptions = {
  rpcUrl: string;
  privateKey: string; // hex private key
  to: string; // recipient address
  amountEth: string; // amount in ETH (string like "0.01")
  maxPriorityFeePerGas?: string; // gwei as string
  maxFeePerGas?: string; // gwei as string
  gasLimit?: number;
};

export type SendPaymentResult = {
  txHash: string;
  receipt?: any;
};

function gweiToWei(gwei?: string) {
  if (!gwei) return undefined;
  return `${gwei}000000000`;
}

export async function sendPayment(opts: SendPaymentOptions): Promise<SendPaymentResult> {
  if (!opts.rpcUrl) throw new Error('rpcUrl is required');
  if (!opts.privateKey) throw new Error('privateKey is required');
  if (!opts.to) throw new Error('to (recipient) is required');
  if (!opts.amountEth) throw new Error('amountEth is required');

  const provider = new JsonRpcProvider(opts.rpcUrl);
  const wallet = new Wallet(opts.privateKey, provider);

  const tx: any = {
    to: opts.to,
    value: parseEther(opts.amountEth),
  };

  if (opts.gasLimit) tx.gasLimit = opts.gasLimit;
  if (opts.maxPriorityFeePerGas) tx.maxPriorityFeePerGas = gweiToWei(opts.maxPriorityFeePerGas);
  if (opts.maxFeePerGas) tx.maxFeePerGas = gweiToWei(opts.maxFeePerGas);

  const sent = await wallet.sendTransaction(tx as any);
  const receipt = await sent.wait(1);

  return { txHash: sent.hash, receipt };
}

export default { sendPayment };
