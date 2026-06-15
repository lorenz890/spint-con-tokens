import express from "express";
import cors from "cors";
import morgan from "morgan"; // Logging de requests HTTP
import productRoutes from "./routes/products.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import authRoutes from "./routes/auth.routes.js"; // Rutas de login/register
import { prisma } from "./db.js";

const app = express();
let server;

app.use(cors());
app.use(express.json());

// Morgan loguea cada request en la consola (método, ruta, status, tiempo)
// Ejemplo de output: POST /api/auth/login 200 45ms
app.use(morgan("dev"));

// Registrar las rutas
app.use("/api", authRoutes);       // /api/auth/register y /api/auth/login
app.use("/api", productRoutes);    // /api/products
app.use("/api", categoryRoutes);   // /api/categories

// Middleware de manejo de errores (tiene que ir al final)
app.use((err, req, res, next) => {
   console.error(err);

   res.status(err.statusCode || 500).json({
       error: err.message || "Error Interno del Servidor",
   });
});

async function shutdown(signal) {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }

    await prisma.$disconnect();

    if (signal === "SIGUSR2") {
        process.kill(process.pid, signal);
        return;
    }

    process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGUSR2", () => void shutdown("SIGUSR2"));

async function start() {
    await prisma.$connect();

    server = app.listen(3000, () => {
        console.log("Servidor escuchando en http://localhost:3000");
    });
}

start().catch((error) => {
    console.error(error);
    process.exit(1);
});
