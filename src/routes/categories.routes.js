// Rutas para categorías
import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

// GET /categories - Obtiene todas las categorías con sus productos
router.get("/categories", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: true,
      },
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

export default router;
