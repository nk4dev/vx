import * as fs from 'fs';
import * as path from 'path';

type TemplateName = 'react' | 'vue';

type TemplateSpec = {
  templateDir: string;
  description: string;
  entries: string[];
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

type GenerateOptions = {
  targetDirArg?: string;
  debugLocal: boolean;
};

// generate package.json template for react and vue projects, with options to link local SDK for development
const TEMPLATE_SPECS: Record<TemplateName, TemplateSpec> = {
  react: {
    templateDir: 'react-template',
    description: 'Vite + React + TypeScript payment demo',
    entries: ['index.html', 'vite.config.ts', 'tsconfig.json', 'src'],
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      ethers: '^6.15.0',
      '@vx3/vx': '0.0.19',
    },
    devDependencies: {
      vite: '^6.0.0',
      '@vitejs/plugin-react': '^4.4.0',
      typescript: '^5.8.0',
      '@types/react': '^19.2.0',
      '@types/react-dom': '^19.2.0',
    },
  },
  vue: {
    templateDir: 'vue-template',
    description: 'Vite + Vue + TypeScript payment demo',
    entries: ['index.html', 'vite.config.ts', 'tsconfig.json', 'src'],
    scripts: {
      dev: 'vite',
      build: 'vue-tsc --noEmit && vite build',
      preview: 'vite preview',
    },
    dependencies: {
      vue: '^3.5.13',
      ethers: '^6.15.0',
      '@vx3/vx': '0.0.19',
    },
    devDependencies: {
      vite: '^6.0.0',
      '@vitejs/plugin-vue': '^5.2.1',
      typescript: '^5.8.0',
      'vue-tsc': '^2.1.10',
      '@types/node': '^22.16.5',
    },
  },
};

// Utility functions for file operations and template generation
function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyRecursiveSync(src: string, dest: string): void {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  if (stat.isFile()) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function upsertJSON(
  filePath: string,
  updater: (obj: Record<string, unknown>) => Record<string, unknown>
): void {
  let current: Record<string, unknown> = {};
  if (fs.existsSync(filePath)) {
    try {
      current = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<
        string,
        unknown
      >;
    } catch {
      current = {};
    }
  }

  const next = updater(current);
  fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}

function resolveTemplateRoot(
  templateDir: string,
  cwd: string,
  preferLocal: boolean
): string | null {
  const localCandidate = path.resolve(cwd, `packages/${templateDir}`);
  const bundledCandidates = [
    path.resolve(__dirname, `../../packages/${templateDir}`),
    path.resolve(__dirname, `../../../packages/${templateDir}`),
  ];
  const candidates = preferLocal
    ? [localCandidate, ...bundledCandidates]
    : [...bundledCandidates, localCandidate];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function resolveLocalSdkDependency(
  outputDir: string,
  cwd: string
): string | null {
  const candidates = [
    cwd,
    path.resolve(__dirname, '..', '..', '..'),
    path.resolve(__dirname, '..', '..'),
  ];

  for (const candidate of candidates) {
    const pkgPath = path.join(candidate, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      continue;
    }

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
        name?: string;
      };
      if (pkg.name !== 'vx3') {
        continue;
      }

      const rel = path.relative(outputDir, candidate).replace(/\\/g, '/');
      if (!rel) {
        return 'file:.';
      }

      return rel.startsWith('.') ? `file:${rel}` : `file:./${rel}`;
    } catch {
      continue;
    }
  }

  return null;
}

function listGeneratableLibraries(): void {
  console.log('Generatable libraries/templates:');
  for (const [name, spec] of Object.entries(TEMPLATE_SPECS)) {
    console.log(`  template/${name}`.padEnd(18) + ` - ${spec.description}`);
  }
}

function generateTemplate(
  templateName: TemplateName,
  options: GenerateOptions
): void {
  const cwd = process.cwd();
  const spec = TEMPLATE_SPECS[templateName];
  const outputDir = path.resolve(cwd, options.targetDirArg ?? '.');

  const templateRoot = resolveTemplateRoot(
    spec.templateDir,
    cwd,
    options.debugLocal
  );
  if (!templateRoot) {
    throw new Error(
      `Template directory not found: packages/${spec.templateDir}`
    );
  }

  const sdkDependency = options.debugLocal
    ? (resolveLocalSdkDependency(outputDir, cwd) ?? '0.0.19')
    : '0.0.19';

  if (options.debugLocal && sdkDependency === '0.0.19') {
    console.warn(
      'Debug mode enabled, but local vx3 package was not found. Falling back to published version 0.0.19.'
    );
  }

  ensureDir(outputDir);

  for (const entry of spec.entries) {
    const src = path.join(templateRoot, entry);
    if (!fs.existsSync(src)) {
      continue;
    }
    copyRecursiveSync(src, path.join(outputDir, entry));
  }

  const pkgPath = path.join(outputDir, 'package.json');
  upsertJSON(pkgPath, (pkg) => {
    const nextPkg = { ...pkg };

    if (!nextPkg.name) {
      nextPkg.name =
        path
          .basename(outputDir)
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-') || `vx-${templateName}-app`;
    }
    if (!nextPkg.private) {
      nextPkg.private = true;
    }

    const scripts = (nextPkg.scripts ?? {}) as Record<string, string>;
    const dependencies = (nextPkg.dependencies ?? {}) as Record<string, string>;
    const devDependencies = (nextPkg.devDependencies ?? {}) as Record<
      string,
      string
    >;

    nextPkg.scripts = { ...spec.scripts, ...scripts };
    const mergedDependencies = { ...spec.dependencies, ...dependencies };
    mergedDependencies['@vx3/vx'] = sdkDependency;
    nextPkg.dependencies = mergedDependencies;
    nextPkg.devDependencies = { ...spec.devDependencies, ...devDependencies };

    return nextPkg;
  });

  console.log(`Generated template/${templateName} in: ${outputDir}`);
  if (options.debugLocal) {
    console.log(`Using local SDK dependency: ${sdkDependency}`);
  }
  console.log('Next steps:');
  console.log(`  1) cd ${outputDir}`);
  console.log('  2) npm install');
  console.log('  3) npm run dev');
}

function printGenerateHelp(): void {
  console.log('Usage:');
  console.log('  vx3 generate list');
  console.log('  vx3 generate template/<react|vue> [targetDir] [--debug]');
  process.exit(0);
}

function parseGenerateOptions(rawArgs: string[]): GenerateOptions {
  const options: GenerateOptions = {
    targetDirArg: undefined,
    debugLocal: false,
  };

  for (const arg of rawArgs) {
    // Local source code loading for library debugging
    if (arg === '--debug') {
      options.debugLocal = true;
      continue;
    }

    if (!options.targetDirArg) {
      options.targetDirArg = arg;
    }
  }

  return options;
}

export async function handleGenerateCommand(args: string[]): Promise<void> {
  const action = args[0];

  if (!action || action === 'help' || action === '--help' || action === '-h') {
    printGenerateHelp();
    return;
  }

  if (action === 'list') {
    listGeneratableLibraries();
    process.exit(0);
  }

  // unknown subcommand, must be in form of template/<name>
  if (!action.startsWith('template/')) {
    throw new Error(`Unknown generate subcommand: ${action}`);
  }

  const templateName = action.slice('template/'.length) as TemplateName;
  if (!(templateName in TEMPLATE_SPECS)) {
    throw new Error(
      `Unknown template: ${templateName}. Use "vx3 generate list" to see available options.`
    );
  }

  const options = parseGenerateOptions(args.slice(1));
  generateTemplate(templateName, options);
  process.exit(0);
}
