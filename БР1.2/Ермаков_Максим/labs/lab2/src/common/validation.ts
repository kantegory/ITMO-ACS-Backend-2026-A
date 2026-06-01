export const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_REGEX = /^\d{2}:\d{2}$/;

export const containsIgnoreCase = (value?: string | null, expected?: string) => {
    if (!expected) {
        return true;
    }
    return (value || '').toLowerCase().includes(expected.toLowerCase());
};
