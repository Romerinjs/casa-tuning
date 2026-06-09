import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth-helpers";
import RecepcionForm from "@/components/RecepcionForm";

export default async function RecepcionPage() {
  // Verify user session
  await verifySession();

  // Fetch brands catalog, active services, existing clients, cars, and document types in parallel
  const [brands, services, clients, cars, documentTypes] = await Promise.all([
    prisma.brand.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.serviceCatalog.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      include: {
        documentType: true,
        cars: {
          include: {
            brand: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.car.findMany({
      include: {
        brand: true,
        client: {
          include: {
            documentType: true,
          },
        },
      },
      orderBy: { plate: "asc" },
    }),
    prisma.documentType.findMany({
      orderBy: { id: "asc" },
    }),
  ]);

  return (
    <RecepcionForm
      brands={brands}
      services={services}
      existingClients={clients}
      existingCars={cars}
      documentTypes={documentTypes}
    />
  );
}

