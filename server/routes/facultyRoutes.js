import express from 'express';
import { cache } from '../services/redisCache.js';
import { PythonBridge } from '../services/pythonBridge.js';
import { ingestionService } from '../services/dataIngestionService.js';

const router = express.Router();

const UNIVERSAL_FACULTY = [
  {
    id: 'prof_chiranjib',
    profId: 'prof_chiranjib',
    name: 'Prof. Chiranjib Bhattacharyya',
    title: 'Professor & Chair, Department of Computer Science and Automation',
    university: 'Indian Institute of Science (IISc) Bangalore',
    institution: 'Indian Institute of Science (IISc) Bangalore',
    labName: 'Machine Learning & Statistical Learning Lab',
    department: 'CSA Department',
    domain: 'Artificial Intelligence & ML',
    scope: 'national',
    country: 'India',
    email: 'chiran@iisc.ac.in',
    researchFocus: 'Convex Optimization, Robust Machine Learning, Multi-Armed Bandits, Non-Stationary Dynamics.',
    metrics: {
      hIndex: 42,
      totalCitations: 9600,
      studentCoauthorRatio: 0.88,
      activeGrant: {
        title: 'MeitY National Initiative on Trustworthy and Explainable AI',
        funder: 'Ministry of Electronics and Information Technology (MeitY)',
        amount: '₹3.8 Crores',
        expiryYear: '2027'
      }
    },
    isAcceptingStudents: true
  },
  {
    id: 'prof_pushpak',
    profId: 'prof_pushpak',
    name: 'Prof. Pushpak Bhattacharyya',
    title: 'Professor of Computer Science and Engineering',
    university: 'Indian Institute of Technology (IIT) Bombay',
    institution: 'Indian Institute of Technology (IIT) Bombay',
    labName: 'Center for Indian Language Technology (CFILT)',
    department: 'CSE Department',
    domain: 'Artificial Intelligence & ML',
    scope: 'national',
    country: 'India',
    email: 'pb@cse.iitb.ac.in',
    researchFocus: 'Natural Language Processing, Machine Translation, Cross-Lingual Information Retrieval, Cognitive NLP.',
    metrics: {
      hIndex: 58,
      totalCitations: 18400,
      studentCoauthorRatio: 0.92,
      activeGrant: {
        title: 'DST High-Performance Computing Consortium for Indic Foundation Models',
        funder: 'Department of Science and Technology (DST)',
        amount: '₹2.4 Crores',
        expiryYear: '2026'
      }
    },
    isAcceptingStudents: true
  },
  {
    id: 'prof_scholkopf',
    profId: 'prof_scholkopf',
    name: 'Prof. Bernhard Schölkopf',
    title: 'Director, Empirical Inference Department',
    university: 'Max Planck Institute for Intelligent Systems',
    institution: 'Max Planck Institute for Intelligent Systems',
    labName: 'Causal Intelligence Core',
    department: 'Empirical Inference',
    domain: 'Artificial Intelligence & ML',
    scope: 'global',
    country: 'Germany',
    email: 'bs@tuebingen.mpg.de',
    researchFocus: 'Causal Inference, Kernel Methods, Learning Theory, Independent Causal Mechanisms.',
    metrics: {
      hIndex: 124,
      totalCitations: 148000,
      studentCoauthorRatio: 0.78,
      activeGrant: {
        title: 'European Research Council (ERC) Advanced Synergy Grant',
        funder: 'ERC Horizon Europe',
        amount: '€2.5 Million',
        expiryYear: '2028'
      }
    },
    isAcceptingStudents: true
  },
  {
    id: 'prof_songhan',
    profId: 'prof_songhan',
    name: 'Prof. Song Han',
    title: 'Associate Professor of Electrical Engineering and Computer Science',
    university: 'Massachusetts Institute of Technology (MIT)',
    institution: 'Massachusetts Institute of Technology (MIT)',
    labName: 'HAN Lab (Efficient AI Computing)',
    department: 'EECS Department',
    domain: 'Artificial Intelligence & ML',
    scope: 'global',
    country: 'United States',
    email: 'songhan@mit.edu',
    researchFocus: 'Hardware-Aware Neural Architecture Search, Model Compression, Pruning, On-Device LLM Inference.',
    metrics: {
      hIndex: 68,
      totalCitations: 42000,
      studentCoauthorRatio: 0.85,
      activeGrant: {
        title: 'NSF Expeditions in Computing: Scalable On-Device Deep Learning',
        funder: 'National Science Foundation (NSF)',
        amount: '$1.8 Million',
        expiryYear: '2027'
      }
    },
    isAcceptingStudents: true
  }
];

router.get('/', async (req, res) => {
  try {
    const { q, domain, country, scope, scraped } = req.query;
    const cacheKey = `faculty:list:${domain || 'all'}:${scope || 'all'}:${country || 'all'}:${scraped || 'all'}:${q || ''}`;

    const { data, source } = await cache.getOrSet(cacheKey, async () => {
      const isGlobalScope = scope === 'global' || scope === 'international';
      const isNationalScope = scope === 'national';

      // 1. Gather live scraped & verified faculty from ingestion service
      const ingestionResults = [...ingestionService.getFaculty()];

      // 2. Query Python AI microservice if not explicitly requesting scraped-only
      let pythonResults = [];
      if (scraped !== 'true') {
        try {
          const countryParam = isNationalScope ? 'India' : (isGlobalScope ? undefined : country);
          const pyRes = await PythonBridge.searchProfessors({ q, domain, country: countryParam });
          if (Array.isArray(pyRes)) {
            pythonResults = pyRes;
          }
        } catch {}
      }

      // Merge results deduplicated by id / profId
      const mergedMap = new Map();
      
      // Add pythonResults first if available
      for (const item of pythonResults) {
        const id = item.id || item.profId;
        if (id) mergedMap.set(id, item);
      }

      // Add ingestionResults (core seeds + additional faculty + scraped postings)
      for (const item of ingestionResults) {
        const id = item.id || item.profId;
        if (id && !mergedMap.has(id)) {
          mergedMap.set(id, item);
        }
      }

      let results = Array.from(mergedMap.values());

      // 3. Apply query filters consistently
      if (scraped === 'true') {
        results = results.filter(f => f.isLiveScraped === true);
      }
      if (domain && domain !== 'all') {
        results = results.filter(f => f.domain === domain || (Array.isArray(f.researchDomains) && f.researchDomains.includes(domain)));
      }
      if (isNationalScope) {
        results = results.filter(f => f.scope === 'national' || f.country?.toLowerCase() === 'india');
      } else if (isGlobalScope) {
        results = results.filter(f => f.scope === 'global' || f.scope === 'international' || (f.country && f.country.toLowerCase() !== 'india'));
      } else if (scope && scope !== 'all') {
        results = results.filter(f => f.scope === scope);
      }
      if (country && country !== 'all') {
        results = results.filter(f => f.country && f.country.toLowerCase() === country.toLowerCase());
      }
      if (q) {
        const queryLower = q.toLowerCase();
        results = results.filter(f => 
          (f.name && f.name.toLowerCase().includes(queryLower)) ||
          (f.university && f.university.toLowerCase().includes(queryLower)) ||
          (f.institution && f.institution.toLowerCase().includes(queryLower)) ||
          (f.labName && f.labName.toLowerCase().includes(queryLower)) ||
          (f.researchFocus && f.researchFocus.toLowerCase().includes(queryLower)) ||
          (f.title && f.title.toLowerCase().includes(queryLower)) ||
          (f.domain && f.domain.toLowerCase().includes(queryLower)) ||
          (f.recentPaper?.title && f.recentPaper.title.toLowerCase().includes(queryLower)) ||
          (f.recentPaper?.snippet && f.recentPaper.snippet.toLowerCase().includes(queryLower))
        );
      }
      return results;
    }, 1800); // 30-minute Redis cache TTL

    res.setHeader('X-Cache', source === 'cache' ? 'HIT' : 'MISS');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
