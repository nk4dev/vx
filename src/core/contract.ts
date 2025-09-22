import { load_rpc_config } from "./rpc/connect";

function intstance(configPath: string) {
  const config = load_rpc_config(configPath);
  const parsedContent = JSON.parse(config);

  const rpcUrl = `${parsedContent[0].protocol}://${parsedContent[0].host}:${parsedContent[0].port}`;
  if (!config) {
    console.error("No configuration found. Please run 'vx rpc init' to create a configuration.");
    process.exit(1);
  }
  console.log(rpcUrl);
  return { config, rpcUrl };
}

export function getRpcUrl() {
  const configPath = 'vx.config.json';
  const config = load_rpc_config(configPath);
  if (!config) {
    console.error("No configuration found. Please run 'vx rpc init' to create a configuration.");
    process.exit(1);
  }
  return `${config.protocol}://${config.host}:${config.port}`;
}

export default intstance;
