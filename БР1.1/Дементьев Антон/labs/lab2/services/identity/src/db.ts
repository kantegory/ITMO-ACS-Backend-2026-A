import { makeDataSource } from '@jobsearch/common';
import { User } from './models/user.entity';
import { UserProfile } from './models/user-profile.entity';
import { RefreshToken } from './models/refresh-token.entity';
import { VerificationToken } from './models/verification-token.entity';
import { ServiceClient } from './models/service-client.entity';

export const dataSource = makeDataSource([User, UserProfile, RefreshToken, VerificationToken, ServiceClient]);
