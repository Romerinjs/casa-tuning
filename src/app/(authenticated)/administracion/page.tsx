import prisma from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth-helpers";
import AdministracionClientView from "@/components/AdministracionClientView";

export default async function AdministracionPage() {
  // Validate that user is logged in AND is an Administrator
  await verifyAdminSession();

  // Query databases lookups in parallel
  const [services, brands, users, roles] = await Promise.all([
    prisma.serviceCatalog.findMany({
      orderBy: { id: "asc" },
    }),
    prisma.brand.findMany({
      orderBy: { id: "asc" },
    }),
    prisma.user.findMany({
      include: {
        role: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.role.findMany({
      orderBy: { id: "asc" },
    }),
  ]);

  return (
    <AdministracionClientView
      services={services}
      brands={brands}
      users={users}
      roles={roles}
    />
  );
}
