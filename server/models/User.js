import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    index: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  fullName: { 
    type: String, 
    required: true,
    trim: true 
  },
  university: { 
    type: String, 
    default: 'State / Regional University' 
  },
  degreeLevel: { 
    type: String, 
    default: 'Undergraduate Student' 
  },
  graduationYear: { 
    type: Number, 
    default: 2027 
  },
  cgpa: { 
    type: Number, 
    default: 8.5 
  },
  targetDomains: [{ 
    type: String 
  }],
  skills: [{ 
    type: String 
  }],
  rrsScore: { 
    type: Number, 
    default: 75 
  },
  rrsTier: { 
    type: String, 
    default: 'Competitive Candidate' 
  },
  role: { 
    type: String, 
    enum: ['student', 'researcher', 'mentor'], 
    default: 'student' 
  },
  creditsRemaining: { 
    type: Number, 
    default: 10 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  isInstitutionalVerified: {
    type: Boolean,
    default: false
  },
  institutionalEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  linkedAccounts: {
    githubUrl: String,
    orcidId: String,
    googleScholarUrl: String,
    huggingFaceUrl: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  bufferCommands: false,
  autoIndex: false
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
