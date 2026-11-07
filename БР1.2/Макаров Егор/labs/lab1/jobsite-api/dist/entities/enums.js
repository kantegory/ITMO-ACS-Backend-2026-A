"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationStatus = exports.VacancyStatus = exports.ResumeStatus = exports.Schedule = exports.EmploymentType = exports.CompanySize = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SEEKER"] = "seeker";
    UserRole["EMPLOYER"] = "employer";
})(UserRole || (exports.UserRole = UserRole = {}));
var CompanySize;
(function (CompanySize) {
    CompanySize["SMALL"] = "small";
    CompanySize["MEDIUM"] = "medium";
    CompanySize["LARGE"] = "large";
})(CompanySize || (exports.CompanySize = CompanySize = {}));
var EmploymentType;
(function (EmploymentType) {
    EmploymentType["FULL_TIME"] = "full_time";
    EmploymentType["PART_TIME"] = "part_time";
    EmploymentType["REMOTE"] = "remote";
    EmploymentType["FREELANCE"] = "freelance";
})(EmploymentType || (exports.EmploymentType = EmploymentType = {}));
var Schedule;
(function (Schedule) {
    Schedule["FULL_DAY"] = "full_day";
    Schedule["SHIFT"] = "shift";
    Schedule["FLEXIBLE"] = "flexible";
    Schedule["REMOTE"] = "remote";
})(Schedule || (exports.Schedule = Schedule = {}));
var ResumeStatus;
(function (ResumeStatus) {
    ResumeStatus["ACTIVE"] = "active";
    ResumeStatus["HIDDEN"] = "hidden";
})(ResumeStatus || (exports.ResumeStatus = ResumeStatus = {}));
var VacancyStatus;
(function (VacancyStatus) {
    VacancyStatus["ACTIVE"] = "active";
    VacancyStatus["CLOSED"] = "closed";
    VacancyStatus["DRAFT"] = "draft";
})(VacancyStatus || (exports.VacancyStatus = VacancyStatus = {}));
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["PENDING"] = "pending";
    ApplicationStatus["VIEWED"] = "viewed";
    ApplicationStatus["INVITED"] = "invited";
    ApplicationStatus["REJECTED"] = "rejected";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
//# sourceMappingURL=enums.js.map