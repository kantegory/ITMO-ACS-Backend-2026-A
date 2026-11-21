import dataSource from '../config/data-source';
import SETTINGS from '../config/settings';
import { UserRole } from '../common/enums';
import { Cuisine } from '../models/cuisine.entity';
import { User } from '../models/user.entity';

const DEFAULT_CUISINES = [
    'Italian',
    'Japanese',
    'Georgian',
    'French',
    'Russian',
    'Indian',
    'Chinese',
    'Mexican',
];

export const bootstrapData = async () => {
    const userRepository = dataSource.getRepository(User);
    const cuisineRepository = dataSource.getRepository(Cuisine);

    const admin = await userRepository.findOneBy({ email: SETTINGS.ADMIN_EMAIL });
    if (!admin) {
        const seededAdmin = userRepository.create({
            email: SETTINGS.ADMIN_EMAIL,
            password: SETTINGS.ADMIN_PASSWORD,
            role: UserRole.ADMIN,
            firstName: SETTINGS.ADMIN_FIRST_NAME,
            lastName: SETTINGS.ADMIN_LAST_NAME,
            phone: SETTINGS.ADMIN_PHONE,
            isVerified: true,
        });

        await userRepository.save(seededAdmin);
    }

    const cuisinesCount = await cuisineRepository.count();
    if (cuisinesCount === 0) {
        const cuisines = DEFAULT_CUISINES.map((title) =>
            cuisineRepository.create({ title }),
        );
        await cuisineRepository.save(cuisines);
    }
};
