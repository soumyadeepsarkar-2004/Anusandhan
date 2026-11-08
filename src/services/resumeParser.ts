import { StudentProfile, ResearchDomain } from '../types';
import { INITIAL_BADGES } from '../data/badges';

export const INITIAL_STUDENT_STATE: StudentProfile = {
  fullName: '',
  email: '',
  university: '',
  degreeLevel: 'B.Tech / B.S.',
  currentYear: '3rd Year (Class of 2027)',
  cgpa: 0,
  targetDomains: ['Artificial Intelligence & ML'],
  targetCountries: ['India', 'Germany', 'Switzerland', 'United States', 'Canada'],
  skills: [],
  linkedAccounts: {
    githubUrl: '',
    googleScholarUrl: '',
    orcidId: '',
    huggingFaceUrl: '',
    arxivAuthorId: ''
  },
  featuredProject: {
    title: '',
    description: '',
    techStack: [],
    repoUrl: ''
  },
  rrsScore: 0,
  rrsTier: 'Explorer',
  rrsPillars: {
    codeExecution: 0,
    researchMethodology: 0,
    academicFoundations: 0,
    labTooling: 0,
    professionalism: 0
  },
  badges: INITIAL_BADGES,
  creditsRemaining: 10,
  dailyOutreachCount: 0
};

export function parseResumeText(rawText: string): Partial<StudentProfile> {
  const textLower = rawText.toLowerCase();
  
  // Detect domain keywords
  const detectedDomains: ResearchDomain[] = [];
  if (textLower.includes('machine learning') || textLower.includes('deep learning') || textLower.includes('pytorch') || textLower.includes('transformer')) {
    detectedDomains.push('Artificial Intelligence & ML');
  }
  if (textLower.includes('quantum') || textLower.includes('qiskit') || textLower.includes('qubit')) {
    detectedDomains.push('Quantum Computing & Information');
  }
  if (textLower.includes('robotics') || textLower.includes('ros') || textLower.includes('kinematics') || textLower.includes('control')) {
    detectedDomains.push('Robotics & Autonomous Systems');
  }
  if (textLower.includes('biology') || textLower.includes('genomics') || textLower.includes('crispr') || textLower.includes('molecular')) {
    detectedDomains.push('Computational Biology & Genomics');
  }

  // Detect skills
  const possibleSkills = ['PyTorch', 'JAX', 'TensorFlow', 'Python', 'C++', 'CUDA', 'ROS', 'Qiskit', 'Docker', 'Linux', 'LaTeX', 'Git', 'OpenCV', 'Scikit-Learn'];
  const extractedSkills = possibleSkills.filter(skill => textLower.includes(skill.toLowerCase()));

  // Extract GPA pattern
  let detectedGpa = 8.5;
  const gpaMatch = rawText.match(/(?:cgpa|gpa|cpi)\s*[:=]?\s*([0-9]\.[0-9]{1,2})/i);
  if (gpaMatch && gpaMatch[1]) {
    detectedGpa = parseFloat(gpaMatch[1]);
  }

  return {
    targetDomains: detectedDomains.length > 0 ? detectedDomains : ['Artificial Intelligence & ML'],
    skills: extractedSkills.length > 0 ? extractedSkills : ['Python', 'PyTorch', 'Git', 'LaTeX'],
    cgpa: detectedGpa,
  };
}
