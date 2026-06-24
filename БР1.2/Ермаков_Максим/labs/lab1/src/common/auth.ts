import { UserRole } from './enums';

export interface JwtUserPayload {
    id: string;
    role: UserRole;
}
