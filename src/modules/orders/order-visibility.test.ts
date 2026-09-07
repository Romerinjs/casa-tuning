import { describe, expect, it } from "vitest";

import type { Order } from "@/generated/prisma/client";

import { evaluateOrderHideEligibility } from "./order-visibility";

describe("evaluateOrderHideEligibility", () => {
  it("the generated order model exposes the visibility marker", () => {
    const field: keyof Order = "hiddenFromOrdersAt";

    expect(field).toBe("hiddenFromOrdersAt");
  });

  it("marks a delivered signed visible order as eligible", () => {
    expect(
      evaluateOrderHideEligibility({
        statusName: "ENTREGADO",
        signatureUrl: "/uploads/signatures/sig-14.png",
        hiddenFromOrdersAt: null,
      }),
    ).toEqual({ kind: "eligible" });
  });

  it("marks an unsigned delivered visible order as unsigned", () => {
    expect(
      evaluateOrderHideEligibility({
        statusName: "ENTREGADO",
        signatureUrl: null,
        hiddenFromOrdersAt: null,
      }),
    ).toEqual({ kind: "unsigned" });
  });

  it("marks an order outside delivered status as wrong-status", () => {
    expect(
      evaluateOrderHideEligibility({
        statusName: "EN_PROCESO",
        signatureUrl: "/uploads/signatures/sig-14.png",
        hiddenFromOrdersAt: null,
      }),
    ).toEqual({ kind: "wrong-status" });
  });

  it("marks a hidden order as already-hidden", () => {
    expect(
      evaluateOrderHideEligibility({
        statusName: "ENTREGADO",
        signatureUrl: "/uploads/signatures/sig-14.png",
        hiddenFromOrdersAt: new Date("2026-09-07T17:00:00.000Z"),
      }),
    ).toEqual({ kind: "already-hidden" });
  });
});
