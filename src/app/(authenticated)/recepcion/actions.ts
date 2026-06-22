"use server";

import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { uploadBase64 } from "@/lib/storage";
import { sendReceptionEmail } from "@/lib/emails";
import { hashDocument, encryptDocument } from "@/lib/security";
import { sendWhatsAppReceptionAction } from "@/lib/whatsapp";
import { after } from "next/server";

export async function createOrderAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    const user = await verifySession();

    // 1. Extract and validate client data
    const clientName = formData.get("clientName") as string;
    const clientPhone = formData.get("clientPhone") as string;
    const clientEmail = (formData.get("clientEmail") as string) || null;
    const clientDocumentTypeIdStr = formData.get("clientDocumentTypeId") as string;
    const clientDocumentNumber = (formData.get("clientDocumentNumber") as string) || null;
    const clientPhone2 = (formData.get("clientPhone2") as string) || null;

    if (!clientName || !clientPhone) {
      return { success: false, error: "El nombre y celular del cliente son requeridos." };
    }

    // 2. Extract and validate vehicle data
    const plate = formData.get("plate") as string;
    const yearStr = formData.get("year") as string;
    const brandIdStr = formData.get("brandId") as string;
    const model = formData.get("model") as string;
    const color = formData.get("color") as string;
    const mileage = formData.get("mileage") as string;
    const vehicleType = (formData.get("vehicleType") as string) || "Automóvil";

    if (!plate || !yearStr || !brandIdStr || !model || !color) {
      return { success: false, error: "Todos los campos obligatorios del vehículo son requeridos." };
    }

    const year = parseInt(yearStr, 10);
    const brandId = parseInt(brandIdStr, 10);

    if (isNaN(year) || isNaN(brandId)) {
      return { success: false, error: "El año o la marca del vehículo no son válidos." };
    }

    // 3. Extract checklist and observations
    const observations = (formData.get("observations") as string) || null;
    const checklistStr = (formData.get("checklist") as string) || null;
    let checklist = null;
    if (checklistStr) {
      try {
        checklist = JSON.parse(checklistStr);
      } catch (e) {
        console.error("Error parsing checklist JSON:", e);
      }
    }

    // 4. Extract service IDs
    const selectedServiceIds = formData.getAll("services").map((id) => parseInt(id as string, 10));

    if (selectedServiceIds.length === 0) {
      return { success: false, error: "Debe seleccionar al menos un servicio contratado." };
    }

    // 5. Extract digital signature
    const signature = formData.get("signature") as string || null;
    if (signature) {
      console.log(`[createOrderAction] Firma digital recibida en el servidor. Tamaño base64: ${signature.length} caracteres.`);
    }

    // Clean and validate phone (must be exactly 10 digits)
    const cleanPhone = clientPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return { success: false, error: "El celular del cliente debe contener exactamente 10 números." };
    }

    // Validate email format if provided
    const cleanEmail = clientEmail ? clientEmail.trim() : null;
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: "El correo electrónico del cliente no tiene un formato válido." };
    }

    // Check unique email collision
    if (cleanEmail) {
      const existingEmail = await prisma.client.findFirst({
        where: {
          email: cleanEmail,
          phone: { not: cleanPhone },
        },
      });
      if (existingEmail) {
        return {
          success: false,
          error: "El correo electrónico ya está registrado con otro número de celular.",
        };
      }
    }

    // Clean and validate plate (no spaces, alphanumeric, uppercase, max 6, min 5)
    const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (cleanPlate.length < 5 || cleanPlate.length > 6) {
      return { success: false, error: "La placa del vehículo debe contener entre 5 y 6 caracteres alfanuméricos." };
    }

    // Clean mileage (digits only)
    const cleanMileage = mileage ? mileage.replace(/\D/g, "") : null;

    const clientDocumentTypeId = (clientDocumentTypeIdStr && !isNaN(parseInt(clientDocumentTypeIdStr, 10))) ? parseInt(clientDocumentTypeIdStr, 10) : null;
    let finalDocNumber: string | null | undefined = undefined;
    let finalDocHash: string | null | undefined = undefined;

    if (clientDocumentNumber && clientDocumentNumber !== "********" && clientDocumentNumber.trim() !== "") {
      const cleanDocNumber = clientDocumentNumber.trim();
      const hash = hashDocument(cleanDocNumber);
      const existingDoc = await prisma.client.findFirst({
        where: {
          documentNumberHash: hash,
          phone: { not: cleanPhone },
        },
      });
      if (existingDoc) {
        return {
          success: false,
          error: `El número de documento ya está registrado con otro número de celular.`,
        };
      }
      finalDocNumber = encryptDocument(cleanDocNumber);
      finalDocHash = hash;
    } else if (clientDocumentNumber === "********") {
      finalDocNumber = undefined; // Skip updating this column
      finalDocHash = undefined;
    } else {
      finalDocNumber = null;
      finalDocHash = null;
    }

    // Use Prisma Transaction to ensure data consistency
    const newOrder = await prisma.$transaction(async (tx) => {
      // Find or create client by phone
      let dbClient = await tx.client.findUnique({
        where: { phone: cleanPhone },
      });

      if (dbClient) {
        // Optionally update email/name/document fields/phone2 if changed
        const updateData: any = {
          name: clientName.trim(),
          documentTypeId: clientDocumentTypeId ? clientDocumentTypeId : dbClient.documentTypeId,
          phone2: clientPhone2 ? clientPhone2.replace(/\D/g, "") : dbClient.phone2,
          email: cleanEmail ? cleanEmail : dbClient.email,
        };
        if (finalDocNumber !== undefined) {
          updateData.documentNumber = finalDocNumber;
          updateData.documentNumberHash = finalDocHash;
        }
        
        dbClient = await tx.client.update({
          where: { id: dbClient.id },
          data: updateData,
        });
      } else {
        dbClient = await tx.client.create({
          data: {
            name: clientName.trim(),
            phone: cleanPhone,
            phone2: clientPhone2 ? clientPhone2.replace(/\D/g, "") : null,
            documentNumber: finalDocNumber === undefined ? null : finalDocNumber,
            documentNumberHash: finalDocHash === undefined ? null : finalDocHash,
            documentTypeId: clientDocumentTypeId,
            email: cleanEmail ? cleanEmail : null,
          },
        });
      }

      // Find active car by plate
      let dbCar = await tx.car.findFirst({
        where: { plate: cleanPlate, isActive: true },
      });

      if (dbCar) {
        // Validation: If active car belongs to another client, block the check-in.
        if (dbCar.clientId !== dbClient.id) {
          throw new Error(`El vehículo con la placa ${cleanPlate} ya está registrado y activo con otro cliente.`);
        }
        // Update car details if linked to different parameters, keep linked to client
        dbCar = await tx.car.update({
          where: { id: dbCar.id },
          data: {
            type: vehicleType,
            model: model.trim(),
            year: year,
            color: color.trim(),
            brandId: brandId,
          },
        });
      } else {
        dbCar = await tx.car.create({
          data: {
            plate: cleanPlate,
            type: vehicleType,
            model: model.trim(),
            year: year,
            color: color.trim(),
            clientId: dbClient.id,
            brandId: brandId,
            isActive: true,
          },
        });
      }

      // Find status ID for "RECIBIDO"
      const status = await tx.orderStatus.findUnique({
        where: { name: "RECIBIDO" },
      });

      if (!status) {
        throw new Error("El estado inicial 'RECIBIDO' no está configurado en la base de datos.");
      }

      // Generate sequential order code
      const orderCount = await tx.order.count();
      const nextSequence = String(orderCount + 1).padStart(4, "0");
      const orderCode = `CT-2026-${nextSequence}`;

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          code: orderCode,
          mileage: cleanMileage,
          signatureUrl: null, // Will be updated after upload outside transaction
          observations: observations ? observations.trim() : null,
          checklist: checklist ? checklist : undefined,
          statusId: status.id,
          clientId: dbClient.id,
          carId: dbCar.id,
          creatorId: user.id,
        },
      });


      // Link selected services to the order
      const orderServicesData = selectedServiceIds.map((serviceId) => ({
        orderId: newOrder.id,
        serviceId: serviceId,
      }));

      await tx.orderService.createMany({
        data: orderServicesData,
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          description: `Vehículo recibido para servicios`,
          orderId: newOrder.id,
          userId: user.id,
        },
      });

      return newOrder;
    });

    if (newOrder) {
      // Execute all file uploads, database updates, and email/WhatsApp notifications asynchronously in the background
      after(async () => {
        try {
          let signatureUrl: string | null = null;
          let finalChecklist = checklist;

          // 1. Process client signature if provided
          if (signature) {
            try {
              const match = newOrder.code.match(/(\d+)$/);
              const sequence = match ? match[1] : String(newOrder.id);
              signatureUrl = await uploadBase64(signature, `signatures/sig-${sequence}`);
            } catch (uploadError) {
              console.error("Error uploading signature to storage in background:", uploadError);
            }
          }

          // 2. Process checklist images if provided
          if (checklist) {
            try {
              const checklistObj = { ...checklist } as Record<string, any>;
              let hasUpdates = false;

              for (const [key, val] of Object.entries(checklistObj)) {
                if (key.startsWith("_images_") && Array.isArray(val)) {
                  const checkpointName = key.replace("_images_", "");
                  const updatedUrls: string[] = [];

                  for (let i = 0; i < val.length; i++) {
                    const imgBase64 = val[i];
                    if (typeof imgBase64 === "string" && imgBase64.startsWith("data:image")) {
                      const uploadUrl = await uploadBase64(
                        imgBase64,
                        `checklist-images/${newOrder.code}-${checkpointName}-${i}`
                      );
                      updatedUrls.push(uploadUrl);
                      hasUpdates = true;
                    } else if (typeof imgBase64 === "string") {
                      updatedUrls.push(imgBase64);
                    }
                  }

                  if (hasUpdates) {
                    checklistObj[key] = updatedUrls;
                  }
                }
              }

              if (hasUpdates) {
                finalChecklist = checklistObj;
              }
            } catch (checklistError) {
              console.error("Error processing checklist images in background:", checklistError);
            }
          }

          // 3. Update the order with uploaded URLs
          if (signatureUrl || finalChecklist !== checklist) {
            try {
              await prisma.order.update({
                where: { id: newOrder.id },
                data: {
                  signatureUrl: signatureUrl || undefined,
                  checklist: finalChecklist || undefined,
                },
              });
            } catch (dbUpdateError) {
              console.error("Error updating order with storage URLs in background:", dbUpdateError);
            }
          }

          // 4. Send email confirmation to the client if they have an email address
          if (cleanEmail) {
            try {
              const completeOrder = await prisma.order.findUnique({
                where: { id: newOrder.id },
                include: {
                  client: true,
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
                },
              });

              if (completeOrder) {
                await sendReceptionEmail(cleanEmail, completeOrder);
              }
            } catch (emailError) {
              console.error("Error sending reception email in background:", emailError);
            }
          }

          // 5. Send WhatsApp confirmation if they have a phone number
          if (cleanPhone) {
            try {
              await sendWhatsAppReceptionAction(newOrder.id);
            } catch (wsError) {
              console.error("Error sending WhatsApp notification in background:", wsError);
            }
          }
        } catch (bgError) {
          console.error("Error in background operations:", bgError);
        }
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/ordenes");
    revalidatePath("/clientes");

    return { success: true };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ocurrió un error inesperado al registrar la recepción.",
    };
  }
}
