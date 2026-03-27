import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertFileExists(relativePath: string): void {
  assert.equal(
    fs.existsSync(path.join(repoRoot, relativePath)),
    true,
    `Expected file to exist: ${relativePath}`,
  );
}

function assertContains(relativePath: string, expected: string): void {
  const source = read(relativePath);
  assert.equal(
    source.includes(expected),
    true,
    `Expected ${relativePath} to contain: ${expected}`,
  );
}

// Canonical route files.
assertFileExists('app/c/page.tsx');
assertFileExists('app/c/[collectionHandle]/page.tsx');
assertFileExists('app/p/[productHandle]/page.tsx');

// Legacy compatibility route files.
assertFileExists('app/shop/page.tsx');
assertFileExists('app/shop/[collection]/page.tsx');
assertFileExists('app/product/[handle]/page.tsx');

// Canonical route link generation.
assertContains('app/shop/page.tsx', 'href="/c"');
assertContains('app/shop/page.tsx', 'href={`/c/${collection.handle}`}');
assertContains('app/shop/page.tsx', 'href={`/p/${p.handle}`}');

assertContains('app/shop/[collection]/page.tsx', 'href="/c"');
assertContains('app/shop/[collection]/page.tsx', 'href={`/c/${entry.handle}`}');
assertContains('app/shop/[collection]/page.tsx', 'href={`/p/${product.handle}`}');

// Recovery flow should return through canonical product path, not demo route.
assertContains('app/configure-fit/page.tsx', "window.location.href = '/p/mtm-trouser-test-build';");

console.log('routing contract: regression checks passed');