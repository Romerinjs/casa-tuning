# Rediseño Estético y Responsivo del Formulario de Reservas (Modal)

Este documento especifica el rediseño del formulario modal de reservas (`ReservaFormModal.tsx`) de Casa Tuning para alinearse estéticamente con el formulario premium de nueva recepción (`RecepcionForm.tsx`) y garantizar que sea totalmente responsivo en dispositivos móviles.

---

## User Review Required

> [!IMPORTANT]
> El modal mantendrá su naturaleza de ventana emergente (modal) pero adoptará un flujo interno por acordeones (pasos colapsables) y estilos 100% idénticos al formulario de Recepción, eliminando textos redundantes para evitar saturación visual.

---

## Proposed Changes

### Componente: Formulario de Reserva

#### [MODIFY] [ReservaFormModal.tsx](file:///d:/romer/REN\proyectos\casa-tuning\src\components\ReservaFormModal.tsx)

Se reestructurará el modal para dividir el formulario en 2 pasos lógicos representados por acordeones colapsables animados:

1. **Paso 1: Datos del Cliente y Vehículo**
   * **Toggle de Búsqueda:** Selector visual tipo píldora (`Buscar Registrado` / `Nuevo Cliente`) con contenedor gris (`bg-zinc-100`) y botón blanco seleccionado con sombra sutil.
   * **Búsqueda interactiva:** Input de búsqueda con lupa a la izquierda.
   * **Campos del Cliente:** Nombre Completo, Celular WhatsApp y Email en un grid responsivo de 1 a 2 columnas.
   * **Campos del Vehículo:** Placa (input con filtro para mayúsculas automáticas y max 6 caracteres), Marca (selector con soporte para logos de marcas) y Modelo/Línea.
   * **Navegación:** Botón dorado (`bg-[#C9A84C] hover:bg-[#b0903c] text-[#0A0A0C] font-bold`) con el texto "Continuar a Fecha y Servicios ➜" en la base de la sección.

2. **Paso 2: Fecha, Hora y Servicios**
   * **Agendamiento:** Campos de Fecha ( picker con fecha mínima de hoy en Colombia) y Hora (dropdown que carga dinámicamente las franjas laborales válidas de Casa Tuning según el día, bloqueando domingos). Se elimina el banner explicativo de horarios para evitar saturar con texto.
   * **Catálogo de Servicios:** Cuadrícula responsiva de tarjetas visuales. Cada tarjeta incluirá un icono correspondiente (usando `getServiceIcon` de lucide-react), un botón circular de selección a la derecha superior, y un borde/fondo destacado dorado (`border-[#C9A84C] bg-[#FBF5E6]/60 shadow-[0_0_0_3px_rgba(201,168,76,0.12)] text-[#9A7A28]`) cuando esté seleccionada.
   * **Observaciones:** Caja de texto multilínea para notas opcionales.
   * **Navegación:** Botones inferiores de "Regresar" (borde gris) y "Confirmar Reserva" (dorado).

### Animaciones e Interactividad
* Las transiciones de colapso y apertura del acordeón utilizarán la técnica de altura en grid (`grid-rows-[0fr]` a `grid-rows-[1fr]`) con `opacity` y duración de 300ms para asegurar fluidez táctil y visual.
* Permitir al usuario navegar hacia atrás dando clic directo en el encabezado del paso completado.

### Adaptabilidad Móvil (Responsive)
* En dispositivos móviles (`max-width: 768px`), el modal se convertirá a pantalla completa (`w-full h-full rounded-none max-h-screen`) para maximizar el área de visualización.
* Los elementos de selección de servicios se organizarán en grid de 2 columnas en desktop y se adaptarán automáticamente a 1 o 2 columnas en pantallas pequeñas.
* Área táctil de los controles (botones, checkboxes, inputs) con altura mínima de 44px para facilitar el toque con los dedos.

---

## Verification Plan

### Automated Tests
* Ejecución del linter y build del proyecto:
  ```bash
  npm run build
  ```

### Manual Verification
1. **Flujo de Acordeones:** Abrir el modal de reservas y validar que las secciones se expandan y colapsen fluidamente con animación.
2. **Coherencia Visual:** Verificar que los bordes, colores, toggles de cliente y tarjetas de servicio tengan exactamente los mismos colores dorados, grises y fuentes que el formulario de Recepción.
3. **Comportamiento en Móvil:** Redimensionar el navegador a tamaño móvil (ej. 375px de ancho) y validar que el modal ocupe la pantalla completa, con scroll interno óptimo y sin desbordamientos laterales.
4. **Validación de Datos:** Probar el registro de reserva de cliente nuevo y existente, asegurándose de que todas las validaciones de datos (como el celular de 10 dígitos y servicios requeridos) sigan funcionando perfectamente.
