"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowController = void 0;
const data_source_1 = require("../data-source");
const Follow_1 = require("../entities/Follow");
const followRepository = data_source_1.AppDataSource.getRepository(Follow_1.Follow);
class FollowController {
    static async create(req, res) {
        const follow = followRepository.create({
            follower_id: req.body.follower_id,
            following_id: Number(req.params.id)
        });
        await followRepository.save(follow);
        return res.status(201).json(follow);
    }
    static async delete(req, res) {
        const follow = await followRepository.findOneBy({
            follower_id: req.body.follower_id,
            following_id: Number(req.params.id)
        });
        if (!follow) {
            return res.status(404).json({
                message: "Follow not found"
            });
        }
        await followRepository.remove(follow);
        return res.status(204).send();
    }
}
exports.FollowController = FollowController;
