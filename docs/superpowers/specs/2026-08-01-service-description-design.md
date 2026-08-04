# Especificación de Diseño: Descripción de Servicios, Flexibilización de Firma, Edición y Simplificación de Estados

**Fecha**: 2026-08-01  
**Estado**: Aprobado por el usuario  
**Autor**: Antigravity  

## 1. Contexto y Objetivos
Se requiere expandir y optimizar las funcionalidades del sistema de recepción y control de vehículos de Casa Tuning con los siguientes objetivos:
1. **Descripción Global de Servicios**: Permitir añadir especificaciones sobre los servicios contratados (ej. tipo de polarizado, color de vinilo, etc.) en el Paso 3 del formulario de recepción. Esta descripción debe guardarse en la base de datos y mostrarse en la ficha técnica (PDF, vista de órdenes y correos).
2. **Flexibilización de la Firma Digital**: 
   - Quitar la obligatoriedad de la firma del cliente durante la recepción inicial (hacerla opcional).
   - Permitir capturar la firma digital posteriormente en la vista de órdenes (en el modal de detalles o al entregar).
   - Mostrar una alerta visual destacada en aquellas órdenes que lleven más de 12 horas sin firmarse.
   - Añadir una nueva tarjeta métrica en el dashboard principal que cuantifique las "Órdenes entregadas sin firmar".
3. **Edición de Recepción antes de Iniciar**:
   - Permitir editar los datos de una orden (datos de cliente, vehículo, servicios, checklist, etc.) única y exclusivamente mientras su estado sea `RECIBIDO` (antes de que se inicie el trabajo).
   - Reutilizar el formulario de recepción (`RecepcionForm.tsx`) para la edición, pre-populando todos sus campos.
4. **Simplificación de Estados (Eliminación de "Listo para entrega")**:
   - Eliminar el estado `LISTO` del flujo operativo de las órdenes.
   - Los únicos estados válidos ahora serán: `RECIBIDO` -> `EN_PROCESO` -> `ENTREGADO`.
   - La acción de entregar el vehículo se realizará directamente desde `EN_PROCESO` -> `ENTREGADO`.
   - La carga de la factura electrónica (PDF) se habilitará directamente en el estado `ENTREGADO`.

---

## 2. Decisiones de Diseño y Arquitectura

### 2.1 Base de Datos (Prisma Schema)
Se añaden los siguientes campos al modelo `Order` de Prisma:
- `serviceDescription String? @db.Text`: Detalles de los servicios contratados.
- La firma digital se guarda en `signatureUrl String?`. Puede ser `null` en un inicio.
- Mantendremos la existencia del estado `LISTO` en la base de datos para no alterar registros históricos, pero en toda la lógica de la aplicación y en las opciones de la interfaz de usuario se omitirá por completo.

### 2.2 Reglas de Visualización de Estados (Colores)
- **RECIBIDO**: Azul.
- **EN_PROCESO**: Naranja.
- **ENTREGADO**:
  - **Color Gris**: Si la orden está en estado `ENTREGADO` pero **no tiene firma** (`signatureUrl == null`). Representa "Vehículo listo para retiro, firma pendiente".
  - **Color Verde**: Si la orden está en estado `ENTREGADO` y **ya tiene firma** (`signatureUrl != null`). Representa "Entrega y orden cerradas con conformidad".

### 2.3 Definición de "Órdenes Activas" en el Dashboard
Una orden se mostrará en la lista del Dashboard de "Órdenes activas" si:
- Está en estado `RECIBIDO` o `EN_PROCESO`.
- Está en estado `ENTREGADO` pero **está sin firmar** (en gris).
Al firmar la orden entregada, esta se tiñe de verde y desaparece de la lista de órdenes activas.

### 2.4 Flujo de Notificaciones en Dos Etapas (Email y WhatsApp)
El envío de notificaciones de salida se divide en dos hitos diferenciados:

1. **Hito 1: Vehículo Listo para Retiro (Cambio a ENTREGADO - Gris)**:
   - **Cuándo**: Al cambiar el estado de la orden de `EN_PROCESO` a `ENTREGADO` (sin firma inicial).
   - **Contenido**: Se envía un correo y mensaje de WhatsApp de aviso. Notifica al cliente que los trabajos finalizaron y que puede pasar a recoger el vehículo. **No incluye adjuntos (ficha técnica ni factura).**
   
2. **Hito 2: Confirmación de Entrega y Documentos (Registro de Firma - Verde)**:
   - **Cuándo**: Al momento de registrar y guardar con éxito la firma del cliente en el panel de órdenes.
   - **Contenido**: Se envía el correo y WhatsApp de entrega final, **adjuntando el PDF de la Ficha Técnica firmada** y el **PDF de la Factura** (si está cargada).

### 2.5 Flujo de Edición de Recepción
1. En `OrdenesClientView.tsx`, si una orden está en estado `RECIBIDO`, se muestra un botón **"Editar Recepción"**.
2. Al hacer clic, se redirige a la ruta `/recepcion?edit=ID_DE_LA_ORDEN`.
3. El servidor de la página `/recepcion` busca la orden en la base de datos, carga los datos y los pasa a `RecepcionForm.tsx` a través de la propiedad `initialOrder`.
4. El formulario pre-popula todos sus campos y, en lugar de invocar `createOrderAction`, invoca `updateOrderAction` para guardar los cambios.

---

## 3. Plan de Verificación

### Pruebas Manuales
1. **Recepción sin firma**: Registrar una orden de recepción sin firma y con una descripción de servicios.
2. **Edición de Recepción**:
   - Modificar datos, servicios y checklist en estado `RECIBIDO` y guardar.
   - Intentar acceder a la URL de edición con una orden en estado `EN_PROCESO` o `ENTREGADO` y validar que el sistema lo rechaza.
3. **Flujo Simplificado, Colores y Notificaciones**:
   - Cambiar una orden de `RECIBIDO` a `EN_PROCESO` (Naranja).
   - Desde `EN_PROCESO`, presionar "Entregar". Si se entrega sin firma, validar que el estado se muestre en **gris**, que la orden permanezca en la lista de "Órdenes Activas", y que se envíe la **Notificación de Vehículo Listo (sin adjuntos)**.
   - Abrir el modal "Ver Ficha" de la orden entregada sin firmar, cargar la factura electrónica y registrar la firma en el canvas.
   - Validar que al guardar la firma, la orden pase a **verde**, desaparezca de la lista de "Órdenes Activas", y se envíe la **Notificación de Entrega con los adjuntos**.
