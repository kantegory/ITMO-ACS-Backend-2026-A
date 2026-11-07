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
exports.JobSeeker = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Resume_1 = require("./Resume");
const SavedVacancy_1 = require("./SavedVacancy");
let JobSeeker = class JobSeeker {
};
exports.JobSeeker = JobSeeker;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], JobSeeker.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => User_1.User, (u) => u.jobSeeker, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], JobSeeker.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], JobSeeker.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'first_name' }),
    __metadata("design:type", String)
], JobSeeker.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'last_name' }),
    __metadata("design:type", String)
], JobSeeker.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], JobSeeker.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], JobSeeker.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' }),
    __metadata("design:type", Object)
], JobSeeker.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], JobSeeker.prototype, "about", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], JobSeeker.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Resume_1.Resume, (r) => r.jobSeeker),
    __metadata("design:type", Array)
], JobSeeker.prototype, "resumes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SavedVacancy_1.SavedVacancy, (sv) => sv.jobSeeker),
    __metadata("design:type", Array)
], JobSeeker.prototype, "savedVacancies", void 0);
exports.JobSeeker = JobSeeker = __decorate([
    (0, typeorm_1.Entity)('job_seekers')
], JobSeeker);
//# sourceMappingURL=JobSeeker.js.map