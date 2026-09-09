import { DEFAULT_VX_CONFIG, writeVxConfig } from '../config';

/**
 * Create a starter `vx.config.json` in the current directory.
 * @deprecated prefer `writeVxConfig()` from `core/config`.
 * @returns the path written
 * @throws propagates IO / validation errors (does not call process.exit()).
 */
export function rpc_create_config(): string {
  return writeVxConfig(DEFAULT_VX_CONFIG);
}
