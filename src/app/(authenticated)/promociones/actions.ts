"use server";

import prisma from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { getPresignedUploadUrl } from "@/lib/storage";
import { formatearTelefonoE164 } from "@/lib/whatsapp";
import {
  createKapsoBroadcast,
  addKapsoBroadcastRecipients,
  sendKapsoBroadcast,
  getKapsoBroadcastStatus,
  KapsoBroadcastRecipient,
} from "@/lib/kapso-broadcast";

// Action to get presigned upload URL for Cloudflare R2
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

// Action to fetch approved templates from Kapso (filtered for marketing/promos)
export async function getWhatsAppTemplatesAction() {
  try {
    await verifyAdminSession();

    const baseUrl = process.env.KAPSO_API_BASE_URL || "https://api.kapso.ai";
    const apiKey = process.env.KAPSO_API_KEY;
    const wabaId = process.env.WHATSAPP_WABA_ID;

    if (!apiKey || !wabaId) {
      return { success: false, error: "Configuración incompleta en el servidor (.env)." };
    }

    const endpoint = `${baseUrl}/meta/whatsapp/v24.0/${wabaId}/message_templates?limit=100`;

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
    const allApproved = (data.data || []).filter((t: any) => t.status === "APPROVED");

    // Filtrar estrictamente: MARKETING o con prefijo 'promo_' o nombre con 'promo'
    const marketingTemplates = allApproved.filter((t: any) => {
      const nameLower = (t.name || "").toLowerCase();
      const isPromoName = nameLower.startsWith("promo_") || nameLower.includes("promo");
      const isMarketing = (t.category || "").toUpperCase() === "MARKETING";
      const isTransactional =
        nameLower.includes("recibido") ||
        nameLower.includes("entregado") ||
        nameLower.includes("reserva") ||
        nameLower.includes("cita") ||
        nameLower.includes("auditora");

      return (isPromoName || isMarketing) && !isTransactional;
    });

    // Si no hay templates con filtro estricto de marketing, devolver los approved no transaccionales
    const templates = marketingTemplates.length > 0
      ? marketingTemplates
      : allApproved.filter((t: any) => {
          const nameLower = (t.name || "").toLowerCase();
          return (
            !nameLower.includes("recibido") &&
            !nameLower.includes("entregado") &&
            !nameLower.includes("reserva") &&
            !nameLower.includes("cita")
          );
        });

    return {
      success: true,
      templates: templates.map((t: any) => ({
        id: String(t.id),
        name: t.name,
        category: t.category,
        language: t.language,
        status: t.status,
        components: t.components || [],
      })),
    };
  } catch (error) {
    console.error("Error fetching templates:", error);
    return { success: false, error: "Error al conectar con la API de WhatsApp." };
  }
}

export interface CreateAndDispatchPromotionParams {
  promotionName: string;
  brandId: number;
  serviceId: number;
  clientIds: number[];
  variables: {
    benefitDescription: string;
    validityDate: string;
  };
  fileUrl?: string | null;
}

/**
 * Server Action principal para crear y disparar la campaña con Kapso Broadcasts
 */
export async function createAndDispatchPromotionAction(
  params: CreateAndDispatchPromotionParams
) {
  try {
    await verifyAdminSession();

    const {
      promotionName,
      brandId,
      serviceId,
      clientIds,
      variables,
      fileUrl,
    } = params;

    if (!promotionName?.trim()) {
      return { success: false, error: "El nombre de la campaña es obligatorio." };
    }
    if (!brandId || !serviceId) {
      return { success: false, error: "Debe seleccionar la marca y el servicio." };
    }
    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      return { success: false, error: "Debe seleccionar al menos un cliente destinatario." };
    }
    if (!variables?.benefitDescription?.trim() || !variables?.validityDate?.trim()) {
      return { success: false, error: "La descripción del beneficio y la vigencia son requeridas." };
    }

    // 1. Obtener datos de la marca y servicio
    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    const service = await prisma.serviceCatalog.findUnique({ where: { id: serviceId } });

    if (!brand || !service) {
      return { success: false, error: "Marca o servicio no encontrados." };
    }

    // 2. Determinar la plantilla según si hay imagen o no
    const hasImage = Boolean(fileUrl && fileUrl.trim() !== "");
    const targetTemplateName = hasImage ? "promo_servicios_imagen_v1" : "promo_servicios_texto_v1";

    // IDs confirmados y registrados en Kapso / Meta:
    const KNOWN_TEMPLATE_IDS: Record<string, string> = {
      promo_servicios_texto_v1: "3109450429264955",
      promo_servicios_imagen_v1: "1949029769076328",
    };

    // 3. Resolver el ID de la plantilla aprobada en Kapso (whatsapp_template_id)
    let whatsappTemplateId = KNOWN_TEMPLATE_IDS[targetTemplateName];
    let finalTemplateName = targetTemplateName;

    // Verificar si está disponible en la lista de plantillas sincronizadas
    const templatesRes = await getWhatsAppTemplatesAction();
    if (templatesRes.success && templatesRes.templates) {
      const liveTemplate = templatesRes.templates.find((t: any) => t.name === targetTemplateName);
      if (liveTemplate) {
        whatsappTemplateId = liveTemplate.id;
        finalTemplateName = liveTemplate.name;
      }
    }

    // 4. Crear el registro local de la promoción en PostgreSQL como DISPATCHING
    const newPromotion = await prisma.promotion.create({
      data: {
        name: promotionName.trim(),
        templateName: finalTemplateName,
        whatsappTemplateId,
        fileUrl: hasImage ? fileUrl : null,
        serviceId,
        brandId,
        status: "DISPATCHING",
        totalRecipients: clientIds.length,
        customParams: {
          benefitDescription: variables.benefitDescription.trim(),
          validityDate: variables.validityDate.trim(),
        },
      },
    });

    // 5. Consultar los clientes seleccionados
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    // 6. Validar y normalizar teléfonos a formato E.164 (+57...)
    const validRecipients: { clientId: number; phone: string }[] = [];
    const rejectedClients: { clientId: number; error: string }[] = [];

    for (const client of clients) {
      const { valid, formatted } = formatearTelefonoE164(client.phone);
      if (valid && formatted) {
        validRecipients.push({ clientId: client.id, phone: formatted });
      } else {
        rejectedClients.push({
          clientId: client.id,
          error: `Teléfono inválido o incompleto: "${client.phone}"`,
        });
      }
    }

    if (validRecipients.length === 0) {
      await prisma.promotion.update({
        where: { id: newPromotion.id },
        data: {
          status: "FAILED",
          kapsoLastError: "Ninguno de los clientes seleccionados cuenta con un número celular válido en formato E.164.",
        },
      });

      // Guardar rechazados
      if (rejectedClients.length > 0) {
        await prisma.promotionClient.createMany({
          data: rejectedClients.map((rc) => ({
            promotionId: newPromotion.id,
            clientId: rc.clientId,
            status: "REJECTED",
            errorMessage: rc.error,
          })),
        });
      }

      return {
        success: false,
        error: "Ningún cliente cuenta con un número celular válido en formato E.164.",
      };
    }

    // 7. Crear el broadcast en Kapso (POST /platform/v1/whatsapp/broadcasts)
    console.log(`[Kapso Broadcast] Creando broadcast para campaña "${promotionName}" con plantilla ID: ${whatsappTemplateId}`);
    const createBroadcastRes = await createKapsoBroadcast({
      name: `${promotionName.trim()} (${brand.name})`,
      whatsappTemplateId,
    });

    if (!createBroadcastRes.success || !createBroadcastRes.broadcastId) {
      const errorMsg = createBroadcastRes.error || "Error al registrar el broadcast en Kapso.";
      await prisma.promotion.update({
        where: { id: newPromotion.id },
        data: {
          status: "FAILED",
          kapsoLastError: errorMsg,
        },
      });

      return {
        success: false,
        error: `Fallo al crear broadcast en Kapso: ${errorMsg}`,
      };
    }

    const broadcastId = createBroadcastRes.broadcastId;

    // Guardar inmediatamente el ID del broadcast de Kapso en PostgreSQL
    await prisma.promotion.update({
      where: { id: newPromotion.id },
      data: { kapsoBroadcastId: broadcastId },
    });

    // 8. Preparar los componentes dinámicos con variables posicionales:
    // [client.name, brand.name, benefitDescription, validityDate]
    const recipientsPayload: KapsoBroadcastRecipient[] = validRecipients.map((rec) => {
      const client = clients.find((c) => c.id === rec.clientId);
      const customerName = client ? client.name.split(" ")[0] : "Cliente"; // Primer nombre o nombre completo

      const bodyParameters = [
        { type: "text", text: customerName },
        { type: "text", text: brand.name },
        { type: "text", text: variables.benefitDescription.trim() },
        { type: "text", text: variables.validityDate.trim() },
      ];

      const components: any[] = [
        {
          type: "body",
          parameters: bodyParameters,
        },
      ];

      // Cabecera multimedia si hay imagen
      if (hasImage && fileUrl) {
        components.unshift({
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: fileUrl,
              },
            },
          ],
        });
      }

      return {
        phone_number: rec.phone,
        components,
      };
    });

    // 9. Subir destinatarios a Kapso (POST /platform/v1/whatsapp/broadcasts/{id}/recipients)
    console.log(`[Kapso Broadcast] Subiendo ${recipientsPayload.length} destinatarios al broadcast ${broadcastId}...`);
    const addRecipientsRes = await addKapsoBroadcastRecipients(broadcastId, recipientsPayload);

    // 10. Persistir las relaciones en PromotionClient
    const promotionClientsData: {
      promotionId: number;
      clientId: number;
      status: string;
      errorMessage: string | null;
    }[] = [];

    // Clientes aceptados
    validRecipients.forEach((rec) => {
      promotionClientsData.push({
        promotionId: newPromotion.id,
        clientId: rec.clientId,
        status: "QUEUED",
        errorMessage: null,
      });
    });

    // Clientes con teléfonos previamente descartados
    rejectedClients.forEach((rej) => {
      promotionClientsData.push({
        promotionId: newPromotion.id,
        clientId: rej.clientId,
        status: "REJECTED",
        errorMessage: rej.error,
      });
    });

    await prisma.promotionClient.createMany({
      data: promotionClientsData,
    });

    // Verificar si se aceptó al menos 1 destinatario
    if (addRecipientsRes.added === 0) {
      const errorMsg = addRecipientsRes.errors?.join(", ") || "No se aceptaron destinatarios en Kapso.";
      await prisma.promotion.update({
        where: { id: newPromotion.id },
        data: {
          status: "FAILED",
          kapsoLastError: `Destinatarios rechazados por Kapso: ${errorMsg}`,
        },
      });

      return {
        success: false,
        error: `Kapso rechazó los destinatarios: ${errorMsg}`,
      };
    }

    // 11. Disparar el envío del broadcast (POST /platform/v1/whatsapp/broadcasts/{id}/send)
    console.log(`[Kapso Broadcast] Disparando envío del broadcast ${broadcastId}...`);
    const sendRes = await sendKapsoBroadcast(broadcastId);

    if (!sendRes.success) {
      const errorMsg = sendRes.error || "Error al activar el envío en Kapso.";
      await prisma.promotion.update({
        where: { id: newPromotion.id },
        data: {
          status: "FAILED",
          kapsoLastError: errorMsg,
        },
      });

      return {
        success: false,
        error: `El broadcast se creó pero falló el inicio del envío: ${errorMsg}`,
      };
    }

    // 12. Actualizar estado local a SENDING
    await prisma.promotion.update({
      where: { id: newPromotion.id },
      data: {
        status: "SENDING",
        dispatchedAt: new Date(),
        totalRecipients: addRecipientsRes.added,
      },
    });

    revalidatePath("/promociones");

    return {
      success: true,
      promotionId: newPromotion.id,
      broadcastId,
      added: addRecipientsRes.added,
      rejected: rejectedClients.length + addRecipientsRes.errors.length,
    };
  } catch (error) {
    console.error("Error en createAndDispatchPromotionAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error inesperado al despachar la promoción.",
    };
  }
}

/**
 * Server Action para sincronizar métricas y estado del broadcast desde Kapso
 */
export async function syncBroadcastStatusAction(promotionId: number) {
  try {
    await verifyAdminSession();

    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      return { success: false, error: "Promoción no encontrada." };
    }

    if (!promotion.kapsoBroadcastId) {
      return { success: false, error: "Esta promoción no tiene un ID de broadcast de Kapso asociado." };
    }

    const statusRes = await getKapsoBroadcastStatus(promotion.kapsoBroadcastId);

    if (!statusRes.success) {
      return { success: false, error: statusRes.error || "No se pudo obtener el estado desde Kapso." };
    }

    let newStatus = promotion.status;
    const kapsoStatusLower = (statusRes.status || "").toLowerCase();

    if (kapsoStatusLower === "completed" || kapsoStatusLower === "finished") {
      newStatus = "COMPLETED";
    } else if (kapsoStatusLower === "failed" || kapsoStatusLower === "error") {
      newStatus = "FAILED";
    } else if (kapsoStatusLower === "sending" || kapsoStatusLower === "processing") {
      newStatus = "SENDING";
    }

    await prisma.promotion.update({
      where: { id: promotionId },
      data: {
        status: newStatus,
        sentCount: statusRes.sentCount ?? promotion.sentCount,
        failedCount: statusRes.failedCount ?? promotion.failedCount,
        completedAt: newStatus === "COMPLETED" ? new Date() : promotion.completedAt,
      },
    });

    revalidatePath("/promociones");

    return {
      success: true,
      status: newStatus,
      sentCount: statusRes.sentCount ?? 0,
      deliveredCount: statusRes.deliveredCount ?? 0,
      failedCount: statusRes.failedCount ?? 0,
    };
  } catch (error) {
    console.error("Error syncing broadcast status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al sincronizar estado del broadcast.",
    };
  }
}
