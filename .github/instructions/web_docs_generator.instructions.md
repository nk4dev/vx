---
description: web_docs_generator instructions for generating documentation for the vx project (Web3).
# applyTo: 'Describe when these instructions should be loaded' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
model: Claude Sonnet 4.6
---


# Web Docs Generator Instructions
- project: vx3
- toolname: vx sdk
- website: https://nknighta.me/vx
- website base path: /vx/
- website description: Website Description: vx is a Web3 SDK that provides developers with tools and resources for building decentralized applications (dApps) on the blockchain. It allows for smart contract integration, wallet management and creation, and can connect to multiple blockchains in parallel. vx enables developers to easily create secure and efficient dApps that leverage the power of blockchain technology. It also includes a cryptocurrency payment API.

- documentation: https://nknighta.me/vx/docs
## Important:
This site clearly states that this is pre-beta code in development.
The destination directory is limited to /docs/docs.
index page should be generated at /docs/index.html

## Tech Stack
- Programming Language: TypeScript, solidity
- Frameworks/Libraries: React, Node.js, Express, Ethers.js, Rust

## Documentation Structure
- CSS: Tailwind CSS
- Library: Three.js(background animation)
- Repository: https://github.com/nk4dev/vx
- Pearent Repository: https://github.com/nk4dev/vx3

## Website requirements
- code copy button for code snippets
- responsive design for mobile and desktop
- buttom nav links https://nknighta.me (owner profile), https://varius.technology (Team website),