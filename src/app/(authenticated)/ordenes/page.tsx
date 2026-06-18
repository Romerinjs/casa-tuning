import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth-helpers";
import OrdenesClientView from "@/components/OrdenesClientView";
import { decryptDocument } from "@/lib/security";

export default async function OrdenesPage() {
  // Session authorization check
  await verifySession();

  // Fetch all orders from PostgreSQL database using Prisma
  const dbOrders = await prisma.order.findMany({
    include: {
      status: true,
      client: {
        include: {
          documentType: true,
        },
      },
      car: {
        include: {
          brand: true,
        },
      },
      services: {
        include: {
          service: true,
        },
      },
      comments: {
        include: {
          user: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const orders = dbOrders.map((o) => ({
    ...o,
    client: {
      ...o.client,
      documentNumber: o.client.documentNumber ? decryptDocument(o.client.documentNumber) : null,
    },
  }));

  return <OrdenesClientView orders={orders} />;
}
