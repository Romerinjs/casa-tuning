# Especificaciones del Módulo Operativo y Administración

Este documento describe la arquitectura, diseño y lógica técnica implementada para el Dashboard y los paneles administrativos de **Casa Tuning**.

---

## 1. Arquitectura de Rutas y Seguridad

Para evitar la duplicación de código de diseño y establecer políticas de autorización unificadas, se ha introducido un **Route Group** en el App Router de Next.js:

- **Rutas Operativas**: Todas las vistas asociadas a la gestión del taller se organizan bajo `src/app/(authenticated)/`. Esto no modifica la ruta de la URL (por ejemplo, `/dashboard` sigue mapeando a `/dashboard`), pero permite compartir un `layout.tsx` unificado.
- **Validación de Sesiones**: En cada página (o dentro del layout) se invoca el helper `verifySession()` o `verifyAdminSession()`.
  - `verifySession()` (definido en [auth-helpers.ts](file:///d:/OneDrive/Escritorio/Romito/ren/proyectos/casa-tuning/src/lib/auth-helpers.ts)): Obtiene el ID del usuario en la sesión cifrada y consulta en la base de datos si el usuario está marcado como activo (`isActive: true`), retornando además su rol (`role.name`).
  - `verifyAdminSession()`: Ejecuta la validación de sesión estándar y verifica explícitamente si el nombre del rol del usuario es `"Administrador"`. Si no es el caso, realiza una redirección automática a la ruta `/dashboard`.

---

## 2. Layout Compartido y Navegación

El diseño implementa la estética premium "dark mode sidebar + light mode content", con alto contraste y acentos dorados (`#C9A84C`), de acuerdo con la guía de estilo de Casa Tuning.

### Sidebar (`Sidebar.tsx`)
Ubicado en [Sidebar.tsx](file:///d:/OneDrive/Escritorio/Romito/ren/proyectos/casa-tuning/src/components/Sidebar.tsx), opera en el lado del cliente (`"use client"`) para detectar la ruta actual y aplicar un sombreado y borde dorado en la barra de navegación:
- **Diseño Adaptable (Responsivo)**: 
  - En pantallas grandes (`lg`, >= 1024px, como iPad en horizontal), el Sidebar permanece fijo en el lateral izquierdo.
  - En pantallas medianas y pequeñas (`< 1024px`, como iPad en vertical y celulares), el Sidebar se oculta por defecto y aparece una barra móvil en la parte superior con un botón de menú hamburguesa. Al pulsarlo, el Sidebar se despliega mediante un panel flotante overlay deslizante con desenfoque de fondo (`backdrop-blur-xs`) y z-index prioritario.
- **Menú Dinámico**: Muestra condicionalmente la sección "Administración" solo si el rol del usuario es `"Administrador"`.
- **Cierre de Sesión**: Un botón rápido en la zona inferior de perfil de usuario invoca la Server Action `logoutAction` para destruir la cookie de sesión y redirigir a `/login`.

---

## 3. Módulo Dashboard

El Dashboard ([page.tsx](file:///d:/OneDrive/Escritorio/Romito/ren/proyectos/casa-tuning/src/app/(authenticated)/dashboard/page.tsx)) opera como un Server Component que recupera los datos de PostgreSQL en paralelo mediante queries de Prisma:

- **Estadísticas Clave**:
  - *En proceso*: Total de órdenes con estado `"EN_PROCESO"`.
  - *Listos para entrega*: Total de órdenes con estado `"LISTO"`.
  - *Recibidos hoy*: Órdenes creadas a partir del inicio del día de hoy con estado `"RECIBIDO"`.
  - *Total del día*: Volumen general de check-ins creados hoy.
- **Tabla de Órdenes Activas**: Muestra las órdenes cuyo estado no es `"ENTREGADO"`. Muestra la placa formateada como badge mono, los datos de contacto del cliente, el vehículo, chips con los servicios contratados, el estado actual (colorizado) y la hora de recepción.
- **Feed de Actividad**: Muestra lo## 4. Módulo Clientes (Solo Administrador)

El panel de clientes está restringido exclusivamente a usuarios con el rol de `"Administrador"`. Los operarios son redirigidos de manera automática al dashboard si intentan ingresar directamente a `/clientes`.

Se compone de los siguientes elementos:
- **Estructura Principal**: Listado de clientes con buscador integrado por nombre, teléfono o correo.
- **Creación de Cliente (Modal)**: Permite ingresar el nombre, celular (saneado en tiempo real a 10 dígitos) y correo (validación regex).
- **Detalle de Cliente (Drawer Overlay)**: Al hacer clic en un cliente, se activa un panel deslizable desde la derecha (Drawer) que superpone un overlay gris con efecto difuminado de fondo (`backdrop-blur-md`).
  - **Edición de Cliente (Modal)**: Un botón "Editar" en la cabecera abre un modal para modificar los datos del cliente invocando la Server Action `updateClientAction`.
  - **Registro de Vehículos (Modal)**: Un botón "Agregar Vehículo" en la sección de vehículos abre un modal para dar de alta un auto (Placa, Marca, Modelo, Año, Color) asociado directamente al cliente actual invocando la Server Action `createCarAction`, sin generar una orden de trabajo de servicios.
- **Notificaciones**: Todo cambio exitoso (creación, edición, asociación de auto) es notificado al administrador mediante toasts flotantes inferiores.

---

## 5. Módulo Nueva Recepción

Permite registrar el ingreso de vehículos al taller estructurado como un **Formulario Secuencial en Acordeón** y opera tanto para operarios como administradores:

- **Toggles de Datos Inteligentes (Mobile-First)**:
  - *Datos del Cliente*: Permite alternar entre "Buscar Registrado" (combobox/autocomplete de búsqueda rápida sobre el catálogo de clientes que precarga sus datos) y "Nuevo Cliente" (formulario manual).
  - *Datos del Vehículo*: Permite alternar entre "Vehículo Existente" (combobox/autocomplete con filtro inteligente que muestra por defecto los autos asociados al cliente seleccionado) y "Nuevo Vehículo" (formulario manual).
- **Navegación por Pasos**: Para mejorar la ergonomía táctil en iPads, el formulario se divide en 4 acordeones colapsables controlados por un estado `activeStep` (1 a 4):
  1. *Datos del Cliente*: Selección/Autocompletado o Nombre, celular y correo manual.
  2. *Datos del Vehículo*: Autocompletado o datos manuales (Placa, Año, Marca, Modelo, Color) + Kilometraje obligatorio.
  3. *Servicios Contratados*: Chips interactivos con iconos temáticos de Lucide.
  4. *Inspección y Firma*:
     - **Fotos de Recepción**: Cuadrícula de slots fotográficos.
     - **Firma Digital**: Lienzo HTML5 (`<canvas>`) integrado en la parte inferior del paso. Captura trazos continuos mediante eventos de ratón y eventos multitáctiles (`onTouchStart`, `onTouchMove`, etc.) para pantallas de iPad y móviles. Incluye un botón para limpiar el lienzo. La firma es codificada en base64 y enviada de forma atómica en el formulario.
- **Acción y Transacciones**: `createOrderAction` procesa el formulario en el servidor, sanea los parámetros, extrae el string base64 de la firma y guarda el registro de la orden con una ruta mock de R2 `/uploads/signatures/sig-${sequence}.png` en la columna `signature_url` de PostgreSQL.
- **Notificaciones**: Las respuestas del servidor se muestran dinámicamente mediante toasts especiales en la parte inferior central.

---

## 6. Módulo Órdenes

Permite supervisar los vehículos dentro del taller y cambiar sus fases de trabajo (`RECIBIDO` -> `EN_PROCESO` -> `LISTO` -> `ENTREGADO`). 

- **Notificaciones Toast**: Las alertas nativas del navegador (`alert`) al mutar los estados de las órdenes han sido reemplazadas por una integración del hook `useToast`, mostrando avisos móviles flotantes elegantes de éxito o error en la parte inferior central.

---

## 7. Módulo Administración (Solo Administrador)

Proporciona tres pestañas de control con listados izquierdos y formularios de creación derechos:

- **Servicios**: Para ingresar nuevos servicios de tuning a la base de datos (`ServiceCatalog`).
- **Marcas**: Para registrar marcas adicionales al catálogo (`Brand`).
- **Usuarios**: Para registrar operarios u administradores.
  - **Ficha de Detalle de Usuario**: El listado de usuarios del sistema es interactivo y tiene un cursor indicador de enlace. Al hacer clic sobre cualquier usuario del listado, se abre un modal flotante que muestra la ficha detallada de este: Nombre completo, Correo electrónico, Rol del sistema, Estado activo/inactivo (badge de color) y la Fecha de registro del usuario.

---

## 8. Infraestructura de Notificaciones Toast

Se ha desarrollado un sistema de notificaciones premium mobile-first:
- **Ubicación y Estilo**: Notificaciones flotantes posicionadas en la **parte inferior central** de la pantalla (`fixed bottom-6 left-1/2 -translate-x-1/2`). Utiliza un diseño de cápsula con glassmorphism (`bg-zinc-950/95 text-white shadow-2xl backdrop-blur-md border border-zinc-700/50`) y animación de entrada deslizante (`slideUp` en `globals.css`).
- **Estados y Tipos**: Soporta cuatro variantes visuales con iconos dinámicos de Lucide:
  - `success` (Verde: `CheckCircle2`)
  - `error` (Rojo: `XCircle`)
  - `warning` (Amarillo: `AlertTriangle`)
  - `info` (Dorado/Gris: `Info`)
- **Funcionamiento**: Opera bajo un `ToastProvider` global de React encapsulado en `src/components/ui/Toast.tsx` y expuesto mediante el hook `useToast()`. Incluye un temporizador que descarta automáticamente cada toast después de 3.5 segundos.

