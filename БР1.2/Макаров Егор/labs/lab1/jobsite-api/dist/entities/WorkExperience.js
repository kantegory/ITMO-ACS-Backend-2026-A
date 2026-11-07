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
exports.WorkExperience = void 0;
const typeorm_1 = require("typeorm");
const Resume_1 = require("./Resume");
let WorkExperience = class WorkExperience {
};
exports.WorkExperience = WorkExperience;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], WorkExperience.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Resume_1.Resume, (r) => r.workExperiences, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'resume_id' }),
    __metadata("design:type", Resume_1.Resume)
], WorkExperience.prototype, "resume", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resume_id' }),
    __metadata("design:type", Number)
], WorkExperience.prototype, "resumeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'company_name' }),
    __metadata("design:type", String)
], WorkExperience.prototype, "companyName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], WorkExperience.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'start_date' }),
    __metadata("design:type", String)
], WorkExperience.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true, name: 'end_date' }),
    __metadata("design:type", Object)
], WorkExperience.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_current' }),
    __metadata("design:type", Boolean)
], WorkExperience.prototype, "isCurrent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], WorkExperience.prototype, "description", void 0);
exports.WorkExperience = WorkExperience = __decorate([
    (0, typeorm_1.Entity)('work_experiences')
], WorkExperience);
//# sourceMappingURL=WorkExperience.js.map