import dataSource from '../config/data-source';

async function resetDatabase(): Promise<void> {
    await dataSource.query(`
        TRUNCATE TABLE
            applications,
            educations,
            experiences,
            vacancies,
            resumes,
            companies,
            seekers,
            specializations,
            industries,
            users
        RESTART IDENTITY CASCADE
    `);
}

export default resetDatabase;
