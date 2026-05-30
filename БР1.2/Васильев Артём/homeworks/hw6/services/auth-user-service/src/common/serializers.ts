import { instanceToPlain } from 'class-transformer';

import { User } from '../models/user.entity';

export const serializeEntity = <T>(entity: T) => instanceToPlain(entity) as T;

export const serializeUser = (user: User) => serializeEntity(user);
