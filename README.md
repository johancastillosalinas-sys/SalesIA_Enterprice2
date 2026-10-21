# SalesIA Enterprise — Sistema Web de Gestión de Ventas y Analítica Estadística en Tiempo Real

> **Versión 1.0 — Proyecto Académico & Profesional (Semana 07)**  
> **Tema Académico:** Estadística aplicada en IA, media aritmética, mediana, Teorema de Bayes, variables estadísticas y aleatorias.

---

## 🏗️ Estructura del Proyecto

El proyecto respeta la jerarquía definida en el Plan de Desarrollo. Hay **una sola entrada web** (`index.html` en la raíz, que es donde Vite la busca) y **un solo archivo de estilos**.

```text
salesia_enterprice2/
├── index.html                       # Única entrada web del sistema
├── styles.css                       # Sistema de diseño corporativo (Azul, Cyan, Grises)
├── package.json
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── app.js               # Orquestador: arranque, router, roles y eventos globales
│       │   ├── router.js            # Enrutador desacoplado con guardia de acceso por rol
│       │   ├── permissions.js       # Matriz de acceso por rol (RF-01)
│       │   └── state.js             # Estado global e inyección de dependencias
│       ├── components/
│       │   └── chartManager.js      # Gráficos estadísticos con Chart.js
│       ├── modules/                 # Un controlador por módulo; reciben la app en el constructor
│       │   ├── dashboard/           # RF-09: dashboardController.js
│       │   ├── customers/           # RF-03: customersController.js + customersView.js
│       │   ├── products/            # RF-04: productsController.js + productsView.js
│       │   ├── sales/               # RF-06: salesController.js (TPV, venta consecutiva)
│       │   ├── quotes/              # quotesController.js + quoteEngine.js (Sandbox desacoplado)
│       │   ├── inventory/           # RF-08: inventoryController.js (existencias y movimientos)
│       │   ├── analytics/           # RF-11/12/13: analyticsController.js + descriptiveStats.js
│       │   ├── probability/         # RF-16/17: bayesTheorem.js
│       │   ├── insights/            # RF-19: insightRules.js (insights deterministas)
│       │   ├── reports/             # RF-20: reportsController.js
│       │   ├── audit/               # RF-22: auditController.js
│       │   └── history/             # historyController.js (historial y comprobantes)
│       ├── services/
│       │   ├── api.js               # Simulación de endpoints REST (Sección 16)
│       │   ├── fifoQueueService.js  # Procesador de cola FIFO en tiempo real
│       │   ├── sequenceService.js   # Generador atómico de números correlativos (#0001...)
│       │   └── storageService.js    # Persistencia particionada en LocalStorage
│       ├── hooks/
│       │   ├── useEventBus.js       # Bus Pub/Sub para desacoplamiento reactivo
│       │   └── useStressTest.js     # Banco de pruebas de la Regla 1 vs 100
│       ├── types/
│       │   └── schemas.js           # Esquemas de datos de la Sección 12
│       └── utils/
│           ├── formatters.js        # Moneda (PEN), fechas y escape de HTML (escapeHtml)
│           └── validators.js        # Validadores de entrada (RUC, DNI, correo)
├── database/
│   ├── seeds/
│   │   └── initialSeed.js           # Catálogos base de productos, clientes y roles
│   └── migrations/
│       └── schemaMigration.js       # Inicialización y prevención de Schema Drift
└── docs/
    └── GUIA_DE_EVALUACION_ACADEMICA.md
```

> La carpeta `dist/` aparece al ejecutar `npm run build`. Es código generado: no se edita ni se versiona.

---

## 🧩 Arquitectura de la Aplicación

`app.js` solo orquesta: crea el estado, el router y un **controlador por módulo**, y decide qué controlador dibuja cada pantalla. Cada controlador vive en su carpeta, recibe la aplicación (`app`) y usa `app.state` (almacenamiento y API) y `app.showToast` (avisos).

```text
router.navigate('customers')
   └─► guardia de acceso (permissions.js)
        └─► app.renderRoute('customers')
             └─► app.customers.render()      # CustomersController
```

Las reglas de negocio (validar un cliente, reabastecer stock, emitir una venta) viven en `services/api.js`, y cada operación crítica deja un registro en Auditoría (RF-22).

---

## 🔐 Roles y Acceso por Módulo (RF-01)

El selector **Rol Activo** del encabezado cambia el usuario actual, y el menú lateral solo muestra los módulos permitidos para ese rol. Si el rol no puede ver la pantalla actual, la app lo lleva al primer módulo que sí le corresponde. La matriz se define en un solo lugar: `frontend/src/app/permissions.js`.

| Rol | Módulos permitidos |
|---|---|
| Administrador | Todos |
| Gerente | Dashboard, Analytics, Reportes, Historial |
| Vendedor | Terminal (POS), Cotizador, Clientes, Historial |
| Analista | Analytics, Reportes |
| Almacén | Catálogo de productos, Inventario |

Auditoría (RF-22) es exclusiva del Administrador.

---

## 🎯 Cumplimiento de Restricciones Críticas de Clase

1. **Simulado sin Base de Datos (Solo LocalStorage):**  
   - Todo el estado transaccional, catálogo de productos, cotizaciones e historial de análisis estadístico persiste en `LocalStorage` mediante llaves particionadas (`salesia:sales`, `salesia:products`, `salesia:quotes`, etc.). No requiere servidores SQL ni bases de datos externas.

2. **Secuencia Estricta Consecutiva en Tiempo Real:**  
   - Implementado mediante `FifoQueueService` y `SequenceService`. Cada venta procesada obtiene un folio correlativo estricto (`TICK-0001`, `TICK-0002`...) sin saltos ni condiciones de carrera.

3. **Módulo de Cotizaciones 100% Desacoplado (Sandbox Pattern):**  
   - Las cotizaciones operan en memoria con funciones matemáticas puras. Mientras una cotización esté en estado de borrador o emitida, no descuenta existencias de inventario ni altera los indicadores de venta de Analytics hasta que el usuario hace clic en *"Convertir a Venta"*.

4. **Regla de Oro "1 vs 100 Registros":**  
   - **Con 1 registro:** Latencia $< 2\text{ ms}$ con cortocircuitos $O(1)$ para la media y mediana (`if (n === 1) return val[0]`).  
   - **Con 100 registros:** Actualización secuencial en microtareas, sin congelar la pantalla a 60 FPS y consumiendo menos de 40 KB de LocalStorage.

5. **Contenidos de la Semana 07:**  
   - Cálculo de Media Aritmética ($\mu$) y Mediana ($M$).  
   - Diagnóstico de asimetría (sesgo por valores atípicos o compras corporativas grandes).  
   - Simulador interactivo del **Teorema de Bayes**:  
     $$P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}$$  
     con explicación matemática paso a paso.  
   - Generador de **Insights automáticos** basados en reglas deterministas con evidencia numérica.

---

## 🚀 Cómo Ejecutar el Proyecto

**Requisito:** [Node.js](https://nodejs.org) (versión LTS) y conexión a internet, porque Tailwind CSS y Chart.js se cargan desde CDN.

```powershell
# 1. Instalar dependencias (solo la primera vez, o si falta la carpeta node_modules)
npm install

# 2. Servidor de desarrollo con recarga automática
npm run dev
```

Abre la dirección que muestra la consola (normalmente `http://localhost:5173/`).

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run preview` | Sirve localmente la carpeta `dist/` ya compilada |
| `npm start` | Servidor estático simple (`npx serve .`), sin Vite |

> **No abras `index.html` con doble clic.** El sistema usa módulos ES6, y los navegadores los bloquean cuando el archivo se abre desde `file://`. Usa siempre un servidor (Vite, `npx serve` o *Live Server* de VS Code).

### Datos de prueba

Los datos viven en el `LocalStorage` del navegador, bajo claves que empiezan con `salesia:`. Para volver al estado inicial usa el botón **Reiniciar Datos** del encabezado, o borra esas claves desde las herramientas del navegador (F12 → Application → Local Storage).

---
## 📏 Reglas de Negocio Destacadas

- **Baja lógica de clientes y productos.** Desactivar un cliente o un producto no lo borra: conserva su historial, deja de aparecer en el POS y en el Cotizador, y el sistema **rechaza cualquier venta** que lo incluya, incluso al convertir una cotización antigua. Se puede reactivar en cualquier momento.
- **Folio consecutivo sin saltos.** Las validaciones se hacen antes de asignar el número, así que una venta rechazada no consume folio (`TICK-0001`, `TICK-0002`...).
- **Stock solo por vías trazables.** El stock cambia únicamente con ventas y con el reabastecimiento desde Inventario; editar un producto no lo modifica. Cada movimiento queda en el historial de inventario y en Auditoría.
- **Meta de vendedores en Reportes.** El cumplimiento se mide contra la **meta del período** = meta mensual × máx(1, días del rango ÷ 30). Un rango corto se compara contra la meta de un mes; uno largo la escala (90 días = 3 meses). Si falta *Desde* o *Hasta* se usa la primera o la última venta registrada.
- **Exportación segura.** El CSV de Reportes contiene solo las ventas filtradas, con tildes correctas y sin que Excel ejecute fórmulas escondidas en los textos.

---

## ⚠️ Alcance y Limitaciones Conocidas

- **Persistencia local.** Todo se guarda en el navegador donde se usa el sistema: no se comparte entre equipos ni sobrevive a limpiar los datos del sitio. La auditoría conserva los últimos 200 registros y los movimientos de inventario, los más recientes.
- **Permisos solo en la interfaz.** El control por rol oculta módulos y bloquea la navegación, pero al ser un sistema simulado cualquiera con la consola del navegador puede cambiar de rol o llamar a la API. La seguridad real exigirá validar los permisos en un backend.

- **Archivos heredados.** Quedan sin uso `modules/auth/authModule.js`, `modules/dashboard/dashboardView.js`, `modules/reports/reportsView.js` y `hooks/useLocalStorage.js`.