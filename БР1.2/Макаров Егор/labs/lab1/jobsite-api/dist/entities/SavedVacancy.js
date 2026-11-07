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
exports.SavedVacancy = void 0;
const typeorm_1 = require("typeorm");
const JobSeeker_1 = require("./JobSeeker");
const Vacancy_1 = require("./Vacancy");
let SavedVacancy = class SavedVacancy {
};
exports.SavedVacancy = SavedVacancy;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'job_seeker_id' }),
    __metadata("design:type", Number)
], SavedVacancy.prototype, "jobSeekerId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'vacancy_id' }),
    __metadata("design:type", Number)
], SavedVacancy.prototype, "vacancyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => JobSeeker_1.JobSeeker, (s) => s.savedVacancies, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'job_seeker_id' }),
    __metadata("design:type", JobSeeker_1.JobSeeker)
], SavedVacancy.prototype, "jobSeeker", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Vacancy_1.Vacancy, (v) => v.savedBy, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'vacancy_id' }),
    __metadata("design:type", Vacancy_1.Vacancy)
], SavedVacancy.prototype, "vacancy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SavedVacancy.prototype, "createdAt", void 0);
exports.SavedVacancy = SavedVacancy = __decorate([
    (0, typeorm_1.Entity)('saved_vacancies')
], SavedVacancy);
//# sourceMappingURL=SavedVacancy.js.map