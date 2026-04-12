export const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_REGEX = /^\d{2}:\d{2}$/;

export const containsIgnoreCase = (
    source?: string | null,
    target?: string | null,
) => {
    if (!target) {
        return true;
    }

    return (source || '').toLowerCase().includes(target.toLowerCase());
};
