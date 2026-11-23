const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';

export interface UserData {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    about: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function getUser(userId: number): Promise<UserData> {
    const response = await fetch(`${USER_SERVICE_URL}/api/internal/users/${userId}`);
    if (!response.ok) {
        throw new Error(`Пользователь с ID ${userId} не найден`);
    }
    const data: any = await response.json();
    return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
    };
}

export async function isAdmin(userId: number): Promise<boolean> {
    const response = await fetch(`${USER_SERVICE_URL}/api/internal/users/${userId}/is-admin`);
    if (!response.ok) {
        throw new Error(`Не удалось проверить роль пользователя ${userId}`);
    }
    const data: any = await response.json();
    return data.isAdmin;
}

export async function getUsersBatch(userIds: number[]): Promise<UserData[]> {
    if (userIds.length === 0) return [];
    const idsParam = userIds.join(',');
    const response = await fetch(`${USER_SERVICE_URL}/api/internal/users/batch?ids=${idsParam}`);
    if (!response.ok) {
        throw new Error('Не удалось получить пользователей');
    }
    const data: any = await response.json();
    return data.map((u: any) => ({
        ...u,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
    }));
}