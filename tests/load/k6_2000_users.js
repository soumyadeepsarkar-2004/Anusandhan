/**
 * k6 Concurrency Benchmark: 1,000 to 2,000 Concurrent Active Users
 * ResearchIntern Pro (अनुसंधान AI) Zero-Budget Production Test
 * 
 * Run with:
 *   k6 run tests/load/k6_2000_users.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const cachedLatency = new Trend('cached_latency_ms');
const apiLatency = new Trend('api_latency_ms');
const errorRate = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '30s', target: 500 },   // Warm-up to 500 concurrent users
    { duration: '1m', target: 2000 },   // Ramp up to 2,000 concurrent users
    { duration: '2m', target: 2000 },   // Sustain 2,000 concurrent users peak load
    { duration: '30s', target: 0 },     // Ramp-down
  ],
  thresholds: {
    'http_req_failed': ['rate<0.01'],    // Error rate must be under 1%
    'cached_latency_ms': ['p(95)<50'],   // 95% of cached reads under 50ms
    'api_latency_ms': ['p(95)<150'],     // 95% of API requests under 150ms
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://127.0.0.1:5000';

export default function () {
  const rand = Math.random();

  // 1. 50% traffic: High-frequency faculty and grant directory queries (Redis Cached)
  if (rand < 0.50) {
    const scope = Math.random() > 0.5 ? 'national' : 'global';
    const res = http.get(`${BASE_URL}/api/faculty?scope=${scope}`);
    cachedLatency.add(res.timings.duration);
    
    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response has faculty': (r) => r.body.includes('Prof.'),
      'cache header present': (r) => r.headers['X-Cache'] === 'HIT' || r.headers['X-Cache'] === 'MISS',
    });
    errorRate.add(!success);

  // 2. 25% traffic: Health checks and platform telemetry
  } else if (rand < 0.75) {
    const res = http.get(`${BASE_URL}/api/health`);
    apiLatency.add(res.timings.duration);
    
    const success = check(res, {
      'gateway operational': (r) => r.status === 200 && r.body.includes('operational'),
    });
    errorRate.add(!success);

  // 3. 15% traffic: Asynchronous job queue submission (BullMQ / In-Memory Worker)
  } else if (rand < 0.90) {
    const payload = JSON.stringify({
      type: 'paper_deconstruction',
      payload: {
        paper: { title: 'Scalable Neural Model Inference Benchmark', venue: 'ICML 2025' },
        student: { fullName: 'Aarav Sharma' }
      }
    });

    const res = http.post(`${BASE_URL}/api/jobs`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    apiLatency.add(res.timings.duration);

    const success = check(res, {
      'job accepted (202)': (r) => r.status === 202,
      'has jobId': (r) => r.body.includes('job_'),
    });
    errorRate.add(!success);

  // 4. 10% traffic: Multilingual Voice turn queries
  } else {
    const payload = JSON.stringify({
      user_input: 'Bhai mera status kya hai?',
      voice_engine: 'sarvam'
    });

    const res = http.post(`${BASE_URL}/api/voice/turn`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    apiLatency.add(res.timings.duration);

    const success = check(res, {
      'voice turn resolved': (r) => r.status === 200,
      'contains agent response': (r) => r.body.includes('agent_text_response'),
    });
    errorRate.add(!success);
  }

  sleep(0.5 + Math.random() * 0.5); // 500ms - 1000ms user think time
}
