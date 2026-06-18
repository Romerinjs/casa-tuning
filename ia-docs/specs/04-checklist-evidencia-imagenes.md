# Especificación Técnica: Registro de Evidencias en Checklist de Recepción

Esta especificación describe la funcionalidad que permite capturar fotografías de evidencia cuando se detecta un incumplimiento o fallo en los puntos del checklist de recepción, así como la eliminación de las "Fotos de Recepción (Demo)" del paso final del formulario, dejando únicamente el lienzo de firma digital.

---

## 1. Comportamiento y Flujo de Usuario

1. **Activación de Evidencias**:
   - Al marcar un ítem del checklist en estado de fallo o incumplimiento:
     - Para ítems binarios (`rayones`, `golpes`): Valor es **"Sí"** (`si`).
     - Para ítems ternarios (`pintura`, `rines`, `vidrios`, etc.): Valor es **"Malo"** (`malo`).
   - Se despliega de forma progresiva un área justo debajo del control llamada **"Añadir evidencias"**.

2. **Visualización de Miniaturas (Thumbnails)**:
   - Las imágenes cargadas se muestran en una fila horizontal de miniaturas con esquinas redondeadas.
   - **Caso 1: Menos o igual a 4 imágenes ($N \le 4$)**:
     - Se muestran todas las miniaturas normalmente, seguidas de un botón `+` para cargar más.
   - **Caso 2: Más de 4 imágenes ($N > 4$)**:
     - Se muestran las primeras 3 miniaturas de forma normal.
     - La 4ta miniatura muestra una máscara oscura superpuesta con el texto `+X` (donde $X = N - 3$) para indicar las fotos adicionales. Al hacer clic en esta 4ta miniatura, se abre el modal de galería.
     - Se muestra el botón `+` al final de la fila.

3. **Eliminación de Imágenes (Doble Clic)**:
   - Para eliminar cualquier imagen, el usuario debe hacer **doble clic** sobre ella (sea en la lista principal o dentro del modal de galería).
   - Al hacer doble clic, se levanta un modal de confirmación simple con opciones: `Cancelar` y `Aceptar`.

4. **Modal de Galería (Más de 4 fotos)**:
   - Se despliega un modal centrado con fondo oscuro y efecto blur en el fondo de la pantalla.
   - **Cabecera**: Título del criterio evaluado y un botón rojo redondo de cerrar con una "X" blanca en la esquina superior derecha (con transición de hover).
   - **Cuerpo**: Una cuadrícula de 4 columnas que muestra todas las imágenes cargadas.
   - **Pie**: Un botón central gris/claro de "Subir imágenes" con un icono de nube para permitir la carga de más imágenes directamente desde la galería.

5. **Paso 5 del Formulario (Firma)**:
   - Se eliminan las "Fotos de Recepción (Demo)" (maquetas fotográficas estáticas).
   - El paso se renombra a **"Firma de Recepción"** y solo presenta el lienzo de firma digital y sus controles.

---

## 2. Estructura de Datos en la Base de Datos

Para mantener la compatibilidad hacia atrás y no alterar las relaciones de base de datos actuales, las imágenes se guardarán directamente en la columna `checklist` de tipo `Json` en el modelo `Order`:

- Formato JSON resultante:
  ```json
  {
    "rayones": "si",
    "golpes": "no",
    "pintura": "bueno",
    "_images_rayones": [
      "data:image/jpeg;base64,...",
      "data:image/png;base64..."
    ]
  }
  ```
- Al renderizar la ficha técnica de la orden, se filtrarán las claves con prefijo `_images_` para que no se listen como elementos de texto del checklist, y se utilizarán para pintar las fotos debajo del criterio respectivo en caso de existir evidencias.

---

## 3. Interfaces y Animaciones

- **Transiciones**:
  - El área de "Añadir evidencias" se abre con un fade-in sutil (`animate-[fadeIn_0.2s_ease-out]`).
  - Los modales utilizan efectos de escala y desvanecimiento (`backdrop-blur-xs` con escala de `scale-95` a `scale-100` en 200ms).
- **Subida de Archivos**:
  - Mediante un input de tipo `file` oculto con atributo `multiple` y `accept="image/*"`, convirtiendo las fotos a Base64 en tiempo real mediante `FileReader`.
