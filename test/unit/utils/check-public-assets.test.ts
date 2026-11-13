import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const checker = resolve('check-public-assets.mjs');
let directory: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'ttg-public-assets-'));
  mkdirSync(join(directory, 'public', 'nested'), { recursive: true });
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

function checkAssets() {
  return spawnSync(process.execPath, [checker], { cwd: directory, encoding: 'utf8' });
}

describe('public asset credential check', () => {
  it('allows Firebase client configuration and ordinary assets', () => {
    writeFileSync(
      join(directory, 'public', 'firebase.json'),
      JSON.stringify({ apiKey: 'public-client-key', projectId: 'test-project' }),
    );
    writeFileSync(join(directory, 'public', 'nested', 'asset.txt'), 'public content');

    expect(checkAssets().status).toBe(0);
  });

  it('rejects nested service-account files without logging credential values', () => {
    writeFileSync(
      join(directory, 'public', 'nested', 'renamed.json'),
      JSON.stringify({ type: 'service_account', private_key: 'test-only-sensitive-value' }),
    );

    const result = checkAssets();

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Refusing to publish private key');
    expect(result.stderr).toContain('renamed.json');
    expect(result.stderr).not.toContain('test-only-sensitive-value');
  });

  it('rejects PEM keys regardless of file extension', () => {
    writeFileSync(
      join(directory, 'public', 'nested', 'asset.txt'),
      '-----BEGIN PRIVATE KEY-----\ntest-only-not-a-real-key\n-----END PRIVATE KEY-----',
    );

    expect(checkAssets().status).not.toBe(0);
  });
});
