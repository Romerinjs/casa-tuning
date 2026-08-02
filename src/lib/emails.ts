import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { uploadBuffer } from "./storage";
import { generateOrderPdf } from "./pdf-generator";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

// Initialize Resend safely
const resend = new Resend(apiKey || "re_dummy_key_for_compilation");

// Helper to format date cleanly
function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Helper to check if public/logo-ct.png exists, upload it to R2 if needed, and return the public URL
async function getOrUploadLogoUrl(): Promise<string> {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) return "";
  
  const logoKey = "logo-ct.png";
  const logoUrl = `${publicUrl.endsWith("/") ? publicUrl.slice(0, -1) : publicUrl}/${logoKey}`;
  
  try {
    const logoLocalPath = path.join(process.cwd(), "public", "logo-ct.png");
    if (fs.existsSync(logoLocalPath)) {
      const buffer = fs.readFileSync(logoLocalPath);
      await uploadBuffer(buffer, logoKey, "image/png");
    }
  } catch (err) {
    console.error("[Resend Emails] Error uploading logo-ct.png to R2:", err);
  }
  return logoUrl;
}

// Helper to render checklist cell content
function renderChecklistItemCol(key: string, value: string): string {
  let label = key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  if (key === "rayones") label = "Rayones";
  if (key === "golpes") label = "Golpes";
  if (key === "pintura") label = "Pintura";
  if (key === "rines") label = "Rines";
  if (key === "vidrios") label = "Vidrios";
  if (key === "parabrisas") label = "Parabrisas";
  if (key === "farolas") label = "Farolas";
  if (key === "cojineria") label = "Cojinería";
  if (key === "tablero") label = "Tablero";
  if (key === "general_interior") label = "Gral. interior";
  if (key === "testigos") label = "Testigos";
  if (key === "vidrios_electricos") label = "Vidrios eléc.";
  if (key === "luces") label = "Luces";
  if (key === "direccionales") label = "Direccionales";
  if (key === "reversa") label = "Reversa";
  if (key === "estacionarias") label = "Estacionarias";
  if (key === "pito") label = "Pito";
  if (key === "plumillas") label = "Plumillas";
  if (key === "espejos") label = "Espejos";
  if (key === "lineas_termicas") label = "Líneas térmicas";

  const isOk = value === "bueno" || value === "no";
  const isBad = value === "malo" || value === "si";
  const badgeBg = isOk ? "#f0fdf4" : isBad ? "#fef2f2" : "#f4f4f5";
  const badgeText = isOk ? "#166534" : isBad ? "#991b1b" : "#71717a";
  const badgeBorder = isOk ? "#bbf7d0" : isBad ? "#fecaca" : "#e4e4e7";
  const textVal = value === "bueno" ? "Bueno" : value === "malo" ? "Malo" : value === "si" ? "Sí" : value === "no" ? "No" : "N/A";

  return `
    <td width="50%" style="padding: 6px 10px; font-size: 11px; vertical-align: middle;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        <tr>
          <td style="color: #27272a; font-weight: 500; font-size: 11px; padding: 0;">${label}</td>
          <td align="right" style="padding: 0;">
            <span style="display: inline-block; padding: 2px 6px; font-weight: 700; font-size: 9px; border-radius: 4px; background-color: ${badgeBg}; color: ${badgeText}; border: 1px solid ${badgeBorder}; text-transform: uppercase;">
              ${textVal}
            </span>
          </td>
        </tr>
      </table>
    </td>
  `;
}

/**
 * Sends a welcome email to a new operator/admin with their access credentials.
 */
export async function sendWelcomeEmail(
  toEmail: string,
  userName: string,
  roleName: string,
  password: string,
  userId: number
) {
  if (!apiKey || apiKey === "your_resend_api_key_here") {
    console.warn("[Resend] API Key no configurada. Saltando envío de correo de bienvenida.");
    return { success: false, error: "Resend API Key is not configured." };
  }

  const logoUrl = await getOrUploadLogoUrl();
  const subject = "¡Bienvenido a Casa Tuning! - Credenciales de Acceso";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border-collapse: collapse;">
              <!-- Header with Centered Logo -->
              <tr>
                <td style="background-color: #0a0a0c; background: linear-gradient(135deg, #0a0a0c 0%, #1a1a20 100%); padding: 32px; text-align: center; border-bottom: 3px solid #C9A84C;">
                  ${logoUrl ? `<img src="${logoUrl}" alt="Casa Tuning" height="50" style="height: 50px; display: block; margin: 0 auto 12px auto;" />` : `<h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">CASA TUNING</h1>`}
                  <p style="color: #C9A84C; margin: 4px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Administración de Personal</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 32px 32px 24px 32px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0a0a0c; letter-spacing: -0.5px;">Hola, ${userName}</h2>
                  <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #52525b;">Se ha creado exitosamente tu cuenta de usuario en la plataforma de control operativo de **Casa Tuning** con el rol de <strong>${roleName}</strong>. A continuación encontrarás tus credenciales de acceso:</p>
                  
                  <!-- Credentials Box -->
                  <table width="100%" style="background-color: #fafafa; border-radius: 12px; border: 1px solid #f4f4f5; margin-bottom: 24px; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 16px 20px; border-bottom: 1px solid #f4f4f5;">
                        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a1a1aa; display: block; margin-bottom: 4px;">Usuario (Correo)</span>
                        <strong style="font-size: 14px; color: #18181b; font-family: monospace;">${toEmail}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 16px 20px;">
                        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a1a1aa; display: block; margin-bottom: 4px;">Contraseña Asignada</span>
                        <strong style="font-size: 14px; color: #9A7A28; font-family: monospace; letter-spacing: 1px;">${password}</strong>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 0 0 28px 0; font-size: 13px; line-height: 1.5; color: #71717a; font-style: italic;">* Por razones de seguridad, te sugerimos memorizar tu contraseña y no compartirla con terceros.</p>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin-bottom: 16px;">
                    <a href="https://casatuning.com/login" target="_blank" style="background-color: #0a0a0c; color: #ffffff; padding: 14px 32px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; display: inline-block; border: 1px solid #C9A84C;">
                      Iniciar Sesión en el Sistema
                    </a>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #fafafa; padding: 24px 32px; border-top: 1px solid #f4f4f5; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #a1a1aa; line-height: 1.4;">Este es un correo automático enviado por el sistema de control de Casa Tuning.<br>&copy; 2026 Casa Tuning. Todos los derechos reservados.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const { data, error } = await resend.emails.send(
    {
      from: fromEmail,
      to: [toEmail],
      subject,
      html,
    },
    { idempotencyKey: `welcome-email/${userId}` }
  );

  if (error) {
    console.error(`[Resend] Error enviando correo de bienvenida a ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
  return { success: true, id: data?.id };
}

/**
 * Sends a vehicle reception notification to the client with technical checklist data.
 */
export async function sendReceptionEmail(
  toEmail: string,
  order: any
) {
  if (!apiKey || apiKey === "your_resend_api_key_here") {
    console.warn("[Resend] API Key no configurada. Saltando envío de correo de recepción.");
    return { success: false, error: "Resend API Key is not configured." };
  }

  const logoUrl = await getOrUploadLogoUrl();
  const clientName = order.client.name;
  const carPlate = order.car.plate;
  const carName = `${order.car.brand.name} ${order.car.model} (${order.car.year})`;
  const servicesList = order.services.map((s: any) => s.service.name).join(", ");
  
  const subject = `Vehículo Recibido para Servicios - Orden ${order.code}`;

  // 1. Checklist Multicolumna (2 Columnas)
  let checklistHtml = "";
  if (order.checklist && typeof order.checklist === "object") {
    checklistHtml += `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 8px; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="border-bottom: 2px solid #e4e4e7; text-align: left; color: #71717a;">
            <th width="50%" style="padding: 8px 10px; font-weight: 700; text-transform: uppercase; font-size: 9px;">Componente / Estado</th>
            <th width="50%" style="padding: 8px 10px; font-weight: 700; text-transform: uppercase; font-size: 9px; border-left: 1px solid #f4f4f5;">Componente / Estado</th>
          </tr>
        </thead>
        <tbody>
    `;

    const keys = Object.keys(order.checklist).filter((k) => !k.startsWith("_images_"));
    
    for (let i = 0; i < keys.length; i += 2) {
      const key1 = keys[i];
      const key2 = keys[i + 1];

      checklistHtml += `<tr style="border-bottom: 1px solid #f4f4f5;">`;
      
      // Column 1
      checklistHtml += renderChecklistItemCol(key1, order.checklist[key1]);
      
      // Column 2
      if (key2) {
        checklistHtml += renderChecklistItemCol(key2, order.checklist[key2]);
      } else {
        checklistHtml += `<td width="50%" style="padding: 6px 10px;"></td>`;
      }
      
      checklistHtml += `</tr>`;
    }

    checklistHtml += `</tbody></table>`;
  }

  // 2. Classified Checklist Images (Categorized by component)
  let imagesHtml = "";
  if (order.checklist && typeof order.checklist === "object") {
    const checklistObj = order.checklist as Record<string, any>;
    let componentsWithImages = "";

    for (const [key, val] of Object.entries(checklistObj)) {
      if (key.startsWith("_images_") && Array.isArray(val) && val.length > 0) {
        const checkpointKey = key.replace("_images_", "");
        let label = checkpointKey.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
        if (checkpointKey === "rayones") label = "Rayones";
        if (checkpointKey === "golpes") label = "Golpes";
        if (checkpointKey === "pintura") label = "Estado de pintura";
        if (checkpointKey === "rines") label = "Estado de rines";
        if (checkpointKey === "vidrios") label = "Estado de vidrios";
        if (checkpointKey === "parabrisas") label = "Estado de parabrisas";
        if (checkpointKey === "farolas") label = "Estado de farolas";
        if (checkpointKey === "cojineria") label = "Estado de cojinería";
        if (checkpointKey === "tablero") label = "Estado del tablero";

        componentsWithImages += `
          <div style="margin-bottom: 16px; background-color: #fafafa; border: 1px solid #f4f4f5; border-radius: 8px; padding: 12px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #71717a; display: block; margin-bottom: 8px;">Fallo en: ${label}</span>
            <div style="margin: 0; padding: 0;">
        `;
        
        val.forEach((imgUrl: string) => {
          componentsWithImages += `
            <img src="${imgUrl}" alt="${label} evidence" style="width: 55px; height: 55px; object-fit: cover; border-radius: 6px; border: 1px solid #e4e4e7; margin-right: 8px; margin-bottom: 4px; display: inline-block;" />
          `;
        });

        componentsWithImages += `
            </div>
          </div>
        `;
      }
    }

    if (componentsWithImages) {
      imagesHtml = `
        <div style="border-top: 1px solid #f4f4f5; padding-top: 20px; margin-top: 20px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0a0a0c; display: block; margin-bottom: 12px; border-bottom: 1px solid #e4e4e7; padding-bottom: 8px;">Registros Fotográficos de Evidencia</span>
          ${componentsWithImages}
        </div>
      `;
    }
  }

  // Generate HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border-collapse: collapse;">
              <!-- Header with Centered Logo -->
              <tr>
                <td style="background-color: #0a0a0c; background: linear-gradient(135deg, #0a0a0c 0%, #1a1a20 100%); padding: 32px; text-align: center; border-bottom: 3px solid #C9A84C;">
                  ${logoUrl ? `<img src="${logoUrl}" alt="Casa Tuning" height="50" style="height: 50px; display: block; margin: 0 auto 12px auto;" />` : `<h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">CASA TUNING</h1>`}
                  <p style="color: #C9A84C; margin: 4px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Ficha Técnica de Recepción</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 32px 32px 24px 32px;">
                  <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #0a0a0c;">Hola, ${clientName}</h2>
                  <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #52525b;">Hemos recibido tu vehículo en nuestras instalaciones. A continuación te presentamos el resumen del estado de ingreso y los servicios contratados:</p>
                  
                  <!-- Info Grid -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; border-collapse: collapse;">
                    <tr>
                      <td width="50%" style="padding: 12px; background-color: #fafafa; border: 1px solid #f4f4f5; border-radius: 8px 0 0 8px;">
                        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #a1a1aa; display: block; margin-bottom: 4px;">Vehículo</span>
                        <strong style="font-size: 13px; color: #18181b;">${carName}</strong>
                        <span style="display: inline-block; margin-top: 4px; padding: 1px 6px; font-family: monospace; font-size: 11px; background-color: #e4e4e7; border-radius: 4px; color: #27272a; font-weight: 700;">PLACA: ${carPlate}</span>
                      </td>
                      <td width="50%" style="padding: 12px; background-color: #fafafa; border: 1px solid #f4f4f5; border-radius: 0 8px 8px 0; border-left: 0;">
                        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #a1a1aa; display: block; margin-bottom: 4px;">Código de Orden</span>
                        <strong style="font-size: 13px; color: #9A7A28; font-family: monospace;">${order.code}</strong>
                        <span style="display: block; font-size: 11px; color: #71717a; margin-top: 4px;">Ingreso: ${formatDate(order.createdAt)}</span>
                      </td>
                    </tr>
                  </table>

                  <!-- Services Box -->
                  <div style="background-color: #fcfbf7; border: 1px solid #f4efe2; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                    <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #9A7A28; display: block; margin-bottom: 4px;">Servicios Solicitados</span>
                    <strong style="font-size: 14px; color: #0a0a0c;">${servicesList}</strong>
                  </div>

                  <!-- Service Description (if any) -->
                  ${order.serviceDescription ? `
                    <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                      <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #71717a; display: block; margin-bottom: 4px;">Detalles/Especificaciones de Servicios</span>
                      <div style="font-size: 13px; color: #27272a; line-height: 1.5; white-space: pre-wrap;">${order.serviceDescription}</div>
                    </div>
                  ` : ""}

                  <!-- Checklist Box -->
                  <div style="border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0a0a0c; display: block; margin-bottom: 8px; border-bottom: 1px solid #e4e4e7; padding-bottom: 8px;">Estado del Checklist</span>
                    ${checklistHtml}
                  </div>

                  <!-- Images Grid categorized by component -->
                  ${imagesHtml}

                  <!-- Observations (if any) -->
                  ${order.observations ? `
                    <div style="margin-bottom: 24px; border-top: 1px solid #f4f4f5; padding-top: 20px;">
                      <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #a1a1aa; display: block; margin-bottom: 6px;">Observaciones Registradas</span>
                      <div style="background-color: #f4f4f5; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #3f3f46; line-height: 1.5; white-space: pre-wrap;">${order.observations}</div>
                    </div>
                  ` : ""}

                  <!-- Signature Section -->
                  ${order.signatureUrl ? `
                    <div style="border-top: 1px solid #f4f4f5; padding-top: 20px; margin-top: 20px; margin-bottom: 16px;">
                      <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #a1a1aa; display: block; margin-bottom: 8px;">Firma de conformidad del cliente</span>
                      <div style="background-color: #f9f9f9; border: 1px dashed #e4e4e7; border-radius: 8px; padding: 12px; display: inline-block;">
                        <img src="${order.signatureUrl}" alt="Firma del Cliente" style="max-height: 60px; max-width: 200px; display: block;" />
                      </div>
                    </div>
                  ` : ""}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #fafafa; padding: 24px 32px; border-top: 1px solid #f4f4f5; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #a1a1aa; line-height: 1.4;">Este es un comprobante de ingreso digital emitido por el sistema Casa Tuning.<br>&copy; 2026 Casa Tuning. Todos los derechos reservados.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const { data, error } = await resend.emails.send(
    {
      from: fromEmail,
      to: [toEmail],
      subject,
      html,
    },
    { idempotencyKey: `reception-email-${order.id}` }
  );

  if (error) {
    console.error(`[Resend] Error enviando correo de recepción a ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
  return { success: true, id: data?.id };
}

/**
 * Sends a service completion and delivery email to the client, attaching the invoice PDF and generating/attaching the Technical Sheet PDF.
 */
export async function sendDeliveryEmail(
  toEmail: string,
  order: any
) {
  if (!apiKey || apiKey === "your_resend_api_key_here") {
    console.warn("[Resend] API Key no configurada. Saltando envío de correo de entrega.");
    return { success: false, error: "Resend API Key is not configured." };
  }

  const logoUrl = await getOrUploadLogoUrl();
  const clientName = order.client.name;
  const carName = `${order.car.brand.name} ${order.car.model}`;
  const carPlate = order.car.plate;

  const subject = `Tu vehículo está listo para entrega - Orden ${order.code}`;

  // 1. Generate Technical Sheet PDF on the fly and upload to Cloudflare R2
  let techSheetUrl = "";
  try {
    const pdfBuffer = await generateOrderPdf(order.id);
    techSheetUrl = await uploadBuffer(
      pdfBuffer,
      `technical-sheets/sheet-${order.code}.pdf`,
      "application/pdf",
      "public, max-age=60"
    );
    console.log(`[Resend Emails] Ficha técnica generada y subida a R2: ${techSheetUrl}`);
  } catch (pdfErr) {
    console.error("[Resend Emails] Error generando ficha técnica en PDF para el correo de entrega:", pdfErr);
  }

  // 2. Prepare attachments array
  const attachments = [];
  
  if (techSheetUrl) {
    attachments.push({
      filename: `Ficha_Tecnica_${order.code}.pdf`,
      path: techSheetUrl,
    });
  }

  if (order.deliveryPdfUrl) {
    attachments.push({
      filename: `Factura_Elec_${order.code}.pdf`,
      path: order.deliveryPdfUrl,
    });
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border-collapse: collapse;">
              <!-- Header with Centered Logo -->
              <tr>
                <td style="background-color: #0a0a0c; background: linear-gradient(135deg, #0a0a0c 0%, #1a1a20 100%); padding: 32px; text-align: center; border-bottom: 3px solid #C9A84C;">
                  ${logoUrl ? `<img src="${logoUrl}" alt="Casa Tuning" height="50" style="height: 50px; display: block; margin: 0 auto 12px auto;" />` : `<h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">CASA TUNING</h1>`}
                  <p style="color: #C9A84C; margin: 4px 0 0 0; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Servicio Completado</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 32px 32px 24px 32px;">
                  <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #166534; letter-spacing: -0.5px;">¡Tu vehículo está listo!</h2>
                  <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #52525b;">Hola, <strong>${clientName}</strong>. Nos complace informarte que los servicios solicitados para tu vehículo <strong>${carName}</strong> (Placa: <strong style="font-family: monospace;">${carPlate}</strong>) bajo la orden <strong>${order.code}</strong> han sido finalizados con éxito.</p>
                  
                  <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #52525b;">Ya puedes pasar por él a nuestras instalaciones. Adjunto a este correo encontrarás el documento formal de entrega de la ficha técnica final (incluyendo todas las notas de servicio) y la factura correspondiente en formato PDF:</p>

                  <!-- Service Description (if any) -->
                  ${order.serviceDescription ? `
                    <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                      <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #71717a; display: block; margin-bottom: 4px;">Detalles/Especificaciones de Servicios</span>
                      <div style="font-size: 13px; color: #27272a; line-height: 1.5; white-space: pre-wrap;">${order.serviceDescription}</div>
                    </div>
                  ` : ""}

                  <!-- Attachments Box -->
                  ${attachments.length > 0 ? `
                    <div style="background-color: #fafafa; border-radius: 12px; border: 1px solid #f4f4f5; padding: 16px 20px; margin-bottom: 24px;">
                      <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #a1a1aa; display: block; margin-bottom: 8px;">Documentos Adjuntos</span>
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                        ${attachments.map((att) => `
                          <tr style="border-bottom: 1px solid #f4f4f5; last:border-bottom: 0;">
                            <td style="padding: 8px 0; font-size: 12px; color: #18181b;">
                              <strong>📄 ${att.filename}</strong>
                            </td>
                            <td align="right" style="padding: 8px 0;">
                              <a href="${att.path}" target="_blank" style="font-size: 11px; font-weight: 700; color: #9A7A28; text-decoration: none; border-bottom: 1.5px solid #C9A84C;">Ver / Descargar</a>
                            </td>
                          </tr>
                        `).join("")}
                      </table>
                    </div>
                  ` : ""}

                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #52525b;">¡Agradecemos tu confianza en el trabajo de **Casa Tuning**!</p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #fafafa; padding: 24px 32px; border-top: 1px solid #f4f4f5; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #a1a1aa; line-height: 1.4;">Este es un correo automático de finalización de servicio emitido por Casa Tuning.<br>&copy; 2026 Casa Tuning. Todos los derechos reservados.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const { data, error } = await resend.emails.send(
    {
      from: fromEmail,
      to: [toEmail],
      subject,
      html,
      attachments,
    },
    { idempotencyKey: `delivery-email-${order.id}` }
  );

  if (error) {
    console.error(`[Resend] Error enviando correo de entrega a ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
  return { success: true, id: data?.id };
}

/**
 * Sends a notification email stating the vehicle is ready for pickup, without documents.
 */
export async function sendReadyEmail(
  toEmail: string,
  order: any
) {
  if (!apiKey || apiKey === "your_resend_api_key_here") {
    console.warn("[Resend] API Key no configurada. Saltando envío de correo de vehículo listo.");
    return { success: false, error: "Resend API Key is not configured." };
  }

  const logoUrl = await getOrUploadLogoUrl();
  const clientName = order.client.name;
  const carName = `${order.car.brand.name} ${order.car.model}`;
  const carPlate = order.car.plate;

  const subject = `Tu vehículo está listo para retiro - Orden ${order.code}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border-collapse: collapse;">
              <!-- Header with Centered Logo -->
              <tr>
                <td style="background-color: #0a0a0c; background: linear-gradient(135deg, #0a0a0c 0%, #1a1a20 100%); padding: 32px; text-align: center; border-bottom: 3px solid #C9A84C;">
                  ${logoUrl ? `<img src="${logoUrl}" alt="Casa Tuning" height="50" style="height: 50px; display: block; margin: 0 auto 12px auto;" />` : `<h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">CASA TUNING</h1>`}
                  <p style="color: #C9A84C; margin: 4px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Vehículo Terminado</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 32px 32px 24px 32px;">
                  <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0a0a0c; letter-spacing: -0.5px;">¡Trabajos Finalizados!</h2>
                  <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #52525b;">Hola, <strong>${clientName}</strong>.</p>
                  <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #52525b;">Te informamos que los servicios para tu vehículo <strong>${carName}</strong> (Placa: <strong style="font-family: monospace;">${carPlate}</strong>) bajo la orden <strong>${order.code}</strong> han finalizado con éxito.</p>
                  <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #52525b;">Ya puedes pasar a recogerlo a nuestras instalaciones. Al momento de la entrega física, firmarás la conformidad del servicio y te enviaremos de forma automática la ficha técnica definitiva y la factura electrónica.</p>
                  
                  ${order.serviceDescription ? `
                    <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                      <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #71717a; display: block; margin-bottom: 4px;">Detalles/Especificaciones de Servicios</span>
                      <div style="font-size: 13px; color: #27272a; line-height: 1.5; white-space: pre-wrap;">${order.serviceDescription}</div>
                    </div>
                  ` : ""}

                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #52525b;">¡Te esperamos en **Casa Tuning**!</p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #fafafa; padding: 24px 32px; border-top: 1px solid #f4f4f5; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #a1a1aa; line-height: 1.4;">Este es un correo automático de aviso de vehículo listo emitido por Casa Tuning.<br>&copy; 2026 Casa Tuning. Todos los derechos reservados.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const { data, error } = await resend.emails.send(
    {
      from: fromEmail,
      to: [toEmail],
      subject,
      html,
    },
    { idempotencyKey: `ready-email-${order.id}` }
  );

  if (error) {
    console.error(`[Resend] Error enviando correo de vehículo listo a ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
  return { success: true, id: data?.id };
}
