import { BadRequestError } from 'routing-controllers';

export const parseId = (value: string | number, fieldName: string): number => {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new BadRequestError(`${fieldName} must be a positive integer`);
    }

    return parsed;
};
