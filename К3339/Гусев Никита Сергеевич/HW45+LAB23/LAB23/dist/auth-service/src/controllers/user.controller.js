"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = void 0;
const data_source_1 = require("../data-source");
const User_1 = require("../entities/User");
const getMe = async (req, res) => {
    const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
    const user = await userRepository.findOneBy({
        id: req.userId
    });
    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }
    res.json(user);
};
exports.getMe = getMe;
