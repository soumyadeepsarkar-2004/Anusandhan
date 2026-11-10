import { spawnSync } from 'child_process';
import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const serverDir = path.resolve(rootDir, 'server');

console.log('[Adversarial Test] Starting Fail-Fast Production Secrets Verification...');

export async function runFailFastTests() {
  const results = [];

  // 1. Unset JWT_SECRET in production mode
  console.log('  -> Test 1: NODE_ENV=production with unset JWT_SECRET (production container simulation)');
  {
    const env = { ...process.env, NODE_ENV: 'production' };
    delete env.JWT_SECRET;

    const start = Date.now();
    const proc = spawnSync('node', ['server/server.js'], {
      env,
      cwd: rootDir,
      encoding: 'utf8',
      timeout: 10000
    });
    const duration = Date.now() - start;

    console.log(`     Exit Code: ${proc.status}, Duration: ${duration}ms`);
    assert.strictEqual(proc.status, 1, `Expected exit code 1, got ${proc.status}`);
    const output = (proc.stdout || '') + (proc.stderr || '');
    assert.ok(
      output.includes('FATAL: JWT_SECRET') || output.includes('missing in production mode'),
      `Expected fatal JWT_SECRET error message, got: ${output}`
    );
    results.push({ name: 'Unset JWT_SECRET in production', passed: true, exitCode: proc.status, duration });
    console.log('     ✔ Verified: Immediately halts execution with status code 1');
  }

  // 2. Empty string JWT_SECRET in production mode
  console.log('  -> Test 2: NODE_ENV=production with empty JWT_SECRET ("")');
  {
    const env = { ...process.env, NODE_ENV: 'production', JWT_SECRET: '' };

    const start = Date.now();
    const proc = spawnSync('node', ['server/server.js'], {
      env,
      cwd: rootDir,
      encoding: 'utf8',
      timeout: 10000
    });
    const duration = Date.now() - start;

    console.log(`     Exit Code: ${proc.status}, Duration: ${duration}ms`);
    assert.strictEqual(proc.status, 1, `Expected exit code 1, got ${proc.status}`);
    const output = (proc.stdout || '') + (proc.stderr || '');
    assert.ok(
      output.includes('FATAL: JWT_SECRET') || output.includes('missing in production mode'),
      `Expected fatal JWT_SECRET error message, got: ${output}`
    );
    results.push({ name: 'Empty string JWT_SECRET in production', passed: true, exitCode: proc.status, duration });
    console.log('     ✔ Verified: Immediately halts execution with status code 1');
  }

  // 3. Negative control: Valid JWT_SECRET in production mode
  console.log('  -> Test 3: Negative Control — NODE_ENV=production with configured JWT_SECRET');
  {
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      JWT_SECRET: 'production_valid_high_entropy_secret_key_2026_test'
    };

    // Syntax/import check to verify it does not exit code 1 on initialization
    const proc = spawnSync('node', ['-e', `
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'production_valid_high_entropy_secret_key_2026_test';
      import('./server/server.js').then(() => {
        console.log('[OK] Server module loaded successfully without exit 1');
        process.exit(0);
      }).catch(err => {
        console.error(err);
        process.exit(2);
      });
    `], {
      env,
      cwd: rootDir,
      encoding: 'utf8',
      timeout: 5000
    });

    console.log(`     Exit Code: ${proc.status}`);
    assert.strictEqual(proc.status, 0, `Expected clean load code 0, got ${proc.status}. Stderr: ${proc.stderr}`);
    results.push({ name: 'Valid JWT_SECRET in production does not halt', passed: true, exitCode: proc.status });
    console.log('     ✔ Verified: Passes past fatal guard when JWT_SECRET is provided');
  }

  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runFailFastTests().then(() => {
    console.log('\n[Adversarial Test] Fail-Fast Suite Verdict: ALL 3 PASSED ✔\n');
  }).catch((err) => {
    console.error('\n[Adversarial Test] Fail-Fast Suite Verdict: FAILED ❌\n', err);
    process.exit(1);
  });
}
