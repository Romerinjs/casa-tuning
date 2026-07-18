"use server";

import prisma from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function createCarAdminAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await verifyAdminSession();

    const clientIdStr = formData.get("clientId") as string;
    const plate = formData.get("plate") as string;
    const yearStr = formData.get("year") as string;
    const brandIdStr = formData.get("brandId") as string;
    const model = formData.get("model") as string;
    const color = formData.get("color") as string;

    if (!clientIdStr || !plate || !yearStr || !brandIdStr || !model || !color) {
      return { success: false, error: "Todos los campos del vehículo son requeridos." };
    }

    const clientId = parseInt(clientIdStr, 10);
    const year = parseInt(yearStr, 10);
    const brandId = parseInt(brandIdStr, 10);

    if (isNaN(clientId) || isNaN(year) || isNaN(brandId)) {
      return { success: false, error: "Los identificadores o el año no son válidos." };
    }

    const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (cleanPlate.length < 5 || cleanPlate.length > 6) {
      return { success: false, error: "La placa debe contener entre 5 y 6 caracteres alfanuméricos." };
    }

    // Check if plate already exists as active in DB
    const existingCar = await prisma.car.findFirst({
      where: { plate: cleanPlate, isActive: true },
    });

    if (existingCar) {
      return { success: false, error: `La placa ${cleanPlate} ya está registrada como activa en el sistema.` };
    }

    await prisma.car.create({
      data: {
        plate: cleanPlate,
        model: model.trim(),
        year,
        color: color.trim(),
        clientId,
        brandId,
        isActive: true,
      },
    });

    revalidatePath("/vehiculos");
    revalidatePath("/clientes");
    return { success: true };
  } catch (error) {
    console.error("Error creating car:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ocurrió un error inesperado al registrar el vehículo." };
  }
}

export async function updateCarAdminAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await verifyAdminSession();

    const idStr = formData.get("id") as string;
    const clientIdStr = formData.get("clientId") as string;
    const plate = formData.get("plate") as string;
    const yearStr = formData.get("year") as string;
    const brandIdStr = formData.get("brandId") as string;
    const model = formData.get("model") as string;
    const color = formData.get("color") as string;
    const isActive = formData.get("isActive") === "true";

    if (!idStr || !clientIdStr || !plate || !yearStr || !brandIdStr || !model || !color) {
      return { success: false, error: "Todos los campos obligatorios del vehículo son requeridos." };
    }

    const id = parseInt(idStr, 10);
    const clientId = parseInt(clientIdStr, 10);
    const year = parseInt(yearStr, 10);
    const brandId = parseInt(brandIdStr, 10);

    if (isNaN(id) || isNaN(clientId) || isNaN(year) || isNaN(brandId)) {
      return { success: false, error: "Los identificadores o el año no son válidos." };
    }

    const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (cleanPlate.length < 5 || cleanPlate.length > 6) {
      return { success: false, error: "La placa debe contener entre 5 y 6 caracteres alfanuméricos." };
    }

    // Check unique plate collision among active cars
    if (isActive) {
      const existingCar = await prisma.car.findFirst({
        where: {
          plate: cleanPlate,
          isActive: true,
          id: { not: id },
        },
      });

      if (existingCar) {
        return { success: false, error: `La placa ${cleanPlate} ya está registrada como activa para otro cliente.` };
      }
    }

    await prisma.car.update({
      where: { id },
      data: {
        plate: cleanPlate,
        model: model.trim(),
        year,
        color: color.trim(),
        clientId,
        brandId,
        isActive,
      },
    });

    revalidatePath("/vehiculos");
    revalidatePath("/clientes");
    return { success: true };
  } catch (error) {
    console.error("Error updating car:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ocurrió un error inesperado al actualizar el vehículo." };
  }
}
