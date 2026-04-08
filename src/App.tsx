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
  FileImage,
  ClipboardList,
  Ear,
  Microscope,
  FolderOpen,
  Accessibility,
  Hospital,
  Activity,
  Pill,
  Apple,
  Syringe,
  Banknote,
  Files,
  Brain,
  Eye,
  LayoutGrid,
  Wind,
  BookOpen,
  Truck,
  Footprints,
  Ambulance,
  ArrowRight,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { generateFullTramitePdf } from './lib/pdfUtils';
import { 
  subscribeToTramites, 
  subscribeToPrestadores, 
  subscribeToFolletos,
  addTramite, 
  updateTramite, 
  deleteTramite,
  addPrestador,
  updatePrestador,
  deletePrestador,
  addFolleto,
  deleteFolleto,
  cleanupPrestadores,
  cleanupTramites,
  seedDatabase,
  uploadFile,
  testConnection
} from './services/firestore';
import { Tramite, Prestador, PracticaOME, Folleto, CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_LIGHT_COLORS } from './types';
import { INITIAL_TRAMITES, INITIAL_PRESTADORES, INITIAL_FOLLETOS } from './initialData';
import { PRACTICAS_OME } from './data/practicasOME';
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

const getCategoryIcon = (cat: string, size: number = 20) => {
  switch (cat) {
    case 'Afiliaciones': return <ClipboardList size={size} />;
    case 'Audífonos e implantes auditivos': return <Ear size={size} />;
    case 'Consultas con especialistas': return <Stethoscope size={size} />;
    case 'Estudios diagnósticos e imágenes': return <Microscope size={size} />;
    case 'Expediente GDE': return <FolderOpen size={size} />;
    case 'Insumos y ayudas técnicas': return <Accessibility size={size} />;
    case 'Internación y cuidados especiales': return <Hospital size={size} />;
    case 'Kinesiología y rehabilitación': return <Activity size={size} />;
    case 'Medicamentos especiales': return <Pill size={size} />;
    case 'Nutrición': return <Apple size={size} />;
    case 'Óptica y oftalmología': return <Eye size={size} />;
    case 'Oxigenoterapia': return <Wind size={size} />;
    case 'Prácticas quirúrgicas y de alta complejidad': return <Syringe size={size} />;
    case 'Prótesis': return <Footprints size={size} />;
    case 'Reintegros': return <Banknote size={size} />;
    case 'Salud mental': return <Brain size={size} />;
    case 'Trámites administrativos': return <Files size={size} />;
    case 'Traslados': return <Ambulance size={size} />;
    case 'Sociales': return <Users size={size} />;
    case 'all': return <LayoutGrid size={size} />;
    default: return <FileText size={size} />;
  }
};

const getCategoryColor = (cat: string, isSelected: boolean) => {
  if (cat === 'all') return isSelected ? "text-pami-blue" : "text-pami-muted";
  
  const colorClass = CATEGORY_COLORS[cat];
  if (!colorClass) return isSelected ? "text-pami-blue" : "text-pami-muted";
  
  // Retornamos solo la clase de texto (ej. text-blue-600)
  return colorClass.split(' ').find(c => c.startsWith('text-')) || "text-pami-blue";
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
  const [folletos, setFolletos] = useState<Folleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [prestadorSearch, setPrestadorSearch] = useState('');
  const [folletoSearch, setFolletoSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'tramites' | 'prestadores' | 'practicas' | 'folletos' | 'admin'>('tramites');
  const [adminSubTab, setAdminSubTab] = useState<'tramites' | 'prestadores' | 'folletos'>('tramites');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletePrestadorModalOpen, setIsDeletePrestadorModalOpen] = useState(false);
  const [isDeleteFolletoModalOpen, setIsDeleteFolletoModalOpen] = useState(false);
  const [isPrestadorModalOpen, setIsPrestadorModalOpen] = useState(false);
  const [isFolletoModalOpen, setIsFolletoModalOpen] = useState(false);
  const [editingTramite, setEditingTramite] = useState<Tramite | null>(null);
  const [tramiteToDelete, setTramiteToDelete] = useState<Tramite | null>(null);
  const [prestadorToDelete, setPrestadorToDelete] = useState<Prestador | null>(null);
  const [folletoToDelete, setFolletoToDelete] = useState<Folleto | null>(null);
  const [editingPrestador, setEditingPrestador] = useState<Prestador | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrintingFull, setIsPrintingFull] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ nombre: string; url: string }[]>([]);
  const [manualFileName, setManualFileName] = useState('');
  const [manualFileUrl, setManualFileUrl] = useState('');
  const [selectedPrestadoresIds, setSelectedPrestadoresIds] = useState<string[]>([]);
  const [practicaSearch, setPracticaSearch] = useState('');
  const [aiSearch, setAiSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ADMIN_EMAILS = ['mesfede@gmail.com', 'lizasomariajose@gmail.com'];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGoogleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearch.trim()) return;
    
    const query = encodeURIComponent(aiSearch);
    const url = `https://www.google.com/search?q=${query}`;
    
    // Configuramos la ventana flotante (popup)
    const width = 800;
    const height = 600;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    // Intentamos abrir la ventana flotante
    const popup = window.open(
      url, 
      'GoogleSearch', 
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=no,location=no,toolbar=no,menubar=no`
    );

    // Si el navegador bloquea el popup, abrimos en pestaña normal como respaldo
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.open(url, '_blank');
    }
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Login error:", error);
      let message = "Error al iniciar sesión. Por favor, intenta de nuevo.";
      if (error.code === 'auth/popup-blocked') {
        message = "El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = "Cerraste la ventana de inicio de sesión antes de completar el proceso.";
      } else if (error.code === 'auth/network-request-failed') {
        message = "Error de red. Verifica tu conexión a internet.";
      } else if (error.code === 'auth/internal-error') {
        message = "Error interno de Firebase. Por favor, intenta más tarde.";
      }
      setLoginError(message);
      setTimeout(() => setLoginError(null), 5000);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    const unsubscribeTramites = subscribeToTramites(setTramites);
    const unsubscribePrestadores = subscribeToPrestadores(setPrestadores);
    const unsubscribeFolletos = subscribeToFolletos(setFolletos);

    testConnection();

    return () => {
      unsubscribeAuth();
      unsubscribeTramites();
      unsubscribePrestadores();
      unsubscribeFolletos();
    };
  }, []);

  // Auto-migrate Expedientes and Reintegros if they are still in the old category
  useEffect(() => {
    const migrateCategories = async () => {
      // 1. Migrate "Afiliaciones y expedientes" to "Afiliaciones"
      const oldAfiliaciones = tramites.filter(t => t.categoria === 'Afiliaciones y expedientes');
      for (const t of oldAfiliaciones) {
        try {
          await updateTramite(t.id, { categoria: 'Afiliaciones' });
        } catch (e) {
          console.error('Error migrating Afiliaciones:', e);
        }
      }

      // 2. Migrate "Expedientes" and "Reintegros" if they are in the wrong place
      const expedientesToFix = tramites.filter(t => 
        (t.nombre === 'Expedientes' || t.nombre === 'Reintegros') && 
        (t.categoria === 'Afiliaciones' || t.categoria === 'Afiliaciones y expedientes')
      );
      
      for (const t of expedientesToFix) {
        const newCategory = t.nombre === 'Expedientes' ? 'Expediente GDE' : 'Reintegros';
        try {
          await updateTramite(t.id, { categoria: newCategory });
        } catch (e) {
          console.error('Error migrating category:', e);
        }
      }

      // 3. Migrate Oxygen related trámites to "Oxigenoterapia"
      const oxygenToFix = tramites.filter(t => 
        t.nombre.toLowerCase().includes('oxigeno') && 
        t.categoria !== 'Oxigenoterapia'
      );

      for (const t of oxygenToFix) {
        try {
          await updateTramite(t.id, { categoria: 'Oxigenoterapia' });
        } catch (e) {
          console.error('Error migrating Oxygen:', e);
        }
      }
    };

    if (isAdmin && tramites.length > 0) {
      migrateCategories();
    }
  }, [tramites, isAdmin]);

  useEffect(() => {
    if (editingTramite) {
      setUploadedFiles(editingTramite.documentos || []);
      setSelectedPrestadoresIds(editingTramite.prestadoresIds || []);
    } else {
      setUploadedFiles([]);
      setSelectedPrestadoresIds([]);
    }
  }, [editingTramite]);

  const filteredTramites = useMemo(() => {
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const searchNorm = normalize(search.trim());

    const filtered = tramites.filter(t => {
      const nameNorm = normalize(t.nombre || "");
      const descNorm = normalize(t.descripcion || "");
      const catNorm = normalize(t.categoria || "");
      
      const matchesSearch = nameNorm.includes(searchNorm) || 
                           descNorm.includes(searchNorm) || 
                           catNorm.includes(searchNorm);
      
      // Si hay búsqueda, ignoramos el filtro de categoría para que sea global
      const matchesCat = searchNorm !== "" || selectedCat === 'all' || t.categoria === selectedCat;
      return matchesSearch && matchesCat;
    });

    if (searchNorm === "") {
      return filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return filtered.sort((a, b) => {
      const nameA = normalize(a.nombre || "");
      const nameB = normalize(b.nombre || "");
      const descA = normalize(a.descripcion || "");
      const descB = normalize(b.descripcion || "");
      
      const getScore = (name: string, desc: string) => {
        if (name === searchNorm) return 100;
        if (name.startsWith(searchNorm + " ")) return 90;
        if (name.startsWith(searchNorm)) return 80;
        if (name.includes(" " + searchNorm + " ")) return 70;
        if (name.includes(searchNorm)) return 60;
        if (desc.includes(searchNorm)) return 40;
        return 0;
      };

      const scoreA = getScore(nameA, descA);
      const scoreB = getScore(nameB, descB);

      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Descending order
      }
      return nameA.localeCompare(nameB); // Alphabetical fallback
    });
  }, [tramites, search, selectedCat]);

  const allSpecialties = useMemo(() => {
    const specs = new Set<string>();
    prestadores.forEach(p => {
      (p.especialidades || []).forEach(s => specs.add(s.trim().toUpperCase()));
      (p.practicas || []).forEach(pr => specs.add(pr.trim().toUpperCase()));
    });
    return Array.from(specs).sort();
  }, [prestadores]);

  const filteredPrestadores = useMemo(() => {
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const searchNorm = normalize(prestadorSearch.trim());
    const specialtyNorm = normalize(selectedSpecialty);

    const filtered = prestadores.filter(p => {
      const nameNorm = normalize(p.nombre);
      const specsNorm = (p.especialidades || []).map(s => normalize(s)).join(' ');
      const practsNorm = (p.practicas || []).map(pr => normalize(pr)).join(' ');
      const notasNorm = normalize(p.notas || '');
      
      const matchesSearch = nameNorm.includes(searchNorm) || 
                           specsNorm.includes(searchNorm) || 
                           practsNorm.includes(searchNorm) ||
                           notasNorm.includes(searchNorm);

      const matchesSpecialty = searchNorm !== "" || 
                              !selectedSpecialty || 
                              specsNorm.includes(specialtyNorm) || 
                              practsNorm.includes(specialtyNorm);

      return matchesSearch && matchesSpecialty;
    });

    if (searchNorm === "") {
      return filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return filtered.sort((a, b) => {
      const nameA = normalize(a.nombre);
      const nameB = normalize(b.nombre);
      
      const getScore = (name: string) => {
        if (name === searchNorm) return 100;
        if (name.startsWith(searchNorm + " ")) return 90;
        if (name.startsWith(searchNorm)) return 80;
        if (name.includes(" " + searchNorm + " ")) return 70;
        if (name.includes(searchNorm)) return 60;
        return 0;
      };

      const scoreA = getScore(nameA);
      const scoreB = getScore(nameB);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return nameA.localeCompare(nameB);
    });
  }, [prestadores, prestadorSearch, selectedSpecialty]);

  const filteredPracticas = useMemo(() => {
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const searchNorm = normalize(practicaSearch.trim());

    if (!searchNorm) return PRACTICAS_OME;

    const searchWords = searchNorm.split(/\s+/);

    const filtered = PRACTICAS_OME.filter(p => {
      const rawFields = [
        p.codigo || "",
        p.descripcion || "",
        p.modulo || "",
        p.descImpresa || "",
        p.sinonimo || ""
      ];
      
      const fields = rawFields.map(f => normalize(f));
      const fieldsNoSpace = rawFields.map(f => normalize(f).replace(/\s+/g, ""));
      
      // Check if ALL search words are present in at least ONE of the fields
      // We check both the normal field and the field without spaces
      return searchWords.every(word => {
        const wordNoSpace = word.replace(/\s+/g, "");
        return fields.some(field => field.includes(word)) || 
               fieldsNoSpace.some(fieldNoSpace => fieldNoSpace.includes(wordNoSpace));
      });
    });

    return filtered.sort((a, b) => {
      const descA = normalize(a.descripcion || "");
      const descB = normalize(b.descripcion || "");
      
      const getScore = (desc: string) => {
        if (desc === searchNorm) return 100;
        if (desc.startsWith(searchNorm + " ")) return 90;
        if (desc.startsWith(searchNorm)) return 80;
        if (desc.includes(" " + searchNorm + " ")) return 70;
        if (desc.includes(searchNorm)) return 60;
        return 0;
      };

      const scoreA = getScore(descA);
      const scoreB = getScore(descB);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return descA.localeCompare(descB);
    });
  }, [practicaSearch]);

  const filteredFolletos = useMemo(() => {
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const searchNorm = normalize(folletoSearch.trim());

    const filtered = folletos.filter(f => {
      const nameNorm = normalize(f.nombre || "");
      return nameNorm.includes(searchNorm);
    });

    if (searchNorm === "") {
      return filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return filtered.sort((a, b) => {
      const nameA = normalize(a.nombre || "");
      const nameB = normalize(b.nombre || "");
      
      const getScore = (name: string) => {
        if (name === searchNorm) return 100;
        if (name.startsWith(searchNorm + " ")) return 90;
        if (name.startsWith(searchNorm)) return 80;
        if (name.includes(" " + searchNorm + " ")) return 70;
        if (name.includes(searchNorm)) return 60;
        return 0;
      };

      const scoreA = getScore(nameA);
      const scoreB = getScore(nameB);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return nameA.localeCompare(nameB);
    });
  }, [folletos, folletoSearch]);

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
      alert("Error al subir archivos. Esto suele ocurrir si el servidor de archivos (Storage) no está activado o requiere el plan Blaze. Te recomendamos usar la 'Opción 1' para agregar enlaces de Google Drive o Dropbox.");
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
      descripcion: formData.get('descripcion') as string || "",
      nota: formData.get('nota') as string,
      pasos: (formData.get('pasos') as string).split('\n').filter(p => p.trim() !== ''),
      documentos: uploadedFiles,
      prestadoresIds: selectedPrestadoresIds
    };

    try {
      if (editingTramite) {
        await updateTramite(editingTramite.id, data);
      } else {
        await addTramite(data);
      }

      // Automáticamente agregar el nombre del trámite como especialidad a los prestadores seleccionados
      if (selectedPrestadoresIds.length > 0) {
        // Limpiamos el nombre para tomar solo la especialidad/estudio, eliminando descripciones adicionales
        // que suelen venir después de un paréntesis, guion o dos puntos.
        const tramiteNombre = data.nombre.split('(')[0].split('-')[0].split(':')[0].trim().toUpperCase();
        
        for (const id of selectedPrestadoresIds) {
          const prestador = prestadores.find(p => p.id === id);
          if (prestador) {
            const currentSpecs = prestador.especialidades || [];
            // Normalizar para evitar duplicados
            const alreadyHasSpec = currentSpecs.some(s => s.trim().toUpperCase() === tramiteNombre);
            
            if (!alreadyHasSpec && tramiteNombre.length > 0) {
              await updatePrestador(id, {
                especialidades: [...currentSpecs, tramiteNombre]
              });
            }
          }
        }
      }

      setIsModalOpen(false);
      setEditingTramite(null);
      setUploadedFiles([]);
      setSelectedPrestadoresIds([]);
      setManualFileName('');
      setManualFileUrl('');
    } catch (err) {
      console.error("Error saving tramite:", err);
      alert("Error al guardar el trámite. Verifique los permisos.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (t: Tramite, e: React.MouseEvent) => {
    e.stopPropagation();
    setTramiteToDelete(t);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (tramiteToDelete) {
      try {
        await deleteTramite(tramiteToDelete.id);
        setIsDeleteModalOpen(false);
        setTramiteToDelete(null);
      } catch (err) {
        console.error("Error deleting tramite:", err);
      }
    }
  };

  const handleDeletePrestador = (p: Prestador, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrestadorToDelete(p);
    setIsDeletePrestadorModalOpen(true);
  };

  const confirmDeletePrestador = async () => {
    if (prestadorToDelete) {
      setIsSaving(true);
      try {
        await deletePrestador(prestadorToDelete.id);
        setIsDeletePrestadorModalOpen(false);
        setPrestadorToDelete(null);
      } catch (err) {
        console.error("Error deleting prestador:", err);
        alert("Error al eliminar el prestador.");
      } finally {
        setIsSaving(false);
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
      const result = await seedDatabase(INITIAL_TRAMITES, INITIAL_PRESTADORES, INITIAL_FOLLETOS);
      setAdminMessage({ 
        text: `Sincronización completada. Se agregaron ${result.addedTramites} trámites, ${result.addedPrestadores} prestadores y ${result.addedFolletos} folletos nuevos.`,
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

  const addManualLink = () => {
    if (!manualFileName || !manualFileUrl) {
      alert("Por favor, ingrese el nombre y el enlace del archivo.");
      return;
    }
    setUploadedFiles(prev => [...prev, { nombre: manualFileName, url: manualFileUrl }]);
    setManualFileName('');
    setManualFileUrl('');
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
            <div className="hidden sm:flex items-baseline gap-2">
              <h1 className="text-lg font-semibold">
                Guía de Trámites <span className="font-light">City Bell</span>
              </h1>
              <span className="text-[9px] text-white/60 tracking-wider ml-1">Versión 1.0 @mesfede</span>
            </div>
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
              <div className="flex flex-col items-end gap-1">
                <Button variant="outline" className="bg-white text-pami-blue border-white hover:bg-white/90" onClick={handleLogin}>
                  <LogIn size={18} />
                  <span>Ingresar</span>
                </Button>
                {loginError && (
                  <span className="text-[10px] text-red-200 bg-red-900/50 px-2 py-1 rounded animate-pulse">
                    {loginError}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex border-t border-white/10">
          <button 
            onClick={() => setActiveTab('tramites')}
            className={cn(
              "px-6 py-3 text-sm font-medium transition-all border-b-2 flex items-center gap-2",
              activeTab === 'tramites' ? "border-white text-white" : "border-transparent text-white/60 hover:text-white"
            )}
          >
            <FileText size={16} />
            Trámites
          </button>
          <button 
            onClick={() => setActiveTab('prestadores')}
            className={cn(
              "px-6 py-3 text-sm font-medium transition-all border-b-2 flex items-center gap-2",
              activeTab === 'prestadores' ? "border-white text-white" : "border-transparent text-white/60 hover:text-white"
            )}
          >
            <Stethoscope size={16} />
            Prestadores
          </button>
          <button 
            onClick={() => setActiveTab('practicas')}
            className={cn(
              "px-6 py-3 text-sm font-medium transition-all border-b-2 flex items-center gap-2",
              activeTab === 'practicas' ? "border-white text-white" : "border-transparent text-white/60 hover:text-white"
            )}
          >
            <Activity size={16} />
            Prácticas OME
          </button>
          <button 
            onClick={() => setActiveTab('folletos')}
            className={cn(
              "px-6 py-3 text-sm font-medium transition-all border-b-2 flex items-center gap-2",
              activeTab === 'folletos' ? "border-white text-white" : "border-transparent text-white/60 hover:text-white"
            )}
          >
            <BookOpen size={16} />
            Folletos
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

        {/* Integrated Search Bar for Tramites */}
        {activeTab === 'tramites' && (
          <div className="bg-white border-t border-gray-200 py-2 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-6 items-center">
              {/* Primary Search: Internal Tramites */}
              <div className="flex-grow flex items-center gap-3 w-full md:pl-6">
                <div className="flex items-center gap-2 text-pami-blue whitespace-nowrap shrink-0">
                  <Search size={16} />
                  <h3 className="text-sm font-medium">Buscar trámite</h3>
                </div>
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pami-muted" size={16} />
                  <Input 
                    placeholder="Ej: Reintegro, Pañales..." 
                    className="pl-9 bg-gray-50 border-gray-200 text-pami-text placeholder:text-pami-muted focus:ring-pami-blue focus:border-pami-blue focus:bg-white h-9 text-sm w-full transition-colors shadow-inner"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-6 bg-gray-200"></div>

              {/* Secondary Search: Google Search */}
              <div className="md:w-[380px] flex items-center gap-3 w-full shrink-0">
                <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="16px" height="16px" className="bg-transparent p-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <h3 className="text-sm font-medium text-pami-muted">Google</h3>
                </div>
                <form onSubmit={handleGoogleSearch} className="relative flex-grow">
                  <Input 
                    placeholder="Consulta externa..." 
                    className="pr-10 bg-gray-50 border-gray-200 text-pami-text placeholder:text-pami-muted focus:ring-pami-cyan focus:border-pami-cyan focus:bg-white h-9 text-sm w-full transition-colors shadow-inner"
                    value={aiSearch}
                    onChange={(e) => setAiSearch(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={!aiSearch.trim()}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-pami-cyan hover:text-pami-blue hover:bg-pami-blue/5 rounded transition-colors disabled:opacity-30"
                  >
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'tramites' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sidebar Filters */}
              <aside className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-4 bg-white border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-pami-text">Categorías</h2>
                </div>
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => setSelectedCat('all')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between",
                      selectedCat === 'all' ? "bg-pami-blue/10 text-pami-blue font-semibold" : "hover:bg-gray-50 text-pami-text"
                    )}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className={cn(
                        "transition-colors",
                        selectedCat === 'all' ? "text-pami-blue" : "text-pami-muted"
                      )}>
                        {getCategoryIcon('all', 22)}
                      </span>
                      <span>Todas</span>
                    </div>
                    <span className="text-xs opacity-60 shrink-0 ml-2">{tramites.length}</span>
                  </button>
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCat(selectedCat === cat ? 'all' : cat)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group relative overflow-hidden",
                        selectedCat === cat 
                          ? `${CATEGORY_LIGHT_COLORS[cat] || "bg-pami-blue/10"} text-pami-blue font-semibold ring-1 ring-inset ring-pami-blue/20` 
                          : "hover:bg-gray-50 text-pami-text"
                      )}
                    >
                      <div className="flex items-center gap-3 truncate relative z-10">
                        <span className={cn(
                          "transition-colors",
                          getCategoryColor(cat, selectedCat === cat)
                        )}>
                          {getCategoryIcon(cat, 22)}
                        </span>
                        <span className="truncate">{cat}</span>
                      </div>
                      <span className="text-xs opacity-60 shrink-0 ml-2 relative z-10">
                        {tramites.filter(t => t.categoria === cat).length}
                      </span>
                      {selectedCat === cat && (
                        <motion.div 
                          layoutId="active-cat-indicator"
                          className={cn("absolute left-0 top-0 bottom-0 w-1", CATEGORY_COLORS[cat]?.split(' ')[0] || "bg-pami-blue")}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Content */}
            <div className="lg:col-span-8 space-y-4">
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
                        "rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all",
                        CATEGORY_LIGHT_COLORS[t.categoria] || "bg-white",
                        expandedId === t.id ? "ring-2 ring-pami-blue shadow-md" : "hover:border-pami-blue/50"
                      )}
                    >
                      <div 
                        className="p-4 flex items-center gap-4 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-transform group-hover:scale-110",
                          CATEGORY_COLORS[t.categoria]?.split(' ')[0] || "bg-pami-blue/10"
                        )}>
                          <span className={getCategoryColor(t.categoria, false)}>
                            {getCategoryIcon(t.categoria, 20)}
                          </span>
                        </div>
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

                              {t.descripcion && (
                                <div className="border-l-4 border-pami-cyan pl-4 py-1">
                                  <p className="text-sm text-pami-muted leading-relaxed whitespace-pre-line">
                                    {t.descripcion}
                                  </p>
                                </div>
                              )}

                              {t.prestadoresIds && t.prestadoresIds.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-pami-blue">Prestadores que realizan este trámite</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {t.prestadoresIds.map(id => {
                                      const p = prestadores.find(p => p.id === id);
                                      if (!p) return null;
                                      return (
                                        <button
                                          key={id}
                                          onClick={() => {
                                            setActiveTab('prestadores');
                                            setPrestadorSearch(p.nombre);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          className="text-xs bg-pami-blue/5 text-pami-blue px-3 py-1.5 rounded-full hover:bg-pami-blue/10 transition-all font-medium uppercase"
                                        >
                                          {p.nombre}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {t.pasos && t.pasos.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-pami-cyan">Pasos a seguir</h4>
                                    <div className="flex items-center gap-2">
                                      {t.documentos?.some(d => d.nombre.toLowerCase().endsWith('.pdf')) && (
                                        <button 
                                          onClick={async () => {
                                            const pdfDoc = t.documentos?.find(d => d.nombre.toLowerCase().endsWith('.pdf'));
                                            if (!pdfDoc) return;
                                            
                                            setIsPrintingFull(t.id);
                                            try {
                                              const combinedPdfUrl = await generateFullTramitePdf(t, pdfDoc.url);
                                              window.open(combinedPdfUrl, '_blank');
                                            } catch (err) {
                                              console.error("Error generating full PDF:", err);
                                              alert("No se pudo generar el PDF completo. Esto puede deberse a restricciones de seguridad del servidor de archivos (CORS).");
                                            } finally {
                                              setIsPrintingFull(null);
                                            }
                                          }}
                                          disabled={isPrintingFull === t.id}
                                          className="p-1.5 hover:bg-pami-cyan/10 rounded-md text-pami-cyan transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                                          title="Imprimir Formulario + Guía (Doble Faz)"
                                        >
                                          {isPrintingFull === t.id ? <Loader2 size={14} className="animate-spin" /> : <Files size={14} />}
                                          <span>Kit Completo (Doble Faz)</span>
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => {
                                          const printWindow = window.open('', '_blank');
                                          if (printWindow) {
                                            printWindow.document.write(`
                                              <html>
                                                <head>
                                                  <title>Pasos a seguir - ${t.nombre}</title>
                                                  <style>
                                                    body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                                                    h1 { color: #0b2344; margin-bottom: 20px; font-size: 24px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                                                    h2 { color: #555; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
                                                    ol { margin-top: 20px; padding-left: 20px; }
                                                    li { margin-bottom: 15px; font-size: 16px; }
                                                  </style>
                                                </head>
                                                <body>
                                                  <h1>${t.nombre}</h1>
                                                  <h2>Pasos a seguir</h2>
                                                  <ol>
                                                    ${t.pasos!.map(p => `<li>${p}</li>`).join('')}
                                                  </ol>
                                                </body>
                                              </html>
                                            `);
                                            printWindow.document.close();
                                            printWindow.focus();
                                            setTimeout(() => {
                                              printWindow.print();
                                            }, 250);
                                          }
                                        }}
                                        className="p-1.5 hover:bg-pami-blue/10 rounded-md text-pami-blue transition-colors flex items-center gap-1.5 text-xs font-medium"
                                        title="Imprimir pasos"
                                      >
                                        <Printer size={14} />
                                        <span>Imprimir Guía</span>
                                      </button>
                                    </div>
                                  </div>
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
                                        className="flex items-center gap-3 p-3 bg-pami-blue/5 rounded-lg hover:bg-pami-blue/10 transition-all group relative"
                                      >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          {getFileIcon(doc.nombre)}
                                          <a 
                                            href={doc.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium truncate text-pami-blue hover:underline decoration-2 underline-offset-4"
                                            title="Ver / Descargar"
                                          >
                                            {doc.nombre}
                                          </a>
                                        </div>
                                        <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                          <a 
                                            href={doc.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-1.5 bg-white sm:bg-transparent hover:bg-white rounded-md text-pami-blue shadow-sm sm:shadow-none hover:shadow-sm transition-colors"
                                            title="Ver / Descargar"
                                          >
                                            <ExternalLink size={16} />
                                          </a>
                                          <button 
                                            onClick={() => {
                                              navigator.clipboard.writeText(doc.url);
                                              alert("Enlace copiado al portapapeles");
                                            }}
                                            className="p-1.5 bg-white sm:bg-transparent hover:bg-white rounded-md text-pami-blue shadow-sm sm:shadow-none hover:shadow-sm transition-colors"
                                            title="Copiar enlace"
                                          >
                                            <Paperclip size={16} />
                                          </button>
                                          <button 
                                            onClick={() => {
                                              const printWindow = window.open(doc.url, '_blank');
                                              if (!printWindow) {
                                                alert("El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio o usa el botón de 'Ver / Descargar'.");
                                                return;
                                              }
                                              if (doc.nombre.toLowerCase().endsWith('.pdf')) {
                                                printWindow.onload = () => {
                                                  try { printWindow.print(); } catch (e) { /* Ignore cross-origin errors */ }
                                                };
                                              }
                                            }}
                                            className="p-1.5 bg-white sm:bg-transparent hover:bg-white rounded-md text-pami-blue shadow-sm sm:shadow-none hover:shadow-sm transition-colors"
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
                                <div className="text-[10px] text-gray-400 font-medium">
                                  {t.updatedAt?.toDate ? `Última actualización: ${t.updatedAt.toDate().toLocaleDateString()}` : (t.createdAt?.toDate ? `Añadido el: ${t.createdAt.toDate().toLocaleDateString()}` : '')}
                                </div>
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
                                      onClick={(e) => handleDelete(t, e)}
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
          </div>
        )}

        {activeTab === 'prestadores' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-pami-text">Cartilla de Prestadores</h2>
                <p className="text-sm text-pami-muted">{filteredPrestadores.length} centros encontrados</p>
              </div>
              {isAdmin && (
                <Button 
                  onClick={() => { setEditingPrestador(null); setIsPrestadorModalOpen(true); }}
                >
                  <Plus size={18} className="mr-2" />
                  Nuevo Prestador
                </Button>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-pami-muted uppercase tracking-wider">Filtrar por Especialidad o Práctica</label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-pami-muted" size={18} />
                    <select 
                      className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pami-cyan focus:border-transparent transition-all appearance-none text-pami-text"
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                    >
                      <option value="">Todas las especialidades / prácticas</option>
                      {allSpecialties.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-pami-muted pointer-events-none" size={18} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-pami-muted uppercase tracking-wider">Buscar por Nombre</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pami-muted" size={18} />
                    <Input 
                      placeholder="Ej: Clínica San Miguel..." 
                      className="pl-10"
                      value={prestadorSearch}
                      onChange={(e) => setPrestadorSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {selectedSpecialty && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                  <span className="text-xs text-pami-muted">Filtro activo:</span>
                  <span className="bg-pami-cyan/10 text-pami-cyan text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-2 uppercase tracking-wider">
                    {selectedSpecialty}
                    <button onClick={() => setSelectedSpecialty('')} className="hover:text-pami-blue">
                      <X size={14} />
                    </button>
                  </span>
                </div>
              )}
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
                      <div className="flex gap-1">
                        <button 
                          onClick={() => { setEditingPrestador(p); setIsPrestadorModalOpen(true); }}
                          className="p-1.5 text-pami-muted hover:text-pami-blue hover:bg-pami-blue/5 rounded-lg transition-all"
                          title="Editar prestador"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => handleDeletePrestador(p, e)}
                          className="p-1.5 text-pami-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar prestador"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
                            <span key={e} className="text-[10px] bg-pami-blue/5 text-pami-blue px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
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

        {activeTab === 'practicas' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-pami-text">Buscador de Prácticas OME</h2>
                <p className="text-sm text-pami-muted">Identifica quién debe generar la Orden Médica Electrónica</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-pami-muted uppercase tracking-wider">Buscar por Código o Descripción</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pami-muted" size={18} />
                  <Input 
                    placeholder="Ej: 660101, Hemograma, TAC, RMN, Fondo de ojo..." 
                    className="pl-10"
                    value={practicaSearch}
                    onChange={(e) => setPracticaSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredPracticas.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <Search size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-pami-muted">No se encontraron prácticas con estos criterios.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-[11px] font-bold uppercase tracking-widest text-pami-muted">
                          <th className="px-6 py-4">Código</th>
                          <th className="px-6 py-4">Descripción</th>
                          <th className="px-6 py-4">Módulo</th>
                          <th className="px-6 py-4 text-center">Responsable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredPracticas.map((p, idx) => (
                          <tr key={`${p.codigo}-${idx}`} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4 font-mono text-sm text-pami-blue font-bold">{p.codigo}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm text-pami-text font-medium uppercase">{p.descripcion}</span>
                                {(p.descImpresa || p.sinonimo) && (
                                  <div className="flex gap-2 mt-1">
                                    {p.descImpresa && (
                                      <span className="text-[10px] text-pami-muted italic">Imp: {p.descImpresa}</span>
                                    )}
                                    {p.sinonimo && (
                                      <span className="text-[10px] text-pami-cyan font-medium">Sín: {p.sinonimo}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-pami-muted uppercase">{p.modulo}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                p.responsable === 'Médico de Cabecera' 
                                  ? "bg-green-100 text-green-700 border border-green-200" 
                                  : "bg-amber-100 text-amber-700 border border-amber-200"
                              )}>
                                {p.responsable === 'Médico de Cabecera' ? (
                                  <CheckCircle2 size={12} />
                                ) : (
                                  <AlertCircle size={12} />
                                )}
                                {p.responsable}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'folletos' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-pami-text">Folletos Informativos</h2>
                <p className="text-sm text-pami-muted">{filteredFolletos.length} folletos encontrados</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pami-muted" size={18} />
                  <Input 
                    placeholder="Buscar folleto..." 
                    className="pl-10"
                    value={folletoSearch}
                    onChange={(e) => setFolletoSearch(e.target.value)}
                  />
                </div>
                {isAdmin && (
                  <Button onClick={() => setIsFolletoModalOpen(true)}>
                    <Plus size={18} className="mr-2" />
                    <span>Subir Folleto</span>
                  </Button>
                )}
              </div>
            </div>

            {filteredFolletos.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-pami-muted">No se encontraron folletos con estos criterios.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFolletos.map(f => (
                  <motion.div 
                    key={f.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group relative"
                  >
                    <div className="p-6 flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 bg-pami-blue/10 rounded-full flex items-center justify-center text-pami-blue group-hover:scale-110 transition-transform">
                        <FileText size={32} />
                      </div>
                      <h3 className="font-semibold text-pami-text line-clamp-2 min-h-[3rem] uppercase text-sm">{f.nombre}</h3>
                      <div className="flex items-center gap-2 w-full">
                        <a 
                          href={f.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 bg-pami-blue text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-pami-blue/90 transition-colors flex items-center justify-center gap-2"
                        >
                          <Printer size={16} />
                          Ver / Imprimir
                        </a>
                        {isAdmin && (
                          <button 
                            onClick={() => { setFolletoToDelete(f); setIsDeleteFolletoModalOpen(true); }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar folleto"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-pami-text">Panel de Administración</h2>
                <p className="text-sm text-pami-muted">Gestiona el contenido de la plataforma</p>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => setAdminSubTab('tramites')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                    adminSubTab === 'tramites' ? "bg-white text-pami-blue shadow-sm" : "text-pami-muted hover:text-pami-text"
                  )}
                >
                  Trámites
                </button>
                <button 
                  onClick={() => setAdminSubTab('prestadores')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                    adminSubTab === 'prestadores' ? "bg-white text-pami-blue shadow-sm" : "text-pami-muted hover:text-pami-text"
                  )}
                >
                  Prestadores
                </button>
                <button 
                  onClick={() => setAdminSubTab('folletos')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                    adminSubTab === 'folletos' ? "bg-white text-pami-blue shadow-sm" : "text-pami-muted hover:text-pami-text"
                  )}
                >
                  Folletos
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex gap-2 p-1 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-pami-muted px-2 py-1 flex items-center">Limpieza:</span>
                <Button variant="outline" className="text-[10px] py-1 h-auto px-3" onClick={handleCleanup} isLoading={isSaving}>
                  Prestadores
                </Button>
                <Button variant="outline" className="text-[10px] py-1 h-auto px-3" onClick={handleCleanupTramites} isLoading={isSaving}>
                  Trámites
                </Button>
              </div>
              
              <Button variant="outline" className="text-[10px] py-1 h-auto px-3 ml-auto" onClick={handleSeed} isLoading={isSaving}>
                <Activity size={12} className="mr-1" />
                Sincronizar Datos Iniciales
              </Button>
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
              {adminSubTab === 'tramites' ? (
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
                              onClick={(e) => handleDelete(t, e)}
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
              ) : adminSubTab === 'prestadores' ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] font-bold uppercase tracking-widest text-pami-muted">
                      <th className="px-6 py-4">Prestador</th>
                      <th className="px-6 py-4">Localidad</th>
                      <th className="px-6 py-4">Especialidades</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {prestadores.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 font-medium text-pami-text uppercase">{p.nombre}</td>
                        <td className="px-6 py-4 text-sm text-pami-muted uppercase">{p.localidad || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {p.especialidades?.slice(0, 3).map(e => (
                              <span key={e} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase font-bold">
                                {e}
                              </span>
                            ))}
                            {(p.especialidades?.length || 0) > 3 && (
                              <span className="text-[9px] text-pami-muted">+{p.especialidades!.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => { setEditingPrestador(p); setIsPrestadorModalOpen(true); }}
                              className="p-2 text-pami-muted hover:text-pami-blue hover:bg-pami-blue/5 rounded-lg transition-all"
                              title="Editar prestador"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={(e) => handleDeletePrestador(p, e)}
                              className="p-2 text-pami-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Eliminar prestador"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] font-bold uppercase tracking-widest text-pami-muted">
                      <th className="px-6 py-4">Folleto</th>
                      <th className="px-6 py-4">URL</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {folletos.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 font-medium text-pami-text uppercase">{f.nombre}</td>
                        <td className="px-6 py-4 text-xs text-pami-muted truncate max-w-[200px]">
                          {f.url}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => { setFolletoToDelete(f); setIsDeleteFolletoModalOpen(true); }}
                              className="p-2 text-pami-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Eliminar folleto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
            <label className="text-sm font-semibold text-pami-muted">Descripción / Procedimiento (opcional)</label>
            <TextArea 
              name="descripcion" 
              defaultValue={editingTramite?.descripcion} 
              placeholder="Detalles adicionales sobre el trámite..." 
            />
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

          <div className="space-y-3">
            <label className="text-sm font-semibold text-pami-muted">Prestadores que realizan este trámite</label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="max-h-48 overflow-y-auto p-2 space-y-1 bg-gray-50">
                {prestadores.sort((a, b) => a.nombre.localeCompare(b.nombre)).map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-pami-blue focus:ring-pami-blue"
                      checked={selectedPrestadoresIds.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPrestadoresIds([...selectedPrestadoresIds, p.id]);
                        } else {
                          setSelectedPrestadoresIds(selectedPrestadoresIds.filter(id => id !== p.id));
                        }
                      }}
                    />
                    <span className="text-sm text-pami-text group-hover:text-pami-blue transition-colors uppercase">{p.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-pami-muted italic">Selecciona los prestadores donde se puede realizar este trámite o práctica.</p>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-pami-muted flex items-center gap-2">
              <Paperclip size={16} />
              Planillas y Documentos
            </label>
            
            <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input 
                    placeholder="Nombre del archivo (ej: Formulario 1)" 
                    value={manualFileName}
                    onChange={(e) => setManualFileName(e.target.value)}
                    className="text-xs"
                  />
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Pegar enlace (URL) aquí" 
                      value={manualFileUrl}
                      onChange={(e) => setManualFileUrl(e.target.value)}
                      className="text-xs flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={addManualLink}
                      className="h-auto py-1 px-3 text-xs"
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-pami-blue/5 text-pami-blue px-3 py-1.5 rounded-lg text-xs font-medium">
                  {getFileIcon(file.nombre)}
                  <span className="max-w-[150px] truncate">{file.nombre}</span>
                  <button type="button" onClick={() => removeFile(idx)} className="hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors" title="Eliminar archivo">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
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

      {/* Modal for Delete Confirmation */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => { setIsDeleteModalOpen(false); setTramiteToDelete(null); }}
        title="Confirmar Eliminación"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl text-red-700 border border-red-100">
            <AlertCircle className="shrink-0" size={24} />
            <p className="text-sm font-medium">
              ¿Estás seguro de que deseas eliminar el trámite <span className="font-bold uppercase">"{tramiteToDelete?.nombre}"</span>? Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button type="button" variant="danger" onClick={confirmDelete} isLoading={isSaving}>
              <Trash2 size={18} />
              <span>Eliminar Trámite</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal for Prestador Delete Confirmation */}
      <Modal 
        isOpen={isDeletePrestadorModalOpen} 
        onClose={() => { setIsDeletePrestadorModalOpen(false); setPrestadorToDelete(null); }}
        title="Confirmar Eliminación de Prestador"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl text-red-700 border border-red-100">
            <AlertCircle className="shrink-0" size={24} />
            <p className="text-sm font-medium">
              ¿Estás seguro de que deseas eliminar al prestador <span className="font-bold uppercase">"{prestadorToDelete?.nombre}"</span>? Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsDeletePrestadorModalOpen(false)}>Cancelar</Button>
            <Button type="button" variant="danger" onClick={confirmDeletePrestador} isLoading={isSaving}>
              <Trash2 size={18} />
              <span>Eliminar Prestador</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Folleto Modal */}
      <Modal 
        isOpen={isDeleteFolletoModalOpen} 
        onClose={() => setIsDeleteFolletoModalOpen(false)} 
        title="Eliminar Folleto"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl text-red-700 border border-red-100">
            <AlertCircle className="shrink-0" size={24} />
            <p className="text-sm font-medium">
              ¿Estás seguro que deseas eliminar el folleto <span className="font-bold uppercase">"{folletoToDelete?.nombre}"</span>? Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsDeleteFolletoModalOpen(false)}>Cancelar</Button>
            <Button 
              variant="danger" 
              isLoading={isSaving}
              onClick={async () => {
                if (folletoToDelete) {
                  setIsSaving(true);
                  try {
                    await deleteFolleto(folletoToDelete.id);
                    setIsDeleteFolletoModalOpen(false);
                    setFolletoToDelete(null);
                  } catch (err) {
                    console.error("Error deleting folleto:", err);
                  } finally {
                    setIsSaving(false);
                  }
                }
              }}
            >
              <Trash2 size={18} />
              <span>Eliminar Folleto</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Folleto Modal */}
      <Modal 
        isOpen={isFolletoModalOpen} 
        onClose={() => setIsFolletoModalOpen(false)} 
        title="Subir Nuevo Folleto"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          setIsSaving(true);
          const formData = new FormData(e.currentTarget);
          const nombre = formData.get('nombre') as string;
          const url = formData.get('url') as string;

          try {
            await addFolleto({ nombre, url });
            setIsFolletoModalOpen(false);
          } catch (err) {
            console.error("Error adding folleto:", err);
            alert("Error al subir el folleto.");
          } finally {
            setIsSaving(false);
          }
        }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Nombre del Folleto</label>
            <Input name="nombre" placeholder="Ej: Cartilla Prestadores 2026" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Enlace de Google Drive</label>
            <Input name="url" placeholder="https://drive.google.com/..." required />
            <p className="text-[10px] text-pami-muted mt-1">Asegúrate de que el enlace tenga permisos de lectura para cualquier persona con el link.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsFolletoModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>
              <CheckCircle2 size={18} />
              <span>Guardar Folleto</span>
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
