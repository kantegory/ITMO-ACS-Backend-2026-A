import { AppDataSource } from '../config/database';
import { Application, ApplicationStatus } from '../entities/Application';
import { CreateApplicationDto, UpdateApplicationStatusDto } from '../dto/ApplicationDto';
import * as userClient from '../clients/user.client';
import * as resumeClient from '../clients/resume.client';
import * as vacancyClient from '../clients/vacancy.client';
import { publishApplicationCreated, publishApplicationStatusChanged } from '../messaging/publisher';
import { AppError } from '../utils/errors';

const applicationRepo = AppDataSource.getRepository(Application);

export async function createApplication(userId: string, dto: CreateApplicationDto): Promise<Application> {
  const seeker = await userClient.getSeekerByUser(userId);
  if (!seeker) throw new AppError(403, 'Seeker profile not found');

  const resume = await resumeClient.getResumeById(dto.resumeId);
  if (!resume) throw new AppError(404, 'Resume not found');
  if (resume.jobSeekerId !== seeker.id) throw new AppError(403, 'Resume does not belong to you');

  const vacancy = await vacancyClient.getVacancyById(dto.vacancyId);
  if (!vacancy) throw new AppError(404, 'Vacancy not found');

  const existing = await applicationRepo.findOne({
    where: { resumeId: dto.resumeId, vacancyId: dto.vacancyId },
  });
  if (existing) throw new AppError(409, 'Application already exists for this resume and vacancy');

  const application = applicationRepo.create({
    resumeId: dto.resumeId,
    vacancyId: dto.vacancyId,
    seekerUserId: userId,
    coverLetter: dto.coverLetter || null,
  });
  await applicationRepo.save(application);

  const employer = await userClient.getEmployerByUser(vacancy.employerId);
  const employerUserId = employer?.userId || vacancy.employerId;

  publishApplicationCreated(
    application.id,
    application.vacancyId,
    application.resumeId,
    application.seekerUserId,
    employerUserId,
  );

  return application;
}

export async function getMyApplications(userId: string): Promise<Application[]> {
  const seeker = await userClient.getSeekerByUser(userId);
  if (!seeker) throw new AppError(403, 'Only seekers can view applications');

  return applicationRepo.find({
    where: { seekerUserId: userId },
    order: { createdAt: 'DESC' },
  });
}

export async function getApplicationById(
  userId: string,
  role: string,
  applicationId: string,
): Promise<Application | null> {
  const application = await applicationRepo.findOne({ where: { id: applicationId } });
  if (!application) return null;

  if (role === 'SEEKER') {
    if (application.seekerUserId !== userId) {
      throw new AppError(403, 'You can only view your own applications');
    }
  }

  if (role === 'EMPLOYER') {
    const vacancy = await vacancyClient.getVacancyById(application.vacancyId);
    if (!vacancy) throw new AppError(404, 'Vacancy not found');

    const employer = await userClient.getEmployerByUser(userId);
    if (!employer || employer.id !== vacancy.employerId) {
      throw new AppError(403, 'You can only view applications for your vacancies');
    }
  }

  return application;
}

export async function updateApplicationStatus(
  userId: string,
  applicationId: string,
  dto: UpdateApplicationStatusDto,
): Promise<Application> {
  const application = await applicationRepo.findOne({ where: { id: applicationId } });
  if (!application) throw new AppError(404, 'Application not found');

  const vacancy = await vacancyClient.getVacancyById(application.vacancyId);
  if (!vacancy) throw new AppError(404, 'Vacancy not found');

  const employer = await userClient.getEmployerByUser(userId);
  if (!employer || employer.id !== vacancy.employerId) {
    throw new AppError(403, 'You can only update applications for your vacancies');
  }

  application.status = dto.status as ApplicationStatus;
  await applicationRepo.save(application);

  publishApplicationStatusChanged(application.id, application.status, application.seekerUserId);

  return application;
}
