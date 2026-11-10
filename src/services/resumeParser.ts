import { StudentProfile, ResearchDomain } from '../types';
import { INITIAL_BADGES } from '../data/badges';

export const INITIAL_STUDENT_STATE: StudentProfile = {
  fullName: '',
  email: '',
  university: '',
  degreeLevel: 'B.Tech / B.S.',
  currentYear: '',
  cgpa: 0,
  targetDomains: [],
  targetCountries: [],
  skills: [],
  linkedAccounts: {
    githubUrl: '',
    googleScholarUrl: '',
    orcidId: '',
    huggingFaceUrl: '',
    arxivAuthorId: '',
    linkedinUrl: ''
  },
  featuredProject: {
    title: '',
    description: '',
    techStack: [],
    repoUrl: ''
  },
  rrsScore: 0,
  rrsTier: 'Developing',
  rrsPillars: {
    codeExecution: 0,
    researchMethodology: 0,
    academicFoundations: 0,
    labTooling: 0,
    professionalism: 0
  },
  badges: INITIAL_BADGES,
  creditsRemaining: 0,
  dailyOutreachCount: 0
};

export function parseResumeText(rawText: string): Partial<StudentProfile> {
  const textLower = rawText.toLowerCase();

  // 1. Strict semantic verification: Reject non-CV documents
  if (rawText.trim().length < 80) {
    throw new Error('Document contains insufficient text to be an academic CV or resume. Please upload a text-based PDF.');
  }

  const nonCvPatterns = [
    /\btax invoice\b/, /\bbill to\b/, /\bamount due\b/, /\bpayment receipt\b/,
    /\border confirmation\b/, /\bshipping address\b/, /\bterms of service\b/
  ];
  if (nonCvPatterns.some(pattern => pattern.test(textLower))) {
    throw new Error('The uploaded file appears to be a receipt, invoice, or commercial bill. Please upload an authentic academic CV or resume.');
  }

  const eduMarkers = ['education', 'academic', 'bachelor', 'b.tech', 'b.e', 'b.s', 'master', 'm.tech', 'm.s', 'ph.d', 'gpa', 'cgpa', 'university', 'institute', 'college'];
  const expMarkers = ['experience', 'work', 'internship', 'projects', 'research', 'publications', 'patents', 'papers'];
  const skillsMarkers = ['skills', 'technical skills', 'programming', 'languages', 'tools', 'technologies', 'frameworks'];
  const contactMarkers = ['curriculum vitae', 'resume', 'github', 'linkedin', '@', 'email', 'phone', 'portfolio'];

  const hasEdu = eduMarkers.some(m => textLower.includes(m));
  const hasExp = expMarkers.some(m => textLower.includes(m));
  const hasSkills = skillsMarkers.some(m => textLower.includes(m));
  const hasContact = contactMarkers.some(m => textLower.includes(m));

  const categoriesMatched = [hasEdu, hasExp, hasSkills, hasContact].filter(Boolean).length;
  if (categoriesMatched < 2) {
    throw new Error('Document validation failed: The uploaded document does not appear to be an academic CV or resume. It must include sections such as Education, Projects/Experience, and Technical Skills.');
  }

  // 2. Extract Candidate Name
  let detectedName = '';
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 10)) {
    if (/^(curriculum vitae|resume|cv|contact|email|phone|address|education|experience|summary|skills|profile|projects)/i.test(line)) continue;
    if (/@|http|\.com|\.edu|\d/.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every(w => /^[A-Z][a-zA-Z'\-]*$/.test(w))) {
      detectedName = line;
      break;
    }
  }

  // 3. Extract Email
  let detectedEmail = '';
  const emailMatch = rawText.match(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/);
  if (emailMatch) {
    detectedEmail = emailMatch[0].toLowerCase();
    if (!detectedName) {
      const parts = emailMatch[0].split('@')[0].split(/[._\-]/).filter(p => p.length > 1);
      detectedName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
  }

  // 4. Extract University / Institute
  let detectedUniversity = '';
  const uniMatch = rawText.match(/(?:Indian Institute of Science|IISc|Indian Institute of Technology[^\n,]+|IIT\s+[A-Za-z]+|BITS\s+Pilani|NIT\s+[A-Za-z]+|IIIT\s+[A-Za-z]+|Stanford|Carnegie Mellon|MIT|Oxford|Cambridge|Harvard|Caltech|ETH\s+Z[uü]rich|TUM|NUS|[A-Z][A-Za-z\s]+(?:University|Institute of Technology|College of Engineering))/i);
  if (uniMatch) {
    detectedUniversity = uniMatch[0].trim();
  }

  // 5. Detect domain keywords
  const detectedDomains: ResearchDomain[] = [];
  if (textLower.includes('machine learning') || textLower.includes('deep learning') || textLower.includes('pytorch') || textLower.includes('transformer') || textLower.includes('llm')) {
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
  if (textLower.includes('clean energy') || textLower.includes('battery') || textLower.includes('solar') || textLower.includes('materials')) {
    detectedDomains.push('Clean Energy & Materials Science');
  }
  if (textLower.includes('cybersecurity') || textLower.includes('distributed') || textLower.includes('cloud') || textLower.includes('kernel')) {
    detectedDomains.push('Cybersecurity & Distributed Systems');
  }

  // 6. Detect skills
  const possibleSkills = [
    'PyTorch', 'JAX', 'TensorFlow', 'Python', 'C++', 'CUDA', 'ROS', 'ROS2', 'Qiskit',
    'Docker', 'Linux', 'LaTeX', 'Git', 'OpenCV', 'Scikit-Learn', 'FastAPI', 'React',
    'TypeScript', 'Rust', 'Distributed Systems', 'HPC', 'Keras', 'NLP', 'Computer Vision'
  ];
  const extractedSkills = possibleSkills.filter(skill => {
    const reg = new RegExp(`\\b${skill.replace(/[+*?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return reg.test(rawText);
  });

  // 7. Extract GPA pattern
  let detectedGpa: number | undefined = undefined;
  const gpaMatch = rawText.match(/(?:cgpa|gpa|cpi)\s*[:=]?\s*([0-9]\.[0-9]{1,2})/i);
  if (gpaMatch && gpaMatch[1]) {
    detectedGpa = parseFloat(gpaMatch[1]);
  }

  // 8. Extract Linked Accounts
  const githubMatch = rawText.match(/github\.com\/([a-zA-Z0-9_\-]+)/i);
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/([a-zA-Z0-9_\-]+)/i);

  return {
    fullName: detectedName || undefined,
    email: detectedEmail || undefined,
    university: detectedUniversity || undefined,
    targetDomains: detectedDomains,
    skills: extractedSkills,
    cgpa: detectedGpa,
    linkedAccounts: {
      githubUrl: githubMatch ? `https://github.com/${githubMatch[1]}` : '',
      linkedinUrl: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : ''
    }
  };
}
