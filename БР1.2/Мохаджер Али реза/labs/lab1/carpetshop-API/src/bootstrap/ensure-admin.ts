import { DataSource } from 'typeorm';
import { User } from '../models/user.entity';
import SETTINGS from '../config/settings';

export async function ensureAdminUser(dataSource: DataSource) {
    console.log('SETTINGS.INIT_ADMIN', SETTINGS.INIT_ADMIN);
    console.log('SETTINGS.INIT_ADMIN_EMAIL', SETTINGS.INIT_ADMIN_EMAIL);
    console.log('SETTINGS.INIT_ADMIN_PASSWORD', SETTINGS.INIT_ADMIN_PASSWORD);
    console.log(
        'SETTINGS.INIT_ADMIN_FIRST_NAME',
        SETTINGS.INIT_ADMIN_FIRST_NAME,
    );
    console.log('SETTINGS.INIT_ADMIN_LAST_NAME', SETTINGS.INIT_ADMIN_LAST_NAME);
    if (!SETTINGS.INIT_ADMIN) {
        console.log('INIT_ADMIN is false');
        return;
    }

    const repo = dataSource.getRepository(User);

    const adminCount = await repo.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) return;

    const email = SETTINGS.INIT_ADMIN_EMAIL;
    const password = SETTINGS.INIT_ADMIN_PASSWORD;
    console.log('email', email);
    console.log('password', password);

    if (!email || !password) {
        throw new Error(
            'INIT_ADMIN is true but INIT_ADMIN_EMAIL/INIT_ADMIN_PASSWORD are not set',
        );
    }

    const existing = await repo.findOneBy({ email });

    if (existing) {
        existing.role = 'ADMIN';
        existing.is_verified = true;
        await repo.save(existing);
        console.log(`Bootstrap: promoted existing user to ADMIN (${email})`);
        return;
    }

    const user = repo.create({
        first_name: SETTINGS.INIT_ADMIN_FIRST_NAME,
        last_name: SETTINGS.INIT_ADMIN_LAST_NAME,
        email,
        password,
        phone: null,
        role: 'ADMIN',
        is_verified: true,
    });

    await repo.save(user);
    console.log(`Bootstrap: created ADMIN user (${email})`);
}
