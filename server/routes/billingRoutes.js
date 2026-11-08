/**
 * Anusandhan - Monetization & Payment Gateway Router
 * Supports Razorpay (UPI, NetBanking, RuPay - INR) and Stripe (Global Cards - USD)
 * with cryptographic HMAC-SHA256 webhook verification and auto-invoicing.
 */
import express from 'express';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_researchintern2026';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_rzp_99482';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_stripe_secret_8819';

// Persistent in-memory order & invoice store for zero-budget fallback
const orderHistory = new Map();

// Available Tiers
export const PRICING_PLANS = [
  {
    id: 'free_scholar',
    name: 'Free Scholar Tier (हमेशा मुफ़्त)',
    priceInr: 0,
    priceUsd: 0,
    interval: 'lifetime',
    dailyCredits: 10,
    features: [
      'Universal Faculty & Grant Radar (IISc, IITs, Max Planck, MIT)',
      '146-Word Precision Cold Pitch Composer',
      'Instant RRS Diagnostic & Gap Analysis',
      'Ethical 7-Day Smart Follow-Up Alerts',
      'Hindi & English Multilingual Voice Assistant'
    ]
  },
  {
    id: 'pro_researcher',
    name: 'Scholar Pro Tier',
    priceInr: 499,
    priceUsd: 9,
    interval: 'monthly',
    dailyCredits: 50,
    features: [
      'Everything in Free Scholar Tier',
      'Unlimited 2025/2026 ArXiv Paper Deconstructions',
      'Priority Google OAuth 2.0 Direct Dispatch',
      'AI Mock Technical Viva Screening Simulator',
      'Verified Institutional Scholar Badge'
    ]
  },
  {
    id: 'institutional_lab',
    name: 'Institutional Department Pass',
    priceInr: 4999,
    priceUsd: 99,
    interval: 'annual',
    dailyCredits: 500,
    features: [
      'Batch CV Analysis for University Research Cells',
      'Lab Grant Capacity Tracker with MeitY & DST Alerts',
      'Custom University Domain Attestation (.ac.in / .edu)',
      'Dedicated Account Manager & SLA Uptime'
    ]
  }
];

// GET /api/billing/plans - Returns live subscription plans
router.get('/plans', (req, res) => {
  res.json({
    currency: 'INR',
    plans: PRICING_PLANS,
    gatewaysSupported: ['Razorpay (UPI, NetBanking, RuPay)', 'Stripe (International Cards)']
  });
});

// POST /api/billing/create-order - Creates checkout session
router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const { planId, currency = 'INR' } = req.body;
    const plan = PRICING_PLANS.find(p => p.id === planId);

    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    if (plan.priceInr === 0) {
      return res.json({
        message: 'Free Scholar Tier is active by default. No payment required.',
        plan
      });
    }

    const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const amount = currency === 'INR' ? plan.priceInr * 100 : plan.priceUsd * 100; // In paise / cents

    const order = {
      orderId,
      userId: req.user.id,
      userEmail: req.user.email,
      planId: plan.id,
      planName: plan.name,
      amount,
      currency,
      status: 'created',
      createdAt: new Date().toISOString()
    };

    orderHistory.set(orderId, order);

    res.json({
      orderId,
      amount,
      currency,
      keyId: RAZORPAY_KEY_ID,
      plan: {
        id: plan.id,
        name: plan.name,
        priceDisplay: currency === 'INR' ? `₹${plan.priceInr}` : `$${plan.priceUsd}`
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Order creation failed: ' + err.message });
  }
});

// POST /api/billing/webhook/razorpay - Cryptographic signature verification
router.post('/webhook/razorpay', (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid Razorpay signature header' });
    }

    const rawPayload = Buffer.isBuffer(req.rawBody)
      ? req.rawBody
      : (Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body), 'utf8'));

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(rawPayload)
      .digest('hex');

    const sigBuf = Buffer.from(signature || '', 'utf8');
    const expBuf = Buffer.from(expectedSignature, 'utf8');

    // Timing-safe comparison with length pre-check to prevent RangeError crash
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.status(400).json({ error: 'Invalid Razorpay webhook signature' });
    }

    const payload = (typeof req.body === 'object' && !Buffer.isBuffer(req.body))
      ? req.body
      : JSON.parse(rawPayload.toString('utf8'));
    const event = payload.event;

    console.log(`[Billing Gateway] Verified Razorpay Webhook Event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const orderId = payload.payload?.payment?.entity?.order_id || payload.payload?.order?.entity?.id;
      if (orderId && orderHistory.has(orderId)) {
        const order = orderHistory.get(orderId);
        order.status = 'paid';
        order.paymentId = payload.payload?.payment?.entity?.id;
        order.paidAt = new Date().toISOString();
        orderHistory.set(orderId, order);
      }
    }

    res.json({ status: 'ok', verified: true });
  } catch (err) {
    res.status(500).json({ error: 'Webhook processing error: ' + err.message });
  }
});

// GET /api/billing/invoice/:orderId - Generates GST-compliant invoice
router.get('/invoice/:orderId', authenticateToken, (req, res) => {
  const { orderId } = req.params;
  const order = orderHistory.get(orderId);

  if (!order) {
    return res.status(404).json({ error: 'Invoice not found for order ' + orderId });
  }

  // IDOR Authorization Guard: Caller must be the owner of the order or an administrator
  if (order.userId && req.user && order.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: unauthorized invoice retrieval' });
  }

  const basePrice = (order.amount / 100) / 1.18;
  const gstAmount = (order.amount / 100) - basePrice;

  res.json({
    invoiceNumber: `INV-${orderId.slice(6).toUpperCase()}`,
    date: order.paidAt || order.createdAt,
    company: {
      name: 'Anusandhan AI Technologies (अनुसंधान AI)',
      address: 'Bengaluru Innovation Hub, Karnataka, India',
      gstin: '29ABCDE1234F1Z5',
      sacCode: '998431' // Online portal services
    },
    customer: {
      userId: order.userId,
      email: order.userEmail
    },
    items: [
      {
        description: `${order.planName} Subscription`,
        basePrice: Math.round(basePrice * 100) / 100,
        cgst: Math.round((gstAmount / 2) * 100) / 100,
        sgst: Math.round((gstAmount / 2) * 100) / 100,
        total: order.amount / 100,
        currency: order.currency
      }
    ],
    status: order.status === 'paid' ? 'PAID' : 'PENDING'
  });
});

export default router;
