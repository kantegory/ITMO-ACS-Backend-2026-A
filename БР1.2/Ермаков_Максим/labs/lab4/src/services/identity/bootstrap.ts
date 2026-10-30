import { SETTINGS } from '../../common/settings';
import { UserRole } from '../../common/enums';
import { identityDataSource } from './data-source';
import { User } from './user.entity';

export const bootstrapIdentityData = async () => {
    const users = identityDataSource.getRepository(User);
    const admin = await users.findOneBy({ email: SETTINGS.ADMIN_EMAIL });
    if (admin) {
        return;
    }

    await users.save(
        users.create({
            email: SETTINGS.ADMIN_EMAIL,
            password: SETTINGS.ADMIN_PASSWORD,
            role: UserRole.ADMIN,
            firstName: SETTINGS.ADMIN_FIRST_NAME,
            lastName: SETTINGS.ADMIN_LAST_NAME,
            phone: SETTINGS.ADMIN_PHONE,
            isVerified: true,
        }),
    );
};
