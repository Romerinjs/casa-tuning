# Especificación de Diseño: Gestión Mejorada de Servicios para Administrador

Este documento especifica los cambios de base de datos, backend y frontend para mejorar la experiencia de creación, edición, desactivación y eliminación de servicios en la vista de administración, así como la visualización y ordenamiento de los mismos en la recepción de vehículos.

---

## 1. Cambios en la Base de Datos (Prisma)

### Modificación del Modelo `ServiceCatalog`
Añadiremos dos nuevos campos al modelo de base de datos:
1. `icon`: Nombre del icono representativo del servicio (`String? @db.VarChar(50)`).
2. `isTopSelling`: Un booleano (`Boolean @default(false) @map("is_top_selling")`) para indicar si el servicio es uno de los más vendidos/destacados.

```prisma
model ServiceCatalog {
  id           Int            @id @default(autoincrement())
  name         String         @unique @db.VarChar(100)
  isActive     Boolean        @default(true) @map("is_active")
  icon         String?        @db.VarChar(50)
  isTopSelling Boolean        @default(false) @map("is_top_selling")

  orderItems   OrderService[]

  @@map("service_catalog")
}
```

### Script de Seed (`prisma/seed.ts`)
Actualizaremos el seed para incluir iconos apropiados y marcar los servicios indicados por el usuario como los más vendidos (`isTopSelling: true`):
- **Polarizado** -> icono: `"Sun"`, más vendido: `true`
- **PPF (Paint Protection Film)** -> icono: `"Shield"`, más vendido: `true`
- **Vinilo** -> icono: `"Palette"`, más vendido: `true`
- **Luces LED** -> icono: `"Lightbulb"`, más vendido: `true`
- **Sensores** -> icono: `"Radar"`, más vendido: `true`
- **Radios** -> icono: `"Radio"`, más vendido: `true`
- **Cámaras de reversa** -> icono: `"Camera"`, más vendido: `true`
- *Otros servicios (como Alarmas, CarPlay, Parlantes, etc.)* tendrán sus respectivos iconos predeterminados y `isTopSelling: false`.

---

## 2. Cambios en el Backend (Acciones del Servidor)

Ubicación: `src/app/(authenticated)/administracion/actions.ts`

### `createServiceAction`
Actualizada para aceptar e insertar:
* `name` (string)
* `icon` (string)
* `isTopSelling` (boolean)
* `isActive` (boolean, por defecto `true`)

### `updateServiceAction` [NUEVA]
Acción para guardar cambios de un servicio existente:
* Recibe el `id` (int) del servicio.
* Actualiza los campos `name`, `icon`, `isTopSelling` e `isActive` en la tabla `service_catalog`.
* Valida duplicados de nombre excluyendo el ID actual.

### `deleteServiceAction` [NUEVA]
Acción para eliminar un servicio:
* Recibe el `id` (int) del servicio.
* Intenta eliminar el servicio.
* **Control de Restricciones**: Si el servicio ya está asociado a alguna orden existente (violación de clave foránea en `OrderService`), captura el error de Prisma y retorna un mensaje amigable indicando que no se puede eliminar porque está en uso, sugiriendo desactivarlo en su lugar.

---

## 3. Registro de Iconos Soportados

Crearemos un registro estático de iconos de `lucide-react` para uso consistente tanto en el catálogo de administración como en el formulario de recepción. 
Esto garantiza que los iconos renderizados coincidan exactamente con la selección y evita la carga de librerías dinámicas pesadas.

Lista de iconos disponibles en la UI:
* **Sun** (Polarizado/Exterior)
* **Shield** (PPF/Seguridad)
* **Palette** (Vinilo/Estética)
* **Lightbulb** (Luces LED/Exploradoras)
* **Bell** (Alarmas/Seguridad Activa)
* **Radar** (Sensores/Proximidad)
* **Radio** (Radios/Android)
* **Smartphone** (CarPlay/Conectividad)
* **Speaker** (Sonido/Parlantes)
* **Sliders** (Ecualizadores/Plantas de sonido)
* **Camera** (Cámaras de reversa/Video)
* **Tv** (Pantallas/Multimedia)
* **Wind** (Aire acond./Plumillas)
* **Wrench** (Mantenimiento general)
* **Sparkles** (Detallado/Polichado premium)
* **Key** (Duplicados/Llaves de proximidad)

---

## 4. Cambios en la Vista de Administración (`AdministracionClientView.tsx`)

### Diseño del Catálogo de Servicios (Cuadrícula de Columnas)
* **Cuadrícula Responsiva**: En lugar de una lista vertical larga, el catálogo se distribuirá en una cuadrícula de al menos 3 columnas (`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4`).
* **Tarjetas Tipo Bloque**: Las tarjetas de los servicios serán compactas (similares a los bloques de la vista de recepción).
  * **Diseño**: Esquinas redondeadas, sombra sutil, un borde limpio y tamaño reducido.
  * **Estructura**: El icono del servicio se mostrará a la izquierda en un contenedor redondeado destacado, seguido del nombre y las insignias de estado.
  * **Botones Flotantes / Hover**: Los botones de acción de "Editar" y "Eliminar" se mostrarán en la esquina superior derecha o al extremo derecho, mostrándose suavemente en hover (en desktop) y siempre visibles (en dispositivos móviles/táctiles).

### Formulario en Modal Emergente
* **Remoción de Sidebar Estático**: Se elimina el formulario lateral/estático que quedaba al fondo de la pantalla.
* **Modal de Creación y Edición**: Al hacer clic en "+ Crear Nuevo Servicio" o en "Editar" (lápiz), se abrirá un Modal centrado con fondo difuminado (`backdrop-blur-xs bg-black/45`) y animación de transición suave (`0.2s ease-out` de escala y opacidad).
* **Campos del Modal**:
  * Input de texto para el nombre.
  * Selector visual de icono en grid de 6 columnas.
  * Selector del estado de "más vendido" y estado "activo/inactivo".
  * Botones de "Guardar" y "Cancelar".

### Diálogo de Confirmación
* Se agregará un diálogo de confirmación adicional ("¿Desea crear este servicio?" o "¿Desea guardar los cambios?") que aparecerá sobre el modal del formulario para doble confirmación segura.


---

## 5. Cambios en la Vista de Recepción

### Ordenamiento de Servicios en `src/app/(authenticated)/recepcion/page.tsx`
Actualizaremos el query de Prisma para que ordene los servicios con `isTopSelling` descendente primero, y luego por orden alfabético (`name` ascendente):

```typescript
const services = await prisma.serviceCatalog.findMany({
  where: { isActive: true },
  orderBy: [
    { isTopSelling: "desc" },
    { name: "asc" },
  ],
});
```

### Visualización de Iconos en `RecepcionForm.tsx`
* Actualizaremos el tipado de `ServiceData` para aceptar `icon` y `isTopSelling`.
* Modificaremos `getServiceIcon` para que compruebe si `service.icon` está definido en la base de datos y retorne ese icono del registro. Si no está definido, utilizará la heurística de nombres anterior como fallback para asegurar retrocompatibilidad absoluta.
