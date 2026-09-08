export interface HideableOrder {
  statusName: string;
  signatureUrl: string | null;
  hiddenFromOrdersAt: Date | null;
}

export type HideEligibility =
  | { kind: "eligible" }
  | { kind: "unsigned" }
  | { kind: "wrong-status" }
  | { kind: "already-hidden" };

export function evaluateOrderHideEligibility(
  order: HideableOrder,
): HideEligibility {
  if (order.hiddenFromOrdersAt) return { kind: "already-hidden" };
  if (order.statusName !== "ENTREGADO") return { kind: "wrong-status" };
  if (!order.signatureUrl?.trim()) return { kind: "unsigned" };
  return { kind: "eligible" };
}
