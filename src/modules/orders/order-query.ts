import prisma from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

const ordersPageQuery = {
  where: {
    hiddenFromOrdersAt: null,
  },
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
} satisfies Prisma.OrderFindManyArgs;

export type OrdersPageRecord = Prisma.OrderGetPayload<typeof ordersPageQuery>;

export async function getOrdersForOrdersPage(): Promise<OrdersPageRecord[]> {
  return prisma.order.findMany(ordersPageQuery);
}
