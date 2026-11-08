#!/usr/bin/env node
/**
 * Master Adversarial Empirical Test Runner for Milestone 1
 * Concurrency, Security Boundaries, CORS, Secrets Fail-Fast, and Helmet Headers
 */

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

console.log('================================================================');
console.log('   ANUSANDHAN MILESTONE 1: EMPIRICAL ADVERSARIAL CHALLENGE RUNNER');
console.log('================================================================\n');

const suites = [
  {
    name: '1. Fail-Fast Production Secrets Verification',
    script: 'tests/adversarial/failfast_production_secrets.test.mjs',
    useNodeTest: false
  },
  {
    name: '2. CORS & Preflight Attack Challenge (Express + FastAPI)',
    script: 'tests/adversarial/cors_preflight_challenge.test.mjs',
    useNodeTest: true
  },
  {
    name: '3. Helmet Security Headers Challenge (All Response Types)',
    script: 'tests/adversarial/helmet_headers_challenge.test.mjs',
    useNodeTest: true
  },
  {
    name: '4. High-Concurrency Auth Stress & Rate-Limiter Burst',
    script: 'tests/adversarial/auth_concurrency_stress.test.mjs',
    useNodeTest: true
  }
];

let allPassed = true;
const summary = [];

for (const suite of suites) {
  console.log(`\n----------------------------------------------------------------`);
  console.log(`RUNNING: ${suite.name}`);
  console.log(`----------------------------------------------------------------`);

  const args = suite.useNodeTest ? ['--test', suite.script] : [suite.script];
  const startTime = Date.now();
  const proc = spawnSync('node', args, {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env
  });
  const duration = Date.now() - startTime;
  const passed = proc.status === 0;

  if (!passed) allPassed = false;
  summary.push({
    name: suite.name,
    passed,
    exitCode: proc.status,
    durationMs: duration
  });
}

console.log('\n================================================================');
console.log('                 ADVERSARIAL CHALLENGE SUMMARY');
console.log('================================================================');
for (const s of summary) {
  const statusStr = s.passed ? '✔ PASSED' : '✖ FAILED';
  console.log(` ${statusStr} [${s.durationMs}ms] - ${s.name}`);
}
console.log('================================================================');

if (allPassed) {
  console.log('\nFINAL ADVERSARIAL VERDICT: APPROVE (Zero bugs detected across all 4 empirical attack surfaces)\n');
  process.exit(0);
} else {
  console.log('\nFINAL ADVERSARIAL VERDICT: REQUEST_CHANGES (Regressions or vulnerabilities detected)\n');
  process.exit(1);
}
