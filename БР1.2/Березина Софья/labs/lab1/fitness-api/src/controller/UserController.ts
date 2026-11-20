import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { UserProfile } from "../entity/UserProfile";
import bcrypt from "bcryptjs";

export class UserController {
  static async getMyProfile(req: AuthRequest, res: Response) {
    const userRepo = AppDataSource.getRepository(User);
    const profileRepo = AppDataSource.getRepository(UserProfile);

    const user = await userRepo.findOneBy({ id: req.user!.id });
    const profile = await profileRepo.findOneBy({ user_id: req.user!.id });

    res.json({ user, profile });
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    const profileRepo = AppDataSource.getRepository(UserProfile);
    const profile = await profileRepo.findOneBy({ user_id: req.user!.id });

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

    const {
      full_name,
      birth_date,
      gender,
      fitness_level,
      height_cm,
      weight_kg,
      activity_level,
      avatar_url,
    } = req.body;

    if (full_name !== undefined) profile.full_name = full_name;
    if (birth_date !== undefined) profile.birth_date = new Date(birth_date);
    if (gender !== undefined) profile.gender = gender;
    if (fitness_level !== undefined) profile.fitness_level = fitness_level;
    if (height_cm !== undefined) profile.height_cm = height_cm;
    if (weight_kg !== undefined) profile.weight_kg = weight_kg;
    if (activity_level !== undefined) profile.activity_level = activity_level;
    if (avatar_url !== undefined) profile.avatar_url = avatar_url;

    await profileRepo.save(profile);
    res.json(profile);
  }

  static async changePassword(req: AuthRequest, res: Response) {
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

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: req.user!.id });

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

    const isValid = await bcrypt.compare(current_password, user.password_hash);
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

    user.password_hash = await bcrypt.hash(new_password, 10);
    await userRepo.save(user);

    res.status(204).send();
  }
}
