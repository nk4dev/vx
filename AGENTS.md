When the documentation and existing code differ, follow the coding conventions and list all the discrepancies you find in your final response.

## Commands 
Usage: vx3 [options] [command]

VX3 SDK — Web3 developer toolkit (platform API v@latest)

Options:
  -v, --version             Show SDK version
  -h, --help                display help for command

Commands:
  init [name]               Initialize a new project in the current directory
  create [name]             Scaffold a new project (interactive when name is omitted)
  api                       Start the local helper API server (proxies block/gas/pay to your RPC)
  rpc [args...]             Manage RPC endpoints in vx.config.json (subcommands: init, list)
  setup [options] <target>  Add Hardhat or a React frontend to the current project
  pay [args...]             Send a transaction: vx3 pay <to> <amount> [--rpc <url>]
  gas [args...]             Estimate current gas fees [--rpc <url>] [-p <config>] [--json]
  ipfs [args...]            Fetch content via IPFS: vx3 ipfs fetch <cid> [gateway]
  generate [args...]        Generate a framework template (react, vue)
  compile [args...]         Compile Solidity with the VXC custom compiler
  mint [args...]            Mint an NFT in one step: vx3 mint nft [contract] [...]
  nft [args...]             NFT operations: vx3 nft mint [contract] [...]
  dash [args...]            Open the real-time developer dashboard
  sol [sub]                 Solidity helper samples
  info                      Show the remote VX platform version
  help [command]            display help for command

when call this infomation, run `bun dev` or `vx3 help`

## docs
remote: https://vx.nknighta.me/

## anothor info
version format: x.x.x

## Special notes regarding development
- Nodes created using this SDK are intended solely for development purposes; their use in production environments is not recommended.
