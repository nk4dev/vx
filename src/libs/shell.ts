import { spawn } from 'child_process';

export function shell(
  command: string,
  args: string[] = [],
  options: { cwd?: string } = {}
) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    cwd: options.cwd || process.cwd(),
  });

  child.on('error', (err: Error) => {
    console.error(`Error executing command "${command}":`, err.message);
  });

  child.on('exit', (code: number) => {
    if (code !== 0) {
      console.error(`Command "${command}" exited with code ${code}`);
    }
  });
}

export const shellAsync = (
  command: string,
  args: string[] = [],
  options: { cwd?: string } = {}
) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: options.cwd || process.cwd(),
    });

    child.on('error', (err: Error) => {
      reject(`Error executing command "${command}": ${err.message}`);
    });

    child.on('exit', (code: number) => {
      if (code !== 0) {
        reject(`Command "${command}" exited with code ${code}`);
      } else {
        resolve(`Command "${command}" executed successfully`);
      }
    });
  });
};

export const argsToString = (args: string[]): string => {
  return args.map((arg) => (arg.includes(' ') ? `"${arg}"` : arg)).join(' ');
};
