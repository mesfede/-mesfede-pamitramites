import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Users, 
  Calendar, 
  ArrowUpDown, 
  ExternalLink, 
  Check, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  Info,
  CheckSquare,
  Square,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  CalendarClock
} from 'lucide-react';
import Papa from 'papaparse';
import { HigienicoOrden, HigienicosConfig, DEFAULT_AUTHORIZED_HIGIENICOS_EMAILS } from '../types';
import { 
  subscribeToHigienicosOrdenes, 
  subscribeToHigienicosConfig, 
  deleteHigienicoOrden, 
  revertirCargaOrden, 
  toggleCudOrden,
  deleteAllHigienicos,
  syncHigienicosFromSheet
} from '../services/firestore';
import { 
  processHigienicosOrdenes, 
  ProcessedHigienicoOrden, 
  formatDate, 
  getDaysDifference,
  mapRowToHigienico
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
  const [config, setConfig] = useState<HigienicosConfig>({
    authorizedEmails: DEFAULT_AUTHORIZED_HIGIENICOS_EMAILS
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modales
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<HigienicoOrden | null>(null);
  const [orderToMarkCargado, setOrderToMarkCargado] = useState<HigienicoOrden | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProcessedHigienicoOrden | null>(null);
  const [itemToRevert, setItemToRevert] = useState<ProcessedHigienicoOrden | null>(null);

  // Búsqueda y Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'todos' | 'listas' | 'en_espera' | 'vigentes' | 'por_vencer' | 'bloqueadas_cud' | 'hogar_pami'>('todos');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isUpdatingSheet, setIsUpdatingSheet] = useState(false);

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

    return () => {
      unsubOrdenes();
      unsubConfig();
    };
  }, []);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleQuickUpdateFromGoogleSheet = async () => {
    const url = config.googleSheetUrl || localStorage.getItem('higienicos_last_sheet_url');
    if (!url || !url.trim()) {
      setIsSyncModalOpen(true);
      showFeedback('Configura el enlace de tu Google Sheet para actualizar con 1 clic.');
      return;
    }

    setIsUpdatingSheet(true);
    try {
      const proxyUrl = `/api/fetch-sheet?url=${encodeURIComponent(url.trim())}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'No se pudo leer la planilla de Google Sheets');
      }
      const data = await res.json();
      if (!data.csv) {
        throw new Error(data.error || 'La planilla no devolvió datos legibles');
      }

      Papa.parse(data.csv, {
        header: true,
        skipEmptyLines: 'greedy',
        dynamicTyping: false,
        complete: async (results) => {
          try {
            const rawRows = results.data as Record<string, any>[];
            const mapped: Partial<HigienicoOrden>[] = [];
            for (const raw of rawRows) {
              const item = mapRowToHigienico(raw);
              if (item) mapped.push(item);
            }

            if (mapped.length === 0) {
              showFeedback('No se detectaron filas válidas en la planilla');
              setIsUpdatingSheet(false);
              return;
            }

            const syncRes = await syncHigienicosFromSheet(mapped, url.trim());
            showFeedback(`¡Planilla actualizada! ${syncRes.total} órdenes sincronizadas.`);
          } catch (syncErr: any) {
            showFeedback('Error al guardar datos: ' + syncErr.message);
          } finally {
            setIsUpdatingSheet(false);
          }
        },
        error: (err: any) => {
          showFeedback('Error al procesar CSV: ' + err.message);
          setIsUpdatingSheet(false);
        }
      });
    } catch (err: any) {
      console.error('Error updating from sheet:', err);
      showFeedback('Error al actualizar desde Google Sheet: ' + (err.message || 'Error desconocido'));
      setIsUpdatingSheet(false);
    }
  };

  // Validación de acceso configurable por el administrador
  const isAuthorized = useMemo(() => {
    if (!currentUserEmail) return false;
    const lowerEmail = currentUserEmail.toLowerCase().trim();
    if (lowerEmail === 'mesfede@gmail.com') return true;
    
    const authorized = config.authorizedEmails || DEFAULT_AUTHORIZED_HIGIENICOS_EMAILS;
    return authorized.some(e => e.toLowerCase().trim() === lowerEmail);
  }, [currentUserEmail, config.authorizedEmails]);

  // Procesamiento de órdenes con reglas de negocio (3 meses, CUD, bloqueo por orden previa)
  const processedOrdenes = useMemo(() => {
    return processHigienicosOrdenes(ordenes);
  }, [ordenes]);

  // Métricas para tarjetas KPI
  const stats = useMemo(() => {
    let listasParaCargar = 0;
    let enEsperaVencimiento = 0;
    let vigentes = 0;
    let porVencer = 0;
    let bloqueadasCud = 0;
    let hogarPamiTotal = 0;

    for (const item of processedOrdenes) {
      if (item.hogarPami) hogarPamiTotal++;
      if (item.computedEstado === 'lista_para_cargar') listasParaCargar++;
      else if (item.computedEstado === 'en_espera_vencimiento') enEsperaVencimiento++;
      else if (item.computedEstado === 'vigente') vigentes++;
      else if (item.computedEstado === 'proxima_vencer') porVencer++;
      else if (item.computedEstado === 'bloqueada_cud') bloqueadasCud++;
    }

    return {
      total: processedOrdenes.length,
      listasParaCargar,
      enEsperaVencimiento,
      vigentes,
      porVencer,
      bloqueadasCud,
      hogarPamiTotal
    };
  }, [processedOrdenes]);

  // Filtrado reactivo por texto y pestaña con ordenamiento prioritario
  const filteredOrdenes = useMemo(() => {
    const list = processedOrdenes.filter(item => {
      // Filtro de estado
      if (activeFilter === 'listas' && item.computedEstado !== 'lista_para_cargar') return false;
      if (activeFilter === 'en_espera' && item.computedEstado !== 'en_espera_vencimiento') return false;
      if (activeFilter === 'vigentes' && item.computedEstado !== 'vigente') return false;
      if (activeFilter === 'por_vencer' && item.computedEstado !== 'proxima_vencer') return false;
      if (activeFilter === 'bloqueadas_cud' && item.computedEstado !== 'bloqueada_cud') return false;
      if (activeFilter === 'hogar_pami' && !item.hogarPami) return false;

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
        'bloqueada_cud': 3,
        'proxima_vencer': 4,
        'vigente': 5,
        'vencida': 6
      };
      const pA = priority[a.computedEstado] || 99;
      const pB = priority[b.computedEstado] || 99;
      if (pA !== pB) return pA - pB;

      // Si ambas están en espera, ordenar por la fecha más cercana
      const dateA = a.fechaVencimientoOme || a.fechaVencimiento || '';
      const dateB = b.fechaVencimientoOme || b.fechaVencimiento || '';
      return dateA.localeCompare(dateB);
    });
  }, [processedOrdenes, activeFilter, searchQuery]);

  const handleToggleCud = async (item: ProcessedHigienicoOrden) => {
    try {
      const nuevoEstado = !item.tieneCud;
      await toggleCudOrden(item.id, nuevoEstado);
      showFeedback(`CUD ${nuevoEstado ? 'verificado' : 'desmarcado'} para ${item.afiliadoNombre}`);
    } catch (err: any) {
      showFeedback('Error al modificar CUD: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleConfirmRevert = async () => {
    if (!itemToRevert) return;
    try {
      await revertirCargaOrden(itemToRevert.id);
      showFeedback(`Carga revertida para ${itemToRevert.afiliadoNombre}`);
      setItemToRevert(null);
    } catch (err: any) {
      showFeedback('Error al revertir carga: ' + (err.message || 'Error desconocido'));
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
            Seguimiento de vigencia de 3 meses, sincronización de órdenes y validación de CUD para Hogar PAMI.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botón directo de actualización de Google Sheet */}
          <button
            type="button"
            onClick={handleQuickUpdateFromGoogleSheet}
            disabled={isUpdatingSheet}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title={config.googleSheetUrl ? "Actualizar con 1 clic desde tu Google Sheet vinculado" : "Configurar y actualizar desde Google Sheet"}
          >
            <RefreshCw className={`w-4 h-4 ${isUpdatingSheet ? 'animate-spin' : ''}`} />
            <span>{isUpdatingSheet ? 'Actualizando...' : 'Actualizar Google Sheet'}</span>
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
                <span>¡Tienes órdenes listas para cargar hoy en el sistema!</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold">
                  Habilitadas hoy
                </span>
              </h2>
              <p className="text-xs text-emerald-800 mt-0.5">
                Cumplieron su fecha límite/vigencia de OME y ya pueden ingresarse en SIMAP.
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
              <strong>Sin órdenes para cargar hoy:</strong> Las <strong>{stats.enEsperaVencimiento}</strong> órdenes cargadas se encuentran pendientes porque aún no se cumplió su fecha. El sistema colocará el aviso con el número justo el día en que cada una se habilite.
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-semibold shrink-0">
            {stats.enEsperaVencimiento} en espera futura
          </span>
        </div>
      ) : null}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
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
            Habilitadas para cargar hoy
          </p>
        </div>

        {/* Card 2: En Espera por Vencimiento OME */}
        <div 
          onClick={() => setActiveFilter('en_espera')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'en_espera' 
              ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20' 
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase">En Espera Vigencia OME</span>
            <CalendarClock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{stats.enEsperaVencimiento}</div>
          <p className="text-[11px] text-amber-700 mt-1">
            Carga a partir de vigencia
          </p>
        </div>

        {/* Card 3: Vigentes */}
        <div 
          onClick={() => setActiveFilter('vigentes')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'vigentes' 
              ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20' 
              : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-blue-800 mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase">Vigentes (Activas)</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{stats.vigentes}</div>
          <p className="text-[11px] text-blue-700 mt-1">
            Cursando sus 3 meses
          </p>
        </div>

        {/* Card 4: Próximas a Vencer */}
        <div 
          onClick={() => setActiveFilter('por_vencer')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'por_vencer' 
              ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/20' 
              : 'bg-white border-slate-200 hover:border-orange-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-orange-800 mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase">Por Vencer</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{stats.porVencer}</div>
          <p className="text-[11px] text-orange-700 mt-1">
            Vencen en ≤ 15 días
          </p>
        </div>

        {/* Card 5: Bloqueadas por CUD */}
        <div 
          onClick={() => setActiveFilter('bloqueadas_cud')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'bloqueadas_cud' 
              ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20' 
              : 'bg-white border-slate-200 hover:border-rose-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-rose-800 mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase">Requieren CUD</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{stats.bloqueadasCud}</div>
          <p className="text-[11px] text-rose-700 mt-1">
            Hogar PAMI sin CUD
          </p>
        </div>

        {/* Card 6: Total */}
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
            {stats.hogarPamiTotal} en Hogar PAMI
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
              En espera Vigencia OME ({stats.enEsperaVencimiento})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('vigentes')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === 'vigentes' 
                  ? 'bg-blue-700 text-white font-semibold' 
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              Vigentes ({stats.vigentes})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('por_vencer')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === 'por_vencer' 
                  ? 'bg-amber-600 text-white font-semibold' 
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Por vencer ({stats.porVencer})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('bloqueadas_cud')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === 'bloqueadas_cud' 
                  ? 'bg-rose-700 text-white font-semibold' 
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Sin CUD ({stats.bloqueadasCud})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('hogar_pami')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === 'hogar_pami' 
                  ? 'bg-purple-700 text-white font-semibold' 
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              Hogar PAMI ({stats.hogarPamiTotal})
            </button>
          </div>
        </div>
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
                  <th className="py-3 px-4">Hogar & CUD</th>
                  <th className="py-3 px-4">Prescripción OME</th>
                  <th className="py-3 px-4">Ciclo de 3 Meses & Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrdenes.map((item) => {
                  const diasRestantes = item.diasRestantes ?? 0;
                  const isLoaded = Boolean(item.fechaCargaSistema);
                  const isBlockedByCud = item.computedEstado === 'bloqueada_cud';
                  const isBlockedByActiveOrder = Boolean(item.bloqueantePorOrdenVigente);
                  const isReadyToLoad = item.computedEstado === 'lista_para_cargar';

                  // Porcentaje transcurrido de los 90 días
                  const diasTranscurridos = isLoaded ? Math.max(0, 90 - diasRestantes) : 0;
                  const porcentajeTranscurrido = Math.min(100, Math.max(0, Math.round((diasTranscurridos / 90) * 100)));

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

                      {/* Column 2: Hogar & CUD */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1.5">
                          {item.hogarPami ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-semibold">
                              <Building2 className="w-3 h-3 text-purple-700" />
                              Hogar PAMI
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Particular</span>
                          )}

                          {/* Interactive CUD Checkbox */}
                          <div>
                            <button
                              type="button"
                              onClick={() => handleToggleCud(item)}
                              className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg border transition-all ${
                                item.tieneCud 
                                  ? 'bg-teal-50 border-teal-300 text-teal-800 hover:bg-teal-100' 
                                  : item.hogarPami 
                                    ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100' 
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                              title={item.hogarPami && !item.tieneCud ? 'Obligatorio: Haga clic para validar CUD y desbloquear' : 'Alternar CUD'}
                            >
                              {item.tieneCud ? (
                                <CheckSquare className="w-3.5 h-3.5 text-teal-700" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span>{item.tieneCud ? 'CUD Presentado' : 'Sin CUD'}</span>
                            </button>
                            {item.cudNumero && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                #{item.cudNumero}
                              </div>
                            )}
                          </div>
                        </div>
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
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          OME: {item.nroOme || '-'}
                        </div>
                        {(item.fechaVencimientoOme || (!isLoaded && item.fechaVencimiento)) && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-900 bg-amber-50/90 border border-amber-200 px-2 py-0.5 rounded-md">
                              <CalendarClock className="w-3 h-3 text-amber-700 shrink-0" />
                              Vigencia de OME: {formatDate(item.fechaVencimientoOme || item.fechaVencimiento)}
                            </span>
                          </div>
                        )}
                        {item.medicoCabecera && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5" title={item.medicoCabecera}>
                            Dr: {item.medicoCabecera}
                          </div>
                        )}
                      </td>

                      {/* Column 4: Ciclo de 3 Meses & Estado Operativo */}
                      <td className="py-3 px-4 align-top">
                        {/* Estado: Lista para cargar */}
                        {isReadyToLoad && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              Lista para cargar hoy
                            </span>
                            <p className="text-[11px] text-slate-500">
                              Fecha de vencimiento cumplida o sin orden activa. Habilitada para cargar.
                            </p>
                          </div>
                        )}

                        {/* Estado: En espera por vencimiento de OME (No disponible hasta esa fecha) */}
                        {item.computedEstado === 'en_espera_vencimiento' && !isBlockedByActiveOrder && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-semibold border border-amber-300">
                              <CalendarClock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              Habilitada a partir del {formatDate(item.fechaVencimientoOme || item.fechaVencimiento)}
                            </span>
                            <p className="text-[11px] text-amber-800 font-medium">
                              {item.motivoBloqueo || `Vencimiento OME: ${formatDate(item.fechaVencimientoOme || item.fechaVencimiento)} (en espera de fecha de carga)`}
                            </p>
                          </div>
                        )}

                        {/* Estado: Bloqueada por CUD */}
                        {isBlockedByCud && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-semibold border border-rose-200">
                              <ShieldAlert className="w-3 h-3 text-rose-700" />
                              Bloqueada: Requiere CUD
                            </span>
                            <p className="text-[11px] text-rose-600">
                              Afiliado en Hogar PAMI. Tilda "CUD Presentado" para desbloquear.
                            </p>
                          </div>
                        )}

                        {/* Estado: En espera por orden previa vigente */}
                        {isBlockedByActiveOrder && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-700" />
                              En espera por orden vigente
                            </span>
                            <p className="text-[11px] text-slate-600">
                              Habilitada a partir del <strong>{formatDate(item.bloqueantePorOrdenVigente?.fechaVencimiento)}</strong> (faltan {getDaysDifference(item.bloqueantePorOrdenVigente?.fechaVencimiento || '')} días).
                            </p>
                          </div>
                        )}

                        {/* Estado: Vigente o Próxima a Vencer (Ya cargada) */}
                        {isLoaded && (
                          <div className="space-y-1.5 min-w-[210px]">
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                item.computedEstado === 'proxima_vencer' 
                                  ? 'bg-amber-100 text-amber-800 border-amber-300' 
                                  : item.computedEstado === 'vencida'
                                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                                    : 'bg-blue-100 text-blue-800 border-blue-200'
                              }`}>
                                <Clock className="w-3 h-3" />
                                {item.computedEstado === 'proxima_vencer' 
                                  ? `Vence en ${diasRestantes} días` 
                                  : item.computedEstado === 'vencida'
                                    ? 'Ciclo cumplido (Vencida)'
                                    : `Vigente · ${diasRestantes} días rest.`}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {porcentajeTranscurrido}%
                              </span>
                            </div>

                            {/* Barra de progreso de los 90 días */}
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full transition-all ${
                                  item.computedEstado === 'proxima_vencer' 
                                    ? 'bg-amber-500' 
                                    : item.computedEstado === 'vencida'
                                      ? 'bg-slate-400'
                                      : 'bg-blue-600'
                                }`} 
                                style={{ width: `${porcentajeTranscurrido}%` }} 
                              />
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center justify-between">
                              <span>Carga: {formatDate(item.fechaCargaSistema)}</span>
                              <span className="font-medium text-slate-700">Vence: {formatDate(item.fechaVencimiento)}</span>
                            </div>

                            {item.cargadoPorEmail && (
                              <div className="text-[10px] text-slate-400">
                                Cargado por {item.cargadoPorEmail.split('@')[0]}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Column 5: Acciones */}
                      <td className="py-3 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón principal: Marcar Cargado */}
                          {!isLoaded ? (
                            <button
                              type="button"
                              onClick={() => setOrderToMarkCargado(item)}
                              disabled={!item.puedeCargarse}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-xs ${
                                item.puedeCargarse
                                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              }`}
                              title={item.motivoBloqueo || 'Marcar como cargada en PAMI y quitar de pendientes'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Cargar OM</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setItemToRevert(item)}
                              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs transition-colors border border-slate-200 cursor-pointer"
                              title="Revertir carga (reiniciar a pendiente)"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

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
            <strong>Regla de negocio activa:</strong> Las órdenes tienen una vigencia de 90 días a partir de la fecha de carga efectiva. Afiliados en Hogar PAMI exigen CUD obligatorio.
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
        onSuccess={(res) => {
          showFeedback(`Sincronización completada: ${res.added} añadidas, ${res.updated} actualizadas.`);
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

      {/* Modal de confirmación para Revertir Carga */}
      {itemToRevert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 space-y-4" role="dialog" aria-modal="true">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">¿Revertir estado de carga?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                La orden de <strong>{itemToRevert.afiliadoNombre}</strong> volverá a figurar como <em>pendiente de carga</em> y su ciclo de 90 días se reiniciará.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToRevert(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRevert}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Revertir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
