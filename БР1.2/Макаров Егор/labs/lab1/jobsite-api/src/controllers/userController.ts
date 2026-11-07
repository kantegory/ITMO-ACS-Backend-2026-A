import { Request, Response } from 'express';
import { repos } from '../repos';
import { HttpError } from '../utils/httpError';
import { hashPassword, verifyPassword } from '../utils/password';
import { presentUser } from '../presenters';

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = await repos.user().findOne({ where: { id: req.user!.id } });
  if (!user) throw HttpError.notFound('Пользователь не найден');
  res.json(presentUser(user));
};

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  const user = await repos.user().findOne({ where: { id: req.user!.id } });
  if (!user) throw HttpError.notFound('Пользователь не найден');

  const { email, current_password, new_password } = req.body;

  if (email && email !== user.email) {
    const taken = await repos.user().findOne({ where: { email } });
    if (taken) throw HttpError.conflict('Email уже занят');
    user.email = email;
  }

  if (new_password) {
    if (!current_password || !(await verifyPassword(current_password, user.passwordHash))) {
      throw HttpError.validation('Неверный текущий пароль', [
        { field: 'current_password', message: 'Неверный текущий пароль' },
      ]);
    }
    user.passwordHash = await hashPassword(new_password);
  }

  await repos.user().save(user);
  res.json(presentUser(user));
};

export const deleteMe = async (req: Request, res: Response): Promise<void> => {
  await repos.user().delete({ id: req.user!.id });
  res.status(204).send();
};
