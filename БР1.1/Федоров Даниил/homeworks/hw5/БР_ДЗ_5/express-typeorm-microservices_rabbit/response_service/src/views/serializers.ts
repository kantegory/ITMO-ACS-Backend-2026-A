import { CoverLetter } from '../models/cover-letter.entity';
import { ApplicationResponse } from '../models/response.entity';


export interface ResolvedVacancy {
    vacancy_id: number;
    employer_id: number;
    title: string;
}


export interface ResolvedResume {
    resume_id: number;
    seeker_id: number;
    title: string;

    seeker: {
        first_name: string;
        surname: string;
        middle_name?: string | null;
        email: string;
        phone: string;
    };
}


export const serializeCoverLetter = (coverLetter?: CoverLetter | null) => {
    if (!coverLetter) {
        return null;
    }

    return {
        cover_letter_id:coverLetter.coverLetterId,

        response_id:coverLetter.response?.responseId,

        text:coverLetter.text,
    };
};


export const serializeEmployerResponseShort = (
    response: ApplicationResponse,
    vacancy: ResolvedVacancy,
    resume: ResolvedResume,
) => ({
    response_id:response.responseId,

    vacancy_id:response.vacancyId,

    vacancy_title:vacancy.title,
    seeker_id:response.seekerId,

    seeker_full_name: [
        resume.seeker.surname,
        resume.seeker.first_name,
        resume.seeker.middle_name,
    ].filter(Boolean).join(' '),

    resume_id:response.resumeId,

    resume_title:resume.title,

    status:response.status,

    created_at:response.createdAt,
});


export const serializeEmployerResponseDetail = (
    response: ApplicationResponse,
    vacancy: ResolvedVacancy,
    resume: ResolvedResume,
) => ({
    response_id:response.responseId,

    status:response.status,

    created_at:response.createdAt,

    vacancy: {
        vacancy_id:vacancy.vacancy_id,

        title:vacancy.title,
    },

    seeker: {
        profile_id:resume.seeker_id,

        first_name:resume.seeker.first_name,

        surname:resume.seeker.surname,

        middle_name:resume.seeker.middle_name,

        email:resume.seeker.email,

        phone:resume.seeker.phone,
    },

    resume: {
        resume_id:resume.resume_id,

        title:resume.title,
    },

    cover_letter:serializeCoverLetter(response.coverLetter),
});