import instance from './core/contract';
import * as data from './core/data';
import { getRpcUrl } from './core/contract';

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
	// legacy
	instance,
};

export default vx;