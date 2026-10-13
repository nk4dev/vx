import { parseUnits } from 'ethers';

export function gweiToWei(gwei: string): bigint {
  return parseUnits(gwei, 'gwei');
}
