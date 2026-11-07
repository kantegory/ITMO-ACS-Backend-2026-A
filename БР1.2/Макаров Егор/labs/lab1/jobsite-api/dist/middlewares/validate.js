"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const httpError_1 = require("../utils/httpError");
const validate = (schema, part = 'body') => (req, _res, next) => {
    try {
        const parsed = schema.parse(req[part]);
        // перезаписываем разобранными/приведёнными значениями
        req[part] = parsed;
        next();
    }
    catch (e) {
        if (e instanceof zod_1.ZodError) {
            const errors = e.errors.map((it) => ({
                field: it.path.join('.') || '(root)',
                message: it.message,
            }));
            throw httpError_1.HttpError.validation('Проверьте корректность переданных полей', errors);
        }
        throw e;
    }
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map