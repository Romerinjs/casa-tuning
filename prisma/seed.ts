import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL variable is not set in environment");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Roles
  const adminRole = await prisma.role.upsert({
    where: { name: "Administrador" },
    update: {},
    create: {
      name: "Administrador",
      description: "Acceso total al sistema",
    },
  });

  await prisma.role.upsert({
    where: { name: "Operador" },
    update: {},
    create: {
      name: "Operador",
      description: "Acceso a la recepción de vehículos y órdenes",
    },
  });

  // 1b. Document Types
  const docTypes = [
    { code: "CC", name: "Cédula de Ciudadanía" },
    { code: "CE", name: "Cédula de Extranjería" },
    { code: "NIT", name: "Número de Identificación Tributaria" },
    { code: "PP", name: "Pasaporte" },
    { code: "TI", name: "Tarjeta de Identidad" },
  ];

  for (const doc of docTypes) {
    await prisma.documentType.upsert({
      where: { code: doc.code },
      update: { name: doc.name },
      create: doc,
    });
  }

  // 2. Order Statuses
  const statuses = [
    { name: "RECIBIDO", description: "Vehículo recibido en el taller" },
    { name: "EN_PROCESO", description: "Trabajos en ejecución" },
    { name: "LISTO", description: "Vehículo listo para entrega" },
    { name: "ENTREGADO", description: "Vehículo entregado al cliente" },
  ];

  for (const status of statuses) {
    await prisma.orderStatus.upsert({
      where: { name: status.name },
      update: { description: status.description },
      create: status,
    });
  }

  // 3. Brands
  const brands = ["Kia", "Mazda", "Toyota", "Hyundai", "Chevrolet", "Renault"];
  for (const name of brands) {
    await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 4. Service Catalog
  const services = [
    "Polarizado",
    "PPF (Paint Protection Film)",
    "Vinilo",
    "Película de seguridad",
    "Luces LED",
    "Exploradoras",
    "Alarmas",
    "Sensores",
    "Radios",
    "CarPlay",
    "Parlantes",
    "Plantas de sonido",
    "Cámaras de reversa",
    "Actualización de pantallas y sistemas multimedia",
    "Plumillas",
  ];
  for (const name of services) {
    await prisma.serviceCatalog.upsert({
      where: { name },
      update: {},
      create: { name, isActive: true },
    });
  }

  // 5. Initial Admin User
  const adminEmail = "admin@casatuning.com";
  const hashedPassword = await bcrypt.hash("admin123456", 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
      isActive: true,
      roleId: adminRole.id,
    },
    create: {
      name: "Administrador Casa Tuning",
      email: adminEmail,
      passwordHash: hashedPassword,
      isActive: true,
      roleId: adminRole.id,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
