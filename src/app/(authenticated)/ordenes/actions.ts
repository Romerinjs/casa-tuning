"use server";

import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

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

export async function uploadDeliveryPdfAction(
  orderId: number,
  pdfBase64: string,
  filename: string
) {
  try {
    const user = await verifySession();

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

    // --- CLOUDFLARE R2 BUCKET UPLOAD CONFIGURATION (COMMENTED OUT) ---
    /*
    const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
    
    const r2Client = new S3Client({
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      region: "auto",
    });

    const fileBuffer = Buffer.from(pdfBase64.replace(/^data:application\/pdf;base64,/, ""), 'base64');
    
    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: `delivery-documents/pdf-${orderId}.pdf`,
      Body: fileBuffer,
      ContentType: "application/pdf",
    }));

    const fileUrl = `https://cdn.casatuning.com/delivery-documents/pdf-${orderId}.pdf`;
    */
    // -----------------------------------------------------------------

    // PROVISIONAL: Save the PDF locally for testing and development
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const dirPath = path.join(process.cwd(), 'public', 'uploads', 'pdfs');
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    const filePath = path.join(dirPath, `pdf-${orderId}.pdf`);
    fs.writeFileSync(filePath, buffer);
    const localUrl = `/uploads/pdfs/pdf-${orderId}.pdf`;

    // Update order with the PDF URL and log activity
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { deliveryPdfUrl: localUrl },
      });

      await tx.activityLog.create({
        data: {
          description: `Documento de entrega cargado: ${filename}`,
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

    // Delete local file if it exists
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'pdfs', `pdf-${orderId}.pdf`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Error deleting physical PDF file:", err);
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
