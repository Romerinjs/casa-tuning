import prisma from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth-helpers";
import VehiculosClientView from "@/components/VehiculosClientView";

export const dynamic = "force-dynamic";

export default async function VehiculosPage() {
  await verifyAdminSession();

  const cars = await prisma.car.findMany({
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      brand: {
        select: {
          id: true,
          name: true,
          logo: true,
        },
      },
    },
    orderBy: {
      plate: "asc",
    },
  });

  const clients = await prisma.client.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const brands = await prisma.brand.findMany({
    select: {
      id: true,
      name: true,
      logo: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <VehiculosClientView
      cars={cars}
      clients={clients}
      brands={brands}
    />
  );
}
