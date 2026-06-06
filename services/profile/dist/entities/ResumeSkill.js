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
exports.ResumeSkill = void 0;
const typeorm_1 = require("typeorm");
const Resume_1 = require("./Resume");
const Skill_1 = require("./Skill");
let ResumeSkill = class ResumeSkill {
    resumeId;
    skillId;
    resume;
    skill;
};
exports.ResumeSkill = ResumeSkill;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: "resume_id", type: "uuid" }),
    __metadata("design:type", String)
], ResumeSkill.prototype, "resumeId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: "skill_id", type: "uuid" }),
    __metadata("design:type", String)
], ResumeSkill.prototype, "skillId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Resume_1.Resume, (r) => r.resumeSkills, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "resume_id" }),
    __metadata("design:type", Resume_1.Resume)
], ResumeSkill.prototype, "resume", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Skill_1.Skill, { onDelete: "CASCADE", eager: true }),
    (0, typeorm_1.JoinColumn)({ name: "skill_id" }),
    __metadata("design:type", Skill_1.Skill)
], ResumeSkill.prototype, "skill", void 0);
exports.ResumeSkill = ResumeSkill = __decorate([
    (0, typeorm_1.Entity)("resume_skills")
], ResumeSkill);
