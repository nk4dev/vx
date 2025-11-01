import * as fs from 'fs';
import * as path from 'path';
import { createPackageJson } from '../libs/builder';

const args = process.argv.slice(2);

// set project name from cli tool or shell arguments
export function init(
  projectName?: string
) {
  //const createName = args[1] || projectName;
  if (!projectName) {
    if (args.length > 0) {
      projectName = args[1];
    } else {
      projectName = 'my-vx-project';
    }
  }
  const createName = projectName;
  const projectdir = process.cwd()
  const projectDirPath = path.join(projectdir, createName || 'my-vx-project');
  if (!fs.existsSync(projectDirPath)) {
    fs.mkdirSync(projectDirPath, { recursive: true });
    // Copy the template files to the new project directory
    const templateDir = path.join(__dirname, '../../template');
    const files = fs.readdirSync(templateDir);
    // create a package.json file for vx project
    // if it does not exist
    createPackageJson(projectName);
    files.forEach((file) => {
      const srcFilePath = path.join(templateDir, file);
      const destFilePath = path.join(projectDirPath, file);
      fs.copyFileSync(srcFilePath, destFilePath);
    });
    console.log(`Directory created at: ${projectDirPath}`);
  } else {
    console.log(`Directory already exists at: ${projectDirPath}`);
  }
}
