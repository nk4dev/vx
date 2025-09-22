import { rpc_create_config } from "./config";
import { load_rpc_config, view_rpc_config } from "./connect";

export function rpc() {
    const subcommand = process.argv[3];
    switch (subcommand) {
        case 'init':
            rpc_create_config();
            break;
        case 'view':
            view_rpc_config();
            break;
        default:
            console.error(`Unknown RPC command: ${subcommand}`);
    }
}