import ResumeController from '../controllers/resume.controller';
import EducationController from '../controllers/education.controller';
import ExperienceController from '../controllers/experience.controller';
import { Resume } from '../models/resume.entity';
import { Education } from '../models/education.entity';
import { Experience } from '../models/experience.entity';
export type ServiceName = 'resume';
export function getServiceName(): ServiceName { return 'resume'; }
export function getServiceConfig(_serviceName: ServiceName) {
    return { database: 'resume_db', controllers: [ResumeController, EducationController, ExperienceController], entities: [Resume, Education, Experience], subscribers: [] };
}
