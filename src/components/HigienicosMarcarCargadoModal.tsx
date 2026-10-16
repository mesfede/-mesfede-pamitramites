import React, { useState } from 'react';
import { X, Calendar, CheckCircle2, Clock, ShieldCheck, AlertCircle, Trash2 } from 'lucide-react';
import { HigienicoOrden } from '../types';
import { formatDate } from '../utils/higienicosUtils';
import { marcarOrdenCargadaYEliminar } from '../services/firestore';

interface HigienicosMarcarCargadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  orden: HigienicoOrden | null;
  currentUserEmail?: string;
  onSuccess: () => void;
}

export const HigienicosMarcarCargadoModal: React.FC<HigienicosMarcarCargadoModalProps> = ({
  isOpen,
  onClose,
  orden,
  currentUserEmail,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !orden) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await marcarOrdenCargadaYEliminar(orden, currentUserEmail);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error marking loaded and removing:', err);
      setError(err.message || 'Error al procesar la carga de la orden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-emerald-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Confirmar Carga en PAMI</h2>
              <p className="text-xs text-slate-500">Marcar como cargada y eliminar de pendientes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Affiliate summary card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 uppercase">{orden.afiliadoNombre}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Beneficio: {orden.afiliadoBeneficio}</p>
                </div>
                {orden.hogarPami && (
                  <span className="px-2 py-0.5 rounded-sm bg-purple-100 text-purple-700 text-[10px] font-semibold">
                    Hogar PAMI
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                <div>
                  <span className="text-slate-500">Insumo:</span>{' '}
                  <span className="font-medium text-slate-800">{orden.insumoTipo} {orden.insumoTalle ? `(${orden.insumoTalle})` : ''}</span>
                </div>
                <div>
                  <span className="text-slate-500">N° OME:</span>{' '}
                  <span className="font-mono font-medium text-slate-800">{orden.nroOme || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Fecha OME:</span>{' '}
                  <span className="font-medium text-slate-800">{formatDate(orden.fechaEmisionOme)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Médico:</span>{' '}
                  <span className="font-medium text-slate-800 truncate block">{orden.medicoCabecera || '-'}</span>
                </div>
              </div>
            </div>

            {/* Informative banner about elimination */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Finalización de orden en el sistema</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Al confirmar que cargaste esta OME en el sistema de PAMI / SIMAP, la orden <strong>se eliminará automáticamente de la lista de registros</strong> para mantener despejada la bandeja con únicamente las órdenes pendientes de fecha.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-slate-200 bg-slate-50/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSubmitting ? 'Eliminando de pendientes...' : 'Confirmar Carga y Quitar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
