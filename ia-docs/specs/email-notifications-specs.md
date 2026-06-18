# Especificación de Notificaciones por Correo Electrónico

Este documento detalla el funcionamiento, las plantillas y los archivos que componen el sistema de notificaciones por correo electrónico de **Casa Tuning**, el cual utiliza **Resend** como proveedor de envío de correos y **Cloudflare R2** para almacenar los adjuntos y recursos visuales.

---

## 1. Arquitectura y Archivos Involucrados

El flujo de notificaciones y la renderización de las plantillas de correo electrónico se gestionan a través de los siguientes archivos en la base de código:

### Núcleo de Notificaciones
* **[emails.ts](file:///d:/romer/REN/proyectos/casa-tuning/src/lib/emails.ts):** Centraliza la inicialización de la biblioteca de Resend, la obtención de los recursos visuales (como el logo oficial) y define el diseño HTML/CSS inline de cada una de las plantillas de correo.
* **[storage.ts](file:///d:/romer/REN/proyectos/casa-tuning/src/lib/storage.ts):** Encapsula el cliente de Cloudflare R2 (S3-compatible) y proporciona utilidades para almacenar las firmas, evidencias fotográficas, y las fichas técnicas generadas en PDF para adjuntarlas a los correos.
* **[pdf-generator.ts](file:///d:/romer/REN/proyectos/casa-tuning/src/lib/pdf-generator.ts):** Compila dinámicamente en memoria la ficha técnica en PDF utilizando `pdfkit`, para que sea subida a R2 y adjuntada en el correo de entrega del vehículo.

### Desencadenadores de Envío (Server Actions)
* **[actions.ts (Recepción)](file:///d:/romer/REN/proyectos/casa-tuning/src/app/(authenticated)/recepcion/actions.ts):** En la acción `createOrderAction`, tras guardar una orden y subir sus firmas y fotos a R2, se invoca `sendReceptionEmail` de forma asíncrona para notificar al cliente el ingreso de su vehículo.
* **[actions.ts (Órdenes)](file:///d:/romer/REN/proyectos/casa-tuning/src/app/(authenticated)/ordenes/actions.ts):** En la acción `updateOrderStatusAction`, si el estado de la orden cambia a `ENTREGADO` y el cliente tiene un correo electrónico configurado, se dispara `sendDeliveryEmail` adjuntando la factura y la ficha técnica final.
* **[actions.ts (Administración)](file:///d:/romer/REN/proyectos/casa-tuning/src/app/(authenticated)/administracion/actions.ts):** En `createUserAction`, tras registrar un nuevo operador o administrador, envía las credenciales de acceso temporal con `sendWelcomeEmail`.

---

## 2. Plantillas de Correo Electrónico

Todas las plantillas comparten una estructura visual premium alineada con la identidad corporativa de Casa Tuning (paleta de colores oscuros `#0a0a0c`, acentos dorados `#C9A84C` y tipografía moderna).

---

### A. Correo de Recepción de Vehículo (`sendReceptionEmail`)
Este correo se envía al cliente inmediatamente después de ingresar el vehículo al taller. Sirve como un comprobante digital del estado del auto en recepción.

#### Contenido y Estructura:
1. **Encabezado Temático:** Logotipo oficial de Casa Tuning centrado sobre fondo degradado oscuro y el subtítulo *"Ficha Técnica de Recepción"*.
2. **Mensaje de Saludo:** Mensaje personalizado con el nombre del cliente.
3. **Resumen de Ingreso:** Tabla de dos columnas que especifica:
   * **Vehículo:** Marca, modelo, año y placa.
   * **Orden:** Código único de orden y fecha/hora de ingreso formateada (`formatDate`).
4. **Servicios Solicitados:** Tarjeta destacada con fondo crema que resalta los servicios contratados por el cliente.
5. **Checklist de Estado (2 Columnas):** Cuadrícula detallada con el estado de cada componente inspeccionado (Farolas, Rines, Pintura, Vidrios, etc.). Cada componente muestra un badge con colores de estado:
   * **Bueno / No:** Badge verde (`#f0fdf4` / `#166534`).
   * **Malo / Sí:** Badge rojo (`#fef2f2` / `#991b1b`).
   * **N/A:** Badge gris (`#f4f4f5` / `#71717a`).
6. **Galería de Evidencias:** Si hay fallos registrados con fotos de respaldo, se muestra la sección *"Registros Fotográficos de Evidencia"* donde se agrupan las fotos correspondientes en tamaño miniatura organizadas por cada componente dañado.
7. **Observaciones:** Caja con fondo gris que muestra notas adicionales tomadas por el operador.
8. **Firma Digital:** Firma manuscrita del cliente tomada en la recepción y guardada en R2, incrustada en el pie de página del correo como señal de conformidad.

---

### B. Correo de Entrega de Vehículo (`sendDeliveryEmail`)
Este correo se despacha automáticamente cuando el estado de la orden transiciona a `ENTREGADO` y el vehículo está listo para ser retirado.

#### Contenido y Estructura:
1. **Encabezado Temático:** Logotipo oficial y subtítulo *"Servicio Completado"*.
2. **Mensaje de Entrega:** Mensaje de felicitación verde con el texto *"¡Tu vehículo está listo!"* detallando la culminación del servicio para el auto y placa específicos.
3. **Generación e Integración de PDFs:**
   * Genera asíncronamente el PDF de la **Ficha Técnica** final usando `generateOrderPdf`.
   * Sube el PDF a R2 en la ruta `/technical-sheets/sheet-[code].pdf`.
   * Adjunta físicamente el PDF de la Ficha Técnica y el PDF de la Factura (si fue cargada por el operador) en el correo por medio de la API de Resend.
4. **Panel de Descargas:** Caja con fondo gris claro que lista los documentos adjuntos y proporciona enlaces directos de descarga pública en R2 para que el cliente pueda visualizarlos en cualquier navegador.

---


## 3. Parámetros y Medidas de Seguridad

Para garantizar la estabilidad del servicio y evitar envíos duplicados o caídas:
* **Idempotencia (Idempotency Keys):** Cada método de envío utiliza la funcionalidad de claves de idempotencia de Resend (`idempotencyKey`), construidas dinámicamente con el identificador único del recurso (ej: `delivery-email-${order.id}`). Esto asegura que, en caso de reintentos de red o clics repetidos, el servidor de Resend ignore las llamadas duplicadas y envíe un único correo al usuario.
* **Envío Asíncrono:** La llamada a las funciones de envío de correo se realiza de forma asíncrona no bloqueante (fuera de la transacción de la base de datos de Prisma), para evitar retrasos en el rendimiento de la interfaz del operador al finalizar una recepción o entrega.
* **Verificación de API Key:** El sistema valida si `RESEND_API_KEY` está definido antes de ejecutar el llamado a la API. Si no está configurada, escribe un mensaje de advertencia (`console.warn`) en el log y continúa sin interrumpir el flujo operativo de la aplicación.
