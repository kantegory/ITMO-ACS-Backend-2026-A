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
exports.BlogPost = exports.BlogCategory = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
var BlogCategory;
(function (BlogCategory) {
    BlogCategory["NUTRITION"] = "nutrition";
    BlogCategory["HEALTH"] = "health";
    BlogCategory["MOTIVATION"] = "motivation";
    BlogCategory["RECOVERY"] = "recovery";
    BlogCategory["SCIENCE"] = "science";
})(BlogCategory || (exports.BlogCategory = BlogCategory = {}));
let BlogPost = class BlogPost {
};
exports.BlogPost = BlogPost;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], BlogPost.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BlogPost.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], BlogPost.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BlogPost.prototype, "featured_image", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-enum", enum: BlogCategory }),
    __metadata("design:type", String)
], BlogPost.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BlogPost.prototype, "author_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    __metadata("design:type", User_1.User)
], BlogPost.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BlogPost.prototype, "created_at", void 0);
exports.BlogPost = BlogPost = __decorate([
    (0, typeorm_1.Entity)("blog_posts")
], BlogPost);
