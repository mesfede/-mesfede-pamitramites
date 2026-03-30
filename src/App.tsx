import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Plus, 
  LogOut, 
  LogIn, 
  ChevronRight, 
  ChevronDown, 
  Info, 
  FileText, 
  MapPin, 
  Stethoscope, 
  Settings,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Paperclip,
  File,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  subscribeToTramites, 
  subscribeToPrestadores, 
  addTramite, 
  updateTramite, 
  deleteTramite,
  seedDatabase,
  uploadFile
} from './services/firestore';
import { Tramite, Prestador, CATEGORIES, CATEGORY_ICONS } from './types';
import { INITIAL_TRAMITES, INITIAL_PRESTADORES } from './initialData';
import { cn } from './lib/utils';

// --- UI Components ---

const Button = ({ 
  children, 
  variant = 'primary', 
  className, 
  isLoading,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', isLoading?: boolean }) => {
  const variants = {
    primary: 'bg-[#00875A] text-white hover:bg-[#006644]',
    secondary: 'bg-[#0052CC] text-white hover:bg-[#0041A3]',
    outline: 'border-2 border-[#00875A] text-[#00875A] hover:bg-[#E3F5EF]',
    ghost: 'text-[#6B778C] hover:bg-[#EBECF0]',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button 
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" size={18} /> : children}
    </button>
  );
};

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    className={cn(
      'w-full px-4 py-2 bg-white border border-[#EBECF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00875A] focus:border-transparent transition-all',
      className
    )}
    {...props}
  />
);

const TextArea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea 
    className={cn(
      'w-full px-4 py-2 bg-white border border-[#EBECF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00875A] focus:border-transparent transition-all min-h-[100px]',
      className
    )}
    {...props}
  />
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-[#EBECF0] flex items-center justify-between bg-[#F4F5F7]">
            <h3 className="text-xl font-semibold text-[#091E42]">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-[#EBECF0] rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'tramites' | 'prestadores' | 'admin'>('tramites');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTramite, setEditingTramite] = useState<Tramite | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ nombre: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ADMIN_EMAILS = ['mesfede@gmail.com', 'lizasomariajose@gmail.com'];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    const unsubscribeTramites = subscribeToTramites(setTramites);
    const unsubscribePrestadores = subscribeToPrestadores(setPrestadores);

    seedDatabase(INITIAL_TRAMITES, INITIAL_PRESTADORES);

    return () => {
      unsubscribeAuth();
      unsubscribeTramites();
      unsubscribePrestadores();
    };
  }, []);

  useEffect(() => {
    if (editingTramite) {
      setUploadedFiles(editingTramite.documentos || []);
    } else {
      setUploadedFiles([]);
    }
  }, [editingTramite]);

  const filteredTramites = useMemo(() => {
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const searchNorm = normalize(search);

    return tramites.filter(t => {
      const nameNorm = normalize(t.nombre);
      const descNorm = normalize(t.descripcion);
      
      const matchesSearch = nameNorm.includes(searchNorm) || descNorm.includes(searchNorm);
      const matchesCat = selectedCat === 'all' || t.categoria === selectedCat;
      return matchesSearch && matchesCat;
    });
  }, [tramites, search, selectedCat]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsSaving(true);
    try {
      const newFiles = [];
      for (let i = 0; i < files.length; i++) {
        const uploaded = await uploadFile(files[i]);
        newFiles.push(uploaded);
      }
      setUploadedFiles(prev => [...prev, ...newFiles]);
    } catch (err) {
      console.error("Error uploading files:", err);
      alert("Error al subir archivos.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTramite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get('nombre') as string,
      categoria: formData.get('categoria') as string,
      descripcion: formData.get('descripcion') as string,
      nota: formData.get('nota') as string,
      pasos: (formData.get('pasos') as string).split('\n').filter(p => p.trim() !== ''),
      fuente: formData.get('fuente') as string || 'Manual',
      documentos: uploadedFiles
    };

    try {
      if (editingTramite) {
        await updateTramite(editingTramite.id, data);
      } else {
        await addTramite(data);
      }
      setIsModalOpen(false);
      setEditingTramite(null);
      setUploadedFiles([]);
    } catch (err) {
      console.error("Error saving tramite:", err);
      alert("Error al guardar el trámite. Verifique los permisos.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de eliminar este trámite?')) {
      try {
        await deleteTramite(id);
      } catch (err) {
        console.error("Error deleting tramite:", err);
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#00875A] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans text-[#091E42]">
      {/* Header */}
      <header className="bg-[#006644] text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-[#006644] font-bold px-3 py-1 rounded-md text-sm">PAMI</div>
            <h1 className="text-lg font-semibold hidden sm:block">Guía de Trámites</h1>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm hidden md:block opacity-80">{user.displayName}</span>
                <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border-2 border-white/20" />
                <Button variant="ghost" className="text-white hover:bg-white/10" onClick={logout}>
                  <LogOut size={18} />
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="bg-white text-[#006644] border-white hover:bg-white/90" onClick={loginWithGoogle}>
                <LogIn size={18} />
                <span>Ingresar</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex border-t border-white/10">
          <button 
            onClick={() => setActiveTab('tramites')}
            className={cn(
              "px-6 py-3 text-sm font-medium transition-all border-b-2",
              activeTab === 'tramites' ? "border-white text-white" : "border-transparent text-white/60 hover:text-white"
            )}
          >
            Trámites
          </button>
          <button 
            onClick={() => setActiveTab('prestadores')}
            className={cn(
              "px-6 py-3 text-sm font-medium transition-all border-b-2",
              activeTab === 'prestadores' ? "border-white text-white" : "border-transparent text-white/60 hover:text-white"
            )}
          >
            Prestadores
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={cn(
                "px-6 py-3 text-sm font-medium transition-all border-b-2 flex items-center gap-2",
                activeTab === 'admin' ? "border-white text-white" : "border-transparent text-white/60 hover:text-white"
              )}
            >
              <Settings size={16} />
              Administrar
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'tramites' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:col-span-1 space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]" size={18} />
                <Input 
                  placeholder="Buscar trámite..." 
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#EBECF0] overflow-hidden">
                <div className="px-4 py-3 bg-[#F4F5F7] border-b border-[#EBECF0] text-xs font-bold uppercase tracking-wider text-[#6B778C]">
                  Categorías
                </div>
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => setSelectedCat('all')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between",
                      selectedCat === 'all' ? "bg-[#E3F5EF] text-[#006644] font-semibold" : "hover:bg-[#F4F5F7] text-[#42526E]"
                    )}
                  >
                    <span>📂 Todas</span>
                    <span className="text-xs opacity-60">{tramites.length}</span>
                  </button>
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCat(cat)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between",
                        selectedCat === cat ? "bg-[#E3F5EF] text-[#006644] font-semibold" : "hover:bg-[#F4F5F7] text-[#42526E]"
                      )}
                    >
                      <span className="truncate">{CATEGORY_ICONS[cat]} {cat}</span>
                      <span className="text-xs opacity-60">
                        {tramites.filter(t => t.categoria === cat).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Content */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-2xl font-serif font-bold text-[#091E42]">
                  {selectedCat === 'all' ? 'Todos los trámites' : selectedCat}
                </h2>
                <span className="text-sm text-[#6B778C]">{filteredTramites.length} trámites encontrados</span>
              </div>

              {filteredTramites.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-[#EBECF0]">
                  <Search size={48} className="mx-auto text-[#EBECF0] mb-4" />
                  <p className="text-[#6B778C]">No se encontraron trámites con estos criterios.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTramites.map(t => (
                    <motion.div 
                      layout
                      key={t.id}
                      className={cn(
                        "bg-white rounded-xl shadow-sm border border-[#EBECF0] overflow-hidden transition-all",
                        expandedId === t.id ? "ring-2 ring-[#00875A] shadow-md" : "hover:border-[#00875A]/50"
                      )}
                    >
                      <div 
                        className="p-4 flex items-center gap-4 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                      >
                        <div className="w-2 h-2 rounded-full bg-[#57C4A0]" />
                        <h3 className="flex-1 font-semibold text-[#091E42]">{t.nombre}</h3>
                        <div className="flex items-center gap-2">
                          {t.documentos && t.documentos.length > 0 && (
                            <Paperclip size={14} className="text-[#0052CC]" />
                          )}
                          {t.pasos && t.pasos.length > 0 && (
                            <span className="hidden sm:block text-[10px] font-bold uppercase tracking-wider bg-[#E3F5EF] text-[#006644] px-2 py-0.5 rounded-full">
                              Con guía
                            </span>
                          )}
                          <ChevronRight 
                            size={20} 
                            className={cn("text-[#6B778C] transition-transform", expandedId === t.id && "rotate-90 text-[#00875A]")} 
                          />
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedId === t.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-10 pb-6 space-y-4">
                              {t.nota && (
                                <div className="bg-[#FFF4E5] border-l-4 border-[#FF991F] p-3 rounded-r-lg text-sm text-[#3D2000] flex gap-3">
                                  <Info size={18} className="shrink-0 text-[#FF991F]" />
                                  <p>{t.nota}</p>
                                </div>
                              )}

                              <div className="border-l-4 border-[#57C4A0] pl-4 py-1">
                                <p className="text-sm text-[#42526E] leading-relaxed whitespace-pre-line">
                                  {t.descripcion}
                                </p>
                              </div>

                              {t.pasos && t.pasos.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#00875A]">Pasos a seguir</h4>
                                  <ul className="space-y-2">
                                    {t.pasos.map((paso, idx) => (
                                      <li key={idx} className="flex gap-3 text-sm text-[#42526E]">
                                        <span className="flex-shrink-0 w-5 h-5 bg-[#00875A] text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                                          {idx + 1}
                                        </span>
                                        <span>{paso}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {t.documentos && t.documentos.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#0052CC]">Planillas y Documentos</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {t.documentos.map((doc, idx) => (
                                      <a 
                                        key={idx} 
                                        href={doc.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-[#E6F0FF] text-[#0052CC] rounded-lg hover:bg-[#D1E3FF] transition-all group"
                                      >
                                        <File size={18} />
                                        <span className="text-sm font-medium flex-1 truncate">{doc.nombre}</span>
                                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="pt-4 flex items-center justify-between border-t border-[#EBECF0]">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B778C]">
                                  Fuente: {t.fuente || 'PAMI Oficial'}
                                </span>
                                {isAdmin && (
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="ghost" 
                                      className="p-2 h-auto" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTramite(t);
                                        setIsModalOpen(true);
                                      }}
                                    >
                                      <Edit2 size={16} />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      className="p-2 h-auto text-red-600 hover:bg-red-50" 
                                      onClick={(e) => handleDelete(t.id, e)}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'prestadores' && (
          <div className="space-y-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-serif font-bold text-[#091E42]">Cartilla de Prestadores</h2>
              <span className="text-sm text-[#6B778C]">{prestadores.length} centros registrados</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prestadores.map(p => (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-[#EBECF0] p-6 hover:shadow-md transition-all">
                  <h3 className="text-lg font-bold text-[#091E42] mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-[#0052CC]" />
                    {p.nombre}
                  </h3>
                  
                  {p.especialidades.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B778C]">Especialidades</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.especialidades.map(e => (
                          <span key={e} className="text-[11px] bg-[#E6F0FF] text-[#0052CC] px-2 py-0.5 rounded-full font-medium">
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.imagenes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B778C]">Estudios / Imágenes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.imagenes.map(i => (
                          <span key={i} className="text-[11px] bg-[#E3F5EF] text-[#006644] px-2 py-0.5 rounded-full font-medium">
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-[#091E42]">Panel de Administración</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => seedDatabase(INITIAL_TRAMITES, INITIAL_PRESTADORES)}>
                  Sincronizar Datos
                </Button>
                <Button onClick={() => { setEditingTramite(null); setIsModalOpen(true); }}>
                  <Plus size={18} />
                  <span>Nuevo Trámite</span>
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#EBECF0] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F5F7] text-[11px] font-bold uppercase tracking-widest text-[#6B778C]">
                    <th className="px-6 py-4">Trámite</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Última Modificación</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBECF0]">
                  {tramites.map(t => (
                    <tr key={t.id} className="hover:bg-[#F4F5F7]/50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-[#091E42]">{t.nombre}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-[#EBECF0] text-[#42526E] px-2 py-1 rounded-md">
                          {t.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6B778C]">
                        {t.updatedAt?.toDate().toLocaleDateString() || 'Reciente'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => { setEditingTramite(t); setIsModalOpen(true); }}
                            className="p-2 text-[#6B778C] hover:text-[#0052CC] hover:bg-[#E6F0FF] rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(t.id, e)}
                            className="p-2 text-[#6B778C] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal for Add/Edit */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTramite(null); }}
        title={editingTramite ? "Editar Trámite" : "Nuevo Trámite"}
      >
        <form onSubmit={handleSaveTramite} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#42526E]">Nombre del Trámite</label>
            <Input name="nombre" defaultValue={editingTramite?.nombre} required placeholder="Ej: Afiliación de Cónyuge" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#42526E]">Categoría</label>
              <select 
                name="categoria" 
                defaultValue={editingTramite?.categoria || CATEGORIES[0]}
                className="w-full px-4 py-2 bg-white border border-[#EBECF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00875A]"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#42526E]">Fuente</label>
              <Input name="fuente" defaultValue={editingTramite?.fuente} placeholder="Ej: Excel PAMI 2023" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#42526E]">Descripción / Procedimiento</label>
            <TextArea name="descripcion" defaultValue={editingTramite?.descripcion} required placeholder="Explique cómo se realiza el trámite..." />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#42526E]">Pasos a seguir (uno por línea)</label>
            <TextArea 
              name="pasos" 
              defaultValue={editingTramite?.pasos?.join('\n')} 
              placeholder="1. Completar formulario&#10;2. Adjuntar DNI&#10;3. Enviar a UGL..." 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#42526E]">Nota Importante (opcional)</label>
            <Input name="nota" defaultValue={editingTramite?.nota} placeholder="Ej: Solo para mayores de 75 años" />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-[#42526E] flex items-center gap-2">
              <Paperclip size={16} />
              Planillas y Documentos (PDF, Word, etc.)
            </label>
            
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#E6F0FF] text-[#0052CC] px-3 py-1.5 rounded-lg text-xs font-medium">
                  <File size={14} />
                  <span className="max-w-[150px] truncate">{file.nombre}</span>
                  <button type="button" onClick={() => removeFile(idx)} className="hover:text-red-600">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 border-2 border-dashed border-[#EBECF0] px-3 py-1.5 rounded-lg text-xs text-[#6B778C] hover:border-[#00875A] hover:text-[#00875A] transition-all"
              >
                <Plus size={14} />
                <span>Subir archivo</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#EBECF0]">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>
              <CheckCircle2 size={18} />
              <span>{editingTramite ? "Guardar Cambios" : "Crear Trámite"}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Footer */}
      <footer className="bg-white border-t border-[#EBECF0] py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="bg-[#006644] text-white inline-block px-4 py-1 rounded-full text-xs font-bold mb-4">
            UGL City Bell · 2026
          </div>
          <p className="text-sm text-[#6B778C]">
            Esta es una herramienta de consulta interna para facilitar la gestión de trámites.
          </p>
        </div>
      </footer>
    </div>
  );
}
