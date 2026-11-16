import { HigienicoOrden, HigienicoEstado } from '../types';

export interface ProcessedHigienicoOrden extends HigienicoOrden {
  computedEstado: HigienicoEstado;
  diasRestantes?: number;
  bloqueantePorOrdenVigente?: HigienicoOrden;
  puedeCargarse: boolean;
  motivoBloqueo?: string;
}

/**
 * Normaliza una URL de Google Sheets para obtener el exportador CSV directo.
 */
export function normalizeGoogleSheetUrl(inputUrl: string): string {
  if (!inputUrl) return '';
  const trimmed = inputUrl.trim();

  // Si ya es un exportador directo o enlace CSV
  if (trimmed.includes('export?format=csv') || trimmed.includes('/pub?output=csv')) {
    return trimmed;
  }

  // Detectar ID de la hoja: /spreadsheets/d/([a-zA-Z0-9-_]+)
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch || !idMatch[1]) {
    return trimmed;
  }

  const sheetId = idMatch[1];
  
  // Detectar gid si existe: #gid=123 o ?gid=123
  const gidMatch = trimmed.match(/[#?&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Genera la URL de Google Visualization API para consulta CSV (compatible con CORS).
 */
export function getGoogleSheetGvizUrl(inputUrl: string): string {
  if (!inputUrl) return '';
  const trimmed = inputUrl.trim();

  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch || !idMatch[1]) {
    return trimmed;
  }

  const sheetId = idMatch[1];
  const gidMatch = trimmed.match(/[#?&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

/**
 * Calcula la fecha de vencimiento a 90 días (3 meses) a partir de la fecha de carga efectiva en el sistema.
 */
export function calculateVencimiento(fechaCarga: string): string {
  try {
    const parts = fechaCarga.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day, 12, 0, 0);
      d.setDate(d.getDate() + 90);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dt = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dt}`;
    }
  } catch (err) {
    console.error("Error calculating vencimiento:", err);
  }
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().split('T')[0];
}

/**
 * Verifica si una cadena es una fecha ISO válida YYYY-MM-DD.
 */
export function isValidIsoDate(dateStr?: string): boolean {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

const MONTH_MAP: Record<string, number> = {
  ene: 1, enero: 1, jan: 1, january: 1,
  feb: 2, febrero: 2, february: 2,
  mar: 3, marzo: 3, march: 3,
  abr: 4, abril: 4, apr: 4, april: 4,
  may: 5, mayo: 5,
  jun: 6, junio: 6, june: 6,
  jul: 7, julio: 7, july: 7,
  ago: 8, agosto: 8, aug: 8, august: 8,
  sep: 9, sept: 9, septiembre: 9, setiembre: 9, september: 9,
  oct: 10, octubre: 10, october: 10,
  nov: 11, noviembre: 11, november: 11,
  dic: 12, diciembre: 12, dec: 12, december: 12,
};

function formatIsoDate(year: number, month: number, day: number): string {
  if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';
  const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return isValidIsoDate(iso) ? iso : '';
}

/**
 * Convierte formatos comunes de fechas (DD/MM/YYYY, DD-MM-YYYY, DD/MM, YYYY-MM-DD, meses en texto, seriales de Excel y objetos Date) a ISO YYYY-MM-DD.
 * Si no representa una fecha válida, devuelve ''.
 */
export function parseDateToIso(rawDateStr?: any): string {
  if (rawDateStr === undefined || rawDateStr === null) return '';

  // Objeto Date
  if (rawDateStr instanceof Date) {
    if (!isNaN(rawDateStr.getTime())) {
      return formatIsoDate(
        rawDateStr.getFullYear(),
        rawDateStr.getMonth() + 1,
        rawDateStr.getDate()
      );
    }
    return '';
  }

  // Serial numérico directo de Excel (ej: 46320)
  if (typeof rawDateStr === 'number' && !isNaN(rawDateStr)) {
    if (rawDateStr > 30000 && rawDateStr < 75000) {
      const utcDays = Math.floor(rawDateStr - 25569);
      const dateInfo = new Date(utcDays * 86400 * 1000);
      if (!isNaN(dateInfo.getTime())) {
        return formatIsoDate(
          dateInfo.getUTCFullYear(),
          dateInfo.getUTCMonth() + 1,
          dateInfo.getUTCDate()
        );
      }
    }
    return '';
  }

  let str = String(rawDateStr).trim();
  if (!str) return '';

  // Extraer fecha si viene acompañada de hora (ej: "2026-10-28T00:00:00" o "28/10/2026 14:00")
  const firstToken = str.split(/[\sT]/)[0].trim();

  // Serial numérico de Excel como texto
  if (/^\d+(\.\d+)?$/.test(firstToken)) {
    const numParsed = Number(firstToken);
    if (!isNaN(numParsed) && numParsed > 30000 && numParsed < 75000) {
      const utcDays = Math.floor(numParsed - 25569);
      const dateInfo = new Date(utcDays * 86400 * 1000);
      if (!isNaN(dateInfo.getTime())) {
        return formatIsoDate(
          dateInfo.getUTCFullYear(),
          dateInfo.getUTCMonth() + 1,
          dateInfo.getUTCDate()
        );
      }
    }
    return '';
  }

  // Ya en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(firstToken)) {
    return isValidIsoDate(firstToken) ? firstToken : '';
  }

  // Buscar patrón con 3 partes numéricas dentro del texto (ej. "Vto: 11/11/2026" o "11/11/26")
  const threePartMatch = str.match(/(\d{1,4})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{1,4})/);
  if (threePartMatch) {
    const [, p1Str, p2Str, p3Str] = threePartMatch;
    // Formato YYYY/MM/DD
    if (p1Str.length === 4) {
      return formatIsoDate(parseInt(p1Str, 10), parseInt(p2Str, 10), parseInt(p3Str, 10));
    }
    let year = parseInt(p3Str, 10);
    if (p3Str.length === 2) {
      year += 2000;
    }
    if (String(year).length === 4) {
      let day = parseInt(p1Str, 10);
      let month = parseInt(p2Str, 10);
      // Si viene exportado en formato US MM/DD/YYYY (mes > 12 y día <= 12), intercambiar
      if (month > 12 && day <= 12) {
        [day, month] = [month, day];
      }
      return formatIsoDate(year, month, day);
    }
  }

  // Formato con nombre de mes (ej. "11-nov", "11 nov 2026", "11 de noviembre de 2026")
  const cleanLower = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const textMonthMatch = cleanLower.match(
    /(\d{1,2})\s*(?:de\s+|[/.\-\s])\s*([a-z]+)\.?(?:\s*(?:de\s+|[/.\-\s])\s*(\d{2,4}))?/
  );
  if (textMonthMatch) {
    const day = parseInt(textMonthMatch[1], 10);
    const monthKey = textMonthMatch[2];
    const month = MONTH_MAP[monthKey];
    if (month) {
      let year = textMonthMatch[3] ? parseInt(textMonthMatch[3], 10) : new Date().getFullYear();
      if (year < 100) year += 2000;
      return formatIsoDate(year, month, day);
    }
  }

  // Formato corto DD/MM o DD-MM sin año (ej. "11/11" o "4/11") -> asume año actual
  const twoPartMatch = str.match(/^(\d{1,2})\s*[/.-]\s*(\d{1,2})$/);
  if (twoPartMatch) {
    let day = parseInt(twoPartMatch[1], 10);
    let month = parseInt(twoPartMatch[2], 10);
    if (month > 12 && day <= 12) {
      [day, month] = [month, day];
    }
    return formatIsoDate(new Date().getFullYear(), month, day);
  }

  return '';
}

/**
 * Obtiene la fecha actual en formato ISO YYYY-MM-DD
 */
export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calcula la diferencia en días calendario entre hoy y una fecha YYYY-MM-DD.
 * Positivo (>0): faltan X días para llegar a esa fecha (futura, NO disponible para cargar aún).
 * 0: es exactamente hoy (habilitada recién a partir de mañana).
 * Negativo (<0): esa fecha ya pasó hace X días (habilitada para cargar).
 */
export function getDaysDifference(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  try {
    const cleanTarget = isValidIsoDate(targetDateStr.trim().slice(0, 10))
      ? targetDateStr.trim().slice(0, 10)
      : parseDateToIso(targetDateStr);

    if (!cleanTarget) return 0;

    const todayIso = getTodayIso();
    if (cleanTarget === todayIso) {
      return 0; // Es exactamente hoy
    }

    const [ty, tm, td] = cleanTarget.split('-').map(Number);
    const [cy, cm, cd] = todayIso.split('-').map(Number);

    if (isNaN(ty) || isNaN(tm) || isNaN(td)) return 0;

    const tDate = Date.UTC(ty, tm - 1, td);
    const cDate = Date.UTC(cy, cm - 1, cd);

    return Math.round((tDate - cDate) / (1000 * 60 * 60 * 24));
  } catch (err) {
    return 0;
  }
}

/**
 * Procesa una lista completa de órdenes y resuelve las relaciones cruzadas por afiliado
 * (vigencia, bloqueo por orden previa activa, validación de CUD, y fecha de vencimiento de la OME
 * a partir de la cual recién se habilita la carga en el sistema).
 */
export function processHigienicosOrdenes(ordenes: HigienicoOrden[]): ProcessedHigienicoOrden[] {
  // Agrupar órdenes activas por beneficio del afiliado
  const activeOrdersByBeneficio = new Map<string, HigienicoOrden>();

  // 1ra pasada: identificar para cada afiliado si tiene una orden vigente
  for (const orden of ordenes) {
    const cargaIso = parseDateToIso(orden.fechaCargaSistema);
    const vencIso = parseDateToIso(orden.fechaVencimiento);
    if (cargaIso && vencIso) {
      const dias = getDaysDifference(vencIso);
      if (dias >= 0) {
        // Esta orden está vigente o próxima a vencer
        const key = (orden.afiliadoBeneficio || '').trim();
        if (!key || key.toLowerCase() === 'sin beneficio' || key === '-') continue;
        const prev = activeOrdersByBeneficio.get(key);
        if (!prev) {
          activeOrdersByBeneficio.set(key, orden);
        } else {
          // Si hay varias, tomar la que vence más adelante
          const prevDias = getDaysDifference(prev.fechaVencimiento!);
          if (dias > prevDias) {
            activeOrdersByBeneficio.set(key, orden);
          }
        }
      }
    }
  }

  // 2da pasada: computar el estado detallado de cada orden
  return ordenes.map(orden => {
    const result: ProcessedHigienicoOrden = {
      ...orden,
      computedEstado: 'lista_para_cargar',
      puedeCargarse: true,
    };

    const cargaIso = parseDateToIso(orden.fechaCargaSistema);
    const vencSistemaIso = parseDateToIso(orden.fechaVencimiento);

    // Caso A: La orden ya fue cargada en el sistema externo
    if (cargaIso && vencSistemaIso) {
      const diasRestantes = getDaysDifference(vencSistemaIso);
      result.diasRestantes = diasRestantes;

      if (diasRestantes < 0) {
        result.computedEstado = 'vencida';
        result.puedeCargarse = false; // Ya fue cargada y su ciclo terminó
        result.motivoBloqueo = 'Ciclo de 3 meses cumplido';
      } else if (diasRestantes <= 5) {
        result.computedEstado = 'proxima_vencer';
        result.puedeCargarse = false; // Ya está cargada, vence pronto
        result.motivoBloqueo = `Vence en ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}`;
      } else {
        result.computedEstado = 'vigente';
        result.puedeCargarse = false; // Ya está cargada y vigente
        result.motivoBloqueo = `Activa. Vence en ${diasRestantes} días`;
      }
      return result;
    }

    // Caso B: La orden aún NO fue cargada en el sistema externo
    // Regla 1: Afiliado en Hogar PAMI requiere CUD OBLIGATORIO
    if (orden.hogarPami && !orden.tieneCud) {
      result.computedEstado = 'bloqueada_cud';
      result.puedeCargarse = false;
      result.motivoBloqueo = 'Bloqueada: Requiere CUD para afiliados en Hogar PAMI';
      return result;
    }

    // Regla 2: ¿El afiliado ya tiene otra orden vigente en curso?
    const benKey = (orden.afiliadoBeneficio || '').trim();
    const activeOrder = benKey && benKey.toLowerCase() !== 'sin beneficio' && benKey !== '-'
      ? activeOrdersByBeneficio.get(benKey)
      : undefined;
    if (activeOrder && activeOrder.id !== orden.id) {
      const diasEsperar = getDaysDifference(activeOrder.fechaVencimiento!);
      result.bloqueantePorOrdenVigente = activeOrder;
      result.puedeCargarse = false;
      result.computedEstado = 'en_espera_vencimiento';
      result.motivoBloqueo = `Orden previa activa (vence el ${formatDate(activeOrder.fechaVencimiento!)} - faltan ${diasEsperar} días)`;
      return result;
    }

    // Regla 3: Vencimiento de la OME (Fecha a partir de la cual recién se puede cargar, al día siguiente)
    const rawFechaHabilitacion = orden.fechaVencimientoOme || orden.fechaVencimiento || orden.fechaEmisionOme;
    const fechaHabilitacion = parseDateToIso(rawFechaHabilitacion);
    if (fechaHabilitacion) {
      const diasFaltantes = getDaysDifference(fechaHabilitacion);
      if (diasFaltantes >= 0) {
        // La fecha es hoy o futura -> Aún NO está disponible para cargar (Pendiente hasta el día siguiente)
        result.computedEstado = 'en_espera_vencimiento';
        result.puedeCargarse = false;
        result.diasRestantes = diasFaltantes;
        result.motivoBloqueo = diasFaltantes <= 1
          ? `Habilitada a partir de mañana (${formatDate(fechaHabilitacion)})`
          : `Habilitada a partir del ${formatDate(fechaHabilitacion)} (faltan ${diasFaltantes} días para cargar)`;
        return result;
      }
    }

    // Regla 4: Cumple CUD, sin orden activa previa, y la fecha ya pasó (lista para cargar) o no tiene restricción
    result.computedEstado = 'lista_para_cargar';
    result.puedeCargarse = true;
    result.motivoBloqueo = undefined;
    return result;
  });
}

/**
 * Formato de fecha legible (DD/MM/AAAA)
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const iso = parseDateToIso(dateStr);
  const target = iso || dateStr;
  try {
    const parts = target.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

const normalizeHeader = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/**
 * Mapea una fila cruda de un CSV o Google Sheets a un objeto parcial de HigienicoOrden
 */
export function mapRowToHigienico(row: Record<string, any>): Partial<HigienicoOrden> | null {
  const keys = Object.keys(row);

  const hasHeader = (possibleNames: string[], excludeSubstrings: string[] = []): boolean => {
    for (const p of possibleNames) {
      const pNorm = normalizeHeader(p);
      const found = keys.find(k => {
        const kNorm = normalizeHeader(k);
        if (excludeSubstrings.some(ex => kNorm.includes(ex))) return false;
        return kNorm === pNorm || kNorm.includes(pNorm);
      });
      if (found) return true;
    }
    return false;
  };

  const findExact = (possibleNames: string[], excludeSubstrings: string[] = []): string => {
    for (const p of possibleNames) {
      const pNorm = normalizeHeader(p);
      const found = keys.find(k => {
        const kNorm = normalizeHeader(k);
        if (excludeSubstrings.some(ex => kNorm.includes(ex))) return false;
        return kNorm === pNorm;
      });
      if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
        return String(row[found]).trim();
      }
    }
    return '';
  };

  const findIncludes = (possibleNames: string[], excludeSubstrings: string[] = []): string => {
    for (const p of possibleNames) {
      const pNorm = normalizeHeader(p);
      const found = keys.find(k => {
        const kNorm = normalizeHeader(k);
        if (excludeSubstrings.some(ex => kNorm.includes(ex))) return false;
        return kNorm.includes(pNorm);
      });
      if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
        return String(row[found]).trim();
      }
    }
    return '';
  };

  // 1. Detección de Nombre del Afiliado
  const nameKeysExact = [
    'apellido y nombre', 'apellido y nombres', 'nombre y apellido', 'nombres y apellidos',
    'apellidos y nombres', 'afiliado', 'afiliados', 'paciente', 'pacientes', 
    'beneficiario', 'beneficiaria', 'beneficiarios', 'titular', 'persona', 'nombre completo', 'datos del afiliado'
  ];
  let nombre = findExact(nameKeysExact) || 
               findIncludes(['apellido y nombre', 'nombre y apellido', 'apellido y nombres', 'paciente', 'beneficiario', 'titular']);

  const colApellido = findExact(['apellido', 'apellidos']);
  const colNombre = findExact(['nombre', 'nombres']);
  if (colApellido && colNombre) {
    nombre = `${colApellido} ${colNombre}`.trim();
  } else if (!nombre) {
    if (colApellido) nombre = colApellido;
    else if (colNombre) nombre = colNombre;
    else {
      nombre = findIncludes(['afiliado', 'nombre', 'apellido'], ['nro', 'numero', 'beneficio', 'medico', 'doctor', 'profesional']);
    }
  }

  // 2. Detección de Beneficio
  const beneficioKeysExact = [
    'beneficio', 'nro beneficio', 'n° beneficio', 'nro. beneficio', 'numero de beneficio', 'numero beneficio',
    'carnet', 'nro carnet', 'n° carnet', 'afiliado nro', 'n° afiliado', 'nro afiliado', 'nro. afiliado',
    'numero afiliado', 'numero de afiliado', 'benef', 'benef.', 'nro_beneficio', 'id afiliado', 'carnet / beneficio'
  ];
  let beneficio = findExact(beneficioKeysExact) || 
                  findIncludes(['beneficio', 'carnet', 'afiliado nro', 'n° afiliado', 'nro afiliado']);

  if (beneficio && nombre && beneficio.toLowerCase() === nombre.toLowerCase()) {
    beneficio = '';
  }

  // 3. Detección de DNI
  const dniKeysExact = [
    'dni', 'documento', 'nro doc', 'n° doc', 'nro. doc', 'doc', 'documento_nro', 'numero de documento', 'cedula'
  ];
  const dni = findExact(dniKeysExact) || findIncludes(['dni', 'documento']);

  // Si no hay nombre, beneficio, ni DNI, es una fila vacía
  if (!nombre && !beneficio && !dni) {
    return null;
  }

  // Filtrar si es una fila de encabezados repetida en el contenido
  const lowerNombre = (nombre || '').toLowerCase().trim();
  const lowerBeneficio = (beneficio || '').toLowerCase().trim();
  if (
    (lowerNombre === 'apellido y nombre' || lowerNombre === 'nombre y apellido' || lowerNombre === 'nombre' || lowerNombre === 'afiliado' || lowerNombre === 'paciente') &&
    (lowerBeneficio === 'beneficio' || lowerBeneficio === 'nro beneficio' || lowerBeneficio === 'carnet' || !lowerBeneficio)
  ) {
    return null;
  }

  const hasHogarCol = hasHeader(['hogar pami', 'hogar', 'residencia', 'geriatrico', 'institucion']);
  const hogarRaw = (findExact(['hogar pami', 'hogar', 'residencia', 'geriatrico', 'institucion']) ||
                    findIncludes(['hogar', 'residencia', 'geriatrico'])).toLowerCase();
  const hogarPami = hasHogarCol
    ? (hogarRaw === 'si' || hogarRaw === 'sí' || hogarRaw === 'true' || hogarRaw === '1' || hogarRaw === 'x' || hogarRaw.includes('hogar'))
    : undefined;

  const hasCudCol = hasHeader(['cud', 'tiene cud', 'cud presentado', 'discapacidad'], ['vencimiento', 'vto', 'nro', 'numero']);
  const cudRaw = (findExact(['cud', 'tiene cud', 'cud presentado', 'discapacidad'], ['vencimiento', 'vto', 'nro', 'numero']) ||
                  findIncludes(['cud', 'discapacidad'], ['vencimiento', 'vto', 'nro', 'numero'])).toLowerCase();
  const tieneCud = hasCudCol
    ? (cudRaw
        ? (cudRaw === 'si' || cudRaw === 'sí' || cudRaw === 'true' || cudRaw === '1' || cudRaw === 'x' || cudRaw === 'ok' ||
           cudRaw.includes('verificado') || cudRaw.includes('presentado') || cudRaw.includes('vigente') || cudRaw.includes('tiene'))
        : undefined)
    : undefined;
  const cudNumero = findExact(['nro cud', 'cud nro', 'numero cud']) || findIncludes(['nro cud', 'cud nro']);
  const rawCudVencimiento = findExact(['vencimiento cud', 'vto cud', 'cud vencimiento', 'fecha vencimiento cud']) ||
                            findIncludes(['vencimiento cud', 'vto cud', 'cud vencimiento']);
  const cudVencimiento = parseDateToIso(rawCudVencimiento);

  const insumoTipo = findExact(['insumo', 'tipo', 'producto', 'modulo', 'higienico']) ||
                     findIncludes(['insumo', 'producto', 'modulo']) || 'Pañales descartables';
  const insumoTalle = findExact(['talle', 'medida', 'tamano', 'tamaño']) || findIncludes(['talle', 'medida']);
  const medicoCabecera = findExact(['medico', 'medico cabecera', 'dr', 'doctor', 'profesional']) ||
                         findIncludes(['medico', 'doctor']);
  const omeExclude = ['fecha', 'vencimiento', 'vto', 'vence', 'vigencia', 'emision', 'carga', 'prescripcion', 'f.'];
  const nroOme = findExact(['ome', 'nro ome', 'n° ome', 'nro. ome', 'numero ome', 'numero de ome', 'orden', 'nro orden', 'orden medica'], omeExclude) ||
                 findIncludes(['nro ome', 'n° ome', 'numero ome', 'orden medica', 'ome'], omeExclude);
  
  // 1. Buscar columna específica para fecha de vencimiento / habilitación de carga (EXCLUYENDO columnas de CUD)
  const vencimientoCandidates = [
    'fecha para cargar', 'fecha a cargar', 'cargar a partir de', 'cargar desde', 'para cargar', 
    'proxima carga', 'proxima fecha de carga', 'proximo vencimiento',
    'fecha habilitada', 'fecha habilitacion', 'habilitada a partir de', 'fecha de carga permitida', 
    'vencimiento de la ome', 'vencimiento ome', 'vencimiento de ome', 'fecha vencimiento ome', 
    'fecha de vencimiento ome', 'fecha vencimiento de la ome', 'fecha vencimiento', 'fecha de vencimiento', 
    'vto ome', 'vto. ome', 'vto de la ome', 'vto.', 'vto', 'f. vto', 'f.vto', 'f. vencimiento', 
    'vence ome', 'vence', 'vencimiento', 'vigencia ome', 'vigencia de ome', 'vigencia', 
    'fecha vigencia', 'fecha de vigencia', 'fecha de carga', 'fecha carga'
  ];
  let rawVencimientoOme =
    findExact(vencimientoCandidates, ['cud', 'simap']) ||
    findIncludes(vencimientoCandidates, ['cud', 'simap']);

  // 2. Buscar columna específica para emisión (EXCLUYENDO columnas de CUD)
  const emisionCandidates = [
    'fecha emision ome', 'fecha de emision ome', 'fecha emision', 'fecha de emision', 
    'fecha ome', 'fecha prescripcion', 'fecha de prescripcion', 'emision', 'f. emision', 'f.emision'
  ];
  let rawFechaEmision =
    findExact(emisionCandidates, ['cud']) ||
    findIncludes(emisionCandidates, ['cud']);

  // 3. Si solo hay una columna genérica "fecha" o "date":
  if (!rawVencimientoOme && !rawFechaEmision) {
    const genericFecha =
      findExact(['fecha', 'date'], ['cud', 'simap']) ||
      findIncludes(['fecha', 'date'], ['cud', 'simap']);
    if (genericFecha) {
      rawVencimientoOme = genericFecha;
    }
  }

  let fechaVencimientoOme = parseDateToIso(rawVencimientoOme);
  let fechaEmisionOme = parseDateToIso(rawFechaEmision);

  // Si la fecha de emisión detectada es hoy o futura, también representa fecha a esperar para cargar
  if (fechaEmisionOme && !fechaVencimientoOme) {
    const dias = getDaysDifference(fechaEmisionOme);
    if (dias >= 0) {
      fechaVencimientoOme = fechaEmisionOme;
    }
  }

  // Si la columna de vencimiento se detectó pero no la de emisión, asignar valor
  if (fechaVencimientoOme && !fechaEmisionOme) {
    fechaEmisionOme = fechaVencimientoOme;
  }

  // Columna explícita si ya fue cargada anteriormente
  const rawFechaCarga = findExact([
    'ya cargada en simap', 'cargado en simap', 'cargada en simap', 
    'cargado en sistema', 'cargada el', 'fecha de carga efectiva en simap'
  ]);
  const fechaCargaSistema = parseDateToIso(rawFechaCarga);

  const notas = findExact(['notas', 'observaciones', 'comentarios', 'detalle']) ||
                findIncludes(['observaciones', 'notas', 'comentarios']);

  return {
    afiliadoNombre: nombre,
    afiliadoBeneficio: beneficio || dni || 'Sin beneficio',
    afiliadoDni: dni,
    hogarPami,
    tieneCud,
    cudNumero,
    cudVencimiento: cudVencimiento || undefined,
    insumoTipo,
    insumoTalle,
    medicoCabecera,
    nroOme,
    fechaEmisionOme: fechaEmisionOme || undefined,
    fechaVencimientoOme: fechaVencimientoOme || undefined,
    fechaCargaSistema: fechaCargaSistema || undefined,
    fechaVencimiento: fechaCargaSistema ? calculateVencimiento(fechaCargaSistema) : (fechaVencimientoOme || undefined),
    notas
  };
}

/**
 * Órdenes de muestra iniciales (si el usuario inicia sin datos)
 * Muestra claramente la regla de que las OME con vencimiento futuro
 * NO están listas para cargar hasta que llegue la fecha indicada.
 */
export const SAMPLE_HIGIENICOS_ORDENES: Partial<HigienicoOrden>[] = [
  {
    afiliadoNombre: "OLIVELLA LUCRECIA ISABEL",
    afiliadoBeneficio: "15019304290900",
    afiliadoDni: "4910293",
    hogarPami: false,
    tieneCud: false,
    insumoTipo: "Pañales descartables",
    insumoTalle: "Grande (G)",
    medicoCabecera: "Dr. Juan Carlos Pérez",
    nroOme: "OME-991823",
    fechaEmisionOme: "2026-10-10",
    fechaVencimientoOme: "2026-10-28",
    fechaVencimiento: "2026-10-28",
    notas: "Vigencia de OME: 28/10/2026. En espera para cargar."
  },
  {
    afiliadoNombre: "GÓMEZ MARÍA ELENA",
    afiliadoBeneficio: "150392847101",
    afiliadoDni: "4829103",
    hogarPami: true,
    tieneCud: false,
    insumoTipo: "Pañales Adulto Mayor",
    insumoTalle: "Grande (G)",
    medicoCabecera: "Dr. Juan Carlos Pérez",
    nroOme: "OME-992144",
    fechaEmisionOme: "2026-10-10",
    fechaVencimientoOme: "2026-11-11",
    fechaVencimiento: "2026-11-11",
    notas: "Reside en Hogar San José. Requiere CUD y además su vigencia OME es el 11/11/2026."
  },
  {
    afiliadoNombre: "RODRÍGUEZ ROBERTO",
    afiliadoBeneficio: "150882194300",
    afiliadoDni: "6124982",
    hogarPami: true,
    tieneCud: true,
    cudNumero: "CUD-08412-BA",
    insumoTipo: "Pañales Adulto Mayor",
    insumoTalle: "Extra Grande (XG)",
    medicoCabecera: "Dra. Laura Rossi",
    nroOme: "OME-993201",
    fechaEmisionOme: "2026-10-14",
    fechaVencimientoOme: "2026-11-11",
    fechaVencimiento: "2026-11-11",
    notas: "CUD validado. Vencimiento OME: 11/11/2026 (habilitada para cargar a partir de esa fecha)."
  },
  {
    afiliadoNombre: "ÁLVAREZ BEATRIZ",
    afiliadoBeneficio: "150228394002",
    afiliadoDni: "5201948",
    hogarPami: false,
    tieneCud: false,
    insumoTipo: "Pañales Adulto",
    insumoTalle: "Grande (G)",
    medicoCabecera: "Dr. Juan Carlos Pérez",
    nroOme: "OME-994510",
    fechaEmisionOme: "2026-10-15",
    fechaVencimientoOme: "2026-11-20",
    fechaVencimiento: "2026-11-20",
    notas: "Nueva prescripción. Vto. OME: 20/11/2026. En espera para cargar a partir de dicha fecha."
  },
  {
    afiliadoNombre: "FERNÁNDEZ ROSA",
    afiliadoBeneficio: "150493012902",
    afiliadoDni: "5910284",
    hogarPami: false,
    tieneCud: false,
    insumoTipo: "Apósitos Descartables Anatómicos",
    insumoTalle: "Único",
    medicoCabecera: "Dr. Marcelo Álvarez",
    nroOme: "OME-987654",
    fechaEmisionOme: "2026-10-12",
    fechaCargaSistema: "2026-07-28", // Cargado hace ~79 días -> le quedan ~11 días (Próxima a vencer)
    fechaVencimiento: "2026-10-26",
    notas: "Ciclo de 3 meses en curso. Vence a fin de mes."
  },
  {
    afiliadoNombre: "LÓPEZ HORACIO",
    afiliadoBeneficio: "150119284501",
    afiliadoDni: "7402911",
    hogarPami: false,
    tieneCud: false,
    insumoTipo: "Pañales Adulto",
    insumoTalle: "Mediano (M)",
    medicoCabecera: "Dra. Andrea Gutiérrez",
    nroOme: "OME-990012",
    fechaEmisionOme: "2026-09-20",
    fechaCargaSistema: "2026-09-22", // Cargado hace ~23 días -> le quedan ~67 días (Vigente)
    fechaVencimiento: "2026-12-21",
    notas: "Orden en curso normal."
  }
];
