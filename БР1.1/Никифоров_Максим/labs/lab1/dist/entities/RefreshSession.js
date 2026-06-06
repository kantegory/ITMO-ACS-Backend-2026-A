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
exports.RefreshSession = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let RefreshSession = class RefreshSession {
    id;
    userId;
    user;
    tokenHash;
    userAgent;
    ip;
    expiresAt;
    revokedAt;
    createdAt;
    lastUsedAt;
};
exports.RefreshSession = RefreshSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RefreshSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_id", type: "uuid" }),
    __metadata("design:type", String)
], RefreshSession.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (u) => u.sessions, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", User_1.User)
], RefreshSession.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "token_hash", type: "text", unique: true }),
    __metadata("design:type", String)
], RefreshSession.prototype, "tokenHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_agent", type: "text", nullable: true }),
    __metadata("design:type", Object)
], RefreshSession.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "inet", nullable: true }),
    __metadata("design:type", Object)
], RefreshSession.prototype, "ip", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "expires_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], RefreshSession.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "revoked_at", type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], RefreshSession.prototype, "revokedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], RefreshSession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "last_used_at", type: "timestamptz" }),
    __metadata("design:type", Date)
], RefreshSession.prototype, "lastUsedAt", void 0);
exports.RefreshSession = RefreshSession = __decorate([
    (0, typeorm_1.Entity)("refresh_sessions")
], RefreshSession);
