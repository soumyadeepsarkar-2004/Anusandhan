import express from 'express';
import mongoose from 'mongoose';
import { Student } from '../models/Student.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { sqliteDao } from '../db/sqliteDb.js';

const isDbConnected = () => mongoose.connection?.readyState === 1;

const router = express.Router();

// Multi-tenant in-memory student store mapped by userId (eliminating global singleton)
const memoryStudents = new Map();

const getDefaultStudent = (id = 'student_active') => ({
  id,
  fullName: '',
  email: '',
  university: '',
  degreeLevel: 'B.Tech / B.S.',
  graduationYear: new Date().getFullYear() + 1,
  cgpa: 0,
  targetDomains: [],
  skills: [],
  rrsScore: 0,
  rrsTier: 'Developing',
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
  creditsRemaining: 0
});

router.get('/me', authenticateToken, async (req, res) => {
  const studentId = req.user?.id || req.user?.userId || 'student_active';
  try {
    // 1. Check MongoDB if active
    let student = null;
    if (isDbConnected()) {
      try {
        student = await Student.findOne({ id: studentId });
      } catch {}
    }

    if (!student) {
      // 2. Check durable SQLite store
      try {
        const sqliteUser = await sqliteDao.getUserById(studentId) || (req.user?.email ? await sqliteDao.getUserByEmail(req.user.email) : null);
        if (sqliteUser) {
          const base = memoryStudents.get(studentId) || getDefaultStudent(studentId);
          student = {
            ...base,
            id: sqliteUser.id,
            fullName: sqliteUser.fullName || base.fullName,
            email: sqliteUser.email || base.email,
            university: sqliteUser.university || base.university,
            degreeLevel: sqliteUser.degreeLevel || base.degreeLevel,
            cgpa: sqliteUser.cgpa !== undefined ? sqliteUser.cgpa : base.cgpa,
            targetDomains: sqliteUser.targetDomains?.length ? sqliteUser.targetDomains : base.targetDomains,
            skills: sqliteUser.skills?.length ? sqliteUser.skills : base.skills,
            rrsScore: sqliteUser.rrsScore !== undefined ? sqliteUser.rrsScore : base.rrsScore,
            rrsTier: sqliteUser.rrsTier || base.rrsTier,
            creditsRemaining: sqliteUser.creditsRemaining !== undefined ? sqliteUser.creditsRemaining : base.creditsRemaining,
            isVerified: sqliteUser.isVerified,
            isInstitutionalVerified: sqliteUser.isInstitutionalVerified
          };
          memoryStudents.set(studentId, student);
        }
      } catch {}
    }

    if (!student) {
      if (!memoryStudents.has(studentId)) {
        memoryStudents.set(studentId, getDefaultStudent(studentId));
      }
      student = memoryStudents.get(studentId);
    }
    res.json(student);
  } catch (err) {
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

    // Persist to durable SQLite relational store
    try {
      await sqliteDao.upsertUser({
        id: studentId,
        email: updatedMemory.email || req.user?.email,
        fullName: updatedMemory.fullName,
        university: updatedMemory.university,
        degreeLevel: updatedMemory.degreeLevel,
        currentYear: updatedMemory.graduationYear ? `Class of ${updatedMemory.graduationYear}` : undefined,
        cgpa: updatedMemory.cgpa,
        targetDomains: updatedMemory.targetDomains,
        skills: updatedMemory.skills,
        rrsScore: updatedMemory.rrsScore,
        rrsTier: updatedMemory.rrsTier,
        creditsRemaining: updatedMemory.creditsRemaining
      });
    } catch (sqliteErr) {
      console.warn('[Student API] SQLite sync notice:', sqliteErr.message);
    }

    // Persist to MongoDB if active
    if (isDbConnected()) {
      try {
        const student = await Student.findOneAndUpdate(
          { id: studentId },
          { $set: updates },
          { new: true, upsert: true }
        );
        if (student) return res.json(student);
      } catch (mongoErr) {
        console.warn('[Student API] MongoDB notice:', mongoErr.message);
      }
    }

    return res.json(updatedMemory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
