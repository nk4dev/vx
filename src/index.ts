import instance from './core/contract';
import * as data from './core/data';
import { getRpcUrl } from './core/contract';
import * as payment from './payment/index';

// Keep named exports for backward compatibility
export { instance };
export { data as vx };

// Default export for `import vx from "..."` usage
const vx = {
	// high-level helpers
	getRpcUrl,
	// data helpers (also exposed flat for convenience)
	data,
	getBlockNumber: data.getBlockNumber,
	getBalance: data.getBalance,
	getGasFees: data.getGasFees,
  // payment API
  payment,
	// legacy
	instance,
};

export default vx;
export { payment };

// CJS/ESM interop: ensure default import from CJS yields usable object with methods
// without requiring `.default` access in Node ESM.
// This merges named exports onto the default object and exposes them via module.exports.
// Safe no-op in pure ESM contexts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const module: any | undefined;
try {
	if (typeof module !== 'undefined' && module && module.exports) {
		const named = { default: vx, instance, vx: data };
		module.exports = Object.assign({}, named, vx);
	}
} catch {}