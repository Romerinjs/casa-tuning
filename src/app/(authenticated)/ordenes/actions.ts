"use server";

import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { uploadBase64, deleteFile, uploadBuffer } from "@/lib/storage";
import { sendDeliveryEmail, sendReadyEmail } from "@/lib/emails";
import { generateOrderPdf } from "@/lib/pdf-generator";
import { sendWhatsAppDeliveryAction, sendWhatsAppReadyAction } from "@/lib/whatsapp";

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

        if (completeOrder) {
          if (completeOrder.signatureUrl) {
            // Send delivery email and WhatsApp in background if signed
            if (completeOrder.client.email) {
              await sendDeliveryEmail(completeOrder.client.email, completeOrder);
            }
            if (completeOrder.client.phone) {
              sendWhatsAppDeliveryAction(orderId).catch((err) => {
                console.error("Error in background sendWhatsAppDeliveryAction:", err);
              });
            }
          } else {
            // Send ready email and WhatsApp in background if unsigned
            if (completeOrder.client.email) {
              await sendReadyEmail(completeOrder.client.email, completeOrder);
            }
            if (completeOrder.client.phone) {
              sendWhatsAppReadyAction(orderId).catch((err) => {
                console.error("Error in background sendWhatsAppReadyAction:", err);
              });
            }
          }
        }
      } catch (emailError) {
        console.error("Error sending delivery notifications to client:", emailError);
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

    // 1. Fetch order details to check status and signature
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { status: true },
    });
 
    if (!order) {
      return { success: false, error: "La orden no existe." };
    }
 
    if (order.status.name !== "ENTREGADO") {
      return {
        success: false,
        error: "El documento de entrega solo se puede cargar cuando la orden está entregada.",
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
 
    // If order has signature, send delivery notification with invoice PDF
    const completeOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        car: {
          include: { brand: true }
        }
      }
    });
 
    if (completeOrder && completeOrder.signatureUrl) {
      if (completeOrder.client.email) {
        sendDeliveryEmail(completeOrder.client.email, completeOrder).catch(err => {
          console.error("Error in background sendDeliveryEmail on PDF upload:", err);
        });
      }
      if (completeOrder.client.phone) {
        sendWhatsAppDeliveryAction(orderId).catch(err => {
          console.error("Error in background sendWhatsAppDeliveryAction on PDF upload:", err);
        });
      }
    }

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
      "application/pdf",
      "public, max-age=60"
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

/**
 * Registra la firma digital del cliente a posteriori y re-genera la ficha técnica e inicia notificaciones
 */
export async function saveOrderSignatureAction(orderId: number, signatureData: string) {
  try {
    const user = await verifySession();

    if (!orderId || !signatureData || !signatureData.startsWith("data:image")) {
      return { success: false, error: "Datos de firma inválidos o incompletos." };
    }

    // 1. Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { status: true, client: true, car: { include: { brand: true } } },
    });

    if (!order) {
      return { success: false, error: "La orden no existe." };
    }

    // 2. Upload signature to R2
    const match = order.code.match(/(\d+)$/);
    const sequence = match ? match[1] : String(order.id);
    const signatureUrl = await uploadBase64(signatureData, `signatures/sig-${sequence}`);

    // 3. Update database
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { signatureUrl },
      });

      await tx.activityLog.create({
        data: {
          description: `Firma digital de entrega registrada`,
          orderId,
          userId: user.id,
        },
      });
    });

    // 4. Re-generate Ficha Técnica PDF (which now includes the signature)
    try {
      const pdfBuffer = await generateOrderPdf(orderId);
      const r2FileName = `fichas-tecnicas/ficha-${order.code}.pdf`;
      await uploadBuffer(pdfBuffer, r2FileName, "application/pdf");
      console.log(`[saveOrderSignatureAction] Ficha técnica PDF re-generada y subida a R2: ${r2FileName}`);
    } catch (pdfError) {
      console.error("Error re-generating PDF after signature:", pdfError);
    }

    // 5. Trigger notifications if status is ENTREGADO
    if (order.status.name === "ENTREGADO") {
      const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { client: true, car: { include: { brand: true } } },
      });

      if (updatedOrder) {
        if (updatedOrder.client.email) {
          sendDeliveryEmail(updatedOrder.client.email, updatedOrder).catch(err => {
            console.error("Error sending delivery email in background:", err);
          });
        }
        if (updatedOrder.client.phone) {
          sendWhatsAppDeliveryAction(orderId).catch(err => {
            console.error("Error sending WhatsApp delivery action in background:", err);
          });
        }
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/ordenes");
    revalidatePath("/clientes");

    return { success: true };
  } catch (error) {
    console.error("Error in saveOrderSignatureAction:", error);
    return {
      success: false,
      error: "Ocurrió un error al registrar la firma de entrega.",
    };
  }
}

