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
  Phone, 
  Mail, 
  Globe,
  MessageSquare,
  Clock,
  AlertCircle,
  ExternalLink,
  Printer,
  FileSpreadsheet,
  FileImage
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
  addPrestador,
  updatePrestador,
  cleanupPrestadores,
  cleanupTramites,
  seedDatabase,
  uploadFile,
  testConnection
} from './services/firestore';
import { Tramite, Prestador, CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from './types';
import { INITIAL_TRAMITES, INITIAL_PRESTADORES } from './initialData';
import { cn } from './lib/utils';
import { PamiLogo } from './components/PamiLogo';

const getFileIcon = (nombre: string) => {
  const lowerName = nombre.toLowerCase();
  if (lowerName.endsWith('.pdf')) return <FileText size={18} className="text-red-500" />;
  if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return <FileText size={18} className="text-blue-500" />;
  if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return <FileSpreadsheet size={18} className="text-green-500" />;
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png')) return <FileImage size={18} className="text-purple-500" />;
  return <File size={18} className="text-gray-500" />;
};

// --- UI Components ---

const Button = ({ 
  children, 
  variant = 'primary', 
  className, 
  isLoading,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', isLoading?: boolean }) => {
  const variants = {
    primary: 'bg-pami-blue text-white hover:bg-pami-blue/90',
    secondary: 'bg-pami-cyan text-white hover:bg-pami-cyan/90',
    outline: 'border-2 border-pami-blue text-pami-blue hover:bg-pami-blue/5',
    ghost: 'text-pami-muted hover:bg-gray-100',
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
      'w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pami-cyan focus:border-transparent transition-all',
      className
    )}
    {...props}
  />
);

const TextArea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea 
    className={cn(
      'w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pami-cyan focus:border-transparent transition-all min-h-[100px]',
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
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="text-xl font-semibold text-pami-text">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
  const [prestadorSearch, setPrestadorSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'tramites' | 'prestadores' | 'admin'>('tramites');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrestadorModalOpen, setIsPrestadorModalOpen] = useState(false);
  const [editingTramite, setEditingTramite] = useState<Tramite | null>(null);
  const [editingPrestador, setEditingPrestador] = useState<Prestador | null>(null);
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

    testConnection();

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

  const filteredPrestadores = useMemo(() => {
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const searchNorm = normalize(prestadorSearch);

    return [...prestadores]
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .filter(p => {
        const nameNorm = normalize(p.nombre);
        const specsNorm = (p.especialidades || []).map(s => normalize(s)).join(' ');
        const practsNorm = (p.practicas || []).map(pr => normalize(pr)).join(' ');
        const notasNorm = normalize(p.notas || '');
        
        return nameNorm.includes(searchNorm) || 
               specsNorm.includes(searchNorm) || 
               practsNorm.includes(searchNorm) ||
               notasNorm.includes(searchNorm);
      });
  }, [prestadores, prestadorSearch]);

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

  const handleSavePrestador = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get('nombre') as string,
      especialidades: (formData.get('especialidades') as string).split('\n').filter(p => p.trim() !== ''),
      practicas: (formData.get('practicas') as string).split('\n').filter(p => p.trim() !== ''),
      notas: formData.get('notas') as string,
      telefono: formData.get('telefono') as string,
      whatsapp: formData.get('whatsapp') as string,
      email: formData.get('email') as string,
      direccion: formData.get('direccion') as string,
      localidad: formData.get('localidad') as string,
    };

    try {
      if (editingPrestador) {
        await updatePrestador(editingPrestador.id, data);
      } else {
        await addPrestador(data);
      }
      setIsPrestadorModalOpen(false);
      setEditingPrestador(null);
    } catch (err) {
      console.error("Error saving prestador:", err);
      alert("Error al guardar los cambios del prestador.");
    } finally {
      setIsSaving(false);
    }
  };

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState("");
  const [adminMessage, setAdminMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleSeed = async () => {
    setIsSaving(true);
    setAdminMessage(null);
    try {
      const result = await seedDatabase(INITIAL_TRAMITES, INITIAL_PRESTADORES);
      setAdminMessage({ 
        text: `Sincronización completada. Se agregaron ${result.addedTramites} trámites y ${result.addedPrestadores} prestadores nuevos.`,
        type: 'success'
      });
    } catch (err) {
      console.error("Error seeding database:", err);
      setAdminMessage({ text: "Error al sincronizar datos.", type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCleanup = async () => {
    setIsSaving(true);
    setAdminMessage(null);
    try {
      const deleted = await cleanupPrestadores();
      setAdminMessage({ text: `Se eliminaron ${deleted} prestadores duplicados.`, type: 'success' });
    } catch (err) {
      console.error("Error cleaning up duplicates:", err);
      setAdminMessage({ text: "Error al limpiar duplicados.", type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCleanupTramites = async () => {
    setIsSaving(true);
    setAdminMessage(null);
    try {
      const deleted = await cleanupTramites();
      setAdminMessage({ text: `Se eliminaron ${deleted} trámites duplicados.`, type: 'success' });
    } catch (err) {
      console.error("Error cleaning up tramites duplicates:", err);
      setAdminMessage({ text: "Error al limpiar trámites duplicados.", type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pami-bg">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-pami-blue border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pami-bg font-sans text-pami-text">
      {/* Header */}
      <header className="bg-pami-blue text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PamiLogo className="h-8 text-white" />
            <div className="w-px h-6 bg-white/30 mx-2 hidden sm:block"></div>
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
              <Button variant="outline" className="bg-white text-pami-blue border-white hover:bg-white/90" onClick={loginWithGoogle}>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pami-muted" size={18} />
                <Input 
                  placeholder="Buscar trámite..." 
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-4 bg-white border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-pami-text">Categorías</h2>
                </div>
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => setSelectedCat('all')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between",
                      selectedCat === 'all' ? "bg-pami-blue/10 text-pami-blue font-semibold" : "hover:bg-gray-50 text-pami-text"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-2 h-2 rounded-full shrink-0 bg-gray-300" />
                      <span>📂 Todas</span>
                    </div>
                    <span className="text-xs opacity-60 shrink-0 ml-2">{tramites.length}</span>
                  </button>
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCat(cat)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between",
                        selectedCat === cat ? "bg-pami-blue/10 text-pami-blue font-semibold" : "hover:bg-gray-50 text-pami-text"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={cn("w-2 h-2 rounded-full shrink-0", CATEGORY_COLORS[cat] ? CATEGORY_COLORS[cat].split(' ')[1].replace('text-', 'bg-') : "bg-gray-200")} />
                        <span className="truncate">{CATEGORY_ICONS[cat]} {cat}</span>
                      </div>
                      <span className="text-xs opacity-60 shrink-0 ml-2">
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
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-semibold text-pami-text">
                    {selectedCat === 'all' ? 'Todos los trámites' : selectedCat}
                  </h2>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Button 
                        className="text-xs py-1 h-auto"
                        onClick={() => { setEditingTramite(null); setIsModalOpen(true); }}
                      >
                        <Plus size={14} className="mr-1" />
                        Nuevo Trámite
                      </Button>
                    </div>
                  )}
                </div>
                <span className="text-sm text-pami-muted">{filteredTramites.length} trámites encontrados</span>
              </div>

              {filteredTramites.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <Search size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-pami-muted">No se encontraron trámites con estos criterios.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTramites.map(t => (
                    <motion.div 
                      layout
                      key={t.id}
                      className={cn(
                        "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all",
                        expandedId === t.id ? "ring-2 ring-pami-blue shadow-md" : "hover:border-pami-blue/50"
                      )}
                    >
                      <div 
                        className="p-4 flex items-center gap-4 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                      >
                        <div className={cn("w-2 h-2 rounded-full shrink-0 hidden sm:block", CATEGORY_COLORS[t.categoria] ? CATEGORY_COLORS[t.categoria].split(' ')[1].replace('text-', 'bg-') : "bg-pami-cyan")} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-pami-text uppercase truncate">{t.nombre}</h3>
                          {selectedCat === 'all' && (
                            <span className={cn(
                              "inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                              CATEGORY_COLORS[t.categoria] || "bg-gray-100 text-gray-800"
                            )}>
                              {t.categoria}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {t.documentos && t.documentos.length > 0 && (
                            <Paperclip size={14} className="text-pami-blue" />
                          )}
                          {t.pasos && t.pasos.length > 0 && (
                            <span className="hidden sm:block text-[10px] font-bold uppercase tracking-wider bg-pami-blue/10 text-pami-blue px-2 py-0.5 rounded-full">
                              Con guía
                            </span>
                          )}
                          <ChevronRight 
                            size={20} 
                            className={cn("text-pami-muted transition-transform", expandedId === t.id && "rotate-90 text-pami-blue")} 
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
                                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg text-sm text-amber-900 flex gap-3">
                                  <Info size={18} className="shrink-0 text-amber-500" />
                                  <p>{t.nota}</p>
                                </div>
                              )}

                              <div className="border-l-4 border-pami-cyan pl-4 py-1">
                                <p className="text-sm text-pami-muted leading-relaxed whitespace-pre-line">
                                  {t.descripcion}
                                </p>
                              </div>

                              {t.pasos && t.pasos.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-pami-cyan">Pasos a seguir</h4>
                                  <ul className="space-y-2">
                                    {t.pasos.map((paso, idx) => (
                                      <li key={idx} className="flex gap-3 text-sm text-pami-text">
                                        <span className="flex-shrink-0 w-5 h-5 bg-pami-blue/10 text-pami-blue rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
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
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-pami-blue">Planillas y Documentos</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {t.documentos.map((doc, idx) => (
                                      <div 
                                        key={idx} 
                                        className="flex items-center gap-3 p-3 bg-pami-blue/5 rounded-lg hover:bg-pami-blue/10 transition-all group"
                                      >
                                        {getFileIcon(doc.nombre)}
                                        <span className="text-sm font-medium flex-1 truncate text-pami-blue">{doc.nombre}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <a 
                                            href={doc.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-1.5 hover:bg-white rounded-md text-pami-blue shadow-sm transition-colors"
                                            title="Ver / Descargar"
                                          >
                                            <ExternalLink size={16} />
                                          </a>
                                          <button 
                                            onClick={() => {
                                              const printWindow = window.open(doc.url, '_blank');
                                              // Note: Cross-origin restrictions might prevent auto-printing,
                                              // but opening it allows the user to use the browser's native print.
                                              if (printWindow && doc.nombre.toLowerCase().endsWith('.pdf')) {
                                                printWindow.onload = () => {
                                                  try { printWindow.print(); } catch (e) { /* Ignore cross-origin errors */ }
                                                };
                                              }
                                            }}
                                            className="p-1.5 hover:bg-white rounded-md text-pami-blue shadow-sm transition-colors"
                                            title="Imprimir"
                                          >
                                            <Printer size={16} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-pami-muted">
                                  Fuente: {t.fuente || 'PAMI Oficial'}
                                </span>
                                {isAdmin && (
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="ghost" 
                                      className="p-2 h-auto text-pami-blue hover:bg-pami-blue/5" 
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-pami-text">Cartilla de Prestadores</h2>
                  <p className="text-sm text-pami-muted">{filteredPrestadores.length} centros encontrados</p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <Button 
                      className="text-xs py-1 h-auto"
                      onClick={() => { setEditingPrestador(null); setIsPrestadorModalOpen(true); }}
                    >
                      <Plus size={14} className="mr-1" />
                      Nuevo Prestador
                    </Button>
                  </div>
                )}
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pami-muted" size={18} />
                <Input 
                  placeholder="Buscar por nombre, especialidad o práctica..." 
                  className="pl-10"
                  value={prestadorSearch}
                  onChange={(e) => setPrestadorSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrestadores.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <Search size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-pami-muted">No se encontraron prestadores con estos criterios.</p>
                </div>
              ) : (
                filteredPrestadores.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-pami-text flex items-center gap-2">
                      <MapPin size={18} className="text-pami-blue" />
                      {p.nombre}
                    </h3>
                    {isAdmin && (
                      <button 
                        onClick={() => { setEditingPrestador(p); setIsPrestadorModalOpen(true); }}
                        className="p-1.5 text-pami-muted hover:text-pami-blue hover:bg-pami-blue/5 rounded-lg transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    {(p.direccion || p.localidad) && (
                      <div className="flex items-start gap-2 text-sm text-pami-muted">
                        <Globe size={16} className="shrink-0 mt-0.5 opacity-60" />
                        <span>{p.direccion}{p.localidad ? `, ${p.localidad}` : ''}</span>
                      </div>
                    )}

                    {(p.telefono || p.whatsapp) && (
                      <div className="flex flex-col gap-2">
                        {p.telefono && (
                          <div className="flex items-center gap-2 text-sm text-pami-muted">
                            <Phone size={16} className="shrink-0 opacity-60" />
                            <span>{p.telefono}</span>
                          </div>
                        )}
                        {p.whatsapp && (
                          <div className="flex items-center gap-2 text-sm text-pami-cyan">
                            <MessageSquare size={16} className="shrink-0 opacity-60" />
                            <span>{p.whatsapp}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {p.email && (
                      <div className="flex items-center gap-2 text-sm text-pami-muted">
                        <Mail size={16} className="shrink-0 opacity-60" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    )}

                    {p.especialidades && p.especialidades.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-pami-muted">Especialidades</p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.especialidades.map(e => (
                            <span key={e} className="text-[10px] bg-pami-blue/5 text-pami-blue px-2 py-0.5 rounded-full font-medium">
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {p.practicas && p.practicas.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-pami-cyan">Prácticas Específicas</p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.practicas.map(pr => (
                            <span key={pr} className="text-[10px] bg-pami-cyan/5 text-pami-cyan px-2 py-0.5 rounded-full font-medium">
                              {pr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {p.notas && (
                      <div className="bg-gray-50 p-3 rounded-lg text-xs text-pami-muted flex gap-2">
                        <AlertCircle size={14} className="shrink-0 text-pami-muted" />
                        <p>{p.notas}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-pami-text">Panel de Administración</h2>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-pami-muted px-2 py-1 flex items-center">Prestadores:</span>
                  <Button variant="outline" className="text-xs py-1 h-auto" onClick={handleCleanup} isLoading={isSaving}>
                    Limpiar
                  </Button>
                </div>
                
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-pami-muted px-2 py-1 flex items-center">Trámites:</span>
                  <Button variant="outline" className="text-xs py-1 h-auto" onClick={handleCleanupTramites} isLoading={isSaving}>
                    Limpiar
                  </Button>
                </div>

                <Button variant="outline" onClick={handleSeed} isLoading={isSaving}>
                  Sincronizar Datos
                </Button>
              </div>
            </div>

            {adminMessage && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                adminMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {adminMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <p className="text-sm font-medium">{adminMessage.text}</p>
                <button onClick={() => setAdminMessage(null)} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-bold uppercase tracking-widest text-pami-muted">
                    <th className="px-6 py-4">Trámite</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Última Modificación</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tramites.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-pami-text uppercase">{t.nombre}</td>
                      <td className="px-6 py-4">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md", CATEGORY_COLORS[t.categoria] || "bg-gray-100 text-pami-muted")}>
                          {t.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-pami-muted">
                        {t.updatedAt?.toDate().toLocaleDateString() || 'Reciente'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => { setEditingTramite(t); setIsModalOpen(true); }}
                            className="p-2 text-pami-muted hover:text-pami-blue hover:bg-pami-blue/5 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(t.id, e)}
                            className="p-2 text-pami-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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

      {/* Modal for Add/Edit Tramite */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTramite(null); }}
        title={editingTramite ? "Editar Trámite" : "Nuevo Trámite"}
      >
        <form onSubmit={handleSaveTramite} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Nombre del Trámite</label>
            <Input name="nombre" defaultValue={editingTramite?.nombre} required placeholder="Ej: Afiliación de Cónyuge" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Categoría</label>
              <select 
                name="categoria" 
                defaultValue={editingTramite?.categoria || CATEGORIES[0]}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pami-cyan"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Fuente</label>
              <Input name="fuente" defaultValue={editingTramite?.fuente} placeholder="Ej: Excel PAMI 2023" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Descripción / Procedimiento</label>
            <TextArea name="descripcion" defaultValue={editingTramite?.descripcion} required placeholder="Explique cómo se realiza el trámite..." />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Pasos a seguir (uno por línea)</label>
            <TextArea 
              name="pasos" 
              defaultValue={editingTramite?.pasos?.join('\n')} 
              placeholder="1. Completar formulario&#10;2. Adjuntar DNI&#10;3. Enviar a UGL..." 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Nota Importante (opcional)</label>
            <Input name="nota" defaultValue={editingTramite?.nota} placeholder="Ej: Solo para mayores de 75 años" />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-pami-muted flex items-center gap-2">
              <Paperclip size={16} />
              Planillas y Documentos (PDF, Word, etc.)
            </label>
            
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-pami-blue/5 text-pami-blue px-3 py-1.5 rounded-lg text-xs font-medium">
                  {getFileIcon(file.nombre)}
                  <span className="max-w-[150px] truncate">{file.nombre}</span>
                  <button type="button" onClick={() => removeFile(idx)} className="hover:text-red-600">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 border-2 border-dashed border-gray-200 px-3 py-1.5 rounded-lg text-xs text-pami-muted hover:border-pami-blue hover:text-pami-blue transition-all"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>
              <CheckCircle2 size={18} />
              <span>{editingTramite ? "Guardar Cambios" : "Crear Trámite"}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmar Acción"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-lg text-amber-800">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="font-medium">{confirmMessage}</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmAction} isLoading={isSaving}>
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal for Edit Prestador */}
      <Modal 
        isOpen={isPrestadorModalOpen} 
        onClose={() => { setIsPrestadorModalOpen(false); setEditingPrestador(null); }}
        title={editingPrestador ? `Editar Prestador: ${editingPrestador.nombre}` : "Nuevo Prestador"}
      >
        <form onSubmit={handleSavePrestador} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Nombre del Prestador</label>
            <Input name="nombre" defaultValue={editingPrestador?.nombre} required placeholder="Ej: Dr. Juan Pérez o Clínica San Miguel" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Especialidades (una por línea)</label>
            <TextArea 
              name="especialidades" 
              defaultValue={editingPrestador?.especialidades?.join('\n')} 
              required
              placeholder="Ej: CARDIOLOGIA&#10;CLINICA MEDICA..." 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Dirección</label>
              <Input name="direccion" defaultValue={editingPrestador?.direccion} placeholder="Ej: Calle 123" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Localidad</label>
              <Input name="localidad" defaultValue={editingPrestador?.localidad} placeholder="Ej: La Plata" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Teléfono</label>
              <Input name="telefono" defaultValue={editingPrestador?.telefono} placeholder="Ej: 0221-483..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">WhatsApp</label>
              <Input name="whatsapp" defaultValue={editingPrestador?.whatsapp} placeholder="Ej: 11-6674..." />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Email</label>
            <Input name="email" type="email" defaultValue={editingPrestador?.email} placeholder="Ej: contacto@clinica.com" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Prácticas Específicas (una por línea)</label>
            <TextArea 
              name="practicas" 
              defaultValue={editingPrestador?.practicas?.join('\n')} 
              placeholder="Ej: VIDEOCOLONOSCOPIA VIRTUAL&#10;HISTEROSCOPIA..." 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Notas Adicionales</label>
            <TextArea name="notas" defaultValue={editingPrestador?.notas} placeholder="Horarios, requisitos especiales, etc." />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsPrestadorModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>
              <CheckCircle2 size={18} />
              <span>Guardar Cambios</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <PamiLogo className="h-8 text-pami-blue" />
          </div>
          <div className="bg-pami-blue text-white inline-block px-4 py-1 rounded-full text-xs font-bold mb-4">
            UGL City Bell · 2026
          </div>
          <p className="text-sm text-pami-muted">
            Esta es una herramienta de consulta interna para facilitar la gestión de trámites.
          </p>
        </div>
      </footer>
    </div>
  );
}
