"use server";

import prisma from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { getPresignedUploadUrl } from "@/lib/storage";
import { sendWhatsAppPromotionAction } from "@/lib/whatsapp";

// Action to get presigned upload URL
export async function getPresignedUploadUrlAction(
  filename: string,
  contentType: string
) {
  try {
    await verifyAdminSession();

    if (!filename || !contentType) {
      return { success: false, error: "Nombre de archivo y tipo son requeridos." };
    }

    const brandSlug = filename.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
    const key = `promotions/${Date.now()}-${brandSlug}`;

    const { uploadUrl, fileUrl } = await getPresignedUploadUrl(key, contentType);
    return { success: true, uploadUrl, fileUrl };
  } catch (error) {
    console.error("Error generating presigned url:", error);
    return { success: false, error: "Error al generar la URL de subida." };
  }
}

// Action to fetch approved templates from Kapso
export async function getWhatsAppTemplatesAction() {
  try {
    await verifyAdminSession();

    const baseUrl = process.env.KAPSO_API_BASE_URL || "https://api.kapso.ai";
    const apiKey = process.env.KAPSO_API_KEY;
    const wabaId = process.env.WHATSAPP_WABA_ID;

    if (!apiKey || !wabaId) {
      return { success: false, error: "Configuración incompleta en el servidor (.env)." };
    }

    const endpoint = `${baseUrl}/meta/whatsapp/v24.0/${wabaId}/templates?limit=100`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[WhatsApp Templates] API Error:", data);
      return { success: false, error: data.error?.message || "Error al consultar las plantillas." };
    }

    // Filter only APPROVED templates
    const templates = (data.data || []).filter((t: any) => t.status === "APPROVED");
    return { success: true, templates };
  } catch (error) {
    console.error("Error fetching templates:", error);
    return { success: false, error: "Error al conectar con la API de WhatsApp." };
  }
}

// Action to save and dispatch the campaign
export async function createPromotionAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await verifyAdminSession();

    const name = formData.get("name") as string;
    const serviceIdStr = formData.get("serviceId") as string;
    const brandIdStr = formData.get("brandId") as string;
    const templateName = formData.get("templateName") as string;
    const fileUrl = formData.get("fileUrl") as string || null;
    const clientIdsStr = formData.get("clientIds") as string; // JSON array of numbers

    if (!name || !serviceIdStr || !brandIdStr || !templateName || !clientIdsStr) {
      return { success: false, error: "Todos los campos de la promoción son requeridos." };
    }

    const serviceId = parseInt(serviceIdStr, 10);
    const brandId = parseInt(brandIdStr, 10);
    const clientIds = JSON.parse(clientIdsStr) as number[];

    if (isNaN(serviceId) || isNaN(brandId) || !Array.isArray(clientIds) || clientIds.length === 0) {
      return { success: false, error: "Los parámetros de servicios, marcas o clientes no son válidos." };
    }

    // 1. Create Promotion campaign in database
    const newPromotion = await prisma.promotion.create({
      data: {
        name: name.trim(),
        templateName,
        fileUrl,
        serviceId,
        brandId,
      },
    });

    // 2. Trigger asynchronous sending of WhatsApp messages in background
    dispatchPromotionMessages(newPromotion.id, clientIds).catch((err) => {
      console.error(`[Promotions dispatch] Critical background error for promotion ${newPromotion.id}:`, err);
    });

    revalidatePath("/promociones");
    return { success: true };
  } catch (error) {
    console.error("Error creating promotion campaign:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error al procesar el registro de la promoción." };
  }
}

// Helper function to sequentially dispatch templates with 200ms delay in the background
async function dispatchPromotionMessages(promotionId: number, clientIds: number[]) {
  console.log(`[Promotions] Starting background dispatch of promotion campaign ID ${promotionId} to ${clientIds.length} clients...`);
  
  for (const clientId of clientIds) {
    let status = "FAILED";
    try {
      const success = await sendWhatsAppPromotionAction(promotionId, clientId);
      if (success) {
        status = "SENT";
      }
    } catch (err) {
      console.error(`[Promotions] Failed sending message to client ID ${clientId} in campaign ${promotionId}:`, err);
    }

    // Save record of the sent message
    try {
      await prisma.promotionClient.create({
        data: {
          promotionId,
          clientId,
          status,
        },
      });
    } catch (dbErr) {
      console.error(`[Promotions] Failed to save promotion status in DB for client ID ${clientId}:`, dbErr);
    }

    // 200ms delay to prevent rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  console.log(`[Promotions] Finished dispatching campaign ID ${promotionId}.`);
}
