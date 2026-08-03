# Guía de Configuración de Plantillas de Reservas en Kapso (WhatsApp)

Esta guía detalla las dos plantillas de WhatsApp que el Administrador o Agente de Kapso debe dar de alta en Meta WhatsApp Business / Kapso para el correcto funcionamiento del nuevo **Módulo de Reservas y Recordatorios de Citas**.

---

## 1. Plantilla: Confirmación de Cita (`reserva_confirmada`)

Esta plantilla se envía de manera automática en segundo plano inmediatamente cuando un operador o administrador registra una nueva cita en el portal.

### Especificaciones Meta / Kapso:
* **ID de Kapso:** `f38ae4a0-528a-4a28-beea-a39ec5ef45da`
* **Estado:** `draft` (verificado)
* **Nombre de la plantilla:** `reserva_confirmada`
* **Categoría:** `UTILITY` (Utilidad)
* **Idioma:** `es_MX` (Español - México)
* **Header (Encabezado):** Ninguno
* **Body (Cuerpo del mensaje):**
```text
Hola {{1}}, tu cita en Casa Tuning ha sido confirmada con éxito.

Fecha y Hora: {{2}}
Vehículo: {{3}}
Servicios: {{4}}

Si necesitas realizar algún cambio en tu agendamiento, por favor responde a este mensaje. ¡Te esperamos!
```
* **Footer (Pie de página):** Ninguno

### Mapeo de Variables (Parámetros):
1. **`{{1}}` (customer_name):** Nombre completo del cliente (Ej: `Carlos Pérez`).
2. **`{{2}}` (date_time):** Fecha y hora de la cita en formato legible (Ej: `Lunes 10 de Agosto a las 09:30 AM`).
3. **`{{3}}` (vehicle_info):** Marca, modelo y placa del vehículo (Ej: `Toyota Corolla - ABC123`).
4. **`{{4}}` (services_list):** Nombres de los servicios contratados separados por coma (Ej: `Polarizado Cerámico, PPF Capó`).

---

## 2. Plantilla: Recordatorio de Cita (`recordatorio_cita`)

Esta plantilla se envía de manera programada (Job automático de cron 24h antes) o manual cuando el operador presiona el botón **"Enviar Recordatorio"** en la reserva.

### Especificaciones Meta / Kapso:
* **ID de Kapso:** `36ab0198-6edb-41b8-9d56-7b27a9a95031`
* **Estado:** `draft` (verificado)
* **Nombre de la plantilla:** `recordatorio_cita`
* **Categoría:** `UTILITY` (Utilidad)
* **Idioma:** `es_MX` (Español - México)
* **Header (Encabezado):** Ninguno
* **Body (Cuerpo del mensaje):**
```text
Hola {{1}}, te recordamos que tienes una cita programada en Casa Tuning.

Fecha y Hora: {{2}}
Vehículo: {{3}}
Servicios: {{4}}

Te esperamos en nuestras instalaciones. Gracias por confiar en Casa Tuning.
```
* **Footer (Pie de página):** Ninguno

### Mapeo de Variables (Parámetros):
1. **`{{1}}` (customer_name):** Nombre del cliente (Ej: `Carlos Pérez`).
2. **`{{2}}` (date_time):** Fecha y hora de la cita (Ej: `Mañana a las 09:30 AM`).
3. **`{{3}}` (vehicle_info):** Información del vehículo (Ej: `Toyota Corolla - ABC123`).
4. **`{{4}}` (services_list):** Lista de servicios (Ej: `Polarizado Cerámico`).


---

## Notas de Integración Técnica para el Sistema

En el código del sistema (`src/lib/whatsapp.ts`), el payload enviado a la API de Kapso utiliza la estructura Meta v24.0:

```json
{
  "messaging_product": "whatsapp",
  "to": "+573001234567",
  "type": "template",
  "template": {
    "name": "reserva_confirmada",
    "language": { "code": "es_MX" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Carlos Pérez" },
          { "type": "text", "text": "Lunes 10 de Agosto a las 09:30 AM" },
          { "type": "text", "text": "Toyota Corolla - ABC123" },
          { "type": "text", "text": "Polarizado Cerámico, PPF Capó" }
        ]
      }
    ]
  }
}
```
