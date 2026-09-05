# Casa Tuning — Onboarding, adopción y retención

## 1. Objetivo

Este documento define cómo llevar una cuenta desde el cierre comercial hasta el uso sostenido. El éxito no se mide por “tener acceso”, sino por completar el recorrido que justificó la compra y repetirlo con datos reales.

---

## 2. Principios

1. Vender solo un alcance que pueda implementarse.
2. Transferir el contexto comercial sin obligar al cliente a repetirlo.
3. Activar primero el proceso de mayor valor.
4. Capacitar por rol y con tareas reales.
5. Medir comportamiento, no satisfacción aislada.
6. Intervenir antes de que la inactividad se convierta en cancelación.
7. Separar uso del producto, soporte, resultado de negocio y expansión.
8. Reconocer brechas y responsables por escrito.

---

## 3. Definiciones del ciclo de vida

| Etapa | Definición de salida |
|---|---|
| Vendida | Contrato/aceptación, alcance y responsables confirmados. |
| Preparación | Datos, configuración, accesos e integraciones listos para prueba. |
| Capacitación | Administradores y operadores completan tareas por rol. |
| Activada | La cuenta completa el recorrido de valor acordado con datos reales. |
| Adoptada | El proceso se repite de forma consistente por los usuarios esperados. |
| En valor | Las métricas operativas o comerciales muestran avance frente a la línea base. |
| En riesgo | Uso, soporte, patrocinio o resultados se apartan del umbral acordado. |
| Renovada | Continúa con alcance, objetivos y condiciones actualizados. |
| Cerrada | Acceso, exportación, retención y aprendizaje de salida ejecutados. |

---

## 4. Definición recomendada de activación

Una cuenta se considera activada cuando, como mínimo:

- existe un Administrador responsable;
- usuarios y roles necesarios están creados;
- marcas y servicios principales están configurados;
- se registró una reserva o una recepción real;
- un cliente quedó asociado a su vehículo;
- una recepción real avanzó a orden;
- el equipo actualizó al menos un estado;
- se generó o consultó la ficha correspondiente;
- el responsable validó que el flujo representa su proceso.

### Objetivo temporal inicial

Procurar la activación durante los primeros **7 días operativos** posteriores al lanzamiento.

Este plazo es una hipótesis de gestión, no una garantía. Debe ajustarse según volumen, migración, integraciones y disponibilidad del cliente.

### Activación comercial adicional

El módulo de promociones se considera activado solo cuando:

- existe audiencia válida;
- se documentó consentimiento o base aplicable;
- la plantilla fue validada;
- se ejecutó una prueba controlada;
- se definió cómo medir respuesta y conversión.

---

## 5. Roles y responsabilidades

| Rol | Responsabilidad principal |
|---|---|
| Patrocinador del cliente | Remover bloqueos, priorizar tiempo y exigir adopción. |
| Líder operativo | Definir el proceso, validar datos y acompañar a usuarios. |
| Administrador del cliente | Configurar catálogos, usuarios y control cotidiano. |
| Usuarios operadores | Ejecutar reservas, recepciones y órdenes según el estándar. |
| Customer Success | Coordinar el plan, medir adopción y facilitar resultados. |
| Soporte | Resolver incidentes y preguntas dentro del alcance acordado. |
| Implementación/Técnico | Configurar entornos, datos e integraciones. |
| Comercial | Transferir promesas, alcance, objeciones y criterio de compra. |

### RACI resumido

| Actividad | Cliente patrocinador | Cliente administrador | Comercial | Customer Success | Técnico |
|---|---:|---:|---:|---:|---:|
| Confirmar alcance | A | C | R | C | C |
| Preparar datos | C | R/A | I | C | C |
| Configurar cuenta | I | C | I | A | R |
| Capacitar | I | R | I | A/R | C |
| Aprobar salida | A | R | I | C | C |
| Medir adopción | C | R | I | A/R | C |
| Resolver incidente | I | C | I | A | R |
| Revisar valor | A | R | C | R | I |

**R:** responsable de ejecutar. **A:** responsable final. **C:** consultado. **I:** informado.

---

## 6. Transferencia de ventas a implementación

La transferencia debe completarse antes del kickoff.

### Ficha obligatoria

```json
{
  "empresa": "",
  "segmento": "",
  "patrocinador": "",
  "administrador": "",
  "problema_prioritario": "",
  "impacto_actual": "",
  "criterios_de_compra": [],
  "modulos_incluidos": [],
  "integraciones_incluidas": [],
  "exclusiones": [],
  "brechas_aceptadas": [],
  "datos_a_migrar": [],
  "fecha_objetivo": "AAAA-MM-DD",
  "definicion_de_activacion": "",
  "metrica_de_valor": "",
  "riesgos": [],
  "compromisos_comerciales": []
}
```

### Reglas

- No iniciar si el alcance vendido no puede explicarse.
- No convertir una solicitud de preventa en compromiso de desarrollo sin aprobación.
- Toda exclusión relevante debe aparecer en el kickoff.
- El cliente debe saber quién decide y quién ejecuta cada tarea.

---

## 7. Plan de onboarding de 90 días

### Fase 0 — Preparación comercial: antes del kickoff

**Objetivo:** eliminar ambigüedad.

**Actividades:**

- cerrar alcance y condiciones;
- completar ficha de transferencia;
- identificar patrocinador, administrador y usuarios;
- acordar primer proceso a activar;
- solicitar muestra de datos;
- registrar requisitos de seguridad;
- confirmar canales de comunicación;
- programar kickoff y capacitaciones.

**Salida:** plan aceptado y responsables disponibles.

### Fase 1 — Kickoff: día 0

**Objetivo:** alinear resultado, proceso y calendario.

**Agenda de 45 minutos:**

1. Resultado esperado — 5 min.
2. Recorrido actual — 10 min.
3. Alcance y exclusiones — 10 min.
4. Datos, configuración e integraciones — 10 min.
5. Responsables, fechas y riesgos — 5 min.
6. Criterio de activación — 5 min.

**Salida:** acta con decisiones, tareas y fechas.

### Fase 2 — Configuración: días 1 a 3

**Objetivo:** preparar un entorno que refleje la operación mínima.

**Actividades:**

- crear usuarios y asignar roles;
- cargar marcas y servicios;
- revisar estados y reglas de orden;
- configurar proveedores de correo y WhatsApp cuando estén incluidos;
- validar almacenamiento y documentos;
- limpiar e importar datos aprobados;
- construir el caso de prueba;
- verificar navegador y dispositivos.

**Salida:** checklist técnico sin bloqueos críticos.

### Fase 3 — Capacitación y prueba: días 3 a 5

**Objetivo:** comprobar que cada rol puede ejecutar sus tareas.

**Administrador:**

- administrar usuarios;
- revisar marcas y servicios;
- consultar Dashboard;
- localizar cliente, vehículo y orden;
- revisar campañas y límites.

**Operador:**

- crear o consultar una reserva;
- ejecutar una recepción;
- adjuntar evidencia y firma;
- consultar y actualizar una orden;
- generar o consultar una ficha.

**Prueba de competencia:** cada participante completa el caso sin que el instructor controle la pantalla.

### Fase 4 — Salida controlada: días 5 a 7

**Objetivo:** procesar operaciones reales con acompañamiento.

**Actividades:**

- seleccionar uno o dos servicios representativos;
- registrar recepciones reales;
- revisar diariamente datos incompletos;
- atender dudas en una ventana definida;
- corregir configuración, no eludir el proceso;
- confirmar la activación.

**Salida:** primer recorrido real completado y aceptado.

### Fase 5 — Estabilización: días 8 a 30

**Objetivo:** convertir el uso inicial en hábito.

**Ritmo recomendado:**

- revisión breve dos veces por semana durante las primeras dos semanas;
- revisión semanal durante el resto del primer mes;
- informe de adopción por usuario y etapa;
- lista de fricciones con responsable y fecha;
- formación de refuerzo basada en errores observados.

**Salida:** uso consistente del flujo prioritario.

### Fase 6 — Valor y expansión: días 31 a 60

**Objetivo:** comparar resultados con la línea base y activar el siguiente caso.

**Actividades:**

- revisar tiempo de consulta y calidad de recepción;
- analizar reservas y órdenes sin completar;
- habilitar promociones si datos y consentimiento son suficientes;
- identificar un segundo servicio o equipo;
- priorizar mejoras según impacto y frecuencia.

**Salida:** primera revisión de valor documentada.

### Fase 7 — Consolidación: días 61 a 90

**Objetivo:** asegurar continuidad sin acompañamiento intensivo.

**Actividades:**

- revisar salud de cuenta;
- validar administrador sustituto;
- actualizar materiales internos;
- confirmar política de soporte y escalamiento;
- acordar objetivos trimestrales;
- preparar caso de éxito solo si existe evidencia y autorización.

**Salida:** plan operativo del siguiente trimestre.

---

## 8. Preparación y migración de datos

### Datos mínimos

| Dominio | Campos a validar |
|---|---|
| Usuarios | Nombre, correo, rol, estado. |
| Clientes | Nombre, teléfono, correo, documento si existe, consentimiento. |
| Vehículos | Placa, marca, modelo, año, propietario. |
| Servicios | Nombre, descripción, estado. |
| Marcas | Nombre normalizado. |
| Historial | Fecha, vehículo, servicio, estado y referencia disponible. |

### Secuencia segura

1. Recibir una muestra, no toda la base inicialmente.
2. Identificar duplicados y campos inválidos.
3. Definir reglas de transformación.
4. Importar en entorno de prueba.
5. Conciliar conteos y relaciones.
6. Obtener aprobación del cliente.
7. Ejecutar la carga final con respaldo y registro.

### Criterios de rechazo

- archivo sin propietario o autorización;
- datos sensibles innecesarios;
- teléfonos o correos sin formato identificable;
- relaciones imposibles de reconstruir;
- base de campañas sin consentimiento o finalidad definida;
- expectativa de migración no incluida en el alcance.

---

## 9. Plan de capacitación por rol

| Sesión | Audiencia | Duración sugerida | Resultado |
|---|---|---:|---|
| Administración | Administrador y respaldo | 60 min | Puede configurar y resolver tareas comunes. |
| Operación | Recepción y asesores | 45 min | Completa reserva, recepción y orden. |
| Campañas | Marketing/Administrador | 45 min | Construye una prueba segmentada y segura. |
| Seguridad/soporte | Administrador/Técnico | 30 min | Conoce accesos, escalamiento y límites. |
| Refuerzo | Usuarios con fricción | 30 min | Corrige errores observados. |

### Evidencia de aprendizaje

- tarea completada;
- errores y ayudas requeridas;
- preguntas no resueltas;
- responsable de refuerzo;
- fecha de nueva validación.

La asistencia no equivale a competencia.

---

## 10. Métricas de adopción

### Indicadores de entrada

- usuarios invitados y activados;
- catálogos configurados;
- datos importados y conciliados;
- capacitaciones completadas;
- integraciones verificadas.

### Indicadores de comportamiento

- usuarios activos por semana;
- reservas creadas y consultadas;
- recepciones completadas;
- recepciones con evidencia;
- órdenes actualizadas;
- fichas generadas;
- campañas de prueba o producción;
- días desde la última actividad relevante.

### Indicadores de calidad

- registros incompletos;
- duplicados de cliente o vehículo;
- evidencia sin contexto suficiente;
- órdenes estancadas;
- errores de envío;
- solicitudes repetidas de ayuda.

### Indicadores de resultado

- tiempo para localizar el estado de un vehículo;
- tiempo total de recepción;
- porcentaje de reservas que llegan y se convierten;
- aclaraciones relacionadas con condición de ingreso;
- seguimiento ejecutado después del servicio;
- conversión de campañas cuando exista atribución válida.

Ningún indicador debe publicarse como éxito sin línea base, periodo y muestra.

---

## 11. Puntaje de salud de cuenta

Modelo inicial de 100 puntos:

| Dimensión | Peso | Ejemplo de medición |
|---|---:|---|
| Activación | 20 | Recorrido definido completado. |
| Adopción | 25 | Usuarios esperados activos y tareas recurrentes. |
| Calidad | 15 | Integridad de recepciones y órdenes. |
| Resultado | 20 | Avance contra métrica acordada. |
| Relación | 10 | Patrocinador y administrador comprometidos. |
| Soporte | 10 | Incidentes, severidad y recurrencia. |

### Fórmula

```text
Salud = Activación + Adopción + Calidad + Resultado + Relación + Soporte
```

### Bandas iniciales

| Puntaje | Estado | Acción |
|---:|---|---|
| 80–100 | Saludable | Consolidar valor y explorar expansión pertinente. |
| 60–79 | Atención | Plan correctivo con responsable y fecha. |
| 0–59 | Riesgo | Intervención ejecutiva y revisión de encaje. |

Los pesos y umbrales son hipótesis. Deben calibrarse con datos de renovación y cancelación; no manipular el puntaje para ocultar un riesgo cualitativo crítico.

### Riesgos que prevalecen sobre el puntaje

- patrocinador abandona la empresa;
- incidente grave no resuelto;
- incumplimiento contractual;
- requisito crítico descubierto tarde;
- solicitud explícita de cancelación;
- ausencia de uso del flujo central.

---

## 12. Señales tempranas de churn

### Producto

- no se completa la primera recepción real;
- caída sostenida de usuarios activos;
- uso concentrado en una sola persona;
- órdenes creadas pero no actualizadas;
- retorno a formatos paralelos;
- errores recurrentes en canales de comunicación.

### Relación

- patrocinador ausente;
- reuniones canceladas repetidamente;
- administrador sin tiempo ni reemplazo;
- preguntas solo reactivas, sin objetivos;
- promesa comercial discutida o no documentada.

### Resultado

- métrica de valor nunca definida;
- no existe línea base;
- el problema prioritario cambió;
- la capacidad central requerida no está disponible;
- el cliente no percibe mejora en el proceso.

### Comercial

- factura o renovación cuestionada sin conversación de valor;
- comparación activa con competidor;
- reducción del negocio o cambio de estrategia;
- uso por debajo del alcance contratado.

---

## 13. Playbooks de intervención

### 13.1 No activó en 7 días operativos

1. Confirmar bloqueo exacto.
2. Reducir la primera fase a un recorrido.
3. Reasignar responsable y fecha.
4. Ejecutar sesión de trabajo, no otra demo general.
5. Escalar al patrocinador si no hay disponibilidad.

**Mensaje:**

> Aún no hemos completado el recorrido que define la activación. El bloqueo actual es **[causa]**. Propongo una sesión de **[duración]** con **[personas]** para procesar **[caso real]** antes de **[fecha]**. Si no existe disponibilidad, debemos reprogramar formalmente el lanzamiento.

### 13.2 Uso concentrado en una persona

1. Identificar tareas y conocimiento exclusivos.
2. Nombrar administrador de respaldo.
3. Capacitar con el mismo caso.
4. Verificar acceso y competencia.
5. Documentar proceso interno.

### 13.3 Regreso a papel o Excel

1. Observar el proceso sin juzgar.
2. Identificar campo, velocidad o excepción que provoca el desvío.
3. Clasificar: capacitación, configuración, defecto o brecha.
4. Resolver o aceptar el flujo alterno explícitamente.
5. Medir si el desvío disminuye.

### 13.4 Campañas sin resultado

1. Revisar audiencia, consentimiento y calidad de datos.
2. Verificar plantilla, canal y entrega disponible.
3. Confirmar oferta y CTA.
4. Definir atribución.
5. Ejecutar una prueba pequeña antes de escalar.

### 13.5 Patrocinador desaparece

1. Mapear nuevo responsable económico.
2. Preparar resumen de objetivos, uso, valor y riesgos.
3. Solicitar reunión de realineación.
4. Detener expansión hasta recuperar patrocinio.

### 13.6 Brecha crítica descubierta

1. Documentar requisito y por qué no apareció antes.
2. Determinar si existe alternativa segura.
3. Estimar solo mediante proceso de producto/técnico.
4. Renegociar alcance o fecha.
5. Facilitar salida si el encaje desapareció.

### 13.7 Solicitud de cancelación

1. Confirmar motivo literal sin discutir.
2. Separar problema recuperable de falta de encaje.
3. Resolver obligaciones urgentes.
4. Presentar plan de recuperación solo si responde a la causa.
5. Respetar la decisión y ejecutar offboarding si no hay encaje.

---

## 14. Comunicaciones de onboarding

### 14.1 Bienvenida

**Asunto:** `Bienvenida a Casa Tuning | próximos pasos de [Empresa]`

```text
Hola, [Nombre]:

El objetivo acordado es [resultado]. Empezaremos por [recorrido prioritario].

Responsables:
- Patrocinador: [Nombre]
- Administrador: [Nombre]
- Customer Success: [Nombre]

Antes del kickoff necesitamos:
- [Dato o decisión]
- [Dato o decisión]
- [Dato o decisión]

Kickoff: [fecha, hora y zona horaria]
Criterio de activación: [definición]

También quedan fuera de esta fase: [exclusiones].

Saludos,
[Firma]
```

### 14.2 Recordatorio de tarea pendiente

```text
Hola, [Nombre]:

Para mantener la fecha de activación necesitamos [tarea] antes de [fecha].
Responsable acordado: [persona].
Impacto si se retrasa: [consecuencia concreta].

Si existe un bloqueo, respóndanos con el dato o la decisión necesaria para resolverlo.
```

### 14.3 Confirmación de activación

```text
Hola, equipo:

La cuenta completó el recorrido de activación acordado:
- [Hito 1]
- [Hito 2]
- [Hito 3]

Durante los próximos [periodo] mediremos:
- [Indicador]
- [Indicador]

Pendientes abiertos:
- [Acción, responsable y fecha]

Próxima revisión: [fecha].
```

### 14.4 Alerta de baja adopción

```text
Hola, [Nombre]:

Observamos [señal verificable] durante [periodo]. Esto pone en riesgo [resultado acordado].

Antes de proponer una solución queremos confirmar la causa. ¿Se debe a proceso, tiempo, capacitación o una limitación del producto?

Proponemos revisar un caso real el [fecha] con [personas].
```

### 14.5 Revisión de valor

```text
Hola, [Nombre]:

En el periodo [fechas] registramos:
- Uso: [métrica]
- Calidad: [métrica]
- Resultado: [métrica]

Frente a la línea base, observamos [cambio y método].
Todavía no podemos concluir [tema sin evidencia].

En la sesión decidiremos:
1. qué mantener;
2. qué corregir;
3. qué objetivo priorizar después.
```

---

## 15. Revisión mensual y trimestral

### Revisión mensual operativa

- adopción por rol;
- flujo completado;
- datos incompletos;
- incidentes y preguntas recurrentes;
- tareas de capacitación;
- riesgos y responsables.

### Revisión trimestral de valor

1. Objetivos acordados.
2. Uso y salud de cuenta.
3. Comparación con línea base.
4. Resultados demostrables.
5. Brechas y deuda operativa.
6. Prioridades del siguiente trimestre.
7. Alcance, renovación o expansión.

No convertir la revisión en una presentación de funciones nuevas. Debe responder si el cliente obtiene el valor comprado.

---

## 16. Renovación y expansión

### Preparación recomendada

- 120–90 días antes: revisar contrato, salud y riesgos;
- 90–60 días antes: presentar valor y plan de corrección;
- 60–30 días antes: acordar alcance y condiciones;
- antes del vencimiento: formalizar renovación o salida.

Los plazos deben adaptarse a la duración contractual.

### Requisitos para expandir

- el flujo principal está adoptado;
- existe un objetivo adicional claro;
- el nuevo módulo resuelve una necesidad confirmada;
- hay responsable y capacidad operativa;
- el valor esperado puede medirse.

No vender campañas, más usuarios o desarrollos para compensar una adopción básica fallida.

---

## 17. Prevención de churn por causa

| Causa | Prevención | Respuesta |
|---|---|---|
| Mal encaje | Calificación y exclusiones claras. | Reducir alcance o facilitar salida. |
| Promesa incorrecta | Transferencia comercial documentada. | Reconocer, corregir y renegociar. |
| Falta de adopción | Patrocinio, formación y seguimiento temprano. | Plan por rol con fecha. |
| Mala calidad de datos | Muestra, limpieza y conciliación. | Corregir reglas y responsables. |
| Brecha de producto | Validación previa de requisitos. | Alternativa, roadmap aprobado o salida. |
| Soporte deficiente | Severidades y canales definidos. | Escalamiento y análisis de recurrencia. |
| Valor no demostrado | Línea base y métrica desde kickoff. | Medición controlada y revisión ejecutiva. |
| Cambio en el negocio | Revisiones periódicas. | Replantear objetivo y alcance. |

---

## 18. Offboarding responsable

Cuando la cuenta termina:

1. Confirmar solicitud, autoridad y fecha efectiva.
2. Resolver facturación y obligaciones contractuales.
3. Acordar formato y alcance de exportación disponibles.
4. Verificar entrega e integridad de los datos exportados.
5. Revocar usuarios, tokens e integraciones.
6. Aplicar retención y eliminación según contrato y política.
7. Confirmar cierre por escrito.
8. Registrar razón de salida sin culpar al cliente.
9. Convertir el aprendizaje en acción de producto, ventas o servicio.

No retener datos como mecanismo de presión comercial. Las condiciones de portabilidad, retención y eliminación deben quedar definidas antes de la compra.

---

## 19. Automatización actual, operación manual y evolución

| Proceso | Estado recomendado |
|---|---|
| Reservas, recepciones, órdenes y fichas | Soportado por el producto. |
| Correo y WhatsApp | Soportado cuando las integraciones están configuradas. |
| Campañas | Soportado con controles operativos; validar seguimiento de estados. |
| Medición de adopción | Requiere instrumentación y/o consolidación operativa según el despliegue. |
| Puntaje de salud | Inicialmente puede calcularse fuera del producto. |
| Alertas de churn | Proceso de Customer Success hasta automatización verificada. |
| QBR y renovación | Proceso comercial/Customer Success. |
| Exportación de salida | Debe validarse y ejecutarse según capacidades y contrato. |

No describir un proceso manual como automatización existente. Esta tabla debe actualizarse cuando una capacidad quede implementada y verificada.

---

## 20. Checklist de éxito a 90 días

- [ ] Alcance y exclusiones firmados o aceptados.
- [ ] Patrocinador y administrador activos.
- [ ] Usuarios y roles correctos.
- [ ] Datos iniciales conciliados.
- [ ] Integraciones de comunicación probadas.
- [ ] Recorrido de activación completado.
- [ ] Usuarios operativos completan tareas sin asistencia continua.
- [ ] Métrica de valor tiene línea base y periodo.
- [ ] Riesgos tienen responsable y fecha.
- [ ] Administrador de respaldo capacitado.
- [ ] Revisión de valor realizada.
- [ ] Objetivo del siguiente trimestre acordado.

---

## 21. Documentos relacionados

- [Buyer personas e ICP](./5_buyer_personas.md)
- [FAQ y manejo de objeciones](./8_faq_y_manejo_objeciones.md)
- [Guiones de demo y medios](./9_guiones_demo_y_medios.md)
- [Catálogo de funcionalidades](./6_funcionalidades_del_sistema.md)
- [Configuración de entorno](../documentacion_tecnica/5_configuracion_entorno.md)
