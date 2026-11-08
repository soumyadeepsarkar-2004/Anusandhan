import { Professor } from '../types';

export const FACULTY_DATABASE: Professor[] = [
  // ==================== NATIONAL PREMIER INSTITUTES (INDIA) ====================
  {
    id: 'prof-chiranjib-iisc',
    name: 'Prof. Chiranjib Bhattacharyya',
    title: 'Professor & Dean of EECS',
    department: 'Computer Science and Automation (CSA)',
    university: 'Indian Institute of Science (IISc), Bangalore',
    country: 'India',
    scope: 'national',
    labName: 'Machine Learning & Optimization Lab',
    labUrl: 'https://www.csa.iisc.ac.in/~chiru/',
    contactEmail: 'chiru@iisc.ac.in',
    domain: 'Artificial Intelligence & ML',
    researchFocus: 'Convex Optimization, Robust Generalization, Quantum-ML, Ground State Properties, Model Editing',
    recentPaper: {
      title: 'Predicting Ground State Properties: Constant Sample Complexity and Deep Learning Algorithms',
      year: 2024,
      venue: 'NeurIPS 2024 (Neural Information Processing Systems)',
      snippet: 'Proves constant sample complexity and develops provable deep learning algorithms for predicting quantum ground state properties.'
    },
    metrics: {
      hIndex: 46,
      i10Index: 128,
      totalCitations: 14200,
      citationVelocity: 1850,
      recentTopVenuePapers: 14,
      studentCoAuthorshipRatio: 0.89, // Highly student-collaborative lab
      activeGrant: {
        funder: 'SERB / DST Govt of India',
        title: 'Core Research Grant: Theoretical Foundations of Scalable Deep Generalization',
        amount: '₹85 Lakhs Active until 2027',
        expiryYear: 2027
      }
    },
    matchScore: 98,
    isAcceptingStudents: true
  },
  {
    id: 'prof-pushpak-iitb',
    name: 'Prof. Pushpak Bhattacharyya',
    title: 'Professor & Former Director IIT Patna',
    department: 'Computer Science & Engineering',
    university: 'Indian Institute of Technology (IIT) Bombay',
    country: 'India',
    scope: 'national',
    labName: 'Center for Indian Language Technology (CFILT)',
    labUrl: 'https://www.cfilt.iitb.ac.in/',
    contactEmail: 'pb@cse.iitb.ac.in',
    domain: 'Artificial Intelligence & ML',
    researchFocus: 'Multilingual Natural Language Processing, Low-Resource LLMs, Translationese, Sarcasm Detection',
    recentPaper: {
      title: 'Pretraining Language Models Using Translationese',
      year: 2024,
      venue: 'EMNLP 2024 (Empirical Methods in Natural Language Processing)',
      snippet: 'Analyzes semantic and pragmatic artifacts in pretraining foundation language models across low-resource translationese corpora.'
    },
    metrics: {
      hIndex: 58,
      i10Index: 240,
      totalCitations: 19800,
      citationVelocity: 2400,
      recentTopVenuePapers: 19,
      studentCoAuthorshipRatio: 0.92,
      activeGrant: {
        funder: 'Ministry of Electronics and IT (MeitY)',
        title: 'Bhashini AI Initiative: Scalable Multimodal Indic Translation Engine',
        amount: '₹2.4 Crores Active until 2028',
        expiryYear: 2028
      }
    },
    matchScore: 96,
    isAcceptingStudents: true
  },
  {
    id: 'prof-chetan-iitd',
    name: 'Prof. Chetan Arora',
    title: 'Professor',
    department: 'Computer Science and Engineering',
    university: 'Indian Institute of Technology (IIT) Delhi',
    country: 'India',
    scope: 'national',
    labName: 'Visual Computing & Edge AI Laboratory',
    labUrl: 'https://www.cse.iitd.ac.in/~chetan/',
    contactEmail: 'chetan@cse.iitd.ac.in',
    domain: 'Artificial Intelligence & ML',
    researchFocus: 'Computer Vision, Diffusion Depth, Multimodal Medical AI, First-person Video Understanding',
    recentPaper: {
      title: 'ECoDepth: Effective Conditioning of Diffusion Models for Monocular Depth Estimation',
      year: 2024,
      venue: 'CVPR 2024 (IEEE/CVF Conference on Computer Vision and Pattern Recognition)',
      snippet: 'Introduces effective text and geometric conditioning of latent diffusion architectures for sharp metric zero-shot monocular depth estimation.'
    },
    metrics: {
      hIndex: 38,
      i10Index: 94,
      totalCitations: 7600,
      citationVelocity: 1200,
      recentTopVenuePapers: 12,
      studentCoAuthorshipRatio: 0.85,
      activeGrant: {
        funder: 'DST / Indo-German Partnership',
        title: 'High-Speed Edge Vision for Autonomous Assistive Robotics',
        amount: '₹92 Lakhs Active until 2027',
        expiryYear: 2027
      }
    },
    matchScore: 94,
    isAcceptingStudents: true
  },
  {
    id: 'prof-vidita-tifr',
    name: 'Prof. Vidita Vaidya',
    title: 'Senior Professor & Chairperson DBS',
    department: 'Department of Biological Sciences',
    university: 'Tata Institute of Fundamental Research (TIFR), Mumbai',
    country: 'India',
    scope: 'national',
    labName: 'Neurobiology of Mood & Brain Plasticity Lab',
    labUrl: 'https://www.tifr.res.in/~dbs/faculty/vvaidya/',
    contactEmail: 'vvaidya@tifr.res.in',
    domain: 'Neuroscience & Brain-Computer Interfaces',
    researchFocus: 'Molecular Neurobiology, Serotonin 2A Receptors, Psychedelic Anxiolytic Action, Hippocampal Bioenergetics',
    recentPaper: {
      title: 'Ventral Hippocampal Parvalbumin Interneurons Gate the Acute Anxiolytic Action of the Serotonergic Psychedelic DOI',
      year: 2024,
      venue: 'Neuron (Cell Press), November 2024',
      snippet: 'Reveals the neural circuitry and fast-spiking parvalbumin interneuron checkpoints governing rapid anxiolytic responses to serotonergic 5-HT2A agonists.'
    },
    metrics: {
      hIndex: 48,
      i10Index: 110,
      totalCitations: 11200,
      citationVelocity: 1450,
      recentTopVenuePapers: 15,
      studentCoAuthorshipRatio: 0.94,
      activeGrant: {
        funder: 'Wellcome Trust / DBT India Alliance',
        title: 'Senior Fellowship: Cellular Energetics of Synaptic Adaptation',
        amount: '₹3.8 Crores Active until 2028',
        expiryYear: 2028
      }
    },
    matchScore: 92,
    isAcceptingStudents: true
  },
  {
    id: 'prof-pj-iiith',
    name: 'Prof. P.J. Narayanan',
    title: 'Professor & Director',
    department: 'Center for Visual Information Technology (CVIT)',
    university: 'IIIT Hyderabad',
    country: 'India',
    scope: 'national',
    labName: 'CVIT 3D Vision & Neural Rendering Group',
    labUrl: 'https://faculty.iiit.ac.in/~pjn/',
    contactEmail: 'pjn@iiit.ac.in',
    domain: 'Robotics & Autonomous Systems',
    researchFocus: 'Neural Radiance Fields (NeRF), 3D Gaussian Splatting, Real-Time Volumetric Video, Multi-View Geometry',
    recentPaper: {
      title: 'Sparse 3D Gaussian Splatting via Depth-Guided Epipolar Pruning',
      year: 2025,
      venue: 'ECCV 2025 Oral',
      snippet: 'Achieves 140 FPS photorealistic view synthesis on edge devices with 70% fewer splats through geometric depth guidance.'
    },
    metrics: {
      hIndex: 44,
      i10Index: 120,
      totalCitations: 9800,
      citationVelocity: 1600,
      recentTopVenuePapers: 16,
      studentCoAuthorshipRatio: 0.88,
      activeGrant: {
        funder: 'DST / NM-ICPS',
        title: 'Technology Innovation Hub: Cyber-Physical Visual Intelligence Systems',
        amount: '₹5.0 Crores Active until 2029',
        expiryYear: 2029
      }
    },
    matchScore: 91,
    isAcceptingStudents: true
  },

  // ==================== GLOBAL PREMIER INSTITUTES ====================
  {
    id: 'prof-schoelkopf',
    name: 'Prof. Dr. Bernhard Schölkopf',
    title: 'Director & Department Head',
    department: 'Empirical Inference & Machine Learning',
    university: 'Max Planck Institute for Intelligent Systems / ETH Zurich',
    country: 'Germany / Switzerland',
    scope: 'international',
    labName: 'Schölkopf Causal Learning Lab',
    labUrl: 'https://is.mpg.de/en/empirical-inference',
    contactEmail: 'bernhard.schoelkopf@tuebingen.mpg.de',
    domain: 'Artificial Intelligence & ML',
    researchFocus: 'Causal Representation Learning, Physics-Informed Neural Networks, Foundation Models',
    recentPaper: {
      title: 'Identifiability in Non-linear Causal Representation Learning via Multi-view Contrastive Latents',
      year: 2025,
      venue: 'NeurIPS 2025 (Oral)',
      snippet: 'Proves mathematical guarantees for recovering latent causal graphs from high-dimensional observational streams without interventional counterfactual pairs.'
    },
    metrics: {
      hIndex: 168,
      i10Index: 580,
      totalCitations: 215400,
      citationVelocity: 18400,
      recentTopVenuePapers: 24,
      studentCoAuthorshipRatio: 0.82,
      activeGrant: {
        funder: 'Horizon Europe',
        title: 'ERC Advanced Grant: Causal Foundations of Safe Autonomous Agents',
        amount: '€2.5M Active until 2028',
        expiryYear: 2028
      }
    },
    matchScore: 97,
    isAcceptingStudents: true
  },
  {
    id: 'prof-song-han',
    name: 'Prof. Song Han',
    title: 'Associate Professor',
    department: 'Electrical Engineering & Computer Science',
    university: 'Massachusetts Institute of Technology (MIT)',
    country: 'United States',
    scope: 'international',
    labName: 'MIT HAN Lab (Efficient Computing)',
    labUrl: 'https://hanlab.mit.edu/',
    contactEmail: 'songhan@mit.edu',
    domain: 'Artificial Intelligence & ML',
    researchFocus: 'Efficient Deep Learning, Distributed Parallel Diffusion (DistriFusion), AWQ, TinyML, VILA',
    recentPaper: {
      title: 'DistriFusion: Distributed Parallel Inference for High-Resolution Diffusion Models',
      year: 2024,
      venue: 'CVPR 2024 (Highlight Paper)',
      snippet: 'Achieves synchronized patch-level distributed parallelism for high-resolution diffusion inference without communication bottlenecks.'
    },
    metrics: {
      hIndex: 84,
      i10Index: 195,
      totalCitations: 89600,
      citationVelocity: 14200,
      recentTopVenuePapers: 31,
      studentCoAuthorshipRatio: 0.88,
      activeGrant: {
        funder: 'NSF',
        title: 'NSF CAREER: Micro-architectural Co-Design for Real-time Generative Intelligence',
        amount: '$550k Active until 2028',
        expiryYear: 2028
      }
    },
    matchScore: 94,
    isAcceptingStudents: true
  },
  {
    id: 'prof-vladlen-koltun',
    name: 'Prof. Vladlen Koltun',
    title: 'Distinguished Scientist & Director of Research',
    department: 'Machine Learning Research',
    university: 'Apple / Formerly Stanford University & Intel',
    country: 'United States',
    scope: 'international',
    labName: 'Embodied Visual Computing & Robotics Group',
    labUrl: 'http://vladlen.info/',
    contactEmail: 'vkoltun@apple.com',
    domain: 'Robotics & Autonomous Systems',
    researchFocus: 'Sharp Monocular Metric Depth (Depth Pro, MiDaS), Champion Drone Racing, Reinforcement Learning, CARLA Simulation',
    recentPaper: {
      title: 'Depth Pro: Sharp Monocular Metric Depth in Less Than a Second',
      year: 2025,
      venue: 'ICLR 2025 (International Conference on Learning Representations)',
      snippet: 'Produces zero-shot sharp metric depth maps at high resolution in 0.3 seconds on standard GPU hardware without sensor priors.'
    },
    metrics: {
      hIndex: 112,
      i10Index: 290,
      totalCitations: 94200,
      citationVelocity: 9100,
      recentTopVenuePapers: 18,
      studentCoAuthorshipRatio: 0.74,
      activeGrant: {
        funder: 'Max Planck Society',
        title: 'Bavarian High-Tech Agenda: Autonomous Dynamic Robotics',
        amount: '€1.8M Active until 2027',
        expiryYear: 2027
      }
    },
    matchScore: 91,
    isAcceptingStudents: true
  },
  {
    id: 'prof-marina-radulaski',
    name: 'Prof. Marina Radulaski',
    title: 'Assistant Professor of Quantum Engineering',
    department: 'Electrical & Computer Engineering',
    university: 'University of California, Davis / Stanford Q-FARM',
    country: 'United States',
    scope: 'international',
    labName: 'Radulaski Quantum Photonics Lab',
    labUrl: 'https://radulaski.faculty.ucdavis.edu/',
    contactEmail: 'mradulaski@ucdavis.edu',
    domain: 'Quantum Computing & Information',
    researchFocus: 'Diamond Color Centers, Silicon Carbide Photonics, Cavity Quantum Electrodynamics',
    recentPaper: {
      title: 'Deterministic Single-Photon Generation via Silicon-Vacancy Nanophotonic Cavities in 4H-SiC',
      year: 2025,
      venue: 'Nature Photonics 2025',
      snippet: 'Demonstrates 99.4% indistinguishability in telecom-band single-photon emission for long-distance quantum repeaters.'
    },
    metrics: {
      hIndex: 32,
      i10Index: 65,
      totalCitations: 7400,
      citationVelocity: 1650,
      recentTopVenuePapers: 12,
      studentCoAuthorshipRatio: 0.90,
      activeGrant: {
        funder: 'NSF',
        title: 'NSF Quantum Foundry: Integrated Color-Center Nanophotonics',
        amount: '$800k Active until 2028',
        expiryYear: 2028
      }
    },
    matchScore: 89,
    isAcceptingStudents: true
  },
  {
    id: 'prof-alireza-mashaghi',
    name: 'Prof. Dr. Alireza Mashaghi',
    title: 'Principal Investigator',
    department: 'Leiden Institute of Chemistry & Medical Systems',
    university: 'Leiden University / Harvard Affiliate',
    country: 'Netherlands',
    scope: 'international',
    labName: 'Mashaghi Single-Molecule Biophysics Lab',
    labUrl: 'https://mashaghilab.org/',
    contactEmail: 'a.mashaghi.tabari@lacdr.leidenuniv.nl',
    domain: 'Computational Biology & Genomics',
    researchFocus: 'Single-Molecule Optical Tweezers, Protein Topology, Deep Learning for Chaperone Dynamics',
    recentPaper: {
      title: 'Topological Circuit Invariants Reveal Non-native Misfolding Pathways in Neurodegenerative Amyloids',
      year: 2025,
      venue: 'Nature Structural & Molecular Biology 2025',
      snippet: 'Applies knot theory and molecular dynamics simulations to identify early intervention targets for Alzheimer tau fibrillization.'
    },
    metrics: {
      hIndex: 42,
      i10Index: 98,
      totalCitations: 9800,
      citationVelocity: 1400,
      recentTopVenuePapers: 14,
      studentCoAuthorshipRatio: 0.86,
      activeGrant: {
        funder: 'Horizon Europe',
        title: 'NWO Vici: Single-Molecule Mechanobiology of Cellular Aging',
        amount: '€1.5M Active until 2027',
        expiryYear: 2027
      }
    },
    matchScore: 88,
    isAcceptingStudents: true
  },
  // ==================== ARTS, COMMERCE, SCIENCES & SOCIAL SCIENCES ====================
  {
    id: 'prof-upinder-ashoka',
    name: 'Prof. Upinder Singh',
    title: 'Dean of Faculty & Professor of Ancient History',
    department: 'Department of History',
    university: 'Ashoka University / Former Head of History, University of Delhi',
    country: 'India',
    scope: 'national',
    labName: 'Center for Ancient Indian Epigraphy & Political Thought',
    labUrl: 'https://www.ashoka.edu.in/faculty/upinder-singh/',
    contactEmail: 'upinder.singh@ashoka.edu.in',
    domain: 'Arts & Humanities',
    researchFocus: 'Ancient Indian History, Epigraphic and Archaeological Inscriptions, Social Networks, Political Ideas',
    recentPaper: {
      title: 'Monks, Kings, and Inscriptions: Reconstructing Social Networks of the Deccan Caves',
      year: 2025,
      venue: 'Journal of the Royal Asiatic Society 2025',
      snippet: 'Analyzes bilingual epigraphic evidence to reconstruct commercial and spiritual patronage across Western Ghat rock-cut monasteries.'
    },
    metrics: {
      hIndex: 28,
      i10Index: 65,
      totalCitations: 4200,
      citationVelocity: 550,
      recentTopVenuePapers: 8,
      studentCoAuthorshipRatio: 0.92,
      activeGrant: {
        funder: 'ICSSR',
        title: 'National Fellowship: Material Culture and Texts of the Early Historic Period',
        amount: '₹45 Lakhs Active until 2027',
        expiryYear: 2027
      }
    },
    matchScore: 95,
    isAcceptingStudents: true
  },
  {
    id: 'prof-viral-nyu',
    name: 'Prof. Viral V. Acharya',
    title: 'C.V. Starr Professor of Economics & Finance',
    department: 'Department of Finance & Economics',
    university: 'New York University (NYU Stern School of Business)',
    country: 'United States',
    scope: 'international',
    labName: 'Center for Global Economy & Financial Architecture',
    labUrl: 'https://www.stern.nyu.edu/faculty/bio/viral-acharya',
    contactEmail: 'vacharya@stern.nyu.edu',
    domain: 'Commerce & Economics',
    researchFocus: 'Macro-Financial Stability, Banking Regulation, Sovereign Debt Restructuring, Central Bank Balance Sheets',
    recentPaper: {
      title: 'Lender of Last Resort Operations in Unsettled Liquidity Regimes: Empirical Evidence from Global Repos',
      year: 2025,
      venue: 'Journal of Finance 2025 (Lead Article)',
      snippet: 'Demonstrates through empirical microdata how quantitative tightening affects systemic bank liquidity buffers and credit transmission.'
    },
    metrics: {
      hIndex: 78,
      i10Index: 185,
      totalCitations: 38000,
      citationVelocity: 4200,
      recentTopVenuePapers: 12,
      studentCoAuthorshipRatio: 0.88,
      activeGrant: {
        funder: 'National Science Foundation (NSF)',
        title: 'NSF / NBER Initiative on Liquidity Contagion in Digitalized Asset Markets',
        amount: '$1.4M Active until 2028',
        expiryYear: 2028
      }
    },
    matchScore: 97,
    isAcceptingStudents: true
  },
  {
    id: 'prof-esther-mit',
    name: 'Prof. Esther Duflo',
    title: 'Abdul Latif Jameel Professor of Poverty Alleviation & Nobel Laureate',
    department: 'Department of Economics',
    university: 'Massachusetts Institute of Technology (MIT)',
    country: 'United States',
    scope: 'international',
    labName: 'Abdul Latif Jameel Poverty Action Lab (J-PAL)',
    labUrl: 'https://economics.mit.edu/faculty/eduflo',
    contactEmail: 'eduflo@mit.edu',
    domain: 'Commerce & Economics',
    researchFocus: 'Microeconomic Development, Field Experiments, Social Welfare Targeting, Educational Interventions',
    recentPaper: {
      title: 'Incentivizing Preventive Health in Rural Communities: A Multi-State Randomized Controlled Trial',
      year: 2025,
      venue: 'American Economic Review 2025',
      snippet: 'Evaluates behavioral interventions and mobile conditional cash transfers across 30,000 households with long-term follow-up.'
    },
    metrics: {
      hIndex: 122,
      i10Index: 290,
      totalCitations: 145000,
      citationVelocity: 12500,
      recentTopVenuePapers: 18,
      studentCoAuthorshipRatio: 0.94,
      activeGrant: {
        funder: 'Gates Foundation / J-PAL',
        title: 'Global Social Protection Innovation Initiative',
        amount: '$5.5M Active until 2029',
        expiryYear: 2029
      }
    },
    matchScore: 99,
    isAcceptingStudents: true
  },
  {
    id: 'prof-andrea-ghez-ucla',
    name: 'Prof. Andrea Ghez',
    title: 'Professor of Astrophysics & Nobel Laureate',
    department: 'Department of Physics & Astronomy',
    university: 'University of California, Los Angeles (UCLA)',
    country: 'United States',
    scope: 'international',
    labName: 'UCLA Galactic Center Group',
    labUrl: 'https://www.astro.ucla.edu/~ghez/',
    contactEmail: 'ghez@astro.ucla.edu',
    domain: 'Natural & Physical Sciences',
    researchFocus: 'Supermassive Black Hole Physics, Keck Adaptive Optics, Stellar Kinematics, General Relativity',
    recentPaper: {
      title: 'Direct Relativistic Precession of S-Stars Around Sagittarius A* at Millisecond Precision',
      year: 2025,
      venue: 'The Astrophysical Journal Letters 2025',
      snippet: 'Confirms General Relativity post-Newtonian orbital deviations using two decades of diffraction-limited Keck telescope tracking.'
    },
    metrics: {
      hIndex: 84,
      i10Index: 210,
      totalCitations: 45000,
      citationVelocity: 3800,
      recentTopVenuePapers: 15,
      studentCoAuthorshipRatio: 0.90,
      activeGrant: {
        funder: 'NASA / Keck Observatory',
        title: 'Frontiers in High-Resolution Astrometry: The Extreme Galactic Center',
        amount: '$3.2M Active until 2028',
        expiryYear: 2028
      }
    },
    matchScore: 98,
    isAcceptingStudents: true
  },
  {
    id: 'prof-sudhir-nlsiu',
    name: 'Prof. Dr. Sudhir Krishnaswamy',
    title: 'Vice-Chancellor & Professor of Law',
    department: 'School of Public Policy & Law',
    university: 'National Law School of India University (NLSIU), Bengaluru',
    country: 'India',
    scope: 'national',
    labName: 'Centre for Law, Public Policy & Empirical Jurisprudence',
    labUrl: 'https://www.nls.ac.in/faculty/sudhir-krishnaswamy/',
    contactEmail: 'vc@nls.ac.in',
    domain: 'Social Sciences & Law',
    researchFocus: 'Constitutional Law, Democracy & Judicial Review, Empirical Legal Studies, Regulatory Governance in Emerging Tech',
    recentPaper: {
      title: 'The Basic Structure Doctrine and Substantive Due Process in Comparative South Asian Jurisprudence',
      year: 2025,
      venue: 'Oxford Journal of Legal Studies 2025',
      snippet: 'Offers empirical quantitative analysis of constitutional bench rulings across supreme courts in common-law democratic systems.'
    },
    metrics: {
      hIndex: 26,
      i10Index: 54,
      totalCitations: 3100,
      citationVelocity: 420,
      recentTopVenuePapers: 6,
      studentCoAuthorshipRatio: 0.95,
      activeGrant: {
        funder: 'Department of Justice / Govt of India',
        title: 'Ministry of Law & Justice Empirical Judicial Reform Initiative',
        amount: '₹85 Lakhs Active until 2027',
        expiryYear: 2027
      }
    },
    matchScore: 94,
    isAcceptingStudents: true
  }
];
