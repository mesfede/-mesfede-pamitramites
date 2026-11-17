import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  CheckCircle2, 
  Users, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Building2, 
  Info,
  Lock,
  RefreshCw,
  CalendarClock,
  History,
  X,
  CalendarOff
} from 'lucide-react';
import { HigienicoOrden, HigienicoCargada, HigienicosConfig, DEFAULT_AUTHORIZED_HIGIENICOS_EMAILS } from '../types';
import { 
  subscribeToHigienicosOrdenes, 
  subscribeToHigienicosConfig, 
  subscribeToHigienicosCargadas,
  restaurarOrdenCargada,
  limpiarHistorialCargadas,
  deleteHigienicoOrden, 
  deleteAllHigienicos,
  syncHigienicosFromSheet,
  updateHigienicosConfig
} from '../services/firestore';
import { 
  processHigienicosOrdenes, 
  ProcessedHigienicoOrden, 
  formatDate, 
  parseHigienicosCsv,
  normalizeGoogleSheetUrl,
  getGoogleSheetGvizUrl
} from '../utils/higienicosUtils';
import { HigienicosSyncModal } from './HigienicosSyncModal';
import { HigienicosMarcarCargadoModal } from './HigienicosMarcarCargadoModal';
import { HigienicosManualOrderModal } from './HigienicosManualOrderModal';
import { HigienicosAuthModal } from './HigienicosAuthModal';

interface HigienicosDashboardProps {
  currentUserEmail?: string;
  isAdmin?: boolean;
}

export const HigienicosDashboard: React.FC<HigienicosDashboardProps> = ({
  currentUserEmail,
  isAdmin = false
}) => {
  console.log('HigienicosDashboard rendered');
  console.log('HigienicosDashboard props:', { currentUserEmail, isAdmin });
  const [ordenes, setOrdenes] = useState<HigienicoOrden[]>([]);
  const [cargadas, setCargadas] = useState<HigienicoCargada[]>([]);
  const [config, setConfig] = useState<HigienicosConfig>({
    authorizedEmails: DEFAULT_AUTHORIZED_HIGIENICOS_EMAILS
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modales
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCargadasModalOpen, setIsCargadasModalOpen] = useState(false);
  const [cargadasSearch, setCargadasSearch] = useState('');
  const [restoringCargadaId, setRestoringCargadaId] = useState<string | null>(null);
  const [isClearingCargadas, setIsClearingCargadas] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<HigienicoOrden | null>(null);
  const [orderToMarkCargado, setOrderToMarkCargado] = useState<HigienicoOrden | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProcessedHigienicoOrden | null>(null);

  // Búsqueda y Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'todos' | 'listas' | 'en_espera' | 'sin_fecha'>('todos');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isUpdatingSheet, setIsUpdatingSheet] = useState(false);
  const isUpdatingSheetRef = useRef(false);
  const hasInitialAutoSyncRef = useRef(false);

  // Suscripciones en tiempo real
  useEffect(() => {
    setIsLoading(true);
    const unsubOrdenes = subscribeToHigienicosOrdenes((items) => {
      setOrdenes(items);
      setIsLoading(false);
    });

    const unsubConfig = subscribeToHigienicosConfig((conf) => {
      setConfig(conf);
    });

    const unsubCargadas = subscribeToHigienicosCargadas((items) => {
      setCargadas(items);
    });

    return () => {
      unsubOrdenes();
      unsubConfig();
      unsubCargadas();
    };
  }, []);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleQuickUpdateFromGoogleSheet = async (isAutoSync: boolean = false) => {
    const url = config.googleSheetUrl || localStorage.getItem('higienicos_last_sheet_url');
    if (!url || !url.trim()) {
      if (!isAutoSync) {
        setIsSyncModalOpen(true);
        showFeedback('Configura el enlace de tu Google Sheet para actualizar con 1 clic.');
      }
      return;
    }

    if (isUpdatingSheetRef.current) return;
    isUpdatingSheetRef.current = true;
    setIsUpdatingSheet(true);
    const cleanUrl = url.trim();

    try {
      let csvText = '';
      const now = Date.now();

      // 1. Intento por Proxy del Servidor con timestamp anti-cache
      try {
        const proxyUrl = `/api/fetch-sheet?url=${encodeURIComponent(cleanUrl)}&_t=${now}`;
        const res = await fetch(proxyUrl, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.csv) csvText = data.csv;
        }
      } catch (proxyErr) {
        console.warn('Proxy fetch warning:', proxyErr);
      }

      // 2. Si falló, intento Gviz de cliente
      if (!csvText) {
        try {
          const gvizBase = getGoogleSheetGvizUrl(cleanUrl);
          if (gvizBase) {
            const gvizUrl = gvizBase.includes('?') ? `${gvizBase}&_t=${now}` : `${gvizBase}?_t=${now}`;
            const gvizRes = await fetch(gvizUrl, { cache: 'no-store' });
            if (gvizRes.ok) {
              const text = await gvizRes.text();
              if (text && !text.includes('<!DOCTYPE html>') && text.length > 10) {
                csvText = text;
              }
            }
          }
        } catch (gvizErr) {
          console.warn('Gviz fetch warning:', gvizErr);
        }
      }

      // 3. Si aún falló, intento exportación CSV directa de cliente
      if (!csvText) {
        try {
          const directBase = normalizeGoogleSheetUrl(cleanUrl);
          const directUrl = directBase.includes('?') ? `${directBase}&_t=${now}` : `${directBase}?_t=${now}`;
          const directRes = await fetch(directUrl, { cache: 'no-store' });
          if (directRes.ok) {
            const text = await directRes.text();
            if (text && !text.includes('<!DOCTYPE html>') && text.length > 10) {
              csvText = text;
            }
          }
        } catch (directErr) {
          console.warn('Direct fetch warning:', directErr);
        }
      }

      if (!csvText) {
        if (!isAutoSync) {
          throw new Error('No se pudo leer la planilla de Google Sheets. Verifica que esté configurada como pública ("Cualquier persona con el enlace").');
        }
        isUpdatingSheetRef.current = false;
        setIsUpdatingSheet(false);
        return;
      }

      const mapped = parseHigienicosCsv(csvText);
      if (mapped.length === 0) {
        if (!isAutoSync) {
          showFeedback('No se detectaron filas válidas en la planilla');
        }
        return;
      }

      const syncRes = await syncHigienicosFromSheet(mapped, cleanUrl);
      await updateHigienicosConfig({ googleSheetUrl: cleanUrl }).catch(() => {});
      localStorage.setItem('higienicos_last_sheet_url', cleanUrl);

      const detailMsg = [];
      if (syncRes.added > 0) detailMsg.push(`${syncRes.added} agregadas`);
      if (syncRes.updated > 0) detailMsg.push(`${syncRes.updated} actualizadas`);
      if ((syncRes.deleted || 0) > 0) detailMsg.push(`${syncRes.deleted} eliminadas`);

      if (detailMsg.length > 0) {
        const skippedNote = syncRes.skipped > 0 ? ` (${syncRes.skipped} omitidas por ya estar cargadas)` : '';
        showFeedback(`¡Planilla sincronizada! ${detailMsg.join(', ')}.${skippedNote}`);
      } else if (!isAutoSync) {
        if (syncRes.skipped > 0) {
          showFeedback(`Planilla al día. ${syncRes.skipped} ${syncRes.skipped === 1 ? 'orden fue omitida porque ya figura en Cargadas' : 'órdenes fueron omitidas porque ya figuran en Cargadas'}.`);
        } else {
          showFeedback('Planilla sincronizada. Todos los datos ya estaban al día.');
        }
      }
    } catch (err: any) {
      console.error('Error updating from sheet:', err);
      if (!isAutoSync) {
        showFeedback('Error: ' + (err.message || 'No se pudo actualizar desde Google Sheet'));
      }
    } finally {
      isUpdatingSheetRef.current = false;
      setIsUpdatingSheet(false);
    }
  };

  // Auto-sincronización inicial al abrir, periódica (cada 2 min) y al volver a enfocar la pestaña
  useEffect(() => {
    let lastAutoSync = 0;
    const cooldownMs = 25000; // mínimo 25s entre llamadas automáticas

    const effectiveUrl = config.googleSheetUrl || localStorage.getItem('higienicos_last_sheet_url');
    if (effectiveUrl && !hasInitialAutoSyncRef.current) {
      hasInitialAutoSyncRef.current = true;
      lastAutoSync = Date.now();
      handleQuickUpdateFromGoogleSheet(true);
    }

    const triggerAutoSync = () => {
      const now = Date.now();
      if (now - lastAutoSync < cooldownMs) return;
      lastAutoSync = now;
      handleQuickUpdateFromGoogleSheet(true);
    };

    // 1. Intervalo periódico cada 2 minutos (120000 ms)
    const intervalId = setInterval(triggerAutoSync, 120000);

    // 2. Al volver a la pestaña tras editar el Google Sheet
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerAutoSync();
      }
    };
    const onWindowFocus = () => {
      triggerAutoSync();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onWindowFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [config.googleSheetUrl]);

  // Validación de acceso configurable por el administrador
  const isAuthorized = useMemo(() => {
    if (!currentUserEmail) return false;
    const lowerEmail = currentUserEmail.toLowerCase().trim();
    if (lowerEmail === 'mesfede@gmail.com') return true;
    
    const authorized = config.authorizedEmails || DEFAULT_AUTHORIZED_HIGIENICOS_EMAILS;
    return authorized.some(e => e.toLowerCase().trim() === lowerEmail);
  }, [currentUserEmail, config.authorizedEmails]);

  // Procesamiento de órdenes según la fecha de OME de la planilla
  const processedOrdenes = useMemo(() => {
    return processHigienicosOrdenes(ordenes);
  }, [ordenes]);

  // Métricas para tarjetas KPI
  const stats = useMemo(() => {
    let listasParaCargar = 0;
    let enEsperaVencimiento = 0;
    let sinFecha = 0;

    for (const item of processedOrdenes) {
      if (item.computedEstado === 'lista_para_cargar') listasParaCargar++;
      else if (item.computedEstado === 'en_espera_vencimiento') enEsperaVencimiento++;
      else if (item.computedEstado === 'sin_fecha') sinFecha++;
    }

    return {
      total: processedOrdenes.length,
      listasParaCargar,
      enEsperaVencimiento,
      sinFecha
    };
  }, [processedOrdenes]);

  // Filtrado reactivo por texto y pestaña con ordenamiento prioritario
  const filteredOrdenes = useMemo(() => {
    const list = processedOrdenes.filter(item => {
      // Filtro de estado
      if (activeFilter === 'listas' && item.computedEstado !== 'lista_para_cargar') return false;
      if (activeFilter === 'en_espera' && item.computedEstado !== 'en_espera_vencimiento') return false;
      if (activeFilter === 'sin_fecha' && item.computedEstado !== 'sin_fecha') return false;

      // Filtro de búsqueda
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.afiliadoNombre.toLowerCase().includes(q) ||
        item.afiliadoBeneficio.toLowerCase().includes(q) ||
        (item.afiliadoDni && item.afiliadoDni.toLowerCase().includes(q)) ||
        item.nroOme.toLowerCase().includes(q) ||
        (item.medicoCabecera && item.medicoCabecera.toLowerCase().includes(q)) ||
        (item.insumoTipo && item.insumoTipo.toLowerCase().includes(q))
      );
    });

    return list.sort((a, b) => {
      const priority: Record<string, number> = {
        'lista_para_cargar': 1,
        'en_espera_vencimiento': 2,
        'sin_fecha': 3
      };
      const pA = priority[a.computedEstado] || 99;
      const pB = priority[b.computedEstado] || 99;
      if (pA !== pB) return pA - pB;

      // Ordenar por fecha más cercana / antigua primero
      const dateA = a.fechaVencimientoOme || a.fechaEmisionOme || a.fechaVencimiento || '';
      const dateB = b.fechaVencimientoOme || b.fechaEmisionOme || b.fechaVencimiento || '';
      return dateA.localeCompare(dateB);
    });
  }, [processedOrdenes, activeFilter, searchQuery]);

  // Coincidencias de búsqueda en otras pestañas o en Historial de Cargadas
  const searchCrossMatches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return { otherOrders: [] as ProcessedHigienicoOrden[], cargadasMatches: [] as HigienicoCargada[] };

    const visibleIds = new Set(filteredOrdenes.map(o => o.id));
    const otherOrders = processedOrdenes.filter(item => {
      if (visibleIds.has(item.id)) return false;
      return (
        item.afiliadoNombre.toLowerCase().includes(q) ||
        item.afiliadoBeneficio.toLowerCase().includes(q) ||
        (item.afiliadoDni && item.afiliadoDni.toLowerCase().includes(q)) ||
        item.nroOme.toLowerCase().includes(q)
      );
    });

    const cargadasMatches = cargadas.filter(c =>
      c.afiliadoNombre.toLowerCase().includes(q) ||
      c.afiliadoBeneficio.toLowerCase().includes(q) ||
      (c.afiliadoDni && c.afiliadoDni.toLowerCase().includes(q)) ||
      (c.nroOme && c.nroOme.toLowerCase().includes(q))
    );

    return { otherOrders, cargadasMatches };
  }, [searchQuery, filteredOrdenes, processedOrdenes, cargadas]);

  const filteredCargadas = useMemo(() => {
    const q = cargadasSearch.toLowerCase().trim();
    if (!q) return cargadas;
    return cargadas.filter(c =>
      c.afiliadoNombre.toLowerCase().includes(q) ||
      c.afiliadoBeneficio.toLowerCase().includes(q) ||
      (c.nroOme && c.nroOme.toLowerCase().includes(q))
    );
  }, [cargadas, cargadasSearch]);

  const handleRestoreCargada = async (cargada: HigienicoCargada) => {
    setRestoringCargadaId(cargada.id);
    try {
      await restaurarOrdenCargada(cargada);
      showFeedback(`Orden de ${cargada.afiliadoNombre} restaurada a pendientes.`);
    } catch (err: any) {
      showFeedback('Error al restaurar orden: ' + (err.message || 'Error desconocido'));
    } finally {
      setRestoringCargadaId(null);
    }
  };

  const handleClearCargadasHistory = async () => {
    setIsClearingCargadas(true);
    try {
      const count = await limpiarHistorialCargadas();
      showFeedback(`Se limpiaron ${count} registros del historial de cargadas.`);
    } catch (err: any) {
      showFeedback('Error al limpiar historial: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsClearingCargadas(false);
    }
  };

  const handleConfirmDeleteSingle = async () => {
    if (!itemToDelete) return;
    try {
      await deleteHigienicoOrden(itemToDelete.id);
      showFeedback(`Orden eliminada para ${itemToDelete.afiliadoNombre}`);
      setItemToDelete(null);
    } catch (err: any) {
      showFeedback('Error al eliminar orden: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const res = await deleteAllHigienicos();
      setIsDeleteAllModalOpen(false);
      showFeedback(`Se eliminaron ${res.deleted} registros. La base de datos está vacía para cargar de nuevo.`);
    } catch (err: any) {
      showFeedback('Error al vaciar registros: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Si no está autorizado, pantalla limpia de acceso restringido
  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Módulo de Higiénicos Absorbentes</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Este módulo está restringido exclusivamente a los 3 operadores autorizados para la carga y control del ciclo de pañales OME en el sistema de PAMI.
        </p>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600">
          Tu usuario actual: <span className="font-semibold text-slate-900">{currentUserEmail || 'No autenticado'}</span>
        </div>
        <p className="text-xs text-slate-400">
          Si requieres acceso, solicita la incorporación de tu correo a <span className="font-semibold text-slate-700">mesfede@gmail.com</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Control de Higiénicos Absorbentes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-semibold border border-teal-200">
              Pañales y Absorbentes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Control de órdenes OME disponibles según las fechas de la planilla de Google Sheets.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botón directo de actualización de Google Sheet */}
          <button
            type="button"
            onClick={() => handleQuickUpdateFromGoogleSheet(false)}
            disabled={isUpdatingSheet}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            title={config.googleSheetUrl ? "Auto-sincronización activa (cada 2 min y al volver a esta pestaña). Clic para sincronizar ahora." : "Configurar y sincronizar Google Sheet"}
          >
            <RefreshCw className={`w-4 h-4 ${isUpdatingSheet ? 'animate-spin' : ''}`} />
            <span>{isUpdatingSheet ? 'Sincronizando...' : 'Actualizar Google Sheet'}</span>
            {config.googleSheetUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" title="Auto-sincronización activa" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Subir archivo Excel (.xlsx / .xls) o vincular Google Sheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-700" />
            <span>Cargar Excel / Sheet</span>
            {config.lastSyncAt && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Sincronizado" />
            )}
          </button>



          <button
            type="button"
            onClick={() => { setCargadasSearch(searchQuery); setIsCargadasModalOpen(true); }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Ver órdenes marcadas como ya cargadas (omitidas al sincronizar)"
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>Cargadas ({cargadas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteAllModalOpen(true)}
            className="px-3.5 py-2 text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Vaciar todos los registros de higiénicos"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Vaciar Registros</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
            title="Administrar 3 usuarios autorizados"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Banner de Aviso Diario para Carga */}
      {stats.listasParaCargar > 0 ? (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0 animate-pulse">
              {stats.listasParaCargar}
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>¡Tienes órdenes listas para cargar hoy!</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold">
                  Disponibles hoy
                </span>
              </h2>
              <p className="text-xs text-emerald-800 mt-0.5">
                Cumplieron la fecha indicada en la planilla y ya están habilitadas para cargar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveFilter('listas')}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-xs"
          >
            Ver {stats.listasParaCargar} listas hoy
          </button>
        </div>
      ) : stats.total > 0 ? (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-slate-600 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <CalendarClock className="w-4 h-4" />
            </div>
            <span>
              <strong>Sin órdenes para cargar hoy:</strong> {stats.enEsperaVencimiento > 0 ? `${stats.enEsperaVencimiento} esperando su fecha` : 'ninguna en espera'}
              {stats.sinFecha > 0 ? ` y ${stats.sinFecha} sin fecha asignada en la planilla` : ''}.
            </span>
          </div>
        </div>
      ) : null}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Listas para Cargar */}
        <div 
          onClick={() => setActiveFilter('listas')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'listas' 
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20' 
              : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase">Listas para Cargar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{stats.listasParaCargar}</div>
          <p className="text-[11px] text-emerald-700 mt-1">
            Fecha de OME cumplida
          </p>
        </div>

        {/* Card 2: En Espera de Fecha */}
        <div 
          onClick={() => setActiveFilter('en_espera')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'en_espera' 
              ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20' 
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase">En Espera de Fecha</span>
            <CalendarClock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{stats.enEsperaVencimiento}</div>
          <p className="text-[11px] text-amber-700 mt-1">
            Habilitan al día siguiente
          </p>
        </div>

        {/* Card 3: Sin Fecha */}
        <div 
          onClick={() => setActiveFilter('sin_fecha')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'sin_fecha' 
              ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20' 
              : 'bg-white border-slate-200 hover:border-rose-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-rose-800 mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase">Sin Fecha</span>
            <CalendarOff className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{stats.sinFecha}</div>
          <p className="text-[11px] text-rose-700 mt-1">
            No tienen fecha en planilla
          </p>
        </div>

        {/* Card 4: Total */}
        <div 
          onClick={() => setActiveFilter('todos')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'todos' 
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-700 mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase">Total Órdenes</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{stats.total}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Sincronizadas desde planilla
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por afiliado, beneficio, DNI, N° OME o médico..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent bg-slate-50/50"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveFilter('todos')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === 'todos' 
                  ? 'bg-slate-900 text-white font-semibold' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Todas ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('listas')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === 'listas' 
                  ? 'bg-emerald-700 text-white font-semibold' 
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Listas para cargar ({stats.listasParaCargar})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('en_espera')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === 'en_espera' 
                  ? 'bg-amber-600 text-white font-semibold' 
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              En espera de fecha ({stats.enEsperaVencimiento})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('sin_fecha')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === 'sin_fecha' 
                  ? 'bg-rose-700 text-white font-semibold' 
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Sin fecha ({stats.sinFecha})
            </button>
          </div>
        </div>

        {/* Alerta de coincidencias en otras pestañas o en Historial de Cargadas */}
        {searchQuery.trim() && (searchCrossMatches.otherOrders.length > 0 || searchCrossMatches.cargadasMatches.length > 0) && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
              <div className="space-y-0.5">
                {searchCrossMatches.otherOrders.length > 0 && (
                  <p>
                    Hay <strong>{searchCrossMatches.otherOrders.length}</strong> {searchCrossMatches.otherOrders.length === 1 ? 'coincidencia' : 'coincidencias'} en otra categoría ({searchCrossMatches.otherOrders.map(o => `${o.afiliadoNombre} [${o.computedEstado === 'sin_fecha' ? 'No tiene fecha' : o.computedEstado === 'en_espera_vencimiento' ? 'En espera' : 'Lista para cargar'}]`).slice(0, 3).join(', ')}).
                  </p>
                )}
                {searchCrossMatches.cargadasMatches.length > 0 && (
                  <p>
                    Hay <strong>{searchCrossMatches.cargadasMatches.length}</strong> {searchCrossMatches.cargadasMatches.length === 1 ? 'registro marcado como ya cargado' : 'registros marcados como ya cargados'} en Historial Cargadas ({searchCrossMatches.cargadasMatches.map(c => c.afiliadoNombre).slice(0, 3).join(', ')}), por eso se omite en sincronización.
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {searchCrossMatches.otherOrders.length > 0 && activeFilter !== 'todos' && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('todos')}
                  className="px-2.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                >
                  Ver en Todas
                </button>
              )}
              {searchCrossMatches.cargadasMatches.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setCargadasSearch(searchQuery); setIsCargadasModalOpen(true); }}
                  className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                >
                  Ver / Restaurar en Cargadas
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
            <span>Cargando órdenes de higiénicos absorbentes...</span>
          </div>
        ) : filteredOrdenes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-3">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-800">No se encontraron órdenes con los filtros seleccionados.</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              Puedes sincronizar con tu Google Sheet, subir un archivo CSV o agregar una nueva prescripción manual.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(true)}
                className="px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-semibold hover:bg-teal-800 transition-colors shadow-xs"
              >
                Sincronizar Planilla
              </button>
              <button
                type="button"
                onClick={() => { setOrderToEdit(null); setIsManualModalOpen(true); }}
                className="px-4 py-2 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Cargar Manual
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Afiliado</th>
                  <th className="py-3 px-4">Modalidad</th>
                  <th className="py-3 px-4">Prescripción & Fecha OME</th>
                  <th className="py-3 px-4">Estado de OME</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrdenes.map((item) => {
                  const isReadyToLoad = item.computedEstado === 'lista_para_cargar';
                  const isSinFecha = item.computedEstado === 'sin_fecha';
                  const displayFechaOme = item.fechaVencimientoOme || item.fechaEmisionOme || item.fechaVencimiento;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Column 1: Afiliado */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-semibold text-slate-900 uppercase">
                          {item.afiliadoNombre}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Ben: <span className="font-medium text-slate-700">{item.afiliadoBeneficio}</span>
                          {item.afiliadoDni && <span className="ml-2 text-slate-400">· DNI {item.afiliadoDni}</span>}
                        </div>
                        {item.notas && (
                          <div className="text-[11px] text-slate-500 italic mt-1 max-w-xs truncate" title={item.notas}>
                            Nota: {item.notas}
                          </div>
                        )}
                      </td>

                      {/* Column 2: Modalidad */}
                      <td className="py-3 px-4 align-top">
                        {item.hogarPami ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-semibold">
                            <Building2 className="w-3 h-3 text-purple-700" />
                            Hogar PAMI
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Particular</span>
                        )}
                      </td>

                      {/* Column 3: Prescripción OME */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-medium text-slate-900">
                          {item.insumoTipo}
                        </div>
                        {item.insumoTalle && (
                          <div className="text-[11px] text-slate-600">
                            Talle: <span className="font-semibold">{item.insumoTalle}</span>
                          </div>
                        )}
                        {item.nroOme && (
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            N° OME: {item.nroOme}
                          </div>
                        )}
                        <div className="mt-1">
                          {displayFechaOme && !isSinFecha ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-900 bg-amber-50/90 border border-amber-200 px-2 py-0.5 rounded-md">
                              <CalendarClock className="w-3 h-3 text-amber-700 shrink-0" />
                              Fecha OME: {formatDate(displayFechaOme)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                              <CalendarOff className="w-3 h-3 text-rose-600 shrink-0" />
                              No tiene fecha
                            </span>
                          )}
                        </div>
                        {item.medicoCabecera && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5" title={item.medicoCabecera}>
                            Dr: {item.medicoCabecera}
                          </div>
                        )}
                      </td>

                      {/* Column 4: Estado OME */}
                      <td className="py-3 px-4 align-top">
                        {isReadyToLoad && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              Lista para cargar hoy
                            </span>
                            <p className="text-[11px] text-slate-500">
                              Fecha de OME cumplida. Disponible para cargar.
                            </p>
                          </div>
                        )}

                        {item.computedEstado === 'en_espera_vencimiento' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-semibold border border-amber-300">
                              <CalendarClock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              En espera ({formatDate(displayFechaOme)})
                            </span>
                            <p className="text-[11px] text-amber-800 font-medium">
                              {item.motivoBloqueo}
                            </p>
                          </div>
                        )}

                        {isSinFecha && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-semibold border border-rose-200">
                              <CalendarOff className="w-3 h-3 text-rose-700 shrink-0" />
                              No tiene fecha
                            </span>
                            <p className="text-[11px] text-rose-700">
                              Falta fecha en la planilla. No se habilita para cargar.
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Column 5: Acciones */}
                      <td className="py-3 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setOrderToMarkCargado(item)}
                            disabled={!item.puedeCargarse}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-xs ${
                              item.puedeCargarse
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                            title={item.motivoBloqueo || 'Marcar como cargada y quitar de pendientes'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Cargar OM</span>
                          </button>

                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => { setOrderToEdit(item); setIsManualModalOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar datos de orden"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar orden"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info Banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-teal-700 shrink-0" />
          <span>
            <strong>Regla activa:</strong> La fecha de OME de tu planilla de Google Sheets indica cuándo cargar. Los registros sin fecha o con fecha de hoy/futura no se habilitan para cargar.
          </span>
        </div>
        <div className="text-[11px] text-slate-400 shrink-0">
          Operador: <span className="font-semibold text-slate-700">{currentUserEmail || 'mesfede@gmail.com'}</span>
        </div>
      </div>

      {/* Modals */}
      <HigienicosSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        currentSheetUrl={config.googleSheetUrl}
        onSuccess={(res: any) => {
          const detail = [];
          if (res.added > 0) detail.push(`${res.added} añadidas`);
          if (res.updated > 0) detail.push(`${res.updated} actualizadas`);
          if ((res.deleted || 0) > 0) detail.push(`${res.deleted} eliminadas`);
          const skippedNote = (res.skipped || 0) > 0 ? ` (${res.skipped} omitidas por ya figurar en Cargadas)` : '';
          showFeedback(`Sincronización completada: ${detail.length > 0 ? detail.join(', ') : 'todos los datos al día'}.${skippedNote}`);
        }}
      />

      <HigienicosMarcarCargadoModal
        isOpen={Boolean(orderToMarkCargado)}
        onClose={() => setOrderToMarkCargado(null)}
        orden={orderToMarkCargado}
        currentUserEmail={currentUserEmail}
        onSuccess={() => {
          showFeedback('¡Orden cargada en PAMI y eliminada del listado exitosamente!');
        }}
      />

      <HigienicosManualOrderModal
        isOpen={isManualModalOpen}
        onClose={() => { setIsManualModalOpen(false); setOrderToEdit(null); }}
        orderToEdit={orderToEdit}
        onSuccess={() => {
          showFeedback(orderToEdit ? 'Orden actualizada correctamente.' : 'Nueva orden registrada exitosamente.');
        }}
      />

      <HigienicosAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        config={config}
        currentUserEmail={currentUserEmail}
        onSuccess={() => {
          showFeedback('Lista de 3 operadores autorizados actualizada.');
        }}
      />

      {/* Modal de confirmación para Vaciar Todos los Registros */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4" role="dialog" aria-modal="true">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">¿Vaciar todos los registros?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Esta acción eliminará todas las órdenes registradas en la base de datos para que puedas volver a cargar tu planilla Excel o CSV limpia desde cero. Esta acción es irreversible.
              </p>
              {ordenes.length > 0 && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                  Se eliminarán <strong>{ordenes.length} órdenes</strong> actualmente guardadas.
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                disabled={isDeletingAll}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                disabled={isDeletingAll}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isDeletingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Vaciando base de datos...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, vaciar todos los registros</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para Eliminar Una Orden */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 space-y-4" role="dialog" aria-modal="true">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">¿Eliminar esta orden?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ¿Deseas eliminar la orden OME <strong>{itemToDelete.nroOme || 'sin número'}</strong> del afiliado <strong>{itemToDelete.afiliadoNombre}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Historial de Órdenes Cargadas (Omitidas en Sincronización) */}
      {isCargadasModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden border border-slate-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Historial de Órdenes Cargadas ({cargadas.length})</h2>
                  <p className="text-xs text-slate-500">
                    Las órdenes aquí registradas se omiten automáticamente al sincronizar con Google Sheets. Puedes restaurar cualquiera a pendientes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCargadasModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cargadasSearch}
                  onChange={(e) => setCargadasSearch(e.target.value)}
                  placeholder="Buscar por apellido, beneficio o N° OME en historial..."
                  className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-slate-50/50"
                />
                {cargadasSearch && (
                  <button
                    type="button"
                    onClick={() => setCargadasSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredCargadas.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                  <History className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>No hay órdenes cargadas {cargadasSearch ? 'que coincidan con la búsqueda' : 'registradas en el historial'}.</p>
                </div>
              ) : (
                filteredCargadas.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900 uppercase">
                        {c.afiliadoNombre || 'Sin nombre'}
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>Ben: <strong>{c.afiliadoBeneficio || '-'}</strong></span>
                        {(c.fechaVencimientoOme || c.fechaEmisionOme) && (
                          <span>Vigencia OME: <strong>{formatDate(c.fechaVencimientoOme || c.fechaEmisionOme)}</strong></span>
                        )}
                        {c.nroOme && <span>N° OME: <strong>{c.nroOme}</strong></span>}
                      </div>
                      {c.cargadoPorEmail && (
                        <div className="text-[10px] text-slate-400">
                          Marcada como cargada por {c.cargadoPorEmail}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreCargada(c)}
                      disabled={restoringCargadaId === c.id}
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${restoringCargadaId === c.id ? 'animate-spin' : ''}`} />
                      <span>{restoringCargadaId === c.id ? 'Restaurando...' : 'Restaurar a pendientes'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
              {cargadas.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearCargadasHistory}
                  disabled={isClearingCargadas}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isClearingCargadas ? 'Limpiando...' : 'Limpiar todo el historial de cargadas'}</span>
                </button>
              ) : <span />}
              <button
                type="button"
                onClick={() => setIsCargadasModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
