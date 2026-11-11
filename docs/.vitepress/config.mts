import { defineConfig } from 'vitepress';

export default defineConfig({
  base: '/Anusandhan/',
  title: "Anusandhan",
  description: "Autonomous AI Platform for Global Research Internships & Academic Outreach",
  lang: 'en-US',
  head: [
    ['link', { rel: 'icon', href: '/brand-emblem.png' }],
    ['meta', { name: 'theme-color', content: '#F59E0B' }]
  ],
  themeConfig: {
    siteTitle: 'Anusandhan Docs',
    logo: '/brand-emblem.png',
    nav: [
      { text: 'Overview', link: '/overview' },
      { text: 'Onboarding', link: '/onboarding' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'Concurrency', link: '/concurrency' },
      { text: 'Security', link: '/security' },
      { text: 'API Reference', link: '/api-reference' },
      { text: 'Deployment', link: '/deployment' }
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Platform Overview', link: '/overview' },
          { text: 'System Architecture', link: '/architecture' },
          { text: 'Developer & Scholar Onboarding', link: '/onboarding' }
        ]
      },
      {
        text: 'Production Engineering',
        items: [
          { text: '1,000-User Concurrency', link: '/concurrency' },
          { text: 'Security & Anti-Abuse Audit', link: '/security' },
          { text: 'Deployment & Orchestration', link: '/deployment' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'REST & Voice API Reference', link: '/api-reference' }
        ]
      }
    ],
    footer: {
      message: 'Released under Proprietary Academic License. Calibrated for 1,000+ Concurrent Scholars.',
      copyright: 'Copyright © 2026-2027 Anusandhan · Open Research Initiative led by Soumyadeep Sarkar'
    },
    search: {
      provider: 'local'
    }
  }
});
