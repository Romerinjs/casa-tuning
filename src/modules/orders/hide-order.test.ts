import { describe, expect, it } from "vitest";

import {
  hideOrderWithAudit,
  type HideOrderDependencies,
} from "./hide-order";

const HIDDEN_AT = new Date("2026-09-07T18:00:00.000Z");
const DESCRIPTION = "Orden ocultada del panel de órdenes";

type OrderRecord = Awaited<ReturnType<HideOrderDependencies["findOrder"]>>;

function createDependencies(initialOrder: OrderRecord) {
  const order = initialOrder ? { ...initialOrder } : null;
  const hiddenOrders: Array<{ orderId: number; hiddenAt: Date }> = [];
  const activities: Array<{
    orderId: number;
    userId: number;
    description: typeof DESCRIPTION;
  }> = [];

  const dependencies: HideOrderDependencies = {
    async findOrder(orderId) {
      return order?.id === orderId ? { ...order } : null;
    },
    async hideAndLog(input) {
      if (!order || order.id !== input.orderId || order.hiddenFromOrdersAt) {
        return;
      }

      order.hiddenFromOrdersAt = input.hiddenAt;
      hiddenOrders.push({ orderId: input.orderId, hiddenAt: input.hiddenAt });
      activities.push({
        orderId: input.orderId,
        userId: input.userId,
        description: input.description,
      });
    },
    now() {
      return HIDDEN_AT;
    },
  };

  return { activities, dependencies, hiddenOrders };
}

function visibleOrder(overrides: Partial<NonNullable<OrderRecord>> = {}) {
  return {
    id: 42,
    statusName: "ENTREGADO",
    signatureUrl: "/uploads/signatures/sig-42.png",
    hiddenFromOrdersAt: null,
    ...overrides,
  };
}

describe("hideOrderWithAudit", () => {
  it("returns not-found without writing when the order does not exist", async () => {
    const { activities, dependencies, hiddenOrders } = createDependencies(null);

    const result = await hideOrderWithAudit(dependencies, 42, 7);

    expect(result).toEqual({
      success: false,
      reason: "not-found",
      error: "La orden no existe.",
    });
    expect(hiddenOrders).toHaveLength(0);
    expect(activities).toHaveLength(0);
  });

  it("returns wrong-status without writing when the order is not delivered", async () => {
    const { activities, dependencies, hiddenOrders } = createDependencies(
      visibleOrder({ statusName: "EN_PROCESO" }),
    );

    const result = await hideOrderWithAudit(dependencies, 42, 7);

    expect(result).toEqual({
      success: false,
      reason: "wrong-status",
      error: "Solo se pueden ocultar órdenes entregadas.",
    });
    expect(hiddenOrders).toHaveLength(0);
    expect(activities).toHaveLength(0);
  });

  it("returns unsigned without writing when the delivered order has no signature", async () => {
    const { activities, dependencies, hiddenOrders } = createDependencies(
      visibleOrder({ signatureUrl: null }),
    );

    const result = await hideOrderWithAudit(dependencies, 42, 7);

    expect(result).toEqual({
      success: false,
      reason: "unsigned",
      error: "La orden debe tener una firma antes de ocultarse.",
    });
    expect(hiddenOrders).toHaveLength(0);
    expect(activities).toHaveLength(0);
  });

  it("treats an already hidden order as success without another movement", async () => {
    const { activities, dependencies, hiddenOrders } = createDependencies(
      visibleOrder({
        hiddenFromOrdersAt: new Date("2026-09-07T17:00:00.000Z"),
      }),
    );

    const result = await hideOrderWithAudit(dependencies, 42, 7);

    expect(result).toEqual({ success: true });
    expect(hiddenOrders).toHaveLength(0);
    expect(activities).toHaveLength(0);
  });

  it("hides an eligible order and records one movement for the authenticated user", async () => {
    const { activities, dependencies, hiddenOrders } = createDependencies(
      visibleOrder(),
    );

    const result = await hideOrderWithAudit(dependencies, 42, 7);

    expect(result).toEqual({ success: true });
    expect(hiddenOrders).toEqual([{ orderId: 42, hiddenAt: HIDDEN_AT }]);
    expect(activities).toEqual([
      { orderId: 42, userId: 7, description: DESCRIPTION },
    ]);
  });

  it("is idempotent when the same hide request is repeated", async () => {
    const { activities, dependencies, hiddenOrders } = createDependencies(
      visibleOrder(),
    );

    const firstResult = await hideOrderWithAudit(dependencies, 42, 7);
    const repeatedResult = await hideOrderWithAudit(dependencies, 42, 7);

    expect(firstResult).toEqual({ success: true });
    expect(repeatedResult).toEqual({ success: true });
    expect(hiddenOrders).toHaveLength(1);
    expect(activities).toHaveLength(1);
  });

  it("records one movement when eligible requests race", async () => {
    const { activities, dependencies, hiddenOrders } = createDependencies(
      visibleOrder(),
    );

    const results = await Promise.all([
      hideOrderWithAudit(dependencies, 42, 7),
      hideOrderWithAudit(dependencies, 42, 7),
    ]);

    expect(results).toEqual([{ success: true }, { success: true }]);
    expect(hiddenOrders).toHaveLength(1);
    expect(activities).toHaveLength(1);
  });
});
