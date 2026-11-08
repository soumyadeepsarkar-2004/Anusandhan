import { Professor, StudentProfile } from '../types';
import { FACULTY_DATABASE } from '../data/facultyDatabase';

export function matchProfessorsForStudent(student: StudentProfile): Professor[] {
  return FACULTY_DATABASE.map(prof => {
    let score = 50; // base score

    // Domain alignment (+25)
    if (student.targetDomains.includes(prof.domain)) {
      score += 25;
    }

    // Country preference (+10)
    if (student.targetCountries.some(c => prof.country.includes(c))) {
      score += 10;
    }

    // High Mentorship Ratio (+10)
    if (prof.metrics.studentCoAuthorshipRatio >= 0.8) {
      score += 10;
    } else if (prof.metrics.studentCoAuthorshipRatio >= 0.7) {
      score += 6;
    }

    // Active Grant (+8)
    if (prof.metrics.activeGrant) {
      score += 8;
    }

    // RRS alignment (+7)
    if (student.rrsScore >= 70 && prof.metrics.hIndex > 50) {
      score += 7;
    }

    const finalScore = Math.min(99, Math.max(65, score));

    return {
      ...prof,
      matchScore: finalScore
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}
