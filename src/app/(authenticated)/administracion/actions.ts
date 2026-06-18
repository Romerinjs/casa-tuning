"use server";

import prisma from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { uploadBase64 } from "@/lib/storage";
import { sendWelcomeEmail } from "@/lib/emails";

// Action for creating a new service
export async function createServiceAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await verifyAdminSession();

    const name = formData.get("name") as string;
    const icon = formData.get("icon") as string || null;
    const isTopSelling = formData.get("isTopSelling") === "true";
    const isActive = formData.get("isActive") !== "false";

    if (!name || name.trim() === "") {
      return { success: false, error: "El nombre del servicio es requerido." };
    }

    const cleanName = name.trim();

    // Check duplicate
    const existing = await prisma.serviceCatalog.findUnique({
      where: { name: cleanName },
    });

    if (existing) {
      return {
        success: false,
        error: `El servicio '${cleanName}' ya existe.`,
      };
    }

    await prisma.serviceCatalog.create({
      data: {
        name: cleanName,
        icon,
        isTopSelling,
        isActive,
      },
    });

    revalidatePath("/administracion");
    revalidatePath("/recepcion");
    return { success: true };
  } catch (error) {
    console.error("Error creating service:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al registrar servicio.",
    };
  }
}

// Action for updating an existing service
export async function updateServiceAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await verifyAdminSession();

    const idStr = formData.get("id") as string;
    const name = formData.get("name") as string;
    const icon = formData.get("icon") as string || null;
    const isTopSelling = formData.get("isTopSelling") === "true";
    const isActive = formData.get("isActive") === "true";

    if (!idStr || !name || name.trim() === "") {
      return { success: false, error: "El ID y el nombre del servicio son requeridos." };
    }

    const id = parseInt(idStr, 10);
    const cleanName = name.trim();

    // Check duplicate name for another service
    const existing = await prisma.serviceCatalog.findFirst({
      where: {
        name: cleanName,
        NOT: { id },
      },
    });

    if (existing) {
      return {
        success: false,
        error: `El servicio '${cleanName}' ya existe en otro registro.`,
      };
    }

    await prisma.serviceCatalog.update({
      where: { id },
      data: {
        name: cleanName,
        icon,
        isTopSelling,
        isActive,
      },
    });

    revalidatePath("/administracion");
    revalidatePath("/recepcion");
    return { success: true };
  } catch (error) {
    console.error("Error updating service:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar servicio.",
    };
  }
}

// Action for deleting an existing service
export async function deleteServiceAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await verifyAdminSession();

    const idStr = formData.get("id") as string;
    if (!idStr) {
      return { success: false, error: "El ID del servicio es requerido." };
    }

    const id = parseInt(idStr, 10);

    // Check if the service is associated with any order service items
    const inUse = await prisma.orderService.findFirst({
      where: { serviceId: id },
    });

    if (inUse) {
      return {
        success: false,
        error: "Este servicio ya está asociado a órdenes existentes y no se puede eliminar. Puede desactivarlo en su lugar.",
      };
    }

    await prisma.serviceCatalog.delete({
      where: { id },
    });

    revalidatePath("/administracion");
    revalidatePath("/recepcion");
    return { success: true };
  } catch (error) {
    console.error("Error deleting service:", error);
    const err = error as any;
    if (err.code === "P2003") {
      return {
        success: false,
        error: "Este servicio está asociado a órdenes y no se puede eliminar. Intente desactivarlo.",
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar servicio.",
    };
  }
}

// Action for creating a new vehicle brand
export async function createBrandAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await verifyAdminSession();

    const name = formData.get("name") as string;
    const logo = formData.get("logo") as string || null;
    if (!name || name.trim() === "") {
      return { success: false, error: "El nombre de la marca es requerido." };
    }

    const cleanName = name.trim();

    // Check duplicate
    const existing = await prisma.brand.findUnique({
      where: { name: cleanName },
    });

    if (existing) {
      return {
        success: false,
        error: `La marca '${cleanName}' ya existe.`,
      };
    }

    // Upload logo to storage if provided as base64
    let logoUrl: string | null = null;
    if (logo) {
      try {
        const brandSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        logoUrl = await uploadBase64(logo, `brands/logo-${brandSlug}`);
      } catch (uploadError) {
        console.error("Error uploading brand logo to storage:", uploadError);
        return {
          success: false,
          error: "Error al subir el logo de la marca al almacenamiento en la nube.",
        };
      }
    }

    await prisma.brand.create({
      data: {
        name: cleanName,
        logo: logoUrl,
      },
    });

    revalidatePath("/administracion");
    revalidatePath("/recepcion");
    return { success: true };
  } catch (error) {
    console.error("Error creating brand:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al registrar la marca.",
    };
  }
}

// Action for creating a new user (Operador/Administrador)
export async function createUserAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await verifyAdminSession();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const roleIdStr = formData.get("roleId") as string;

    if (!name || !email || !password || !roleIdStr) {
      return { success: false, error: "Todos los campos son requeridos." };
    }

    const cleanEmail = email.trim().toLowerCase();
    const roleId = parseInt(roleIdStr, 10);

    if (password.length < 6) {
      return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
    }

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return {
        success: false,
        error: `El correo ${cleanEmail} ya está registrado en el sistema.`,
      };
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return { success: false, error: "El rol seleccionado no es válido." };
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash: hashedPassword,
        roleId: roleId,
        isActive: true,
      },
    });

    // Send welcome email with credentials (username & plain-text password)
    try {
      await sendWelcomeEmail(cleanEmail, createdUser.name, role.name, password, createdUser.id);
    } catch (emailError) {
      console.error("Error sending welcome email to new user:", emailError);
    }

    revalidatePath("/administracion");
    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al registrar el usuario.",
    };
  }
}

// Action for sending a test WhatsApp message using Meta template "prueba_de_sonido_2"
export async function sendTestSoundTemplateAction(
  prevState: { success: boolean; error?: string; message?: string } | null,
  formData: FormData
) {
  try {
    await verifyAdminSession();

    const phoneInput = formData.get("phone") as string;
    if (!phoneInput) {
      return { success: false, error: "El número de celular es requerido." };
    }

    const clean = phoneInput.replace(/\D/g, "");
    if (clean.length !== 10) {
      return { success: false, error: "El celular debe contener exactamente 10 dígitos (Colombia)." };
    }

    const recipientPhone = `+57${clean}`;

    const baseUrl = process.env.KAPSO_API_BASE_URL || "https://api.kapso.ai";
    const apiKey = process.env.KAPSO_API_KEY;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!apiKey || !phoneId) {
      return {
        success: false,
        error: "Configuración incompleta en el servidor (.env). Asegúrate de configurar KAPSO_API_KEY y WHATSAPP_PHONE_NUMBER_ID."
      };
    }

    const endpoint = `${baseUrl}/meta/whatsapp/v24.0/${phoneId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "template",
      template: {
        name: "prueba_de_sonido_2",
        language: { code: "es_MX" }
      }
    };

    console.log(`[WhatsApp Test] Enviando plantilla 'prueba_de_sonido_2' a ${recipientPhone}`);

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
      console.error("[WhatsApp Test] Error de respuesta de la API:", data);
      return {
        success: false,
        error: data.error?.message || "La API de Kapso retornó un error al enviar el mensaje de prueba."
      };
    }

    console.log("[WhatsApp Test] Mensaje enviado exitosamente:", data);
    return { 
      success: true, 
      message: `¡Plantilla 'prueba_de_sonido_2' enviada con éxito a ${recipientPhone}!` 
    };
  } catch (error) {
    console.error("Error sending test sound template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error de red al intentar enviar el mensaje de prueba."
    };
  }
}
