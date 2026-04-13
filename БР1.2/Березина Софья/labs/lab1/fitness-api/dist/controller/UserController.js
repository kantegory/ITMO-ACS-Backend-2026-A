"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const data_source_1 = require("../data-source");
const User_1 = require("../entity/User");
const UserProfile_1 = require("../entity/UserProfile");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserController {
    static async getMyProfile(req, res) {
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const profileRepo = data_source_1.AppDataSource.getRepository(UserProfile_1.UserProfile);
        const user = await userRepo.findOneBy({ id: req.user.id });
        const profile = await profileRepo.findOneBy({ user_id: req.user.id });
        res.json({ user, profile });
    }
    static async updateProfile(req, res) {
        const profileRepo = data_source_1.AppDataSource.getRepository(UserProfile_1.UserProfile);
        const profile = await profileRepo.findOneBy({ user_id: req.user.id });
        if (!profile) {
            res
                .status(404)
                .json({
                error: "Not Found",
                message: "Profile not found",
                status_code: 404,
            });
            return;
        }
        const { full_name, birth_date, gender, fitness_level, height_cm, weight_kg, activity_level, avatar_url, } = req.body;
        if (full_name !== undefined)
            profile.full_name = full_name;
        if (birth_date !== undefined)
            profile.birth_date = new Date(birth_date);
        if (gender !== undefined)
            profile.gender = gender;
        if (fitness_level !== undefined)
            profile.fitness_level = fitness_level;
        if (height_cm !== undefined)
            profile.height_cm = height_cm;
        if (weight_kg !== undefined)
            profile.weight_kg = weight_kg;
        if (activity_level !== undefined)
            profile.activity_level = activity_level;
        if (avatar_url !== undefined)
            profile.avatar_url = avatar_url;
        await profileRepo.save(profile);
        res.json(profile);
    }
    static async changePassword(req, res) {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password || new_password.length < 6) {
            res
                .status(400)
                .json({
                error: "Bad Request",
                message: "Invalid password data",
                status_code: 400,
            });
            return;
        }
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOneBy({ id: req.user.id });
        if (!user) {
            res
                .status(404)
                .json({
                error: "Not Found",
                message: "User not found",
                status_code: 404,
            });
            return;
        }
        const isValid = await bcryptjs_1.default.compare(current_password, user.password_hash);
        if (!isValid) {
            res
                .status(401)
                .json({
                error: "Unauthorized",
                message: "Current password is incorrect",
                status_code: 401,
            });
            return;
        }
        user.password_hash = await bcryptjs_1.default.hash(new_password, 10);
        await userRepo.save(user);
        res.status(204).send();
    }
}
exports.UserController = UserController;
