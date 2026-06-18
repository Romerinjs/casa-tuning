import prisma from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth-helpers";
import ClientesClientView from "@/components/ClientesClientView";
import { decryptDocument } from "@/lib/security";

export default async function ClientesPage() {
  // Session authorization check
  await verifyAdminSession();

  // Fetch clients, brands, and document types in parallel
  const [clientsData, brands, documentTypes] = await Promise.all([
    prisma.client.findMany({
      include: {
        documentType: true,
        cars: {
          include: {
            brand: true,
          },
        },
        orders: {
          include: {
            status: true,
            services: {
              include: {
                service: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.brand.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    prisma.documentType.findMany({
      orderBy: {
        id: "asc",
      },
    }),
  ]);

  const clients = clientsData.map((c) => ({
    ...c,
    documentNumber: c.documentNumber ? decryptDocument(c.documentNumber) : null,
  }));

  return <ClientesClientView clients={clients} brands={brands} documentTypes={documentTypes} />;
}
