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
 * Convierte formatos comunes de fechas (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, seriales de Excel y objetos Date) a ISO YYYY-MM-DD
 */
export function parseDateToIso(rawDateStr?: any): string {
  if (rawDateStr === undefined || rawDateStr === null) return '';
  
  // Objeto Date
  if (rawDateStr instanceof Date) {
    if (!isNaN(rawDateStr.getTime())) {
      const y = rawDateStr.getFullYear();
      const m = String(rawDateStr.getMonth() + 1).padStart(2, '0');
      const d = String(rawDateStr.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // Serial numérico directo de Excel (ej: 46320)
  if (typeof rawDateStr === 'number' && !isNaN(rawDateStr)) {
    if (rawDateStr > 30000 && rawDateStr < 75000) {
      const utcDays = Math.floor(rawDateStr - 25569);
      const dateInfo = new Date(utcDays * 86400 * 1000);
      if (!isNaN(dateInfo.getTime())) {
        const y = dateInfo.getUTCFullYear();
        const m = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
        const d = String(dateInfo.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
  }

  let str = String(rawDateStr).trim();
  if (!str) return '';

  // Quitar horas/timestamps si vienen en la cadena (ej: "28/10/2026 14:00" o "2026-10-28T00:00:00")
  str = str.split(/[\sT]/)[0].trim();

  // Serial numérico de Excel como texto
  const numParsed = Number(str);
  if (!isNaN(numParsed) && numParsed > 30000 && numParsed < 75000) {
    const utcDays = Math.floor(numParsed - 25569);
    const dateInfo = new Date(utcDays * 86400 * 1000);
    if (!isNaN(dateInfo.getTime())) {
      const y = dateInfo.getUTCFullYear();
      const m = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dateInfo.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // Ya en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Formatos con delimitadores: /, -, .
  const parts = str.split(/[/.-]/);
  if (parts.length === 3) {
    let [p1, p2, p3] = parts.map(p => p.trim());
    // Formato YYYY/MM/DD
    if (p1.length === 4) {
      return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
    }
    // Formato DD/MM/YY o DD/MM/YYYY
    if (p3.length === 2) {
      p3 = `20${p3}`;
    }
    if (p3.length === 4) {
      return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
  }

  return str;
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
 * 0: es exactamente hoy (habilitada para cargar hoy).
 * Negativo (<0): esa fecha ya pasó hace X días (habilitada para cargar).
 */
export function getDaysDifference(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  try {
    const cleanTarget = targetDateStr.trim().slice(0, 10);
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
    if (orden.fechaCargaSistema && orden.fechaVencimiento) {
      const dias = getDaysDifference(orden.fechaVencimiento);
      if (dias >= 0) {
        // Esta orden está vigente o próxima a vencer
        const key = orden.afiliadoBeneficio.trim();
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

    // Caso A: La orden ya fue cargada en el sistema externo
    if (orden.fechaCargaSistema && orden.fechaVencimiento) {
      const diasRestantes = getDaysDifference(orden.fechaVencimiento);
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
    const activeOrder = activeOrdersByBeneficio.get(orden.afiliadoBeneficio.trim());
    if (activeOrder && activeOrder.id !== orden.id) {
      const diasEsperar = getDaysDifference(activeOrder.fechaVencimiento!);
      result.bloqueantePorOrdenVigente = activeOrder;
      result.puedeCargarse = false;
      result.computedEstado = 'en_espera_vencimiento';
      result.motivoBloqueo = `Orden previa activa (vence el ${formatDate(activeOrder.fechaVencimiento!)} - faltan ${diasEsperar} días)`;
      return result;
    }

    // Regla 3: Vencimiento de la OME (Fecha a partir de la cual recién se puede cargar)
    const fechaHabilitacion = orden.fechaVencimientoOme || orden.fechaVencimiento || orden.fechaEmisionOme;
    if (fechaHabilitacion) {
      const diasFaltantes = getDaysDifference(fechaHabilitacion);
      console.log(`DEBUG: Higienico ${orden.afiliadoNombre} habilitacion:${fechaHabilitacion} diasFaltantes:${diasFaltantes}`);
      if (diasFaltantes > 0) {
        // La fecha es futura -> Aún NO está disponible para cargar (Pendiente)
        result.computedEstado = 'en_espera_vencimiento';
        result.puedeCargarse = false;
        result.diasRestantes = diasFaltantes;
        result.motivoBloqueo = diasFaltantes === 1
          ? `Habilitada a partir de mañana (${formatDate(fechaHabilitacion)})`
          : `Habilitada a partir del ${formatDate(fechaHabilitacion)} (faltan ${diasFaltantes} días para cargar)`;
        return result;
      }
    }

    // Regla 4: Cumple CUD, sin orden activa previa, y la fecha ya llegó o no tiene restricción
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
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Mapea una fila cruda de un CSV o Google Sheets a un objeto parcial de HigienicoOrden
 */
export function mapRowToHigienico(row: Record<string, any>): Partial<HigienicoOrden> | null {
  const keys = Object.keys(row);

  const findExact = (possibleNames: string[]): string => {
    for (const p of possibleNames) {
      const found = keys.find(k => k.trim().toLowerCase() === p.toLowerCase());
      if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
        return String(row[found]).trim();
      }
    }
    return '';
  };

  const findIncludes = (possibleNames: string[]): string => {
    for (const p of possibleNames) {
      const found = keys.find(k => k.trim().toLowerCase().includes(p.toLowerCase()));
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
      nombre = findIncludes(['afiliado', 'nombre', 'apellido']);
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

  const hogarRaw = (findExact(['hogar pami', 'hogar', 'residencia', 'geriatrico', 'institucion']) ||
                    findIncludes(['hogar', 'residencia', 'geriatrico'])).toLowerCase();
  const hogarPami = hogarRaw === 'si' || hogarRaw === 'sí' || hogarRaw === 'true' || hogarRaw === '1' || hogarRaw.includes('hogar');

  const cudRaw = (findExact(['cud', 'tiene cud', 'cud presentado', 'discapacidad']) ||
                  findIncludes(['cud', 'discapacidad'])).toLowerCase();
  const tieneCud = cudRaw === 'si' || cudRaw === 'sí' || cudRaw === 'true' || cudRaw === '1' || cudRaw.includes('verificado');
  const cudNumero = findExact(['nro cud', 'cud nro', 'numero cud']) || findIncludes(['nro cud', 'cud nro']);

  const insumoTipo = findExact(['insumo', 'tipo', 'producto', 'modulo', 'higienico']) ||
                     findIncludes(['insumo', 'producto', 'modulo']) || 'Pañales descartables';
  const insumoTalle = findExact(['talle', 'medida', 'tamano', 'tamaño']) || findIncludes(['talle', 'medida']);
  const medicoCabecera = findExact(['medico', 'médico', 'medico cabecera', 'dr', 'doctor', 'profesional']) ||
                         findIncludes(['medico', 'médico', 'doctor']);
  const nroOme = findExact(['ome', 'nro ome', 'n° ome', 'orden', 'nro orden', 'orden medica']) ||
                 findIncludes(['nro ome', 'orden medica', 'ome']);
  
  // 1. Buscar columna específica para fecha de vencimiento / habilitación de carga
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
  let rawVencimientoOme = findExact(vencimientoCandidates) || findIncludes(vencimientoCandidates);

  // 2. Buscar columna específica para emisión
  const emisionCandidates = [
    'fecha emision ome', 'fecha de emision ome', 'fecha emision', 'fecha de emision', 
    'fecha ome', 'fecha prescripcion', 'fecha de prescripcion', 'emision', 'f. emision', 'f.emision'
  ];
  let rawFechaEmision = findExact(emisionCandidates) || findIncludes(emisionCandidates);

  // 3. Si solo hay una columna genérica "fecha" o "date":
  if (!rawVencimientoOme && !rawFechaEmision) {
    const genericFecha = findExact(['fecha', 'date']) || findIncludes(['fecha', 'date']);
    if (genericFecha) {
      rawVencimientoOme = genericFecha;
    }
  }

  let fechaVencimientoOme = parseDateToIso(rawVencimientoOme);
  let fechaEmisionOme = parseDateToIso(rawFechaEmision);

  // Si la fecha de emisión detectada es futura, en realidad es la fecha a esperar para cargar
  if (fechaEmisionOme && !fechaVencimientoOme) {
    const dias = getDaysDifference(fechaEmisionOme);
    if (dias > 0) {
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
