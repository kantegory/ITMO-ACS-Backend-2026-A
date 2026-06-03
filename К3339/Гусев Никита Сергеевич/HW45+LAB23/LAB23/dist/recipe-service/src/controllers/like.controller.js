"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeController = void 0;
const data_source_1 = require("../data-source");
const Like_1 = require("../entities/Like");
const likeRepository = data_source_1.AppDataSource.getRepository(Like_1.Like);
class LikeController {
    static async create(req, res) {
        const like = likeRepository.create({
            recipe_id: Number(req.params.id),
            user_id: req.body.user_id
        });
        await likeRepository.save(like);
        return res.status(201).json(like);
    }
    static async delete(req, res) {
        const like = await likeRepository.findOneBy({
            recipe_id: Number(req.params.id),
            user_id: req.body.user_id
        });
        if (!like) {
            return res.status(404).json({
                message: "Like not found"
            });
        }
        await likeRepository.remove(like);
        return res.status(204).send();
    }
}
exports.LikeController = LikeController;
