# Especificación SSD: Inicialización de Proyecto y Base de Datos

Este documento define la estructura inicial del repositorio y la configuración base de la base de datos para **Casa Tuning - Portal Operativo**.

## 1. Objetivos del Cambio
* Configurar la estructura de carpetas modular para desacoplar las vistas de Next.js (routing) de los módulos funcionales.
* Instalar y configurar Prisma ORM y la conexión a la base de datos PostgreSQL.
* Implementar el esquema relacional mapeado a `snake_case` en PostgreSQL manteniendo `camelCase` en TypeScript para cumplir con las mejores prácticas y los requerimientos del modelo de datos.
* Configurar el cliente singleton de Prisma para Next.js.

## 2. Estructura de Carpetas Propuesta
Para lograr una raíz limpia y un código altamente modular, se usará la siguiente organización en `src/`:

* **`src/app/`**: Solo contendrá rutas, layouts y archivos de inicialización de páginas. Delegará el renderizado y la lógica a los módulos correspondientes.
* **`src/components/ui/`**: Componentes visuales genéricos y reutilizables en toda la aplicación (ej. botones, inputs, modales).
* **`src/lib/`**: Proveedores de servicios transversales y clientes compartidos (ej. `prisma.ts`).
* **`src/modules/`**: Contendrá los módulos funcionales independientes. Cada módulo (dashboard, reception, clients, orders) agrupará:
  - `components/`: Componentes internos del módulo.
  - `actions.ts`: Server Actions para mutación de datos.
  - `queries.ts`: Lógicas de consulta de datos a base de datos.
  - `types.ts`: Definición de tipos y tipos de TypeScript.

## 3. Modelo de Datos y Esquema de Prisma
El archivo `prisma/schema.prisma` mapeará los modelos de TypeScript en `camelCase` a las tablas en `snake_case` de la base de datos relacional PostgreSQL usando directivas `@map` y `@@map`.

### Esquema Completo
```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// --- TABLAS DE CATÁLOGO (Lookups) ---

model Role {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(50)
  description String?  @db.VarChar(255)
  
  users       User[]

  @@map("roles")
}

model OrderStatus {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(50)
  description String?  @db.VarChar(255)
  
  orders      Order[]

  @@map("order_statuses")
}

model Brand {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(50)
  
  cars        Car[]

  @@map("brands")
}

model ServiceCatalog {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(100)
  isActive    Boolean  @default(true) @map("is_active")
  
  orderItems  OrderService[]

  @@map("service_catalog")
}

// --- TABLAS PRINCIPALES ---

model User {
  id            Int           @id @default(autoincrement())
  name          String        @db.VarChar(100)
  email         String        @unique @db.VarChar(150)
  passwordHash  String        @map("password_hash") @db.VarChar(255)
  isActive      Boolean       @default(true) @map("is_active")
  createdAt     DateTime      @default(now()) @map("created_at")
  
  roleId        Int           @map("role_id")
  role          Role          @relation(fields: [roleId], references: [id])
  
  ordersCreated Order[]       @relation("OrderCreator")
  activities    ActivityLog[]

  @@index([roleId])
  @@map("users")
}

model Client {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(150)
  phone     String   @unique @db.VarChar(20)
  email     String?  @db.VarChar(150)
  createdAt DateTime @default(now()) @map("created_at")
  
  cars      Car[]
  orders    Order[]

  @@map("clients")
}

model Car {
  id        Int      @id @default(autoincrement())
  plate     String   @unique @db.VarChar(10)
  model     String   @db.VarChar(100)
  year      Int
  color     String   @db.VarChar(50)
  
  clientId  Int      @map("client_id")
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  brandId   Int      @map("brand_id")
  brand     Brand    @relation(fields: [brandId], references: [id])
  
  orders    Order[]

  @@index([clientId])
  @@index([brandId])
  @@map("cars")
}

// --- NÚCLEO OPERATIVO ---

model Order {
  id            Int         @id @default(autoincrement())
  code          String      @unique @db.VarChar(20)
  mileage       String?     @db.VarChar(50)
  signatureUrl  String?     @map("signature_url") @db.VarChar(255)
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  statusId      Int         @map("status_id")
  status        OrderStatus @relation(fields: [statusId], references: [id])
  clientId      Int         @map("client_id")
  client        Client      @relation(fields: [clientId], references: [id])
  carId         Int         @map("car_id")
  car           Car         @relation(fields: [carId], references: [id])
  creatorId     Int         @map("creator_id")
  creator       User        @relation("OrderCreator", fields: [creatorId], references: [id])
  
  services      OrderService[]
  inspections   VisualInspection[]
  photos        OrderPhoto[]
  activities    ActivityLog[]
  notifications OrderNotification[]

  @@index([statusId])
  @@index([createdAt])
  @@index([carId])
  @@index([clientId])
  @@map("orders")
}

// --- TABLAS INTERMEDIAS Y DETALLES ---

model OrderService {
  orderId   Int @map("order_id")
  serviceId Int @map("service_id")
  
  order     Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  service   ServiceCatalog @relation(fields: [serviceId], references: [id])

  @@id([orderId, serviceId])
  @@index([serviceId])
  @@map("order_services")
}

model VisualInspection {
  id        Int    @id @default(autoincrement())
  partName  String @map("part_name") @db.VarChar(100)
  
  orderId   Int    @map("order_id")
  order     Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@map("visual_inspections")
}

model OrderPhoto {
  id         Int      @id @default(autoincrement())
  r2Url      String   @map("r2_url") @db.VarChar(255)
  uploadedAt DateTime @default(now()) @map("uploaded_at")
  
  orderId    Int      @map("order_id")
  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@map("order_photos")
}

// --- REGISTROS Y NOTIFICACIONES ---

model ActivityLog {
  id          Int      @id @default(autoincrement())
  description String   @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
  
  orderId     Int      @map("order_id")
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  userId      Int?     @map("user_id")
  user        User?    @relation(fields: [userId], references: [id])

  @@index([orderId])
  @@map("activity_logs")
}

model OrderNotification {
  id               Int      @id @default(autoincrement())
  platform         String   @db.VarChar(50) // Ej: 'WHATSAPP', 'EMAIL'
  notificationType String   @map("notification_type") @db.VarChar(50) // Ej: 'RECEPCION'
  sentAt           DateTime @default(now()) @map("sent_at")
  
  orderId          Int      @map("order_id")
  order            Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@map("order_notifications")
}
