/**
 * Adaptador para la API de Broadcasts de Kapso
 * Documentación oficial: https://docs.kapso.ai/docs/platform/broadcasts/api
 */

export interface KapsoBroadcastRecipientComponentParam {
  type: string;
  text?: string;
  parameter_name?: string;
  [key: string]: any;
}

export interface KapsoBroadcastRecipientComponent {
  type: "header" | "body" | "button";
  sub_type?: string;
  index?: string | number;
  parameters: KapsoBroadcastRecipientComponentParam[];
}

export interface KapsoBroadcastRecipient {
  phone_number: string;
  components?: KapsoBroadcastRecipientComponent[];
}

export interface CreateBroadcastParams {
  name: string;
  whatsappTemplateId: string;
}

export interface CreateBroadcastResult {
  success: boolean;
  broadcastId?: string;
  error?: string;
  raw?: any;
}

export interface AddRecipientsResult {
  success: boolean;
  added: number;
  duplicates: number;
  errors: string[];
  error?: string;
  raw?: any;
}

export interface SendBroadcastResult {
  success: boolean;
  status?: string;
  error?: string;
  raw?: any;
}

export interface BroadcastStatusResult {
  success: boolean;
  status?: string;
  sentCount?: number;
  deliveredCount?: number;
  failedCount?: number;
  totalCount?: number;
  error?: string;
  raw?: any;
}

function getKapsoConfig() {
  const baseUrl = process.env.KAPSO_API_BASE_URL || "https://api.kapso.ai";
  const apiKey = process.env.KAPSO_API_KEY;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    throw new Error(
      "Configuración incompleta de Kapso en .env. Verifique KAPSO_API_KEY y WHATSAPP_PHONE_NUMBER_ID."
    );
  }

  return { baseUrl, apiKey, phoneNumberId };
}

/**
 * 1. Crea un broadcast con la plantilla aprobada en Kapso
 * POST /platform/v1/whatsapp/broadcasts
 */
export async function createKapsoBroadcast(
  params: CreateBroadcastParams
): Promise<CreateBroadcastResult> {
  try {
    const { baseUrl, apiKey, phoneNumberId } = getKapsoConfig();
    const endpoint = `${baseUrl}/platform/v1/whatsapp/broadcasts`;

    const payload = {
      whatsapp_broadcast: {
        name: params.name,
        phone_number_id: phoneNumberId,
        whatsapp_template_id: params.whatsappTemplateId,
      },
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg =
        json?.error?.message ||
        json?.message ||
        `Error HTTP ${res.status} al crear broadcast en Kapso.`;
      console.error("[Kapso Broadcast] Error al crear broadcast:", json);
      return { success: false, error: errMsg, raw: json };
    }

    // La API documentada retorna { data: { id: "..." } } o { data: broadcast }
    const broadcastId =
      json?.data?.id ||
      json?.id ||
      json?.whatsapp_broadcast?.id ||
      json?.broadcast?.id;

    if (!broadcastId) {
      console.error("[Kapso Broadcast] Respuesta sin ID de broadcast:", json);
      return {
        success: false,
        error: "Kapso no retornó un ID de broadcast válido.",
        raw: json,
      };
    }

    return {
      success: true,
      broadcastId: String(broadcastId),
      raw: json,
    };
  } catch (error) {
    console.error("[Kapso Broadcast] Excepción al crear broadcast:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido de red.",
    };
  }
}

/**
 * 2. Carga destinatarios en lotes de hasta 1.000 clientes
 * POST /platform/v1/whatsapp/broadcasts/{broadcast_id}/recipients
 */
export async function addKapsoBroadcastRecipients(
  broadcastId: string,
  recipients: KapsoBroadcastRecipient[]
): Promise<AddRecipientsResult> {
  try {
    const { baseUrl, apiKey } = getKapsoConfig();
    const endpoint = `${baseUrl}/platform/v1/whatsapp/broadcasts/${broadcastId}/recipients`;

    const payload = {
      whatsapp_broadcast: {
        recipients: recipients.map((r) => ({
          phone_number: r.phone_number,
          components: r.components || [],
        })),
      },
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg =
        json?.error?.message ||
        json?.message ||
        `Error HTTP ${res.status} al agregar destinatarios al broadcast.`;
      console.error("[Kapso Broadcast] Error al agregar destinatarios:", json);
      return {
        success: false,
        added: 0,
        duplicates: 0,
        errors: [errMsg],
        error: errMsg,
        raw: json,
      };
    }

    const added =
      json?.data?.added ??
      json?.added ??
      (Array.isArray(json?.data) ? json.data.length : recipients.length);
    const duplicates = json?.data?.duplicates ?? json?.duplicates ?? 0;
    const errors = json?.data?.errors ?? json?.errors ?? [];

    return {
      success: true,
      added: Number(added) || 0,
      duplicates: Number(duplicates) || 0,
      errors: Array.isArray(errors) ? errors : [String(errors)],
      raw: json,
    };
  } catch (error) {
    console.error("[Kapso Broadcast] Excepción al agregar destinatarios:", error);
    return {
      success: false,
      added: 0,
      duplicates: 0,
      errors: [error instanceof Error ? error.message : "Error de red."],
      error: error instanceof Error ? error.message : "Error de red.",
    };
  }
}

/**
 * 3. Inicia el despacho asíncrono del broadcast
 * POST /platform/v1/whatsapp/broadcasts/{broadcast_id}/send
 */
export async function sendKapsoBroadcast(
  broadcastId: string
): Promise<SendBroadcastResult> {
  try {
    const { baseUrl, apiKey } = getKapsoConfig();
    const endpoint = `${baseUrl}/platform/v1/whatsapp/broadcasts/${broadcastId}/send`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({}),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg =
        json?.error?.message ||
        json?.message ||
        `Error HTTP ${res.status} al iniciar despacho del broadcast.`;
      console.error("[Kapso Broadcast] Error al disparar envío:", json);
      return { success: false, error: errMsg, raw: json };
    }

    const status =
      json?.data?.status ||
      json?.status ||
      "sending";

    return {
      success: true,
      status: String(status),
      raw: json,
    };
  } catch (error) {
    console.error("[Kapso Broadcast] Excepción al enviar broadcast:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error de red.",
    };
  }
}

/**
 * 4. Consulta el estado y métricas actuales del broadcast
 * GET /platform/v1/whatsapp/broadcasts/{broadcast_id}
 */
export async function getKapsoBroadcastStatus(
  broadcastId: string
): Promise<BroadcastStatusResult> {
  try {
    const { baseUrl, apiKey } = getKapsoConfig();
    const endpoint = `${baseUrl}/platform/v1/whatsapp/broadcasts/${broadcastId}`;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg =
        json?.error?.message ||
        json?.message ||
        `Error HTTP ${res.status} al consultar estado del broadcast.`;
      return { success: false, error: errMsg, raw: json };
    }

    const data = json?.data || json?.whatsapp_broadcast || json;

    return {
      success: true,
      status: data?.status,
      sentCount: data?.sent_count ?? data?.metrics?.sent_count ?? 0,
      deliveredCount: data?.delivered_count ?? data?.metrics?.delivered_count ?? 0,
      failedCount: data?.failed_count ?? data?.metrics?.failed_count ?? 0,
      totalCount: data?.total_count ?? data?.recipients_count ?? 0,
      raw: json,
    };
  } catch (error) {
    console.error("[Kapso Broadcast] Excepción al consultar estado:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error de red.",
    };
  }
}
