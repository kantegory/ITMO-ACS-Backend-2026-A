import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseEnv } from '../shared/env';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { RevokedToken } from './entities/revoked-token.entity';

const db = databaseEnv('IDENTITY');

export const identityDataSource = new DataSource({
  type: 'postgres',
  ...db,
  entities: [User, UserProfile, RevokedToken],
  synchronize: true,
  logging: false,
});
