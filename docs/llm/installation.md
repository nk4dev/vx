# Installation Instructions

## Requirements
- **Node.js:** 18+ (recommended; required for built-in `fetch` usage)
- **Package Manager:** npm, pnpm, or yarn
- **Bun (optional):** For running the project build

## Installation Methods

### As a Global CLI Tool
Install globally for CLI access from anywhere:

```bash
npm install -g @nk4dev/vx
# or
npm i -g @nk4dev/vx
```

### As a Local Dependency
Install in your project:

```bash
npm install @nk4dev/vx
```

### For One-off Usage
Use `npx` to run commands without installing:

```bash
npx vx3 <command>
```

### From Source (Development)
Clone and build locally:

```bash
git clone https://github.com/nk4dev/vx.git
cd vx
npm install
npm run build
```

For Bun-based building:
```bash
bun install
bun run build
```
