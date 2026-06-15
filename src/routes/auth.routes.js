// Rutas de autenticación: registro y login
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import { registerValidators, loginValidators } from "../validators/auth.validators.js";
import validateFields from "../middlewares/validateFields.js";
import AppError from "../utils/AppError.js";

const router = Router();

// POST /auth/register - Crea un usuario nuevo
router.post("/auth/register", registerValidators, validateFields, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError("El email ya está registrado", 400));
    }

    // Hashear la contraseña (10 rondas de salt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario en la base de datos
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Responder sin devolver la contraseña
    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login - Inicia sesión y devuelve un token JWT
router.post("/auth/login", loginValidators, validateFields, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscar el usuario por email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(new AppError("Email o contraseña incorrectos", 401));
    }

    // Comparar la contraseña enviada con la hasheada en la DB
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return next(new AppError("Email o contraseña incorrectos", 401));
    }

    // Generar el token JWT con el id y rol del usuario
    // El token expira en 24 horas
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Devolver el token al cliente
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

export default router;
