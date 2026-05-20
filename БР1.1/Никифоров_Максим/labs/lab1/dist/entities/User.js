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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const CandidateProfile_1 = require("./CandidateProfile");
const Resume_1 = require("./Resume");
const Company_1 = require("./Company");
const RefreshSession_1 = require("./RefreshSession");
let User = class User {
    id;
    email;
    passwordHash;
    role;
    fullName;
    createdAt;
    updatedAt;
    candidateProfile;
    resumes;
    company;
    sessions;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "password_hash", type: "text" }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "full_name", type: "text" }),
    __metadata("design:type", String)
], User.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => CandidateProfile_1.CandidateProfile, (p) => p.user),
    __metadata("design:type", CandidateProfile_1.CandidateProfile)
], User.prototype, "candidateProfile", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Resume_1.Resume, (r) => r.user),
    __metadata("design:type", Array)
], User.prototype, "resumes", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Company_1.Company, (c) => c.owner),
    __metadata("design:type", Company_1.Company)
], User.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => RefreshSession_1.RefreshSession, (s) => s.user),
    __metadata("design:type", Array)
], User.prototype, "sessions", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)("users")
], User);
