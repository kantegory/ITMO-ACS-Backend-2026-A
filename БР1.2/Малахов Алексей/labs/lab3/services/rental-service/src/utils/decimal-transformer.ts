export const decimalTransformer = {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
};
