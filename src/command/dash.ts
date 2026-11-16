import { startDashboard } from '../server/dashboard';

function getArgValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : undefined;
}

export function handleDashCommand(args: string[]): void {
  const host = getArgValue(args, '--host') || '127.0.0.1';
  const port = parseInt(getArgValue(args, '--port') || '4000', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Invalid --port: expected an integer between 1 and 65535');
    process.exitCode = 1;
    return;
  }
  const open = args.includes('--open');

  startDashboard({ host, port, open });
}
