import { verifySession } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import ReservasClientView from "@/components/ReservasClientView";

export const dynamic = "force-dynamic";

export default async function ReservasPage() {
  await verifySession();

  const [reservations, clients, brands, services] = await Promise.all([
    prisma.reservation.findMany({
      orderBy: { scheduledAt: "asc" },
      include: {
        client: true,
        car: {
          include: {
            brand: true,
          },
        },
        brand: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      include: {
        cars: {
          include: {
            brand: true,
          },
        },
      },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.serviceCatalog.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ReservasClientView
      reservations={reservations}
      clients={clients}
      brands={brands}
      services={services}
    />
  );
}
