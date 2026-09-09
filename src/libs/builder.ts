import * as fs from 'fs';
import * as path from 'path';

/** The package.json written into a freshly scaffolded vx3 project. */
export function buildPackageJson(projectDir: string): Record<string, unknown> {
  return {
    name: path.basename(projectDir),
    version: '0.1.0',
    description: 'A brief description of your package',
    main: 'index.js',
    scripts: {
      dev: 'vx3 api --debug',
    },
    author: 'Your Name',
    license: 'ISC',
    dependencies: {},
    devDependencies: {
      typescript: '^5.8.3',
    },
  };
}

export function createPackageJson(projectDir: string): void {
  const packageJsonPath = path.join(projectDir, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    console.log(`package.json already exists at ${packageJsonPath}`);
    return;
  }

  fs.writeFileSync(
    packageJsonPath,
    `${JSON.stringify(buildPackageJson(projectDir), null, 2)}\n`,
    'utf8'
  );
  console.log(`Created package.json at ${packageJsonPath}`);
}
