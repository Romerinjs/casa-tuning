# Casa Tuning — API e integraciones

## 1. Alcance

Casa Tuning no expone hoy una API REST pública versionada. La lógica de negocio se consume principalmente mediante **Server Actions de Next.js**, que son contratos internos entre componentes React y el servidor.

Para firmas, permisos y efectos de cada función, consulte [6_catalogo_de_funciones.md](./6_catalogo_de_funciones.md).

Solo se identifican dos superficies HTTP explícitas:

1. Auth.js en `/api/auth/[...nextauth]`.
2. Cron de recordatorios en `GET /api/cron/reminders`.

Esta distinción es obligatoria: una Server Action no debe ofrecerse a terceros como endpoint estable. Cualquier integración nueva debe usar un Route Handler versionado o un consumidor asíncrono con contrato documentado.

## 2. Topología de interfaces

```mermaid
flowchart LR
    UI[React UI] --> SA[Server Actions internas]
    UI --> AUTH[Auth.js Route Handler]
    CRON[Scheduler] --> RH[/api/cron/reminders]
    SA --> DB[(PostgreSQL)]
    SA --> R2[Cloudflare R2]
    SA --> RESEND[Resend]
    SA --> KAPSO[Kapso / Meta API]
    RH --> DB
    RH --> KAPSO
```

## 3. Convención de resultados internos

Las acciones actuales devuelven objetos similares, pero no comparten un tipo central. Todo desarrollo nuevo debe adoptar un resultado discriminado:

```ts
export type ActionResult<T> =
  | {
      success: true;
      data: T;
      correlationId: string;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        fields?: Record<string, string[]>;
      };
      correlationId: string;
    };
```

No se deben devolver excepciones, SQL, nombres de tablas, credenciales ni respuestas completas de proveedores al navegador.

## 4. Autenticación y autorización

### 4.1 Sesión de usuario

- Mecanismo: Auth.js/NextAuth v5 beta.
- Proveedor: `Credentials`.
- Sesión: JWT.
- Claims añadidos: `id`, `role`.
- Verificación adicional: consulta a PostgreSQL para comprobar `isActive`.

### 4.2 Guardas

| Guarda | Uso |
|---|---|
| `verifySession()` | Dashboard, reservas, recepción y órdenes. |
| `verifyAdminSession()` | Clientes, vehículos, promociones y administración. |

Toda acción debe verificar autorización por sí misma. No basta con que la página padre tenga una guarda.

### 4.3 Autenticación máquina a máquina

El cron acepta actualmente:

```http
Authorization: Bearer <CRON_SECRET>
```

También acepta `?key=<CRON_SECRET>`. Este segundo método debe retirarse porque los query strings aparecen con facilidad en historiales, proxies y logs.

## 5. Route Handlers vigentes

### 5.1 Auth.js

| Método | Ruta | Propósito |
|---|---|---|
| `GET` | `/api/auth/[...nextauth]` | Flujos internos de sesión requeridos por Auth.js. |
| `POST` | `/api/auth/[...nextauth]` | Inicio/cierre y callbacks internos de Auth.js. |

No se debe construir un cliente externo contra estas rutas. Su contrato pertenece a la versión instalada de Auth.js.

### 5.2 Recordatorios automáticos

#### Solicitud

```http
GET /api/cron/reminders HTTP/1.1
Host: staging.example.com
Authorization: Bearer <CRON_SECRET>
```

#### Comportamiento actual

1. Obtiene la hora actual.
2. Calcula una ventana de 24 horas.
3. Busca reservas `PENDIENTE`, sin recordatorio y dentro de la ventana.
4. Envía recordatorios secuencialmente.
5. Cuenta envíos exitosos.

#### Respuesta exitosa

```json
{
  "success": true,
  "timestamp": "2026-09-04T15:30:00.000Z",
  "found": 4,
  "remindersSent": 3
}
```

#### Respuestas de error

| HTTP | Código lógico | Condición |
|---:|---|---|
| `401` | `UNAUTHORIZED` | Token ausente o incorrecto en producción. |
| `500` | `REMINDER_JOB_FAILED` | Fallo no controlado del proceso. |

La respuesta actual solo contiene `error` textual. El código lógico es parte del contrato objetivo.

#### Brechas de seguridad

- Existe un secreto por defecto en código.
- En un entorno distinto de producción se permite ejecutar sin autorización válida.
- Se permite secreto en query string.
- No existe rate limit ni protección contra ejecución simultánea.

Contrato obligatorio para staging/producción:

```ts
if (!process.env.CRON_SECRET) {
  throw new Error("CRON_SECRET is required");
}
```

Además, el job debe adquirir un lock o usar una clave de idempotencia por reserva y ventana.

## 6. Catálogo de Server Actions

### 6.1 Identidad

| Acción | Autorización | Entrada | Salida / efecto |
|---|---|---|---|
| `authenticate` | Pública | `FormData(email,password)` | Crea sesión y redirige a Dashboard. |
| `logoutAction` | Sesión | Sin datos | Destruye sesión y redirige a Login. |

### 6.2 Reservas

| Acción | Autorización | Entrada principal | Efectos |
|---|---|---|---|
| `createReservationAction` | Usuario | Cliente, fecha, vehículo, servicios, notas | Upsert lógico de cliente, crea reserva/servicios y agenda confirmación WhatsApp. |
| `updateReservationAction` | Usuario | `reservationId`, fecha, estado, vehículo, servicios | Actualiza cabecera y reemplaza servicios en transacción. |
| `cancelReservationAction` | Usuario | `reservationId` | Cambia estado a `CANCELADA`. |
| `sendManualReminderAction` | Usuario | `reservationId` | Envía plantilla y marca recordatorio. |
| `getReservationForReceptionAction` | Usuario | `reservationId` | Devuelve reserva completa para precarga. |

### 6.3 Recepción

| Acción | Autorización | Entrada principal | Efectos |
|---|---|---|---|
| `createOrderAction` | Usuario | `FormData` de recepción | Crea o edita orden; procesa efectos posteriores. |

Si `orderId` está presente, delega en la edición interna. Si `reservationId` está presente al crear, la reserva se marca atendida.

### 6.4 Órdenes

| Acción | Autorización | Entrada | Efectos |
|---|---|---|---|
| `updateOrderStatusAction` | Usuario | `orderId`, `newStatusName` | Cambia estado, registra actividad y notifica al entregar. |
| `uploadDeliveryPdfAction` | Usuario | `orderId`, archivo | Sube PDF, vincula URL y registra actividad. |
| `deleteDeliveryPdfAction` | Usuario | `orderId` | Intenta borrar objeto, limpia URL y registra actividad. |
| `addOrderCommentAction` | Usuario | `orderId`, texto | Crea comentario y actividad. |
| `downloadOrderPdfAction` | Usuario | `orderId` | Genera, publica y devuelve URL de ficha técnica. |
| `saveOrderSignatureAction` | Usuario | `orderId`, data URL | Sube firma, actualiza orden, regenera PDF y puede notificar. |

### 6.5 Clientes

| Acción | Autorización | Entrada | Efectos |
|---|---|---|---|
| `createClientAction` | Administrador | Datos de identidad/contacto | Valida unicidad, cifra documento y crea cliente. |
| `updateClientAction` | Administrador | ID + datos | Actualiza y conserva/cambia/elimina documento según entrada. |
| `createCarAction` | Administrador | Cliente + vehículo | Crea vehículo desde ficha de cliente. |
| `uploadClientPhotoAction` | Administrador | Cliente + data URL | Sustituye foto en R2 y actualiza URL. |

### 6.6 Vehículos

| Acción | Autorización | Entrada | Efectos |
|---|---|---|---|
| `createCarAdminAction` | Administrador | Cliente, placa, marca, año, modelo, color | Crea vehículo activo. |
| `updateCarAdminAction` | Administrador | ID + vehículo + estado | Actualiza datos, propietario y activación. |

### 6.7 Administración

| Acción | Autorización | Entrada | Efectos |
|---|---|---|---|
| `createServiceAction` | Administrador | Nombre, icono, destacados, activo | Crea servicio. |
| `updateServiceAction` | Administrador | ID + campos | Actualiza servicio. |
| `deleteServiceAction` | Administrador | ID | Elimina solo si no está en uso. |
| `createBrandAction` | Administrador | Nombre + logo | Sube logo y crea marca. |
| `updateBrandAction` | Administrador | ID + nombre/logo | Sustituye logo y actualiza marca. |
| `createUserAction` | Administrador | Nombre, correo, contraseña, rol | Crea usuario y envía bienvenida. |
| `sendTestSoundTemplateAction` | Administrador | Teléfono | Envía plantilla de prueba. |

### 6.8 Promociones

| Acción | Autorización | Entrada | Efectos |
|---|---|---|---|
| `getPresignedUploadUrlAction` | Administrador | Nombre, MIME | Devuelve URL de subida y URL pública. |
| `getWhatsAppTemplatesAction` | Administrador | Sin datos | Consulta plantillas aprobadas. |
| `createPromotionAction` | Administrador | Campaña + JSON de clientes | Crea campaña e inicia envíos secuenciales. |

## 7. Validación de entradas

### 7.1 Reglas obligatorias

- Validar nuevamente en servidor aunque exista validación visual.
- Normalizar antes de comprobar unicidad.
- Rechazar IDs `NaN`, negativos o inexistentes.
- Validar pertenencia: un vehículo elegido debe corresponder al cliente o a una regla autorizada.
- Validar listas completas de IDs en una sola consulta.
- Cerrar estados con un tipo/enum y una política de transición.
- Limitar tamaño, MIME y contenido de archivos.

### 7.2 Esquema recomendado

```ts
import { z } from "zod";

const ReceptionSchema = z.object({
  clientName: z.string().trim().min(1).max(150),
  clientPhone: z.string().transform((value) => value.replace(/\D/g, ""))
    .pipe(z.string().length(10)),
  clientEmail: z.string().trim().email().max(150).optional().or(z.literal("")),
  plate: z.string().transform((value) => value.replace(/[^a-z0-9]/gi, "").toUpperCase())
    .pipe(z.string().min(5).max(6)),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  brandId: z.coerce.number().int().positive(),
  services: z.array(z.coerce.number().int().positive()).min(1),
});
```

Zod debe añadirse como dependencia directa si se usa fuera del paquete de autenticación.

## 8. Manejo de errores

### 8.1 Taxonomía objetivo

| Código | HTTP equivalente | Uso |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Campos inválidos. |
| `UNAUTHENTICATED` | 401 | Sin sesión. |
| `FORBIDDEN` | 403 | Rol insuficiente. |
| `NOT_FOUND` | 404 | Recurso inexistente. |
| `CONFLICT` | 409 | Teléfono, documento, placa o código duplicado. |
| `INVALID_TRANSITION` | 409 | Cambio de estado no permitido. |
| `PROVIDER_UNAVAILABLE` | 502/503 | Kapso, Resend o R2 no disponible. |
| `RATE_LIMITED` | 429 | Límite propio o externo. |
| `INTERNAL_ERROR` | 500 | Fallo inesperado sin detalle sensible. |

### 8.2 Ejemplo de error público futuro

```json
{
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "La orden no puede pasar de RECIBIDO a ENTREGADO.",
    "details": {
      "currentState": "RECIBIDO",
      "requestedState": "ENTREGADO"
    }
  },
  "correlationId": "req_01J7C9M4Y4KFY6Q2N1NQ"
}
```

### 8.3 Registro interno

El log debe contener contexto, no secretos:

```json
{
  "level": "error",
  "event": "notification.send.failed",
  "correlationId": "req_01J7C9M4Y4KFY6Q2N1NQ",
  "channel": "WHATSAPP",
  "template": "vehiculo_recibido",
  "orderId": 42,
  "providerStatus": 503
}
```

No registrar payloads completos si contienen teléfonos, correo, documento o URLs firmadas.

## 9. Cloudflare R2

### 9.1 Responsabilidades

- Subida de `Buffer`.
- Conversión y subida de Base64.
- Borrado por URL o clave.
- URL prefirmada para subida directa.

### 9.2 Configuración

| Variable | Uso |
|---|---|
| `R2_ACCOUNT_ID` | Construye endpoint S3. |
| `R2_ACCESS_KEY_ID` | Credencial de acceso. |
| `R2_SECRET_ACCESS_KEY` | Secreto. |
| `R2_BUCKET_NAME` | Bucket. |
| `R2_PUBLIC_URL` | URL base de lectura. |

### 9.3 Convención de claves actual

```text
signatures/sig-<secuencia>.<ext>
checklist-images/<order-code>-<criterio>-<índice>.<ext>
evidences/order-<id>/<criterio>-<índice>-<timestamp>.<ext>
technical-sheets/sheet-<order-code>.pdf
delivery-documents/pdf-<order-id>.pdf
clients/avatar-<client-id>-<timestamp>.<ext>
brands/logo-<slug>-<timestamp>.<ext>
promotions/<timestamp>-<filename>
```

### 9.4 URL prefirmada

- Operación: `PUT`.
- Expiración por defecto: 3.600 segundos.
- `Content-Type` forma parte del comando firmado.
- La respuesta contiene `uploadUrl` sensible y `fileUrl` final.

Ejemplo de flujo:

```json
{
  "success": true,
  "uploadUrl": "https://<signed-r2-url>",
  "fileUrl": "https://cdn.example.com/promotions/1725462000000-campana.jpg"
}
```

El navegador debe usar `uploadUrl` una vez y persistir solo `fileUrl` después de confirmar la carga. Configurar CORS del bucket para orígenes y métodos mínimos.

### 9.5 Directrices

- No aceptar MIME arbitrario.
- Definir tamaño máximo por caso de uso.
- Evitar objetos públicos para PII y firmas; preferir acceso privado con URL firmada corta.
- Usar nombres no adivinables para recursos sensibles.
- Validar que una URL a borrar pertenezca al bucket esperado.
- Registrar checksum y tamaño en una tabla de metadatos futura.

## 10. Resend

### 10.1 Eventos implementados

| Función | Plantilla lógica | Idempotency key actual |
|---|---|---|
| `sendWelcomeEmail` | Bienvenida de usuario | `welcome-email/<userId>` |
| `sendReceptionEmail` | Recepción | `reception-email-<orderId>` |
| `sendDeliveryEmail` | Entrega + ficha técnica | `delivery-email-<orderId>` |
| `sendReadyEmail` | Vehículo listo | `ready-email-<orderId>` |

`sendReadyEmail` existe, pero el flujo de estado auditado no lo invoca.

### 10.2 Comportamiento

- Si `RESEND_API_KEY` no está configurada, el adaptador retorna fallo controlado.
- `RESEND_FROM_EMAIL` cae en `onboarding@resend.dev`; no usar ese fallback en producción.
- La entrega genera una ficha técnica y la adjunta si la generación fue exitosa.

### 10.3 Reglas de integración

1. Verificar dominio remitente en Resend.
2. Separar versión de plantilla en la clave de idempotencia cuando se permita reenvío legítimo.
3. Guardar `providerMessageId`, estado y error sanitizado.
4. Consumir webhooks firmados para entrega, rebote y queja.
5. No enviar contraseñas permanentes.

## 11. Kapso / Meta WhatsApp Cloud API

### 11.1 Endpoints salientes

```text
POST <KAPSO_API_BASE_URL>/meta/whatsapp/v24.0/<PHONE_NUMBER_ID>/messages
GET  <KAPSO_API_BASE_URL>/meta/whatsapp/v24.0/<WABA_ID>/message_templates?limit=100
```

Header:

```http
X-API-Key: <KAPSO_API_KEY>
Content-Type: application/json
```

### 11.2 Plantillas usadas

| Nombre | Idioma | Evento |
|---|---|---|
| `vehiculo_recibido` | `es_MX` | Recepción creada. |
| `vehiculo_entregado` | `es_MX` | Entrega con firma. |
| `recomendaciones_servicio` | `es_MX` | Cuidados para polarizado, PPF o radio/pantalla. |
| `reserva_confirmada_2` | `es_MX` | Reserva creada. |
| `recordatorio_cita_2` | `es_MX` | Recordatorio manual/automático. |
| Plantilla elegida | `es_MX` | Campaña. |
| `prueba_de_sonido_2` | `es_MX` | Verificación administrativa. |

El aviso de vehículo listo se envía actualmente como texto libre, no como plantilla.

### 11.3 Ejemplo de recepción

```json
{
  "messaging_product": "whatsapp",
  "to": "+573001234567",
  "type": "template",
  "template": {
    "name": "vehiculo_recibido",
    "language": { "code": "es_MX" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "parameter_name": "customer_name", "text": "Cliente Ejemplo" },
          { "type": "text", "parameter_name": "vehicle_name", "text": "Mazda 3" },
          { "type": "text", "parameter_name": "plate", "text": "ABC123" },
          { "type": "text", "parameter_name": "services_list", "text": "Polarizado" }
        ]
      },
      {
        "type": "button",
        "sub_type": "url",
        "index": "0",
        "parameters": [
          { "type": "text", "text": "sheet-CT-2026-0001.pdf" }
        ]
      }
    ]
  }
}
```

### 11.4 Campañas

El cuerpo mapea:

1. `customer_name`.
2. `service_name`.
3. `brand_name`.

Si existe `fileUrl`, la extensión decide `image`, `video` o `document`. Esta inferencia es frágil: el contrato objetivo debe leer el formato real de la plantilla y validar el MIME subido.

### 11.5 Entrega y webhooks

No existen webhooks entrantes implementados. Por ello `SENT` significa que la llamada fue aceptada por Kapso, no que el mensaje llegó o fue leído.

Estado objetivo:

```text
POST /api/webhooks/kapso
  ├── verificar firma y timestamp
  ├── deduplicar eventId
  ├── guardar evento crudo sanitizado
  ├── actualizar estado del mensaje
  └── responder 2xx rápidamente
```

## 12. PDFKit

`generateOrderPdf(orderId)` consulta la orden con:

- cliente y tipo de documento;
- vehículo y marca;
- servicios;
- comentarios y autores;
- checklist y evidencias;
- observaciones;
- firma.

Devuelve un `Buffer` PDF tamaño carta. La función obtiene imágenes remotas desde R2 y debe tratar timeouts y MIME no válidos.

La ficha técnica no es una factura fiscal. El campo `deliveryPdfUrl` representa un documento cargado por el usuario, separado de la ficha técnica generada.

## 13. Webhooks: contrato futuro

Todo webhook nuevo debe:

1. Verificar firma con el cuerpo crudo.
2. Rechazar timestamps fuera de ventana.
3. Deduplicar por identificador del proveedor.
4. Responder rápido y procesar de forma asíncrona.
5. Conservar un registro auditable sin PII innecesaria.
6. Tolerar eventos fuera de orden.
7. No confiar en nombres de plantilla o IDs aportados por el cliente.

Respuesta recomendada:

```json
{
  "received": true,
  "eventId": "provider_event_123"
}
```

## 14. Diseño de una API pública futura

### 14.1 Principios

- Prefijo `/api/v1`.
- JSON UTF-8.
- Autenticación máquina a máquina independiente de cookies de personal.
- Idempotency key obligatoria para `POST` reintentable.
- Paginación por cursor.
- Versionado explícito y política de deprecación.
- OpenAPI revisado antes de implementar.

### 14.2 Recursos candidatos

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `/api/v1/reservations` | Crear reserva desde un canal externo. |
| `GET` | `/api/v1/reservations/{id}` | Consultar reserva autorizada. |
| `POST` | `/api/v1/orders/{id}/status-transitions` | Solicitar transición válida. |
| `GET` | `/api/v1/orders/{id}` | Consultar estado y datos mínimos. |
| `POST` | `/api/v1/webhooks/subscriptions` | Registrar destino de eventos. |

Estas rutas son propuestas; no existen en el código actual.

### 14.3 Ejemplo de comando idempotente

```http
POST /api/v1/reservations HTTP/1.1
Authorization: Bearer <integration-token>
Idempotency-Key: partner-a-booking-9842
Content-Type: application/json
```

```json
{
  "customer": {
    "name": "Cliente Ejemplo",
    "phone": "+573001234567",
    "email": "cliente@example.com"
  },
  "vehicle": {
    "plate": "ABC123",
    "brandId": 3,
    "model": "3"
  },
  "scheduledAt": "2026-09-05T14:00:00-05:00",
  "serviceIds": [1, 4]
}
```

## 15. Directrices para nuevas integraciones

### 15.1 Puerto antes que proveedor

El dominio depende de una interfaz propia. El adaptador contiene URLs, headers y payloads del proveedor.

### 15.2 Configuración validada al inicio

No usar secretos por defecto. El proceso debe fallar claramente en staging/producción si falta configuración obligatoria.

### 15.3 Timeouts, reintentos y circuit breaker

- Timeout finito por solicitud.
- Reintento solo para fallos transitorios.
- Backoff exponencial con jitter.
- No reintentar automáticamente errores 4xx permanentes.
- Clave idempotente estable.
- Circuit breaker para evitar cascadas.

### 15.4 Outbox

La transacción guarda el cambio de negocio y un evento pendiente. Un worker lo entrega y actualiza sus intentos:

```json
{
  "eventType": "order.received",
  "aggregateId": "42",
  "idempotencyKey": "order:42:received:v1",
  "payloadVersion": 1,
  "status": "PENDING",
  "attempts": 0
}
```

### 15.5 Observabilidad

Medir al menos:

- latencia y error por proveedor;
- mensajes pendientes/fallidos;
- edad del evento más antiguo;
- tasas de entrega/rebote cuando existan webhooks;
- objetos R2 fallidos o huérfanos;
- ejecuciones de cron y duplicados evitados.

## 16. Checklist de integración

- [ ] Contrato y propietario definidos.
- [ ] Autenticación y mínimo privilegio.
- [ ] Secretos fuera del repositorio.
- [ ] Esquema de entrada y salida validado.
- [ ] Timeout y política de reintento.
- [ ] Idempotencia demostrada.
- [ ] Manejo de rate limit.
- [ ] Logs sin PII o secretos.
- [ ] Métricas y alertas.
- [ ] Sandbox o ambiente de prueba.
- [ ] Plan de caída del proveedor.
- [ ] Pruebas de contrato.
- [ ] Política de versión y deprecación.
