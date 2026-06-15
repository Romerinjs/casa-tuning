# Especificación Técnica: Rediseño Responsivo del Dashboard

Esta especificación detalla el rediseño responsivo para el Dashboard principal de **Casa Tuning** con el fin de optimizar el espacio vertical y la legibilidad en pantallas de teléfonos móviles y tabletas.

---

## 1. Objetivos de Diseño

1. **Optimización del Viewport Inicial (Mobile)**: Reducir la altura ocupada por los widgets superiores de estadísticas para evitar que la lista de órdenes activas quede fuera de la pantalla inicial.
2. **Eliminación de la Compresión de Columnas (Mobile)**: Reemplazar el layout tabular (`<table>`) por un formato basado en tarjetas apiladas verticales en móviles, reservando la tabla para pantallas grandes.
3. **Interactividad no Intrusiva**: Controlar la visibilidad del globo de diálogo del botón de acción flotante (FAB) para que se oculte automáticamente en móviles tras 5 segundos, liberando espacio visual, pero manteniéndose interactivo mediante eventos *hover* en pantallas de escritorio.

---

## 2. Cambios de Interfaz y Layouts

### Fila de Estadísticas
- **Grid de Escritorio**: 4 columnas (`grid-cols-4`).
- **Grid de Móviles**: Cuadrícula de 2 columnas por 2 filas (`grid-cols-2`).
- **Clase CSS**: `grid grid-cols-2 lg:grid-cols-4 gap-4`.

### Lista de Órdenes Activas
- **Vista de Escritorio (`hidden md:block`)**:
  - Estructura clásica de `<table>`.
  - Columnas: Placa, Cliente / Vehículo, Servicios, Estado, Hora.
- **Vista de Móviles (`md:hidden`)**:
  - Listado de tarjetas individuales.
  - Cada tarjeta representa una orden y se divide en 3 zonas:
    - **Cabecera**: Placa (badge mono a la izquierda) y Estado (badge dinámico a la derecha).
    - **Cuerpo**: Nombre del cliente (semibold) y descripción del auto (año, marca, modelo en gris).
    - **Pie**: Chips de servicios a la izquierda y la hora de recepción a la derecha.
    - **Divisor**: Línea inferior de separación delgada (`border-b border-zinc-100 pb-4`).

### Botón de Acción Flotante (FAB)
- **Componente Cliente (`src/components/DashboardFAB.tsx`)**:
  - Mantiene un estado reactivo `visible` mediante React hooks.
  - Al montarse, inicia un temporizador de **5000 milisegundos (5 segundos)**. Al vencer, el tooltip "Registrar vehículo" transiciona suavemente a invisible (`opacity-0 scale-95 pointer-events-none`).
  - El contenedor del FAB tiene la clase de Tailwind `group`. En escritorio, al posicionar el mouse sobre el botón, se activa la visibilidad del tooltip (`group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto`).

---

## 3. Archivos Involucrados

1. **[DashboardFAB.tsx](file:///d:/romer/REN/proyectos/casa-tuning/src/components/DashboardFAB.tsx) [NUEVO]**:
   - Componente cliente React. Contiene el botón y el globo de diálogo con el temporizador de 5s y animaciones de entrada/salida.
2. **[page.tsx (dashboard)](file:///d:/romer/REN/proyectos/casa-tuning/src/app/(authenticated)/dashboard/page.tsx) [MODIFICAR]**:
   - Actualización de la grilla de estadísticas a `grid-cols-2 lg:grid-cols-4`.
   - Implementación de la vista condicionada para la tabla de órdenes (`md:hidden` para tarjetas y `hidden md:table` para la tabla).
   - Reemplazo del FAB estático por el nuevo componente `<DashboardFAB />`.

---

## 4. Verificación y Pruebas

- **Consistencia Visual**: Verificar que la cuadrícula de estadísticas se renderice 2x2 en pantallas pequeñas y 4x1 en pantallas grandes.
- **Desvanecimiento**: Asegurar que el globo del FAB se oculte exactamente a los 5 segundos en móviles.
- **Hover**: Probar que en pantallas de escritorio al pasar el cursor sobre el `+` el tooltip reaparezca.
- **Compilación**: Ejecutar `npx tsc --noEmit` para comprobar que no existan errores de tipado tras los cambios.
