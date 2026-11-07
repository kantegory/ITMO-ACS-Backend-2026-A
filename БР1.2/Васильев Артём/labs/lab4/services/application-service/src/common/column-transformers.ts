export const numericTransformer = {
    to: (value?: number | null): number | null => {
        if (value === undefined || value === null) {
            return null;
        }

        return value;
    },
    from: (value?: string | null): number | null => {
        if (value === undefined || value === null) {
            return null;
        }

        return Number(value);
    },
};
