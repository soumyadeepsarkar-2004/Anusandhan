import { Professor, StudentProfile, OutreachDraft } from '../types';

export function generateColdEmail(professor: Professor, student: StudentProfile): OutreachDraft {
  const subjectLine = `Research Inquiry regarding your ${professor.recentPaper.venue} benchmark & Summer 2027 Inquiries`;

  const studentName = student.fullName || 'Scholar';
  const uniAffiliation = student.university ? ` at ${student.university}` : '';
  const yearText = student.currentYear ? `${student.currentYear} student` : 'undergraduate researcher';
  const studentSkills = student.skills?.length > 0 ? student.skills.slice(0, 3).join(', ') : '';

  const proofLink = student.featuredProject?.repoUrl || student.linkedAccounts?.githubUrl || '';

  let projectParagraph = '';
  if (student.featuredProject?.title && student.featuredProject?.description) {
    projectParagraph = `In my project "${student.featuredProject.title}", I investigated ${student.featuredProject.description}${studentSkills ? ` using ${studentSkills}` : ''}.${proofLink ? ` My reproducible baseline and experiments are available here: ${proofLink}.` : ''}`;
  } else if (studentSkills) {
    projectParagraph = `My technical background includes hands-on experience in ${studentSkills}.${proofLink ? ` Open-source implementations and benchmarks are documented on my GitHub: ${proofLink}.` : ''}`;
  } else {
    projectParagraph = `My academic focus centers on reproducible methodologies and empirical analysis aligned with ${professor.domain}.${proofLink ? ` Baseline repositories are available here: ${proofLink}.` : ''}`;
  }

  const signoffMeta = [
    student.university || '',
    student.linkedAccounts?.orcidId ? `ORCID: ${student.linkedAccounts.orcidId}` : '',
    student.linkedAccounts?.githubUrl ? `GitHub: ${student.linkedAccounts.githubUrl}` : ''
  ].filter(Boolean).join(' | ');

  const body = `Dear ${professor.name},

I hope this email finds you well. I am an ${yearText} in ${student.degreeLevel || 'B.Tech / B.S.'}${uniAffiliation} with a strong research focus on ${professor.domain}.

I recently read your ${professor.recentPaper.venue} paper, "${professor.recentPaper.title}". In particular, your insight regarding ${professor.recentPaper.snippet.slice(0, 110)}... offered a compelling direction for scalable benchmark evaluation.

${projectParagraph}

I would be deeply thrilled to contribute 20-30 hours/week (remotely or on-site under a funded fellowship like DAAD WISE or your active lab grant) to replicate benchmarks or extend your evaluation pipeline for Summer 2027.

Would you be open to a brief 10-minute introductory call next week, or could I review your group's open codebase? My 1-page CV is attached.

Thank you very much for your time and guidance.

Sincerely,
${studentName}
${signoffMeta || student.email || ''}`;

  const followUpBump = `Dear ${professor.name},

I hope you are having a productive week. I am following up on my research inquiry from last week regarding your ${professor.recentPaper.venue} paper ("${professor.recentPaper.title.slice(0, 50)}...").

I know how demanding your schedule is with teaching and lab grants; I would be deeply grateful for a quick word on whether your lab is considering undergraduate interns for Summer 2027. 

Thank you again for your time,
${studentName}`;

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
