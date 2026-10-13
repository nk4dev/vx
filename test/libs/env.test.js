'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { readEnvVar } = require('../../dist/libs/env');

const NAME = 'VX_TEST_ENV_VAR';
let cwd;

beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vx-env-'));
  delete process.env[NAME];
});
afterEach(() => {
  fs.rmSync(cwd, { recursive: true, force: true });
  delete process.env[NAME];
});

const writeEnv = (body) => fs.writeFileSync(path.join(cwd, '.env'), body);

describe('readEnvVar()', () => {
  it('returns undefined without a .env file', () => {
    expect(readEnvVar(NAME, cwd)).toBeUndefined();
  });

  it('prefers the real environment over .env', () => {
    process.env[NAME] = 'from-env';
    writeEnv(`${NAME}=from-file\n`);
    expect(readEnvVar(NAME, cwd)).toBe('from-env');
  });

  it.each([
    [`${NAME}=abc`, 'abc'],
    [`OTHER=1\n${NAME}=abc\n`, 'abc'],
    [`${NAME}="a b"`, 'a b'],
    [`${NAME}='abc'`, 'abc'],
    [`export ${NAME}=abc`, 'abc'],
    [`${NAME} = abc # comment`, 'abc'],
    [`${NAME}=abc\r\n`, 'abc'],
  ])('parses %j', (body, expected) => {
    writeEnv(body);
    expect(readEnvVar(NAME, cwd)).toBe(expected);
  });

  it.each([`${NAME}=`, `# ${NAME}=abc`, `${NAME}_X=abc`])(
    'treats %j as unset',
    (body) => {
      writeEnv(body);
      expect(readEnvVar(NAME, cwd)).toBeUndefined();
    }
  );
});
