import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  clearCloudCredentials,
  loadCloudCredentials,
  loginToCloud,
  syncProjectToCloud,
  VxCloudError,
} from '../core/cloud';

function readFlag(argv: string[], names: string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (names.includes(token)) {
      return argv[i + 1];
    }
    for (const name of names) {
      if (token.startsWith(`${name}=`)) {
        return token.slice(name.length + 1);
      }
    }
  }
  return undefined;
}

function inferProjectName(cwd: string = process.cwd()): string {
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { name?: string };
      if (pkg.name && typeof pkg.name === 'string') {
        return pkg.name;
      }
    } catch {
      // fall back to directory name
    }
  }
  return path.basename(cwd);
}

export async function handleLoginCommand(argv: string[]): Promise<void> {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`vx3 login — authenticate with a vx3 cloud server

Usage:
  vx3 login --email <email> --password <password> [--server <url>]
`);
    return;
  }

  const email = readFlag(argv, ['--email', '-e']);
  const password = readFlag(argv, ['--password', '-p']);
  const serverUrl = readFlag(argv, ['--server', '-s']);

  if (!email || !password) {
    console.error('vx3 login: --email and --password are required.');
    process.exitCode = 1;
    return;
  }

  try {
    const creds = await loginToCloud({ serverUrl, email, password });
    console.log(`Logged in to ${creds.serverUrl} as ${creds.email}`);
  } catch (err) {
    const msg = err instanceof VxCloudError ? err.message : String(err);
    console.error(`vx3 login error: ${msg}`);
    process.exitCode = 1;
  }
}

export function handleLogoutCommand(): void {
  const removed = clearCloudCredentials();
  if (removed) {
    console.log('Logged out from vx3 cloud.');
  } else {
    console.log('No active vx3 cloud session found.');
  }
}

export async function handleSyncCommand(argv: string[]): Promise<void> {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`vx3 sync — sync the current local project to vx3 cloud

Usage:
  vx3 sync [--name <projectName>] [--owner <ownerName>] [--email <ownerEmail>] [--server <url>]
`);
    return;
  }

  const creds = loadCloudCredentials();
  const serverUrl = readFlag(argv, ['--server', '-s']);
  const projectName = readFlag(argv, ['--name', '-n']) || inferProjectName();
  const ownerEmail = readFlag(argv, ['--email', '-e']) || creds?.email;
  const ownerName =
    readFlag(argv, ['--owner', '-o']) || (ownerEmail ? ownerEmail.split('@')[0] : undefined);

  if (!ownerEmail || !ownerName) {
    console.error(
      'vx3 sync: not logged in and --email / --owner were not provided. Run "vx3 login" first.'
    );
    process.exitCode = 1;
    return;
  }

  try {
    const result = await syncProjectToCloud({
      serverUrl,
      projectName,
      ownerName,
      ownerEmail,
    });
    console.log(`Synced project "${projectName}" to vx3 cloud.`);
    if (result && typeof result === 'object' && 'project' in result) {
      const project = (result as { project?: { id?: string } }).project;
      if (project?.id) {
        console.log(`Project ID: ${project.id}`);
      }
    }
  } catch (err) {
    const msg = err instanceof VxCloudError ? err.message : String(err);
    console.error(`vx3 sync error: ${msg}`);
    process.exitCode = 1;
  }
}
