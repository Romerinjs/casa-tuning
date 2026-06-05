"use server";

import prisma from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

// Action for creating a new service
export async function createServiceAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await verifyAdminSession();

    const name = formData.get("name") as string;
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
        isActive: true,
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

// Action for creating a new vehicle brand
export async function createBrandAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await verifyAdminSession();

    const name = formData.get("name") as string;
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

    await prisma.brand.create({
      data: {
        name: cleanName,
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

    await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash: hashedPassword,
        roleId: roleId,
        isActive: true,
      },
    });

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
