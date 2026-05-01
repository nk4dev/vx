import * as fs from 'fs';
import * as path from 'path';
import { ImportResolver, ResolvedSource } from './resolver';
import { extractPragmaVersion } from './lexer';

// Backend is loaded lazily so consumers without solc installed can still
// import the frontend (lexer/resolver) for tooling.
type SolcBackend = {
  compile(input: string): string;
  version?(): string;
};

export interface CompileOptions {
  entry: string;
  basePath?: string;
  outDir?: string;
  optimizer?: { enabled: boolean; runs?: number };
  evmVersion?: string;
  remappings?: Record<string, string>;
  includePaths?: string[];
  emitArtifacts?: boolean;
  metadata?: boolean;
}

export interface ContractArtifact {
  contractName: string;
  sourcePath: string;
  abi: unknown[];
  bytecode: string;
  deployedBytecode: string;
  compiler: { name: 'vxc'; backend: string; pragma: string | null };
  metadata?: string;
}

export interface CompileResult {
  artifacts: ContractArtifact[];
  errors: Array<{ severity: string; message: string; sourceLocation?: unknown }>;
  sources: string[];
}

export class VXCompiler {
  constructor(private backend?: SolcBackend) {}

  private getBackend(): SolcBackend {
    if (this.backend) return this.backend;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const solc = require('solc') as SolcBackend;
    this.backend = solc;
    return solc;
  }

  compile(opts: CompileOptions): CompileResult {
    const basePath = path.resolve(opts.basePath ?? process.cwd());
    const resolver = new ImportResolver({
      basePath,
      remappings: opts.remappings,
      includePaths: opts.includePaths,
    });

    const graph = resolver.resolveGraph(opts.entry);
    const entrySrc = [...graph.values()].find(
      (s) => path.resolve(s.absolutePath) === path.resolve(basePath, opts.entry)
    )!;
    const pragma = extractPragmaVersion(entrySrc.tokens);

    const sources: Record<string, { content: string }> = {};
    for (const [vp, src] of graph) sources[vp] = { content: src.content };

    const standardJson = {
      language: 'Solidity',
      sources,
      settings: {
        optimizer: opts.optimizer ?? { enabled: false, runs: 200 },
        evmVersion: opts.evmVersion,
        outputSelection: {
          '*': {
            '*': [
              'abi',
              'evm.bytecode.object',
              'evm.deployedBytecode.object',
              ...(opts.metadata ? ['metadata'] : []),
            ],
          },
        },
        remappings: opts.remappings
          ? Object.entries(opts.remappings).map(([k, v]) => `${k}=${v}`)
          : undefined,
      },
    };

    const backend = this.getBackend();
    const raw = backend.compile(JSON.stringify(standardJson));
    const out = JSON.parse(raw);

    const errors = (out.errors ?? []).map((e: { severity: string; formattedMessage?: string; message: string; sourceLocation?: unknown }) => ({
      severity: e.severity,
      message: e.formattedMessage ?? e.message,
      sourceLocation: e.sourceLocation,
    }));

    const artifacts: ContractArtifact[] = [];
    const contracts = out.contracts ?? {};
    for (const [sourcePath, perSource] of Object.entries<Record<string, { abi: unknown[]; evm: { bytecode: { object: string }; deployedBytecode: { object: string } }; metadata?: string }>>(contracts)) {
      for (const [name, c] of Object.entries(perSource)) {
        artifacts.push({
          contractName: name,
          sourcePath,
          abi: c.abi,
          bytecode: '0x' + c.evm.bytecode.object,
          deployedBytecode: '0x' + c.evm.deployedBytecode.object,
          compiler: {
            name: 'vxc',
            backend: backend.version ? backend.version() : 'solc',
            pragma,
          },
          metadata: c.metadata,
        });
      }
    }

    if (opts.emitArtifacts !== false && opts.outDir) {
      this.writeArtifacts(opts.outDir, artifacts, [...graph.values()]);
    }

    return { artifacts, errors, sources: [...graph.keys()] };
  }

  private writeArtifacts(outDir: string, artifacts: ContractArtifact[], srcs: ResolvedSource[]) {
    fs.mkdirSync(outDir, { recursive: true });
    for (const a of artifacts) {
      const file = path.join(outDir, `${a.contractName}.json`);
      fs.writeFileSync(file, JSON.stringify(a, null, 2));
    }
    const manifest = {
      compiler: 'vxc',
      generatedAt: new Date().toISOString(),
      sources: srcs.map((s) => s.virtualPath),
      contracts: artifacts.map((a) => ({ name: a.contractName, source: a.sourcePath })),
    };
    fs.writeFileSync(path.join(outDir, 'vxc.manifest.json'), JSON.stringify(manifest, null, 2));
  }
}
