# Especificación SSD: Módulo de Autenticación y Administración de Usuarios

Este documento especifica la implementación del sistema de autenticación y control de accesos para **Casa Tuning - Portal Operativo** utilizando **NextAuth.js v5 (Auth.js)** y el cifrado de contraseñas con **bcryptjs**.

## 1. Objetivos del Cambio
* Configurar NextAuth.js v5 con soporte para el proveedor de Credenciales (Email/Password).
* Proteger las rutas operativas (`/dashboard`, `/recepcion`, `/clientes`, `/ordenes`) a través de un proxy centralizado (`src/proxy.ts` de Next.js 16).
* Asegurar que ningún módulo del sistema (Dashboard, Recepción, CRM Clientes, Órdenes) sea accesible ni exponga datos si el usuario no está autenticado y activo (`isActive === true`).
* Crear el flujo de inicio de sesión seguro (login) con validación del hash de contraseñas.
* Proveer una vista de inicio de sesión responsiva y con una estética premium alineada con la identidad visual del taller.

## 2. Dependencias Requeridas
* **`next-auth@beta`**: Para la gestión de sesiones con JWT.
* **`bcryptjs`**: Para el hashing e interceptación segura de contraseñas.
* **`@types/bcryptjs`**: Tipos para desarrollo.

## 3. Decisiones de Diseño y Seguridad Transversal

### Cifrado de Contraseñas (bcryptjs)
Las contraseñas no se almacenarán jamás en texto plano. Se utilizará `bcryptjs` con un factor de costo (salt rounds) de `10` en las mutaciones de creación de usuarios (seeding) y se verificará el hash en el proceso de autenticación.

### Doble Capa de Protección de Módulos (Defensa en Profundidad)

Para garantizar que todos los módulos estén blindados ante accesos no autorizados, implementaremos dos niveles de protección:

1. **Nivel 1: Control de Rutas en el Proxy (Optimista)**
   - El archivo `src/proxy.ts` interceptará todas las peticiones a rutas operativas (`/dashboard`, `/recepcion`, `/clientes`, `/ordenes`, `/configuracion`).
   - Si no existe un JWT válido en las cookies de sesión, Next.js redirigirá inmediatamente al usuario a `/login` a nivel de Edge, antes de renderizar la página o ejecutar acciones.

2. **Nivel 2: Verificación de Estado Activo en Servidor (Seguro - DAL)**
   - Crearemos un helper de sesión en `src/lib/auth-helpers.ts` (Data Access Layer - DAL) llamado `verifySession()`.
   - Este helper se invocará en los layouts y páginas de servidor de todos los módulos.
   - Además de verificar que el usuario tenga sesión iniciada, consultará a la base de datos si el usuario sigue marcado como activo (`isActive === true`). Si el usuario fue desactivado por un administrador, su sesión se considerará inválida y se le redirigirá a `/login` con cierre de sesión inmediato.

---

## 4. Estructura de Archivos a Crear / Modificar

### Configuración de NextAuth

#### `src/auth.config.ts` (Configuración Edge-Compatible)
Contiene la configuración de páginas personalizadas y de protección de rutas para que Next.js la ejecute de forma ligera en el Proxy (sin importar dependencias pesadas como Prisma):
```typescript
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedArea = nextUrl.pathname.startsWith("/dashboard") ||
                                nextUrl.pathname.startsWith("/recepcion") ||
                                nextUrl.pathname.startsWith("/clientes") ||
                                nextUrl.pathname.startsWith("/ordenes") ||
                                nextUrl.pathname.startsWith("/configuracion");
                            
      if (isOnProtectedArea) {
        if (isLoggedIn) return true;
        return false; // Redirige a /login
      } else if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  providers: [], // Vacío aquí para que sea Edge compatible
} satisfies NextAuthConfig;
```

#### `src/auth.ts` (Inicialización con Proveedor)
Importa `authConfig` e inicializa el proveedor de Credenciales con acceso a la base de datos de Prisma:
```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;
        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user || !user.isActive) return null;

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordsMatch) return null;

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role.name,
        };
      },
    }),
  ],
});
```

#### `src/app/api/auth/[...nextauth]/route.ts`
Expone los endpoints del backend de NextAuth para manejar las peticiones HTTP (`GET`/`POST`):
```typescript
export { GET, POST } from "@/auth";
```

#### `src/proxy.ts` (Proxy de Next.js 16)
Interviene las peticiones usando la configuración de Auth.js:
```typescript
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: proxy } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
```

---

### Capa de Acceso a Datos de Autenticación (DAL)

#### `src/lib/auth-helpers.ts` (Verificación Segura en Servidor)
Función centralizada para validar la sesión y el estado de actividad del usuario desde Server Components y Server Actions:
```typescript
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cache } from "react";

export const verifySession = cache(async () => {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Verificación adicional de base de datos para asegurar que el usuario sigue activo
  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { isActive: true, name: true, email: true, roleId: true },
  });

  if (!user || !user.isActive) {
    redirect("/login");
  }

  return {
    id: parseInt(session.user.id),
    name: user.name,
    email: user.email,
    roleId: user.roleId,
  };
});
```

---

### Módulo Auth

#### `src/modules/auth/actions.ts`
Server Actions para inicio de sesión seguro y salida del sistema:
```typescript
"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Credenciales inválidas. Inténtalo de nuevo.";
        default:
          return "Ocurrió un error inesperado al iniciar sesión.";
      }
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
```

---

## 5. Plan de Verificación

### Pruebas Automatizadas
* **Prueba de compilación**:
  ```powershell
  npx tsc --noEmit
  ```
* **Linter**:
  ```powershell
  npm run lint
  ```

### Verificación Manual
1. Intentar acceder a `/dashboard` sin haber iniciado sesión; verificar que redirige automáticamente a `/login`.
2. Registrar un usuario de prueba (seeding) con contraseña hasheada en PostgreSQL.
3. Intentar iniciar sesión con credenciales correctas; verificar ingreso exitoso a `/dashboard`.
4. Intentar iniciar sesión con credenciales incorrectas; verificar que se muestra el mensaje de error "Credenciales inválidas".
5. Cambiar el campo `isActive` a `false` en la base de datos para el usuario conectado y recargar el dashboard; verificar que es redirigido inmediatamente a `/login` al fallar `verifySession()`.
6. Cerrar sesión y verificar la redirección inmediata a `/login`.
