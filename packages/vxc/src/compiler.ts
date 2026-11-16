import * as fs from 'fs';
import * as path from 'path';
import { ImportResolver, ResolvedSource } from './resolver';
import { extractPragmaVersion } from './lexer';

export type SolcBackend = {
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

export interface CompileError {
  severity: string;
  message: string;
  formattedMessage?: string;
  sourceLocation?: unknown;
}

export interface CompileResult {
  artifacts: ContractArtifact[];
  errors: CompileError[];
  sources: string[];
}

interface SolcContractOutput {
  abi?: unknown[];
  evm?: {
    bytecode?: { object?: string };
    deployedBytecode?: { object?: string };
  };
  metadata?: string;
}

export class VXCompiler {
  constructor(private backend?: SolcBackend) {}

  private getBackend(): SolcBackend {
    if (this.backend) return this.backend;
    try {
      // Lazy load standard solc package
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const solc = require('solc') as SolcBackend;
      this.backend = solc;
      return solc;
    } catch (err) {
      throw new Error(`VXC: solc backend is not available. Please install solc. (${err})`);
    }
  }

  compile(opts: CompileOptions): CompileResult {
    const basePath = path.resolve(opts.basePath ?? process.cwd());
    const resolver = new ImportResolver({
      basePath,
      remappings: opts.remappings,
      includePaths: opts.includePaths,
    });

    const graph = resolver.resolveGraph(opts.entry);
    const entryResolved = path.resolve(basePath, opts.entry);
    const entrySrc = [...graph.values()].find(
      (s) => path.resolve(s.absolutePath) === entryResolved
    );
    const pragma = entrySrc ? extractPragmaVersion(entrySrc.tokens) : null;

    const sources: Record<string, { content: string }> = {};
    for (const [vp, src] of graph) {
      sources[vp] = { content: src.content };
    }

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

    const errors: CompileError[] = (out.errors ?? []).map(
      (e: { severity: string; formattedMessage?: string; message: string; sourceLocation?: unknown }) => ({
        severity: e.severity,
        message: e.formattedMessage ?? e.message,
        formattedMessage: e.formattedMessage,
        sourceLocation: e.sourceLocation,
      })
    );

    const hasError = errors.some((e) => e.severity === 'error');

    const artifacts: ContractArtifact[] = [];
    const contracts = out.contracts ?? {};

    for (const [sourcePath, perSource] of Object.entries<Record<string, SolcContractOutput>>(contracts)) {
      for (const [name, c] of Object.entries(perSource)) {
        const rawBytecode = c?.evm?.bytecode?.object ?? '';
        const rawDeployed = c?.evm?.deployedBytecode?.object ?? '';
        const bytecode = rawBytecode ? (rawBytecode.startsWith('0x') ? rawBytecode : '0x' + rawBytecode) : '0x';
        const deployedBytecode = rawDeployed ? (rawDeployed.startsWith('0x') ? rawDeployed : '0x' + rawDeployed) : '0x';

        artifacts.push({
          contractName: name,
          sourcePath,
          abi: c?.abi ?? [],
          bytecode,
          deployedBytecode,
          compiler: {
            name: 'vxc',
            backend: backend.version ? backend.version() : 'solc',
            pragma,
          },
          ...(opts.metadata && c?.metadata ? { metadata: c.metadata } : {}),
        });
      }
    }

    // Only write artifacts if there are no compilation errors
    if (!hasError && opts.emitArtifacts !== false && opts.outDir) {
      this.writeArtifacts(opts.outDir, artifacts, [...graph.values()]);
    }

    return { artifacts, errors, sources: [...graph.keys()] };
  }

  private writeArtifacts(outDir: string, artifacts: ContractArtifact[], srcs: ResolvedSource[]): void {
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
