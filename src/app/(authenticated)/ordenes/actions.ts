"use server";

import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function updateOrderStatusAction(
  orderId: number,
  newStatusName: string
) {
  try {
    const user = await verifySession();

    // 1. Fetch order details to log correctly
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        car: true,
        status: true,
      },
    });

    if (!order) {
      return { success: false, error: "La orden no existe." };
    }

    if (order.status.name === newStatusName) {
      return { success: true }; // No change
    }

    // 2. Fetch the new status ID
    const nextStatus = await prisma.orderStatus.findUnique({
      where: { name: newStatusName },
    });

    if (!nextStatus) {
      return {
        success: false,
        error: `El estado '${newStatusName}' no es válido en el sistema.`,
      };
    }

    // 3. Update status and log activity inside a transaction
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { statusId: nextStatus.id },
      });

      // Log the transition in activities
      await tx.activityLog.create({
        data: {
          description: `Estado cambiado de ${order.status.name} a ${newStatusName}`,
          orderId: order.id,
          userId: user.id,
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/ordenes");
    revalidatePath("/clientes");

    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: "Ocurrió un error al intentar cambiar el estado.",
    };
  }
}
