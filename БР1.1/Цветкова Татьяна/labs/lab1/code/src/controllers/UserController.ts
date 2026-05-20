import { Request, Response } from "express";
import { UserService } from "../services/UserService";
import { UpdateProfileDto } from "../dto/user.dto";
import { validateDto } from "../utils/validate";

const service = new UserService();

const sanitize = (u: Record<string, unknown>) => {
  const { passwordHash: _ph, ...rest } = u;
  return rest;
};

export const UserController = {
  async me(req: Request, res: Response) {
    const user = await service.getById(req.user!.sub);
    res.json(sanitize(user as unknown as Record<string, unknown>));
  },

  async updateMe(req: Request, res: Response) {
    const dto = await validateDto(UpdateProfileDto, req.body);
    const user = await service.updateProfile(req.user!.sub, dto);
    res.json(sanitize(user as unknown as Record<string, unknown>));
  },

  async deleteMe(req: Request, res: Response) {
    await service.deleteAccount(req.user!.sub);
    res.status(204).send();
  },
};
