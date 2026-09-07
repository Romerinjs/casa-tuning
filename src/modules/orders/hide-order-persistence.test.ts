import { describe, expect, it } from "vitest";

import type { Prisma } from "@/generated/prisma/client";

import { hideAndLogEligibleOrder } from "./hide-order-persistence";

const HIDDEN_AT = new Date("2026-09-07T18:00:00.000Z");
const TRIMMED_SIGNATURE_GUARD =
  /NULLIF\(BTRIM\([^)]*signature_url[^)]*\),\s*''\)\s+IS\s+NOT\s+NULL/i;

function createTransaction(signatureUrl: string) {
  let activityCount = 0;
  let emittedQuery: { text: string; values: unknown[] } | null = null;

  const transaction = {
    async $queryRaw(strings: TemplateStringsArray, ...values: unknown[]) {
      const text = strings.join("?");
      emittedQuery = { text, values };
      const signatureAccepted = TRIMMED_SIGNATURE_GUARD.test(text)
        ? Boolean(signatureUrl.trim())
        : true;

      return signatureAccepted ? [{ id: 42 }] : [];
    },
    activityLog: {
      async create() {
        activityCount += 1;
        return {};
      },
    },
    order: {
      async findUnique() {
        return {
          status: { name: "ENTREGADO" },
          signatureUrl,
          hiddenFromOrdersAt: null,
        };
      },
    },
  } as unknown as Prisma.TransactionClient;

  return {
    getActivityCount: () => activityCount,
    getEmittedQuery: () => emittedQuery,
    transaction,
  };
}

describe("hideAndLogEligibleOrder", () => {
  it.each([
    ["an empty string", ""],
    ["only whitespace", "   \t"],
  ])("guards against a signature changed to %s", async (_label, signatureUrl) => {
    const { getActivityCount, getEmittedQuery, transaction } =
      createTransaction(signatureUrl);

    const result = await hideAndLogEligibleOrder(transaction, {
      orderId: 42,
      userId: 7,
      hiddenAt: HIDDEN_AT,
      description: "Orden ocultada del panel de órdenes",
    });

    expect(result).toEqual({ kind: "unsigned" });
    expect(getActivityCount()).toBe(0);

    const query = getEmittedQuery();
    expect(query).not.toBeNull();
    expect(query && TRIMMED_SIGNATURE_GUARD.test(query.text)).toBe(true);
    expect(query?.values).toContain(42);
    expect(query?.text).not.toContain("42");
  });
});
