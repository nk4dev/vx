// Ambient declarations to satisfy older @types/glob / @types/minimatch expectations
// Provides minimal shape for IOptions and IMinimatch used by @types/glob
declare module 'minimatch' {
  export interface IOptions {
    [key: string]: any;
  }

  export interface IMinimatch {
    [key: string]: any;
  }

  export class Minimatch {
    constructor(pattern: string, options?: IOptions);
    makeRe(): RegExp | false;
    match(target: string, partial?: boolean): boolean;
  }

  export function minimatch(target: string, pattern: string, options?: IOptions): boolean;
}

export {};
