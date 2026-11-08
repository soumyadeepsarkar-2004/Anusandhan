import express from 'express';
import { Student } from '../models/Student.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multi-tenant in-memory student store mapped by userId (eliminating global singleton)
const memoryStudents = new Map();

const getDefaultStudent = (id = 'student_active') => ({
  id,
  fullName: '',
  email: '',
  university: '',
  degreeLevel: 'B.Tech / B.S.',
  graduationYear: 2027,
  cgpa: 0,
  targetDomains: [],
  skills: [],
  rrsScore: 0,
  rrsTier: 'Explorer',
  rrsPillars: {
    codeExecution: 0,
    researchMethodology: 0,
    academicFoundations: 0,
    labTooling: 0,
    professionalism: 0
  },
  linkedAccounts: {
    githubUrl: '',
    orcidId: '',
    googleScholarUrl: '',
    huggingFaceUrl: ''
  },
  dailyOutreachCount: 0,
  creditsRemaining: 10
});

router.get('/me', authenticateToken, async (req, res) => {
  const studentId = req.user?.id || req.user?.userId || 'student_active';
  try {
    let student = await Student.findOne({ id: studentId });
    if (!student) {
      if (!memoryStudents.has(studentId)) {
        memoryStudents.set(studentId, getDefaultStudent(studentId));
      }
      student = memoryStudents.get(studentId);
    }
    res.json(student);
  } catch {
    if (!memoryStudents.has(studentId)) {
      memoryStudents.set(studentId, getDefaultStudent(studentId));
    }
    res.json(memoryStudents.get(studentId));
  }
});

router.put('/me', authenticateToken, async (req, res) => {
  const studentId = req.user?.id || req.user?.userId || 'student_active';
  try {
    const updates = req.body;
    const current = memoryStudents.get(studentId) || getDefaultStudent(studentId);
    const updatedMemory = { ...current, ...updates, updatedAt: new Date() };
    memoryStudents.set(studentId, updatedMemory);

    try {
      const student = await Student.findOneAndUpdate(
        { id: studentId },
        { $set: updates },
        { new: true, upsert: true }
      );
      return res.json(student);
    } catch {
      return res.json(updatedMemory);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
