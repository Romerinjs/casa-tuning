# Casa Tuning — Funcionalidades del sistema

## 1. Resumen funcional

Casa Tuning reúne las funciones necesarias para coordinar la relación entre el taller, el cliente y su vehículo.

| Área | Función principal | Usuario |
|---|---|---|
| Dashboard | Mostrar el estado diario del taller. | Operador y Administrador |
| Reservas | Agendar, recordar y convertir citas. | Operador y Administrador |
| Recepción | Registrar el ingreso y condición del vehículo. | Operador y Administrador |
| Órdenes | Seguir el trabajo y formalizar la entrega. | Operador y Administrador |
| Clientes | Mantener datos e historial. | Administrador |
| Vehículos | Administrar vehículos y propietarios. | Administrador |
| Promociones | Crear campañas segmentadas. | Administrador |
| Administración | Configurar servicios, marcas y usuarios. | Administrador |

---

## 2. Funciones del Dashboard

### 2.1 Ver trabajos en proceso

Muestra cuántas órdenes se encuentran actualmente en ejecución.

**Beneficio:** permite dimensionar la carga activa sin revisar cada orden.

### 2.2 Ver recepciones del día

Indica cuántos vehículos fueron recibidos durante la jornada.

**Beneficio:** ofrece una lectura rápida del movimiento diario.

### 2.3 Ver volumen total del día

Resume el total de órdenes creadas desde el inicio de la jornada.

**Beneficio:** ayuda a comparar actividad y capacidad operativa.

### 2.4 Identificar entregas sin firma

Destaca vehículos marcados como entregados cuya firma todavía no fue registrada.

**Beneficio:** convierte un pendiente administrativo en una tarea visible.

### 2.5 Consultar órdenes activas

Presenta cliente, vehículo, servicios, estado y hora de recepción.

**Beneficio:** concentra las prioridades en una sola vista.

### 2.6 Consultar actividad reciente

Muestra los últimos movimientos registrados sobre las órdenes.

**Beneficio:** facilita entender qué ocurrió recientemente sin preguntar persona por persona.

### 2.7 Abrir una nueva recepción

Un acceso rápido lleva directamente al formulario de ingreso.

**Beneficio:** reduce pasos en una de las tareas más frecuentes.

---

## 3. Funciones de Reservas

### 3.1 Crear una reserva

Permite registrar:

- cliente;
- celular y correo;
- vehículo existente o datos temporales;
- fecha y hora;
- uno o varios servicios;
- notas.

### 3.2 Buscar un cliente existente

El asesor puede reutilizar información ya registrada.

**Beneficio:** evita volver a escribir datos en cada visita.

### 3.3 Registrar un cliente durante la reserva

Si el cliente no existe, se crea con nombre, celular y correo opcional.

### 3.4 Seleccionar un vehículo existente

La cita puede vincularse con uno de los vehículos del cliente.

### 3.5 Agendar un vehículo aún no registrado

La reserva puede conservar placa, modelo y marca sin obligar a crear inmediatamente el registro completo.

### 3.6 Validar horario del taller

El sistema evita:

- fechas anteriores;
- domingos;
- horarios fuera de atención.

Horario vigente:

| Día | Horario permitido |
|---|---|
| Lunes a viernes | 8:30 a. m. a 6:30 p. m. |
| Sábado | 8:00 a. m. a 6:30 p. m. |
| Domingo | No disponible |

### 3.7 Confirmar la reserva por WhatsApp

Después de registrar la cita, el sistema intenta enviar una plantilla con cliente, fecha, vehículo y servicios.

### 3.8 Enviar un recordatorio manual

El usuario puede recordar la cita desde la lista de reservas.

### 3.9 Enviar recordatorios automáticos

El sistema puede revisar periódicamente las reservas previstas dentro de las próximas 24 horas.

### 3.10 Editar una reserva pendiente

Permite ajustar fecha, estado, notas, vehículo y servicios antes de atenderla.

### 3.11 Cancelar una reserva

La cita conserva su registro y cambia a Cancelada.

### 3.12 Buscar y filtrar reservas

La vista permite buscar por cliente, teléfono o placa, y filtrar por fecha o estado.

### 3.13 Convertir una reserva en recepción

Recupera los datos de la cita y abre la recepción precargada.

**Beneficio:** conecta la promesa de agenda con el trabajo real.

---

## 4. Funciones de Recepción

### 4.1 Buscar un cliente registrado

Permite seleccionar un cliente y cargar sus datos conocidos.

### 4.2 Crear un cliente nuevo

El asesor registra al cliente sin abandonar la recepción.

### 4.3 Recibir sin número de documento

El tipo y número de documento son opcionales.

**Beneficio:** el ingreso no se bloquea cuando ese dato no está disponible.

### 4.4 Completar o actualizar datos del cliente

La recepción puede actualizar nombre, correo, teléfonos y documento, respetando validaciones de duplicidad.

### 4.5 Seleccionar un vehículo existente

El usuario puede elegir un vehículo asociado al cliente.

### 4.6 Registrar un vehículo nuevo

Captura:

- tipo;
- placa;
- marca;
- modelo;
- año;
- color;
- kilometraje.

### 4.7 Evitar placas activas duplicadas

La recepción alerta si la placa pertenece a otro cliente activo.

### 4.8 Seleccionar varios servicios

Una misma orden puede incluir múltiples trabajos.

### 4.9 Destacar servicios frecuentes

Los servicios marcados como más vendidos aparecen primero.

### 4.10 Describir el alcance del servicio

Un campo de texto permite precisar piezas, versiones, acabados o condiciones acordadas.

### 4.11 Registrar observaciones

Permite dejar hallazgos o información complementaria.

### 4.12 Completar checklist visual

El asesor registra la condición de diferentes partes del vehículo.

### 4.13 Adjuntar evidencias por criterio

Cuando existe una novedad, las fotos se relacionan con el punto inspeccionado.

### 4.14 Capturar firma digital

El cliente puede firmar directamente sobre la pantalla.

### 4.15 Crear la orden automáticamente

Al guardar, la recepción crea el expediente en estado Recibido y registra la actividad inicial.

### 4.16 Marcar la reserva como atendida

Si la recepción proviene de una reserva, el sistema cierra la cita dentro del mismo proceso.

### 4.17 Generar ficha técnica inicial

El sistema prepara un PDF con la información disponible.

### 4.18 Confirmar la recepción

Puede intentar comunicar el ingreso por correo y WhatsApp.

### 4.19 Editar una recepción reciente

Mientras la orden permanece en estado Recibido, puede corregirse desde el flujo de recepción.

---

## 5. Funciones de Órdenes

### 5.1 Listar órdenes

Presenta primero las órdenes más recientes con cliente, vehículo, servicios, estado y firma.

### 5.2 Buscar órdenes

Permite localizar por datos como:

- código;
- cliente;
- celular;
- placa;
- marca;
- modelo.

### 5.3 Filtrar por estado

El equipo puede concentrarse en vehículos recibidos, en proceso o entregados.

### 5.4 Abrir el detalle

Reúne información de cliente, vehículo, servicios, observaciones, checklist, comentarios y documentos.

### 5.5 Empezar el trabajo

Cambia una orden de Recibido a En proceso.

### 5.6 Editar antes de iniciar

Una orden recibida puede regresar al formulario para corregir datos.

### 5.7 Añadir comentarios de progreso

El equipo puede dejar notas relacionadas con la ejecución del servicio.

### 5.8 Registrar actividad

Los cambios importantes generan una entrada en el historial de la orden.

### 5.9 Preparar la entrega

El usuario puede marcar la orden como entregada y registrar firma durante el cierre.

### 5.10 Entregar sin firma inmediata

La operación puede quedar Entregada con firma pendiente.

### 5.11 Registrar firma posteriormente

La firma pendiente puede completarse desde el detalle de la orden.

### 5.12 Detectar firmas demoradas

La interfaz destaca entregas sin firma después del periodo configurado en la vista.

### 5.13 Cargar documento de entrega

Permite asociar un PDF externo a una orden entregada.

### 5.14 Eliminar documento de entrega

Desvincula el archivo y registra la actividad correspondiente.

### 5.15 Generar o descargar ficha técnica

La ficha puede regenerarse con la información actual de la orden.

### 5.16 Comunicar la entrega

Según la presencia de firma y datos de contacto, el sistema puede enviar:

- aviso de vehículo listo;
- confirmación de entrega;
- ficha técnica por correo;
- recomendaciones posteriores al servicio.

---

## 6. Funciones de Clientes

Disponibles para Administradores.

### 6.1 Listar y buscar clientes

La búsqueda utiliza nombre, teléfono o correo.

### 6.2 Crear cliente

Registra nombre, celular, correo y documento opcional.

### 6.3 Editar cliente

Permite actualizar los datos conservando las reglas de unicidad.

### 6.4 Proteger el número de documento

El dato se guarda cifrado y se utiliza una referencia no reversible para detectar duplicados.

### 6.5 Añadir documento más adelante

Un cliente creado sin documento puede completarlo desde la edición.

### 6.6 Subir fotografía

Permite asociar una imagen de perfil al cliente.

### 6.7 Consultar vehículos

Muestra los vehículos relacionados con el cliente.

### 6.8 Añadir vehículo desde el cliente

Registra un vehículo sin crear una orden de trabajo.

### 6.9 Consultar historial de órdenes

Permite revisar servicios y estados previos del cliente.

### 6.10 Contactar por WhatsApp

La interfaz puede ofrecer acceso al número registrado para contacto manual.

---

## 7. Funciones de Vehículos

Disponibles para Administradores.

### 7.1 Listar vehículos

Presenta placa, marca, modelo, año, propietario y estado.

### 7.2 Buscar vehículos

Permite encontrar registros por sus datos principales.

### 7.3 Crear vehículo

Registra el vehículo y lo asigna a un cliente.

### 7.4 Editar vehículo

Permite cambiar placa, marca, modelo, año, color y propietario.

### 7.5 Activar o desactivar

Conserva el historial aunque el vehículo ya no deba aparecer como activo.

### 7.6 Evitar duplicidad activa

Al activar, comprueba que otra fila activa no use la misma placa.

### 7.7 Relacionar con el propietario

Cada vehículo mantiene vínculo con el cliente responsable.

---

## 8. Funciones de Promociones

Disponibles para Administradores.

### 8.1 Consultar plantillas aprobadas

Obtiene desde WhatsApp las plantillas disponibles para la cuenta conectada.

### 8.2 Crear una campaña

Registra nombre interno, servicio, marca, plantilla, archivo y destinatarios.

### 8.3 Segmentar por marca

Permite identificar clientes con vehículos activos de una marca seleccionada.

### 8.4 Relacionar un servicio

La campaña comunica una oferta concreta del catálogo.

### 8.5 Seleccionar destinatarios

El Administrador puede revisar y desmarcar clientes antes de enviar.

### 8.6 Adjuntar material

Permite subir imagen, video o documento para plantillas compatibles.

### 8.7 Subir directamente al almacenamiento

El archivo se carga desde el navegador mediante un enlace temporal.

### 8.8 Enviar secuencialmente

El sistema procesa destinatarios uno a uno con una pausa breve.

### 8.9 Registrar resultado inicial

Cada destinatario queda como `SENT` o `FAILED` según la respuesta inicial.

### 8.10 Consultar campañas creadas

La vista muestra campañas, marca, servicio y resumen de resultados.

### Límite importante

La versión auditada no confirma entrega o lectura del mensaje y no dispone todavía de una cola durable. El envío masivo debe supervisarse.

---

## 9. Funciones de Administración

### 9.1 Crear servicios

Registra un servicio del catálogo del taller.

### 9.2 Editar servicios

Permite cambiar nombre, icono, visibilidad y prioridad.

### 9.3 Activar o desactivar servicios

Un servicio inactivo deja de ofrecerse en nuevas recepciones sin borrar su historial.

### 9.4 Eliminar servicios sin uso

Solo puede eliminarse cuando las relaciones existentes lo permiten.

### 9.5 Marcar servicios más vendidos

Los servicios destacados se priorizan en Recepción.

### 9.6 Crear marcas

Registra nombre y logo opcional.

### 9.7 Editar marcas

Actualiza nombre o reemplaza/elimina el logo.

### 9.8 Crear usuarios

Registra personal con nombre, correo, contraseña inicial y rol.

### 9.9 Asignar roles

Permite elegir Administrador u Operador durante la creación.

### 9.10 Probar la conexión de WhatsApp

Envía una plantilla de diagnóstico a un número colombiano válido.

### Límite importante

La versión actual crea usuarios, pero no ofrece en la misma sección funciones completas de edición, desactivación o restablecimiento. La contraseña inicial por correo debe reemplazarse por una invitación segura antes de un despliegue productivo.

---

## 10. Funciones de comunicación

### 10.1 Confirmación de reserva

Contenido: cliente, fecha/hora, vehículo y servicios.

### 10.2 Recordatorio de reserva

Puede ejecutarse manualmente o mediante revisión automática.

### 10.3 Confirmación de recepción

Informa que el vehículo fue recibido y puede dirigir a la ficha técnica.

### 10.4 Aviso de vehículo listo

Informa que el vehículo puede retirarse.

### 10.5 Confirmación de entrega

Comunica el cierre y ofrece acceso a la ficha disponible.

### 10.6 Recomendaciones de cuidado

La implementación contiene recomendaciones para:

- polarizado o película;
- PPF;
- radios, Android o pantallas.

### 10.7 Correo de recepción

Envía información de la orden al correo registrado.

### 10.8 Correo de entrega

Puede adjuntar la ficha técnica generada.

### 10.9 Campañas por WhatsApp

Utiliza una plantilla aprobada y variables de cliente, servicio y marca.

---

## 11. Funciones de documentos y archivos

### 11.1 Ficha técnica

Puede incluir:

- código y fecha;
- cliente;
- vehículo;
- servicios;
- descripción;
- checklist;
- observaciones;
- evidencias;
- comentarios;
- firma.

### 11.2 Firmas

Se almacenan fuera de la base de datos y la orden conserva su enlace.

### 11.3 Evidencias

Las fotografías se relacionan con el criterio del checklist.

### 11.4 Logos y fotos

El sistema almacena logos de marcas y fotografías de clientes.

### 11.5 Archivos promocionales

Las campañas pueden incluir contenido multimedia compatible con su plantilla.

### 11.6 Documento de entrega

Se puede cargar un PDF externo. Esta función no genera facturación fiscal.

---

## 12. Funciones por rol

### Operador

- consultar Dashboard;
- crear y gestionar reservas;
- enviar recordatorios;
- convertir reservas;
- crear y editar recepciones permitidas;
- consultar órdenes;
- iniciar trabajo;
- comentar;
- entregar;
- registrar firma;
- generar ficha;
- gestionar documento de entrega.

### Administrador

Incluye todo lo anterior y además:

- gestionar clientes;
- gestionar vehículos;
- crear promociones;
- gestionar servicios;
- gestionar marcas;
- crear usuarios;
- ejecutar prueba de WhatsApp.

## 13. Funciones por momento del cliente

| Momento | Funciones |
|---|---|
| Descubrimiento | Campaña segmentada y contacto. |
| Agendamiento | Reserva, confirmación y recordatorio. |
| Llegada | Precarga y recepción sin documento obligatorio. |
| Inspección | Checklist, observaciones y evidencias. |
| Ejecución | Estado y comentarios de progreso. |
| Entrega | Firma, documento, ficha y comunicación. |
| Postventa | Recomendaciones, historial y nueva campaña. |

## 14. Funciones no disponibles actualmente

Para evitar expectativas incorrectas, la versión auditada no incluye:

- facturación fiscal;
- pagos en línea;
- precios, cotizaciones o caja;
- inventario de productos;
- portal de autoservicio para el cliente;
- aplicación móvil nativa;
- multiempresa;
- gestión formal de múltiples sedes;
- capacidad/agenda por técnico o bahía;
- confirmación de entrega y lectura por webhook;
- reportes financieros avanzados;
- edición/desactivación completa de usuarios;
- cola durable para campañas.

Estas funciones pueden formar parte de una hoja de ruta, pero no deben presentarse como activas.

## 15. Priorización sugerida para evolución

### Prioridad operativa

1. Unificar estados de orden.
2. Asegurar recordatorios y campañas con reintentos.
3. Completar administración de usuarios.
4. Añadir filtros y paginación para mayor volumen.

### Prioridad comercial

1. Consentimiento y baja de campañas.
2. Estados de entrega y lectura de mensajes.
3. Métricas de reserva, servicio y recompra.
4. Automatizaciones posteriores al servicio.

### Prioridad de expansión

1. Sedes.
2. Organización/multiempresa.
3. Integraciones de facturación.
4. Inventario y precios.

## 16. Checklist para demostración funcional

- [ ] Mostrar Dashboard.
- [ ] Crear una reserva.
- [ ] Enviar o explicar la confirmación.
- [ ] Convertir la reserva en recepción.
- [ ] Omitir el documento para demostrar flexibilidad.
- [ ] Añadir servicios y evidencia.
- [ ] Crear la orden.
- [ ] Cambiarla a En proceso.
- [ ] Añadir comentario.
- [ ] Registrar entrega y firma.
- [ ] Generar ficha técnica.
- [ ] Consultar historial del cliente.
- [ ] Mostrar segmentación de una promoción.
- [ ] Aclarar los límites actuales.
