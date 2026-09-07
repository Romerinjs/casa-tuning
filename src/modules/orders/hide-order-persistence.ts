import type { Prisma } from "@/generated/prisma/client";

import type { HideAndLogInput, HideAndLogResult } from "./hide-order";
import { evaluateOrderHideEligibility } from "./order-visibility";

export async function hideAndLogEligibleOrder(
  transaction: Prisma.TransactionClient,
  input: HideAndLogInput,
): Promise<HideAndLogResult> {
  const updatedOrders = await transaction.$queryRaw<Array<{ id: number }>>`
    UPDATE "orders" AS "candidate"
    SET
      "hidden_from_orders_at" = ${input.hiddenAt},
      "updated_at" = ${input.hiddenAt}
    WHERE "candidate"."id" = ${input.orderId}
      AND "candidate"."hidden_from_orders_at" IS NULL
      AND NULLIF(BTRIM("candidate"."signature_url"), '') IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM "order_statuses" AS "status"
        WHERE "status"."id" = "candidate"."status_id"
          AND "status"."name" = ${"ENTREGADO"}
      )
    RETURNING "candidate"."id"
  `;

  const updatedCount = updatedOrders.length;

  if (updatedCount === 1) {
    await transaction.activityLog.create({
      data: {
        orderId: input.orderId,
        userId: input.userId,
        description: input.description,
      },
    });

    return { kind: "hidden" };
  }

  if (updatedCount !== 0) {
    throw new Error("Hide query updated more than one order");
  }

  const currentOrder = await transaction.order.findUnique({
    where: { id: input.orderId },
    select: {
      status: {
        select: { name: true },
      },
      signatureUrl: true,
      hiddenFromOrdersAt: true,
    },
  });

  if (!currentOrder) return { kind: "not-found" };

  const currentEligibility = evaluateOrderHideEligibility({
    statusName: currentOrder.status.name,
    signatureUrl: currentOrder.signatureUrl,
    hiddenFromOrdersAt: currentOrder.hiddenFromOrdersAt,
  });

  if (currentEligibility.kind === "eligible") {
    throw new Error("Hide guard rejected an eligible order");
  }

  return currentEligibility;
}
