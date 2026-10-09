/**
 * Convert a decimal ETH amount ("0.57") to wei using exact string / BigInt
 * arithmetic. `parseFloat(amount) * 1e18` loses precision — 0.57 ETH becomes
 * 569999999999999936 wei — so floats must never be used for amounts.
 *
 * @throws when the amount is not a plain non-negative decimal number or has
 *   more than 18 decimal places.
 */
export function ethToWei(amount: string): bigint {
  const value = String(amount).trim();
  const match = /^(\d*)(?:\.(\d*))?$/.exec(value);
  if (!match || (!match[1] && !match[2])) {
    throw new Error(`Invalid amount: "${amount}"`);
  }
  const fraction = match[2] ?? '';
  if (fraction.length > 18) {
    throw new Error(`Invalid amount: "${amount}" has more than 18 decimal places`);
  }
  return BigInt((match[1] || '0') + fraction.padEnd(18, '0'));
}

/** {@link ethToWei} as the 0x-prefixed hex string EIP-1193 wallets expect. */
export function ethToWeiHex(amount: string): string {
  return '0x' + ethToWei(amount).toString(16);
}
