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
exports.Workout = exports.DifficultyLevel = exports.WorkoutType = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Exercise_1 = require("./Exercise");
var WorkoutType;
(function (WorkoutType) {
    WorkoutType["CARDIO"] = "cardio";
    WorkoutType["STRENGTH"] = "strength";
    WorkoutType["HIIT"] = "hiit";
    WorkoutType["YOGA"] = "yoga";
    WorkoutType["PILATES"] = "pilates";
    WorkoutType["STRETCHING"] = "stretching";
})(WorkoutType || (exports.WorkoutType = WorkoutType = {}));
var DifficultyLevel;
(function (DifficultyLevel) {
    DifficultyLevel["BEGINNER"] = "beginner";
    DifficultyLevel["INTERMEDIATE"] = "intermediate";
    DifficultyLevel["ADVANCED"] = "advanced";
})(DifficultyLevel || (exports.DifficultyLevel = DifficultyLevel = {}));
let Workout = class Workout {
};
exports.Workout = Workout;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Workout.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Workout.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-enum", enum: WorkoutType }),
    __metadata("design:type", String)
], Workout.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-enum", enum: DifficultyLevel }),
    __metadata("design:type", String)
], Workout.prototype, "difficulty_level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Workout.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Workout.prototype, "duration_min", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Workout.prototype, "video_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Workout.prototype, "instructions", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Workout.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    __metadata("design:type", User_1.User)
], Workout.prototype, "created_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Workout.prototype, "is_published", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Workout.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Exercise_1.Exercise),
    (0, typeorm_1.JoinTable)({
        name: "workout_exercises",
        joinColumn: { name: "workout_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "exercise_id", referencedColumnName: "id" },
    }),
    __metadata("design:type", Array)
], Workout.prototype, "exercises", void 0);
exports.Workout = Workout = __decorate([
    (0, typeorm_1.Entity)("workouts")
], Workout);
