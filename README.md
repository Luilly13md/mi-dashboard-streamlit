# API Simple de Productos

Una API REST simple construida con Node.js y Express para gestionar una lista de productos.

## Características

- `GET /products`: Devuelve una lista de todos los productos.
- `POST /products`: Añade un nuevo producto a la lista. Espera un cuerpo JSON con `name` (string), `price` (número) y `quantity` (entero).

## Configuración y Ejecución

1.  **Prerrequisitos**:
    *   Node.js y npm instalados.

2.  **Instalación**:
    *   Clona el repositorio (o descarga los archivos).
    *   Navega al directorio del proyecto.
    *   Instala las dependencias:
        ```bash
        npm install
        ```

3.  **Ejecutando la API**:
    *   Inicia el servidor:
        ```bash
        node app.js
        ```
    *   La API estará ejecutándose en `http://localhost:3000`.

## Almacenamiento de Datos

Los datos de los productos se almacenan en `products.json` en la raíz del proyecto.

## Manejo de Errores

- La API devuelve códigos de estado HTTP apropiados para los errores.
- Existe validación básica para el endpoint `POST /products`.


## API de Checklists

Gestiona los checklists operativos de equipos.

### `POST /checklists`

Envía un nuevo checklist de equipo.

**Cuerpo de la Solicitud (Request Body):**

-   `nombre_operador` (string, requerido): Nombre del operador.
-   `tipo_equipo` (string, requerido): Tipo de equipo. Debe ser "Montacargas" o "Apilador Eléctrico".
-   `id_equipo` (string o número, requerido): Identificador del equipo.
-   `fecha_hora` (string, requerido): Fecha y hora del checklist (ej., formato ISO 8601 como "2023-10-27T14:30:00Z").
-   `checklist` (array de objetos, requerido): Lista de ítems verificados. Cada objeto debe contener:
    -   `item_name` (string, requerido): Nombre del ítem del checklist (ej., "Frenos", "Neumáticos").
    -   `status` (string, requerido): Estado del ítem. Debe ser "OK" o "FALLA".
-   `observaciones` (string, opcional): Observaciones generales o comentarios.

**Ejemplo de Cuerpo de Solicitud:**

```json
{
  "nombre_operador": "Juan Pérez",
  "tipo_equipo": "Montacargas",
  "id_equipo": "MC-102",
  "fecha_hora": "2023-10-27T15:00:00Z",
  "checklist": [
    { "item_name": "Condición de Horquillas", "status": "OK" },
    { "item_name": "Nivel de Fluido Hidráulico", "status": "OK" },
    { "item_name": "Desempeño de Frenos", "status": "FALLA" }
  ],
  "observaciones": "Los frenos se sienten un poco esponjosos e hicieron un ligero ruido de rechinamiento."
}
```

**Respuesta:**

En caso de éxito, devuelve un objeto JSON con un mensaje de éxito y el `checklist_id`.
Ejemplo: `{"message": "Checklist enviado con éxito. Alertas de mantenimiento generadas.", "checklist_id": 1}`

**Almacenamiento de Datos:**

-   Los checklists enviados se almacenan en `checklists.json`.
-   Los ítems del checklist marcados como "FALLA" generan alertas que se almacenan en `alertas_mantenimiento.json`.

**Ejecución:**

Asegúrate de que el servidor Node.js esté en ejecución (`node app.js`). El endpoint está disponible en `http://localhost:3000/checklists`.
