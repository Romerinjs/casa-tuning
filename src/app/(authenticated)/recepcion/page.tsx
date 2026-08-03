import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth-helpers";
import RecepcionForm from "@/components/RecepcionForm";
import { decryptDocument } from "@/lib/security";

interface PageProps {
  searchParams: Promise<{ edit?: string; reservationId?: string }>;
}

export default async function RecepcionPage({ searchParams }: PageProps) {
  // Verify user session
  await verifySession();

  const params = await searchParams;
  const editIdStr = params.edit;
  const reservationIdStr = params.reservationId;
  let orderToEdit: any = null;
  let reservationToPreFill: any = null;

  if (editIdStr) {
    const editId = parseInt(editIdStr, 10);
    if (!isNaN(editId)) {
      const order = await prisma.order.findUnique({
        where: { id: editId },
        include: {
          client: {
            include: { documentType: true },
          },
          car: {
            include: { brand: true },
          },
          services: {
            include: { service: true },
          },
          status: true,
        },
      });

      if (order && order.status.name === "RECIBIDO") {
        orderToEdit = {
          ...order,
          client: {
            ...order.client,
            documentNumber: order.client.documentNumber ? decryptDocument(order.client.documentNumber) : null,
          },
        };
      }
    }
  } else if (reservationIdStr) {
    const resId = parseInt(reservationIdStr, 10);
    if (!isNaN(resId)) {
      const resObj = await prisma.reservation.findUnique({
        where: { id: resId },
        include: {
          client: { include: { documentType: true } },
          car: { include: { brand: true } },
          brand: true,
          services: { include: { service: true } },
        },
      });

      if (resObj && resObj.status === "PENDIENTE") {
        reservationToPreFill = {
          ...resObj,
          client: {
            ...resObj.client,
            documentNumber: resObj.client.documentNumber ? decryptDocument(resObj.client.documentNumber) : null,
          },
        };
      }
    }
  }

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
      initialOrder={orderToEdit}
      initialReservation={reservationToPreFill}
    />
  );
}

