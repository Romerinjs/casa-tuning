import PDFDocument from "pdfkit";
import prisma from "./prisma";
import fs from "fs";
import path from "path";

// Helper to fetch images from R2 and return a Buffer
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) {
    console.error(`[PDF Generator] Error fetching remote image: ${url}`, e);
    return null;
  }
}

// Helper to format date
function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Generates a PDF buffer of the Technical Sheet (Ficha Técnica) for a given order.
 * 
 * @param orderId ID of the order
 * @returns Buffer containing the compiled PDF
 */
export async function generateOrderPdf(orderId: number): Promise<Buffer> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      client: {
        include: {
          documentType: true,
        },
      },
      car: {
        include: {
          brand: true,
        },
      },
      services: {
        include: {
          service: true,
        },
      },
      comments: {
        include: {
          user: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    throw new Error(`La orden con ID ${orderId} no existe.`);
  }

  return new Promise<Buffer>(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: "LETTER",
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Brand Colors
      const goldColor = "#C9A84C";
      const darkColor = "#0A0A0C";
      const textColor = "#18181B";
      const greyColor = "#71717A";
      const lightGreyColor = "#F4F4F5";

      // -----------------------------------------------------------------
      // HEADER SECTION
      // -----------------------------------------------------------------
      
      // Draw a dark background at the top header
      doc.rect(40, 40, 532, 65).fill(darkColor);

      // Logo image (Public / Local)
      const logoPath = path.join(process.cwd(), "public", "logo-ct.png");
      let logoDrawn = false;
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, 48, { height: 48 });
          logoDrawn = true;
        } catch (e) {
          console.error("Error drawing logo in PDF:", e);
        }
      }

      // Title & Header Text
      doc.fillColor("#FFFFFF");
      doc.font("Helvetica-Bold").fontSize(16);
      doc.text("CASA TUNING", logoDrawn ? 120 : 60, 50, { align: "left" });
      
      doc.fillColor(goldColor);
      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("FICHA TÉCNICA DE RECEPCIÓN Y CONTROL", logoDrawn ? 120 : 60, 72, { align: "left" });

      doc.fillColor("#FFFFFF");
      doc.font("Courier-Bold").fontSize(10);
      doc.text(`ORDEN: ${order.code}`, 430, 52, { align: "right" });
      
      doc.font("Helvetica").fontSize(8);
      doc.text(`Ingreso: ${formatDate(order.createdAt)}`, 430, 72, { align: "right" });

      // Gold separating bar
      doc.rect(40, 105, 532, 3).fill(goldColor);

      // Move y position
      let y = 125;

      // -----------------------------------------------------------------
      // CLIENT & VEHICLE GRID SECTION
      // -----------------------------------------------------------------
      doc.fillColor(darkColor).font("Helvetica-Bold").fontSize(10);
      doc.text("INFORMACIÓN OPERATIVA", 40, y);
      
      y += 15;
      doc.strokeColor(lightGreyColor).lineWidth(1).moveTo(40, y).lineTo(572, y).stroke();
      
      y += 10;
      
      // Box Backgrounds
      doc.rect(40, y, 260, 85).fill("#FAFAFA");
      doc.rect(312, y, 260, 85).fill("#FAFAFA");
      
      // Client Info (Left)
      doc.fillColor(textColor);
      doc.font("Helvetica-Bold").fontSize(8).fillColor(greyColor).text("CLIENTE", 50, y + 10);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(textColor).text(order.client.name, 50, y + 22);
      
      doc.font("Helvetica").fontSize(8).fillColor(greyColor).text(`Celular: ${order.client.phone}`, 50, y + 36);
      if (order.client.email) {
        doc.font("Helvetica").fontSize(8).fillColor(greyColor).text(`Correo: ${order.client.email}`, 50, y + 48);
      }

      // Vehicle Info (Right)
      doc.font("Helvetica-Bold").fontSize(8).fillColor(greyColor).text("VEHÍCULO", 322, y + 10);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(textColor).text(`${order.car.brand.name} ${order.car.model} (${order.car.year})`, 322, y + 22);
      doc.font("Helvetica").fontSize(8).fillColor(greyColor).text(`Color: ${order.car.color} | Tipo: ${order.car.type || "Automóvil"}`, 322, y + 36);
      doc.font("Helvetica").fontSize(8).fillColor(greyColor).text(`Kilometraje: ${order.mileage ? `${order.mileage} KM` : "No registrado"}`, 322, y + 48);
      
      // Plaque Badge
      doc.rect(322, y + 60, 70, 16).fill("#E4E4E7");
      doc.fillColor(textColor).font("Helvetica-Bold").fontSize(8).text(order.car.plate, 325, y + 64, { width: 64, align: "center" });

      y += 105;

      // -----------------------------------------------------------------
      // SERVICES CONTRACTED
      // -----------------------------------------------------------------
      doc.fillColor(darkColor).font("Helvetica-Bold").fontSize(10);
      doc.text("SERVICIOS CONTRATADOS", 40, y);
      
      y += 15;
      doc.strokeColor(lightGreyColor).lineWidth(1).moveTo(40, y).lineTo(572, y).stroke();
      
      y += 10;
      
      const servicesText = order.services.map((s) => s.service.name).join("  |  ");
      doc.rect(40, y, 532, 28).fill("#FCFBF7");
      doc.fillColor("#9A7A28").font("Helvetica-Bold").fontSize(9).text(servicesText, 50, y + 10, { width: 512 });

      y += 48;

      // -----------------------------------------------------------------
      // CHECKLIST INSPECTION (2 COLUMNS)
      // -----------------------------------------------------------------
      doc.fillColor(darkColor).font("Helvetica-Bold").fontSize(10);
      doc.text("CHECKLIST DE INSPECCIÓN FÍSICA", 40, y);
      
      y += 15;
      doc.strokeColor(lightGreyColor).lineWidth(1).moveTo(40, y).lineTo(572, y).stroke();
      
      y += 10;

      if (order.checklist && typeof order.checklist === "object") {
        const checklistObj = order.checklist as Record<string, string>;
        const keys = Object.keys(checklistObj).filter((k) => !k.startsWith("_images_"));
        
        // Split checklist items into 2 lists for two columns
        const mid = Math.ceil(keys.length / 2);
        const col1 = keys.slice(0, mid);
        const col2 = keys.slice(mid);

        // Helper to format keys
        const formatLabel = (key: string) => {
          let label = key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
          if (key === "rayones") return "Rayones";
          if (key === "golpes") return "Golpes";
          if (key === "pintura") return "Estado de pintura";
          if (key === "rines") return "Estado de rines";
          if (key === "vidrios") return "Estado de vidrios";
          if (key === "parabrisas") return "Estado de parabrisas";
          if (key === "farolas") return "Estado de farolas";
          if (key === "cojineria") return "Estado de cojinería";
          if (key === "tablero") return "Estado del tablero";
          if (key === "general_interior") return "Estado general interior";
          if (key === "testigos") return "Testigos encendidos";
          if (key === "vidrios_electricos") return "Vidrios eléctricos";
          if (key === "luces") return "Luces";
          if (key === "direccionales") return "Direccionales";
          if (key === "reversa") return "Reversa";
          if (key === "estacionarias") return "Estacionarias";
          if (key === "pito") return "Pito";
          if (key === "plumillas") return "Plumillas";
          if (key === "espejos") return "Espejos";
          if (key === "lineas_termicas") return "Líneas térmicas";
          return label;
        };

        const drawChecklistCol = (items: string[], startX: number, startY: number) => {
          let colY = startY;
          items.forEach((key, index) => {
            const val = checklistObj[key];
            const displayLabel = formatLabel(key);
            
            // Zebra striping
            if (index % 2 === 0) {
              doc.rect(startX, colY - 2, 250, 16).fill("#FBFBFC");
            }

            doc.fillColor(textColor).font("Helvetica").fontSize(8).text(displayLabel, startX + 5, colY + 2);
            
            // Value Badge
            const isOk = val === "bueno" || val === "no";
            const isBad = val === "malo" || val === "si";
            const badgeColor = isOk ? "#166534" : isBad ? "#991b1b" : "#71717A";
            
            doc.fillColor(badgeColor).font("Helvetica-Bold").fontSize(8).text(
              val === "bueno" ? "Bueno" : val === "malo" ? "Malo" : val === "si" ? "Sí" : val === "no" ? "No" : "N/A",
              startX + 190,
              colY + 2,
              { align: "right", width: 50 }
            );

            colY += 16;
          });
          return colY;
        };

        const y1 = drawChecklistCol(col1, 40, y);
        const y2 = drawChecklistCol(col2, 312, y);
        y = Math.max(y1, y2) + 15;
      }

      // -----------------------------------------------------------------
      // OBSERVATIONS
      // -----------------------------------------------------------------
      if (order.observations) {
        // Prevent layout overflow, check height
        if (y > 600) {
          doc.addPage();
          y = 50;
        }

        doc.fillColor(darkColor).font("Helvetica-Bold").fontSize(10).text("OBSERVACIONES REGISTRADAS", 40, y);
        y += 15;
        doc.strokeColor(lightGreyColor).lineWidth(1).moveTo(40, y).lineTo(572, y).stroke();
        y += 10;
        
        doc.fillColor(textColor).font("Helvetica").fontSize(8.5).text(order.observations, 50, y, { width: 472, lineGap: 3 });
        
        // Calculate dynamic height of observations
        const textHeight = doc.heightOfString(order.observations, { width: 472, lineGap: 3 });
        y += textHeight + 25;
      }

      // -----------------------------------------------------------------
      // EVIDENCE IMAGES SECTION (CLASSIFIED BY COMPONENT)
      // -----------------------------------------------------------------
      let hasEvidenceImages = false;
      if (order.checklist && typeof order.checklist === "object") {
        const checklistObj = order.checklist as Record<string, any>;
        for (const [key, val] of Object.entries(checklistObj)) {
          if (key.startsWith("_images_") && Array.isArray(val) && val.length > 0) {
            hasEvidenceImages = true;
            break;
          }
        }
      }

      if (hasEvidenceImages) {
        if (y > 550) {
          doc.addPage();
          y = 50;
        }

        doc.fillColor(darkColor).font("Helvetica-Bold").fontSize(10).text("REGISTROS FOTOGRÁFICOS DE EVIDENCIA", 40, y);
        y += 15;
        doc.strokeColor(lightGreyColor).lineWidth(1).moveTo(40, y).lineTo(572, y).stroke();
        y += 15;

        const checklistObj = order.checklist as Record<string, any>;
        
        for (const [key, val] of Object.entries(checklistObj)) {
          if (key.startsWith("_images_") && Array.isArray(val) && val.length > 0) {
            const checkpointKey = key.replace("_images_", "");
            let checkpointName = checkpointKey.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
            if (checkpointKey === "rayones") checkpointName = "Rayones";
            if (checkpointKey === "golpes") checkpointName = "Golpes";
            if (checkpointKey === "pintura") checkpointName = "Estado de pintura";
            if (checkpointKey === "rines") checkpointName = "Estado de rines";
            if (checkpointKey === "vidrios") checkpointName = "Estado de vidrios";
            if (checkpointKey === "parabrisas") checkpointName = "Estado de parabrisas";
            if (checkpointKey === "farolas") checkpointName = "Estado de farolas";
            if (checkpointKey === "cojineria") checkpointName = "Estado de cojinería";
            if (checkpointKey === "tablero") checkpointName = "Estado del tablero";
            
            // Check space before drawing
            if (y > 600) {
              doc.addPage();
              y = 50;
            }

            doc.fillColor(textColor).font("Helvetica-Bold").fontSize(8.5).text(`Fallo en: ${checkpointName}`, 45, y);
            y += 12;

            // Horizontal layout for images of this component
            let xPos = 45;
            for (const imgUrl of val) {
              if (xPos > 500) {
                xPos = 45;
                y += 65;
                if (y > 650) {
                  doc.addPage();
                  y = 50;
                }
              }

              const buffer = await fetchImageBuffer(imgUrl);
              if (buffer) {
                try {
                  doc.image(buffer, xPos, y, { width: 55, height: 55 });
                  doc.rect(xPos, y, 55, 55).strokeColor("#e4e4e7").lineWidth(0.5).stroke();
                } catch (imgErr) {
                  console.error("Error inserting evidence image in PDF:", imgErr);
                }
              }
              xPos += 65;
            }
            y += 75;
          }
        }
      }

      // -----------------------------------------------------------------
      // PROGRESS NOTES / COMMENTS SECTION
      // -----------------------------------------------------------------
      if (order.comments && order.comments.length > 0) {
        if (y > 550) {
          doc.addPage();
          y = 50;
        }

        doc.fillColor(darkColor).font("Helvetica-Bold").fontSize(10).text("NOTAS DE PROGRESO Y COMENTARIOS", 40, y);
        y += 15;
        doc.strokeColor(lightGreyColor).lineWidth(1).moveTo(40, y).lineTo(572, y).stroke();
        y += 10;

        order.comments.forEach((comment) => {
          if (y > 650) {
            doc.addPage();
            y = 50;
          }

          doc.rect(40, y, 532, doc.heightOfString(comment.content, { width: 500 }) + 26).fill("#FCFCFC");
          doc.rect(40, y, 532, doc.heightOfString(comment.content, { width: 500 }) + 26).strokeColor("#F4F4F5").lineWidth(0.5).stroke();

          // Comment Header
          const roleName = comment.user?.role?.name || "Operador";
          doc.fillColor(textColor).font("Helvetica-Bold").fontSize(8).text(`${comment.user.name}`, 50, y + 6);
          doc.fillColor(goldColor).font("Helvetica-Bold").fontSize(7).text(roleName.toUpperCase(), 50, y + 16);
          doc.fillColor(greyColor).font("Helvetica").fontSize(7.5).text(formatDate(comment.createdAt), 450, y + 6, { align: "right", width: 110 });

          // Content
          doc.fillColor(textColor).font("Helvetica").fontSize(8.5).text(comment.content, 50, y + 26, { width: 512, lineGap: 2 });
          
          y += doc.heightOfString(comment.content, { width: 512 }) + 36;
        });
      }

      // -----------------------------------------------------------------
      // CLIENT SIGNATURE SECTION
      // -----------------------------------------------------------------
      if (order.signatureUrl) {
        if (y > 580) {
          doc.addPage();
          y = 50;
        }

        y += 10;
        doc.fillColor(darkColor).font("Helvetica-Bold").fontSize(10).text("FIRMAS DE CONFORMIDAD", 40, y);
        y += 15;
        doc.strokeColor(lightGreyColor).lineWidth(1).moveTo(40, y).lineTo(572, y).stroke();
        y += 15;

        // Draw Signature Box
        doc.rect(40, y, 200, 65).fill("#FAFAFA");
        doc.rect(40, y, 200, 65).strokeColor("#E4E4E7").lineWidth(0.5).stroke();

        const sigBuffer = await fetchImageBuffer(order.signatureUrl);
        if (sigBuffer) {
          try {
            doc.image(sigBuffer, 50, y + 5, { width: 180, height: 55 });
          } catch (e) {
            console.error("Error drawing signature image in PDF:", e);
          }
        }
        
        doc.fillColor(greyColor).font("Helvetica").fontSize(8).text("Firma de Conformidad del Cliente", 40, y + 75);
      }

      // Finalize document writing
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
