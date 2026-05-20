import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { LoginDto, RefreshDto, RegisterDto } from "../dto/auth.dto";
import { validateDto } from "../utils/validate";

const service = new AuthService();

export const AuthController = {
  async register(req: Request, res: Response) {
    const dto = await validateDto(RegisterDto, req.body);
    const result = await service.register(dto);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const dto = await validateDto(LoginDto, req.body);
    const result = await service.login(dto);
    res.json(result);
  },

  async refresh(req: Request, res: Response) {
    const dto = await validateDto(RefreshDto, req.body);
    const result = await service.refresh(dto.refreshToken);
    res.json(result);
  },
};
