# Control y Carga de Higiénicos Absorbentes (Pañales / OME)

Módulo especializado para la gestión y seguimiento del ciclo de órdenes médicas electrónicas (OME) de higiénicos absorbentes (pañales y apósitos descartables), controlando la vigencia de 3 meses a partir de la carga efectiva en el sistema externo, bloqueos por CUD en afiliados de Hogar PAMI, sincronización con Google Sheets y acceso restringido a 3 usuarios autorizados.

> [!IMPORTANT]
> **Decisiones Críticas Confirmadas:**
> - **Acceso restringido**: Pestaña propia en la barra de navegación protegida por una lista de 3 correos autorizados (iniciando con `mesfede@gmail.com`, con panel de configuración de usuarios autorizados para el administrador).
> - **Sincronización de datos**: Conexión directa a Google Sheets mediante URL pública o enlace exportable (CSV), además de permitir sincronización manual y carga directa, preservando el estado operativo en Firestore para no perder los estados de carga al actualizar la planilla.
> - **Regla Hogar PAMI + CUD**: Si el afiliado pertenece a "Hogar PAMI", es obligatorio contar con el Certificado Único de Discapacidad (CUD). Se implementa un tilde interactivo "CUD Presentado/Verificado" que **bloquea la acción de carga** si no está tildado.
> - **Ciclo de 3 meses**: La vigencia de 3 meses se contabiliza a partir del momento en que el operador presiona "Marcar Cargado" (o define la fecha de carga efectiva en el sistema externo). El sistema calcula la fecha de vencimiento (`fechaCarga + 90 días`) e impide cargar una nueva orden antes de que expire la previa, emitiendo alertas cuando falten 15 días para el vencimiento.

---

## 1. Visión General y Concepto Operativo

### Qué resuelve el módulo
En la operativa diaria de PAMI, los médicos de cabecera emiten órdenes (OME) para pañales descartables y apósitos. Sin embargo, una orden generada no puede cargarse en el sistema de dispensa/autorización si el afiliado ya tiene una orden activa en curso. Además:
1. La vigencia de **3 meses** se inicia exclusivamente desde la fecha en que el operador realiza la **carga efectiva en el sistema externo**.
2. Si un afiliado está radicado en un **Hogar PAMI**, la normativa exige que tenga CUD (Certificado Único de Discapacidad). Si no lo tiene, la orden no se puede procesar hasta regularizarlo.
3. El equipo necesita saber de un solo vistazo:
   - **Qué órdenes están listas para cargar hoy** (porque no tenían orden previa o la anterior ya venció).
   - **Qué órdenes están vigentes** (con indicación de días restantes y fecha exacta en que se liberará la próxima carga).
   - **Cuáles están próximas a vencer** (dentro de los últimos 15 días, para preparar la nueva prescripción).
   - **Cuáles están bloqueadas por falta de CUD en Hogar PAMI**.

### Usuarios objetivo
Exclusivamente 3 operadores autorizados del equipo (incluyendo `mesfede@gmail.com`), garantizando que la información sensible de afiliados y órdenes esté resguardada.

---

## 2. Experiencia de Usuario y Diseño Visual

Siguiendo las directrices de diseño SaaS y paneles de alta densidad (sin elementos genéricos tipo píldoras decorativas, con tipografía clara y números tabulares):

### Flujos Clave de Usuario
1. **Acceso al Módulo**:
   - Si el usuario autenticado figura en la lista de 3 correos autorizados, visualiza la pestaña "Higiénicos" en la navegación superior y puede entrar.
   - Si no está autorizado, la pestaña permanece oculta (o muestra una pantalla de acceso denegado con explicación limpia).
2. **Tablero de Control y Métricas Rápidas**:
   - Barra superior con 4 indicadores de estado operativo:
     - **Listas para Cargar**: Órdenes con fecha habilitada (sin orden previa activa o vencida) y con CUD validado.
     - **Vigentes**: Órdenes ya cargadas cursando sus 3 meses de vigencia.
     - **Próximas a Vencer**: A menos de 15 días de expirar.
     - **Requieren CUD**: Afiliados en Hogar PAMI pendientes de documentación.
3. **Búsqueda y Filtros de Segmentación**:
   - Segmented control funcional: `Todas` | `Listas para Cargar` | `Vigentes` | `Por Vencer` | `Bloqueadas (Sin CUD)`.
   - Buscador rápido por Nombre, DNI/Beneficio, N° de OME o Médico de Cabecera.
4. **Tabla de Datos Operativa de Alta Densidad**:
   - Columnas claras:
     - **Afiliado**: Nombre y Apellido, N° de Beneficio / DNI.
     - **Condición**: Hogar PAMI (`Sí` / `No`) con control de CUD (`CUD Verificado` / `Sin CUD`).
     - **Insumo / OME**: Tipo de higiénico (pañales, apósitos, talle/módulo) y fecha de emisión médica.
     - **Estado de Carga**: Semáforo visual con texto explicativo:
       - 🟢 *Lista para cargar*: Botón directo "Marcar Cargado Hoy".
       - 🔵 *Vigente*: "Cargada el DD/MM/AAAA · Vence en X días (DD/MM/AAAA)".
       - 🟡 *Por vencer*: "Vence en X días · Preparar recarga".
       - 🔴 *Bloqueada*: "Requiere CUD (Hogar PAMI)".
     - **Acciones**:
       - Botón "Marcar Cargado" (abre confirmación con selector de fecha de carga en sistema externo, por defecto hoy).
       - Tilde rápido de CUD.
       - Historial de cargas previas del afiliado.
5. **Sincronización con Google Sheets**:
   - Botón en cabecera "Sincronizar Google Sheet":
     - Permite ingresar la URL de Google Sheets (publicado a la web como CSV o enlace directo de visualización).
     - Al sincronizar, importa las nuevas OME detectadas sin pisar ni resetear las fechas de carga ya registradas en el sistema.
     - Botón de "Actualizar ahora" y estado de última sincronización.

---

## 3. Decisiones de Producto y Arquitectura de Datos

### Decisión 1: Persistencia y Coexistencia con Google Sheets
- **Enfoque**: Las órdenes importadas desde Google Sheets se unifican en Firestore en la colección `higienicos_ordenes` usando el N° de OME o el par (Beneficio + Fecha Emisión) como identificador unívoco.
- **Razón**: Si el médico o administrativo actualiza la planilla de Google Drive, la sincronización actualiza datos nuevos (nuevas prescripciones) sin borrar ni sobreescribir la fecha en la que el usuario ya marcó la orden como "cargada en el otro sistema" ni el estado del CUD.

### Decisión 2: Regla de Negocio del Ciclo de 3 Meses
- **Enfoque**:
  - `fechaEmisionMedica`: Fecha en que el médico de cabecera hizo la OME.
  - `fechaCargaSistema`: Fecha en que el operador ingresó la orden al sistema externo de PAMI.
  - `fechaVencimiento`: Se calcula exactamente sumando 90 días (3 meses) a `fechaCargaSistema`.
  - **Bloqueo de recarga**: Si un afiliado tiene una orden con `fechaVencimiento > hoy`, cualquier nueva orden médica para el mismo afiliado figurará con el estado "En espera por orden vigente (habilitada a partir del DD/MM/AAAA)".

### Decisión 3: Validación Obligatoria de CUD para Hogar PAMI
- **Enfoque**:
  - Si `hogarPami === true` y `tieneCud === false`: El botón "Marcar Cargado" queda deshabilitado con un aviso explícito en rojo: *"No se puede cargar: requiere CUD para afiliados en Hogar PAMI"*.
  - El usuario puede tildar "CUD Presentado" directamente en la fila o en un modal de verificación para desbloquear la carga.

### Decisión 4: Gestión de los 3 Usuarios Autorizados
- **Enfoque**:
  - Colección o documento en Firestore `config/higienicos_permisos` con un array `authorizedEmails: string[]`.
  - Email por defecto inicial: `mesfede@gmail.com`.
  - El administrador puede agregar o modificar los 2 emails adicionales desde un botón de configuración de acceso dentro del mismo módulo.

---

## 4. Arquitectura Técnica y Modelo de Datos

```
┌────────────────────────────────────────────────────────────────────────┐
│                          App.tsx (Navegación)                          │
│     Pestaña "Higiénicos" (Visible/Accesible para 3 correos)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
┌───────────────────────────────────┐   ┌────────────────────────────────┐
│   HigienicosDashboard.tsx         │   │   HigienicosSyncModal.tsx      │
│   - Tarjetas KPI de Estado        │   │   - Conexión Google Sheets URL │
│   - Filtros de Estado & Búsqueda  │   │   - Parseo CSV (PapaParse)     │
│   - Tabla de Órdenes & Semáforos  │   │   - Mapeo inteligente columnas │
│   - Botón "Marcar Cargado"        │   └────────────────┬───────────────┘
│   - Checkbox CUD con bloqueo      │                    │
└─────────────────┬─────────────────┘                    │
                  │                                      │
                  ▼                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Servicios Firestore                            │
│  - subscribeToHigienicos(callback)                                     │
│  - marcarOrdenCargada(ordenId, fechaCarga, notas)                       │
│  - toggleCudAfiliado(afiliadoId, tieneCud)                             │
│  - syncGoogleSheetData(rows)                                           │
│  - getAuthorizedHigienicosUsers()                                      │
└────────────────────────────────────────────────────────────────────────┘
```

### Estructura de Datos (TypeScript)

```typescript
export interface HigienicoOrden {
  id: string; // ID único (ej: OME-123456 o UUID)
  afiliadoNombre: string;
  afiliadoBeneficio: string;
  afiliadoDni?: string;
  hogarPami: boolean;
  tieneCud: boolean;
  cudNumero?: string;
  insumoTipo: string; // "Pañales", "Apósitos", "Combinado"
  insumoTalle?: string; // "Mediano", "Grande", "Extra Grande"
  medicoCabecera?: string;
  nroOme: string;
  fechaEmisionOme: string; // YYYY-MM-DD
  fechaCargaSistema?: string; // YYYY-MM-DD (cuando se cargó en el otro sistema)
  fechaVencimiento?: string; // fechaCargaSistema + 90 días
  estado: 'pendiente_carga' | 'vigente' | 'proxima_vencer' | 'vencida' | 'bloqueada_cud';
  cargadoPorEmail?: string;
  notas?: string;
  updatedAt?: any;
  createdAt?: any;
}

export interface HigienicosConfig {
  authorizedEmails: string[];
  googleSheetUrl?: string;
  lastSyncAt?: any;
}
```

---

## 5. Plan de Ejecución tras Aprobación

1. **Configuración de Reglas y Permisos**:
   - Agregar esquema y funciones de seguridad en `firestore.rules` y `firebase-blueprint.json` para la colección `higienicos_ordenes` y `config/higienicos_permisos`.
2. **Servicio Firestore**:
   - Crear funciones en `src/services/firestore.ts` para suscribir, crear, actualizar y sincronizar órdenes de higiénicos.
3. **Componentes del Módulo**:
   - Crear `src/components/HigienicosDashboard.tsx` con tablero KPI, filtros segmentados, búsqueda y tabla reactiva.
   - Crear `src/components/HigienicosSyncModal.tsx` para sincronización con Google Sheets / CSV.
   - Crear `src/components/HigienicosAuthModal.tsx` para la gestión de los 3 correos habilitados.
4. **Integración en `App.tsx`**:
   - Integrar la pestaña `"higienicos"` en la barra de navegación y drawer móvil.
   - Validar permisos del usuario logueado en tiempo real.
5. **Verificación y Pruebas**:
   - Compilación con `compile_applet`.
   - Verificación de los cálculos de fechas de 3 meses, bloqueo de CUD en Hogar PAMI y sincronización de planillas.
