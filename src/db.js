// Conexión a la base de datos usando Prisma con adaptador MariaDB/MySQL
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Crear el adaptador con los datos del .env
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  allowPublicKeyRetrieval: true,
  connectionLimit: 5,
});

// Crear el cliente Prisma con el adaptador
export const prisma = new PrismaClient({ adapter });
