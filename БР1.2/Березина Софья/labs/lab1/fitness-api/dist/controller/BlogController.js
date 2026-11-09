"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogController = void 0;
const data_source_1 = require("../data-source");
const BlogPost_1 = require("../entity/BlogPost");
class BlogController {
    static async getPosts(req, res) {
        const { category } = req.query;
        const blogRepo = data_source_1.AppDataSource.getRepository(BlogPost_1.BlogPost);
        let query = blogRepo
            .createQueryBuilder("b")
            .leftJoinAndSelect("b.author", "a")
            .orderBy("b.created_at", "DESC");
        if (category) {
            query = query.andWhere("b.category = :category", { category });
        }
        const posts = await query.getMany();
        res.json(posts);
    }
    static async getPostById(req, res) {
        const { id } = req.params;
        const blogRepo = data_source_1.AppDataSource.getRepository(BlogPost_1.BlogPost);
        const post = await blogRepo.findOne({
            where: { id },
            relations: ["author"],
        });
        if (!post) {
            res
                .status(404)
                .json({
                error: "Not Found",
                message: "Post not found",
                status_code: 404,
            });
            return;
        }
        res.json(post);
    }
}
exports.BlogController = BlogController;
