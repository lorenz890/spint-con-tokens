// Middleware de autenticación: verifica que el request tenga un token JWT válido
import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";

// Verifica que el usuario esté logueado (token válido)
export const verifyToken = (req, res, next) => {
  // El token viene en el header "Authorization" con formato: "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("No se proporcionó token de autenticación", 401));
  }

  // Extraer solo el token (sin la palabra "Bearer")
  const token = authHeader.split(" ")[1];

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guardar los datos del usuario en el request para usarlos después
    req.user = decoded;

    next();
  } catch (error) {
    return next(new AppError("Token inválido o expirado", 401));
  }
};

// Verifica que el usuario sea admin
export const verifyAdmin = (req, res, next) => {
  // Este middleware se usa DESPUÉS de verifyToken, así que req.user ya existe
  if (req.user.role !== "admin") {
    return next(new AppError("No tenés permisos de administrador", 403));
  }
  next();
};
