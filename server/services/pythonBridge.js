/**
 * Python AI Microservice Bridge.
 * Communicates with FastAPI backend (http://127.0.0.1:8000/api/v1)
 * providing synchronous RPC and resilient circuit-breaking.
 */
import http from 'http';
import https from 'https';
import axios from 'axios';

let rawPythonUrl = process.env.PYTHON_SERVICE_URL || process.env.FASTAPI_BACKEND_URL || 'http://127.0.0.1:8000/api/v1';
if (rawPythonUrl && !rawPythonUrl.startsWith('http://') && !rawPythonUrl.startsWith('https://')) {
  rawPythonUrl = `http://${rawPythonUrl}`;
}
const PYTHON_SERVICE_URL = rawPythonUrl.endsWith('/api/v1')
  ? rawPythonUrl
  : `${rawPythonUrl.replace(/\/+$/, '')}/api/v1`;

// Persistent connection pools to eliminate ephemeral port churn under high concurrency
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 50,
  keepAliveMsecs: 30000,
  timeout: 5000
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 50,
  keepAliveMsecs: 30000,
  timeout: 5000
});

const client = axios.create({
  baseURL: PYTHON_SERVICE_URL,
  timeout: 6000,
  httpAgent,
  httpsAgent,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export const PythonBridge = {
  /**
   * Health check to Python FastAPI microservice
   */
  async checkHealth() {
    try {
      const res = await client.get('/audit/status');
      return { status: 'healthy', data: res.data };
    } catch (err) {
      return { status: 'unavailable', error: err.message };
    }
  },

  /**
   * Queries Python scholar and bibliometric search
   */
  async searchProfessors(params = {}) {
    try {
      const res = await client.get('/faculty', { params });
      return res.data;
    } catch (err) {
      console.warn('Python faculty search fallback:', err.message);
      return null;
    }
  },

  /**
   * Delegates academic draft generation to Python 140-word engine
   */
  async generateOutreachDraft(payload) {
    try {
      const res = await client.post('/outreach/draft', payload);
      return res.data;
    } catch (err) {
      console.warn('Python draft generation fallback:', err.message);
      return null;
    }
  },

  /**
   * Enqueues cold outreach into Python anti-spam jitter queue
   */
  async enqueueOutreach(payload, studentId = 'student_active') {
    try {
      const res = await client.post('/outreach/enqueue', payload, {
        headers: { 'X-Student-ID': studentId }
      });
      return res.data;
    } catch (err) {
      console.warn('Python jitter queue fallback:', err.message);
      return null;
    }
  },

  /**
   * Processes voice turn via Sarvam AI / Gemini Live router in Python
   */
  async processVoiceTurn(payload) {
    try {
      const res = await client.post('/voice/turn', payload);
      return res.data;
    } catch (err) {
      console.warn('Python voice router fallback:', err.message);
      return null;
    }
  },

  /**
   * Deconstructs paper and generates 146-word precision pitch
   */
  async deconstructPaper(payload) {
    try {
      const res = await client.post('/agents/paper-pitch', payload);
      return res.data;
    } catch (err) {
      console.warn('Python paper deconstruction fallback:', err.message);
      return null;
    }
  },

  /**
   * Evaluates mock academic interview viva turn
   */
  async mockInterview(payload) {
    try {
      const res = await client.post('/agents/mock-interview', payload);
      return res.data;
    } catch (err) {
      console.warn('Python mock interview fallback:', err.message);
      return null;
    }
  },

  /**
   * Audits student profile and calculates RRS pillars + 14-day sprint
   */
  async diagnoseCV(payload) {
    try {
      const res = await client.post('/agents/cv-diagnostic', payload);
      return res.data;
    } catch (err) {
      console.warn('Python CV diagnostic fallback:', err.message);
      return null;
    }
  },

  /**
   * Scans grant telemetry and calculates mentor score
   */
  async scanGrantRadar(payload) {
    try {
      const res = await client.post('/agents/grant-radar', payload);
      return res.data;
    } catch (err) {
      console.warn('Python grant radar fallback:', err.message);
      return null;
    }
  }
};
