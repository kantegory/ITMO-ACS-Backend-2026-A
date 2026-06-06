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
exports.ResumeSummary = void 0;
const typeorm_1 = require("typeorm");
const Resume_1 = require("./Resume");
let ResumeSummary = class ResumeSummary {
    id;
    resumeId;
    resume;
    content;
    createdAt;
    updatedAt;
};
exports.ResumeSummary = ResumeSummary;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ResumeSummary.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "resume_id", type: "uuid", unique: true }),
    __metadata("design:type", String)
], ResumeSummary.prototype, "resumeId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Resume_1.Resume, (r) => r.summary, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "resume_id" }),
    __metadata("design:type", Resume_1.Resume)
], ResumeSummary.prototype, "resume", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], ResumeSummary.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], ResumeSummary.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], ResumeSummary.prototype, "updatedAt", void 0);
exports.ResumeSummary = ResumeSummary = __decorate([
    (0, typeorm_1.Entity)("resume_summaries")
], ResumeSummary);
