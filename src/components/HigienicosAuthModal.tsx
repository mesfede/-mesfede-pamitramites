import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { HigienicosConfig } from '../types';
import { updateHigienicosConfig } from '../services/firestore';

interface HigienicosAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HigienicosConfig;
  currentUserEmail?: string;
  onSuccess: () => void;
}

export const HigienicosAuthModal: React.FC<HigienicosAuthModalProps> = ({
  isOpen,
  onClose,
  config,
  currentUserEmail,
  onSuccess
}) => {
  const [emails, setEmails] = useState<string[]>(config.authorizedEmails || ['mesfede@gmail.com']);
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newEmail.trim().toLowerCase();
    if (!clean) return;

    if (!clean.includes('@') || !clean.includes('.')) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    if (emails.includes(clean)) {
      setError('Este correo ya está en la lista autorizada');
      return;
    }

    setEmails([...emails, clean]);
    setNewEmail('');
    setError(null);
  };

  const handleRemoveEmail = (target: string) => {
    // Si es el único o el admin inicial mesfede@gmail.com, avisar
    if (emails.length <= 1) {
      setError('Debe quedar al menos un usuario autorizado en el sistema.');
      return;
    }
    setEmails(emails.filter(e => e.toLowerCase() !== target.toLowerCase()));
    setError(null);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateHigienicosConfig({
        authorizedEmails: emails
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Error saving config:', err);
      setError(err.message || 'Error al actualizar los usuarios autorizados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Usuarios Autorizados</h2>
              <p className="text-xs text-slate-500">Acceso restringido a 3 operadores designados</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Solo las personas con los siguientes correos electrónicos pueden ver y operar este módulo de Higiénicos Absorbentes.
          </p>

          {/* List of current authorized emails */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Operadores asignados ({emails.length} / 3 plazas)
            </label>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              {emails.map((email, idx) => {
                const isCurrent = currentUserEmail && email.toLowerCase() === currentUserEmail.toLowerCase();
                return (
                  <div key={idx} className="flex items-center justify-between p-3 text-xs bg-white">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-medium text-slate-900">{email}</span>
                        {isCurrent && (
                          <span className="ml-2 text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-sm font-semibold">
                            (Tu sesión)
                          </span>
                        )}
                      </div>
                    </div>
                    {emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                        title="Quitar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add email input if slots remain */}
          {emails.length < 3 ? (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-medium text-slate-700 block">
                Agregar otro operador ({3 - emails.length} vacante{3 - emails.length === 1 ? '' : 's'} disponible{3 - emails.length === 1 ? '' : 's'})
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="ejemplo@pami.org.ar"
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <button
                  type="button"
                  onClick={handleAddEmail}
                  disabled={!newEmail.trim()}
                  className="px-3 py-2 bg-indigo-700 text-white text-xs font-semibold rounded-lg hover:bg-indigo-800 disabled:opacity-50 transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-100 rounded-lg text-center text-xs text-slate-600">
              Cupo máximo de 3 usuarios alcanzado. Para agregar uno nuevo, quita uno de los anteriores.
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Permisos actualizados correctamente.</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-slate-200 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-5 py-2 bg-indigo-700 text-white text-xs font-semibold rounded-lg hover:bg-indigo-800 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};
