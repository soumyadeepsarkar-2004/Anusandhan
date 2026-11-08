import { ActivityFeedItem } from '../types';

export const INITIAL_ACTIVITY_FEED: ActivityFeedItem[] = [
  {
    id: 'act-feed-1',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    relativeTime: '4m ago',
    type: 'paper_alert',
    title: 'ArXiv Feed Ingestion: Efficient AI Computing',
    description: 'HAN Lab (MIT EECS) preprint indexed into matching corpus. Model compression and on-device inference keywords updated.',
    badgeText: 'Live Ingestion',
    badgeColor: 'purple'
  },
  {
    id: 'act-feed-2',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    relativeTime: '12m ago',
    type: 'deadline_alert',
    title: 'Science Academies SRFP 2027 Window Verified',
    description: 'IASc Bengaluru, INSA, and NASI official portal announced application window with round-trip train fare and living stipend.',
    badgeText: 'Portal Active',
    badgeColor: 'cyan'
  },
  {
    id: 'act-feed-3',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    relativeTime: '25m ago',
    type: 'grant_alert',
    title: 'MeitY Trustworthy AI Grant Capacity Confirmed',
    description: 'IISc CSA Department active funding allocation validated for undergraduate summer researchers and project fellows.',
    badgeText: 'Active Grant',
    badgeColor: 'amber'
  },
  {
    id: 'act-feed-4',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    relativeTime: '45m ago',
    type: 'deadline_alert',
    title: 'DAAD WISE Germany Eligibility Check',
    description: 'Annual Working Internships in Science and Engineering portal verified: €992/mo stipend + €1,075 travel allowance.',
    badgeText: 'Verified Funding',
    badgeColor: 'cyan'
  }
];

export function generateNextActivityItem(): ActivityFeedItem {
  const verifiedEvents = [
    {
      type: 'paper_alert' as const,
      title: 'OpenAlex Bibliometrics Updated',
      description: 'Citation velocity and h-index metrics refreshed from api.openalex.org for tracked premier national and international faculty.',
      badgeText: 'OpenAlex Sync',
      badgeColor: 'purple' as const
    },
    {
      type: 'grant_alert' as const,
      title: 'DST Foundation Models Consortium Active',
      description: 'IIT Bombay Center for Indian Language Technology (CFILT) active grant verified for Indic multilingual foundation models.',
      badgeText: 'Grant Active',
      badgeColor: 'amber' as const
    },
    {
      type: 'deadline_alert' as const,
      title: 'CERN Summer Student Geneva Programme',
      description: 'CHF 94/day allowance verified for undergraduate and master students in Physics and Computing.',
      badgeText: 'Deadline Monitored',
      badgeColor: 'cyan' as const
    },
    {
      type: 'paper_alert' as const,
      title: 'Max Planck Empirical Inference Preprint Tracked',
      description: 'Causal representation learning paper indexed with tight sample concentration and DOI metadata.',
      badgeText: 'ArXiv Monitored',
      badgeColor: 'purple' as const
    },
    {
      type: 'paper_alert' as const,
      title: '⚡ Autonomous Web Crawler: New Postings Discovered',
      description: 'Continuous 30-min scraper indexed fresh research internship postings and preprints across arXiv and OpenAlex.',
      badgeText: 'Live Scraped',
      badgeColor: 'emerald' as const
    },
    {
      type: 'grant_alert' as const,
      title: 'Active Research Lab Vacancies Indexed',
      description: 'Newly crawled lab announcements from IISc, UC Berkeley, Stanford, and Oxford loaded with direct faculty outreach.',
      badgeText: 'Postings Live',
      badgeColor: 'amber' as const
    }
  ];

  const pick = verifiedEvents[Math.floor(Math.random() * verifiedEvents.length)];
  return {
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    relativeTime: 'Just now',
    ...pick
  };
}
