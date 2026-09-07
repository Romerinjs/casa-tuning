import { evaluateOrderHideEligibility } from "./order-visibility";

const HIDE_DESCRIPTION = "Orden ocultada del panel de órdenes" as const;

export interface HideOrderDependencies {
  findOrder(orderId: number): Promise<{
    id: number;
    statusName: string;
    signatureUrl: string | null;
    hiddenFromOrdersAt: Date | null;
  } | null>;
  hideAndLog(input: {
    orderId: number;
    userId: number;
    hiddenAt: Date;
    description: typeof HIDE_DESCRIPTION;
  }): Promise<void>;
  now(): Date;
}

export type HideOrderResult =
  | { success: true }
  | {
      success: false;
      reason:
        | "not-found"
        | "unsigned"
        | "wrong-status"
        | "invalid-id"
        | "internal-error";
      error: string;
    };

export async function hideOrderWithAudit(
  dependencies: HideOrderDependencies,
  orderId: number,
  userId: number,
): Promise<HideOrderResult> {
  const order = await dependencies.findOrder(orderId);

  if (!order) {
    return {
      success: false,
      reason: "not-found",
      error: "La orden no existe.",
    };
  }

  const eligibility = evaluateOrderHideEligibility(order);

  switch (eligibility.kind) {
    case "already-hidden":
      return { success: true };
    case "wrong-status":
      return {
        success: false,
        reason: "wrong-status",
        error: "Solo se pueden ocultar órdenes entregadas.",
      };
    case "unsigned":
      return {
        success: false,
        reason: "unsigned",
        error: "La orden debe tener una firma antes de ocultarse.",
      };
    case "eligible":
      await dependencies.hideAndLog({
        orderId: order.id,
        userId,
        hiddenAt: dependencies.now(),
        description: HIDE_DESCRIPTION,
      });
      return { success: true };
  }
}
