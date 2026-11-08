export interface PricingPlan {
  id: string;
  name: string;
  badgeText?: string;
  priceInr: string;
  priceUsd: string;
  periodText: string;
  description: string;
  features: string[];
  ctaText: string;
  popular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free-scholar',
    name: 'Free Scholar Trial',
    priceInr: '₹0',
    priceUsd: '$0',
    periodText: 'forever free',
    description: 'Perfect for students beginning their research exploration and checking fellowship dates.',
    features: [
      '5 Verified Professor Matches (with h-index & citations)',
      '3 Literature-Grounded AI Cold Email Drafts',
      'Complete Global Fellowships Calendar (DAAD, CERN, Mitacs)',
      'Basic Research Readiness Score (RRS) Assessment',
      'Native Web Speech Multilingual Voice Assistant (15 queries/day)'
    ],
    ctaText: 'Current Plan',
    popular: false
  },
  {
    id: 'starter-credits',
    name: '50 Match Credit Pack',
    badgeText: 'MOST FLEXIBLE',
    priceInr: '₹499',
    priceUsd: '$18',
    periodText: 'one-time (credits never expire)',
    description: 'Target a focused list of 50 high-affinity faculty labs with verified grants.',
    features: [
      '50 Verified Faculty Matches across 12,000+ labs',
      '50 Paper-Grounded Cold Outreach Drafts',
      'Active Grant Detection (NSF/NIH/Horizon Europe)',
      'Student Mentorship Ratio Transparency',
      'Smart 7-Day Follow-Up Bump Generator (User-Approved)',
      'Export matches to JSON / CSV'
    ],
    ctaText: 'Buy 50 Credits',
    popular: true
  },
  {
    id: 'pro-season',
    name: 'Pro Season Pass',
    badgeText: 'BEST VALUE · 4 MONTHS',
    priceInr: '₹1,299',
    priceUsd: '$39',
    periodText: 'for full summer/winter cycle',
    description: 'End-to-end autonomous research application suite for ambitious applicants.',
    features: [
      'Unlimited AI Faculty Matching & Paper Citations',
      'Sarvam AI Bulbul & Gemini Live Voice Coaching',
      'Automated Anti-Spam Jitter Queue & Pacing Safeguards',
      'Real-Time 5-Minute Screen Telemetry & Open Tracker',
      'Mock PI Technical Voice Interview Simulator',
      'SOP & Cover Letter Tailoring for DAAD & Charpak'
    ],
    ctaText: 'Get Pro Season Pass',
    popular: false
  }
];
