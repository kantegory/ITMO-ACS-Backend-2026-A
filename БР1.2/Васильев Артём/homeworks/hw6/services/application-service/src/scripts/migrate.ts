import 'reflect-metadata';

import dataSource from '../config/data-source';

async function run() {
    await dataSource.initialize();
    await dataSource.runMigrations();
    await dataSource.destroy();
    console.log('Migrations applied successfully');
}

run().catch(async (error) => {
    console.error('Migration failed', error);

    if (dataSource.isInitialized) {
        await dataSource.destroy();
    }

    process.exit(1);
});
