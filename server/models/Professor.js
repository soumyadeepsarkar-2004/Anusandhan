import mongoose from 'mongoose';

const PaperSchema = new mongoose.Schema({
  title: String,
  year: Number,
  venue: String,
  citations: Number,
  doi: String,
  pdfUrl: String
});

const ActiveGrantSchema = new mongoose.Schema({
  grantId: String,
  agency: String, // ERC, NSF, SNSF
  title: String,
  amountUsd: Number,
  startYear: Number,
  endYear: Number,
  hiringTarget: String
});

const ProfessorSchema = new mongoose.Schema({
  profId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  title: String,
  department: String,
  institution: { type: String, required: true, index: true },
  country: { type: String, required: true, index: true },
  email: { type: String, required: true },
  labName: String,
  labUrl: String,
  researchDomains: [{ type: String, index: true }],
  topKeywords: [{ type: String }],
  recentPapers: [PaperSchema],
  activeGrants: [ActiveGrantSchema],
  metrics: {
    hIndex: { type: Number, default: 0 },
    totalCitations: { type: Number, default: 0 },
    citationVelocity2y: { type: Number, default: 0 },
    studentCoauthorRatio: { type: Number, default: 0.5 },
    activeGrantsTotalUsd: { type: Number, default: 0 },
    mentorReputationTier: String,
    calculatedMentorScore: { type: Number, default: 80 }
  },
  isAcceptingStudents: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const Professor = mongoose.models.Professor || mongoose.model('Professor', ProfessorSchema);
