import { verifySession } from "@/lib/auth-helpers";
import OrdenesClientView from "@/components/OrdenesClientView";
import { decryptDocument } from "@/lib/security";
import { getOrdersForOrdersPage } from "@/modules/orders/order-query";

export default async function OrdenesPage() {
  // Session authorization check
  await verifySession();

  const dbOrders = await getOrdersForOrdersPage();

  const orders = dbOrders.map((o) => ({
    ...o,
    client: {
      ...o.client,
      documentNumber: o.client.documentNumber ? decryptDocument(o.client.documentNumber) : null,
    },
  }));

  return <OrdenesClientView orders={orders} />;
}
