import { User } from '../models/user.entity';
import { UserProfile } from '../models/user-profile.entity';

// Аккаунт без пароля и служебных полей
export const userView = (user: User) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    is_verified: user.isVerified,
    created_at: user.createdAt,
});

export const profileView = (profile: UserProfile) => ({
    last_name: profile.lastName,
    first_name: profile.firstName,
    middle_name: profile.middleName ?? null,
    phone: profile.phone ?? null,
    city: profile.city ?? null,
    about: profile.about ?? null,
    birth_date: profile.birthDate ?? null,
});

export const currentUserView = (user: User, profile: UserProfile) => ({
    ...userView(user),
    profile: profileView(profile),
});

// Соискатель: краткие данные (имя) — видны работодателю в откликах и рекомендациях
export const applicantShortView = (userId: string, profile?: UserProfile) => ({
    user_id: userId,
    last_name: profile?.lastName ?? '',
    first_name: profile?.firstName ?? '',
    middle_name: profile?.middleName ?? null,
});

// Соискатель с контактами — только в карточке отклика
export const applicantView = (user: User, profile?: UserProfile) => ({
    ...applicantShortView(user.id, profile),
    email: user.email,
    phone: profile?.phone ?? null,
    city: profile?.city ?? null,
});
