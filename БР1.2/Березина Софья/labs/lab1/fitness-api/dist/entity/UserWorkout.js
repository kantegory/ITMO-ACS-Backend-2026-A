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
exports.UserWorkout = exports.UserWorkoutStatus = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Workout_1 = require("./Workout");
var UserWorkoutStatus;
(function (UserWorkoutStatus) {
    UserWorkoutStatus["SCHEDULED"] = "scheduled";
    UserWorkoutStatus["IN_PROGRESS"] = "in_progress";
    UserWorkoutStatus["COMPLETED"] = "completed";
    UserWorkoutStatus["SKIPPED"] = "skipped";
})(UserWorkoutStatus || (exports.UserWorkoutStatus = UserWorkoutStatus = {}));
let UserWorkout = class UserWorkout {
};
exports.UserWorkout = UserWorkout;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserWorkout.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserWorkout.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    __metadata("design:type", User_1.User)
], UserWorkout.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserWorkout.prototype, "workout_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Workout_1.Workout),
    __metadata("design:type", Workout_1.Workout)
], UserWorkout.prototype, "workout", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "simple-enum",
        enum: UserWorkoutStatus,
        default: UserWorkoutStatus.SCHEDULED,
    }),
    __metadata("design:type", String)
], UserWorkout.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], UserWorkout.prototype, "scheduled_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], UserWorkout.prototype, "completed_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], UserWorkout.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], UserWorkout.prototype, "result_notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], UserWorkout.prototype, "completed_exercises_count", void 0);
exports.UserWorkout = UserWorkout = __decorate([
    (0, typeorm_1.Entity)("user_workouts")
], UserWorkout);
