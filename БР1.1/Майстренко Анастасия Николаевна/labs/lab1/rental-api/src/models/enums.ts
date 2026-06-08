export enum UserRole {
    TENANT = 'tenant',
    LANDLORD = 'landlord',
    ADMIN = 'admin',
}

export enum PropertyType {
    APARTMENT = 'apartment',
    HOUSE = 'house',
    ROOM = 'room',
    STUDIO = 'studio',
}

export enum PropertyStatus {
    AVAILABLE = 'available',
    RENTED = 'rented',
    HIDDEN = 'hidden',
}

export enum BookingStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    ACTIVE = 'active',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}
