// Rutas CRUD para productos
// GET es público, POST/PATCH/DELETE requieren token
import { Router } from "express";
import { prisma } from "../db.js";
import validateFields from "../middlewares/validateFields.js";
import { verifyToken } from "../middlewares/auth.js"; // Middleware de autenticación
import AppError from "../utils/AppError.js";
import {
	categoryNotFound,
	invalidPriceOrQuantity,
	productAlreadyExists,
} from "../utils/productErrors.js";
import {
	createProductValidators,
	updateProductValidators,
	validateProductId,
} from "../validators/product.validators.js";

const router = Router();

// GET /products - Público, no necesita token
router.get("/products", async (req, res, next) => {
	try {
		const products = await prisma.product.findMany({
			include: {
				category: true,
			},
		});
		res.json(products);
	} catch (error) {
		next(error);
	}
});

// GET /products/:id - Público, no necesita token
router.get("/products/:id", validateProductId, validateFields, async (req, res, next) => {
	try {
		const product = await prisma.product.findUnique({
			where: {
				id: Number(req.params.id),
			},
			include: {
				category: true,
			},
		});
		res.json(product);
	} catch (error) {
		next(error);
	}
});

// POST /products - Protegido: necesita token válido
router.post("/products", verifyToken, createProductValidators, validateFields, async (req, res, next) => {
	try {
		const { name, price, quantity, categoryId } = req.body;

		if (price == null || Number(price) <= 0) {
			return next(invalidPriceOrQuantity("price debe ser mayor a 0"));
		}

		if (quantity == null || Number(quantity) < 0) {
			return next(invalidPriceOrQuantity("quantity no puede ser negativo"));
		}

		const category = await prisma.category.findUnique({
			where: { id: Number(categoryId) },
		});

		if (!category) {
			return next(categoryNotFound(categoryId));
		}

		const existingProduct = await prisma.product.findUnique({
			where: { name },
		});

		if (existingProduct) {
			return next(productAlreadyExists(name));
		}

		const product = await prisma.product.create({
			data: req.body,
		});
		res.json(product);
	} catch (error) {
		if (error && error.code === "P2002") {
			return next(productAlreadyExists(req.body?.name || ""));
		}
		next(error);
	}
});

// DELETE /products/:id - Protegido: necesita token válido
router.delete("/products/:id", verifyToken, validateProductId, validateFields, async (req, res, next) => {
	try {
		const product = await prisma.product.delete({
			where: {
				id: Number(req.params.id),
			},
		});
		res.json(product.quantity);
	} catch (error) {
		next(error);
	}
});

// PATCH /products/:id - Protegido: necesita token válido
router.patch("/products/:id", verifyToken, updateProductValidators, validateFields, async (req, res, next) => {
	try {
		const { name, price, quantity, categoryId } = req.body;

		if (price != null && Number(price) <= 0) {
			return next(invalidPriceOrQuantity("price debe ser mayor a 0"));
		}

		if (quantity != null && Number(quantity) < 0) {
			return next(invalidPriceOrQuantity("quantity no puede ser negativo"));
		}

		if (categoryId != null) {
			const category = await prisma.category.findUnique({
				where: { id: Number(categoryId) },
			});

			if (!category) {
				return next(categoryNotFound(categoryId));
			}
		}

		if (name) {
			const existingProduct = await prisma.product.findUnique({
				where: { name },
			});

			if (existingProduct && existingProduct.id !== Number(req.params.id)) {
				return next(productAlreadyExists(name));
			}
		}

		const product = await prisma.product.update({
			where: {
				id: Number(req.params.id),
			},
			data: req.body,
			include: {
				category: true,
			},
		});
		res.json(product);
	} catch (error) {
		if (error && error.code === "P2002") {
			return next(productAlreadyExists(req.body?.name || ""));
		}
		next(error);
	}
});

export default router;
