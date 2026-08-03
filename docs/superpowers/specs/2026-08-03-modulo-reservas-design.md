# Módulo de Reservas y Recordatorios de Citas vía Kapso (WhatsApp)

## Summary
Este diseño especifica la incorporación de un nuevo módulo de **Reservas (Citas)** en la aplicación Casa Tuning. El módulo permite a los operadores y administradores agendar citas para clientes con fecha y hora específica, enviar notificaciones automáticas y recordatorios por WhatsApp mediante Kapso, y convertir fácilmente cualquier reserva en una **Recepción de Vehículo (Orden)** activa al momento de la llegada del cliente al taller.

---

## 1. Base de Datos (`prisma/schema.prisma`)

Se agregarán los siguientes modelos a Prisma para manejar las reservas:

```prisma
model Reservation {
  id             Int       @id @default(autoincrement())
  code           String    @unique @db.VarChar(20) // Ej: RES-2026-0001
  scheduledAt    DateTime  @map("scheduled_at")
  status         String    @default("PENDIENTE") @db.VarChar(20) // PENDIENTE | CONFIRMADA | ATENDIDA | CANCELADA
  notes          String?   @db.Text
  reminderSent   Boolean   @default(false) @map("reminder_sent")
  reminderSentAt DateTime? @map("reminder_sent_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  clientId       Int       @map("client_id")
  client         Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  carId          Int?      @map("car_id")
  car            Car?      @relation(fields: [carId], references: [id], onDelete: SetNull)

  // Datos de vehículo en caso de no estar registrado aún en el catálogo de autos del cliente
  vehiclePlate   String?   @map("vehicle_plate") @db.VarChar(10)
  vehicleModel   String?   @map("vehicle_model") @db.VarChar(100)
  brandId        Int?      @map("brand_id")
  brand          Brand?    @relation(fields: [brandId], references: [id])

  creatorId      Int       @map("creator_id")
  creator        User      @relation(fields: [creatorId], references: [id])

  services       ReservationService[]

  @@index([scheduledAt])
  @@index([clientId])
  @@index([status])
  @@map("reservations")
}

model ReservationService {
  reservationId Int @map("reservation_id")
  serviceId     Int @map("service_id")

  reservation   Reservation    @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  service       ServiceCatalog @relation(fields: [serviceId], references: [id])

  @@id([reservationId, serviceId])
  @@index([serviceId])
  @@map("reservation_services")
}
```

---

## 2. Integración con WhatsApp / Kapso (`src/lib/whatsapp.ts`)

Se añadirán dos nuevas funciones para el envío de plantillas WhatsApp vía Kapso:

### A. Confirmación de Cita (`sendWhatsAppReservationConfirmationAction`)
* **Disparador:** Se ejecuta de forma asíncrona (`after()`) inmediatamente al crear una nueva reserva.
* **Plantilla Meta Kapso:** `reserva_confirmada` (Idioma: `es_MX`).
* **Parámetros del Body:**
  1. `customer_name`: Nombre completo del cliente.
  2. `date_time`: Fecha y hora formateada en español (Ej: "Lunes 10 de Agosto, 09:30 AM").
  3. `vehicle_info`: Marca, modelo y placa (Ej: "Toyota Corolla - ABC123").
  4. `services_list`: Lista de servicios reservados (Ej: "Polarizado Nano Cerámico, PPF Capó").

### B. Recordatorio de Cita (`sendWhatsAppReservationReminderAction`)
* **Disparador:** Se ejecuta manualmente desde el botón de la reserva o automáticamente mediante el job de cron.
* **Plantilla Meta Kapso:** `recordatorio_cita` (Idioma: `es_MX`).
* **Parámetros del Body:**
  1. `customer_name`: Nombre del cliente.
  2. `date_time`: Fecha y hora formateada.
  3. `vehicle_info`: Info del vehículo.
  4. `services_list`: Lista de servicios a realizar.

---

## 3. Flujo y Vistas UI

### Navegación (`Sidebar.tsx`)
* Se agrega el enlace **"Reservas"** con icono de calendario (`CalendarClock` de lucide-react) en el grupo **"Principal"**.
* Disponible para roles de **Administrador** y **Operador**.

### Vista `/reservas` (`src/app/(authenticated)/reservas/page.tsx`)
* **Resumen Superior:** Tarjetas estadísticas (Total Citas Hoy, Próximas, Atendidas, Canceladas).
* **Barra de Herramientas:** 
  * Filtro rápido de fecha (Hoy, Mañana, Esta Semana, Rango personalizado).
  * Filtro por estado (`PENDIENTE`, `CONFIRMADA`, `ATENDIDA`, `CANCELADA`).
  * Buscador por nombre de cliente, teléfono o placa.
  * Botón primario **"+ Nueva Reserva"**.
* **Tabla de Reservas:**
  * Fecha / Hora.
  * Cliente (Nombre y Teléfono).
  * Vehículo (Placa / Marca / Modelo).
  * Servicios solicitados (Badges).
  * Estado con badge coloreado.
  * Estado de Recordatorio (Icono indicador de si se envió o no el WhatsApp).
  * **Menú de Acciones:**
    * 🚀 **"Convertir en Recepción"**: Redirige a `/recepcion?reservationId=X`.
    * 💬 **"Enviar Recordatorio WhatsApp"**: Ejecuta la Server Action de envío manual.
    * ✏️ **"Editar"**.
    * ❌ **"Cancelar Cita"**.

### Creación / Edición de Reserva
* Modal o pantalla con:
  1. **Búsqueda / Registro de Cliente:** Campo interactivo para buscar cliente existente por celular/nombre o ingresar datos de un cliente nuevo.
  2. **Datos de Vehículo:** Selección de autos ya registrados del cliente o ingreso de Placa, Marca y Modelo.
  3. **Fecha y Hora de Cita:** Picker combinado de fecha y hora.
  4. **Servicios:** Selección múltiple usando checkboxes de los servicios activos del catálogo (`ServiceCatalog`).
  5. **Notas:** Campo multilínea opcional.

### Integración "Convertir en Recepción" (`/recepcion?reservationId=X`)
* Al navegar a `/recepcion` con el parámetro `reservationId`:
  * El formulario de Recepción lee la reserva de la base de datos y pre-carga:
    * Datos del cliente (Nombre, celular, correo, documento).
    * Datos del vehículo (Placa, tipo, marca, modelo, año, color).
    * Servicios seleccionados.
  * Al guardar la recepción, la reserva correspondiente cambia su estado a **`ATENDIDA`**.

---

## 4. Endpoint de Cron para envío automático (`/api/cron/reminders`)

* **Ruta:** `GET /api/cron/reminders`
* **Seguridad:** Requiere header `Authorization: Bearer <CRON_SECRET>` o `?key=<CRON_SECRET>`.
* **Lógica:**
  1. Busca todas las reservas en estado `PENDIENTE` o `CONFIRMADA` con `reminderSent == false`.
  2. Filtra aquellas cuyo `scheduledAt` sea dentro de las próximas 24 horas (o del día siguiente).
  3. Ejecuta `sendWhatsAppReservationReminderAction(res.id)` para cada una.
  4. Actualiza `reminderSent = true` y `reminderSentAt = new Date()`.
  5. Retorna resumen en JSON con la cantidad de recordatorios enviados.

---

## 5. Guía de Documentación para el Agente / Administrador de Kapso

Se creará la documentación completa en `docs/kapso-templates-reservas.md` para ser entregada al administrador o agente de Kapso con los datos exactos requeridos por Meta.

### Plantilla 1: `reserva_confirmada`
* **Nombre de la plantilla:** `reserva_confirmada`
* **Categoría:** `UTILITY`
* **Idioma:** `es_MX`
* **Cuerpo del mensaje (Body):**
  > ¡Hola {{customer_name}}! 🚗✨ Tu cita en **Casa Tuning** ha sido confirmada con éxito.
  > 
  > 📅 **Fecha y Hora:** {{date_time}}
  > 🚘 **Vehículo:** {{vehicle_info}}
  > 🛠️ **Servicios:** {{services_list}}
  > 
  > Nos vemos pronto para darle el mejor cuidado a tu vehículo. Si necesitas reprogramar, comunícate con nosotros.
* **Variables:**
  1. `customer_name` (ej: `Carlos Pérez`)
  2. `date_time` (ej: `Lunes 10 de Agosto a las 09:30 AM`)
  3. `vehicle_info` (ej: `Toyota Corolla - ABC123`)
  4. `services_list` (ej: `Polarizado Cerámico, PPF Capó`)

---

### Plantilla 2: `recordatorio_cita`
* **Nombre de la plantilla:** `recordatorio_cita`
* **Categoría:** `UTILITY`
* **Idioma:** `es_MX`
* **Cuerpo del mensaje (Body):**
  > Hola {{customer_name}}, te recordamos que tienes una cita programada en **Casa Tuning** 🏁.
  > 
  > 📅 **Fecha y Hora:** {{date_time}}
  > 🚘 **Vehículo:** {{vehicle_info}}
  > 🛠️ **Servicios:** {{services_list}}
  > 
  > Te esperamos en nuestras instalaciones. ¡Gracias por confiar en nosotros!
* **Variables:**
  1. `customer_name` (ej: `Carlos Pérez`)
  2. `date_time` (ej: `Mañana a las 09:30 AM`)
  3. `vehicle_info` (ej: `Toyota Corolla - ABC123`)
  4. `services_list` (ej: `Polarizado Cerámico`)

---

## Plan de Verificación

### Pruebas Automatizadas y de Servidor
* Verificación del esquema Prisma (`prisma validate` y `prisma format`).
* Generación de cliente Prisma (`prisma generate`).
* Compilación del proyecto (`npm run build`).

### Pruebas Manuales
1. Crear una nueva reserva desde `/reservas` seleccionando cliente, auto, fecha y servicios.
2. Verificar el envío de la notificación de confirmación vía WhatsApp.
3. Probar el botón "Enviar Recordatorio WhatsApp" manualmente.
4. Probar la redirección "Convertir a Recepción" y verificar que el formulario `/recepcion` se pre-carga correctamente y al guardar marca la reserva como `ATENDIDA`.
5. Ejecutar la llamada al endpoint `/api/cron/reminders` y validar el envío de recordatorios pendientes.
