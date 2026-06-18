# Especificación de Notificaciones por WhatsApp (Kapso Integration)

Este documento detalla la planificación y especificaciones para integrar el envío de notificaciones por WhatsApp en la plataforma de **Casa Tuning** utilizando **Kapso** como pasarela API (Meta Proxy).

---

## 1. Arquitectura y Archivos Propuestos

Para lograr la misma lógica de negocio implementada con los correos electrónicos, proponemos estructurar la integración de WhatsApp a través de los siguientes archivos:

* **`src/lib/whatsapp.ts` (Nuevo):** Módulo núcleo de comunicación. Encapsula la inicialización del SDK `@kapso/whatsapp-cloud-api` y expone funciones reutilizables como `sendWhatsAppReceptionAction` y `sendWhatsAppDeliveryAction`.
* **`src/app/(authenticated)/recepcion/actions.ts` (Modificación):** En `createOrderAction`, tras guardar exitosamente el registro de ingreso y subir los datos de firma a R2, se invocará asíncronamente el envío del WhatsApp de recepción.
* **`src/app/(authenticated)/ordenes/actions.ts` (Modificación):** En `updateOrderStatusAction`, si el estado cambia a `ENTREGADO`, se invocará la acción de envío del WhatsApp de entrega final con la factura adjunta.

---

## 2. Definición de Plantillas de WhatsApp (Templates)

Para poder realizar envíos de notificaciones salientes fuera de la ventana de interacción de 24 horas, la política de Meta exige el uso de **Plantillas Aprobadas**. A continuación se detallan las plantillas que debemos registrar en Kapso/Meta utilizando el formato de **Parámetros Nombrados (NAMED)** para el cuerpo de texto, y **Posicionales (POSITIONAL)** para los botones dinámicos URL.

---

### Plantilla A: Recepción de Vehículo (`vehiculo_recibido`)
* **Categoría:** `UTILITY`
* **Idioma:** `es` (Español)
* **Formato de Parámetros:** `NAMED`

#### Cuerpo del Mensaje (Body):
> Hola {{customer_name}}, recibimos tu vehículo {{vehicle_name}} (Placa: {{plate}}) para los siguientes servicios: {{services_list}}. Para conocer el estado detallado de ingreso y el checklist de inspección, haz clic en el botón de abajo.

#### Botones (Buttons):
* **Tipo:** `URL`
* **Texto:** `Ver Ficha Técnica`
* **URL base con variable posicional:** `https://pub-97a368f7e89b4bc7ab056e192995e7e1.r2.dev/technical-sheets/sheet-{{1}}.pdf`

#### Variables a Manejar (Send-time):
* `customer_name`: Nombre del cliente (ej. `Karol Nathalia`).
* `vehicle_name`: Marca y modelo del vehículo (ej. `Chevrolet Picanto`).
* `plate`: Placa del vehículo (ej. `AAA000`).
* `services_list`: Cadena de texto con los servicios contratados (ej. `Polarizado, PPF`).
* Variable posicional `{{1}}` del botón URL: Código único de la orden (ej. `CT-2026-0004`) que completa el enlace de descarga del PDF en R2.

---

### Plantilla B: Vehículo Listo / Entregado (`vehiculo_entregado`)
* **Categoría:** `UTILITY`
* **Idioma:** `es_MX` (Español)
* **Formato de Parámetros:** `NAMED`

#### Cuerpo del Mensaje (Body):
> ¡Hola {{customer_name}}! Tu vehículo {{vehicle_name}} con placa {{plate}} ya está listo para entrega. Los servicios correspondientes a la orden {{order_code}} han sido finalizados con éxito. Puedes descargar tu ficha técnica de servicio en el enlace adjunto. ¡Gracias por confiar en Casa Tuning!

#### Botones (Buttons):
* **Tipo:** `URL`
* **Texto:** `Ver Ficha Técnica`
* **URL base con variable posicional:** `https://pub-97a368f7e89b4bc7ab056e192995e7e1.r2.dev/technical-sheets/sheet-{{1}}.pdf`

#### Variables a Manejar (Send-time):
* `customer_name`: Nombre del cliente.
* `vehicle_name`: Marca y modelo del vehículo.
* `plate`: Placa del vehículo.
* `order_code`: Código único de la orden.
* Variable posicional `{{1}}` del botón URL: Código de la orden (ej. `CT-2026-0004`).

---

### Plantilla C: Recomendaciones post-servicio (`recomendaciones_servicio`)
Esta plantilla se envía de manera complementaria cuando el cliente retira su vehículo para darle instrucciones de cuidado según el tipo de servicio contratado (ej. no bajar vidrios por 48 horas tras polarizado, o no lavar a presión por 7 días tras PPF).

* **Categoría:** `MARKETING` o `UTILITY`
* **Idioma:** `es_MX` (Spanish (MEX))
* **Formato de Parámetros:** `NAMED`

#### Cuerpo del Mensaje (Body):
> Estimado(a) {{customer_name}}, para asegurar la máxima durabilidad del servicio de {{service_name}} realizado en tu vehículo, te sugerimos seguir las siguientes recomendaciones: \n\n{{care_instructions}}\n\nSi tienes dudas, puedes responder directamente a este chat.

#### Variables a Manejar (Send-time):
* `customer_name`: Nombre del cliente.
* `service_name`: Nombre del servicio que requiere cuidados (ej. `Polarizado Nano Cerámico`).
* `care_instructions`: Bloque de texto con las precauciones (ej. `1. No bajar los vidrios por las próximas 48 horas. \n2. No limpiar los vidrios con productos abrasivos.`).

#### Lógica de Determinación de Recomendaciones por Servicio:

Para que el sistema determine qué recomendaciones (`care_instructions`) enviar de forma dinámica según los servicios contratados en la orden, se proponen dos alternativas viables:

##### Alternativa A: Diccionario Estático en Código (Implementación Rápida)
Definimos un mapeo estático de las recomendaciones basadas en palabras clave dentro del archivo de utilidades de WhatsApp (`src/lib/whatsapp.ts`). De esta manera, al iterar por los servicios de la orden, se asocian sus cuidados específicos:

```typescript
const INSTRUCCIONES_CUIDADO: Record<string, string[]> = {
  polarizado: [
    "Recuerda no bajar vidrios después de 24 horas.",
    "Recuerda si mañana ves porosidad o humedad, esto se genera mientras el papel polarizado termina de secar, tiempo estimado 5/6 días.",
    "La garantía por contaminación es máxima de 30 días.",
    "No laves el auto hasta después pasados 2 días.",
    "Cero uso de siliconas en los empaques donde el vidrio desliza."
  ],
  ppf: [
    "Recuerda debes traer el auto 5 días después de entrega para una pequeña revisión. Esto se lleva a cabo para revisar y evitar desprendimiento.",
    "Cero uso de siliconas.",
    "Recuerda trata de limpiar las piezas forradas con un shampoo con pH neutro.",
    "Es posible que se vea humedad, es normal mientras el papel seca.",
    "No tocar las piezas forradas mientras pasan 24 horas.",
    "No lavar con agua a presión."
  ],
  radioAndroid: [
    "Su garantía es de un año a partir de su fecha de instalación.",
    "En caso de fallas durante los 3 primeros meses se hará cambio inmediato de la unidad.",
    "Si después de 6 meses la unidad genera molestias tendrá a cabo una revisión técnica.",
    "La revisión técnica bajando la unidad puede tener una demora de 15 días hábiles sea por reparación y/o cambio de piezas."
  ]
};

/**
 * Procesa la lista de servicios de la orden para compilar el texto de recomendaciones.
 */
export function obtenerRecomendaciones(servicios: { name: string }[]): { serviceName: string; instructions: string } {
  const cuidadosEncontrados = new Set<string>();
  const nombresServicios: string[] = [];

  servicios.forEach((serv) => {
    const nameLower = serv.name.toLowerCase();
    nombresServicios.push(serv.name);

    if (nameLower.includes("polarizado") || nameLower.includes("pelicula")) {
      INSTRUCCIONES_CUIDADO.polarizado.forEach(c => cuidadosEncontrados.add(c));
    }
    if (nameLower.includes("ppf") || nameLower.includes("paint protection")) {
      INSTRUCCIONES_CUIDADO.ppf.forEach(c => cuidadosEncontrados.add(c));
    }
    if (nameLower.includes("radio") || nameLower.includes("android") || nameLower.includes("pantalla")) {
      INSTRUCCIONES_CUIDADO.radioAndroid.forEach(c => cuidadosEncontrados.add(c));
    }
  });

  const care_instructions = cuidadosEncontrados.size > 0
    ? Array.from(cuidadosEncontrados).map((c, i) => `${i + 1}. ${c}`).join("\n")
    : "1. Seguir las recomendaciones estándar indicadas por el asesor de servicio.";

  const serviceName = nombresServicios.length > 0 ? nombresServicios.join(", ") : "Servicio de Embellecimiento";

  return { serviceName, instructions: care_instructions };
}
```

##### Alternativa B: Almacenamiento Dinámico en Base de Datos (Solución Escalable)
Esta alternativa permite que las recomendaciones se gestionen directamente por los administradores desde el panel de control de servicios sin modificar código:

1. **Modificación del Modelo:** Agregar la columna `careInstructions` en [schema.prisma](file:///d:/romer/REN/proyectos/casa-tuning/prisma/schema.prisma):
   ```prisma
   model ServiceCatalog {
     // ...
     careInstructions String? @db.Text @map("care_instructions")
   }
   ```
2. **Migración:** Ejecutar `npx prisma db push` para aplicar los cambios a la base de datos.
3. **Dashboard de Administración:** En la vista de administración de servicios, añadir un campo `<textarea>` para definir las recomendaciones de cuidado (separadas por saltos de línea).
4. **Envío de WhatsApp:** Al despachar la notificación, el servidor recupera los cuidados desde la base de datos de forma dinámica:
   ```typescript
   const cuidados = order.services
     .map((os) => os.service.careInstructions)
     .filter((instr): instr is string => !!instr)
     .join("\n");
   ```

---

## 3. Ejemplo de Payloads JSON (Meta Proxy API)

A continuación se detallan los payloads de creación de plantilla y el payload para realizar el envío de mensajes.

### Creación de Plantilla de Recepción (POST `/message_templates`):
```json
{
  "name": "vehiculo_recibido",
  "category": "UTILITY",
  "language": "es",
  "parameter_format": "NAMED",
  "components": [
    {
      "type": "BODY",
      "text": "Hola {{customer_name}}, recibimos tu vehículo {{vehicle_name}} (Placa: {{plate}}) para los siguientes servicios: {{services_list}}. Para conocer el estado detallado de ingreso y el checklist de inspección, haz clic en el botón de abajo.",
      "example": {
        "body_text_named_params": [
          { "param_name": "customer_name", "example": "Karol Nathalia" },
          { "param_name": "vehicle_name", "example": "Chevrolet Picanto" },
          { "param_name": "plate", "example": "AAA000" },
          { "param_name": "services_list", "example": "Polarizado, PPF" }
        ]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Ver Ficha Técnica",
          "url": "https://pub-97a368f7e89b4bc7ab056e192995e7e1.r2.dev/technical-sheets/sheet-{{1}}.pdf",
          "example": ["https://pub-97a368f7e89b4bc7ab056e192995e7e1.r2.dev/technical-sheets/sheet-CT-2026-0004.pdf"]
        }
      ]
    }
  ]
}
```

### Envío del Mensaje (POST `/{phone_number_id}/messages`):
```json
{
  "messaging_product": "whatsapp",
  "to": "+573208236441",
  "type": "template",
  "template": {
    "name": "vehiculo_recibido",
    "language": {
      "code": "es"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "parameter_name": "customer_name", "text": "Karol Nathalia" },
          { "type": "text", "parameter_name": "vehicle_name", "text": "Chevrolet Picanto" },
          { "type": "text", "parameter_name": "plate", "text": "AAA000" },
          { "type": "text", "parameter_name": "services_list", "text": "Polarizado, PPF" }
        ]
      },
      {
        "type": "button",
        "sub_type": "url",
        "index": "0",
        "parameters": [
          { "type": "text", "text": "CT-2026-0004" }
        ]
      }
    ]
  }
}

### Creación de Plantilla de Entrega (POST `/message_templates`):
```json
{
  "name": "vehiculo_entregado",
  "category": "UTILITY",
  "language": "es_MX",
  "parameter_format": "NAMED",
  "components": [
    {
      "type": "BODY",
      "text": "¡Hola {{customer_name}}! Tu vehículo {{vehicle_name}} con placa {{plate}} ya está listo para entrega. Los servicios correspondientes a la orden {{order_code}} han sido finalizados con éxito. Puedes descargar tu ficha técnica de servicio en el enlace adjunto. ¡Gracias por confiar en Casa Tuning!",
      "example": {
        "body_text_named_params": [
          { "param_name": "customer_name", "example": "Karol Nathalia" },
          { "param_name": "vehicle_name", "example": "Chevrolet Picanto" },
          { "param_name": "plate", "example": "AAA000" },
          { "param_name": "order_code", "example": "CT-2026-0004" }
        ]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Ver Ficha Técnica",
          "url": "https://pub-97a368f7e89b4bc7ab056e192995e7e1.r2.dev/technical-sheets/sheet-{{1}}.pdf",
          "example": ["https://pub-97a368f7e89b4bc7ab056e192995e7e1.r2.dev/technical-sheets/sheet-CT-2026-0004.pdf"]
        }
      ]
    }
  ]
}
```

### Envío del Mensaje de Entrega (POST `/{phone_number_id}/messages`):
```json
{
  "messaging_product": "whatsapp",
  "to": "+573208236441",
  "type": "template",
  "template": {
    "name": "vehiculo_entregado",
    "language": {
      "code": "es"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "parameter_name": "customer_name", "text": "Karol Nathalia" },
          { "type": "text", "parameter_name": "vehicle_name", "text": "Chevrolet Picanto" },
          { "type": "text", "parameter_name": "plate", "text": "AAA000" },
          { "type": "text", "parameter_name": "order_code", "text": "CT-2026-0004" }
        ]
      },
      {
        "type": "button",
        "sub_type": "url",
        "index": "0",
        "parameters": [
          { "type": "text", "text": "CT-2026-0004" }
        ]
      }
    ]
  }
}
```
```

---

## 4. Requerimientos Técnicos y Variables de Entorno

Para habilitar la integración a través de Kapso, se deben agregar las siguientes variables de entorno en el archivo `.env`:

```env
# Configuración de WhatsApp via Kapso
KAPSO_API_BASE_URL="https://api.kapso.ai"
KAPSO_API_KEY="kp_tu_llave_de_api_de_kapso_aqui"
WHATSAPP_PHONE_NUMBER_ID="tu_phone_number_id_aqui"
WHATSAPP_WABA_ID="tu_business_account_id_aqui"
```
