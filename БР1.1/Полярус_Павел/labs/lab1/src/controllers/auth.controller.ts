import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterStep1Dto } from '../dto/RegisterStep1Dto';
import { RegisterSeekerDto } from '../dto/RegisterSeekerDto';
import { RegisterEmployerDto } from '../dto/RegisterEmployerDto';
import { LoginDto } from '../dto/LoginDto';

const service = new AuthService();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const step1 = async (
  req: Request<object, object, RegisterStep1Dto>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await service.step1(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const registerSeeker = async (
  req: Request<object, object, RegisterSeekerDto>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await service.registerSeeker(req.user!.sub, req.body);
    res.cookie('access_token', result.accessToken, COOKIE_OPTIONS);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const registerEmployer = async (
  req: Request<object, object, RegisterEmployerDto>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await service.registerEmployer(req.user!.sub, req.body);
    res.cookie('access_token', result.accessToken, COOKIE_OPTIONS);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request<object, object, LoginDto>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await service.login(req.body);
    res.cookie('access_token', result.accessToken, COOKIE_OPTIONS);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.me(req.user!.sub);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('access_token');
  res.status(204).send();
};
