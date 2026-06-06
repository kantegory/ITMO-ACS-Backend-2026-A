import { AppError } from '../utils/errors';

const BASE = process.env.RESUME_SERVICE_URL || 'http://resume-service:3000';
const SECRET = process.env.INTERNAL_SECRET || 'internal_secret';

export interface ResumeDto {
  id: string;
  title: string;
  jobSeekerId: string;
  isPublished: boolean;
  experienceMonths: number;
  updatedAt: string;
}

export async function getResumeById(resumeId: string): Promise<ResumeDto | null> {
  try {
    const res = await fetch(`${BASE}/internal/resumes/${resumeId}`, {
      headers: { 'X-Internal-Secret': SECRET },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new AppError(502, 'Resume service unavailable');

    return res.json() as Promise<ResumeDto>;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(502, 'Resume service error');
  }
}