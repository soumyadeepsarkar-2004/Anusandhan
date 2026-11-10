import { StudentProfile, RRSBadge } from '../types';
import { INITIAL_BADGES } from '../data/badges';

export function calculateRRS(profile: StudentProfile): {
  totalScore: number;
  tier: StudentProfile['rrsTier'];
  pillars: StudentProfile['rrsPillars'];
  updatedBadges: RRSBadge[];
} {
  // If profile is in initial clean/blank state, maintain 0 baseline
  const isBlank = !profile.fullName && profile.cgpa === 0 && profile.skills.length === 0 && profile.targetDomains.length === 0;
  if (isBlank) {
    return {
      totalScore: 0,
      tier: 'Developing',
      pillars: {
        codeExecution: 0,
        researchMethodology: 0,
        academicFoundations: 0,
        labTooling: 0,
        professionalism: 0
      },
      updatedBadges: INITIAL_BADGES
    };
  }

  let codeExecution = 12; // base
  let researchMethodology = 10;
  let academicFoundations = 10;
  let labTooling = 6;
  let professionalism = 6;

  // Code execution score (max 25)
  if (profile.linkedAccounts.githubUrl) {
    codeExecution += 8;
  }
  if (profile.featuredProject.repoUrl) {
    codeExecution += 5;
  }
  codeExecution = Math.min(25, codeExecution);

  // Research methodology (max 25)
  if (profile.linkedAccounts.arxivAuthorId) {
    researchMethodology += 8;
  }
  if (profile.linkedAccounts.googleScholarUrl) {
    researchMethodology += 5;
  }
  if (profile.featuredProject.description.length > 50) {
    researchMethodology += 4;
  }
  researchMethodology = Math.min(25, researchMethodology);

  // Academic Foundations (max 20)
  if (profile.cgpa >= 9.0) {
    academicFoundations += 10;
  } else if (profile.cgpa >= 8.0) {
    academicFoundations += 7;
  } else {
    academicFoundations += 4;
  }
  academicFoundations = Math.min(20, academicFoundations);

  // Lab Tooling (max 15)
  const heavyTools = ['CUDA', 'JAX', 'PyTorch', 'Weights & Biases', 'Docker', 'SLURM'];
  const toolOverlap = profile.skills.filter(s => heavyTools.includes(s)).length;
  labTooling += Math.min(9, toolOverlap * 3);
  labTooling = Math.min(15, labTooling);

  // Professionalism & Trust (max 15)
  if (profile.linkedAccounts.orcidId) {
    professionalism += 5;
  }
  if (profile.email.includes('.edu') || profile.email.includes('.ac.in')) {
    professionalism += 4;
  }
  professionalism = Math.min(15, professionalism);

  const totalScore = codeExecution + researchMethodology + academicFoundations + labTooling + professionalism;

  let tier: StudentProfile['rrsTier'] = 'Developing';
  if (totalScore >= 90) tier = 'Distinguished Candidate';
  else if (totalScore >= 75) tier = 'Lab-Ready Fellow';
  else if (totalScore >= 55) tier = 'Junior Researcher';
  else if (totalScore >= 35) tier = 'Scholar Apprentice';
  else if (totalScore > 0) tier = 'Explorer';

  // Update badges
  const updatedBadges = INITIAL_BADGES.map(badge => {
    let unlocked = badge.unlocked;
    if (badge.id === 'badge-preprint-pioneer' && profile.linkedAccounts.arxivAuthorId) {
      unlocked = true;
    }
    if (badge.id === 'badge-open-source' && profile.skills.includes('CUDA')) {
      unlocked = true;
    }
    return {
      ...badge,
      unlocked
    };
  });

  return {
    totalScore,
    tier,
    pillars: {
      codeExecution,
      researchMethodology,
      academicFoundations,
      labTooling,
      professionalism
    },
    updatedBadges
  };
}
