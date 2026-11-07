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
exports.Vacancy = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("./enums");
const Company_1 = require("./Company");
const Employer_1 = require("./Employer");
const Skill_1 = require("./Skill");
const Application_1 = require("./Application");
const SavedVacancy_1 = require("./SavedVacancy");
let Vacancy = class Vacancy {
};
exports.Vacancy = Vacancy;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Vacancy.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Company_1.Company, (c) => c.vacancies, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'company_id' }),
    __metadata("design:type", Company_1.Company)
], Vacancy.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'company_id' }),
    __metadata("design:type", Number)
], Vacancy.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Employer_1.Employer, (e) => e.vacancies, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'employer_id' }),
    __metadata("design:type", Object)
], Vacancy.prototype, "employer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'employer_id', nullable: true }),
    __metadata("design:type", Object)
], Vacancy.prototype, "employerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Vacancy.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Vacancy.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Vacancy.prototype, "requirements", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'salary_from' }),
    __metadata("design:type", Object)
], Vacancy.prototype, "salaryFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'salary_to' }),
    __metadata("design:type", Object)
], Vacancy.prototype, "salaryTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'RUB' }),
    __metadata("design:type", String)
], Vacancy.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'experience_years' }),
    __metadata("design:type", Object)
], Vacancy.prototype, "experienceYears", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.EmploymentType, nullable: true, name: 'employment_type' }),
    __metadata("design:type", Object)
], Vacancy.prototype, "employmentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.Schedule, nullable: true }),
    __metadata("design:type", Object)
], Vacancy.prototype, "schedule", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Vacancy.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.VacancyStatus, default: enums_1.VacancyStatus.ACTIVE }),
    __metadata("design:type", String)
], Vacancy.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Vacancy.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Vacancy.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Skill_1.Skill, (s) => s.vacancies),
    (0, typeorm_1.JoinTable)({
        name: 'vacancy_skills',
        joinColumn: { name: 'vacancy_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'skill_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Vacancy.prototype, "skills", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Application_1.Application, (a) => a.vacancy),
    __metadata("design:type", Array)
], Vacancy.prototype, "applications", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SavedVacancy_1.SavedVacancy, (sv) => sv.vacancy),
    __metadata("design:type", Array)
], Vacancy.prototype, "savedBy", void 0);
exports.Vacancy = Vacancy = __decorate([
    (0, typeorm_1.Entity)('vacancies')
], Vacancy);
//# sourceMappingURL=Vacancy.js.map