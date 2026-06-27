import * as fs from 'fs';
import * as path from 'path';
import { lex, Token } from './lexer';

export interface ResolvedSource {
  absolutePath: string;
  virtualPath: string;
  content: string;
  tokens: Token[];
}

export interface ResolverOptions {
  basePath: string;
  remappings?: Record<string, string>;
  includePaths?: string[];
}

export class ImportResolver {
  private cache = new Map<string, ResolvedSource>();

  constructor(private opts: ResolverOptions) {}

  resolveEntry(entry: string): ResolvedSource {
    const abs = path.resolve(this.opts.basePath, entry);
    return this.load(abs, path.relative(this.opts.basePath, abs).replace(/\\/g, '/'));
  }

  resolveGraph(entry: string): Map<string, ResolvedSource> {
    const graph = new Map<string, ResolvedSource>();
    const root = this.resolveEntry(entry);
    this.walk(root, graph);
    return graph;
  }

  private walk(src: ResolvedSource, graph: Map<string, ResolvedSource>) {
    if (graph.has(src.virtualPath)) return;
    graph.set(src.virtualPath, src);
    for (const t of src.tokens) {
      if (t.kind !== 'import') continue;
      const child = this.resolveImport(t.path, src.absolutePath);
      this.walk(child, graph);
    }
  }

  private resolveImport(spec: string, fromFile: string): ResolvedSource {
    const remapped = this.applyRemappings(spec);

    if (remapped.startsWith('./') || remapped.startsWith('../')) {
      const abs = path.resolve(path.dirname(fromFile), remapped);
      return this.load(abs, this.virtual(abs));
    }

    for (const inc of [path.dirname(fromFile), ...(this.opts.includePaths ?? []), this.opts.basePath]) {
      const candidate = path.resolve(inc, remapped);
      if (fs.existsSync(candidate)) return this.load(candidate, this.virtual(candidate));
    }

    const nm = this.tryNodeModules(remapped);
    if (nm) return this.load(nm, remapped);

    throw new Error(`VXC: cannot resolve import "${spec}" from ${fromFile}`);
  }

  private tryNodeModules(spec: string): string | null {
    let dir = this.opts.basePath;
    while (true) {
      const candidate = path.join(dir, 'node_modules', spec);
      if (fs.existsSync(candidate)) return candidate;
      const parent = path.dirname(dir);
      if (parent === dir) return null;
      dir = parent;
    }
  }

  private applyRemappings(spec: string): string {
    const m = this.opts.remappings ?? {};
    for (const [k, v] of Object.entries(m)) {
      if (spec.startsWith(k)) return v + spec.slice(k.length);
    }
    return spec;
  }

  private virtual(abs: string): string {
    const rel = path.relative(this.opts.basePath, abs).replace(/\\/g, '/');
    return rel.startsWith('..') ? abs.replace(/\\/g, '/') : rel;
  }

  private load(abs: string, virtualPath: string): ResolvedSource {
    const cached = this.cache.get(abs);
    if (cached) return cached;
    if (!fs.existsSync(abs)) throw new Error(`VXC: source not found: ${abs}`);
    const content = fs.readFileSync(abs, 'utf8');
    const src: ResolvedSource = {
      absolutePath: abs,
      virtualPath,
      content,
      tokens: lex(content),
    };
    this.cache.set(abs, src);
    return src;
  }
}
