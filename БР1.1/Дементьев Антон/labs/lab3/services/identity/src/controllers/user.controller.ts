import { Body, Get, JsonController, Patch, Req, UseBefore } from 'routing-controllers';
import { invalid } from '@jobsearch/common';

import { dataSource } from '../db';
import { UpdateProfileDto } from '../dto/profile.dto';
import { authMiddleware, RequestWithUser } from '../auth';
import { UserProfile } from '../models/user-profile.entity';
import { User } from '../models/user.entity';
import { currentUserView } from '../views/user.view';

const FIELDS: [keyof UpdateProfileDto, keyof UserProfile][] = [
    ['last_name', 'lastName'], ['first_name', 'firstName'], ['middle_name', 'middleName'], ['phone', 'phone'], ['city', 'city'], ['about', 'about'], ['birth_date', 'birthDate'],
];

@JsonController('/api/v1/users')
class UserController {
    @Get('/me')
    @UseBefore(authMiddleware)
    async me(@Req() req: RequestWithUser) {
        const user = await dataSource.getRepository(User).findOneByOrFail({ id: req.user!.id });
        const profile = await dataSource.getRepository(UserProfile).findOneByOrFail({ userId: user.id });
        return currentUserView(user, profile);
    }

    @Patch('/me')
    @UseBefore(authMiddleware)
    async updateProfile(@Req() req: RequestWithUser, @Body({ type: UpdateProfileDto }) body: UpdateProfileDto) {
        const profiles = dataSource.getRepository(UserProfile);
        const profile = await profiles.findOneByOrFail({ userId: req.user!.id });
        for (const [dtoKey, entityKey] of FIELDS) {
            const value = body[dtoKey];
            if (value === undefined) continue;
            if (value === null && (dtoKey === 'last_name' || dtoKey === 'first_name')) throw invalid(dtoKey, 'Поле не может быть пустым');
            (profile as any)[entityKey] = value;
        }
        await profiles.save(profile);
        const user = await dataSource.getRepository(User).findOneByOrFail({ id: profile.userId });
        return currentUserView(user, profile);
    }
}
export default UserController;
