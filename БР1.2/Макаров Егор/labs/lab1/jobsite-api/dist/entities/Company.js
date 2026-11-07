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
exports.Company = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("./enums");
const Industry_1 = require("./Industry");
const Employer_1 = require("./Employer");
const Vacancy_1 = require("./Vacancy");
let Company = class Company {
};
exports.Company = Company;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Company.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Company.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Company.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true, name: 'logo_url' }),
    __metadata("design:type", Object)
], Company.prototype, "logoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Company.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Industry_1.Industry, (i) => i.companies, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'industry_id' }),
    __metadata("design:type", Object)
], Company.prototype, "industry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'industry_id', nullable: true }),
    __metadata("design:type", Object)
], Company.prototype, "industryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.CompanySize, nullable: true }),
    __metadata("design:type", Object)
], Company.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Company.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Company.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Employer_1.Employer, (e) => e.company),
    __metadata("design:type", Array)
], Company.prototype, "employers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Vacancy_1.Vacancy, (v) => v.company),
    __metadata("design:type", Array)
], Company.prototype, "vacancies", void 0);
exports.Company = Company = __decorate([
    (0, typeorm_1.Entity)('companies')
], Company);
//# sourceMappingURL=Company.js.map