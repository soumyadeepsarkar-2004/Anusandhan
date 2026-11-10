import { Professor, StudentProfile } from '../types';
import { FACULTY_DATABASE } from '../data/facultyDatabase';

export function matchProfessorsForStudent(student: StudentProfile): Professor[] {
  const isBlankScholar = !student.fullName && (!student.targetDomains || student.targetDomains.length === 0) && (!student.skills || student.skills.length === 0) && (student.rrsScore || 0) === 0;

  return FACULTY_DATABASE.map(prof => {
    let score = isBlankScholar ? 50 : 55; // baseline

    // 1. Domain alignment (+25)
    if (student.targetDomains && student.targetDomains.includes(prof.domain)) {
      score += 25;
    }

    // 2. Technical skill alignment (+15 max)
    if (student.skills && student.skills.length > 0) {
      const profText = `${prof.researchFocus} ${prof.recentPaper.title} ${prof.recentPaper.snippet}`.toLowerCase();
      const matchedSkillCount = student.skills.filter(s => profText.includes(s.toLowerCase())).length;
      if (matchedSkillCount >= 3) {
        score += 15;
      } else if (matchedSkillCount > 0) {
        score += matchedSkillCount * 5;
      }
    }

    // 3. Country preference (+10)
    if (student.targetCountries && student.targetCountries.some(c => prof.country.includes(c))) {
      score += 10;
    }

    // 4. High Mentorship Ratio (+10)
    if ((prof.metrics?.studentCoAuthorshipRatio || 0) >= 0.8) {
      score += 10;
    } else if ((prof.metrics?.studentCoAuthorshipRatio || 0) >= 0.7) {
      score += 6;
    }

    // 5. Active Grant (+8)
    if (prof.metrics?.activeGrant) {
      score += 8;
    }

    // 6. RRS alignment (+7)
    if (student.rrsScore >= 70 && (prof.metrics?.hIndex || 0) > 50) {
      score += 7;
    }

    const finalScore = isBlankScholar ? 50 : Math.min(99, Math.max(50, score));

    return {
      ...prof,
      matchScore: finalScore
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}
