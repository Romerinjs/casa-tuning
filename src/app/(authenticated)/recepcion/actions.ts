"use server";

import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

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

    if (!plate || !yearStr || !brandIdStr || !model || !color) {
      return { success: false, error: "Todos los campos obligatorios del vehículo son requeridos." };
    }

    const year = parseInt(yearStr, 10);
    const brandId = parseInt(brandIdStr, 10);

    if (isNaN(year) || isNaN(brandId)) {
      return { success: false, error: "El año o la marca del vehículo no son válidos." };
    }

    // 3. Extract service IDs
    const selectedServiceIds = formData.getAll("services").map((id) => parseInt(id as string, 10));

    if (selectedServiceIds.length === 0) {
      return { success: false, error: "Debe seleccionar al menos un servicio contratado." };
    }

    // 4. Extract digital signature
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

    // Clean and validate plate (no spaces, alphanumeric, uppercase, max 6, min 5)
    const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (cleanPlate.length < 5 || cleanPlate.length > 6) {
      return { success: false, error: "La placa del vehículo debe contener entre 5 y 6 caracteres alfanuméricos." };
    }

    // Clean mileage (digits only)
    const cleanMileage = mileage ? mileage.replace(/\D/g, "") : null;

    // Use Prisma Transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Find or create client by phone
      let dbClient = await tx.client.findUnique({
        where: { phone: cleanPhone },
      });

      if (dbClient) {
        // Optionally update email/name if changed
        dbClient = await tx.client.update({
          where: { id: dbClient.id },
          data: {
            name: clientName.trim(),
            email: cleanEmail ? cleanEmail : dbClient.email,
          },
        });
      } else {
        dbClient = await tx.client.create({
          data: {
            name: clientName.trim(),
            phone: cleanPhone,
            email: cleanEmail ? cleanEmail : null,
          },
        });
      }

      // Find or create car by plate
      let dbCar = await tx.car.findUnique({
        where: { plate: cleanPlate },
      });

      if (dbCar) {
        // Update car details if linked to different parameters, keep linked to client
        dbCar = await tx.car.update({
          where: { id: dbCar.id },
          data: {
            model: model.trim(),
            year: year,
            color: color.trim(),
            clientId: dbClient.id,
            brandId: brandId,
          },
        });
      } else {
        dbCar = await tx.car.create({
          data: {
            plate: cleanPlate,
            model: model.trim(),
            year: year,
            color: color.trim(),
            clientId: dbClient.id,
            brandId: brandId,
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
          signatureUrl: signature ? `/uploads/signatures/sig-${nextSequence}.png` : null,
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
