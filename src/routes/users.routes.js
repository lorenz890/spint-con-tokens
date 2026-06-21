import { Router } from "express";
import { body, param } from "express-validator";
import { prisma } from "../db.js";
import { verifyToken, verifySuperAdmin } from "../middlewares/auth.js";
import validateFields from "../middlewares/validateFields.js";
import AppError from "../utils/AppError.js";

const router = Router();

const VALID_ROLES = ["user", "admin", "superadmin"];

// GET /api/users — Listar todos los usuarios (solo superadmin)
router.get("/users", verifyToken, verifySuperAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/role — Cambiar rol de un usuario (solo superadmin)
router.patch(
  "/users/:id/role",
  verifyToken,
  verifySuperAdmin,
  [
    param("id").isInt({ gt: 0 }).withMessage("id debe ser un entero positivo").toInt(),
    body("role")
      .notEmpty().withMessage("role es obligatorio")
      .isIn(VALID_ROLES).withMessage(`role debe ser uno de: ${VALID_ROLES.join(", ")}`),
  ],
  validateFields,
  async (req, res, next) => {
    try {
      const targetId = Number(req.params.id);
      const { role } = req.body;

      // El superadmin no puede cambiar su propio rol
      if (targetId === req.user.id) {
        return next(new AppError("No podés cambiar tu propio rol", 403));
      }

      const target = await prisma.user.findUnique({ where: { id: targetId } });
      if (!target) {
        return next(new AppError(`Usuario con id ${targetId} no existe`, 404));
      }

      const updated = await prisma.user.update({
        where: { id: targetId },
        data: { role },
        select: { id: true, email: true, role: true, createdAt: true },
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
