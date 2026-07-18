# Especificación de Diseño: Módulo de Promociones, Gestión de Vehículos y Mejoras del Taller

Este documento detalla la especificación técnica de los cambios a realizar en la base de datos, backend y frontend para la implementación del módulo de promociones con envíos por WhatsApp de Kapso, gestión independiente de vehículos para administradores, validaciones de no duplicidad de datos en clientes, caché de recursos en Cloudflare R2, correcciones en el diseño de administración y mejoras de usabilidad móvil (compresión de imágenes y descargas).

---

## 1. Cambios en la Base de Datos (Prisma)

### Modificación del Modelo `Car`
Modificaremos el modelo `Car` en `prisma/schema.prisma` para:
1. Remover el atributo `@unique` del campo `plate`.
2. Añadir el campo `isActive` de tipo booleano (`Boolean @default(true) @map("is_active")`) para poder activar/desactivar vehículos (ej. por venta).
3. Añadir una restricción compuesta de unicidad `@@unique([plate, clientId])` para evitar que un mismo cliente registre dos vehículos con la misma placa, pero permitiendo que diferentes clientes tengan registros separados del mismo vehículo (estando uno inactivo).

```prisma
model Car {
  id       Int     @id @default(autoincrement())
  plate    String  @db.VarChar(10)
  type     String  @default("Automóvil") @db.VarChar(30)
  model    String  @db.VarChar(100)
  year     Int
  color    String  @db.VarChar(50)
  isActive Boolean @default(true) @map("is_active")

  clientId Int    @map("client_id")
  client   Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
  brandId  Int    @map("brand_id")
  brand    Brand  @relation(fields: [brandId], references: [id])

  orders Order[]

  @@unique([plate, clientId])
  @@index([clientId])
  @@index([brandId])
  @@map("cars")
}
```

### Nuevos Modelos para Promociones y Campañas de WhatsApp
Añadiremos los modelos `Promotion` y `PromotionClient` para almacenar el historial de campañas de mercadeo y el estado de entrega por WhatsApp:

```prisma
model Promotion {
  id           Int               @id @default(autoincrement())
  name         String            @db.VarChar(150)
  templateName String            @map("template_name") @db.VarChar(100)
  fileUrl      String?           @map("file_url") @db.Text
  createdAt    DateTime          @default(now()) @map("created_at")
  
  serviceId    Int               @map("service_id")
  service      ServiceCatalog    @relation(fields: [serviceId], references: [id])
  brandId      Int               @map("brand_id")
  brand        Brand             @relation(fields: [brandId], references: [id])
  
  clients      PromotionClient[]

  @@map("promotions")
}

model PromotionClient {
  promotionId Int      @map("promotion_id")
  clientId    Int      @map("client_id")
  sentAt      DateTime @default(now()) @map("sent_at")
  status      String   @default("SENT") @db.VarChar(20) // SENT | FAILED

  promotion   Promotion @relation(fields: [promotionId], references: [id], onDelete: Cascade)
  client      Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@id([promotionId, clientId])
  @@map("promotion_clients")
}
```

---

## 2. Cambios en el Backend (Server Actions y APIs)

### A. Registro y Actualización de Clientes (Unicidad)
Ubicación: `src/app/(authenticated)/clientes/actions.ts` y `src/app/(authenticated)/recepcion/actions.ts`.
Añadiremos validaciones manuales antes de insertar o actualizar clientes para evitar registros duplicados en:
1. **Celular (`phone`):** Ya cuenta con `@unique` en base de datos. Se maneja capturando el error en el frontend.
2. **Correo Electrónico (`email`):** Si se ingresa un correo, validamos que no exista otro cliente con dicho correo:
   ```typescript
   const existingEmail = await prisma.client.findFirst({
     where: { email: cleanEmail, NOT: id ? { id } : undefined }
   });
   if (existingEmail) return { success: false, error: "El correo electrónico ya está registrado con otro cliente." };
   ```
3. **Número de Documento (`documentNumberHash`):** Validamos que no exista otro cliente con el mismo número de documento cifrado:
   ```typescript
   const existingDoc = await prisma.client.findFirst({
     where: { documentNumberHash: hash, NOT: id ? { id } : undefined }
   });
   if (existingDoc) return { success: false, error: "El número de documento ya está registrado con otro cliente." };
   ```

### B. Omitir Documento en Recepción de Vehículos
En `createOrderAction` y `createClientAction` sanitizaremos la entrada del ID del tipo de documento para evitar que un string vacío genere un valor `NaN` e invalide la consulta de Prisma:
```typescript
const documentTypeIdStr = formData.get("documentTypeId") as string;
const documentTypeId = (documentTypeIdStr && !isNaN(parseInt(documentTypeIdStr, 10)))
  ? parseInt(documentTypeIdStr, 10)
  : null;
```

### C. Validación de Placa Única Activa
Al registrar o buscar un vehículo, reemplazaremos el uso de `findUnique` por una comprobación de vehículo activo:
```typescript
const existingActiveCar = await prisma.car.findFirst({
  where: { plate: cleanPlate, isActive: true }
});
if (existingActiveCar) {
  return { success: false, error: `El vehículo con placa ${cleanPlate} ya está registrado y activo en el sistema.` };
}
```
Si existe una placa inactiva (ej. del anterior dueño), la consulta retornará `null` y el sistema permitirá registrar el vehículo con el nuevo cliente dueño de forma transparente.

### D. Firma de URL para Subidas Directas a Cloudflare R2 (Campañas de 50MB)
Crearemos una Server Action `getPresignedUploadUrlAction` en `src/app/(authenticated)/administracion/actions.ts` utilizando `@aws-sdk/s3-request-presigner` y `PutObjectCommand` de AWS SDK para generar una URL segura y temporal de subida. El cliente la usará para subir archivos directo a R2.

### E. Integración de Envío de WhatsApp con Kapso
En `src/lib/whatsapp.ts`, crearemos la acción `sendWhatsAppPromotionAction` que recibirá los datos del cliente, la promoción y la URL del archivo de cabecera multimedia.
* Consultará las plantillas de la cuenta de WhatsApp Business para identificar el formato del encabezado (`IMAGE`, `VIDEO`, `DOCUMENT`).
* Estructurará el payload de Kapso inyectando el enlace multimedia en el componente `header` y los datos dinámicos mapeados del cliente (1 = Cliente, 2 = Servicio, 3 = Marca) en el componente `body`.
* Realizará el envío en un bucle secuencial en segundo plano con un retraso (delay) de 200ms entre cada mensaje para mitigar límites de tasa (rate limits).

### F. Caché Persistente en Cloudflare R2
Actualizaremos `uploadBuffer` en `src/lib/storage.ts` añadiendo el metadato `CacheControl`:
```typescript
await client.send(
  new PutObjectCommand({
    Bucket: bucketName!,
    Key: normalizedKey,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable"
  })
);
```

---

## 3. Cambios en el Frontend (Interfaz de Usuario)

### A. Módulo de Vehículos para Administrador (`/vehiculos`)
Crearemos una interfaz CRUD idéntica en estética al módulo de clientes, disponible únicamente para administradores bajo la ruta `/vehiculos`:
* **Lista e Historial:** Tarjetas de vehículos con visualización de placa, modelo, año, marca y estado activo/inactivo.
* **Detalle lateral (Drawer):** Al hacer clic, muestra los datos del auto, el dueño actual con link directo a WhatsApp y el historial de servicios realizados.
* **Formulario de Creación/Edición:** Selector de marca, campos de modelo, año, color, placa, estado (activo/inactivo) y un selector dinámico con buscador de clientes para vincular el dueño.

### B. Formulario de Recepción (`RecepcionForm.tsx`)
* **Integración y Bloqueo:** Si el usuario selecciona "Nuevo Cliente", forzaremos el estado `carMode = "new"` y deshabilitaremos la pestaña "Vehículo Existente". Añadiremos una advertencia textual indicando la restricción de que un cliente nuevo solo puede dar de alta un nuevo carro.
* **Compresión de Imágenes en Cliente:** Integraremos un proceso de redimensionamiento con canvas HTML5 en `handleImageUpload`. Las imágenes se reducirán a un máximo de 1280px con compresión JPEG al 70%, disminuyendo el tamaño de subida a unos 300KB por foto, optimizando el rendimiento en móviles y previniendo fallos por límite de peso de formulario.
* **Compatibilidad Móvil:** Haremos visible pero oculto por CSS el `<input type="file" />` para asegurar que el evento táctil en Android/iOS se propague de manera correcta.

### C. Módulo de Promociones (Pestaña en Administración)
Crearemos una pestaña adicional en el panel administrativo:
* **Formulario del Mockup:**
  * Campo de texto para el Nombre de la promoción.
  * Selector del Servicio catalogado.
  * Selector de la Marca del carro.
  * **Filtro dinámico de clientes:** Al seleccionar una marca, cargará automáticamente a todos los clientes vinculados a un auto activo de esa marca. Los renderizará en una grilla responsiva con checkboxes marcados por defecto. El administrador podrá desmarcar los que no desee incluir en la campaña.
  * **Cargador de Archivos (Drag & Drop / Mobile Upload):** Integrado con barra de progreso interactiva que realiza el upload directo a R2 usando la URL firmada.
  * **Envío:** El botón de "Crear" disparará el flujo asíncrono y notificará al administrador con un toast el inicio de la campaña en segundo plano.

### D. Corrección del Botón de Marcas
* En `AdministracionClientView.tsx`, cambiaremos la clase contenedora del FAB flotante de `sm:hidden` a `lg:hidden` para mantenerlo visible en tablets (donde el panel de formularios derecho está oculto).
* Añadiremos un botón estático de creación en el header de las listas de Marcas y Usuarios para pantallas medianas, garantizando un flujo intuitivo en cualquier dispositivo.

### E. Búsqueda por Marca de Carro en Órdenes
Actualizaremos el filtro de búsqueda textual en `OrdenesClientView.tsx` para incluir `order.car.brand.name` en la comparación de búsqueda.

### F. Añadir Número de Documento Interactivo en Clientes
* En `ClientesClientView.tsx` (Drawer de detalle lateral del cliente), cuando un cliente no posea un número de documento registrado (`documentNumber === null`), en lugar de omitir la sección, mostraremos el icono correspondiente junto a un botón interactivo que diga `"Añadir número de documento"`.
* Al hacer clic en este botón, se abrirá automáticamente el modal de edición del cliente (`isEditModalOpen = true`), permitiendo al administrador ingresar el tipo y número de documento de inmediato.

