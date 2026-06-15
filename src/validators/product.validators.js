// Validaciones para las rutas de productos
import { body, param } from "express-validator";

export const validateProductId = [
    param("id")
        .isInt({ gt: 0 })
        .withMessage("El id del producto debe ser un número entero positivo")
        .toInt(),
];

export const createProductValidators = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("El nombre es obligatorio")
        .bail()
        .isLength({ min: 3, max: 100 })
        .withMessage("El nombre debe tener entre 3 y 100 caracteres")
        .bail(),
    body("price")
        .notEmpty()
        .withMessage("El precio es obligatorio")
        .bail()
        .isFloat({ gt: 0 })
        .withMessage("El precio debe ser un número mayor a 0")
        .bail()
        .toFloat(),
    body("quantity")
        .notEmpty()
        .withMessage("La cantidad es obligatoria")
        .bail()
        .isInt({ min: 0 })
        .withMessage("La cantidad debe ser un entero igual o mayor a 0")
        .bail()
        .toInt(),
    body("categoryId")
        .notEmpty()
        .withMessage("La categoría es obligatoria")
        .bail()
        .isInt({ gt: 0 })
        .withMessage("La categoría debe ser un id numérico positivo")
        .bail()
        .toInt(),
];

export const updateProductValidators = [
    param("id")
        .isInt({ gt: 0 })
        .withMessage("El id del producto debe ser un número entero positivo")
        .toInt(),
    body("name")
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage("El nombre debe tener entre 3 y 100 caracteres")
        .bail(),
    body("price")
        .optional()
        .isFloat({ gt: 0 })
        .withMessage("El precio debe ser un número mayor a 0")
        .bail()
        .toFloat(),
    body("quantity")
        .optional()
        .isInt({ min: 0 })
        .withMessage("La cantidad debe ser un entero igual o mayor a 0")
        .bail()
        .toInt(),
    body("categoryId")
        .optional()
        .isInt({ gt: 0 })
        .withMessage("La categoría debe ser un id numérico positivo")
        .bail()
        .toInt(),
];
