import 'reflect-metadata';

import dataSource from '../config/data-source';
import { User } from '../models/user.entity';
import { UserRole } from '../models/enums/user-role.enum';
import { Industry } from '../models/industry.entity';
import { ExperienceLevel } from '../models/experience-level.entity';
import { Company } from '../models/company.entity';
import { EmployerProfile } from '../models/employer-profile.entity';
import { Vacancy } from '../models/vacancy.entity';
import { EmploymentType } from '../models/enums/employment-type.enum';
import { WorkFormat } from '../models/enums/work-format.enum';
import { Resume } from '../models/resume.entity';
import { ResumeExperience } from '../models/resume-experience.entity';
import { Application } from '../models/application.entity';
import { FavoriteVacancy } from '../models/favorite-vacancy.entity';
import { VacancyView } from '../models/vacancy-view.entity';

async function seed() {
    await dataSource.initialize();

    const userRepository = dataSource.getRepository(User);
    const industryRepository = dataSource.getRepository(Industry);
    const experienceLevelRepository = dataSource.getRepository(ExperienceLevel);
    const companyRepository = dataSource.getRepository(Company);
    const employerProfileRepository = dataSource.getRepository(EmployerProfile);
    const vacancyRepository = dataSource.getRepository(Vacancy);
    const resumeRepository = dataSource.getRepository(Resume);
    const resumeExperienceRepository =
        dataSource.getRepository(ResumeExperience);
    const applicationRepository = dataSource.getRepository(Application);
    const favoriteRepository = dataSource.getRepository(FavoriteVacancy);
    const vacancyViewRepository = dataSource.getRepository(VacancyView);

    const findOrCreateUser = async (payload: {
        role: UserRole;
        firstName: string;
        lastName: string;
        middleName: string | null;
        email: string;
        password: string;
        phone: string;
        isVerified: boolean;
    }) => {
        const existingUser = await userRepository.findOneBy({
            email: payload.email,
        });

        if (existingUser) {
            return existingUser;
        }

        return await userRepository.save(userRepository.create(payload));
    };

    const applicant = await findOrCreateUser({
        role: UserRole.APPLICANT,
        firstName: 'Alice',
        lastName: 'Applicant',
        middleName: null,
        email: 'applicant@example.com',
        password: 'password123',
        phone: '+79990000001',
        isVerified: true,
    });

    const employer = await findOrCreateUser({
        role: UserRole.EMPLOYER,
        firstName: 'Egor',
        lastName: 'Employer',
        middleName: null,
        email: 'employer@example.com',
        password: 'password123',
        phone: '+79990000002',
        isVerified: true,
    });

    const admin = await findOrCreateUser({
        role: UserRole.ADMIN,
        firstName: 'Admin',
        lastName: 'User',
        middleName: null,
        email: 'admin@example.com',
        password: 'password123',
        phone: '+79990000003',
        isVerified: true,
    });

    void admin;

    const industriesInput = ['FinTech', 'EdTech', 'HealthTech'];
    const industries: Industry[] = [];

    for (const title of industriesInput) {
        const existing = await industryRepository.findOneBy({ title });
        if (existing) {
            industries.push(existing);
            continue;
        }

        industries.push(
            await industryRepository.save(
                industryRepository.create({
                    title,
                    isPublished: true,
                }),
            ),
        );
    }

    const experienceLevelsInput = [
        { title: 'Junior', minExperienceMonths: 0, maxExperienceMonths: 12 },
        { title: 'Middle', minExperienceMonths: 13, maxExperienceMonths: 36 },
        { title: 'Senior', minExperienceMonths: 37, maxExperienceMonths: 120 },
    ];
    const experienceLevels: ExperienceLevel[] = [];

    for (const level of experienceLevelsInput) {
        const existing = await experienceLevelRepository.findOneBy({
            title: level.title,
        });

        if (existing) {
            experienceLevels.push(existing);
            continue;
        }

        experienceLevels.push(
            await experienceLevelRepository.save(
                experienceLevelRepository.create({
                    ...level,
                    isPublished: true,
                }),
            ),
        );
    }

    const companiesInput = [
        {
            title: 'Acme Hiring',
            description: 'Product company focused on analytics tools.',
            website: 'https://acme.example.com',
            industryText: 'Software',
            address: 'Moscow, Tverskaya 1',
            employeeCount: 120,
        },
        {
            title: 'Northwind Careers',
            description: 'Marketplace for professional services.',
            website: 'https://northwind.example.com',
            industryText: 'Marketplace',
            address: 'Saint Petersburg, Nevsky 10',
            employeeCount: 75,
        },
    ];
    const companies: Company[] = [];

    for (const companyInput of companiesInput) {
        const existing = await companyRepository.findOneBy({
            title: companyInput.title,
        });

        if (existing) {
            companies.push(existing);
            continue;
        }

        companies.push(
            await companyRepository.save(
                companyRepository.create(companyInput),
            ),
        );
    }

    let employerProfile = await employerProfileRepository.findOneBy({
        userId: employer.id,
    });

    if (!employerProfile) {
        employerProfile = await employerProfileRepository.save(
            employerProfileRepository.create({
                userId: employer.id,
                companyId: companies[0].id,
                position: 'HR Partner',
            }),
        );
    }

    const vacancyInput = [
        {
            title: 'Backend Developer',
            description: 'Build APIs for a job search platform.',
            requirements: 'Node.js, SQL, REST',
            responsibilities:
                'Develop services, review code, improve reliability',
            salaryFrom: 180000,
            salaryTo: 260000,
            city: 'Moscow',
            employmentType: EmploymentType.FULL_TIME,
            workFormat: WorkFormat.HYBRID,
            companyId: companies[0].id,
            employerProfileId: employerProfile.id,
            industryId: industries[0].id,
            experienceLevelId: experienceLevels[1].id,
            isPublished: true,
        },
        {
            title: 'Platform Engineer',
            description: 'Maintain infrastructure and deployment pipelines.',
            requirements: 'Docker, CI/CD, observability',
            responsibilities: 'Support releases and scale services',
            salaryFrom: 220000,
            salaryTo: 320000,
            city: 'Saint Petersburg',
            employmentType: EmploymentType.FULL_TIME,
            workFormat: WorkFormat.REMOTE,
            companyId: companies[0].id,
            employerProfileId: employerProfile.id,
            industryId: industries[1].id,
            experienceLevelId: experienceLevels[2].id,
            isPublished: true,
        },
    ];
    const vacancies: Vacancy[] = [];

    for (const vacancyData of vacancyInput) {
        let vacancy = await vacancyRepository.findOneBy({
            title: vacancyData.title,
        });
        if (!vacancy) {
            vacancy = await vacancyRepository.save(
                vacancyRepository.create(vacancyData),
            );
        }

        vacancies.push(vacancy);
    }

    let resume = await resumeRepository.findOneBy({
        userId: applicant.id,
        title: 'Backend Engineer Resume',
    });

    if (!resume) {
        resume = await resumeRepository.save(
            resumeRepository.create({
                userId: applicant.id,
                title: 'Backend Engineer Resume',
                desiredPosition: 'Backend Developer',
                aboutMe:
                    'I build backend services with TypeScript and PostgreSQL.',
                skills: 'TypeScript, Node.js, PostgreSQL, Docker',
                education: 'ITMO University',
                salaryExpectation: 200000,
                city: 'Moscow',
                employmentType: EmploymentType.FULL_TIME,
                workFormat: WorkFormat.HYBRID,
                isPublished: true,
            }),
        );
    }

    const experienceCount = await resumeExperienceRepository.countBy({
        resumeId: resume.id,
    });

    if (!experienceCount) {
        await resumeExperienceRepository.save([
            resumeExperienceRepository.create({
                resumeId: resume.id,
                companyName: 'Cloud Sigma',
                position: 'Junior Backend Developer',
                description: 'Developed REST APIs and integrations.',
                startDate: '2023-01-01',
                endDate: '2024-01-31',
                monthsCount: 13,
            }),
            resumeExperienceRepository.create({
                resumeId: resume.id,
                companyName: 'Data River',
                position: 'Backend Developer',
                description: 'Implemented services for analytics ingestion.',
                startDate: '2024-02-01',
                endDate: null,
                monthsCount: 14,
            }),
        ]);
    }

    const existingApplication = await applicationRepository.findOneBy({
        vacancyId: vacancies[0].id,
        resumeId: resume.id,
    });

    if (!existingApplication) {
        await applicationRepository.save(
            applicationRepository.create({
                vacancyId: vacancies[0].id,
                resumeId: resume.id,
                userId: applicant.id,
                coverLetter: 'I would love to join your backend team.',
            }),
        );
    }

    const existingFavorite = await favoriteRepository.findOneBy({
        userId: applicant.id,
        vacancyId: vacancies[0].id,
    });

    if (!existingFavorite) {
        await favoriteRepository.save(
            favoriteRepository.create({
                userId: applicant.id,
                vacancyId: vacancies[0].id,
            }),
        );
    }

    const existingView = await vacancyViewRepository.findOneBy({
        userId: applicant.id,
        vacancyId: vacancies[0].id,
    });

    if (!existingView) {
        await vacancyViewRepository.save(
            vacancyViewRepository.create({
                userId: applicant.id,
                vacancyId: vacancies[0].id,
            }),
        );
    }

    await dataSource.destroy();
    console.log('Seed completed successfully');
}

seed().catch(async (error) => {
    console.error('Seed failed', error);

    if (dataSource.isInitialized) {
        await dataSource.destroy();
    }

    process.exit(1);
});
