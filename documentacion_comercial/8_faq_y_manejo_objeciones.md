# Casa Tuning — FAQ y manejo de objeciones

## 1. Objetivo

Este documento proporciona respuestas consistentes para ventas, preventa, demos y onboarding. Las respuestas describen el alcance actual de Casa Tuning; no autorizan a inventar precios, acuerdos de nivel de servicio, certificaciones o fechas de funciones futuras.

---

## 2. Método para responder una objeción

Usar la secuencia **E-P-R-P-A**:

1. **Escuchar:** dejar que el prospecto complete la idea.
2. **Precisar:** descubrir la causa real.
3. **Responder:** relacionar la necesidad con una capacidad o un límite.
4. **Probar:** demostrar, medir o compartir evidencia.
5. **Acordar:** definir el siguiente paso.

### Guion base

> Entiendo que le preocupa **[objeción]**. Para responder con precisión, ¿el riesgo principal es **[opción A]** o **[opción B]**? Casa Tuning hoy **[capacidad o límite verificable]**. Podemos validarlo mediante **[demo/prueba/documento]**. Si el resultado cumple **[criterio]**, ¿avanzamos con **[siguiente paso]**?

### Diferencia entre pregunta y objeción

- Una **pregunta** busca información: “¿Se puede trabajar sin documento?”.
- Una **objeción** expresa riesgo: “Si exige documento, mi equipo no lo usará”.
- Una **condición de descarte** impide comprar: “Necesitamos facturación electrónica en la misma plataforma”.

No intentar “derribar” una condición real. Documentarla y evaluar encaje.

---

## 3. Preguntas frecuentes sobre el producto

### 3.1 ¿Qué es Casa Tuning?

Casa Tuning es una plataforma web para gestionar reservas, clientes, vehículos, recepciones, órdenes, evidencia, comunicaciones y campañas en negocios de servicios automotrices.

### 3.2 ¿Qué problema resuelve?

Conecta información que normalmente queda repartida entre papel, hojas de cálculo, fotografías y conversaciones. El objetivo es conservar una historia consultable desde la reserva hasta la entrega y el seguimiento.

### 3.3 ¿Para qué tipo de negocio está pensada?

Su mejor encaje actual son talleres de personalización, detailing, polarizado, PPF, vinilos, audio, accesorios y servicios afines. Otros talleres pueden usarla si su recorrido de recepción y orden es similar.

### 3.4 ¿Es un ERP o un sistema contable?

No. Casa Tuning administra el recorrido operativo y comercial descrito. No reemplaza actualmente un ERP, la contabilidad ni la facturación fiscal.

### 3.5 ¿Funciona desde teléfono y tableta?

Es una aplicación web adaptable a distintos tamaños de pantalla. No debe presentarse como aplicación móvil nativa ni como solución sin conexión.

### 3.6 ¿Qué módulos incluye?

- Dashboard.
- Reservas.
- Nueva recepción.
- Órdenes.
- Clientes.
- Vehículos.
- Promociones.
- Administración de servicios, marcas y usuarios.

El alcance detallado está en [Catálogo de funcionalidades](./6_funcionalidades_del_sistema.md).

### 3.7 ¿Puedo recibir un vehículo si el cliente no presenta documento?

Sí. El flujo actual no exige el número de documento como condición obligatoria. Deben conservarse los demás datos mínimos definidos por la operación y la normativa aplicable.

### 3.8 ¿La recepción permite fotografías y firma?

Sí. La recepción admite evidencia y firma asociadas al registro. En la demo se debe validar el recorrido exacto y el dispositivo que utilizará el equipo.

### 3.9 ¿Genera una ficha técnica?

Sí. Puede generar una ficha ligada a la orden. No debe confundirse con factura fiscal, póliza, peritaje certificado ni documento legal universal.

### 3.10 ¿Maneja estados de las órdenes?

Sí. Permite consultar y actualizar el avance según el flujo implementado. Durante la implantación se deben alinear nombres, responsables y criterios de cada estado.

### 3.11 ¿Conserva el historial del cliente y el vehículo?

Sí. Clientes, vehículos, recepciones y órdenes se relacionan para consultar su historia. La calidad del historial depende de la captura consistente y de la deduplicación de datos.

### 3.12 ¿Tiene inventario o control de repuestos?

No dentro del alcance actual. Si es obligatorio, se debe definir si continúa en otra herramienta, si requiere integración o si la oportunidad no encaja.

### 3.13 ¿Permite facturar o cobrar?

No ofrece actualmente facturación fiscal, pasarela de pagos ni conciliación. Nunca presentar la ficha técnica como factura.

### 3.14 ¿Maneja varias sedes o empresas?

No existe actualmente un modelo nativo de aislamiento multitenant o multisede. Este requisito necesita evaluación técnica antes de una propuesta.

---

## 4. Preguntas frecuentes sobre comunicaciones y campañas

### 4.1 ¿Envía notificaciones por WhatsApp?

Sí, mediante la integración configurada con Kapso y plantillas de WhatsApp. La entrega final depende del proveedor, la configuración, la aprobación de plantillas y la validez del destinatario.

### 4.2 ¿Envía correos electrónicos?

Sí, mediante la integración configurada con Resend. La entrega depende, entre otros factores, de la configuración de dominio, reputación y dirección del destinatario.

### 4.3 ¿Puedo usar ambos canales?

Sí, según el evento, la plantilla y los datos disponibles. Se debe acordar qué canal es principal, cuál es respaldo y cómo se evita duplicar mensajes innecesarios.

### 4.4 ¿Las campañas pueden segmentarse?

Sí. El alcance actual contempla segmentación por criterios como marca y servicio registrado. La calidad del segmento depende de la integridad del historial.

### 4.5 ¿Puedo importar cualquier lista y enviar mensajes?

No se debe asumir. Antes del envío hay que validar consentimiento, finalidad, formato, calidad de datos, plantilla aprobada y reglas del proveedor. Casa Tuning no convierte una base sin autorización en una audiencia legalmente utilizable.

### 4.6 ¿Mide aperturas, entregas, respuestas y ventas?

No se debe prometer un embudo completo sin verificar la configuración vigente. El sistema registra la ejecución disponible, pero el seguimiento de estados como entregado o leído puede requerir webhooks y analítica adicional.

### 4.7 ¿Puede garantizarse la entrega?

No. Ningún guion comercial debe garantizarla. Se pueden controlar preparación, validación y registro; la entrega también depende de proveedores externos y del destinatario.

### 4.8 ¿Cómo se gestionan bajas y consentimiento?

La empresa usuaria debe definir la base jurídica, el consentimiento cuando aplique, la evidencia y el proceso de exclusión. Las obligaciones concretas deben revisarse con asesoría legal correspondiente a su jurisdicción.

---

## 5. Preguntas frecuentes de implantación

### 5.1 ¿Cuánto tarda la puesta en marcha?

La fecha depende del alcance, calidad de datos, configuración de canales, número de usuarios y disponibilidad del equipo. La propuesta debe incluir un cronograma después del descubrimiento; no usar una duración universal sin evaluación.

### 5.2 ¿Qué necesitamos preparar?

- responsable de proyecto;
- lista de usuarios y roles;
- catálogo de marcas y servicios;
- definición de estados y reglas operativas;
- datos que se importarán;
- plantillas y credenciales de comunicación;
- muestra de documentos y caso de prueba;
- criterios de activación.

### 5.3 ¿Podemos importar clientes y vehículos?

Es posible planificar una carga inicial, pero formato, volumen, duplicados y calidad deben analizarse. No prometer una migración automática antes de revisar una muestra.

### 5.4 ¿Se puede adaptar a nuestro proceso?

Se pueden configurar catálogos y alinear el uso con el recorrido existente. Cualquier cambio de software debe clasificarse como configuración, integración o desarrollo y cotizarse por separado cuando corresponda.

### 5.5 ¿Incluye capacitación?

La propuesta comercial debe especificar sesiones, participantes, materiales, soporte y criterios de finalización. El plan recomendado separa administradores y operadores.

### 5.6 ¿Qué pasa si el equipo no lo adopta?

La adopción se gestiona con patrocinador, responsables, datos reales, entrenamiento por rol y métricas semanales. El software ayuda, pero no reemplaza la gestión del cambio.

### 5.7 ¿Se necesita instalar algo?

La aplicación se usa desde un navegador compatible. El entorno y los dispositivos deben probarse, especialmente cámara, carga de archivos, firma y conectividad.

### 5.8 ¿Puedo empezar con un piloto?

Sí, si se define un alcance representativo, un periodo, usuarios, métricas y decisión al cierre. Un piloto sin criterio de éxito solo aplaza la decisión.

---

## 6. Preguntas frecuentes sobre seguridad y privacidad

### 6.1 ¿Cómo se controla el acceso?

El sistema implementa autenticación y roles de Administrador y Operador. La autorización debe validarse por función sensible durante la revisión técnica y mantenerse bajo el principio de menor privilegio.

### 6.2 ¿Las contraseñas se guardan de forma segura?

El sistema utiliza hash para las credenciales almacenadas. No se debe afirmar que esto cubre por sí solo todos los riesgos de identidad. Políticas de contraseña, recuperación, sesiones y comunicaciones deben revisarse en el despliegue.

### 6.3 ¿Tiene MFA o inicio de sesión empresarial?

No se debe ofrecer MFA o SSO como capacidad actual sin implementación verificada. Si es obligatorio, debe tratarse como brecha de seguridad previa a la contratación.

### 6.4 ¿Dónde se guardan fotografías y documentos?

Los datos estructurados utilizan PostgreSQL y los archivos se gestionan con almacenamiento compatible con Cloudflare R2. La región, retención, cifrado, acceso público/privado y respaldo dependen de la configuración del entorno y deben quedar en el anexo técnico.

### 6.5 ¿Los datos están cifrados?

Existen mecanismos técnicos de cifrado y transporte en la arquitectura, pero la respuesta comercial debe referirse a controles concretos y verificados. No usar la frase “cifrado de extremo a extremo” ni afirmar cobertura total sin una auditoría del flujo completo.

### 6.6 ¿Cuenta con certificaciones de seguridad?

No se debe atribuir ISO 27001, SOC 2, PCI DSS u otra certificación si no existe evidencia vigente. Se pueden compartir arquitectura, controles implementados, pruebas disponibles y plan de mejora.

### 6.7 ¿Cumple todas las leyes de protección de datos?

No ofrecer una garantía legal universal. El cumplimiento depende del responsable del tratamiento, finalidad, consentimiento, contratos, configuración y jurisdicción. La empresa debe obtener asesoría legal.

### 6.8 ¿Hay respaldo y recuperación?

La política efectiva depende de la infraestructura desplegada. Antes de cerrar una cuenta con requisitos formales se deben documentar frecuencia, retención, restauración probada, responsables, RPO y RTO.

### 6.9 ¿Puedo exportar mis datos?

Las necesidades de exportación y salida deben acordarse contractualmente y probarse antes de depender de ellas. No prometer un formato o autoservicio si todavía no está disponible.

### 6.10 ¿Quién puede ver las imágenes y fichas?

Depende del modelo de permisos y de la configuración de almacenamiento. La revisión técnica debe confirmar protección de rutas, enlaces, expiración y revocación. No afirmar que todos los enlaces son privados sin esa verificación.

---

## 7. Preguntas comerciales

### 7.1 ¿Cuánto cuesta?

El precio debe corresponder al alcance: usuarios, implantación, almacenamiento, volumen de comunicaciones, soporte, integraciones y desarrollos. Entregar únicamente la tarifa aprobada y vigente.

### 7.2 ¿Hay costos de WhatsApp y correo?

Pueden existir costos variables o planes de proveedores externos. Deben explicarse por separado y con fuente vigente; no incluirlos implícitamente si no están cubiertos.

### 7.3 ¿Existe permanencia mínima?

Responder solo con la condición contractual vigente. Si todavía no está definida, indicarlo y no improvisar.

### 7.4 ¿Incluye soporte?

La propuesta debe describir canal, horario, alcance, severidades y tiempo objetivo. No prometer atención 24/7 ni SLA sin acuerdo escrito.

### 7.5 ¿Puedo cancelar?

La respuesta depende del contrato. Deben aclararse preaviso, exportación, retención, eliminación y saldos pendientes antes de la firma.

### 7.6 ¿Qué retorno puedo esperar?

No existe una cifra universal. Se construye un caso con la línea base del prospecto: tiempo de recepción, búsquedas, reprocesos, reclamos, ocupación y recompra. Cualquier proyección debe mostrar sus supuestos.

---

## 8. Guiones para objeciones de costo

### “Es muy caro”

> Entiendo. Cuando dice “caro”, ¿lo compara con otra plataforma, con el proceso actual o con el presupuesto disponible? Para evaluar el valor, usemos tres costos observables: tiempo de reconstruir información, reprocesos por registros incompletos y oportunidades de seguimiento no ejecutadas. Si no podemos demostrar impacto suficiente sobre esos puntos, no tendría sentido avanzar.

**Prueba:** construir línea base y caso de valor.

**Siguiente paso:** “¿Podemos medir esos tres elementos durante una semana?”

### “WhatsApp y Excel no cuestan”

> El costo de licencia puede ser bajo, pero necesitamos calcular el costo del proceso completo: captura repetida, búsqueda, dependencia de personas y riesgo por evidencia dispersa. Si ese costo es realmente menor y el proceso funciona bien, Casa Tuning no debe forzar el cambio.

**Prueba:** reconstruir una orden cerrada y cronometrar la consulta.

### “El competidor cuesta menos”

> Revisemos que el alcance sea comparable: implantación, usuarios, mensajería, almacenamiento, soporte e integraciones. Después contrastamos los tres recorridos críticos. No voy a afirmar que somos más económicos sin esa información.

**Prueba:** matriz de requisitos y costo total.

### “No tengo presupuesto ahora”

> ¿El obstáculo es el momento del desembolso o que todavía no existe un impacto cuantificado? Si el problema es real pero el periodo no es adecuado, acordemos qué evento y fecha justifican retomarlo. Si no hay impacto, no conviene mantener una oportunidad artificialmente abierta.

---

## 9. Guiones para objeciones de tiempo y adopción

### “No tenemos tiempo para implementar”

> Precisamente por eso debemos limitar la primera fase. ¿Qué recorrido necesita funcionar primero: reserva, recepción u órdenes? Definimos responsables, datos mínimos y un criterio de activación. Si el equipo no puede reservar tiempo para configuración y capacitación, la implantación debe aplazarse con una fecha concreta.

### “Mi equipo no es tecnológico”

> No asumamos que el problema es la habilidad. Invitemos a dos usuarios a completar una recepción con un caso real, sin ayuda después de la capacitación. Observaremos dónde dudan y decidiremos con evidencia.

### “Registrar todo será más lento”

> Puede aumentar algunos segundos en el punto de captura y ahorrar tiempo después. Midamos el proceso completo: ingreso, búsqueda, actualización, aclaraciones y entrega. La meta no es llenar más campos, sino evitar recapturas y pérdida de contexto.

### “Prefiero esperar a que tengamos menos trabajo”

> ¿Qué ventana concreta sería viable y qué condición debe cumplirse? Si no fijamos fecha, responsable y preparación previa, la misma carga operativa probablemente seguirá aplazando el cambio.

### “Ya intentamos otro sistema y nadie lo usó”

> Eso es una señal importante. ¿Falló por complejidad, falta de patrocinio, datos, capacitación o porque no resolvía el flujo real? El piloto de Casa Tuning debe probar precisamente esa causa, con usuarios operativos y un criterio de adopción acordado.

---

## 10. Guiones para objeciones de seguridad

### “No quiero subir fotos ni datos de clientes a la nube”

> Es una preocupación válida. Necesitamos identificar qué datos consideran sensibles, qué política de retención exigen y quién puede acceder. Compartiremos el flujo técnico y los controles verificados. Si sus requisitos superan la configuración actual, quedará como brecha antes de contratar.

### “¿Pueden garantizar que nunca habrá una filtración?”

> Ningún proveedor responsable debería garantizar riesgo cero. Podemos describir controles, pruebas, respuesta a incidentes y responsabilidades. También debemos documentar las brechas que requieran mitigación.

### “Necesitamos certificación”

> ¿Cuál certificación, alcance y fecha exige su proceso? Casa Tuning no debe atribuir una certificación no obtenida. Si es un requisito excluyente, lo registramos de inmediato para evitar una evaluación que no pueda aprobarse.

### “Necesitamos saber dónde están los datos”

> Prepararemos el anexo del entorno con base de datos, almacenamiento, proveedores, región configurada, respaldos y subencargados. La respuesta debe salir de la configuración desplegada, no de una suposición comercial.

---

## 11. Guiones para objeciones funcionales

### “Necesito facturación e inventario”

> Casa Tuning no los incluye actualmente. ¿Son requisitos obligatorios dentro de la misma plataforma o pueden permanecer en su sistema actual? Si son obligatorios y no existe integración validada, debemos reconocer que hoy no cubrimos el alcance completo.

### “Necesito varias sedes”

> El producto actual no ofrece aislamiento multisede nativo. Antes de proponer una solución debemos conocer sedes, usuarios, visibilidad cruzada y separación de datos. No corresponde simular multisede con permisos informales.

### “Quiero una app en las tiendas”

> Casa Tuning funciona como aplicación web. Si la necesidad real es usar cámara y firma desde el teléfono, lo probamos en navegador. Si la distribución nativa por tiendas es obligatoria, es una brecha actual.

### “Necesito personalizar todo”

> Separemos lo obligatorio de lo habitual. Revisaremos qué se resuelve con configuración, qué requiere integración y qué exige desarrollo. La propuesta incluirá solo cambios definidos y estimados.

### “Necesito estados de entrega de cada WhatsApp”

> El envío está integrado, pero no debemos prometer seguimiento completo de entrega y lectura sin verificar webhooks y configuración. Si esa medición es obligatoria, debe entrar como requisito técnico explícito.

---

## 12. Guiones para objeciones de decisión

### “Envíeme información y yo le aviso”

> Con gusto. Para no enviar material genérico, ¿cuál de estos problemas es prioritario: recepción, seguimiento de órdenes o reactivación? Le envío el documento correspondiente y acordamos una revisión de 15 minutos en **[fecha]** para decidir si existe encaje.

### “Tengo que hablar con mi socio”

> ¿Qué criterios utilizará su socio y qué preocupación anticipa? Podemos preparar una síntesis con alcance, brechas, inversión y prueba. Lo ideal es que participe en la siguiente conversación para responder directamente.

### “Estamos viendo otras opciones”

> Es razonable. Propongo acordar una matriz común con requisitos obligatorios, primera fase y deseables. Casa Tuning debe ganar o perder sobre el mismo caso operativo y con las brechas visibles.

### “No es prioridad”

> Entendido. ¿El problema no tiene impacto o existe otra iniciativa más urgente? Si hay una fecha o evento que cambie la prioridad, lo registramos. Si no, cerramos la oportunidad por ahora sin insistencia innecesaria.

---

## 13. Frases que deben evitarse

| Evitar | Sustituir por |
|---|---|
| “Es 100 % seguro.” | “Estos son los controles verificados y estas son las brechas conocidas.” |
| “Se implementa en un día.” | “El cronograma depende de alcance, datos e integraciones.” |
| “Le va a aumentar las ventas.” | “Definiremos cómo medir reactivación y conversión.” |
| “No necesita capacitación.” | “La capacitación se ajusta a cada rol.” |
| “Tenemos todo lo que necesita.” | “Validemos los requisitos obligatorios uno por uno.” |
| “El competidor no hace eso.” | “No lo encontramos verificado; solicite que lo demuestren.” |
| “WhatsApp garantiza que lo leerán.” | “El canal facilita el contacto; entrega y lectura dependen de terceros.” |
| “Cumplimos toda la normativa.” | “Documentamos controles y responsabilidades; el cumplimiento se evalúa por jurisdicción.” |

---

## 14. Escalamiento de respuestas

| Pregunta | Responsable inicial | Cuándo escalar |
|---|---|---|
| Función visible | Ventas/Producto | Si el caso no aparece en el catálogo. |
| Precio y contrato | Responsable comercial | Si requiere descuento o excepción. |
| Seguridad | Responsable técnico | Siempre que exista cuestionario o requisito formal. |
| Privacidad/legal | Responsable contractual/asesor legal | Ante garantías, tratamiento o jurisdicción. |
| Integración | Arquitectura/Desarrollo | Antes de prometer compatibilidad o fecha. |
| Migración | Implementación | Antes de cotizar volumen y limpieza. |
| Soporte/SLA | Operaciones | Antes de comprometer tiempos. |

### Respuesta cuando no se sabe

> No quiero responder con una suposición. Registraré el requisito exacto, el entorno y la fecha en que necesita respuesta. Volveremos con evidencia y, si existe una limitación, también quedará explícita.

---

## 15. Registro de objeciones

```json
{
  "cuenta": "",
  "persona": "dueño | operaciones | usuario | marketing | técnico",
  "objecion_literal": "",
  "categoria": "costo | tiempo | seguridad | funcional | decisión",
  "causa_confirmada": "",
  "respuesta_utilizada": "",
  "evidencia_entregada": "",
  "resultado": "resuelta | pendiente | descarte",
  "accion": "",
  "responsable": "",
  "fecha": "AAAA-MM-DD"
}
```

Revisar mensualmente las objeciones repetidas. Una recurrencia alta puede indicar un problema de mensaje, producto, precio, evidencia o ICP.

---

## 16. Documentos relacionados

- [Buyer personas e ICP](./5_buyer_personas.md)
- [Battlecards de competencia](./7_battlecards_competencia.md)
- [Guiones de demo y medios](./9_guiones_demo_y_medios.md)
- [Onboarding y retención](./10_onboarding_y_retencion.md)
