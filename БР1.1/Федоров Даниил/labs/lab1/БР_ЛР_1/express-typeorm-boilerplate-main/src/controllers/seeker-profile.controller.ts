import {
    Body,
    ForbiddenError,
    Get,
    HttpError,
    NotFoundError,
    Param,
    Patch,
    Req,
    UseBefore,
} from 'routing-controllers';
import {
    ArrayUnique,
    IsArray,
    IsEmail,
    IsInt,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { In } from 'typeorm';

import dataSource from '../config/data-source';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import allowRoles from '../middlewares/role.middleware';

import { UserRole } from '../models/enums';
import { User } from '../models/user.entity';
import { Seeker } from '../models/seeker.entity';
import { Resume } from '../models/resume.entity';
import { Education } from '../models/education.entity';
import { ResumeExperience } from '../models/resume-experience.entity';
import { Skill } from '../models/skill.entity';
import { ResumeSkill } from '../models/resume-skill.entity';

import {
    serializeResume,
    serializeSeekerProfile,
} from '../views/serializers';



class UpdateSeekerProfileDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    first_name?: string;

    @IsOptional()
    @IsString()
    surname?: string;

    @IsOptional()
    @IsString()
    middle_name?: string;

    @IsOptional()
    @IsString()
    birth_date?: string;

    @IsOptional()
    @IsString()
    city?: string;
}

class EducationInputDto {
    @IsString()
    institution: string;

    @IsOptional()
    @IsString()
    degree?: string;

    @IsString()
    field_of_study: string;

    @IsString()
    start_date: string;

    @IsOptional()
    @IsString()
    end_date?: string;
}

class ResumeExperienceInputDto {
    @IsString()
    company_name: string;

    @IsString()
    position: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    start_date: string;

    @IsOptional()
    @IsString()
    end_date?: string;
}

class UpdateResumeDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    about_me?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EducationInputDto)
    educations?: EducationInputDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ResumeExperienceInputDto)
    experiences?: ResumeExperienceInputDto[];

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsInt({ each: true })
    skill_ids?: number[];
}

@EntityController({
    baseRoute: '/seekers',
    entity: Seeker,
})

class SeekerProfileController extends BaseController {
    private userRepository = dataSource.getRepository(User);
    private seekerRepository = dataSource.getRepository(Seeker);
    private resumeRepository = dataSource.getRepository(Resume);
    private educationRepository = dataSource.getRepository(Education);
    private resumeExperienceRepository = dataSource.getRepository(ResumeExperience);
    private skillRepository = dataSource.getRepository(Skill);
    private resumeSkillRepository = dataSource.getRepository(ResumeSkill);

    private ensureOwner(request: RequestWithUser, userId: number) {
        if (request.user.userId !== userId) {
            throw new ForbiddenError('Нет доступа к чужому профилю');
        }
    }

    private async getSeekerWithResumeByUserId(userId: number) {
        return this.seekerRepository.findOne({
            where:{
                user: {
                    userId: userId,
                },
            },
            relations: {
                user: true,
                resumes: {
                    seeker: true,
                    educations: true,
                    experiences: true,
                    resumeSkills: {
                        skill: true,
                    },
                },
            },
        });
    }

    @Get('/:userId/profile')
    @UseBefore(authMiddleware, allowRoles(UserRole.SEEKER))
    async getProfile(@Param ('userId') userId: number, @Req() request: RequestWithUser) {
        this.ensureOwner(request, Number(userId));

        const seeker = await this.getSeekerWithResumeByUserId(Number(userId));

        if (!seeker) {
            throw new NotFoundError('Профиль соискателя не найден');
        }

        return serializeSeekerProfile(seeker);
    }

    @Patch('/:userId/profile')
    @UseBefore(authMiddleware, allowRoles(UserRole.SEEKER))
    async updateProfile(
        @Param('userId') userId: number,
        @Body() body: UpdateSeekerProfileDto,
        @Req() request: RequestWithUser,
    ) {
        this.ensureOwner(request, Number(userId));

        const seeker = await this.seekerRepository.findOne({
            where: {
                user: {
                    userId: Number(userId),
                },
            },
            relations: {
                user: true,
            },
        });

        if (!seeker) {
            throw new NotFoundError('Профиль соискателя не найден');
        }

        if (body.email !== undefined && body.email !== seeker.user.email) {
            const userWithSameEmail = await this.userRepository.findOne({
                where: { email: body.email },
            });

            if (userWithSameEmail) {
                throw new HttpError(409, 'Пользователь с таким email уже существует');
            }

            seeker.user.email = body.email;

        }

        if (body.phone !== undefined) {
            seeker.user.phone = body.phone;
        }

        if (body.first_name !== undefined) {
            seeker.firstName = body.first_name;
        }

        if (body.surname !== undefined) {
            seeker.surname = body.surname;
        }

        if (body.middle_name !== undefined) {
            seeker.middleName = body.middle_name;
        }

        if (body.birth_date !== undefined) {
            seeker.birthDate = body.birth_date;
        }

        if (body.city !== undefined) {
            seeker.city = body.city;
        }

        await this.userRepository.save(seeker.user);
        await this.seekerRepository.save(seeker);

        const updatedSeeker = await this.getSeekerWithResumeByUserId(Number(userId));

        if (!updatedSeeker) {
            throw new NotFoundError('Профиль соискателя не найден');
        }

        return serializeSeekerProfile(updatedSeeker);
    }

    @Get ('/:userId/resume')
    @UseBefore(authMiddleware, allowRoles(UserRole.SEEKER))
    async getResume(@Param('userId') userId: number, @Req() request: RequestWithUser) {

        this.ensureOwner(request, Number(userId));

        const seeker = await this.getSeekerWithResumeByUserId(Number(userId));

        if (!seeker || seeker.resumes?.length) {
            throw new NotFoundError('Резюме не найдено');
        }

        return serializeResume(seeker.resumes[0]);
    }

    @Patch('/:userId/resume')
    @UseBefore(authMiddleware, allowRoles(UserRole.SEEKER))
    async updateResume(
        @Param('userId') userId: number,
        @Body() body: UpdateResumeDto,
        @Req() request: RequestWithUser,
    ) {
        this.ensureOwner(request, Number(userId));

        const seeker = await this.seekerRepository.findOne({
            where: {
                user: {
                    userId: Number(userId),
                },
            },
            relations: {
                user: true,
            },
        });

        if(!seeker) {
            throw new NotFoundError('Cоискателm не найден');
        }

        const resume = await this.resumeRepository.findOne({
            where: {
                seeker: {
                    profileId: seeker.profileId,
                },
            },
            relations: {
                seeker: true,
                educations: true,
                experiences: true,
                resumeSkills: {
                    skill: true,
                },
            },
        });

        if (!resume) {
            throw new NotFoundError('Резюме не найдено');
        }

        if (body.title !== undefined) {
            resume.title = body.title;
        }

        if (body.about_me !== undefined) {
            resume.aboutMe = body.about_me;
        }

        await this.resumeRepository.save(resume);

        if (body.educations !== undefined) {
            await this.educationRepository
                .createQueryBuilder()
                .delete()
                .from(Education)
                .where('resume_id = :resumeId', {
                    resumeId: resume.resumeId,
                })
                .execute();

            const newEducations = body.educations.map((education) =>
                this.educationRepository.create({
                    resume: resume,
                    institution: education.institution,
                    degree: education.degree || null,
                    fieldOfStudy: education.field_of_study,
                    startDate: education.start_date,
                    endDate: education.end_date || null,
                }),
            );
            await this.educationRepository.save(newEducations);
        }

        if (body.experiences !== undefined) {
            await this.resumeExperienceRepository
                .createQueryBuilder()
                .delete()
                .from(ResumeExperience)
                .where('resume_id = :resumeId', {
                    resumeId: resume.resumeId,
                })
                .execute();

            const newExperiences = body.experiences.map((experience) =>
                this.resumeExperienceRepository.create({
                    resume: resume,
                    companyName: experience.company_name,
                    position: experience.position,
                    description: experience.description || '',
                    startDate: experience.start_date,
                    endDate: experience.end_date || null,
                }),
            );

            await this.resumeExperienceRepository.save(newExperiences);
        }

        if (body.skill_ids !== undefined) {
            let skills: Skill[] = [];

            if (body.skill_ids.length > 0) {
                skills = await this.skillRepository.findBy({
                    skillId: In(body.skill_ids),
                });

                if (skills.length !== body.skill_ids.length) {
                    throw new NotFoundError('Один или несколько навыков не найдены');
                }
            }

            await this.resumeSkillRepository
                .createQueryBuilder()
                .delete()
                .from(ResumeSkill)
                .where('resume_id = :resumeId', {
                    resumeId: resume.resumeId,
                })
                .execute();

            const newResumeSkills = skills.map((skill) =>
                this.resumeSkillRepository.create({
                    resume: resume,
                    skill: skill,
                }),
            );

            await this.resumeSkillRepository.save(newResumeSkills);
        }
        const updatedResume = await this.resumeRepository.findOne({
            where: {
                resumeId: resume.resumeId,
            },
            relations: {
                seeker: true,
                educations: true,
                experiences: true,
                resumeSkills: {
                    skill: true,
                },
            },
        });

        if (!updatedResume) {
            throw new NotFoundError('Резюме не найдено');
        }

        return serializeResume(updatedResume);
    }
}

export default SeekerProfileController;