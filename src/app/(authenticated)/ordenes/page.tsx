import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth-helpers";
import OrdenesClientView from "@/components/OrdenesClientView";

export default async function OrdenesPage() {
  // Session authorization check
  await verifySession();

  // Fetch all orders from PostgreSQL database using Prisma
  const orders = await prisma.order.findMany({
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return <OrdenesClientView orders={orders} />;
}
