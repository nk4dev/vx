import * as fs from 'fs';
import * as path from 'path';
import { SDK_VERSION } from '../config';

export function createPackageJson(projectDir: string) {
  const projectname = path.basename(projectDir);
  const npmjsontemplate = `{
  "name": "${projectname}",
    "version": "0.1.0",
    "description": "A brief description of your package",
    "main": "index.js",
    "scripts": {
      "start": "ts-node src/index.ts",
      "build": "tsc"    
    },
    "author": "Your Name",
    "license": "ISC",
    "dependencies": {
      "@nk4dev/vx": "^${SDK_VERSION}"
    },
    "devDependencies": {
      "typescript": "^4.0.0",
      "ts-node": "^10.0.0"
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
