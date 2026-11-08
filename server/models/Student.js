import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  fullName: { type: String, required: true },
  university: { type: String, default: 'IIT Delhi' },
  degreeLevel: { type: String, default: 'Undergraduate (B.Tech)' },
  graduationYear: { type: Number, default: 2027 },
  cgpa: { type: Number, default: 9.2 },
  targetDomains: [{ type: String }],
  skills: [{ type: String }],
  rrsScore: { type: Number, default: 85 },
  rrsTier: { type: String, default: 'Elite Global Fellow' },
  rrsPillars: {
    codeExecution: { type: Number, default: 22 },
    researchMethodology: { type: Number, default: 20 },
    academicFoundations: { type: Number, default: 20 },
    labTooling: { type: Number, default: 12 },
    professionalism: { type: Number, default: 11 }
  },
  linkedAccounts: {
    githubUrl: String,
    orcidId: String,
    googleScholarUrl: String,
    huggingFaceUrl: String
  },
  dailyOutreachCount: { type: Number, default: 0 },
  creditsRemaining: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
