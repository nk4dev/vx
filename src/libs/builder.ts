import * as fs from 'fs';
import * as path from 'path';
import npm_json from '../../package.json';

const SDK_VERSION = npm_json.version;

export function createPackageJson(projectDir: string) {
  const projectname = path.basename(projectDir);
  const npmjsontemplate = `{
  "name": "${projectname}",
    "version": "0.1.0",
    "description": "A brief description of your package",
    "main": "index.js",
    "scripts": {
      "dev": "vx3 serve --debug"
    },
    "author": "Your Name",
    "license": "ISC",
    "dependencies": {
      "@varius-dev/vx": "https://github.com/nk4dev/vx.git"
    },
    "devDependencies": {
      "typescript": "^4.0.0"
    }
}`;

  const packageJsonPath = path.join(projectDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    fs.writeFileSync(packageJsonPath, npmjsontemplate, 'utf8');
    console.log(`Created package.json at ${packageJsonPath}`);
  } else {
    console.log(`package.json already exists at ${packageJsonPath}`);
  }
}
