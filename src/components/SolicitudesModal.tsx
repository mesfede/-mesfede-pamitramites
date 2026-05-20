import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, XCircle, Clock, AlertCircle, Plus, Send } from 'lucide-react';
import { Solicitud } from '../types';
import { addSolicitud, subscribeToSolicitudes, updateSolicitudStatus } from '../services/firestore';
import { User } from 'firebase/auth';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isAdmin: boolean;
}

export function SolicitudesModal({ isOpen, onClose, user, isAdmin }: Props) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form state
  const [type, setType] = useState<Solicitud['type']>('tramite');
  const [action, setAction] = useState<Solicitud['action']>('add');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin resolution state
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionMessage, setResolutionMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const unsubscribe = subscribeToSolicitudes((data) => {
      setSolicitudes(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter for non-admins (only their own requests)
  const displaySolicitudes = isAdmin ? solicitudes : solicitudes.filter(s => s.uid === user?.uid);

  const pendingSolicitudes = displaySolicitudes.filter(s => s.status === 'pending');
  const resolvedSolicitudes = displaySolicitudes.filter(s => s.status !== 'pending');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addSolicitud({
        uid: user.uid,
        userEmail: user.email || 'desconocido',
        type,
        action,
        title,
        description
      });
      setIsFormOpen(false);
      // Reset form
      setType('tramite');
      setAction('add');
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error("Error agergando solicitud:", error);
      alert("Hubo un error al enviar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (id: string, status: 'completed' | 'rejected') => {
    try {
      await updateSolicitudStatus(id, status, resolutionMessage);
      setResolvingId(null);
      setResolutionMessage('');
    } catch (error) {
      console.error("Error resolviendo solicitud:", error);
      alert("Error al guardar la resolución.");
    }
  };

  const typeLabels = {
    tramite: 'Trámite',
    prestador: 'Prestador',
    practica: 'Práctica',
    telefono: 'Teléfono',
    otro: 'Otro'
  };

  const actionLabels = {
    add: 'Agregar',
    edit: 'Modificar/Corregir',
    delete: 'Eliminar',
    other: 'Otro'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-pami-text">Solicitudes de Cambios</h2>
            <p className="text-sm text-gray-500">
              {isAdmin 
                ? "Gestión de reportes y solicitudes de usuarios"
                : "Reportar errores o solicitar nuevas incorporaciones"
              }
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          
          {!isAdmin && !isFormOpen && (
            <div className="mb-6 flex justify-end">
              <button 
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 bg-pami-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={18} />
                Nueva Solicitud
              </button>
            </div>
          )}

          {isFormOpen && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 mb-8 relative">
              <button 
                onClick={() => setIsFormOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                title="Cancelar"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-lg font-bold text-pami-text mb-4">Nueva Solicitud</h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué elemento afecta?</label>
                    <select 
                      value={type} 
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pami-blue focus:border-transparent outline-none"
                    >
                      {Object.entries(typeLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué acción se requiere?</label>
                    <select 
                      value={action} 
                      onChange={(e) => setAction(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pami-blue focus:border-transparent outline-none"
                    >
                      {Object.entries(actionLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título corto de la solicitud</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Prestador Dr. Pérez ya no atiende los jueves"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pami-blue focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción detallada</label>
                  <textarea 
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explique el detalle del cambio solicitado o el error reportado..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pami-blue focus:border-transparent outline-none resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-pami-blue text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={16} />
                        Enviar Solicitud
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando solicitudes...</div>
          ) : (
            <div className="space-y-8">
              
              {/* PENDING SECTION */}
              <div>
                <h3 className="text-lg font-bold text-pami-text mb-4 border-b border-gray-200 pb-2">
                  Pendientes ({pendingSolicitudes.length})
                </h3>
                
                {pendingSolicitudes.length === 0 ? (
                  <p className="text-sm text-gray-500 italic bg-white p-4 rounded-xl border border-gray-100 text-center">No hay solicitudes pendientes.</p>
                ) : (
                  <div className="grid gap-4">
                    {pendingSolicitudes.map(s => (
                      <div key={s.id} className="bg-white border text-left border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase tracking-wider">{typeLabels[s.type]}</span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wider">{actionLabels[s.action]}</span>
                              {isAdmin && <span className="text-xs text-gray-500 ml-2">{s.userEmail}</span>}
                            </div>
                            <h4 className="font-bold text-pami-text text-base">{s.title}</h4>
                          </div>
                          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 whitespace-nowrap shrink-0">
                            <Clock size={14} />
                            <span className="text-xs font-semibold">Pendiente</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{s.description}</p>
                        
                        <div className="mt-3 text-xs text-gray-400">
                          Enviado el: {new Date(s.createdAt).toLocaleDateString()} a las {new Date(s.createdAt).toLocaleTimeString()}
                        </div>

                        {isAdmin && resolvingId !== s.id && (
                          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                            <button 
                              onClick={() => setResolvingId(s.id!)}
                              className="text-sm text-pami-blue font-semibold hover:underline"
                            >
                              Resolver Solicitud...
                            </button>
                          </div>
                        )}

                        {isAdmin && resolvingId === s.id && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje para el usuario (Opcional)</label>
                            <textarea 
                              rows={2}
                              value={resolutionMessage}
                              onChange={(e) => setResolutionMessage(e.target.value)}
                              placeholder="Ej: Trámite actualizado correctamente..."
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pami-blue focus:border-transparent outline-none resize-none mb-3"
                            ></textarea>
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => { setResolvingId(null); setResolutionMessage(''); }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg"
                              >
                                Cancelar
                              </button>
                              <button 
                                onClick={() => handleResolve(s.id!, 'rejected')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition-colors"
                              >
                                <XCircle size={14} /> Rechazar
                              </button>
                              <button 
                                onClick={() => handleResolve(s.id!, 'completed')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                              >
                                <Check size={14} /> Marcar Realizada
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RESOLVED SECTION */}
              {resolvedSolicitudes.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-500 mb-4 border-b border-gray-200 pb-2">
                    Historial ({resolvedSolicitudes.length})
                  </h3>
                  
                  <div className="grid gap-3 opacity-80">
                    {resolvedSolicitudes.map(s => (
                      <div key={s.id} className="bg-white border text-left border-gray-200 rounded-xl p-4 shadow-sm relative">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase tracking-wider">{typeLabels[s.type]}</span>
                              <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                                s.status === 'completed' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                              )}>
                                {s.status === 'completed' ? 'REALIZADA' : 'RECHAZADA'}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-700 text-sm">{s.title}</h4>
                          </div>
                          {s.status === 'completed' ? (
                            <Check size={20} className="text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle size={20} className="text-red-500 shrink-0" />
                          )}
                        </div>
                        
                        {s.adminReturnMessage && (
                          <div className="mt-2 bg-gray-50 border-l-2 border-pami-blue p-2 rounded-r-lg text-sm text-gray-600 flex gap-2">
                            <span className="font-bold text-pami-blue">Respuesta:</span> 
                            <span>{s.adminReturnMessage}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
