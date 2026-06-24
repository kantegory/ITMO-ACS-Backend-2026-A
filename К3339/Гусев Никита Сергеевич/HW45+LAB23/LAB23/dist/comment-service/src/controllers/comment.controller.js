"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentController = void 0;
const data_source_1 = require("../data-source");
const Comment_1 = require("../entities/Comment");
const commentRepository = data_source_1.AppDataSource.getRepository(Comment_1.Comment);
class CommentController {
    static async create(req, res) {
        const comment = commentRepository.create({
            text: req.body.text,
            recipe_id: Number(req.params.id),
            user_id: req.body.user_id
        });
        await commentRepository.save(comment);
        return res.status(201).json(comment);
    }
    static async getByRecipe(req, res) {
        const comments = await commentRepository.find({
            where: {
                recipe_id: Number(req.params.id)
            }
        });
        return res.json(comments);
    }
}
exports.CommentController = CommentController;
