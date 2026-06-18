# Especificación Técnica - Carga de PDF de Entrega y Notas de Servicio

Esta especificación detalla el diseño técnico, la estructura de datos, el flujo de llamadas de servidor y las decisiones de diseño frontend tomadas para soportar la carga de documentos PDF en órdenes listas para entregar y el historial interactivo de comentarios de servicio.

---

## 1. Diseño del Modelo de Datos

Se añaden los siguientes cambios en el archivo `prisma/schema.prisma`:

### Modelo `Order`
Se añade un campo opcional `deliveryPdfUrl` para almacenar la dirección o path del archivo cargado:
- Campo: `deliveryPdfUrl String? @map("delivery_pdf_url") @db.VarChar(255)`

### Modelo `OrderComment`
Representa una nota o comentario interno cargado por un operador o administrador durante las fases activas del servicio:
- Estructura:
  - `id`: Entero autoincremental (Clave primaria).
  - `content`: Texto enriquecido (`@db.Text`).
  - `createdAt`: Timestamp automático (`@default(now())`).
  - `orderId`: Clave foránea referenciando al modelo `Order` (con borrado en cascada).
  - `userId`: Clave foránea referenciando al modelo `User` (con borrado en cascada).

---

## 2. Flujo de Almacenamiento de Archivos (Mecanismo Cloudflare R2 / Mock Local)

Para la subida del PDF de entrega:
1. En producción, la aplicación utilizará un bucket en **Cloudflare R2** para almacenar estos archivos.
2. En desarrollo local y provisionalmente, la Server Action simula esta subida guardando los archivos binarios decodificados directamente en el sistema de archivos local de Next.js bajo la ruta `/public/uploads/pdfs/pdf-${orderId}.pdf` y guardando la ruta relativa en la base de datos.
3. Se incluye el código correspondiente para conectarse con un cliente S3 de AWS/Cloudflare (`@aws-sdk/client-s3`) comentado en las acciones para facilitar su futura activación.

Ejemplo de código comentado para Cloudflare R2:
```typescript
/*
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  region: "auto",
});

await r2Client.send(new PutObjectCommand({
  Bucket: process.env.R2_BUCKET_NAME,
  Key: `delivery-documents/pdf-${orderId}.pdf`,
  Body: fileBuffer,
  ContentType: "application/pdf",
}));
*/
```

---

## 3. Comentarios y Notas en la Ficha Técnica

El modal de la Ficha Técnica despliega un flujo de notas de servicio ordenadas cronológicamente por fecha de creación:
- **Estados Habilitados**:
  - Un usuario puede registrar una nota de progreso únicamente cuando la orden se encuentra en los estados `EN_PROCESO` ("En proceso") o `LISTO` ("Listo para entrega").
  - En los estados `RECIBIDO` y `ENTREGADO`, la sección se muestra en modo solo lectura, deshabilitando el formulario de envío.
- **Detalle del Comentario**:
  - Iniciales del usuario formateadas con fondo en gradiente dorado/bronce.
  - Nombre completo del autor y chip/badge con el nombre del rol (ej. `Administrador`, `Operador`).
  - Marca de fecha y hora exacta.
  - Mensaje en texto plano con preservación de saltos de línea (`whitespace-pre-wrap`).

---

## 4. UI/UX y Animaciones (Premium Frontend standard)

- **Cargador y Visor de PDF**:
  - En pantallas de escritorio y móvil, se renderiza debajo del pie de botones de la tarjeta de la orden para estados `LISTO`.
  - Si no existe el archivo en estado `LISTO`, el cargador de archivos se muestra como una zona interactiva con bordes discontinuos y un icono de documento.
  - Cuando se carga el archivo en `LISTO`, cambia al estado "Cargado" mostrando el icono oficial de PDF, el nombre de archivo con link a pestaña nueva, y el botón de remover (icono de papelera) en hover para computadoras y fijo en móviles.
  - **Accesibilidad en Entregado**: Una vez que la orden pasa a estado `ENTREGADO`, si existe un PDF de entrega previamente cargado, este se sigue mostrando de forma responsiva en la tarjeta y también se agrega una sección dedicada de visualización dentro de la Ficha Técnica (modal de detalles). En este estado de entrega final, el cargador de archivos y las opciones de eliminación (botón de papelera) se deshabilitan por completo para asegurar la lectura inmutable del documento.
- **Transiciones y spring physics**:
  - Los formularios, visores y comentarios aparecen con un suavizado de entrada (`animate-[scaleIn_0.15s_ease-out]`).
  - Los botones interactivos incorporan micro-interacciones táctiles en clic (`active:scale-[0.98]`).
