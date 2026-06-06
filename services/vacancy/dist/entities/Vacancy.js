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
const Company_1 = require("./Company");
let Vacancy = class Vacancy {
    id;
    companyId;
    company;
    title;
    description;
    requirements;
    industry;
    salaryFrom;
    salaryTo;
    experienceLevel;
    location;
    employmentType;
    status;
    createdAt;
    updatedAt;
};
exports.Vacancy = Vacancy;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Vacancy.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "company_id", type: "uuid" }),
    __metadata("design:type", String)
], Vacancy.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Company_1.Company, (c) => c.vacancies, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "company_id" }),
    __metadata("design:type", Company_1.Company)
], Vacancy.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Vacancy.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Vacancy.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Vacancy.prototype, "requirements", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Vacancy.prototype, "industry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "salary_from", type: "int", nullable: true }),
    __metadata("design:type", Object)
], Vacancy.prototype, "salaryFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "salary_to", type: "int", nullable: true }),
    __metadata("design:type", Object)
], Vacancy.prototype, "salaryTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "experience_level", type: "text" }),
    __metadata("design:type", String)
], Vacancy.prototype, "experienceLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Vacancy.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "employment_type", type: "text" }),
    __metadata("design:type", String)
], Vacancy.prototype, "employmentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "draft" }),
    __metadata("design:type", String)
], Vacancy.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], Vacancy.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], Vacancy.prototype, "updatedAt", void 0);
exports.Vacancy = Vacancy = __decorate([
    (0, typeorm_1.Entity)("vacancies")
], Vacancy);
