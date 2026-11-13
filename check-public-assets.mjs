import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const privateKeyPattern = /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----|"private_key"\s*:/;

for (const entry of readdirSync('public', { recursive: true, withFileTypes: true })) {
  const file = join(entry.parentPath, entry.name);

  if (entry.isSymbolicLink()) {
    throw new Error(`Refusing to publish symbolic link: ${file}. Use a regular public asset.`);
  }

  if (entry.isFile() && privateKeyPattern.test(readFileSync(file, 'utf8'))) {
    throw new Error(
      `Refusing to publish private key in ${file}. Keep server credentials outside public assets.`,
    );
  }
}
