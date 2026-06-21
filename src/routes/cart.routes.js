import { Router } from "express";
import { body, param } from "express-validator";
import { prisma } from "../db.js";
import { verifyToken } from "../middlewares/auth.js";
import validateFields from "../middlewares/validateFields.js";
import AppError from "../utils/AppError.js";

const router = Router();

// GET /api/cart — Ver el carrito del usuario logueado
router.get("/cart", verifyToken, async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart) return res.json({ items: [], total: 0 });

    const total = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    res.json({ ...cart, total });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/items — Agregar un producto al carrito
router.post(
  "/cart/items",
  verifyToken,
  [
    body("productId")
      .notEmpty().withMessage("productId es obligatorio")
      .isInt({ gt: 0 }).withMessage("productId debe ser un entero positivo")
      .toInt(),
    body("quantity")
      .optional()
      .isInt({ gt: 0 }).withMessage("quantity debe ser un entero mayor a 0")
      .toInt(),
  ],
  validateFields,
  async (req, res, next) => {
    try {
      const { productId, quantity = 1 } = req.body;

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return next(new AppError(`Producto con id ${productId} no existe`, 404));

      // Obtener o crear el carrito del usuario
      let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { userId: req.user.id } });
      }

      // Si el item ya existe, sumar cantidad; si no, crearlo
      const existing = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });

      let item;
      if (existing) {
        item = await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
          include: { product: true },
        });
      } else {
        item = await prisma.cartItem.create({
          data: { cartId: cart.id, productId, quantity },
          include: { product: true },
        });
      }

      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/cart/items/:productId — Actualizar cantidad de un item
router.patch(
  "/cart/items/:productId",
  verifyToken,
  [
    param("productId").isInt({ gt: 0 }).toInt(),
    body("quantity")
      .notEmpty().withMessage("quantity es obligatorio")
      .isInt({ gt: 0 }).withMessage("quantity debe ser un entero mayor a 0")
      .toInt(),
  ],
  validateFields,
  async (req, res, next) => {
    try {
      const productId = Number(req.params.productId);
      const { quantity } = req.body;

      const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
      if (!cart) return next(new AppError("No tenés un carrito activo", 404));

      const item = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });
      if (!item) return next(new AppError("El producto no está en tu carrito", 404));

      const updated = await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity },
        include: { product: true },
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/cart/items/:productId — Quitar un item del carrito
router.delete(
  "/cart/items/:productId",
  verifyToken,
  [param("productId").isInt({ gt: 0 }).toInt()],
  validateFields,
  async (req, res, next) => {
    try {
      const productId = Number(req.params.productId);

      const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
      if (!cart) return next(new AppError("No tenés un carrito activo", 404));

      const item = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });
      if (!item) return next(new AppError("El producto no está en tu carrito", 404));

      await prisma.cartItem.delete({ where: { id: item.id } });

      res.json({ message: "Producto eliminado del carrito" });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/cart/checkout — Realizar la compra
router.post("/cart/checkout", verifyToken, async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return next(new AppError("El carrito está vacío", 400));
    }

    // Verificar stock suficiente para todos los items antes de proceder
    const stockErrors = cart.items
      .filter((item) => item.product.quantity < item.quantity)
      .map(
        (item) =>
          `'${item.product.name}': stock disponible ${item.product.quantity}, pedido ${item.quantity}`
      );

    if (stockErrors.length > 0) {
      return next(
        new AppError(`Stock insuficiente: ${stockErrors.join(" | ")}`, 400)
      );
    }

    const total = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    // Transacción: descontar stock, crear Purchase y vaciar carrito
    const purchase = await prisma.$transaction(async (tx) => {
      // Descontar stock de cada producto
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Crear el registro de compra con snapshot de precio
      const newPurchase = await tx.purchase.create({
        data: {
          userId: req.user.id,
          total,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // Vaciar el carrito
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newPurchase;
    });

    res.status(201).json(purchase);
  } catch (error) {
    next(error);
  }
});

export default router;
