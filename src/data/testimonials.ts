export interface Testimonial {
  id: string;
  studentName: string;
  avatarUrl: string;
  originUniversity: string;
  placedProgram: string;
  hostInstitute: string;
  quote: string;
  metricBadge: string;
  researchArea: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    studentName: 'Aditya S.',
    avatarUrl: '/testimonials/aditya-s.jpg',
    originUniversity: 'IIT Bombay, CSE',
    placedProgram: 'DAAD WISE Fellow 2026',
    hostInstitute: 'Max Planck Institute for Intelligent Systems (Tübingen)',
    quote: 'Maine 40 generic emails bheje the aur zero response mila. Anusandhan ne Prof. Schölkopf ka recent NeurIPS paper cite karke mere low-rank adaptation repo se connect kiya. Prof ka reply 3 din me aaya: "Your code is clean, let us chat on Zoom". This tool saved my career.',
    metricBadge: 'Funded €992/mo + Flights',
    researchArea: 'Causal Deep Learning'
  },
  {
    id: 't-2',
    studentName: 'Sneha Mukherjee',
    avatarUrl: '/testimonials/sneha-mukherjee.jpg',
    originUniversity: 'BITS Pilani, Goa',
    placedProgram: 'Mitacs Globalink Research Intern',
    hostInstitute: 'University of Toronto (Vector Institute)',
    quote: 'AnusandhanAI voice assistant ne mujhe 2-minute morning briefing di Hinglish me telling me that a lab at UofT had just received a quantum ML grant. I hit "Approve Outreach", and within 2 weeks I was officially nominated by Mitacs.',
    metricBadge: 'CAD $6,500 Full Award',
    researchArea: 'Quantum Computing'
  },
  {
    id: 't-3',
    studentName: 'Rohan Deshmukh',
    avatarUrl: '/testimonials/rohan-deshmukh.jpg',
    originUniversity: 'DTU (Delhi Technological University)',
    placedProgram: 'CERN Summer Student Fellow',
    hostInstitute: 'CERN (Geneva, Switzerland)',
    quote: 'Anusandhan ka Research Readiness Score (RRS) pinpointed exactly what my GitHub was missing: I had zero reproducible benchmarks. Once I added the replication badge and structured my 146-word inquiry, my outreach conversion jumped from 4% to 28%. CERN accepted me for the CMS experiment computing group!',
    metricBadge: 'CHF 94/day (~$3k/mo)',
    researchArea: 'Distributed Systems'
  }
];
