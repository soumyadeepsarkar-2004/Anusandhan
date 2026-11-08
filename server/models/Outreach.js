import mongoose from 'mongoose';

const OutreachSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  professorId: { type: String, required: true },
  professorName: { type: String, required: true },
  professorEmail: { type: String, required: true },
  university: { type: String, required: true },
  subjectLine: { type: String, required: true },
  bodyText: { type: String, required: true },
  wordCount: { type: Number, required: true },
  targetedPaper: String,
  status: {
    type: String,
    enum: ['drafted', 'queued', 'sent', 'opened', 'replied', 'interview_scheduled', 'closed'],
    default: 'drafted',
    index: true
  },
  jitterScheduledSendTime: Date,
  jitterDelayMinutes: Number,
  humanConfirmed: { type: Boolean, default: false },
  sentAt: Date,
  daysSinceSent: { type: Number, default: 0 },
  followUpBumpDraft: String,
  followUpStatus: {
    type: String,
    enum: ['not_scheduled', 'scheduled', 'bump_sent', 'replied'],
    default: 'not_scheduled'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Outreach = mongoose.models.Outreach || mongoose.model('Outreach', OutreachSchema);
