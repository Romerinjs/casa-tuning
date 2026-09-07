# Ocultamiento de órdenes entregadas en el panel de órdenes

## Objetivo

Permitir que cualquier usuario autenticado oculte del panel `/ordenes` una orden entregada y firmada, sin eliminarla de la base de datos ni alterar su presencia en los historiales generales de la aplicación.

La funcionalidad debe operar tanto sobre órdenes nuevas como sobre todas las órdenes históricas existentes que cumplan las condiciones. Los registros históricos existentes permanecerán visibles después de la migración hasta que un usuario los oculte expresamente.

## Alcance

- El ocultamiento afecta exclusivamente la consulta y la interfaz de `/ordenes`.
- Clientes, Vehículos, Dashboard, actividad reciente, documentos, comentarios, notificaciones y consultas de auditoría conservarán la orden.
- Solo se puede ocultar una orden cuyo estado sea `ENTREGADO` y que tenga una firma registrada.
- Cualquier usuario autenticado puede ejecutar la acción.
- La primera versión no incluye una interfaz para restaurar órdenes ocultas. El registro permanece recuperable en la base de datos.

## Modelo de datos

Se añadirá al modelo `Order` el siguiente campo opcional de fecha y hora, cuyo nombre hace explícito su alcance:

```prisma
hiddenFromOrdersAt DateTime? @map("hidden_from_orders_at")
```

Un valor nulo significa que la orden se muestra en `/ordenes`. Un valor no nulo indica cuándo fue ocultada de ese panel.

No se añadirá un estado `INACTIVO` a `OrderStatus`, porque el estado operativo e histórico debe continuar siendo `ENTREGADO`. Tampoco se eliminarán relaciones ni archivos asociados.

La migración añadirá la columna como nullable y sin valor predeterminado no nulo. De este modo, todas las órdenes existentes seguirán visibles y podrán ocultarse individualmente después del despliegue.

## Acción de servidor

Se añadirá una acción dedicada para ocultar la orden. El servidor será la fuente de verdad y realizará estas validaciones, aunque la interfaz ya las haya efectuado:

1. Verificar que exista una sesión autenticada.
2. Comprobar que la orden exista.
3. Comprobar que su estado actual sea `ENTREGADO`.
4. Comprobar que `signatureUrl` tenga una firma registrada.
5. Evitar registrar el movimiento dos veces si la orden ya estaba oculta.

Cuando las condiciones se cumplan, una transacción:

- establecerá `hiddenFromOrdersAt` con la fecha y hora actual;
- creará un `ActivityLog` asociado a la orden y al usuario autenticado, con la descripción `Orden ocultada del panel de órdenes`.

Al terminar, la acción revalidará `/ordenes` y `/dashboard`, de modo que la actividad reciente pueda reflejar el movimiento sin esperar a una actualización posterior.

Los errores esperados devolverán mensajes comprensibles y no modificarán la orden.

## Consulta y conservación del historial

La consulta principal de `/ordenes` añadirá:

```ts
where: { hiddenFromOrdersAt: null }
```

Este filtro no se añadirá a ninguna otra consulta. En particular:

- el historial del cliente conservará la orden;
- el historial del vehículo conservará la orden;
- los indicadores y listados del Dashboard continuarán usando el registro según sus reglas actuales;
- `ActivityLog` conservará los movimientos anteriores y el movimiento de ocultamiento;
- los PDF, firmas, fotos, servicios, comentarios y notificaciones seguirán vinculados a la orden.

## Interfaz de usuario

### Botón

Las tarjetas con estado `ENTREGADO` mostrarán un botón de icono de papelera con etiqueta accesible y texto de ayuda. No se mostrará en `RECIBIDO`, `EN_PROCESO`, `LISTO` ni en cualquier otro estado.

### Orden sin firma

Si el usuario pulsa el botón sobre una orden entregada sin firma, no se iniciará el ocultamiento. Se mostrará un aviso con un mensaje equivalente a:

> Esta orden aún no tiene firma. Debes registrar la firma para completar esta acción.

El aviso ofrecerá acceso al flujo existente para registrar la firma. Guardar la firma no ocultará automáticamente la orden: el usuario deberá volver a pulsar el botón de papelera, preservando las dos confirmaciones de la acción destructiva.

### Orden firmada: doble confirmación

La confirmación se presentará en un modal propio de dos pasos:

1. El primer paso explicará que la orden desaparecerá únicamente del panel de órdenes y que seguirá disponible para auditoría e historiales generales. Permitirá cancelar o continuar.
2. El segundo paso solicitará la confirmación final y advertirá que no habrá restauración desde la interfaz en esta versión. Permitirá volver, cancelar o confirmar el ocultamiento.

Mientras la acción esté pendiente, el botón final quedará deshabilitado para impedir envíos repetidos. Tras una respuesta exitosa se cerrará el modal, se mostrará una notificación y la orden desaparecerá al actualizar los datos de la ruta. Ante un error, el modal permanecerá disponible y mostrará el mensaje devuelto por el servidor.

## Seguridad e integridad

- La visibilidad del botón no sustituye las validaciones del servidor.
- No se aceptará el estado ni la firma enviados por el cliente como prueba; se leerán nuevamente desde la base de datos.
- No se borrará físicamente la orden ni ninguno de sus recursos relacionados.
- La operación será idempotente desde la perspectiva del usuario: una solicitud repetida no duplicará movimientos de auditoría.
- La identidad del responsable se tomará exclusivamente de la sesión verificada.

## Pruebas

Se cubrirán al menos estos comportamientos:

- una orden entregada y firmada puede marcarse como oculta;
- el ocultamiento crea un movimiento asociado al usuario autenticado;
- una orden entregada sin firma es rechazada;
- una orden en cualquier otro estado es rechazada;
- una orden ya oculta no genera un segundo movimiento;
- la consulta de `/ordenes` excluye órdenes ocultas;
- las consultas históricas ajenas a `/ordenes` no reciben el filtro de ocultamiento;
- la interfaz muestra el bloqueo para una orden sin firma;
- la interfaz exige los dos pasos antes de invocar la acción;
- al fallar la acción se conserva la orden visible y se comunica el error.

## Fuera de alcance

- Eliminación física de órdenes o archivos.
- Ocultamiento automático por antigüedad o al cambiar a `ENTREGADO`.
- Ocultamiento masivo.
- Pantalla de archivo, papelera o restauración.
- Cambios en los estados actuales de las órdenes.
