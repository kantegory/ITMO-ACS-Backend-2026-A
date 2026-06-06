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
const ResumeSummary_1 = require("./ResumeSummary");
const ResumeSkill_1 = require("./ResumeSkill");
let Resume = class Resume {
    id;
    userId;
    title;
    experienceLevel;
    summary;
    resumeSkills;
    createdAt;
    updatedAt;
};
exports.Resume = Resume;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Resume.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_id", type: "uuid" }),
    __metadata("design:type", String)
], Resume.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Resume.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "experience_level", type: "text" }),
    __metadata("design:type", String)
], Resume.prototype, "experienceLevel", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => ResumeSummary_1.ResumeSummary, (s) => s.resume),
    __metadata("design:type", Object)
], Resume.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ResumeSkill_1.ResumeSkill, (rs) => rs.resume),
    __metadata("design:type", Array)
], Resume.prototype, "resumeSkills", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], Resume.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], Resume.prototype, "updatedAt", void 0);
exports.Resume = Resume = __decorate([
    (0, typeorm_1.Entity)("resumes")
], Resume);
