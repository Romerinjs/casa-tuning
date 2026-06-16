import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth-helpers";
import RecepcionForm from "@/components/RecepcionForm";
import { decryptDocument } from "@/lib/security";

export default async function RecepcionPage() {
  // Verify user session
  await verifySession();

  // Fetch brands catalog, active services, existing clients, cars, and document types in parallel
  const [brands, services, clientsData, carsData, documentTypes] = await Promise.all([
    prisma.brand.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.serviceCatalog.findMany({
      where: { isActive: true },
      orderBy: [
        { isTopSelling: "desc" },
        { name: "asc" },
      ],
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

  const clients = clientsData.map((c) => ({
    ...c,
    documentNumber: c.documentNumber ? decryptDocument(c.documentNumber) : null,
  }));

  const cars = carsData.map((car) => ({
    ...car,
    client: {
      ...car.client,
      documentNumber: car.client.documentNumber ? decryptDocument(car.client.documentNumber) : null,
    },
  }));

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

