const requiredEnv = [
    'PORT',
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
    jwt: {
        secret: process.env.JWT_SECRET as string,
        expiresIn: "1d"
    },
    xUserId: process.env.X_USER_ID as string,
    xUserRole: process.env.X_USER_ROLE as string,
}
