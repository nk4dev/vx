# VXC — VX3 Custom Solidity Compiler

`@vx3/vxc` is the in-house Solidity compiler shipped with the VX3 SDK. It
provides a fully custom **frontend** (lexer, import resolver, dependency-graph
builder, artifact pipeline, manifest emitter) and delegates the EVM codegen
step to a pluggable **backend** (`solc` by default).

> Why not write codegen from scratch? Solidity's semantics, Yul lowering and
> EVM optimizer are a moving target maintained by the Solidity team. VXC owns
> the parts a tooling author actually wants to control — resolution, layout,
> caching, artifact format — while keeping bug-for-bug compatibility with the
> reference compiler. The backend is swappable: any object exposing
> `compile(standardJsonInput: string): string` works, including `solcjs`,
> native `solc`, or a future Rust/Go reimplementation.

## Architecture

```
   ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
   │  Lexer      │ -> │  Resolver    │ -> │  Compiler    │ -> │ Artifacts│
   │ (pragma,    │    │ (graph,      │    │ (Standard    │    │  + manifest │
   │  imports)   │    │  remappings, │    │   JSON I/O,  │    │             │
   │             │    │  node_modules)│    │   backend)   │    │             │
   └─────────────┘    └──────────────┘    └──────────────┘    └──────────┘
```

| Stage | File | Responsibility |
| --- | --- | --- |
| Lexer | `src/lexer.ts` | Strips comments/strings, extracts `pragma`, `import`, `contract`/`library`/`interface` tokens with line numbers. |
| Resolver | `src/resolver.ts` | Builds the import graph. Supports relative paths, remappings, include paths, and walking up `node_modules`. |
| Compiler | `src/compiler.ts` | Constructs the Standard JSON input, invokes the backend, parses output, emits typed artifacts. |
| CLI | `src/cli.ts` | `vxc` command-line entry point. |

## Install

VXC is part of the `vx3` SDK monorepo. Inside this repo it is built via:

```bash
npm run build --workspace @vx3/vxc
# or directly
cd packages/vxc && npx tsc
```

## CLI

```bash
vxc <entry.sol> [options]

Options:
  -o, --out <dir>      Output directory for artifacts (default: artifacts/vxc)
      --optimize       Enable optimizer
      --runs <n>       Optimizer runs (default: 200)
      --evm <version>  Target EVM version (e.g. paris, shanghai, cancun)
      --base <dir>     Base path for resolution (default: cwd)
      --metadata       Emit Solidity metadata in artifacts
      --remap k=v      Add an import remapping (repeatable)
```

Example:

```bash
vxc contracts/Token.sol \
  --out build \
  --optimize --runs 1000 \
  --evm cancun \
  --remap @openzeppelin/=node_modules/@openzeppelin/
```

It is also exposed through the SDK CLI as `vx3 compile`:

```bash
vx3 compile contracts/Token.sol --out build --optimize
```

## Programmatic API

```ts
import { VXCompiler } from '@vx3/vxc';

const compiler = new VXCompiler();
const { artifacts, errors } = compiler.compile({
  entry: 'contracts/Token.sol',
  basePath: process.cwd(),
  outDir: 'build',
  optimizer: { enabled: true, runs: 200 },
  remappings: { '@openzeppelin/': 'node_modules/@openzeppelin/' },
  metadata: true,
});

for (const a of artifacts) {
  console.log(a.contractName, a.bytecode.length, 'bytes');
}
```

### Frontend-only usage

You can use the lexer and resolver without compiling — useful for linters,
documentation generators, or LSPs:

```ts
import { ImportResolver, lex, extractPragmaVersion } from '@vx3/vxc';

const resolver = new ImportResolver({ basePath: process.cwd() });
const graph = resolver.resolveGraph('contracts/Token.sol');

for (const [virtualPath, src] of graph) {
  console.log(virtualPath, '→', extractPragmaVersion(src.tokens));
}
```

## Artifact format

Each compiled contract is written as `<ContractName>.json`:

```json
{
  "contractName": "Token",
  "sourcePath": "contracts/Token.sol",
  "abi": [...],
  "bytecode": "0x60806040...",
  "deployedBytecode": "0x60806040...",
  "compiler": { "name": "vxc", "backend": "0.8.30+commit...", "pragma": "^0.8.20" },
  "metadata": "{...}"
}
```

A `vxc.manifest.json` is also emitted listing every source in the graph and
every contract produced — useful for downstream deploy / verification
tooling.

## Swapping the backend

```ts
import { VXCompiler } from '@vx3/vxc';
import myBackend from './my-backend'; // must expose compile(input: string): string

const compiler = new VXCompiler(myBackend);
```

This is how a future native VXC backend (planned: a Rust crate exposed via
WASM) will plug in without changing the frontend.

## Roadmap

- [ ] Incremental builds with content-addressed cache
- [ ] Source-map flattening for verifier-friendly output
- [ ] Native (Rust/WASM) backend replacing solc-js
- [ ] Yul-only mode
- [ ] Integration with `vx3 verify`

## License

MIT — © Nknight AMAMIYA / Varius Technology.
