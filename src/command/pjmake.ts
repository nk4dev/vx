import * as fs from 'fs';
import * as path from 'path';
import { createPackageJson } from '../libs/builder';

// Recursively copy a directory (preserves subdirectories and files)
function copyRecursiveSync(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    // ensure destination directory exists
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      copyRecursiveSync(srcPath, destPath);
    }
  } else if (stat.isFile()) {
    // copy file (overwrite if exists)
    fs.copyFileSync(src, dest);
  } else {
    // For other types (symlink, socket, etc), attempt to copy as file where possible
    try {
      fs.copyFileSync(src, dest);
    } catch (e) {
      // ignore unsupported file types
    }
  }
}

const args = process.argv.slice(2);

// set project name from cli tool or shell arguments
export function init(projectName?: string) {
  try {
    // Determine project name from argument, interactive call, or CLI
    if (!projectName) {
      const argv = process.argv.slice(2);
      if (argv[0] === 'init') {
        projectName = argv[1];
      } else {
        projectName = argv[0];
      }
    }
    if (!projectName) projectName = 'my-vx-project';

    const createName = projectName;
    const projectdir = process.cwd();
    const projectDirPath = path.join(projectdir, createName || 'my-vx-project');

    if (!fs.existsSync(projectDirPath)) {
      fs.mkdirSync(projectDirPath, { recursive: true });
      // Locate the template directory in several likely locations (dev vs packaged)
      const candidateTemplateDirs = [
        // when running from dist (published package): packageRoot/packages/template
        path.resolve(__dirname, '../../packages/template'),
        // when running via ts-node or different structure, try moving one more up
        path.resolve(__dirname, '../../../packages/template'),
        // when running from monorepo root during development
        path.resolve(process.cwd(), 'packages/template'),
      ];

      const templateDir = candidateTemplateDirs.find((p) => fs.existsSync(p));

      if (templateDir) {
        // create a package.json file for vx project
        // pass the full project directory path so createPackageJson writes to the right place
        createPackageJson(projectDirPath);
        // copy the entire template directory recursively into the new project
        copyRecursiveSync(templateDir, projectDirPath);
      } else {
        // template directory missing; still create package.json
        createPackageJson(projectDirPath);
        console.warn('Warning: template directory not found; created minimal project with package.json only.');
      }
      console.log(`Directory created at: ${projectDirPath}`);
    } else {
      console.log(`Directory already exists at: ${projectDirPath}`);
    }
  } catch (error) {
    console.error(`Failed to initialize project: ${(error as Error).message}`);
    process.exit(1);
  }
}
