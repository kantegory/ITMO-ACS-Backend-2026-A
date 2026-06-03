"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const data_source_1 = require("../data-source");
const User_1 = require("../entities/User");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
class AuthController {
    static async register(req, res) {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = userRepository.create({
            username,
            email,
            password: hashedPassword
        });
        await userRepository.save(user);
        return res.status(201).json(user);
    }
    static async login(req, res) {
        const { email, password } = req.body;
        const user = await userRepository.findOneBy({
            email
        });
        if (!user) {
            return res.status(401).json({
                message: "Invalid email"
            });
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id }, "secret", { expiresIn: "24h" });
        return res.json({
            token
        });
    }
}
exports.AuthController = AuthController;
