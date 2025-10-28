import * as fs from 'fs';
import * as path from 'path';
import { createPackageJson } from '../libs/builder';

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
      // Copy the template files to the new project directory
      const templateDir = path.join(__dirname, '../../packages/template');
      if (fs.existsSync(templateDir)) {
        const files = fs.readdirSync(templateDir);
        // create a package.json file for vx project
        // pass the full project directory path so createPackageJson writes to the right place
        createPackageJson(projectDirPath);
        files.forEach((file) => {
          const srcFilePath = path.join(templateDir, file);
          const destFilePath = path.join(projectDirPath, file);
          fs.copyFileSync(srcFilePath, destFilePath);
        });
      } else {
        // template directory missing; still create package.json
        createPackageJson(projectDirPath);
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
