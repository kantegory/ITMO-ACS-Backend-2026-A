import { makeDataSource } from '@jobsearch/common';
import { Resume } from './models/resume.entity';
import { ResumeExperience } from './models/resume-experience.entity';
import { ResumeEducation } from './models/resume-education.entity';
import { ResumeSkill } from './models/resume-skill.entity';

export const dataSource = makeDataSource([Resume, ResumeExperience, ResumeEducation, ResumeSkill]);
