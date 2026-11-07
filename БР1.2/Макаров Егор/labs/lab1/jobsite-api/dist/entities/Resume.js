"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resume = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("./enums");
const JobSeeker_1 = require("./JobSeeker");
const WorkExperience_1 = require("./WorkExperience");
const Education_1 = require("./Education");
const Skill_1 = require("./Skill");
const Application_1 = require("./Application");
let Resume = class Resume {
};
exports.Resume = Resume;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Resume.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => JobSeeker_1.JobSeeker, (s) => s.resumes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'job_seeker_id' }),
    __metadata("design:type", JobSeeker_1.JobSeeker)
], Resume.prototype, "jobSeeker", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'job_seeker_id' }),
    __metadata("design:type", Number)
], Resume.prototype, "jobSeekerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Resume.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'salary_expected' }),
    __metadata("design:type", Object)
], Resume.prototype, "salaryExpected", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'RUB' }),
    __metadata("design:type", String)
], Resume.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.EmploymentType, nullable: true, name: 'employment_type' }),
    __metadata("design:type", Object)
], Resume.prototype, "employmentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.Schedule, nullable: true }),
    __metadata("design:type", Object)
], Resume.prototype, "schedule", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.ResumeStatus, default: enums_1.ResumeStatus.ACTIVE }),
    __metadata("design:type", String)
], Resume.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Resume.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Resume.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => WorkExperience_1.WorkExperience, (w) => w.resume, { cascade: true }),
    __metadata("design:type", Array)
], Resume.prototype, "workExperiences", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Education_1.Education, (e) => e.resume, { cascade: true }),
    __metadata("design:type", Array)
], Resume.prototype, "educations", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Skill_1.Skill, (s) => s.resumes),
    (0, typeorm_1.JoinTable)({
        name: 'resume_skills',
        joinColumn: { name: 'resume_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'skill_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Resume.prototype, "skills", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Application_1.Application, (a) => a.resume),
    __metadata("design:type", Array)
], Resume.prototype, "applications", void 0);
exports.Resume = Resume = __decorate([
    (0, typeorm_1.Entity)('resumes')
], Resume);
//# sourceMappingURL=Resume.js.map