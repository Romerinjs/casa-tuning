import prisma from "./prisma";

// Diccionario estático con los textos exactos aprobados para las recomendaciones de cuidado
const INSTRUCCIONES_CUIDADO: Record<string, string[]> = {
  polarizado: [
    "Recuerda no bajar vidrios después de 24 horas.",
    "Recuerda si mañana ves porosidad o humedad, esto se genera mientras el papel polarizado termina de secar, tiempo estimado 5/6 días.",
    "La garantía por contaminación es máxima de 30 días.",
    "No laves el auto hasta después pasados 2 días.",
    "Cero uso de siliconas en los empaques donde el vidrio desliza."
  ],
  ppf: [
    "Recuerda debes traer el auto 5 días después de entrega para una pequeña revisión. Esto se lleva a cabo para revisar y evitar desprendimiento.",
    "Cero uso de siliconas.",
    "Recuerda trata de limpiar las piezas forradas con un shampoo con pH neutro.",
    "Es posible que se vea humedad, es normal mientras el papel seca.",
    "No tocar las piezas forradas mientras pasan 24 horas.",
    "No lavar con agua a presión."
  ],
  radioAndroid: [
    "Su garantía es de un año a partir de su fecha de instalación.",
    "En caso de fallas durante los 3 primeros meses se hará cambio inmediato de la unidad.",
    "Si después de 6 meses la unidad genera molestias tendrá a cabo una revisión técnica.",
    "La revisión técnica bajando la unidad puede tener una demora de 15 días hábiles sea por reparación y/o cambio de piezas."
  ]
};

/**
 * Compila las recomendaciones para una orden de acuerdo a sus servicios contratados.
 */
export function obtenerRecomendaciones(servicios: { name: string }[]): { serviceName: string; instructions: string } | null {
  const cuidadosEncontrados = new Set<string>();
  const nombresServicios: string[] = [];

  servicios.forEach((serv) => {
    const nameLower = serv.name.toLowerCase();

    let matched = false;
    if (nameLower.includes("polarizado") || nameLower.includes("pelicula")) {
      INSTRUCCIONES_CUIDADO.polarizado.forEach(c => cuidadosEncontrados.add(c));
      nombresServicios.push(serv.name);
      matched = true;
    }
    if (nameLower.includes("ppf") || nameLower.includes("paint protection")) {
      INSTRUCCIONES_CUIDADO.ppf.forEach(c => cuidadosEncontrados.add(c));
      nombresServicios.push(serv.name);
      matched = true;
    }
    if (nameLower.includes("radio") || nameLower.includes("android") || nameLower.includes("pantalla")) {
      INSTRUCCIONES_CUIDADO.radioAndroid.forEach(c => cuidadosEncontrados.add(c));
      nombresServicios.push(serv.name);
      matched = true;
    }

    // Si no coincide con ninguno, no agregamos recomendaciones pero mantenemos registro si es necesario
  });

  // Si no se encontraron servicios con cuidados especiales, devolvemos null
  if (cuidadosEncontrados.size === 0) {
    return null;
  }

  const care_instructions = Array.from(cuidadosEncontrados)
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");

  const serviceName = nombresServicios.join(", ");

  return { serviceName, instructions: care_instructions };
}

/**
 * Formatea el número de celular al estándar internacional E.164 (Ej: +57XXXXXXXXXX)
 */
function formatearTelefono(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  // Por defecto si es de 10 dígitos y es Colombia añadimos prefijo +57
  if (clean.length === 10) {
    return `+57${clean}`;
  }
  return `+${clean}`;
}

/**
 * Helper genérico para despachar peticiones a la API de Kapso
 */
async function enviarMensajeKapso(payload: any): Promise<boolean> {
  const baseUrl = process.env.KAPSO_API_BASE_URL || "https://api.kapso.ai";
  const apiKey = process.env.KAPSO_API_KEY;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiKey || !phoneId) {
    console.warn("[WhatsApp Kapso] Configuración incompleta. Revisa KAPSO_API_KEY y WHATSAPP_PHONE_NUMBER_ID en el archivo .env.");
    return false;
  }

  const endpoint = `${baseUrl}/meta/whatsapp/v24.0/${phoneId}/messages`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[WhatsApp Kapso] Error de respuesta de la API:", data);
      return false;
    }

    console.log("[WhatsApp Kapso] Mensaje enviado exitosamente:", data);
    return true;
  } catch (error) {
    console.error("[WhatsApp Kapso] Error de red al enviar mensaje:", error);
    return false;
  }
}

/**
 * Envía la notificación de recepción del vehículo (Plantilla A)
 */
export async function sendWhatsAppReceptionAction(orderId: number): Promise<boolean> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        car: {
          include: { brand: true }
        },
        services: {
          include: { service: true }
        }
      }
    });

    if (!order || !order.client.phone) {
      console.warn(`[WhatsApp Kapso] No se pudo enviar recepción: Orden ${orderId} no encontrada o sin celular.`);
      return false;
    }

    const customerName = order.client.name;
    const vehicleName = `${order.car.brand.name} ${order.car.model}`;
    const plate = order.car.plate;
    const servicesList = order.services.map(s => s.service.name).join(", ");
    const recipientPhone = formatearTelefono(order.client.phone);

    const payload = {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "template",
      template: {
        name: "vehiculo_recibido",
        language: { code: "es_MX" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", parameter_name: "customer_name", text: customerName },
              { type: "text", parameter_name: "vehicle_name", text: vehicleName },
              { type: "text", parameter_name: "plate", text: plate },
              { type: "text", parameter_name: "services_list", text: servicesList }
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              { type: "text", text: `sheet-${order.code}.pdf` }
            ]
          }
        ]
      }
    };

    console.log(`[WhatsApp Kapso] Enviando plantilla 'vehiculo_recibido' para orden ${order.code} a ${recipientPhone}`);
    const success = await enviarMensajeKapso(payload);

    if (success) {
      await prisma.orderNotification.create({
        data: {
          orderId: order.id,
          platform: "WHATSAPP",
          notificationType: "RECEPCION"
        }
      });
    }

    return success;
  } catch (error) {
    console.error(`[WhatsApp Kapso] Error en sendWhatsAppReceptionAction para la orden ${orderId}:`, error);
    return false;
  }
}

/**
 * Envía la notificación de entrega (Plantilla B) y las recomendaciones (Plantilla C) de forma consecutiva
 */
export async function sendWhatsAppDeliveryAction(orderId: number): Promise<boolean> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        car: {
          include: { brand: true }
        },
        services: {
          include: { service: true }
        }
      }
    });

    if (!order || !order.client.phone) {
      console.warn(`[WhatsApp Kapso] No se pudo enviar entrega: Orden ${orderId} no encontrada o sin celular.`);
      return false;
    }

    const customerName = order.client.name;
    const vehicleName = `${order.car.brand.name} ${order.car.model}`;
    const plate = order.car.plate;
    const recipientPhone = formatearTelefono(order.client.phone);

    // 1. Enviar Plantilla B: vehiculo_entregado (Sin facturas adjuntas, solo ficha técnica)
    const payloadB = {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "template",
      template: {
        name: "vehiculo_entregado",
        language: { code: "es_MX" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", parameter_name: "customer_name", text: customerName },
              { type: "text", parameter_name: "vehicle_name", text: vehicleName },
              { type: "text", parameter_name: "plate", text: plate },
              { type: "text", parameter_name: "order_code", text: order.code }
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              { type: "text", text: `sheet-${order.code}.pdf` }
            ]
          }
        ]
      }
    };

    console.log(`[WhatsApp Kapso] Enviando plantilla 'vehiculo_entregado' para orden ${order.code} a ${recipientPhone}`);
    const successB = await enviarMensajeKapso(payloadB);
 
    if (successB) {
      await prisma.orderNotification.create({
        data: {
          orderId: order.id,
          platform: "WHATSAPP",
          notificationType: "ENTREGA"
        }
      });
    }

    // 2. Enviar Plantilla C: recomendaciones_servicio (Solo si la orden tiene servicios configurados con recomendaciones)
    const serviciosOrden = order.services.map(s => s.service);
    const recomendacionData = obtenerRecomendaciones(serviciosOrden);

    if (recomendacionData) {
      const payloadC = {
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "template",
        template: {
          name: "recomendaciones_servicio",
          language: { code: "es_MX" }, // Idioma es_MX especificado por el usuario
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", parameter_name: "customer_name", text: customerName },
                { type: "text", parameter_name: "service_name", text: recomendacionData.serviceName },
                { type: "text", parameter_name: "care_instructions", text: recomendacionData.instructions }
              ]
            }
          ]
        }
      };

      console.log(`[WhatsApp Kapso] Enviando plantilla 'recomendaciones_servicio' para orden ${order.code} a ${recipientPhone}`);
      const successC = await enviarMensajeKapso(payloadC);

      if (successC) {
        await prisma.orderNotification.create({
          data: {
            orderId: order.id,
            platform: "WHATSAPP",
            notificationType: "RECOMENDACIONES"
          }
        });
      }
    }

    return successB;
  } catch (error) {
    console.error(`[WhatsApp Kapso] Error en sendWhatsAppDeliveryAction para la orden ${orderId}:`, error);
    return false;
  }
}

/**
 * Envía una plantilla de promoción de WhatsApp a un cliente
 */
export async function sendWhatsAppPromotionAction(promotionId: number, clientId: number): Promise<boolean> {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
      include: {
        service: true,
        brand: true,
      },
    });

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!promotion || !client || !client.phone) {
      console.warn(`[WhatsApp Promotion] Campaña o cliente no encontrado para envío.`);
      return false;
    }

    const customerName = client.name;
    const serviceName = promotion.service.name;
    const brandName = promotion.brand.name;
    const recipientPhone = formatearTelefono(client.phone);

    // Mapeo automático de variables (1 = Cliente, 2 = Servicio, 3 = Marca)
    const parameters = [
      { type: "text", parameter_name: "customer_name", text: customerName },
      { type: "text", parameter_name: "service_name", text: serviceName },
      { type: "text", parameter_name: "brand_name", text: brandName }
    ];

    const components: any[] = [
      {
        type: "body",
        parameters: parameters
      }
    ];

    // Si la promoción tiene un archivo adjunto, lo vinculamos en el header
    if (promotion.fileUrl) {
      const urlLower = promotion.fileUrl.toLowerCase();
      let mediaType: "image" | "video" | "document" = "document";
      
      if (urlLower.endsWith(".png") || urlLower.endsWith(".jpg") || urlLower.endsWith(".jpeg") || urlLower.endsWith(".webp")) {
        mediaType = "image";
      } else if (urlLower.endsWith(".mp4") || urlLower.endsWith(".m4v") || urlLower.endsWith(".mov") || urlLower.endsWith(".avi")) {
        mediaType = "video";
      }

      components.push({
        type: "header",
        parameters: [
          {
            type: mediaType,
            [mediaType]: {
              link: promotion.fileUrl,
              ...(mediaType === "document" ? { filename: `Promocion_${promotion.brand.name.replace(/\s+/g, "_")}.pdf` } : {})
            }
          }
        ]
      });
    }

    const payload = {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "template",
      template: {
        name: promotion.templateName,
        language: { code: "es_MX" },
        components: components
      }
    };

    console.log(`[WhatsApp Promotion] Campaña ${promotion.name} enviando a ${recipientPhone} vía plantilla '${promotion.templateName}'`);
    return await enviarMensajeKapso(payload);
  } catch (error) {
    console.error(`[WhatsApp Promotion] Error al enviar mensaje de promoción:`, error);
    return false;
  }
}

/**
 * Envía una notificación de WhatsApp simple avisando que el vehículo está listo para retiro
 */
export async function sendWhatsAppReadyAction(orderId: number): Promise<boolean> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        car: {
          include: { brand: true }
        }
      }
    });

    if (!order || !order.client.phone) {
      console.warn(`[WhatsApp Kapso] No se pudo enviar aviso de listo: Orden ${orderId} no encontrada o sin celular.`);
      return false;
    }

    const customerName = order.client.name;
    const vehicleName = `${order.car.brand.name} ${order.car.model}`;
    const plate = order.car.plate;
    const recipientPhone = formatearTelefono(order.client.phone);

    const payload = {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "text",
      text: {
        body: `Hola ${customerName}, te informamos que tu vehículo ${vehicleName} con placas ${plate} ya está listo para retiro en Casa Tuning. ¡Te esperamos!`
      }
    };

    console.log(`[WhatsApp Kapso] Enviando mensaje de vehículo listo para orden ${order.code} a ${recipientPhone}`);
    const success = await enviarMensajeKapso(payload);

    if (success) {
      await prisma.orderNotification.create({
        data: {
          orderId: order.id,
          platform: "WHATSAPP",
          notificationType: "VEHICULO_LISTO"
        }
      });
    }

    return success;
  } catch (error) {
    console.error(`[WhatsApp Kapso] Error en sendWhatsAppReadyAction para la orden ${orderId}:`, error);
    return false;
  }
}

