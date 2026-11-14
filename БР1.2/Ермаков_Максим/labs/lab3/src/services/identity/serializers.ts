import { User } from './user.entity';

const toIsoString = (value?: Date | null) => (value ? value.toISOString() : null);

export const serializeUserProfile = (user: User) => ({
    id: user.id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    isVerified: user.isVerified,
    createdAt: toIsoString(user.createdAt),
    updatedAt: toIsoString(user.updatedAt),
});

export const serializeUserSummary = (user: User) => ({
    id: user.id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
});
