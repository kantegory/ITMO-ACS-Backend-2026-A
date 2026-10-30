export const getParam = (
    value: string | string[] | undefined,
    name = 'path parameter',
): string => {
    if (Array.isArray(value)) {
        return value[0];
    }
    if (!value) {
        throw new Error(`${name} is required`);
    }
    return value;
};
