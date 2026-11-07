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
exports.Application = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("./enums");
const Vacancy_1 = require("./Vacancy");
const Resume_1 = require("./Resume");
let Application = class Application {
};
exports.Application = Application;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Application.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Vacancy_1.Vacancy, (v) => v.applications, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'vacancy_id' }),
    __metadata("design:type", Vacancy_1.Vacancy)
], Application.prototype, "vacancy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vacancy_id' }),
    __metadata("design:type", Number)
], Application.prototype, "vacancyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Resume_1.Resume, (r) => r.applications, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'resume_id' }),
    __metadata("design:type", Resume_1.Resume)
], Application.prototype, "resume", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resume_id' }),
    __metadata("design:type", Number)
], Application.prototype, "resumeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'cover_letter' }),
    __metadata("design:type", Object)
], Application.prototype, "coverLetter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.ApplicationStatus, default: enums_1.ApplicationStatus.PENDING }),
    __metadata("design:type", String)
], Application.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Application.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Application.prototype, "updatedAt", void 0);
exports.Application = Application = __decorate([
    (0, typeorm_1.Entity)('applications'),
    (0, typeorm_1.Unique)(['vacancyId', 'resumeId'])
], Application);
//# sourceMappingURL=Application.js.map