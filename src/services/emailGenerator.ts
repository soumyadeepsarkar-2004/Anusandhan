import { Professor, StudentProfile, OutreachDraft } from '../types';

export function generateColdEmail(professor: Professor, student: StudentProfile): OutreachDraft {
  const subjectLine = `Research Inquiry regarding your ${professor.recentPaper.venue} benchmark & Summer 2027 Inquiries`;

  const proofLink = student.featuredProject.repoUrl || student.linkedAccounts.githubUrl || 'https://github.com/my-research-code';

  const body = `Dear ${professor.name},

I hope this email finds you well. I am a 3rd-year student in ${student.degreeLevel} at ${student.university} with a strong research focus on ${professor.domain}.

I recently read your ${professor.recentPaper.venue} paper, "${professor.recentPaper.title}". In particular, your insight regarding ${professor.recentPaper.snippet.slice(0, 110)}... offered a compelling direction for scalable benchmark evaluation.

In my recent project, "${student.featuredProject.title}", I worked on ${student.featuredProject.description} using ${student.skills.slice(0, 3).join(', ')}. My reproducible PyTorch baseline and experiments are available here: ${proofLink}.

I would be deeply thrilled to contribute 20-30 hours/week (remotely or on-site under a funded fellowship like DAAD WISE or your active lab grant) to replicate benchmarks or extend your evaluation pipeline for Summer 2027.

Would you be open to a brief 10-minute introductory call next week, or could I review your group's open codebase? My 1-page CV is attached.

Thank you very much for your time and guidance.

Sincerely,
${student.fullName}
${student.university} | ORCID: ${student.linkedAccounts.orcidId || 'Verified'}
GitHub: ${student.linkedAccounts.githubUrl || proofLink}`;

  const followUpBump = `Dear ${professor.name},

I hope you are having a productive week. I am following up on my research inquiry from last week regarding your ${professor.recentPaper.venue} paper ("${professor.recentPaper.title.slice(0, 50)}...").

I know how demanding your schedule is with teaching and lab grants; I would be deeply grateful for a quick word on whether your lab is considering undergraduate interns for Summer 2027. 

Thank you again for your time,
${student.fullName}`;

  return {
    id: `draft-${professor.id}-${Date.now()}`,
    professorId: professor.id,
    professorName: professor.name,
    professorEmail: professor.contactEmail,
    university: professor.university,
    paperTitle: professor.recentPaper.title,
    subjectLine,
    body,
    status: 'Drafted',
    followUpBumpDraft: followUpBump
  };
}

export function createGmailComposeUrl(to: string, subject: string, body: string): string {
  const baseUrl = 'https://mail.google.com/mail/?view=cm&fs=1';
  const params = new URLSearchParams({
    to,
    su: subject,
    body
  });
  return `${baseUrl}&${params.toString()}`;
}

export function createMailtoUrl(to: string, subject: string, body: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
