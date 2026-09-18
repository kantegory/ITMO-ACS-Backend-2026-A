import { Education } from '../models/education.entity';
import { Employer } from '../models/employer.entity';
import { ResumeExperience } from '../models/resume-experience.entity';
import { Resume } from '../models/resume.entity';
import { Seeker } from '../models/seeker.entity';

export interface ResolvedSkill {
    skill_id: number;
    name: string;
}

export const serializeEducation = (education: Education) => ({
    education_id: education.educationId,
    resume_id: education.resume?.resumeId,
    institution: education.institution,
    degree: education.degree,
    field_of_study: education.fieldOfStudy,
    start_date: education.startDate,
    end_date: education.endDate,
});

export const serializeResumeExperience = (experience: ResumeExperience) => ({
    resume_experience_id: experience.resumeExperienceId,
    resume_id: experience.resume?.resumeId,
    company_name: experience.companyName,
    position: experience.position,
    description: experience.description,
    start_date: experience.startDate,
    end_date: experience.endDate,
});

export const serializeResume = (resume: Resume, skills: ResolvedSkill[] = []) => ({
    resume_id: resume.resumeId,
    seeker_id: resume.seeker?.profileId,
    title: resume.title,
    about_me: resume.aboutMe,
    created_at: resume.createdAt,
    educations: (resume.educations || []).map(serializeEducation),
    experiences: (resume.experiences || []).map(serializeResumeExperience),
    skills: skills,
});

export const serializeSeekerProfile = (seeker: Seeker, skills: ResolvedSkill[] = []) => ({
    user_id: seeker.user.userId,
    profile_id: seeker.profileId,
    email: seeker.user.email,
    phone: seeker.user.phone,
    role: seeker.user.role,
    first_name: seeker.firstName,
    surname: seeker.surname,
    middle_name: seeker.middleName,
    birth_date: seeker.birthDate,
    city: seeker.city,
    resume: seeker.resumes?.[0] ? serializeResume(seeker.resumes[0], skills) : null,
});

export const serializeEmployerProfile = (employer: Employer) => ({
    user_id: employer.user.userId,
    profile_id: employer.profileId,
    email: employer.user.email,
    phone: employer.user.phone,
    role: employer.user.role,
    company_name: employer.companyName,
    company_website: employer.companyWebsite,
});


