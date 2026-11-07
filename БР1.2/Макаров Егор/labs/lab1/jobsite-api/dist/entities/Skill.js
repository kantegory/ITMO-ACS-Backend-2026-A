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
exports.Skill = void 0;
const typeorm_1 = require("typeorm");
const Resume_1 = require("./Resume");
const Vacancy_1 = require("./Vacancy");
let Skill = class Skill {
};
exports.Skill = Skill;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Skill.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], Skill.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Resume_1.Resume, (r) => r.skills),
    __metadata("design:type", Array)
], Skill.prototype, "resumes", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Vacancy_1.Vacancy, (v) => v.skills),
    __metadata("design:type", Array)
], Skill.prototype, "vacancies", void 0);
exports.Skill = Skill = __decorate([
    (0, typeorm_1.Entity)('skills')
], Skill);
//# sourceMappingURL=Skill.js.map