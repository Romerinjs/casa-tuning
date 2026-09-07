# Soft-delete de órdenes entregadas — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que cualquier usuario autenticado oculte individualmente del panel /ordenes las órdenes nuevas o históricas que estén entregadas y firmadas, conservando intactos sus datos y su auditoría en el resto de la aplicación.

**Architecture:** Order.hiddenFromOrdersAt representará exclusivamente la visibilidad dentro de /ordenes; el estado seguirá siendo ENTREGADO. Una función de dominio probará la elegibilidad, una Server Action volverá a validar los datos y ejecutará actualización más auditoría en una transacción, y la página filtrará únicamente ese panel. Un componente modal aislado controlará el bloqueo por falta de firma y la confirmación de dos pasos.

**Tech Stack:** Next.js 16.2.7 App Router, React 19.2.4, TypeScript 5, Prisma 7.8/PostgreSQL, Vitest, Testing Library y jsdom.

**Spec:** docs/superpowers/specs/2026-09-07-soft-delete-ordenes-entregadas-design.md

## Global Constraints

- El ocultamiento afecta exclusivamente la consulta y la interfaz de /ordenes.
- Solo una orden con estado exacto ENTREGADO y signatureUrl no vacío puede ocultarse.
- Cualquier usuario autenticado puede ejecutar la acción.
- Todas las órdenes existentes comienzan visibles y pueden ocultarse individualmente si cumplen las reglas.
- No se elimina físicamente ninguna orden, relación, firma, foto, PDF, comentario, notificación ni actividad.
- Cada ocultamiento exitoso crea exactamente un ActivityLog con el texto “Orden ocultada del panel de órdenes”.
- No se incorpora restauración, ocultamiento masivo ni ocultamiento automático.
- Antes de editar APIs de Next.js, leer la guía relevante bajo node_modules/next/dist/docs/. Si sigue ausente después de restaurar dependencias, detener esa tarea e informar el bloqueo antes de escribir esas APIs.

---

## Estructura de archivos

- prisma/schema.prisma: declara Order.hiddenFromOrdersAt.
- prisma/migrations/20260907090000_add_order_hidden_from_orders_at/migration.sql: añade la columna nullable.
- src/modules/orders/order-visibility.ts: reglas y tipos de elegibilidad.
- src/modules/orders/order-visibility.test.ts: pruebas de estado, firma y repetición.
- src/modules/orders/hide-order.ts: servicio de aplicación desacoplado de Prisma.
- src/modules/orders/hide-order.test.ts: contrato de persistencia y auditoría.
- src/modules/orders/order-query.ts: consulta Prisma exclusiva de /ordenes.
- src/modules/orders/order-query.test.ts: prueba del contrato de consulta.
- src/app/(authenticated)/ordenes/actions.ts: Server Action autenticada y adaptador Prisma.
- src/app/(authenticated)/ordenes/page.tsx: aplica el único filtro.
- src/components/HideOrderModal.tsx: bloqueo y confirmación doble.
- src/components/HideOrderModal.test.tsx: interacciones del modal.
- src/components/OrdenesClientView.tsx: integra botón, firma, acción y notificaciones.
- vitest.config.ts y src/test/setup.ts: infraestructura de pruebas.

### Task 1: Infraestructura de pruebas y regla de dominio

**Files:**
- Modify: package.json
- Modify: package-lock.json
- Create: vitest.config.ts
- Create: src/test/setup.ts
- Create: src/modules/orders/order-visibility.test.ts
- Create: src/modules/orders/order-visibility.ts

**Interfaces:**
- Produces: evaluateOrderHideEligibility(order: HideableOrder): HideEligibility.
- HideEligibility es una unión discriminada: eligible, unsigned, wrong-status o already-hidden.

- [ ] **Step 1: Instalar la infraestructura mínima**

Run:

~~~powershell
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
~~~

Añadir los scripts "test": "vitest run" y "test:watch": "vitest". Crear vitest.config.ts con alias @ hacia src, environment jsdom y setupFiles ["./src/test/setup.ts"]. El setup importará @testing-library/jest-dom/vitest.

- [ ] **Step 2: Escribir las pruebas fallidas**

Crear cuatro casos con expectativas literales:

~~~ts
expect(evaluateOrderHideEligibility({
  statusName: "ENTREGADO",
  signatureUrl: "/uploads/signatures/sig-14.png",
  hiddenFromOrdersAt: null,
})).toEqual({ kind: "eligible" });
~~~

Repetir para firma null → unsigned, EN_PROCESO → wrong-status y hiddenFromOrdersAt con fecha → already-hidden.

- [ ] **Step 3: Ejecutar RED**

Run: npx vitest run src/modules/orders/order-visibility.test.ts

Expected: FAIL porque ./order-visibility todavía no existe.

- [ ] **Step 4: Implementar la regla mínima**

~~~ts
export interface HideableOrder {
  statusName: string;
  signatureUrl: string | null;
  hiddenFromOrdersAt: Date | null;
}

export type HideEligibility =
  | { kind: "eligible" }
  | { kind: "unsigned" }
  | { kind: "wrong-status" }
  | { kind: "already-hidden" };

export function evaluateOrderHideEligibility(order: HideableOrder): HideEligibility {
  if (order.hiddenFromOrdersAt) return { kind: "already-hidden" };
  if (order.statusName !== "ENTREGADO") return { kind: "wrong-status" };
  if (!order.signatureUrl?.trim()) return { kind: "unsigned" };
  return { kind: "eligible" };
}
~~~

- [ ] **Step 5: Ejecutar GREEN y commit**

Run: npx vitest run src/modules/orders/order-visibility.test.ts

Expected: 4 tests PASS.

Run: npx tsc --noEmit

~~~powershell
git add package.json package-lock.json vitest.config.ts src/test src/modules/orders/order-visibility*
git commit -m "test: add order visibility rules"
~~~

### Task 2: Persistencia nullable y cliente Prisma

**Files:**
- Modify: prisma/schema.prisma
- Create: prisma/migrations/20260907090000_add_order_hidden_from_orders_at/migration.sql
- Regenerate: src/generated/prisma/
- Modify: src/modules/orders/order-visibility.test.ts

**Interfaces:**
- Produces: Order.hiddenFromOrdersAt: Date | null, mapeado a orders.hidden_from_orders_at.

- [ ] **Step 1: Añadir una comprobación de tipos que falle**

~~~ts
import type { Order } from "@/generated/prisma/client";

it("el modelo generado expone la marca de visibilidad", () => {
  const field: keyof Order = "hiddenFromOrdersAt";
  expect(field).toBe("hiddenFromOrdersAt");
});
~~~

- [ ] **Step 2: Ejecutar RED**

Run: npx tsc --noEmit

Expected: FAIL porque hiddenFromOrdersAt no pertenece aún a keyof Order.

- [ ] **Step 3: Añadir campo y migración**

En Order:

~~~prisma
hiddenFromOrdersAt DateTime? @map("hidden_from_orders_at")
~~~

Migration:

~~~sql
ALTER TABLE "orders"
ADD COLUMN "hidden_from_orders_at" TIMESTAMP(3);
~~~

Run: npx prisma generate

- [ ] **Step 4: Validar GREEN y commit**

Run: npx prisma validate

Run: npx tsc --noEmit

Run: npx vitest run src/modules/orders/order-visibility.test.ts

~~~powershell
git add prisma src/generated/prisma src/modules/orders/order-visibility.test.ts
git commit -m "feat: persist orders panel visibility"
~~~

### Task 3: Acción autenticada, transacción e idempotencia

**Files:**
- Create: src/modules/orders/hide-order.ts
- Create: src/modules/orders/hide-order.test.ts
- Modify: src/app/(authenticated)/ordenes/actions.ts

**Interfaces:**
- Consumes: evaluateOrderHideEligibility.
- Produces: hideOrderWithAudit(dependencies, orderId, userId): Promise<HideOrderResult>.
- Produces: hideOrderFromOrdersPanelAction(orderId: number): Promise<HideOrderResult>.

- [ ] **Step 1: Escribir primero pruebas del servicio**

Definir un fake en memoria que implemente:

~~~ts
export interface HideOrderDependencies {
  findOrder(orderId: number): Promise<{
    id: number;
    statusName: string;
    signatureUrl: string | null;
    hiddenFromOrdersAt: Date | null;
  } | null>;
  hideAndLog(input: {
    orderId: number;
    userId: number;
    hiddenAt: Date;
    description: "Orden ocultada del panel de órdenes";
  }): Promise<void>;
  now(): Date;
}
~~~

Probar: inexistente, estado incorrecto, sin firma, ya oculta y elegible. En el elegible, comprobar exactamente un ocultamiento y un movimiento con userId. En ya oculta, comprobar cero movimientos adicionales.

- [ ] **Step 2: Ejecutar RED**

Run: npx vitest run src/modules/orders/hide-order.test.ts

Expected: FAIL porque hide-order.ts no existe.

- [ ] **Step 3: Implementar el servicio**

~~~ts
export type HideOrderResult =
  | { success: true }
  | {
      success: false;
      reason: "not-found" | "unsigned" | "wrong-status";
      error: string;
    };
~~~

El servicio consulta la orden, evalúa elegibilidad, trata already-hidden como éxito idempotente y llama hideAndLog solo para eligible.

- [ ] **Step 4: Ejecutar GREEN**

Run: npx vitest run src/modules/orders/hide-order.test.ts

Expected: todos PASS.

- [ ] **Step 5: Cumplir la documentación local de Next.js**

Si node_modules/next/dist/docs/ no existe, ejecutar npm install y volver a localizar:

~~~powershell
rg --files node_modules/next/dist/docs | rg "server-actions|revalidate"
~~~

Leer completos los documentos de Server Actions y revalidatePath. Si siguen ausentes, detener esta tarea e informar el bloqueo exigido por AGENTS.md.

- [ ] **Step 6: Conectar la Server Action**

~~~ts
export async function hideOrderFromOrdersPanelAction(
  orderId: number,
): Promise<HideOrderResult> {
  const user = await verifySession();
  const result = await hideOrderWithAudit(prismaDependencies, orderId, user.id);
  if (result.success) {
    revalidatePath("/ordenes");
    revalidatePath("/dashboard");
  }
  return result;
}
~~~

findOrder selecciona id, signatureUrl, hiddenFromOrdersAt y status.name. hideAndLog ejecuta en una sola prisma.$transaction el update de hiddenFromOrdersAt y la creación del ActivityLog.

- [ ] **Step 7: Verificar y commit**

Run: npx vitest run src/modules/orders/hide-order.test.ts src/modules/orders/order-visibility.test.ts

Run: npx tsc --noEmit

~~~powershell
git add src/modules/orders/hide-order* "src/app/(authenticated)/ordenes/actions.ts"
git commit -m "feat: hide delivered orders with audit"
~~~

### Task 4: Filtrar únicamente /ordenes

**Files:**
- Create: src/modules/orders/order-query.ts
- Create: src/modules/orders/order-query.test.ts
- Modify: src/app/(authenticated)/ordenes/page.tsx

**Interfaces:**
- Produces: getOrdersForOrdersPage(): Promise<OrdersPageRecord[]>.
- Esta función solo será consumida por OrdenesPage.

- [ ] **Step 1: Escribir prueba fallida**

Mockear únicamente @/lib/prisma como frontera externa, ejecutar getOrdersForOrdersPage y comprobar que order.findMany recibe un objeto que contiene literalmente where: { hiddenFromOrdersAt: null }. Hacer que el fake retorne una lista centinela y comprobar que la función devuelve esa misma lista; así se protege el contrato emitido a Prisma y no la implementación del framework.

- [ ] **Step 2: Ejecutar RED**

Run: npx vitest run src/modules/orders/order-query.test.ts

Expected: FAIL porque getOrdersForOrdersPage todavía no existe.

- [ ] **Step 3: Implementar e integrar**

Mover a getOrdersForOrdersPage la consulta actual de prisma.order.findMany, conservando sin cambios include y orderBy, y añadirle exclusivamente:

~~~ts
where: {
  hiddenFromOrdersAt: null,
},
~~~

OrdenesPage llamará getOrdersForOrdersPage en lugar de prisma.order.findMany. No modificar Clientes, Vehículos, Dashboard ni actividad.

- [ ] **Step 4: Verificar y commit**

Run: npx vitest run src/modules/orders/order-query.test.ts

Run: rg -n "hiddenFromOrdersAt" src/app src/components src/modules

Expected: ninguna consulta histórica adicional contiene el filtro.

Run: npx tsc --noEmit

~~~powershell
git add src/modules/orders/order-query* "src/app/(authenticated)/ordenes/page.tsx"
git commit -m "feat: filter hidden orders from orders panel"
~~~

### Task 5: Modal de bloqueo y doble confirmación

**Files:**
- Create: src/components/HideOrderModal.tsx
- Create: src/components/HideOrderModal.test.tsx

**Interfaces:**
- Produce: HideOrderModal con props order, open, pending, error, onClose, onRequestSignature y onConfirm.
- order contiene id, code, car.plate y signatureUrl.

- [ ] **Step 1: Escribir pruebas de interacción**

Con Testing Library y userEvent, probar:

- sin firma muestra exactamente “Esta orden aún no tiene firma. Debes registrar la firma para completar esta acción.” y Firmar ahora llama onRequestSignature;
- firmada inicia en el paso informativo;
- Continuar no llama onConfirm;
- solo el clic posterior en Ocultar orden llama una vez onConfirm;
- pending deshabilita la confirmación final;
- error se muestra sin cerrar el modal.

- [ ] **Step 2: Ejecutar RED**

Run: npx vitest run src/components/HideOrderModal.test.tsx

Expected: FAIL porque el componente no existe.

- [ ] **Step 3: Implementar el modal**

Usar type ConfirmationStep = "explanation" | "final". Reiniciar el paso al cambiar open u order.id. Incluir role="dialog", título accesible, cierre y botones Cancelar, Continuar, Volver, Firmar ahora y Ocultar orden según el caso. El paso final advierte que no hay restauración desde la interfaz.

- [ ] **Step 4: Ejecutar GREEN y commit**

Run: npx vitest run src/components/HideOrderModal.test.tsx

Expected: todos PASS.

~~~powershell
git add src/components/HideOrderModal*
git commit -m "feat: add double confirmation order modal"
~~~

### Task 6: Integración en tarjetas y flujo de firma

**Files:**
- Modify: src/components/OrdenesClientView.tsx
- Modify: src/components/HideOrderModal.test.tsx

**Interfaces:**
- Consumes: hideOrderFromOrdersPanelAction y HideOrderModal.
- Reuses: selectedOrder para abrir la ficha técnica con el lienzo existente.

- [ ] **Step 1: Proteger que firmar no oculta**

La prueba debe confirmar que Firmar ahora llama onRequestSignature sin llamar onConfirm.

- [ ] **Step 2: Integrar botón, modal y acción**

- Importar la acción y el modal.
- Añadir estados para orden objetivo, pendiente y error.
- Mostrar Trash2 con aria-label="Ocultar orden {código}" solo si statusName === "ENTREGADO".
- Abrir el modal también para entregadas sin firma.
- onRequestSignature cierra el modal y asigna la orden a selectedOrder.
- onConfirm llama la acción, cierra y notifica solo en éxito; en fallo conserva modal y muestra error.
- Guardar la firma nunca llama automáticamente a la acción de ocultamiento.

- [ ] **Step 3: Verificar y commit**

Run: npx vitest run

Run: npx tsc --noEmit

Run: npm run lint

Expected: todos terminan con exit 0 y no hay errores nuevos.

~~~powershell
git add src/components/OrdenesClientView.tsx src/components/HideOrderModal.test.tsx
git commit -m "feat: integrate order hiding workflow"
~~~

### Task 7: Verificación integral y documentación

**Files:**
- Modify: documentacion_tecnica/3_modelo_datos.md
- Modify: documentacion_tecnica/6_catalogo_de_funciones.md

- [ ] **Step 1: Documentar**

Documentar que hidden_from_orders_at solo controla /ordenes y describir la acción, validaciones, retorno y ActivityLog.

- [ ] **Step 2: Aplicar la migración**

Run: npx prisma migrate deploy

Expected: migración 20260907090000_add_order_hidden_from_orders_at aplicada. Si falta DATABASE_URL o la base no responde, registrar el resultado exacto y no afirmar que fue aplicada.

- [ ] **Step 3: Verificación fresca completa**

Run: npx prisma validate

Run: npx vitest run

Run: npx tsc --noEmit

Run: npm run lint

Run: npm run build

Expected: todos con exit 0 y Vitest con cero fallos.

- [ ] **Step 4: Revisar alcance y commit**

Run: git diff --check

Run: rg -n "hiddenFromOrdersAt" src/app src/components src/modules

Confirmar que ninguna vista histórica filtra el campo y que no existe delete físico de Order.

~~~powershell
git add documentacion_tecnica/3_modelo_datos.md documentacion_tecnica/6_catalogo_de_funciones.md
git commit -m "docs: document delivered order hiding"
~~~
