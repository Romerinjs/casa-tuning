# Casa Tuning — Configuración de entorno

## 1. Objetivo

Esta guía describe cómo levantar Casa Tuning en local y cómo promoverlo a staging de forma reproducible y segura.

## 2. Estado actual de la infraestructura

| Recurso | Estado en repositorio |
|---|---|
| `package-lock.json` | Presente; usar `npm ci`. |
| `.env.example` | Ausente. |
| Dockerfile | Ausente. |
| Docker Compose | Ausente. |
| CI/CD | No hay workflows versionados. |
| Tests automatizados | No configurados. |
| Migraciones completas | No; solo existe una migración inicial desactualizada. |
| Proveedor de staging | No documentado en el repositorio. |

Los bloques de contenedores de esta guía son una **configuración objetivo sugerida**. No representan archivos ya existentes.

## 3. Requisitos del sistema

### 3.1 Requisitos mínimos del proyecto

- Git.
- Node.js compatible con Next.js 16.2.7.
- npm compatible con lockfile v3.
- PostgreSQL accesible por URL.
- Navegador moderno.

El proyecto no declara `engines`. El entorno auditado usa:

```text
Node.js v24.19.0
npm 11.17.0
```

Para reproducibilidad, se recomienda fijar Node.js **24.x** en `.nvmrc`, Volta, CI o la imagen de ejecución antes del próximo despliegue.

### 3.2 Requisitos opcionales

- Docker Desktop o Docker Engine + Compose para PostgreSQL local.
- Cuenta Cloudflare con bucket R2.
- Cuenta Resend y dominio remitente verificado.
- Cuenta Kapso conectada a WhatsApp Business.
- Scheduler compatible con llamadas HTTP autenticadas.

## 4. Instalación local

### 4.1 Clonar y entrar al proyecto

```powershell
git clone <URL_DEL_REPOSITORIO> casa-tuning
Set-Location casa-tuning
```

Si el repositorio ya existe, no es necesario repetir este paso.

### 4.2 Instalar dependencias

```powershell
npm ci
```

No usar `npm install` en CI si no se pretende actualizar el lockfile.

### 4.3 Crear configuración local

Crear un archivo `.env` en la raíz. El `.gitignore` ya excluye `.env*`.

```dotenv
# Aplicación y sesión
AUTH_SECRET="reemplazar-con-secreto-aleatorio"

# Base de datos
DATABASE_URL="postgresql://casa_tuning:contraseña_local@localhost:5432/casa_tuning?schema=public"

# Cifrado de documento: exactamente 32 caracteres en la implementación actual
ENCRYPTION_KEY="local-only-change-me-32-chars!!!"

# Cloudflare R2
R2_ACCOUNT_ID="cuenta-r2"
R2_ACCESS_KEY_ID="access-key"
R2_SECRET_ACCESS_KEY="secret-key"
R2_BUCKET_NAME="casa-tuning-local"
R2_PUBLIC_URL="https://cdn-local.example.com"

# Correo
RESEND_API_KEY="re_xxxxxxxxx"
RESEND_FROM_EMAIL="Casa Tuning <notificaciones@example.com>"

# WhatsApp vía Kapso
KAPSO_API_BASE_URL="https://api.kapso.ai"
KAPSO_API_KEY="kp_xxxxxxxxx"
WHATSAPP_PHONE_NUMBER_ID="phone-number-id"
WHATSAPP_WABA_ID="whatsapp-business-account-id"

# Automatización
CRON_SECRET="reemplazar-con-secreto-aleatorio-independiente"
```

No reutilizar `AUTH_SECRET`, `ENCRYPTION_KEY` y `CRON_SECRET`.

### 4.4 Generar secretos

Ejemplo con Node.js:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

La implementación actual de `ENCRYPTION_KEY` exige exactamente 32 caracteres, no 32 bytes codificados en Base64. Genere una clave independiente que cumpla esa longitud y consérvela en un gestor de secretos.

## 5. Variables de entorno

### 5.1 Matriz completa

| Variable | Obligatoria | Consumidor | Secreta | Comportamiento si falta |
|---|:---:|---|:---:|---|
| `DATABASE_URL` | Sí | Prisma/`pg` | Sí | La app no puede consultar datos. |
| `AUTH_SECRET` | Sí en despliegue | Auth.js | Sí | Sesiones inseguras o fallo según entorno. |
| `ENCRYPTION_KEY` | Sí para documentos | `security.ts` | Sí | Falla cifrado/descifrado. |
| `R2_ACCOUNT_ID` | Sí para archivos | `storage.ts` | No | Integración R2 se rechaza. |
| `R2_ACCESS_KEY_ID` | Sí para archivos | `storage.ts` | Sí | Integración R2 se rechaza. |
| `R2_SECRET_ACCESS_KEY` | Sí para archivos | `storage.ts` | Sí | Integración R2 se rechaza. |
| `R2_BUCKET_NAME` | Sí para archivos | `storage.ts` | No | Integración R2 se rechaza. |
| `R2_PUBLIC_URL` | Sí para lectura actual | `storage.ts`, emails | No | Integración R2 se rechaza. |
| `RESEND_API_KEY` | Sí para correo | `emails.ts` | Sí | El envío se omite con error controlado. |
| `RESEND_FROM_EMAIL` | Sí en staging/prod | `emails.ts` | No | Usa fallback de prueba; no aceptable en prod. |
| `KAPSO_API_BASE_URL` | No | WhatsApp | No | Usa `https://api.kapso.ai`. |
| `KAPSO_API_KEY` | Sí para WhatsApp | WhatsApp/admin | Sí | Los envíos fallan sin bloquear operación. |
| `WHATSAPP_PHONE_NUMBER_ID` | Sí para envío | WhatsApp/admin | Sensible | Los envíos fallan. |
| `WHATSAPP_WABA_ID` | Sí para plantillas | Promociones | Sensible | No se consultan plantillas. |
| `CRON_SECRET` | Sí | Cron | Sí | Hoy usa un default inseguro; debe corregirse. |
| `NODE_ENV` | Gestionada por Next.js | App/cron | No | Afecta controles y caché de Prisma. |

### 5.2 Reglas

1. Nunca imprimir valores secretos en logs.
2. Nunca prefijar secretos con `NEXT_PUBLIC_`.
3. Mantener valores separados por entorno.
4. Rotar un secreto comprometido y revocar el anterior.
5. `ENCRYPTION_KEY` requiere un plan de recifrado antes de rotarse.
6. Guardar staging/producción en un gestor de secretos, no en archivos del servidor.

## 6. PostgreSQL local con Docker Compose

### 6.1 Archivo sugerido

Si se adopta Docker, crear y versionar `compose.local.yaml` con una configuración revisada similar a:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: casa_tuning
      POSTGRES_USER: casa_tuning
      POSTGRES_PASSWORD: local_only_change_me
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - casa_tuning_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U casa_tuning -d casa_tuning"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  casa_tuning_pg_data:
```

Para entornos compartidos, no incluir la contraseña en el archivo. Usar `env_file` local ignorado o secrets del orquestador. En CI se recomienda fijar también el digest de la imagen.

### 6.2 Arranque y parada

Solo después de crear el archivo:

```powershell
docker compose -f compose.local.yaml up -d
docker compose -f compose.local.yaml ps
docker compose -f compose.local.yaml logs postgres
docker compose -f compose.local.yaml down
```

`down` conserva el volumen. No use `down --volumes` sobre una base que necesite conservar.

## 7. Prisma y base de datos

### 7.1 Validar configuración

Después de `npm ci`:

```powershell
npm exec -- prisma validate
npm exec -- prisma generate
```

### 7.2 Advertencia de migración

No ejecute directamente `migrate deploy` contra un staging existente hasta reconciliar la divergencia entre:

- `prisma/schema.prisma`;
- `prisma/migrations/20260609160010_init/migration.sql`;
- el esquema real de la base.

La migración inicial carece de cambios posteriores. Ejecutarla sobre una base vacía no produce el modelo que espera el código actual.

### 7.3 Flujo seguro de reconciliación

1. Crear una copia o snapshot de la base de staging.
2. Extraer el esquema real sin exponer datos.
3. Compararlo con Prisma.
4. Resolver diferencias y datos incompatibles.
5. Crear una línea base en una base desechable.
6. Probar desde cero.
7. Probar actualización desde una copia anonimizada de staging.
8. Revisar SQL con otra persona.
9. Solo entonces aplicar en staging.

Comandos de diagnóstico después de instalar dependencias:

```powershell
npm exec -- prisma migrate status
npm exec -- prisma validate
```

### 7.4 Flujo normal después de reconciliar

Desarrollo:

```powershell
npm exec -- prisma migrate dev --name nombre_descriptivo
npm exec -- prisma generate
```

Staging/producción:

```powershell
npm exec -- prisma migrate deploy
```

No usar `prisma db push` como sustituto de migraciones versionadas en entornos persistentes.

## 8. Datos iniciales

El repositorio define:

```powershell
npm exec -- prisma db seed
```

El seed crea catálogos y un administrador de demostración. También restablece su contraseña a un valor conocido cada vez que se ejecuta.

> Ejecutar el seed actual únicamente en una base local desechable. No ejecutarlo en staging ni producción hasta eliminar la credencial fija y separar datos de referencia del bootstrap de usuarios.

Estado objetivo:

- seed idempotente solo para roles, tipos de documento, estados y servicios;
- usuario inicial mediante flujo de invitación;
- credencial de un solo uso proporcionada por secret manager;
- auditoría del bootstrap.

## 9. Arrancar la aplicación local

```powershell
npm run dev
```

Abrir:

```text
http://localhost:3000
```

### 9.1 Flujo de humo local

1. Iniciar sesión con un usuario creado de forma segura en la base local.
2. Abrir Dashboard.
3. Crear una reserva válida.
4. Convertirla en recepción sin número de documento.
5. Verificar cliente, vehículo, orden y actividad.
6. Pasar la orden a trabajo y entrega.
7. Registrar firma y generar ficha técnica.
8. Probar comunicaciones solo con números/correos de sandbox autorizados.

## 10. Verificación de calidad

### 10.1 Comandos disponibles

```powershell
npm run lint
npm run build
npm run start
```

`npm run start` requiere un build previo.

### 10.2 Limitación actual

No existe script `test`. Lint y build detectan parte de los problemas, pero no demuestran reglas de negocio.

Antes de ampliar funcionalidad se debe incorporar:

- pruebas unitarias de normalización, cifrado y estados;
- pruebas de integración con PostgreSQL desechable;
- pruebas de contrato para R2, Resend y Kapso;
- pruebas end-to-end de reserva → recepción → entrega.

## 11. Configuración de Cloudflare R2

### 11.1 Bucket

Crear buckets distintos para local compartido, staging y producción. Las credenciales deben limitarse al bucket y operaciones requeridas.

### 11.2 CORS para subida directa

Ejemplo conceptual para staging:

```json
[
  {
    "AllowedOrigins": ["https://staging.example.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

No usar `*` en producción si puede enumerarse el origen.

### 11.3 Acceso público

La aplicación actual compone URLs públicas. Para firmas, documentos y evidencias, el estado objetivo es bucket privado y URLs de lectura firmadas con expiración corta.

## 12. Configuración de Resend

1. Verificar el dominio remitente.
2. Configurar DKIM/SPF según el proveedor.
3. Crear una API key exclusiva por entorno.
4. Definir `RESEND_FROM_EMAIL` con remitente verificado.
5. Enviar únicamente a destinatarios de prueba en staging.
6. Configurar webhooks cuando exista el endpoint receptor.

No usar `onboarding@resend.dev` como remitente de staging o producción.

## 13. Configuración de Kapso y WhatsApp

1. Conectar el WABA y número emisor en Kapso.
2. Aprobar las plantillas requeridas.
3. Verificar nombres e idioma `es_MX` contra el código.
4. Crear API key por entorno.
5. Configurar `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_WABA_ID`.
6. Probar con una lista autorizada antes de campañas.
7. Registrar consentimiento y proceso de baja antes de operar marketing real.

Plantillas requeridas por la implementación:

```text
vehiculo_recibido
vehiculo_entregado
recomendaciones_servicio
reserva_confirmada_2
recordatorio_cita_2
prueba_de_sonido_2
```

Las campañas además requieren una plantilla aprobada elegida desde la interfaz.

## 14. Configuración del cron

### 14.1 Frecuencia sugerida

Ejecutar cada 15–30 minutos. El handler busca reservas pendientes dentro de las próximas 24 horas.

### 14.2 Solicitud de prueba en PowerShell

```powershell
$CasaTuningCronSecret = "secreto-de-staging"
$CasaTuningHeaders = @{ Authorization = "Bearer $CasaTuningCronSecret" }
Invoke-RestMethod -Method Get `
  -Uri "https://staging.example.com/api/cron/reminders" `
  -Headers $CasaTuningHeaders
```

No incluir el secreto en la URL.

### 14.3 Protección requerida

- Eliminar el secreto por defecto del código.
- Rechazar siempre solicitudes no autorizadas, también en staging.
- Impedir ejecuciones concurrentes.
- Alertar si no se ejecuta dentro de la ventana esperada.
- Registrar duración, reservas encontradas, éxitos y fallos.

## 15. Despliegue a staging

### 15.1 Preparación

- [ ] Runtime Node fijado.
- [ ] Dependencias instaladas con `npm ci`.
- [ ] Base separada y respaldada.
- [ ] Historia de migraciones reconciliada.
- [ ] Bucket R2 de staging.
- [ ] Dominio de correo y credenciales de prueba.
- [ ] WABA/número de prueba o lista restringida.
- [ ] Secretos en gestor del proveedor.
- [ ] Scheduler configurado con Bearer token.

### 15.2 Pipeline mínimo

```text
Checkout
  → npm ci
  → prisma validate
  → prisma generate
  → lint
  → build
  → backup/snapshot
  → prisma migrate deploy
  → deploy
  → smoke tests
  → habilitar cron
```

### 15.3 Build y proceso

```powershell
npm ci
npm exec -- prisma validate
npm exec -- prisma generate
npm run lint
npm run build
npm exec -- prisma migrate deploy
npm run start
```

La plataforma debe inyectar `PORT` si usa un puerto distinto y enrutar HTTPS al proceso Next.js.

### 15.4 Contenedorización de aplicación

El repositorio no está preparado hoy para una imagen optimizada. Si se decide Dockerizar:

1. Añadir `output: "standalone"` solo después de revisar el comportamiento de Next.js 16.
2. Crear Dockerfile multi-stage.
3. Ejecutar como usuario no root.
4. Copiar assets y salida standalone requeridos.
5. Incluir `pdfkit` y fuentes necesarias.
6. No copiar `.env` a la imagen.
7. Probar generación PDF y acceso R2 dentro del contenedor.

No documentar una imagen como soportada hasta ejecutar este flujo de extremo a extremo.

## 16. Smoke tests de staging

| Caso | Resultado esperado |
|---|---|
| Login válido/inválido | Sesión correcta o error genérico. |
| Operador abre Administración | Redirección/403. |
| Reserva en domingo | Rechazada. |
| Recepción sin documento | Creada correctamente. |
| Placa activa de otro cliente | Conflicto claro. |
| Conversión de reserva | Orden creada y reserva atendida. |
| Generación de ficha | PDF legible y accesible según política. |
| Falla simulada de Resend/Kapso | Operación persiste y fallo queda observable. |
| Cron sin token | `401`. |
| Cron con token | Resumen JSON y sin duplicados. |

## 17. Copias y recuperación

Antes de producción definir:

- RPO: pérdida máxima de datos aceptable.
- RTO: tiempo máximo de recuperación.
- backup automático de PostgreSQL.
- retención y cifrado de backups.
- versionado/retención de objetos R2.
- restauración ensayada en un entorno aislado.
- procedimiento para reanudar notificaciones pendientes.

## 18. Troubleshooting

### 18.1 `DATABASE_URL variable is not set`

- Comprobar que `.env` exista en la raíz.
- Reiniciar el proceso después de cambiar variables.
- No imprimir la URL completa; verificar host/puerto/usuario por separado.

### 18.2 Prisma reporta drift

Detener el despliegue. No resetear una base compartida. Seguir la reconciliación del apartado 7.3.

### 18.3 R2 “no está configurado”

Verificar las cinco variables R2 y que no conserven placeholders. Confirmar permisos, endpoint y CORS.

### 18.4 No llegan correos

- Confirmar API key y remitente verificado.
- Revisar respuesta de Resend sin exponer destinatarios.
- Comprobar que el cliente tenga correo.
- Recordar que una idempotency key existente puede impedir un reenvío idéntico.

### 18.5 No llega WhatsApp

- Confirmar phone number ID, WABA ID y API key.
- Verificar estado `APPROVED`, nombre e idioma de plantilla.
- Comprobar formato E.164.
- Distinguir “API aceptó” de “mensaje entregado”.

### 18.6 El cron no envía

- Verificar ventana de 24 horas, estado `PENDIENTE` y `reminderSent=false`.
- Confirmar autorización Bearer.
- Revisar zona horaria de la cita.
- Comprobar que Kapso esté configurado.

### 18.7 El PDF falla

- Verificar acceso a imágenes remotas.
- Confirmar disponibilidad de assets y fuentes.
- Revisar que `pdfkit` permanezca en `serverExternalPackages`.
- Probar con una orden sin evidencias para aislar el recurso inválido.

## 19. Comandos esenciales

| Objetivo | Comando |
|---|---|
| Instalar exacto | `npm ci` |
| Desarrollo | `npm run dev` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Producción local | `npm run start` |
| Validar Prisma | `npm exec -- prisma validate` |
| Generar cliente | `npm exec -- prisma generate` |
| Estado migraciones | `npm exec -- prisma migrate status` |
| Migrar desarrollo | `npm exec -- prisma migrate dev --name <nombre>` |
| Migrar staging/prod | `npm exec -- prisma migrate deploy` |
| Seed local | `npm exec -- prisma db seed` |

## 20. Definition of Done operacional

Un entorno no se considera listo porque la página principal cargue. Debe cumplir:

- configuración validada sin defaults inseguros;
- migraciones reproducibles;
- build y lint exitosos;
- autorización probada por rol;
- R2, Resend y Kapso probados de forma controlada;
- cron autenticado e idempotente;
- backup y restauración comprobados;
- logs y alertas disponibles;
- smoke test completo aprobado.
