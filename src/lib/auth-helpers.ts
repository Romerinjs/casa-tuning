import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cache } from "react";

export const verifySession = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Verificación adicional de base de datos para asegurar que el usuario sigue activo
  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id, 10) },
    select: {
      isActive: true,
      name: true,
      email: true,
      roleId: true,
      role: {
        select: { name: true },
      },
    },
  });

  if (!user || !user.isActive) {
    redirect("/login");
  }

  return {
    id: parseInt(session.user.id, 10),
    name: user.name,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
  };
});

export const verifyAdminSession = cache(async () => {
  const user = await verifySession();

  if (user.roleName !== "Administrador") {
    redirect("/dashboard");
  }

  return user;
});
