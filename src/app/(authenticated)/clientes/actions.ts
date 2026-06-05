"use server";

import prisma from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function createClientAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    // Verify user session (CRM is admin-only, but verifySession is minimum safe check)
    await verifyAdminSession();

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = (formData.get("email") as string) || null;

    if (!name || !phone) {
      return { success: false, error: "Nombre y Celular son requeridos." };
    }

    const cleanName = name.trim();
    if (!cleanName) {
      return { success: false, error: "El nombre completo del cliente es requerido." };
    }

    // Clean and validate phone (must be exactly 10 digits)
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return {
        success: false,
        error: "El celular del cliente debe contener exactamente 10 números.",
      };
    }

    // Validate email format if provided
    const cleanEmail = email ? email.trim() : null;
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return {
        success: false,
        error: "El correo electrónico del cliente no tiene un formato válido.",
      };
    }

    // Check if client with this phone already exists
    const existing = await prisma.client.findUnique({
      where: { phone: cleanPhone },
    });

    if (existing) {
      return {
        success: false,
        error: `Ya existe un cliente con el celular ${cleanPhone}.`,
      };
    }

    await prisma.client.create({
      data: {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail ? cleanEmail : null,
      },
    });

    revalidatePath("/clientes");
    return { success: true };
  } catch (error) {
    console.error("Error creating client:", error);
    return {
      success: false,
      error: "Ocurrió un error inesperado al crear el cliente.",
    };
  }
}

export async function updateClientAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await verifyAdminSession();

    const idStr = formData.get("id") as string;
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = (formData.get("email") as string) || null;

    if (!idStr || !name || !phone) {
      return { success: false, error: "ID, Nombre y Celular son requeridos." };
    }

    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return { success: false, error: "El ID del cliente no es válido." };
    }

    const cleanName = name.trim();
    if (!cleanName) {
      return { success: false, error: "El nombre completo del cliente es requerido." };
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return { success: false, error: "El celular debe contener exactamente 10 números." };
    }

    const cleanEmail = email ? email.trim() : null;
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: "El correo electrónico del cliente no tiene un formato válido." };
    }

    // Check unique phone collision
    const existing = await prisma.client.findFirst({
      where: {
        phone: cleanPhone,
        id: { not: id },
      },
    });

    if (existing) {
      return { success: false, error: `Ya existe otro cliente con el celular ${cleanPhone}.` };
    }

    await prisma.client.update({
      where: { id },
      data: {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
      },
    });

    revalidatePath("/clientes");
    return { success: true };
  } catch (error) {
    console.error("Error updating client:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ocurrió un error inesperado al actualizar el cliente." };
  }
}

export async function createCarAction(
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
      return { success: false, error: "Todos los campos obligatorios del vehículo son requeridos." };
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

    // Check if plate already exists in DB
    const existingCar = await prisma.car.findUnique({
      where: { plate: cleanPlate },
    });

    if (existingCar) {
      return { success: false, error: `La placa ${cleanPlate} ya está registrada en el sistema.` };
    }

    await prisma.car.create({
      data: {
        plate: cleanPlate,
        model: model.trim(),
        year,
        color: color.trim(),
        clientId,
        brandId,
      },
    });

    revalidatePath("/clientes");
    return { success: true };
  } catch (error) {
    console.error("Error creating car:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ocurrió un error inesperado al registrar el vehículo." };
  }
}
