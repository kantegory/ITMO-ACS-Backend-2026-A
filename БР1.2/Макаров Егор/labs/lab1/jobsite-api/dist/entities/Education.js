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
exports.Education = void 0;
const typeorm_1 = require("typeorm");
const Resume_1 = require("./Resume");
let Education = class Education {
};
exports.Education = Education;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Education.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Resume_1.Resume, (r) => r.educations, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'resume_id' }),
    __metadata("design:type", Resume_1.Resume)
], Education.prototype, "resume", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resume_id' }),
    __metadata("design:type", Number)
], Education.prototype, "resumeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Education.prototype, "institution", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Education.prototype, "degree", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, name: 'field_of_study' }),
    __metadata("design:type", Object)
], Education.prototype, "fieldOfStudy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'start_year' }),
    __metadata("design:type", Number)
], Education.prototype, "startYear", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'end_year' }),
    __metadata("design:type", Object)
], Education.prototype, "endYear", void 0);
exports.Education = Education = __decorate([
    (0, typeorm_1.Entity)('educations')
], Education);
//# sourceMappingURL=Education.js.map