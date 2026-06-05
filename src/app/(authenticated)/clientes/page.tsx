import prisma from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth-helpers";
import ClientesClientView from "@/components/ClientesClientView";

export default async function ClientesPage() {
  // Session authorization check
  await verifyAdminSession();

  // Fetch clients and brands in parallel
  const [clients, brands] = await Promise.all([
    prisma.client.findMany({
      include: {
        cars: {
          include: {
            brand: true,
          },
        },
        orders: {
          include: {
            status: true,
            services: {
              include: {
                service: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.brand.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return <ClientesClientView clients={clients} brands={brands} />;
}
