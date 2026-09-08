import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  default: {
    order: { findMany },
  },
}));

import { getOrdersForOrdersPage } from "./order-query";

describe("getOrdersForOrdersPage", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("emits the orders-page query with hidden orders excluded", async () => {
    const sentinel = [{ id: 101 }];
    findMany.mockResolvedValue(sentinel);

    const result = await getOrdersForOrdersPage();

    expect(result).toBe(sentinel);
    expect(findMany).toHaveBeenCalledWith({
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
    });
  });
});
