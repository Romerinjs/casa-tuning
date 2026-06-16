"use server";

import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { uploadBase64, deleteFile, uploadBuffer } from "@/lib/storage";
import { sendDeliveryEmail } from "@/lib/emails";
import { generateOrderPdf } from "@/lib/pdf-generator";

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

    // 4. Send completion email to the client if transitioning to ENTREGADO
    if (newStatusName === "ENTREGADO") {
      try {
        const completeOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            client: true,
            car: {
              include: {
                brand: true,
              },
            },
          },
        });

        if (completeOrder && completeOrder.client.email) {
          await sendDeliveryEmail(completeOrder.client.email, completeOrder);
        }
      } catch (emailError) {
        console.error("Error sending delivery email to client:", emailError);
      }
    }

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

export async function uploadDeliveryPdfAction(formData: FormData) {
  try {
    const user = await verifySession();

    const orderIdStr = formData.get("orderId") as string;
    const file = formData.get("file") as File;

    if (!orderIdStr || !file) {
      return { success: false, error: "Datos de formulario incompletos." };
    }

    const orderId = parseInt(orderIdStr, 10);
    if (isNaN(orderId)) {
      return { success: false, error: "ID de orden inválido." };
    }

    // 1. Fetch order details to check status
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { status: true },
    });

    if (!order) {
      return { success: false, error: "La orden no existe." };
    }

    if (order.status.name !== "LISTO") {
      return {
        success: false,
        error: "El documento de entrega solo se puede cargar cuando la orden está lista para entrega.",
      };
    }

    // Convert file object to Node.js Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload PDF to the storage bucket using uploadBuffer
    const fileUrl = await uploadBuffer(
      buffer,
      `delivery-documents/pdf-${orderId}.pdf`,
      "application/pdf"
    );

    // Update order with the PDF URL and log activity
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { deliveryPdfUrl: fileUrl },
      });

      await tx.activityLog.create({
        data: {
          description: `Documento de entrega cargado: ${file.name}`,
          orderId: order.id,
          userId: user.id,
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/ordenes");
    return { success: true };
  } catch (error) {
    console.error("Error uploading delivery PDF:", error);
    return {
      success: false,
      error: "Ocurrió un error al cargar el documento de entrega.",
    };
  }
}

export async function deleteDeliveryPdfAction(orderId: number) {
  try {
    const user = await verifySession();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: "La orden no existe." };
    }

    // Delete file from storage if it exists
    if (order.deliveryPdfUrl) {
      try {
        await deleteFile(order.deliveryPdfUrl);
      } catch (err) {
        console.error("Error deleting PDF file from storage:", err);
      }
    }

    // Update order in DB and log activity
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { deliveryPdfUrl: null },
      });

      await tx.activityLog.create({
        data: {
          description: "Documento de entrega eliminado",
          orderId: order.id,
          userId: user.id,
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/ordenes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting delivery PDF:", error);
    return {
      success: false,
      error: "Ocurrió un error al eliminar el documento de entrega.",
    };
  }
}

export async function addOrderCommentAction(orderId: number, content: string) {
  try {
    const user = await verifySession();

    if (!content || content.trim() === "") {
      return { success: false, error: "El contenido del comentario no puede estar vacío." };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { status: true },
    });

    if (!order) {
      return { success: false, error: "La orden no existe." };
    }

    if (order.status.name !== "EN_PROCESO" && order.status.name !== "LISTO") {
      return {
        success: false,
        error: "Solo se pueden agregar comentarios cuando la orden está en proceso o lista para entrega.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.orderComment.create({
        data: {
          content: content.trim(),
          orderId: orderId,
          userId: user.id,
        },
      });

      await tx.activityLog.create({
        data: {
          description: `Comentario de servicio agregado por ${user.name}`,
          orderId: orderId,
          userId: user.id,
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/ordenes");
    return { success: true };
  } catch (error) {
    console.error("Error adding order comment:", error);
    return {
      success: false,
      error: "Ocurrió un error al agregar el comentario.",
    };
  }
}

export async function downloadOrderPdfAction(orderId: number) {
  try {
    const user = await verifySession();

    // Fetch order to get code
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: "La orden no existe." };
    }

    // Generate PDF buffer
    const pdfBuffer = await generateOrderPdf(orderId);

    // Upload PDF to Cloudflare R2
    const fileUrl = await uploadBuffer(
      pdfBuffer,
      `technical-sheets/sheet-${order.code}.pdf`,
      "application/pdf"
    );

    return { success: true, url: fileUrl };
  } catch (error: any) {
    console.error("Error generating/uploading PDF for download:", error);
    return {
      success: false,
      error: error.message || "Ocurrió un error al generar la ficha técnica en PDF.",
    };
  }
}

