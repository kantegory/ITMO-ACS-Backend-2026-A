export function isDiscountActive(
    startAt?: Date | null,
    endAt?: Date | null,
    now = new Date(),
): boolean {
    if (!startAt || !endAt) {
        return false;
    }

    return startAt <= now && endAt >= now;
}
