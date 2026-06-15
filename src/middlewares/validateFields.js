// Middleware que revisa los errores de express-validator
import { validationResult } from "express-validator";
import AppError from "../utils/AppError.js";

const validateFields = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const messages = errors
            .array()
            .map((error) => error.msg)
            .join(" | ");

        return next(new AppError(messages, 400));
    }

    next();
};

export default validateFields;
