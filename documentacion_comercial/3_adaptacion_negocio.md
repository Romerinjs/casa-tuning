# Casa Tuning — Adaptación al negocio

## 1. Principio de adaptación

Casa Tuning se adapta configurando la operación alrededor de tres elementos:

1. **Quién recibe el servicio:** cliente.
2. **Sobre qué se trabaja:** vehículo.
3. **Qué se realiza:** servicio y orden.

Esta estructura funciona para distintos nichos automotrices porque conserva una base común y permite cambiar el catálogo, las marcas, los mensajes y el nivel de evidencia.

## 2. Qué puede configurarse hoy

| Elemento | Adaptación disponible |
|---|---|
| Servicios | Nombre, icono, prioridad visual y estado activo. |
| Marcas | Catálogo y logo. |
| Personal | Usuarios con rol Administrador u Operador. |
| Agenda | Fecha, hora, vehículo, servicios y notas. |
| Recepción | Datos opcionales, servicios, descripción, checklist, evidencias y firma. |
| Comunicaciones | Plantillas aprobadas de WhatsApp y correos transaccionales. |
| Campañas | Marca, servicio, plantilla, destinatarios y archivo multimedia. |
| Historial | Cliente, vehículo y órdenes relacionadas. |

## 3. Qué significa “flexible”

Flexibilidad no significa que cada empresa cambie cualquier regla sin control. Significa que el sistema puede reflejar diferencias comerciales sin romper el recorrido principal.

El núcleo permanece estable:

```text
Agendar → Recibir → Ejecutar → Entregar → Fidelizar
```

Lo que cambia por negocio es:

- catálogo de servicios;
- información solicitada;
- checklist de recepción;
- mensajes;
- evidencia requerida;
- reglas de entrega;
- segmentación comercial.

## 4. Qué significa “escalable”

Casa Tuning puede acompañar un crecimiento por etapas:

### Etapa 1 — Orden operativo

Un equipo pequeño centraliza reservas, recepciones y órdenes.

### Etapa 2 — Especialización de roles

Operadores atienden el flujo diario y administradores controlan datos y campañas.

### Etapa 3 — Decisiones con historial

El taller usa los registros por cliente, vehículo, marca y servicio para mejorar atención y recompra.

### Etapa 4 — Integraciones y automatización durable

Una futura API, webhooks y colas conectan otros canales, facturación o analítica.

### Límite actual

La versión auditada no implementa múltiples empresas aisladas dentro de la misma instalación. Abrir varias sedes o vender la plataforma a múltiples talleres en una sola instancia requiere diseñar organización, sede, permisos, facturación y aislamiento de datos.

## 5. Caso de uso: polarizado y películas

### Necesidad particular

- registrar condición de vidrios;
- identificar contaminación o daños previos;
- dejar claras las superficies contratadas;
- entregar recomendaciones de cuidado;
- promover servicios complementarios.

### Adaptación de Casa Tuning

1. El catálogo destaca Polarizado y Película de seguridad.
2. La recepción documenta vidrios, observaciones y fotos.
3. La descripción precisa zonas y tono.
4. La entrega incluye ficha y recomendaciones.
5. El historial permite futuras campañas relacionadas.

### Ejemplo de recorrido

```text
Reserva “Polarizado”
  → evidencia de rayón en vidrio
  → descripción de tono y zonas
  → trabajo en proceso
  → firma
  → recomendaciones de secado y cuidado
```

## 6. Caso de uso: PPF y protección de pintura

### Necesidad particular

- documentar pintura antes de intervenir;
- precisar piezas cubiertas;
- registrar evidencias;
- recordar revisión posterior;
- recomendar cuidados específicos.

### Adaptación

- Servicio PPF destacado.
- Checklist centrado en pintura, golpes y rayones.
- Descripción por piezas: capó, bumper, espejos o cobertura total.
- Evidencias asociadas al criterio inspeccionado.
- Recomendaciones posteriores por WhatsApp.

### Valor comercial

La protección ofrecida se acompaña de un proceso que también protege la claridad del acuerdo.

## 7. Caso de uso: vinilos y personalización exterior

### Necesidad particular

- registrar color y condición inicial;
- detallar diseño, acabado y zonas;
- conservar aprobación y evidencia;
- facilitar ventas posteriores de mantenimiento o renovación.

### Adaptación

El taller configura Vinilo como servicio, describe alcance y acabado, documenta el estado previo y conserva la orden en el historial del vehículo.

## 8. Caso de uso: audio, radios y multimedia

### Necesidad particular

- identificar vehículo y configuración;
- detallar equipos y alcance de instalación;
- documentar comentarios técnicos;
- comunicar condiciones de cuidado o garantía;
- promover cámaras, sensores o parlantes complementarios.

### Adaptación

- Catálogo con Radios, CarPlay, Parlantes, Plantas de sonido y Cámaras.
- Descripción del servicio para referencias y alcance.
- Comentarios de progreso durante la orden.
- Recomendaciones disponibles para radios o pantallas.
- Campañas segmentadas por marca y servicio.

## 9. Caso de uso: iluminación, sensores y seguridad

### Necesidad particular

- coordinar varias instalaciones en una visita;
- diferenciar accesorios contratados;
- registrar estado de recepción;
- mantener historial por vehículo.

### Adaptación

La orden acepta varios servicios: Luces LED, Exploradoras, Alarmas, Sensores o Cámaras de reversa. El taller conserva un solo expediente para la visita.

## 10. Caso de uso: detailing y estética

### Necesidad particular

- registrar daños y suciedad preexistente;
- mostrar valor del antes y después;
- manejar citas;
- fomentar mantenimiento periódico.

### Adaptación actual

El checklist, las evidencias y la reserva cubren la recepción y seguimiento. Para un antes/después comercial completo conviene evolucionar el modelo de imágenes con categorías y consentimiento de uso.

### Evolución recomendada

- tipos de evidencia `ANTES`, `DURANTE`, `DESPUES`;
- consentimiento separado para uso comercial;
- planes de mantenimiento y próxima fecha sugerida;
- galería comparativa en la ficha.

## 11. Caso de uso: taller multiespecialidad

### Necesidad particular

Un mismo vehículo puede contratar polarizado, iluminación y multimedia en una sola visita.

### Adaptación

- Selección múltiple de servicios.
- Una orden y una recepción.
- Comentarios de progreso comunes.
- Ficha técnica consolidada.
- Recomendaciones específicas cuando existen.

### Valor

El cliente ve una experiencia integrada aunque internamente participen varias especialidades.

## 12. Caso de uso: atención a flotas

### Encaje actual

Casa Tuning puede registrar varios vehículos bajo un cliente empresarial y conservar órdenes por unidad.

### Requisitos adicionales antes de venderlo como módulo de flotas

- contacto principal y contactos secundarios por empresa;
- centro de costo;
- número interno de unidad;
- autorización de servicio;
- acuerdos de precio;
- reportes consolidados;
- facturación por periodo;
- permisos específicos del cliente empresarial.

La versión actual sirve como base, pero no implementa todavía estos contratos.

## 13. Caso de uso: múltiples sedes

### Estado actual

No existe entidad Sede. Todas las órdenes pertenecen a una misma operación lógica.

### Modelo necesario

```text
Organización
  ├── Sede
  │   ├── Usuarios asignados
  │   ├── Horarios y capacidad
  │   ├── Reservas
  │   ├── Órdenes
  │   └── Inventario/configuración local
  └── Catálogos compartidos o por sede
```

### Decisiones previas

- ¿Un cliente es global o pertenece a una sede?
- ¿Una placa puede moverse entre sedes?
- ¿Los servicios y precios son compartidos?
- ¿Quién puede ver datos de otra sede?
- ¿Cómo se consolida la analítica?

No añadir solo un selector visual; la sede debe existir en permisos, datos y reportes.

## 14. Adaptación de comunicaciones

### Mensajes transaccionales

Se activan por un evento real:

- reserva creada;
- recordatorio;
- recepción;
- vehículo listo o entregado;
- recomendaciones.

### Mensajes comerciales

Se envían a una audiencia elegida para una promoción.

### Reglas por negocio

Cada empresa debe definir:

- tono de voz;
- horarios de contacto;
- plantillas aprobadas;
- datos variables;
- consentimiento;
- mecanismo de baja;
- responsable de revisar campañas.

No mezclar comunicaciones operativas con publicidad sin respetar la categoría y las reglas del canal.

## 15. Adaptación a procesos internos

### 15.1 Descubrimiento

Antes de configurar un taller, mapear:

1. Cómo entra una solicitud.
2. Quién agenda.
3. Qué datos se exigen al recibir.
4. Qué se inspecciona.
5. Quién cambia estados.
6. Qué significa “listo”.
7. Quién autoriza la entrega.
8. Qué documento se entrega.
9. Qué comunicación recibe el cliente.
10. Cómo se busca una recompra.

### 15.2 Configuración

- Crear roles y usuarios necesarios.
- Limpiar y cargar marcas.
- Configurar servicios activos y destacados.
- Definir checklist y evidencia esperada.
- Aprobar plantillas de comunicación.
- Preparar una base inicial de clientes con consentimiento.

### 15.3 Piloto

Ejecutar un piloto con un servicio y un grupo pequeño de usuarios. Medir el recorrido completo antes de ampliar.

### 15.4 Despliegue

Extender por servicio, turno o sede después de resolver las fricciones observadas.

## 16. Integraciones con otros procesos

### 16.1 Facturación

Estado actual: se puede cargar un documento PDF de entrega, pero no se genera facturación fiscal.

Adaptación futura:

- recibir ID de factura desde un proveedor autorizado;
- conservar enlace y estado;
- no duplicar datos fiscales innecesarios;
- sincronizar por API/webhook idempotente.

### 16.2 Contabilidad

Requiere primero modelar precios, impuestos, descuentos, pagos y notas crédito. Hoy los servicios no incluyen precio.

### 16.3 Inventario

Requiere productos, unidades, bodegas, reservas de stock y consumos por orden. No está implementado.

### 16.4 Analítica

Puede construirse sobre reservas, órdenes, estados, servicios y campañas. Antes se deben definir métricas con fechas y zonas horarias consistentes.

### 16.5 Canales de reserva

Una API pública futura permitiría integrar sitio web, chatbot o aliados. Debe validar disponibilidad y crear reservas con idempotencia.

## 17. Matriz de configuración frente a desarrollo

| Necesidad | Configuración actual | Requiere desarrollo |
|---|:---:|:---:|
| Añadir servicio | Sí | No |
| Destacar servicio | Sí | No |
| Añadir marca/logo | Sí | No |
| Crear usuario/rol existente | Sí | No |
| Cambiar textos de plantilla en Meta/Kapso | Parcial | Puede requerir ajuste de variables. |
| Cambiar criterios del checklist | No centralizado | Sí. |
| Añadir nuevo estado de orden | No seguro | Sí, con especificación. |
| Añadir precios y pagos | No | Sí. |
| Multiempresa | No | Sí, rediseño transversal. |
| Múltiples sedes | No | Sí, rediseño de datos y permisos. |
| Inventario | No | Sí. |
| Reportes avanzados | No | Sí. |

## 18. Métricas de adaptación

Cada implementación debe comparar una línea base con el uso posterior:

### Operación

- tiempo medio de recepción;
- órdenes por estado y antigüedad;
- entregas sin firma;
- reservas convertidas en recepción;
- registros duplicados detectados.

### Experiencia

- confirmaciones y recordatorios aceptados por canal;
- consultas manuales de estado;
- incidencias por información incompleta;
- uso de ficha técnica.

### Comercial

- clientes elegibles por segmento;
- campañas enviadas, fallidas y —cuando haya webhooks— entregadas;
- respuestas o citas atribuibles;
- recompra por servicio y periodo.

No prometer resultados porcentuales sin línea base, muestra y periodo definidos.

## 19. Plan recomendado por tamaño de negocio

### Equipo pequeño

Prioridad:

1. reservas;
2. recepción;
3. órdenes;
4. historial.

Evitar configurar campañas antes de dominar el registro diario.

### Taller en crecimiento

Prioridad:

1. separar roles;
2. estandarizar checklist;
3. automatizar recordatorios;
4. medir tiempos de estado;
5. activar campañas segmentadas.

### Operación con varias sedes

No replicar manualmente una sola base sin aislamiento. Diseñar primero organización, sede y permisos, ejecutar piloto y después consolidar.

## 20. Criterios para aceptar una personalización

Una adaptación es adecuada cuando:

- resuelve una necesidad repetible del negocio;
- mantiene un único propietario del dato;
- no rompe la historia de órdenes;
- conserva permisos y privacidad;
- puede probarse de principio a fin;
- no convierte una excepción ocasional en complejidad permanente;
- tiene una métrica de éxito.

Casa Tuning debe crecer como producto configurable, no como una colección de excepciones por cliente.
