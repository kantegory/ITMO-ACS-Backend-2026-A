import { CoverLetter } from '../models/cover-letter.entity';
import { Education } from '../models/education.entity';
import { Employer } from '../models/employer.entity';
import { ExperienceOption } from '../models/experience-option.entity';
import { Industry } from '../models/industry.entity';
import { ResumeExperience } from '../models/resume-experience.entity';
import { Resume } from '../models/resume.entity';
import { Skill } from '../models/skill.entity';
import { Vacancy } from '../models/vacancy.entity';
import { ApplicationResponse } from '../models/response.entity';
import { Seeker } from '../models/seeker.entity';

export const serializeSkill = (skill: Skill) => ({
    skill_id: skill.skillId,
    name: skill.name,
});

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

export const serializeResume = (resume: Resume) => ({
    resume_id: resume.resumeId,
    seeker_id: resume.seeker?.profileId,
    title: resume.title,
    about_me: resume.aboutMe,
    created_at: resume.createdAt,
    educations: (resume.educations || []).map(serializeEducation),
    experiences: (resume.experiences || []).map(serializeResumeExperience),
    skills: (resume.resumeSkills || []).map((resumeSkill) =>
        serializeSkill(resumeSkill.skill),
    ),
});

export const serializeSeekerProfile = (seeker: Seeker) => ({
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
    resume: seeker.resumes?.[0] ? serializeResume(seeker.resumes[0]) : null,
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

export const serializeExperienceOption = (experience: ExperienceOption) => ({
    experience_id: experience.experienceId,
    period: experience.period,
});

export const serializeIndustry = (industry: Industry) => ({
    industry_id: industry.industryId,
    name: industry.name,
});

export const serializeVacancyShort = (vacancy: Vacancy) => ({
    vacancy_id: vacancy.vacancyId,
    employer_id: vacancy.employer?.profileId,
    title: vacancy.title,
    salary: vacancy.salary,
    city: vacancy.city,
    experience_id: vacancy.experience?.experienceId,
    experience: vacancy.experience?.period,
    industry_id: vacancy.industry?.industryId,
    industry: vacancy.industry?.name,
});

export const serializeVacancyDetail = (vacancy: Vacancy) => ({
    vacancy_id: vacancy.vacancyId,
    employer_id: vacancy.employer?.profileId,
    company_name: vacancy.employer?.companyName,
    experience_id: vacancy.experience?.experienceId,
    experience: vacancy.experience?.period,
    industry_id: vacancy.industry?.industryId,
    industry: vacancy.industry?.name,
    title: vacancy.title,
    description: vacancy.description,
    requirements: vacancy.requirements,
    salary: vacancy.salary,
    city: vacancy.city,
    skills: (vacancy.vacancySkills || []).map((vacancySkill) =>
        serializeSkill(vacancySkill.skill),
    ),
});

export const serializeCoverLetter = (coverLetter?: CoverLetter | null) => {
    if (!coverLetter) {
        return null;
    }

    return {
        cover_letter_id: coverLetter.coverLetterId,
        response_id: coverLetter.response?.responseId,
        text: coverLetter.text,
    };
};

export const serializeEmployerResponseShort = (
    response: ApplicationResponse,
) => ({
    response_id: response.responseId,
    vacancy_id: response.vacancy?.vacancyId,
    vacancy_title: response.vacancy?.title,
    seeker_id: response.resume?.seeker?.profileId,
    seeker_full_name: [
        response.resume?.seeker?.surname,
        response.resume?.seeker?.firstName,
        response.resume?.seeker?.middleName,
    ]
        .filter(Boolean)
        .join(' '),
    resume_id: response.resume?.resumeId,
    resume_title: response.resume?.title,
    status: response.status,
    created_at: response.createdAt,
});

export const serializeEmployerResponseDetail = (
    response: ApplicationResponse,
) => ({
    response_id: response.responseId,
    status: response.status,
    created_at: response.createdAt,
    vacancy: {
        vacancy_id: response.vacancy?.vacancyId,
        title: response.vacancy?.title,
        city: response.vacancy?.city,
        salary: response.vacancy?.salary,
    },
    seeker: {
        profile_id: response.resume?.seeker?.profileId,
        first_name: response.resume?.seeker?.firstName,
        surname: response.resume?.seeker?.surname,
        middle_name: response.resume?.seeker?.middleName,
        birth_date: response.resume?.seeker?.birthDate,
        city: response.resume?.seeker?.city,
        email: response.resume?.seeker?.user?.email,
        phone: response.resume?.seeker?.user?.phone,
    },
    resume: serializeResume(response.resume),
    cover_letter: serializeCoverLetter(response.coverLetter),
});

