import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Building2, ShieldAlert } from 'lucide-react';
import { HigienicoOrden } from '../types';
import { saveHigienicoOrden } from '../services/firestore';

interface HigienicosManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: HigienicoOrden | null;
  onSuccess: () => void;
}

export const HigienicosManualOrderModal: React.FC<HigienicosManualOrderModalProps> = ({
  isOpen,
  onClose,
  orderToEdit,
  onSuccess
}) => {
  const [formData, setFormData] = useState<Partial<HigienicoOrden>>({
    afiliadoNombre: '',
    afiliadoBeneficio: '',
    afiliadoDni: '',
    hogarPami: false,
    tieneCud: false,
    cudNumero: '',
    insumoTipo: 'Pañales descartables',
    insumoTalle: 'Grande (G)',
    medicoCabecera: '',
    nroOme: '',
    fechaEmisionOme: new Date().toISOString().split('T')[0],
    fechaVencimientoOme: '',
    fechaCargaSistema: '',
    notas: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderToEdit) {
      setFormData({
        id: orderToEdit.id,
        afiliadoNombre: orderToEdit.afiliadoNombre || '',
        afiliadoBeneficio: orderToEdit.afiliadoBeneficio || '',
        afiliadoDni: orderToEdit.afiliadoDni || '',
        hogarPami: Boolean(orderToEdit.hogarPami),
        tieneCud: Boolean(orderToEdit.tieneCud),
        cudNumero: orderToEdit.cudNumero || '',
        insumoTipo: orderToEdit.insumoTipo || 'Pañales descartables',
        insumoTalle: orderToEdit.insumoTalle || 'Grande (G)',
        medicoCabecera: orderToEdit.medicoCabecera || '',
        nroOme: orderToEdit.nroOme || '',
        fechaEmisionOme: orderToEdit.fechaEmisionOme || new Date().toISOString().split('T')[0],
        fechaVencimientoOme: orderToEdit.fechaVencimientoOme || orderToEdit.fechaVencimiento || '',
        fechaCargaSistema: orderToEdit.fechaCargaSistema || '',
        notas: orderToEdit.notas || ''
      });
    } else {
      setFormData({
        afiliadoNombre: '',
        afiliadoBeneficio: '',
        afiliadoDni: '',
        hogarPami: false,
        tieneCud: false,
        cudNumero: '',
        insumoTipo: 'Pañales descartables',
        insumoTalle: 'Grande (G)',
        medicoCabecera: '',
        nroOme: '',
        fechaEmisionOme: new Date().toISOString().split('T')[0],
        fechaVencimientoOme: '',
        fechaCargaSistema: '',
        notas: ''
      });
    }
    setError(null);
  }, [orderToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.afiliadoNombre?.trim() || !formData.afiliadoBeneficio?.trim()) {
      setError('Nombre y N° de Beneficio son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await saveHigienicoOrden(formData as any);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving order:', err);
      setError(err.message || 'Error al guardar la orden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {orderToEdit ? 'Editar Orden de Higiénicos' : 'Nueva Orden de Higiénicos'}
            </h2>
            <p className="text-xs text-slate-500">
              Registro manual de orden médica electrónica (OME)
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-4">
            {/* Afiliado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombre y Apellido del Afiliado *
                </label>
                <input
                  type="text"
                  required
                  value={formData.afiliadoNombre}
                  onChange={e => setFormData({ ...formData, afiliadoNombre: e.target.value })}
                  placeholder="Ej: GÓMEZ MARÍA ELENA"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 uppercase font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  N° de Beneficio PAMI *
                </label>
                <input
                  type="text"
                  required
                  value={formData.afiliadoBeneficio}
                  onChange={e => setFormData({ ...formData, afiliadoBeneficio: e.target.value })}
                  placeholder="Ej: 150392847101"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  DNI (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.afiliadoDni}
                  onChange={e => setFormData({ ...formData, afiliadoDni: e.target.value })}
                  placeholder="Ej: 4829103"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Reglas Hogar PAMI y CUD */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-800 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hogarPami}
                    onChange={e => setFormData({ ...formData, hogarPami: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                  />
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span>Reside en Hogar PAMI / Residencia Geriátrica</span>
                </label>
                {formData.hogarPami && (
                  <span className="px-2 py-0.5 rounded-sm bg-purple-100 text-purple-700 text-[10px] font-semibold">
                    CUD Obligatorio
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-medium text-slate-800 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tieneCud}
                    onChange={e => setFormData({ ...formData, tieneCud: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span>Certificado Único de Discapacidad (CUD) Presentado</span>
                </label>

                {formData.tieneCud && (
                  <input
                    type="text"
                    value={formData.cudNumero || ''}
                    onChange={e => setFormData({ ...formData, cudNumero: e.target.value })}
                    placeholder="N° de CUD (opcional)"
                    className="px-2.5 py-1 text-xs font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                )}
              </div>

              {formData.hogarPami && !formData.tieneCud && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Atención:</strong> Al estar en Hogar PAMI, el sistema bloqueará la carga externa hasta tanto se verifique el CUD.
                  </span>
                </div>
              )}
            </div>

            {/* Prescripción Médica */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tipo de Higiénico
                </label>
                <select
                  value={formData.insumoTipo}
                  onChange={e => setFormData({ ...formData, insumoTipo: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                >
                  <option value="Pañales descartables">Pañales descartables</option>
                  <option value="Pañales Adulto Mayor">Pañales Adulto Mayor</option>
                  <option value="Apósitos descartables">Apósitos descartables</option>
                  <option value="Apósitos anatómicos">Apósitos anatómicos</option>
                  <option value="Pañales + Apósitos (Combinado)">Pañales + Apósitos (Combinado)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Talle / Medida
                </label>
                <select
                  value={formData.insumoTalle}
                  onChange={e => setFormData({ ...formData, insumoTalle: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                >
                  <option value="Mediano (M)">Mediano (M)</option>
                  <option value="Grande (G)">Grande (G)</option>
                  <option value="Extra Grande (XG)">Extra Grande (XG)</option>
                  <option value="Extra Extra Grande (XXG)">Extra Extra Grande (XXG)</option>
                  <option value="Único">Único (Apósitos)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  N° de OME (Orden Médica Electrónica)
                </label>
                <input
                  type="text"
                  value={formData.nroOme}
                  onChange={e => setFormData({ ...formData, nroOme: e.target.value })}
                  placeholder="Ej: OME-1284910"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Fecha de Emisión de la OME
                </label>
                <input
                  type="date"
                  value={formData.fechaEmisionOme}
                  onChange={e => setFormData({ ...formData, fechaEmisionOme: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Vencimiento de la OME (Habilitada para cargar a partir de esta fecha)
                </label>
                <input
                  type="date"
                  value={formData.fechaVencimientoOme || ''}
                  onChange={e => setFormData({ ...formData, fechaVencimientoOme: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <span className="text-[11px] text-amber-700 mt-1 block">
                  Indica a partir de qué fecha se podrá cargar en el sistema. Si la fecha es futura, permanecerá en espera.
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Médico de Cabecera
                </label>
                <input
                  type="text"
                  value={formData.medicoCabecera}
                  onChange={e => setFormData({ ...formData, medicoCabecera: e.target.value })}
                  placeholder="Ej: Dr. Pérez Juan Carlos"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Fecha carga previa si se desea registrar histórica */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Fecha de carga en sistema externo (opcional)
              </label>
              <input
                type="date"
                value={formData.fechaCargaSistema}
                onChange={e => setFormData({ ...formData, fechaCargaSistema: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Déjalo vacío si es una orden nueva lista para cargar. Si la completas, iniciará sus 3 meses de vigencia a partir de esa fecha.
              </span>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Observaciones
              </label>
              <textarea
                rows={2}
                value={formData.notas}
                onChange={e => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Observaciones de entrega, contacto o particularidades..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-slate-200 bg-slate-50/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSubmitting ? 'Guardando...' : 'Guardar Orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
