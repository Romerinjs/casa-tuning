import prisma from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth-helpers";
import PromocionesClientView from "@/components/PromocionesClientView";

export const dynamic = "force-dynamic";

export default async function PromocionesPage() {
  await verifyAdminSession();

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

  const services = await prisma.serviceCatalog.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const clients = await prisma.client.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      cars: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          plate: true,
          model: true,
          year: true,
          brandId: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const promotions = await prisma.promotion.findMany({
    include: {
      service: {
        select: {
          name: true,
        },
      },
      brand: {
        select: {
          name: true,
          logo: true,
        },
      },
      clients: {
        select: {
          clientId: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <PromocionesClientView
      brands={brands}
      services={services}
      clients={clients}
      promotions={promotions}
    />
  );
}
