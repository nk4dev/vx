import { startDashboard } from '../server/dashboard';

function getArgValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : undefined;
}

export function handleDashCommand(args: string[]): void {
  const host = getArgValue(args, '--host') || '127.0.0.1';
  const port = parseInt(getArgValue(args, '--port') || '4000', 10);
  const open = args.includes('--open');

  startDashboard({ host, port, open });
}
