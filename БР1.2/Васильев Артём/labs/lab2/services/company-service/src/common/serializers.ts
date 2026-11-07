import { instanceToPlain } from 'class-transformer';

export const serializeEntity = <T>(entity: T) => instanceToPlain(entity) as T;

export const serializeUser = <T>(user: T) => serializeEntity(user);
