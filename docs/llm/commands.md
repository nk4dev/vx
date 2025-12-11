# Command Reference

This document outlines the available commands in the VX CLI tool (`vx3`).

## Basic Commands

| Command | Description |
| :--- | :--- |
| `vx3 create` | Create a new Web3 project |
| `vx3 rpc init` | Initialize RPC configuration |
| `vx3 serve` | Start local development server |
| `vx3 gas` | Check current gas fees |
| `vx3 setup hardhat` | Scaffold Hardhat files into your project |
| `vx3 pay` | Send payments/transactions |

## Command Usage Details

### Create Project
Creates a new project by scaffolding templates.

**Syntax:**
```bash
vx3 create [project-name]
```

**Examples:**
- Interactive mode: `vx3 create`
- Non-interactive mode: `vx3 create my-app`

### RPC Initialization
Generates a `vx.config.json` file in the current directory for managing RPC endpoints.

**Syntax:**
```bash
vx3 rpc init
```

### Development Server
Starts a local development server.

**Syntax:**
```bash
vx3 serve [options]
```

**Options:**
- `--debug`: Starts the server with a debug dashboard enabled.

**Example:**
```bash
vx3 serve --debug
```
Access the dashboard at `http://localhost:3000/debug`.

### Gas Monitoring
Checks and displays current gas fees from connected networks.

**Syntax:**
```bash
vx3 gas
```

### Hardhat Setup
Scaffolds Hardhat configuration and files into the current project.

**Syntax:**
```bash
vx3 setup hardhat
```
*Note: You may need to run `npm install` afterwards to install dev dependencies.*

### Payments
Send cryptocurrency payments or transactions.

**Syntax:**
```bash
vx3 pay <recipient_address> <amount> --rpc <rpc_url>
```

**Environment Variables:**
- `PRIVATE_KEY`: The private key of the sender wallet (Required).

**Example:**
```bash
# Set private key (PowerShell example)
$env:PRIVATE_KEY='0x...'

# Send 0.01 ETH
vx3 pay 0xRecipientAddress 0.01 --rpc http://127.0.0.1:8545
```
