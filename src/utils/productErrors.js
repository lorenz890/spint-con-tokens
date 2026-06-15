// Errores específicos de productos
import AppError from "./AppError.js";

export const categoryNotFound = (id) =>
  new AppError(`Categoría con id ${id} no existe`, 400);

export const invalidPriceOrQuantity = (detail) =>
  new AppError(`Datos inválidos: ${detail}`, 400);

export const productAlreadyExists = (name) =>
  new AppError(`El producto '${name}' ya existe`, 409);
