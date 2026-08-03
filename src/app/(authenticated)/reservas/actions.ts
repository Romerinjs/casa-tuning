"use server";

import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import {
  sendWhatsAppReservationConfirmationAction,
  sendWhatsAppReservationReminderAction
} from "@/lib/whatsapp";
import { after } from "next/server";

export async function createReservationAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    const user = await verifySession();

    // 1. Extract & validate client info
    const clientName = formData.get("clientName") as string;
    const clientPhone = formData.get("clientPhone") as string;
    const clientEmail = (formData.get("clientEmail") as string) || null;

    if (!clientName || !clientPhone) {
      return { success: false, error: "El nombre y celular del cliente son obligatorios." };
    }

    const cleanPhone = clientPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return { success: false, error: "El celular del cliente debe contener 10 números." };
    }

    // 2. Extract & validate date & time
    const scheduledAtStr = formData.get("scheduledAt") as string;
    if (!scheduledAtStr) {
      return { success: false, error: "La fecha y hora de la cita son requeridas." };
    }
    const scheduledAt = new Date(scheduledAtStr);
    if (isNaN(scheduledAt.getTime())) {
      return { success: false, error: "Fecha y hora de cita no válidas." };
    }

    // 3. Extract & validate services
    const selectedServiceIds = formData.getAll("services").map((id) => parseInt(id as string, 10));
    if (selectedServiceIds.length === 0) {
      return { success: false, error: "Debe seleccionar al menos un servicio para agendar." };
    }

    // 4. Vehicle information
    const carIdStr = formData.get("carId") as string;
    const carId = carIdStr ? parseInt(carIdStr, 10) : null;

    const vehiclePlateRaw = formData.get("vehiclePlate") as string;
    const vehiclePlate = vehiclePlateRaw ? vehiclePlateRaw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : null;

    const vehicleModel = (formData.get("vehicleModel") as string) || null;
    const brandIdStr = formData.get("brandId") as string;
    const brandId = brandIdStr ? parseInt(brandIdStr, 10) : null;
    const notes = (formData.get("notes") as string) || null;

    // Transaction to create or update client and save reservation
    const newReservation = await prisma.$transaction(async (tx) => {
      // Find or create client
      let dbClient = await tx.client.findUnique({
        where: { phone: cleanPhone },
      });

      if (dbClient) {
        dbClient = await tx.client.update({
          where: { id: dbClient.id },
          data: {
            name: clientName.trim(),
            email: clientEmail ? clientEmail.trim() : dbClient.email,
          },
        });
      } else {
        dbClient = await tx.client.create({
          data: {
            name: clientName.trim(),
            phone: cleanPhone,
            email: clientEmail ? clientEmail.trim() : null,
          },
        });
      }

      // Generate unique reservation code RES-2026-XXXX
      const count = await tx.reservation.count();
      const sequence = String(count + 1).padStart(4, "0");
      const reservationCode = `RES-2026-${sequence}`;

      // Create Reservation
      const reservation = await tx.reservation.create({
        data: {
          code: reservationCode,
          scheduledAt: scheduledAt,
          status: "PENDIENTE",
          notes: notes ? notes.trim() : null,
          clientId: dbClient.id,
          carId: carId && !isNaN(carId) ? carId : null,
          vehiclePlate: vehiclePlate,
          vehicleModel: vehicleModel ? vehicleModel.trim() : null,
          brandId: brandId && !isNaN(brandId) ? brandId : null,
          creatorId: user.id,
        },
      });

      // Link selected services
      const serviceLinks = selectedServiceIds.map((serviceId) => ({
        reservationId: reservation.id,
        serviceId: serviceId,
      }));

      await tx.reservationService.createMany({
        data: serviceLinks,
      });

      return reservation;
    });

    if (newReservation) {
      // Send WhatsApp confirmation asynchronously
      after(async () => {
        try {
          await sendWhatsAppReservationConfirmationAction(newReservation.id);
        } catch (err) {
          console.error("Error sending reservation WhatsApp confirmation:", err);
        }
      });
    }

    revalidatePath("/reservas");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error creating reservation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al registrar la reserva.",
    };
  }
}

export async function updateReservationAction(
  reservationId: number,
  formData: FormData
) {
  try {
    await verifySession();

    const scheduledAtStr = formData.get("scheduledAt") as string;
    if (!scheduledAtStr) {
      return { success: false, error: "La fecha y hora de la cita son requeridas." };
    }
    const scheduledAt = new Date(scheduledAtStr);
    if (isNaN(scheduledAt.getTime())) {
      return { success: false, error: "Fecha y hora no válidas." };
    }

    const selectedServiceIds = formData.getAll("services").map((id) => parseInt(id as string, 10));
    if (selectedServiceIds.length === 0) {
      return { success: false, error: "Debe seleccionar al menos un servicio." };
    }

    const status = (formData.get("status") as string) || "PENDIENTE";
    const notes = (formData.get("notes") as string) || null;
    const vehiclePlateRaw = formData.get("vehiclePlate") as string;
    const vehiclePlate = vehiclePlateRaw ? vehiclePlateRaw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : null;
    const vehicleModel = (formData.get("vehicleModel") as string) || null;
    const brandIdStr = formData.get("brandId") as string;
    const brandId = brandIdStr ? parseInt(brandIdStr, 10) : null;

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservationId },
        data: {
          scheduledAt,
          status,
          notes: notes ? notes.trim() : null,
          vehiclePlate,
          vehicleModel: vehicleModel ? vehicleModel.trim() : null,
          brandId: brandId && !isNaN(brandId) ? brandId : null,
        },
      });

      // Update services
      await tx.reservationService.deleteMany({
        where: { reservationId },
      });

      await tx.reservationService.createMany({
        data: selectedServiceIds.map((serviceId) => ({
          reservationId,
          serviceId,
        })),
      });
    });

    revalidatePath("/reservas");
    return { success: true };
  } catch (error) {
    console.error("Error updating reservation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar la reserva.",
    };
  }
}

export async function cancelReservationAction(reservationId: number) {
  try {
    await verifySession();

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: "CANCELADA" },
    });

    revalidatePath("/reservas");
    return { success: true };
  } catch (error) {
    console.error("Error canceling reservation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cancelar la reserva.",
    };
  }
}

export async function sendManualReminderAction(reservationId: number) {
  try {
    await verifySession();

    const success = await sendWhatsAppReservationReminderAction(reservationId);
    if (success) {
      revalidatePath("/reservas");
      return { success: true };
    } else {
      return { success: false, error: "No se pudo enviar el recordatorio vía WhatsApp." };
    }
  } catch (error) {
    console.error("Error sending manual reminder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al enviar recordatorio.",
    };
  }
}

export async function getReservationForReceptionAction(reservationId: number) {
  try {
    await verifySession();

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
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
        brand: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!reservation) {
      return { success: false, error: "Reserva no encontrada." };
    }

    return { success: true, reservation };
  } catch (error) {
    console.error("Error getting reservation for reception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener datos de la reserva.",
    };
  }
}
