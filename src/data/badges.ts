import { RRSBadge } from '../types';

export const INITIAL_BADGES: RRSBadge[] = [
  {
    id: 'badge-repro-champion',
    name: 'Reproducibility Champion',
    description: 'Verified public GitHub repository replicating an established research paper with runnable notebook & clean requirements.',
    icon: '🛠️',
    unlocked: true,
    unlockedAt: '2026-10-18',
    category: 'code'
  },
  {
    id: 'badge-model-architect',
    name: 'Model Architect',
    description: 'Published an active Hugging Face model or interactive Gradio Space with over 200 runs or downloads.',
    icon: '🚀',
    unlocked: true,
    unlockedAt: '2026-10-22',
    category: 'model'
  },
  {
    id: 'badge-preprint-pioneer',
    name: 'Preprint Pioneer',
    description: 'First or co-author on an arXiv preprint, workshop paper, or symposium submission.',
    icon: '📜',
    unlocked: false,
    category: 'paper'
  },
  {
    id: 'badge-open-source',
    name: 'Open Source Contributor',
    description: 'Merged pull request into recognized scientific libraries (PyTorch, Hugging Face, Qiskit, vLLM).',
    icon: '🐙',
    unlocked: false,
    category: 'code'
  },
  {
    id: 'badge-verified-academic',
    name: 'Verified Scholar',
    description: 'Authenticated institutional .edu domain email + active persistent ORCID identifier.',
    icon: '🎓',
    unlocked: true,
    unlockedAt: '2026-10-15',
    category: 'trust'
  },
  {
    id: 'badge-cluster-ready',
    name: 'Cluster Commander',
    description: 'Documented multi-GPU execution or SLURM cluster experiment tracking (Weights & Biases / MLflow).',
    icon: '⚡',
    unlocked: false,
    category: 'code'
  }
];
