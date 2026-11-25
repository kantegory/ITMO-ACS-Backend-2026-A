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
exports.UserProfile = exports.ActivityLevel = exports.FitnessLevel = exports.Gender = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
var Gender;
(function (Gender) {
    Gender["MALE"] = "male";
    Gender["FEMALE"] = "female";
})(Gender || (exports.Gender = Gender = {}));
var FitnessLevel;
(function (FitnessLevel) {
    FitnessLevel["BEGINNER"] = "beginner";
    FitnessLevel["INTERMEDIATE"] = "intermediate";
    FitnessLevel["ADVANCED"] = "advanced";
    FitnessLevel["PROFESSIONAL"] = "professional";
})(FitnessLevel || (exports.FitnessLevel = FitnessLevel = {}));
var ActivityLevel;
(function (ActivityLevel) {
    ActivityLevel["SEDENTARY"] = "sedentary";
    ActivityLevel["LIGHT"] = "light";
    ActivityLevel["MODERATE"] = "moderate";
    ActivityLevel["ACTIVE"] = "active";
    ActivityLevel["VERY_ACTIVE"] = "very_active";
})(ActivityLevel || (exports.ActivityLevel = ActivityLevel = {}));
let UserProfile = class UserProfile {
};
exports.UserProfile = UserProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], UserProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserProfile.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", User_1.User)
], UserProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], UserProfile.prototype, "full_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], UserProfile.prototype, "birth_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-enum", enum: Gender, nullable: true }),
    __metadata("design:type", String)
], UserProfile.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-enum", enum: FitnessLevel, nullable: true }),
    __metadata("design:type", String)
], UserProfile.prototype, "fitness_level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "float", nullable: true }),
    __metadata("design:type", Number)
], UserProfile.prototype, "height_cm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "float", nullable: true }),
    __metadata("design:type", Number)
], UserProfile.prototype, "weight_kg", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-enum", enum: ActivityLevel, nullable: true }),
    __metadata("design:type", String)
], UserProfile.prototype, "activity_level", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], UserProfile.prototype, "avatar_url", void 0);
exports.UserProfile = UserProfile = __decorate([
    (0, typeorm_1.Entity)("user_profiles")
], UserProfile);
