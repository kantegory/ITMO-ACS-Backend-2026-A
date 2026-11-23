const requiredEnv = [
    'PORT',
    'USER_SERVICE_URL',
    'RECIPE_SERVICE_URL',
    'JWT_SECRET',
    'X_USER_ID',
    'X_USER_ROLE',
];

const missing = requiredEnv.filter((name) => !process.env[name]);

if (missing.length > 0) {
    throw new Error(`Отсутствуют необходимые env-переменные: ${missing.join(', ')}`);
}

export const config = {
    port: Number(process.env.PORT),
    service_urls: {
        user: process.env.USER_SERVICE_URL as string,
        recipe: process.env.RECIPE_SERVICE_URL as string
    },
    jwtSecret: process.env.JWT_SECRET as string,
    xUserId: process.env.X_USER_ID as string,
    xUserRole: process.env.X_USER_ROLE as string,
};
