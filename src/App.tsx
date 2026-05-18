import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { AddressAutocomplete } from './components/AddressAutocomplete';
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
  Calendar,
  Paperclip,
  File,
  Loader2,
  Phone, 
  Mail, 
  Globe,
  MessageCircle,
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
  Megaphone,
  Pill,
  Apple,
  Syringe,
  Banknote,
  Files,
  Brain,
  Eye,
  LayoutGrid,
  UserRound,
  Wind,
  BookOpen,
  Truck,
  Footprints,
  Ambulance,
  ArrowRight,
  Users,
  Sparkles,
  Dumbbell,
  Shield,
  Menu,
  EyeOff,
  RotateCcw,
  Home,
  Bell,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Login } from './components/Login';
import { AdminUsers } from './components/AdminUsers';
import { generateFullTramitePdf } from './lib/pdfUtils';
import { 
  subscribeToTramites, 
  subscribeToPrestadores, 
  subscribeToFolletos,
  subscribeToPracticas,
  addTramite, 
  updateTramite, 
  deleteTramite,
  addPrestador,
  updatePrestador,
  deletePrestador,
  addPractica,
  updatePractica,
  deletePractica,
  addFolleto,
  deleteFolleto,
  cleanupPrestadores,
  cleanupTramites,
  cleanupPracticas,
  cleanupCentrosCoordinadores,
  seedDatabase,
  uploadFile,
  unifySudamericanoHospitals,
  unifyIpensa,
  seedDialisis,
  testConnection,
  subscribeToCentrosCoordinadores,
  subscribeToLatestUpdate,
  addCentroCoordinador,
  updateCentroCoordinador,
  deleteCentroCoordinador,
  subscribeToTelefonos,
  addTelefono,
  updateTelefono,
  deleteTelefono,
  deleteAllTelefonos,
  migrateData,
  normalizeHospitalName,
  resetDeletedLog,
  cleanupFolletos,
  cleanupTelefonos,
  resetAllTopes,
  unifyTerms,
  purgeSpecialtyFromDatabase,
  getCompleteBackup,
  importPracticasBatch
} from './services/firestore';
import Papa from 'papaparse';
import { Tramite, Prestador, PracticaOME, Folleto, CentroCoordinador, TelefonoInterno, CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_LIGHT_COLORS } from './types';
import { INITIAL_TRAMITES, INITIAL_PRESTADORES, INITIAL_FOLLETOS } from './initialData';
import { PRACTICAS_OME } from './data/practicasOME';
import { INITIAL_CENTROS_COORDINADORES } from './data/centrosCoordinadores';
import { INITIAL_TELEFONOS } from './data/telefonos';
import { cn } from './lib/utils';
import { PamiLogo } from './components/PamiLogo';
import { AttentionCountdown } from './components/AttentionCountdown';
import { AnimatedLogo } from './components/AnimatedLogo';
import { RichTextEditor } from './components/RichTextEditor';

const getFileIcon = (nombre: string) => {
  const lowerName = nombre.toLowerCase();
  // Detectar tipo de archivo por extensión o palabra clave
  const isPdf = lowerName.endsWith('.pdf') || lowerName.includes('pdf');
  const isDoc = lowerName.endsWith('.doc') || lowerName.endsWith('.docx') || lowerName.includes('word');
  const isExcel = lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx') || lowerName.includes('excel') || lowerName.includes('planilla');
  const isImage = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || lowerName.includes('foto') || lowerName.includes('imagen');
  
  if (isPdf) return <FileText size={28} className="text-red-500 shrink-0" />;
  if (isDoc) return <FileText size={28} className="text-blue-600 shrink-0" />;
  if (isExcel) return <FileSpreadsheet size={28} className="text-green-600 shrink-0" />;
  if (isImage) return <FileImage size={28} className="text-purple-500 shrink-0" />;
  
  return <File size={28} className="text-gray-400 shrink-0" />;
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
    case 'Kinesiología y rehabilitación': return <Dumbbell size={size} />;
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
    case 'Odontología': return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M7 3C4.23858 3 2 5.23858 2 8C2 11.5 5 13 5 16C5 19 6 21 8 21C10 21 11 19 11 16C11 14 12 14 13 16C13 19 14 21 16 21C18 21 19 19 19 16C19 13 22 11.5 22 8C22 5.23858 19.7614 3 17 3C14.5 3 13 4.5 12 6C11 4.5 9.5 3 7 3Z" />
      </svg>
    );
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

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input 
    ref={ref}
    className={cn(
      'w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pami-cyan focus:border-transparent transition-all',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

const TextArea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea 
    className={cn(
      'w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pami-cyan focus:border-transparent transition-all min-h-[100px]',
      className
    )}
    {...props}
  />
);

const AutocompleteTagInput = ({
  name,
  defaultValue = "",
  placeholder,
  suggestions = [],
  className,
  onChange
}: {
  name: string,
  defaultValue?: string,
  placeholder?: string,
  suggestions?: string[],
  className?: string,
  onChange?: (tags: string[]) => void
}) => {
  const [tags, setTags] = useState<string[]>(defaultValue ? defaultValue.split('\n').filter(t => t.trim() !== '') : []);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const normalize = useCallback((str: string) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(), 
  []);

  // Call onChange whenever tags change
  useEffect(() => {
    if (onChange) {
      onChange(tags);
    }
  }, [tags]);

  const filteredSuggestions = suggestions.filter(s => 
    normalize(s).includes(normalize(inputValue)) && !tags.some(t => normalize(t) === normalize(s))
  );

  // Take exact match to top if exists, then limit to 10
  const exactMatchIndex = filteredSuggestions.findIndex(s => normalize(s) === normalize(inputValue));
  const suggestionsToDisplay = exactMatchIndex !== -1 
    ? [filteredSuggestions[exactMatchIndex], ...filteredSuggestions.filter((_, i) => i !== exactMatchIndex)].slice(0, 15)
    : filteredSuggestions.slice(0, 15);

  const addTag = (tag: string) => {
    if (tag.trim() !== '' && !tags.some(t => normalize(t) === normalize(tag))) {
      // Try to find the exact suggestion mapping to retain proper casing/accents if known
      const matchedSuggestion = suggestions.find(s => normalize(s) === normalize(tag));
      setTags([...tags, matchedSuggestion || tag.trim().toUpperCase()]);
    }
    setInputValue("");
    setShowSuggestions(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const currentStringFromMap = tags.join('\n');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative flex w-full flex-col gap-1", className)} ref={containerRef}>
      {/* Hidden textarea to submit the actual value natively with the form */}
      <textarea name={name} value={currentStringFromMap} readOnly className="hidden" />
      
      <div className="flex flex-wrap gap-2 mb-2 empty:hidden">
        {tags.map((tag, i) => (
          <span key={i} className="bg-pami-cyan/10 text-pami-cyan px-2 py-1 rounded-md text-xs font-bold uppercase flex items-center gap-1 group">
            {tag}
            <button 
              type="button" 
              onClick={() => setTags(tags.filter((_, idx) => idx !== i))} 
              className="text-pami-cyan/50 hover:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      
      <div className="relative">
        <Input 
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); // prevent form submit
              if (inputValue.trim()) {
                addTag(inputValue);
              }
            } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
              setTags(tags.slice(0, -1));
            }
          }}
          placeholder={tags.length === 0 ? placeholder : "Escribe para añadir más (Enter para guardar)..."}
          className="pr-10"
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-pami-blue bg-white"
          onClick={() => {
             if (inputValue.trim()) {
                addTag(inputValue);
             } else {
                setShowSuggestions(true);
                inputRef.current?.focus();
             }
          }}
        >
          <ChevronDown size={18} className={cn("transition-transform duration-200", showSuggestions ? "rotate-180" : "")}/>
        </button>
        
        {showSuggestions && (inputValue.trim() !== '' || suggestionsToDisplay.length > 0) && (
          <div className="absolute z-[99] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto outline-none divide-y divide-gray-50">
            {suggestionsToDisplay.map((suggestion, i) => {
              // Highlight matched text
              const index = suggestion.toLowerCase().indexOf(inputValue.toLowerCase());
              const beforeStr = suggestion.substring(0, index);
              const matchStr = suggestion.substring(index, index + inputValue.length);
              const afterStr = suggestion.substring(index + inputValue.length);

              return (
                <div 
                  key={i}
                  className="px-4 py-2.5 hover:bg-pami-cyan/5 cursor-pointer text-sm font-medium uppercase text-gray-700 hover:text-pami-blue transition-colors flex items-center justify-between group"
                  onMouseDown={(e) => { e.preventDefault(); addTag(suggestion); }}
                >
                  <div>
                    {index >= 0 && inputValue ? (
                      <>
                        {beforeStr}
                        <span className="font-extrabold text-pami-blue">{matchStr}</span>
                        {afterStr}
                      </>
                    ) : (
                      suggestion
                    )}
                  </div>
                  <Plus size={14} className="opacity-0 group-hover:opacity-100 text-pami-blue" />
                </div>
              );
            })}
            {inputValue.trim() !== '' && !suggestions.some(s => normalize(s) === normalize(inputValue)) && (
              <div 
                className="px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer text-sm font-bold uppercase text-pami-blue flex items-center gap-2 border-t-2 border-gray-100"
                onMouseDown={(e) => { e.preventDefault(); addTag(inputValue); }}
              >
                <Plus size={16} /> 
                Añadir nuevo: <span className="underline">{inputValue.trim()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const AutocompleteSingleSelect = ({
  value,
  onChange,
  options,
  placeholder = "Buscar...",
  className,
  emptyOptionText = "Limpiar selección"
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  emptyOptionText?: string;
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalize = useCallback((str: string) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(), 
  []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setInputValue(value);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filteredOptions = options.filter(s => 
    normalize(s).includes(normalize(inputValue))
  );

  const optionsToDisplay = [
    ...(inputValue.trim() === '' ? [] : options.filter(s => normalize(s) === normalize(inputValue))),
    ...filteredOptions.filter(s => normalize(s) !== normalize(inputValue))
  ];

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pami-cyan focus:border-transparent transition-all text-pami-text"
      />
      
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
          <div 
            className={cn(
              "px-4 py-2 cursor-pointer text-sm font-medium transition-colors hover:bg-gray-50",
              value === "" ? "text-pami-blue bg-pami-blue/5" : "text-gray-700 hover:text-pami-blue"
            )}
            onMouseDown={(e) => { 
              e.preventDefault(); 
              onChange(""); 
              setInputValue("");
              setShowSuggestions(false); 
            }}
          >
            {emptyOptionText}
          </div>
          {optionsToDisplay.map((option, i) => {
            const index = option.toLowerCase().indexOf(inputValue.toLowerCase());
            const beforeStr = option.substring(0, index);
            const matchStr = option.substring(index, index + inputValue.length);
            const afterStr = option.substring(index + inputValue.length);

            return (
              <div 
                key={i}
                className={cn(
                  "px-4 py-2 hover:bg-pami-cyan/5 cursor-pointer text-sm font-medium uppercase transition-colors flex items-center justify-between group",
                  value === option ? "text-pami-blue bg-pami-blue/5" : "text-gray-700 hover:text-pami-blue"
                )}
                onMouseDown={(e) => { 
                  e.preventDefault(); 
                  onChange(option); 
                  setInputValue(option);
                  setShowSuggestions(false); 
                }}
              >
                <div>
                  {index >= 0 && inputValue ? (
                    <>
                      {beforeStr}
                      <span className="font-extrabold text-pami-blue">{matchStr}</span>
                      {afterStr}
                    </>
                  ) : (
                    option
                  )}
                </div>
              </div>
            );
          })}
          {optionsToDisplay.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center italic">
              No se encontraron resultados
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

const PrestadorCard = ({ 
  p, 
  isAdmin, 
  onEdit, 
  onDelete, 
  onPrint,
  searchTerm, 
  selectedSpecialty 
}: { 
  p: Prestador, 
  isAdmin: boolean, 
  onEdit: () => void, 
  onDelete: (e: React.MouseEvent) => void,
  onPrint: () => void,
  searchTerm: string,
  selectedSpecialty: string
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const normalize = (str: string) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const searchNorm = normalize(searchTerm.trim().replace(/\s+/g, ' '));
  const specialtyNorm = normalize(selectedSpecialty.replace(/\s+/g, ' '));
  const unifiedSpecs = unifyTerms(p.especialidades || []);
  const unifiedTopeadas = unifyTerms(p.especialidadesTopeadas || []);

  const isMedicoCabecera = unifiedSpecs.some(s => 
    s.toUpperCase().includes('MEDICO DE CABECERA') || 
    s.toUpperCase().includes('MÉDICO DE CABECERA')
  );

  const matchingSpecs = unifiedSpecs.filter(s => {
    const sNorm = normalize(s.replace(/\s+/g, ' '));
    const termMatches = searchNorm !== "" && sNorm.includes(searchNorm);
    const dropdownMatches = selectedSpecialty && sNorm === specialtyNorm;
    return dropdownMatches || termMatches;
  });

  // Show all specs if they are 10 or less, otherwise show matching and let user expand
  const showAllByDefault = unifiedSpecs.length <= 10;
  const primarySpecs = showAllByDefault ? unifiedSpecs : (matchingSpecs.length > 0 ? matchingSpecs : [unifiedSpecs[0]]);
  const otherSpecs = unifiedSpecs.filter(s => !primarySpecs.includes(s));

  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all flex flex-col h-full", p.oculto && "bg-gray-100/80 opacity-60 grayscale-[50%] hover:opacity-80")}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-pami-text flex items-center gap-2">
            {isMedicoCabecera ? (
              <UserRound size={18} className="text-pami-blue shrink-0" />
            ) : (
              <Hospital size={18} className="text-pami-blue shrink-0" />
            )}
            <span className="break-words">{p.nombre}</span>
          </h3>
          {p.oculto && isAdmin && (
            <span className="w-fit bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
              <EyeOff size={10} /> Oculto (Solo Admin)
            </span>
          )}
        </div>
        <div className="flex gap-1 shrink-0 ml-2">
          <button 
            onClick={onPrint}
            className="p-1.5 text-pami-muted hover:text-pami-blue hover:bg-pami-blue/5 rounded-lg transition-all"
            title="Imprimir prestador"
          >
            <Printer size={14} />
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={onEdit}
                className="p-1.5 text-pami-muted hover:text-pami-blue hover:bg-pami-blue/5 rounded-lg transition-all"
                title="Editar prestador"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={onDelete}
                className="p-1.5 text-pami-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Eliminar prestador"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        {(p.direccion || p.localidad) && (
          <div className="flex items-start gap-2 text-sm text-pami-muted">
            {p.direccion ? (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.direccion}${p.localidad ? `, ${p.localidad}` : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 mt-0.5 text-pami-blue hover:scale-110 transition-transform"
                title="Ver en Google Maps"
              >
                <MapPin size={18} />
              </a>
            ) : (
              <Globe size={16} className="shrink-0 mt-0.5 opacity-60" />
            )}
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
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <MessageCircle size={16} className="shrink-0 fill-green-600/10" />
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-pami-muted">Especialidades / Prácticas</p>
            <div className="flex flex-wrap gap-1.5">
              {primarySpecs.map((e, idx) => {
                const isTopeada = unifiedTopeadas.includes(e);
                return (
                  <span key={`${e}-${idx}`} className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border flex items-center gap-1",
                    isTopeada ? "bg-red-50 text-red-600 border-red-200" : "bg-pami-blue/10 text-pami-blue border-pami-blue/20"
                  )}>
                    {e}
                    {isTopeada && <span className="text-[8px] bg-red-600 text-white px-1 rounded-sm uppercase tracking-wider">Tope Excedido</span>}
                  </span>
                );
              })}
              
              {otherSpecs.length > 0 && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={cn(
                    "text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm",
                    isExpanded 
                      ? "bg-pami-blue text-white border-pami-blue" 
                      : "bg-white text-pami-blue border-pami-blue/30 hover:bg-pami-blue/5"
                  )}
                >
                  {isExpanded ? 'VER MENOS' : `VER MÁS (${otherSpecs.length})`}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex items-center justify-center"
                  >
                    <ChevronDown size={14} strokeWidth={3} />
                  </motion.div>
                </button>
              )}
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {otherSpecs.map((e, idx) => {
                      const isTopeada = unifiedTopeadas.includes(e);
                      return (
                        <span key={`${e}-${idx}`} className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide border flex items-center gap-1",
                          isTopeada ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-500 border-gray-100"
                        )}>
                          {e}
                          {isTopeada && <span className="text-[8px] bg-red-500 text-white px-1 rounded-sm font-bold tracking-wider">Tope Excedido</span>}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {p.horariosAtencion && (
          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-xs text-pami-text flex flex-col gap-2">
            <div className="flex items-center gap-1.5 font-bold text-pami-blue">
              <Clock size={14} />
              Horarios de Atención
            </div>
            <div className="grid grid-cols-2 gap-y-1 gap-x-4">
              {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].map(dia => {
                const horario = p.horariosAtencion![dia as keyof typeof p.horariosAtencion];
                if (!horario) return null;
                const diaDisplay = {
                  lunes: 'Lunes',
                  martes: 'Martes',
                  miercoles: 'Miércoles',
                  jueves: 'Jueves',
                  viernes: 'Viernes',
                  sabado: 'Sábado'
                }[dia];
                return (
                  <div key={dia} className="flex justify-between items-center bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                    <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">{diaDisplay}</span>
                    <span className="font-medium text-pami-blue text-[11px]">{horario}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {p.notas && (
          <div className="bg-gray-50 p-3 rounded-lg text-xs text-pami-muted flex gap-2">
            <AlertCircle size={14} className="shrink-0 text-pami-muted" />
            <p>{p.notas}</p>
          </div>
        )}

        <div className="pt-4 flex items-center justify-between border-t border-gray-100 mt-auto">
          <div className="inline-flex items-center px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] font-bold text-pami-muted shadow-sm">
            {p.updatedAt?.toDate ? (
              <>
                <Calendar size={10} className="mr-1 text-emerald-600" />
                <span className="text-emerald-700/70">Actualizado:</span>
                <span className="ml-1 text-emerald-700">{p.updatedAt.toDate().toLocaleDateString()}</span>
              </>
            ) : (
              p.createdAt?.toDate ? (
                <>
                  <Calendar size={10} className="mr-1 text-blue-600" />
                  <span className="text-blue-700/70">Añadido:</span>
                  <span className="ml-1 text-blue-700">{p.createdAt.toDate().toLocaleDateString()}</span>
                </>
              ) : (
                <span className="text-[9px] opacity-40 uppercase tracking-widest italic">Sin fecha de registro</span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const LIBRARIES: ("places")[] = ["places"];

export default function App() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'viewer' | null>(null);
  const [userIsDisabled, setUserIsDisabled] = useState<boolean>(false);
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [folletos, setFolletos] = useState<Folleto[]>([]);
  const [practicas, setPracticas] = useState<PracticaOME[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestUpdate, setLatestUpdate] = useState<{ description: string, timestamp: any } | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [search, setSearch] = useState('');
  const [prestadorSearch, setPrestadorSearch] = useState('');
  const [folletoSearch, setFolletoSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'home' | 'tramites' | 'prestadores' | 'practicas' | 'centros' | 'folletos' | 'telefonos' | 'admin'>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile && activeTab === 'home') {
      setActiveTab('tramites');
    }
  }, [isMobile, activeTab]);

  const [adminSubTab, setAdminSubTab] = useState<'tramites' | 'prestadores' | 'folletos' | 'usuarios' | 'especialidades'>('tramites');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletePrestadorModalOpen, setIsDeletePrestadorModalOpen] = useState(false);
  const [isDeleteFolletoModalOpen, setIsDeleteFolletoModalOpen] = useState(false);
  const [isPrestadorModalOpen, setIsPrestadorModalOpen] = useState(false);
  const [isFolletoModalOpen, setIsFolletoModalOpen] = useState(false);
  const [isCartillaModalOpen, setIsCartillaModalOpen] = useState(false);
  const [cartillaSelections, setCartillaSelections] = useState({
    medicoCabecera: "",
    odontologo: "",
    kinesiologia: "",
    guardia: ""
  });
  const [isPracticaModalOpen, setIsPracticaModalOpen] = useState(false);
  const [isCentroModalOpen, setIsCentroModalOpen] = useState(false);
  const [isDeleteCentroModalOpen, setIsDeleteCentroModalOpen] = useState(false);
  const [editingTramite, setEditingTramite] = useState<Tramite | null>(null);
  const [prestadorSearchInForm, setPrestadorSearchInForm] = useState('');
  const [tramiteToDelete, setTramiteToDelete] = useState<Tramite | null>(null);
  const [prestadorToDelete, setPrestadorToDelete] = useState<Prestador | null>(null);
  const [folletoToDelete, setFolletoToDelete] = useState<Folleto | null>(null);
  const [practicaToDelete, setPracticaToDelete] = useState<PracticaOME | null>(null);
  const [centroToDelete, setCentroToDelete] = useState<CentroCoordinador | null>(null);
  const [isDeletePracticaModalOpen, setIsDeletePracticaModalOpen] = useState(false);
  const [isPurgeSpecialtyModalOpen, setIsPurgeSpecialtyModalOpen] = useState(false);
  const [specialtiesToPurge, setSpecialtiesToPurge] = useState<string[]>([]);
  const [selectedSpecialtiesForPurge, setSelectedSpecialtiesForPurge] = useState<string[]>([]);
  const [editingPrestador, setEditingPrestador] = useState<Prestador | null>(null);
  const [prestadorTags, setPrestadorTags] = useState<string[]>([]);
  const [editingPractica, setEditingPractica] = useState<PracticaOME | null>(null);
  const [editingCentro, setEditingCentro] = useState<CentroCoordinador | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrintingFull, setIsPrintingFull] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ nombre: string; url: string }[]>([]);
  const [manualFileName, setManualFileName] = useState('');
  const [manualFileUrl, setManualFileUrl] = useState('');
  const [selectedPrestadoresIds, setSelectedPrestadoresIds] = useState<string[]>([]);
  const [practicaSearch, setPracticaSearch] = useState('');
  const [centroSearch, setCentroSearch] = useState('');
  const [centrosCoordinadores, setCentrosCoordinadores] = useState<CentroCoordinador[]>([]);
  const [telefonos, setTelefonos] = useState<TelefonoInterno[]>([]);
  const [aiSearch, setAiSearch] = useState('');
  const [formAddress, setFormAddress] = useState("");
  const [formLocality, setFormLocality] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLocalities, setSelectedLocalities] = useState<string[]>([]);
  const [isPrintingPrestadores, setIsPrintingPrestadores] = useState(false);
  const [telefonoSearch, setTelefonoSearch] = useState('');
  const [showTopesOnly, setShowTopesOnly] = useState(false);
  const [isTelefonoModalOpen, setIsTelefonoModalOpen] = useState(false);
  const [isDeleteTelefonoModalOpen, setIsDeleteTelefonoModalOpen] = useState(false);
  const [editingTelefono, setEditingTelefono] = useState<TelefonoInterno | null>(null);
  const [editingFolleto, setEditingFolleto] = useState<Folleto | null>(null);
  const [telefonoToDelete, setTelefonoToDelete] = useState<TelefonoInterno | null>(null);
  const ITEMS_PER_PAGE = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPrestadorModalOpen) {
      setFormAddress(editingPrestador?.direccion || "");
      setFormLocality(editingPrestador?.localidad || "");
      setPrestadorTags(editingPrestador?.especialidades || []);
    }
  }, [isPrestadorModalOpen, editingPrestador]);

  useEffect(() => {
    return subscribeToLatestUpdate((update) => {
      if (update) {
        setLatestUpdate(update);
        setShowUpdateBanner(true);
      }
    });
  }, []);

  const handleAddressSelect = (address: string, locality: string) => {
    setFormAddress(address);
    if (locality) {
      setFormLocality(locality);
    }
  };

  const ADMIN_EMAILS = ['mesfede@gmail.com', 'lizasomariajose@gmail.com'];
  const isAdmin = user?.email && (ADMIN_EMAILS.includes(user.email) || userRole === 'admin');
  const isViewer = isAdmin || userRole === 'viewer';

  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSimapClick = () => {
    const url = 'https://simap.pami.org.ar/';
    const width = 1000;
    const height = 700;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    const popup = window.open(
      url, 
      'SIMAP', 
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=no,location=no,toolbar=no,menubar=no`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.open(url, '_blank');
    }
  };

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
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
            setUserIsDisabled(userDoc.data().isDisabled || false);
          } else {
            setUserRole(null);
            setUserIsDisabled(false);
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          setUserRole(null);
          setUserIsDisabled(false);
        }
      } else {
        setUserRole(null);
        setUserIsDisabled(false);
      }
      setIsAuthReady(true);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Wait until auth state is determined
    if (!isAuthReady) return;

    // Only subscribe if we have a user
    if (!user) {
      setTramites([]);
      setPrestadores([]);
      setFolletos([]);
      setPracticas([]);
      setCentrosCoordinadores([]);
      return;
    }

    const unsubscribeTramites = subscribeToTramites(setTramites);
    const unsubscribePrestadores = subscribeToPrestadores(setPrestadores);
    const unsubscribeFolletos = subscribeToFolletos(setFolletos);
    const unsubscribePracticas = subscribeToPracticas(setPracticas);
    const unsubscribeCentros = subscribeToCentrosCoordinadores(setCentrosCoordinadores);
    const unsubscribeTelefonos = subscribeToTelefonos(setTelefonos);

    testConnection();

    return () => {
      unsubscribeTramites();
      unsubscribePrestadores();
      unsubscribeFolletos();
      unsubscribePracticas();
      unsubscribeCentros();
      unsubscribeTelefonos();
    };
  }, [isAuthReady, user]);

  // Auto-migrate Expedientes and Reintegros if they are still in the old category
  const migrationRan = useRef(false);
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

    if (isAdmin && tramites.length > 0 && !migrationRan.current) {
      migrationRan.current = true;
      migrateCategories();
    }
  }, [tramites, isAdmin]);

  const migrationPrestadoresRan = useRef(false);

  useEffect(() => {
    if (isAdmin && prestadores.length > 0 && !migrationPrestadoresRan.current) {
      migrationPrestadoresRan.current = true;
      const migratePrestadores = async () => {
        const diloreto = prestadores.find(p => p.nombre.toUpperCase() === 'DI LORETO GUSTAVO');
        const gustavo = prestadores.find(p => p.nombre.toUpperCase() === 'GUSTAVO DILORETTO');
        
        if (diloreto) {
          try {
            if (gustavo) {
              const newSpecs = Array.from(new Set([...gustavo.especialidades, ...diloreto.especialidades]));
              await updatePrestador(gustavo.id, { especialidades: newSpecs });
              
              for (const t of tramites) {
                if (t.prestadoresIds?.includes(diloreto.id)) {
                  const newIds = Array.from(new Set([...t.prestadoresIds.filter(id => id !== diloreto.id), gustavo.id]));
                  await updateTramite(t.id, { prestadoresIds: newIds });
                }
              }
              
              await deletePrestador(diloreto.id);
            } else {
              await updatePrestador(diloreto.id, { nombre: 'GUSTAVO DILORETTO' });
            }
          } catch(e) {
            console.error('Migration error', e);
          }
        }
        
        try {
          await unifyIpensa();
        } catch(e) {
          console.error("IPENSA UNIFY ERR:", e);
        }

        try {
          await unifySudamericanoHospitals();
        } catch(e) {
          console.error("SUDAMERICANO UNIFY ERR:", e);
        }

        try {
          await seedDialisis();
        } catch(e) {
          console.error("DIALISIS SEED ERR:", e);
        }
      };
      migratePrestadores();
    }
  }, [prestadores, tramites, isAdmin]);

  useEffect(() => {
    if (editingTramite) {
      setUploadedFiles(editingTramite.documentos || []);
      setSelectedPrestadoresIds(editingTramite.prestadoresIds || []);
    } else {
      setUploadedFiles([]);
      setSelectedPrestadoresIds([]);
    }
    setPrestadorSearchInForm('');
  }, [editingTramite, isModalOpen]);

  const filteredTramites = useMemo(() => {
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const searchNorm = normalize(search.trim());
    const searchWords = searchNorm.split(/\s+/);

    let filtered = tramites;

    // Filter by admin rules
    if (!isAdmin) {
      filtered = filtered.filter(t => !t.oculto);
    }

    if (searchNorm !== "" || selectedCat !== 'all') {
      filtered = filtered.filter(t => {
        const nameNorm = normalize(t.nombre || "");
        const descNorm = normalize(t.descripcion || "");
        const catNorm = normalize(t.categoria || "");
        
        let matchesSearch = true;
        if (searchNorm !== "") {
          const fields = [nameNorm, descNorm, catNorm];
          const fieldsNoSpace = fields.map(f => f.replace(/\s+/g, ""));
          
          matchesSearch = searchWords.every(word => {
            const wordNoSpace = word.replace(/\s+/g, "");
            return fields.some(field => field.includes(word)) || 
                   fieldsNoSpace.some(fieldNoSpace => fieldNoSpace.includes(wordNoSpace));
          });
        }
        
        // If there's a search term, we ignore the category filter (global search)
        const matchesCat = searchNorm !== "" || selectedCat === 'all' || t.categoria === selectedCat;
        return matchesSearch && matchesCat;
      });
    }

    return filtered.sort((a, b) => {
      if (!searchNorm) {
        return (a.nombre || "").localeCompare(b.nombre || "");
      }
      
      const nameA = normalize(a.nombre || "");
      const nameB = normalize(b.nombre || "");
      
      const getScore = (name: string, desc: string, cat: string) => {
        let score = 0;
        
        // Exact full match
        if (name === searchNorm) return 1000;
        
        // Starts with search string
        if (name.startsWith(searchNorm + " ")) score += 900;
        else if (name.startsWith(searchNorm)) score += 800;
        
        // Includes as full word
        if (name.includes(" " + searchNorm + " ") || name.endsWith(" " + searchNorm)) score += 700;
        
        // Description exact / starts
        if (desc === searchNorm) score += 600;
        else if (desc.startsWith(searchNorm + " ")) score += 500;
        else if (desc.startsWith(searchNorm)) score += 400;

        // Check word fragments for partial scoring
        for (const word of searchWords) {
          // Name matching
          if (name.startsWith(word) || name.includes(" " + word)) {
            score += 50; // Starts a word
            if (name === word) score += 150; // Exact word match
          } else if (name.includes(word)) {
            score += 10; // Embedded in a word
          }
          
          // Description matching
          if (desc.startsWith(word) || desc.includes(" " + word)) {
            score += 20; // Starts a word
          } else if (desc.includes(word)) {
            score += 5; // Embedded in a word
          }
          
          // Category matching
          if (cat.startsWith(word) || cat.includes(" " + word)) {
            score += 15;
          }
        }
        return score;
      };

      const scoreA = getScore(nameA, normalize(a.descripcion || ""), normalize(a.categoria || ""));
      const scoreB = getScore(nameB, normalize(b.descripcion || ""), normalize(b.categoria || ""));

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return nameA.localeCompare(nameB);
    });
  }, [tramites, search, selectedCat, isAdmin]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCat]);

  const paginatedTramites = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTramites.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTramites, currentPage]);

  const totalPages = Math.ceil(filteredTramites.length / ITEMS_PER_PAGE);

  const allPrestadorNames = useMemo(() => {
    return Array.from(new Set(prestadores.filter(p => !p.oculto || isAdmin).map(p => p.nombre))).sort((a, b) => a.localeCompare(b));
  }, [prestadores, isAdmin]);

  const allSpecialties = useMemo(() => {
    const specs = new Set<string>();
    prestadores.forEach(p => {
      (p.especialidades || []).forEach(s => {
        if (s && s.trim()) specs.add(s.trim());
      });
    });
    return Array.from(specs).sort((a, b) => a.localeCompare(b));
  }, [prestadores]);

  const filteredPrestadores = useMemo(() => {
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const searchNorm = normalize(prestadorSearch.trim().replace(/\s+/g, ' '));
    const specialtyNorm = normalize(selectedSpecialty.replace(/\s+/g, ' '));

    if (searchNorm === "" && specialtyNorm === "") {
      return prestadores.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    const filtered = prestadores.filter(p => {
      // Hide prestadores marked as oculto for non-admins
      if (p.oculto && !isAdmin) return false;

      const nameNorm = normalize(p.nombre.replace(/\s+/g, ' '));
      const unifiedSpecs = unifyTerms(p.especialidades || []);
      const specsNorm = unifiedSpecs.map(s => normalize(s.replace(/\s+/g, ' '))).join(' ');
      const notasNorm = normalize((p.notas || '').replace(/\s+/g, ' '));
      
      const matchesText = searchNorm === "" || 
                         nameNorm.includes(searchNorm) || 
                         specsNorm.includes(searchNorm) ||
                         notasNorm.includes(searchNorm);

      const matchesDropdown = !selectedSpecialty || 
                             unifiedSpecs.some(s => normalize(s.replace(/\s+/g, ' ')) === specialtyNorm);

      return matchesText && matchesDropdown;
    });

    if (searchNorm === "") {
      const sorted = [...filtered].sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      // Priority sorting: La Plata, City Bell, Villa Elisa first
      const priorityZones = ['LA PLATA', 'CITY BELL', 'VILLA ELISA', 'GONNET', 'TOLOSA', 'RINGUELET'];
      
      return sorted.sort((a, b) => {
        const locA = (a.localidad || '').toUpperCase();
        const locB = (b.localidad || '').toUpperCase();
        
        const isPriorityA = priorityZones.some(z => locA.includes(z));
        const isPriorityB = priorityZones.some(z => locB.includes(z));
        
        if (isPriorityA && !isPriorityB) return -1;
        if (!isPriorityA && isPriorityB) return 1;
        return 0;
      });
    }

    return filtered.sort((a, b) => {
      const nameA = normalize(a.nombre);
      const nameB = normalize(b.nombre);
      const unifiedSpecsA = unifyTerms(a.especialidades || []);
      const specsNormA = unifiedSpecsA.map(s => normalize(s.replace(/\s+/g, ' '))).join(' ');
      const unifiedSpecsB = unifyTerms(b.especialidades || []);
      const specsNormB = unifiedSpecsB.map(s => normalize(s.replace(/\s+/g, ' '))).join(' ');
      
      const searchWords = searchNorm.split(/\s+/);

      const getScore = (name: string, specs: string) => {
        let score = 0;
        
        if (name === searchNorm) return 1000;
        if (name.startsWith(searchNorm + " ")) score += 900;
        else if (name.startsWith(searchNorm)) score += 800;
        if (name.includes(" " + searchNorm + " ") || name.endsWith(" " + searchNorm)) score += 700;

        if (specs === searchNorm) score += 600;
        else if (specs.startsWith(searchNorm + " ")) score += 500;
        else if (specs.startsWith(searchNorm)) score += 400;

        for (const word of searchWords) {
          if (name.startsWith(word) || name.includes(" " + word)) {
            score += 50;
            if (name === word) score += 150;
          } else if (name.includes(word)) {
            score += 10;
          }
          
          if (specs.startsWith(word) || specs.includes(" " + word)) {
            score += 20;
          } else if (specs.includes(word)) {
            score += 5;
          }
        }
        return score;
      };

      const scoreA = getScore(nameA, specsNormA);
      const scoreB = getScore(nameB, specsNormB);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return nameA.localeCompare(nameB);
    });
  }, [prestadores, prestadorSearch, selectedSpecialty]);

  const availableLocalities = useMemo(() => {
    const locs = new Set<string>();
    filteredPrestadores.forEach(p => {
      const loc = (p.localidad || 'OTRAS LOCALIDADES').trim().toUpperCase();
      locs.add(loc);
    });
    return Array.from(locs).sort();
  }, [filteredPrestadores]);

  const prestadoresToPrint = useMemo(() => {
    return filteredPrestadores.filter(p => {
      const loc = (p.localidad || 'OTRAS LOCALIDADES').trim().toUpperCase();
      return selectedLocalities.includes(loc);
    });
  }, [filteredPrestadores, selectedLocalities]);

  const handlePrintPrestadores = () => {
    if (selectedLocalities.length === 0) {
      alert("Por favor, selecciona al menos una localidad para imprimir.");
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const specialtyTitle = selectedSpecialty || prestadorSearch || 'Listado de Prestadores';
    
    // Group by locality for organized printing
    const grouped = prestadoresToPrint.reduce((acc, p) => {
      const loc = (p.localidad || 'OTRAS LOCALIDADES').toUpperCase();
      if (!acc[loc]) acc[loc] = [];
      acc[loc].push(p);
      return acc;
    }, {} as Record<string, Prestador[]>);

    const localities = Object.keys(grouped).sort((a, b) => {
      const priorityZones = ['LA PLATA', 'CITY BELL', 'VILLA ELISA', 'GONNET', 'TOLOSA', 'RINGUELET'];
      const isPriorityA = priorityZones.some(z => a.includes(z));
      const isPriorityB = priorityZones.some(z => b.includes(z));
      if (isPriorityA && !isPriorityB) return -1;
      if (!isPriorityA && isPriorityB) return 1;
      return a.localeCompare(b);
    });

    const isMedicoSearch = specialtyTitle.toUpperCase().includes('MEDICO DE CABECERA') || specialtyTitle.toUpperCase().includes('MÉDICO DE CABECERA');

    const html = `
      <html>
        <head>
          <title>Prestadores - ${specialtyTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 30px; color: #1a202c; line-height: 1.3; }
            .header { border-bottom: 2px solid #0b2344; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .specialty-title { color: #0b2344; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; flex: 1; display: flex; align-items: center; gap: 12px; }
            .specialty-title svg { color: #0b2344; flex-shrink: 0; }
            .pami-info { text-align: right; color: #718096; line-height: 1.1; }
            .pami-info .agency { font-size: 12px; font-weight: 700; color: #0b2344; }
            .pami-info .ugl { font-size: 10px; }
            .locality-section { margin-bottom: 20px; }
            .locality-title { font-size: 14px; font-weight: 700; color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; display: flex; align-items: center; gap: 6px; break-after: avoid; }
            .locality-title::before { content: ""; display: inline-block; width: 3px; height: 14px; background: #0b2344; border-radius: 1px; }
            .prestador-card { margin-bottom: 8px; padding: 8px; border: 1px solid #edf2f7; border-radius: 6px; break-inside: avoid; background-color: #fff; }
            .prestador-name { font-size: 12px; font-weight: 700; color: #1a202c; margin-bottom: 2px; text-transform: uppercase; display: flex; align-items: center; gap: 4px; }
            .prestador-name svg { color: #0b2344; flex-shrink: 0; }
            .prestador-info { font-size: 11px; color: #4a5568; display: flex; flex-direction: column; gap: 2px; }
            .info-item { display: block; }
            .horarios-grid { margin-top: 5px; display: flex; flex-direction: column; gap: 2px; background: #f8fafc; padding: 6px; border-radius: 4px; border: 1px solid #e2e8f0; }
            .horarios-title-mini { font-size: 9px; font-weight: 700; color: #0b2344; margin-bottom: 2px; text-transform: uppercase; }
            .horario-item { display: flex; flex-direction: column; justify-content: center; align-items: flex-start; font-size: 9px; border-bottom: 1px solid #f1f5f9; padding-bottom: 2px; margin-bottom: 2px; gap: 2px; }
            .horario-item:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
            .horario-item .dia { font-weight: 700; color: #64748b; text-transform: uppercase; }
            .horario-item .hora { color: #0369a1; font-weight: 600; white-space: pre-wrap; line-height: 1.2; }
            .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 9px; color: #a0aec0; text-align: center; }
            .info-item { display: flex; align-items: center; gap: 4px; }
            @media print {
              @page { margin: 1cm; }
              body { padding: 0; margin: 0; }
              .no-print { display: none; }
              .header { margin-top: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="specialty-title">
              ${isMedicoSearch 
                ? `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
                : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 7v14"/><path d="M19 21V7"/><path d="M14 7v14"/><path d="M9 7v14"/><path d="M11 2h2v5h-2z"/></svg>`
              }
              ${specialtyTitle}
            </div>
            <div class="pami-info">
              <div class="agency" style="font-size: 24px; font-family: 'Varela Round', sans-serif; color: #0b2344;"></div>
            </div>
          </div>

          ${localities.map(loc => `
            <div class="locality-section">
              <div class="locality-title">${loc}</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                ${grouped[loc].map(p => {
                  const unified = unifyTerms(p.especialidades || []);
                  const isPMedico = unified.some(s => s.toUpperCase().includes('MEDICO DE CABECERA') || s.toUpperCase().includes('MÉDICO DE CABECERA'));
                  return `
                    <div class="prestador-card">
                      <div class="prestador-name">
                        ${isPMedico 
                          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
                          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 7v14"/><path d="M19 21V7"/><path d="M14 7v14"/><path d="M9 7v14"/><path d="M11 2h2v5h-2z"/></svg>`
                        }
                        ${p.nombre}
                      </div>
                      <div class="prestador-info">
                        ${p.direccion ? `<div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#718096; flex-shrink:0;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> <span><strong>Dir:</strong> ${p.direccion}</span></div>` : ''}
                        ${p.telefono ? `<div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#718096; flex-shrink:0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> <span><strong>Tel:</strong> ${p.telefono}</span></div>` : ''}
                        ${p.whatsapp ? `<div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#25D366; flex-shrink:0;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> <span><strong>WA:</strong> ${p.whatsapp}</span></div>` : ''}
                        ${p.horariosAtencion && Object.values(p.horariosAtencion).some(v => !!v) ? `
                          <div class="horarios-grid">
                            <div class="horarios-title-mini">Horarios de Atención</div>
                            ${['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].map(dia => {
                              const hValue = p.horariosAtencion?.[dia as keyof typeof p.horariosAtencion];
                              if (!hValue) return '';
                              const hValueFormatted = hValue.replace(/\s*-\s*/g, '<br/>');
                              const diaName = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado' }[dia] || dia;
                              return `
                                <div class="horario-item">
                                  <span class="dia">${diaName}</span>
                                  <span class="hora">${hValueFormatted}</span>
                                </div>
                              `;
                            }).join('')}
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}

          <div class="footer">
            Consulta de Trámites y Prestadores
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handlePrintCartilla = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const renderPrestadorModule = (title: string, name: string) => {
      if (!name) return '';
      const p = prestadores.find((p) => p.nombre === name);
      if (!p) return '';

      return `
        <div class="cartilla-module">
          <div class="module-title">${title}</div>
          <div class="prestador-name">${p.nombre}</div>
          <div class="prestador-info">
            ${p.localidad ? `<div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#718096; flex-shrink:0;"><circle cx="12" cy="10" r="3"/><path d="M12 21c-4.2-4.7-8-8.9-8-11.5a8 8 0 1 1 16 0c0 2.6-3.8 6.8-8 11.5z"/></svg> <span><strong>Localidad:</strong> ${p.localidad}</span></div>` : ''}
            ${p.direccion ? `<div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#718096; flex-shrink:0;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> <span><strong>Dirección:</strong> ${p.direccion}</span></div>` : ''}
            ${p.telefono ? `<div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#718096; flex-shrink:0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> <span><strong>Teléfono:</strong> ${p.telefono}</span></div>` : ''}
            ${p.whatsapp ? `<div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#25D366; flex-shrink:0;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> <span><strong>WhatsApp:</strong> ${p.whatsapp}</span></div>` : ''}
            ${p.email ? `<div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#718096; flex-shrink:0;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> <span><strong>Email:</strong> ${p.email}</span></div>` : ''}
          </div>
          ${p.horariosAtencion && Object.values(p.horariosAtencion).some(v => !!v) ? `
            <div class="horarios-grid">
              <div class="horarios-title-mini">Horarios de Atención</div>
              ${['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].map(dia => {
                const hValue = p.horariosAtencion?.[dia as keyof typeof p.horariosAtencion];
                if (!hValue) return '';
                const hValueFormatted = hValue.replace(/\s*-\s*/g, '<br/>');
                return `<div class="horario-item">
                  <span class="dia">${dia.substring(0, 3)}.</span>
                  <span class="horas">${hValueFormatted}</span>
                </div>`;
              }).join('')}
            </div>
          ` : ''}
          ${p.notas ? `<div class="notas-box"><strong>Notas:</strong><br/>${p.notas}</div>` : ''}
        </div>
      `;
    };

    const modulesHtml = [
      renderPrestadorModule("Médico de Cabecera", cartillaSelections.medicoCabecera),
      renderPrestadorModule("Odontólogo", cartillaSelections.odontologo),
      renderPrestadorModule("Kinesiología", cartillaSelections.kinesiologia),
      renderPrestadorModule("Internación y Guardia", cartillaSelections.guardia)
    ].filter(html => html !== '').join('');

    const html = `
      <html>
        <head>
          <title>Cartilla de Prestadores</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Varela+Round&display=swap');
            @page { margin: 1.5cm; }
            body { font-family: 'Inter', sans-serif; color: #1a202c; line-height: 1.4; padding: 0; margin: 0; }
            .header { border-bottom: 2px solid #0b2344; padding-bottom: 10px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
            .cartilla-title { color: #0b2344; font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; }
            .pami-info { text-align: right; color: #718096; line-height: 1.1; }
            .pami-info .agency { font-size: 24px; font-weight: 700; color: #0b2344; font-family: 'Varela Round', sans-serif; }
            
            .cartilla-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            .cartilla-module {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 18px;
              background-color: #f8fafc;
              break-inside: avoid;
            }
            .module-title {
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              color: #009EE3;
              margin-bottom: 8px;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 4px;
              letter-spacing: 0.05em;
            }
            .prestador-name {
              font-size: 18px;
              font-weight: 700;
              color: #0b2344;
              margin-bottom: 10px;
              text-transform: uppercase;
              line-height: 1.2;
            }
            .prestador-info {
              display: grid;
              grid-template-columns: 1fr;
              gap: 6px;
              margin-bottom: 12px;
            }
            .info-item {
              font-size: 13px;
              color: #4a5568;
            }
            .info-item strong {
              color: #2d3748;
              font-weight: 600;
            }
            .horarios-grid {
              background: #fff;
              padding: 10px;
              border-radius: 6px;
              border: 1px dashed #cbd5e1;
              margin-top: 10px;
            }
            .horarios-title-mini { 
              font-size: 11px; 
              font-weight: 700; 
              color: #718096; 
              margin-bottom: 6px; 
              text-transform: uppercase; 
            }
            .horario-item { 
              display: flex; 
              flex-direction: column;
              justify-content: center; 
              align-items: flex-start;
              font-size: 11px;
              padding-bottom: 4px;
              margin-bottom: 4px;
              border-bottom: 1px solid #f1f5f9;
              gap: 2px;
            }
            .horario-item:last-child {
              border-bottom: none;
              padding-bottom: 0;
              margin-bottom: 0;
            }
            .horario-item .dia { font-weight: 600; color: #4a5568; text-transform: uppercase; }
            .horario-item .horas { color: #2d3748; white-space: pre-wrap; line-height: 1.2; font-weight: 600; }
            .notas-box {
              margin-top: 10px;
              padding: 10px;
              background-color: #fff;
              border-left: 3px solid #cbd5e1;
              font-size: 12px;
              color: #4a5568;
              border-radius: 0 4px 4px 0;
            }
            @media print {
              .cartilla-module {
                border: 1px solid #cbd5e1 !important;
                background-color: #f8fafc !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="cartilla-title">MI CARTILLA</div>
          </div>
          
          <div class="cartilla-grid">
            ${modulesHtml || '<div style="grid-column: span 2; text-align: center; color: #718096; padding: 40px;">No se han seleccionado prestadores para esta cartilla.</div>'}
          </div>
          
          <div style="margin-top: 30px; font-size: 11px; color: #718096; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Documento generado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}<br>
            La información contenida en esta cartilla puede estar sujeta a cambios. Ante la duda, comuníquese a su agencia mas cercana.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    setIsCartillaModalOpen(false);

    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handlePrintSinglePrestador = (p: Prestador) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const unifiedSpecs = unifyTerms(p.especialidades || []);
    const isMedicoCabecera = unifiedSpecs.some(s => 
      s.toUpperCase().includes('MEDICO DE CABECERA') || 
      s.toUpperCase().includes('MÉDICO DE CABECERA')
    );

    const html = `
      <html>
        <head>
          <title>${p.nombre} - Prestador</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 30px; color: #1a202c; line-height: 1.3; }
            .header { border-bottom: 2px solid #0b2344; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .specialty-title { color: #0b2344; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; flex: 1; display: flex; align-items: center; gap: 12px; }
            .specialty-title svg { color: #0b2344; flex-shrink: 0; }
            .pami-info { text-align: right; color: #718096; line-height: 1.1; }
            .pami-info .agency { font-size: 24px; font-weight: 700; color: #0b2344; font-family: 'Varela Round', sans-serif; }
            .prestador-card { padding: 15px; border: 1px solid #edf2f7; border-radius: 6px; background-color: #fff; }
            .prestador-name { font-size: 22px; font-weight: 700; color: #1a202c; margin-bottom: 8px; text-transform: uppercase; }
            .prestador-info { font-size: 17px; color: #4a5568; display: flex; flex-direction: column; gap: 8px; }
            .info-item { display: block; }
            .specs-list { margin-top: 15px; font-size: 15px; }
            .specs-title { font-weight: 700; font-size: 14px; text-transform: uppercase; margin-bottom: 5px; }
            .horarios-grid { margin-top: 15px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; }
            .horarios-title { font-weight: 700; font-size: 15px; text-transform: uppercase; margin-bottom: 12px; color: #0b2344; grid-column: 1 / -1; }
            .horario-item { display: flex; flex-direction: column; justify-content: center; align-items: flex-start; background: #fff; padding: 10px 14px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 15px; gap: 4px; }
            .horario-item .dia { font-weight: 700; color: #64748b; text-transform: uppercase; }
            .horario-item .hora { color: #0369a1; font-weight: 600; white-space: pre-wrap; }
            .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 9px; color: #a0aec0; text-align: center; }
            .info-item { display: flex; align-items: center; gap: 6px; }
            @media print {
              @page { margin: 1cm; }
              body { padding: 0; margin: 0; }
              .header { margin-top: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="specialty-title">
              ${isMedicoCabecera 
                ? `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
                : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 7v14"/><path d="M19 21V7"/><path d="M14 7v14"/><path d="M9 7v14"/><path d="M11 2h2v5h-2z"/></svg>`
              }
              Información del Prestador
            </div>
            <div class="pami-info">
              <div class="agency"></div>
            </div>
          </div>

          <div class="prestador-card">
            <div class="prestador-name">${p.nombre}</div>
            <div class="prestador-info">
              ${p.localidad ? `<div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#718096;"><circle cx="12" cy="10" r="3"/><path d="M12 21c-4.2-4.7-8-8.9-8-11.5a8 8 0 1 1 16 0c0 2.6-3.8 6.8-8 11.5z"/></svg> <strong>Localidad:</strong> ${p.localidad}</div>` : ''}
              ${p.direccion ? `<div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#718096;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> <strong>Dirección:</strong> ${p.direccion}</div>` : ''}
              ${p.telefono ? `<div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#718096;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> <strong>Teléfono:</strong> ${p.telefono}</div>` : ''}
              ${p.whatsapp ? `<div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#25D366;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> <strong>WhatsApp:</strong> ${p.whatsapp}</div>` : ''}
              ${p.email ? `<div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#718096;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> <strong>Email:</strong> ${p.email}</div>` : ''}
              ${p.notas ? `<div class="info-item align-top" style="align-items:flex-start; margin-top: 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#718096; margin-top:3px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> <div style="display:flex; flex-direction:column;"><strong>Notas:</strong><span>${p.notas.replace(/\n/g, '<br>')}</span></div></div>` : ''}
            </div>
            
            ${p.horariosAtencion && Object.values(p.horariosAtencion).some(v => !!v) ? `
              <div class="horarios-grid">
                <div class="horarios-title">Horarios de Atención</div>
                ${['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].map(dia => {
                  const hValue = p.horariosAtencion?.[dia as keyof typeof p.horariosAtencion];
                  if (!hValue) return '';
                  const hValueFormatted = hValue.replace(/\s*-\s*/g, '<br/>');
                  const diaName = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado' }[dia] || dia;
                  return `
                    <div class="horario-item">
                      <span class="dia">${diaName}</span>
                      <span class="hora">${hValueFormatted}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}
            
            ${p.especialidades && p.especialidades.length > 0 ? `
              <div class="specs-list">
                <div class="specs-title">Especialidades / Prácticas:</div>
                ${unifyTerms(p.especialidades || []).join(', ')}
              </div>
            ` : ''}
          </div>

          <div class="footer">
            Consulta de Trámites y Prestadores
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const toggleLocality = (loc: string) => {
    setSelectedLocalities(prev => 
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const filteredPracticas = useMemo(() => {
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const searchNorm = normalize(practicaSearch.trim());

    const searchWords = searchNorm.split(/\s+/);

    let filtered = practicas;
    
    // Si no es admin, filtramos las ocultas en todos los casos (con o sin búsqueda)
    if (!isAdmin) {
      filtered = filtered.filter(p => !p.oculto);
    }
    
    if (!searchNorm) return filtered;

    filtered = filtered.filter(p => {
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
      
      const getScore = (desc: string, sino: string, cod: string) => {
        let score = 0;
        
        // Exact matches
        if (desc === searchNorm) return 1000;
        if (cod === searchNorm) return 1000;
        if (sino === searchNorm) return 900;
        
        // Starts with search string
        if (desc.startsWith(searchNorm + " ")) score += 800;
        else if (desc.startsWith(searchNorm)) score += 700;
        
        // Includes as full word
        if (desc.includes(" " + searchNorm + " ") || desc.endsWith(" " + searchNorm)) score += 600;

        // Check word fragments
        for (const word of searchWords) {
          // Description matching
          if (desc.startsWith(word) || desc.includes(" " + word)) {
            score += 50;
            if (desc === word) score += 150;
          } else if (desc.includes(word)) {
            score += 10;
          }
          
          // Sinonimo matching
          if (sino.startsWith(word) || sino.includes(" " + word)) {
            score += 40;
          } else if (sino.includes(word)) {
            score += 5;
          }
          
          // Codigo matching
          if (cod.startsWith(word)) {
            score += 30;
          } else if (cod.includes(word)) {
            score += 5;
          }
        }
        
        return score;
      };

      const scoreA = getScore(descA, normalize(a.sinonimo || ""), normalize(a.codigo || ""));
      const scoreB = getScore(descB, normalize(b.sinonimo || ""), normalize(b.codigo || ""));

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return descA.localeCompare(descB);
    });
  }, [practicas, practicaSearch]);

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
      const searchWords = searchNorm.split(/\s+/);
      
      const getScore = (name: string) => {
        let score = 0;
        if (name === searchNorm) return 1000;
        if (name.startsWith(searchNorm + " ")) score += 900;
        else if (name.startsWith(searchNorm)) score += 800;
        if (name.includes(" " + searchNorm + " ") || name.endsWith(" " + searchNorm)) score += 700;
        
        for (const word of searchWords) {
          if (name.startsWith(word) || name.includes(" " + word)) {
            score += 50;
            if (name === word) score += 150;
          } else if (name.includes(word)) {
            score += 10;
          }
        }
        return score;
      };

      const scoreA = getScore(nameA);
      const scoreB = getScore(nameB);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return nameA.localeCompare(nameB);
    });
  }, [folletos, folletoSearch]);

  const filteredTelefonos = useMemo(() => {
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const searchNorm = normalize(telefonoSearch.trim());

    if (!searchNorm) {
      return [...telefonos].sort((a, b) => a.area.localeCompare(b.area));
    }

    return telefonos.filter(t => 
      normalize(t.area).includes(searchNorm) ||
      normalize(t.nombre).includes(searchNorm) ||
      normalize(t.interno).includes(searchNorm)
    ).sort((a, b) => a.area.localeCompare(b.area));
  }, [telefonos, telefonoSearch]);

  const groupedTelefonos = useMemo(() => {
    const groups: Record<string, TelefonoInterno[]> = {};
    filteredTelefonos.forEach(t => {
      if (!groups[t.area]) groups[t.area] = [];
      groups[t.area].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredTelefonos]);

  const filteredCentros = useMemo(() => {
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const searchNorm = normalize(centroSearch.trim());

    const processed = centrosCoordinadores.map(c => ({
      ...c,
      hospitalNormalizedLabel: normalizeHospitalName(c.hospital || "")
    }));

    if (!searchNorm) return processed.sort((a, b) => a.hospitalNormalizedLabel.localeCompare(b.hospitalNormalizedLabel));

    return processed.filter(c => {
      const hospitalNorm = normalize(c.hospitalNormalizedLabel);
      const trabajadorNorm = normalize(c.trabajador || "");
      return hospitalNorm.includes(searchNorm) || trabajadorNorm.includes(searchNorm);
    }).sort((a, b) => a.hospitalNormalizedLabel.localeCompare(b.hospitalNormalizedLabel));
  }, [centrosCoordinadores, centroSearch]);

  const groupedCentros = useMemo(() => {
    const groups: { [hospital: string]: (CentroCoordinador & { hospitalNormalizedLabel: string })[] } = {};
    filteredCentros.forEach(c => {
      const key = c.hospitalNormalizedLabel;
      if (!groups[key]) groups[key] = [];
      
      const workerKey = (c.trabajador || "").trim().toLowerCase();
      const existing = groups[key].find(x => (x.trabajador || "").trim().toLowerCase() === workerKey);
      
      if (!existing) {
        groups[key].push(c);
      }
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredCentros]);

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
      prestadoresIds: selectedPrestadoresIds,
      oculto: formData.get('oculto') === 'on'
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

  const handleSavePractica = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const practicaData: Omit<PracticaOME, 'id'> = {
      codigo: formData.get('codigo') as string,
      descripcion: formData.get('descripcion') as string,
      modulo: formData.get('modulo') as string,
      responsable: formData.get('responsable') as any,
      sinonimo: formData.get('sinonimo') as string || undefined,
      descImpresa: formData.get('descImpresa') as string || undefined,
      oculto: formData.get('oculto') === 'on'
    };

    try {
      if (editingPractica && editingPractica.id) {
        await updatePractica(editingPractica.id, practicaData);
      } else {
        await addPractica(practicaData);
      }
      setIsPracticaModalOpen(false);
      setEditingPractica(null);
    } catch (error) {
      console.error("Error saving practica:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePractica = async () => {
    if (!practicaToDelete || !practicaToDelete.id) return;
    setIsSaving(true);
    try {
      await deletePractica(practicaToDelete.id);
      setIsDeletePracticaModalOpen(false);
      setPracticaToDelete(null);
      setAdminMessage({ text: "Práctica eliminada correctamente.", type: 'success' });
    } catch (error) {
      console.error("Error deleting practica:", error);
      setAdminMessage({ text: "Error al eliminar la práctica.", type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurgeSpecialty = async () => {
    if (specialtiesToPurge.length === 0) return;
    setIsSaving(true);
    try {
      await purgeSpecialtyFromDatabase(specialtiesToPurge);
      setIsPurgeSpecialtyModalOpen(false);
      setSpecialtiesToPurge([]);
      setSelectedSpecialtiesForPurge([]);
      setAdminMessage({ 
        text: `Se han eliminado ${specialtiesToPurge.length} especialidades/prácticas de todo el sistema correctamente.`, 
        type: 'success' 
      });
    } catch (err) {
      console.error("Error purging specialty:", err);
      setAdminMessage({ text: "Error al purgar las especialidades.", type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCentro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const centroData: Omit<CentroCoordinador, 'id'> = {
      hospital: formData.get('hospital') as string,
      trabajador: formData.get('trabajador') as string,
      telefono: formData.get('telefono') as string,
    };

    try {
      if (editingCentro && editingCentro.id) {
        await updateCentroCoordinador(editingCentro.id, centroData);
      } else {
        await addCentroCoordinador(centroData);
      }
      setIsCentroModalOpen(false);
      setEditingCentro(null);
    } catch (error) {
      console.error("Error saving centro coordinador:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCentro = async () => {
    if (!centroToDelete || !centroToDelete.id) return;
    setIsSaving(true);
    try {
      await deleteCentroCoordinador(centroToDelete.id);
      setIsDeleteCentroModalOpen(false);
      setCentroToDelete(null);
    } catch (error) {
      console.error("Error deleting centro coordinador:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTelefono = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const telefonoData: Omit<TelefonoInterno, 'id'> = {
      area: formData.get('area') as string,
      nombre: formData.get('nombre') as string,
      interno: formData.get('interno') as string,
      nroInventario: formData.get('nroInventario') as string,
      descripcionBien: formData.get('descripcionBien') as string,
    };

    try {
      if (editingTelefono && editingTelefono.id) {
        await updateTelefono(editingTelefono.id, telefonoData);
      } else {
        await addTelefono(telefonoData);
      }
      setIsTelefonoModalOpen(false);
      setEditingTelefono(null);
    } catch (error) {
      console.error("Error saving telefono interno:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTelefono = async () => {
    if (!telefonoToDelete || !telefonoToDelete.id) return;
    setIsSaving(true);
    try {
      await deleteTelefono(telefonoToDelete.id);
      setIsDeleteTelefonoModalOpen(false);
      setTelefonoToDelete(null);
    } catch (error) {
      console.error("Error deleting telefono interno:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrestador = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const specsLower = ((formData.get('especialidades') as string) || '').toLowerCase();
    const isTimeTableSpecialty = specsLower.includes('cabecera') || specsLower.includes('odontolog');
    
    const data: any = {
      nombre: (formData.get('nombre') as string).toUpperCase(),
      especialidades: (formData.get('especialidades') as string).split('\n').filter(p => p.trim() !== ''),
      especialidadesTopeadas: (formData.get('especialidadesTopeadas') as string | null)?.split('\n').filter(p => p.trim() !== '') || [],
      notas: formData.get('notas') as string,
      telefono: formData.get('telefono') as string,
      whatsapp: formData.get('whatsapp') as string,
      email: formData.get('email') as string,
      direccion: formData.get('direccion') as string,
      localidad: formData.get('localidad') as string,
      oculto: formData.get('oculto') === 'on'
    };

    if (isTimeTableSpecialty) {
      data.horariosAtencion = {
        lunes: (formData.get('horario_lunes') as string) || '',
        martes: (formData.get('horario_martes') as string) || '',
        miercoles: (formData.get('horario_miercoles') as string) || '',
        jueves: (formData.get('horario_jueves') as string) || '',
        viernes: (formData.get('horario_viernes') as string) || '',
        sabado: (formData.get('horario_sabado') as string) || '',
      };
    } else {
      data.horariosAtencion = null; // Clear if not cabecera anymore
    }

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

  const handleResetTopes = () => {
    setConfirmMessage("¿Estás seguro de que deseas quitar TODOS los topes de TODOS los prestadores? Esta acción no se puede deshacer.");
    setConfirmAction(() => async () => {
      setIsSaving(true);
      try {
        const updatedCount = await resetAllTopes();
        setIsConfirmModalOpen(false);
        setAdminMessage({ 
          text: `Se resetearon los topes de ${updatedCount} prestadores exitosamente.`, 
          type: 'success' 
        });
      } catch (err) {
        console.error("Error resetting topes:", err);
        setAdminMessage({ text: "Error al resetear topes.", type: 'error' });
      } finally {
        setIsSaving(false);
      }
    });
    setIsConfirmModalOpen(true);
  };

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState("");
  const [adminMessage, setAdminMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleSeed = async () => {
    setIsSaving(true);
    setAdminMessage(null);
    try {
      const result = await seedDatabase(INITIAL_TRAMITES, INITIAL_PRESTADORES, INITIAL_FOLLETOS, PRACTICAS_OME, INITIAL_CENTROS_COORDINADORES, INITIAL_TELEFONOS);
      
      setAdminMessage({ 
        text: `Catálogo actualizado con éxito. Se agregaron ${result.addedTramites} trámites, ${result.addedPrestadores} prestadores, ${result.addedFolletos} folletos, ${result.addedPracticas} prácticas, ${result.addedCentros} centros y ${result.addedTelefonos} teléfonos nuevos.`,
        type: 'success'
      });
    } catch (err: any) {
      console.error("Error seeding database:", err);
      setAdminMessage({ 
        text: `Error al actualizar datos: ${err.message || "Error desconocido"}. Por favor, revisa la consola para más detalles.`, 
        type: 'error' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleImportPracticasCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    setAdminMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const practicas: Omit<PracticaOME, 'id'>[] = [];
          for (const row of results.data as any[]) {
            const codigo = row.COD_PRACTICA?.toString().trim();
            const descripcion = row.DESC_PRACTICA?.toString().trim();
            if (!codigo || !descripcion) continue;

            let responsable: 'Médico de Cabecera' | 'Médico Auditor' = 'Médico de Cabecera';
            if (row.RESPONSABLE && row.RESPONSABLE.toString().toUpperCase().includes('AUDITOR')) {
              responsable = 'Médico Auditor';
            }

            practicas.push({
              codigo,
              descripcion,
              modulo: row.DESC_MODULO?.toString().trim() || '',
              descImpresa: row.DESC_IMPRESA?.toString().trim() || '',
              responsable
            });
          }

          if (practicas.length === 0) {
            setAdminMessage({ text: "No se encontraron prácticas válidas en el archivo CSV (revisa que las columnas coincidan con RESPONSABLE, DESC_MODULO, COD_PRACTICA, DESC_PRACTICA, DESC_IMPRESA).", type: 'error' });
            setIsSaving(false);
            return;
          }

          const result = await importPracticasBatch(practicas);
          setAdminMessage({ text: `Se han procesado las prácticas desde el CSV. Se agregaron ${result.addedCount} nuevas y se actualizaron ${result.updatedCount} existentes.`, type: 'success' });
        } catch (err: any) {
          console.error("Error importing CSV:", err);
          setAdminMessage({ text: `Error al importar CSV: ${err.message}`, type: 'error' });
        } finally {
          if (csvInputRef.current) csvInputRef.current.value = "";
          setIsSaving(false);
        }
      },
      error: (error) => {
        console.error("Papa parse error:", error);
        setAdminMessage({ text: `Error al leer el archivo CSV: ${error.message}`, type: 'error' });
        setIsSaving(false);
        if (csvInputRef.current) csvInputRef.current.value = "";
      }
    });
  };

  const handleDownloadBackup = async () => {
    setIsSaving(true);
    setAdminMessage(null);
    try {
      const data = await getCompleteBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_pami_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setAdminMessage({ text: "¡Backup descargado exitosamente! Revise su carpeta de descargas.", type: 'success' });
    } catch (err) {
      console.error("Error downloading backup:", err);
      setAdminMessage({ text: "Error al generar el backup de datos.", type: 'error' });
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center justify-center relative z-10">
          <div className="text-5xl md:text-7xl font-black tracking-tighter relative overflow-hidden pb-2 select-none">
            <span className="text-gray-100">GuíaP!</span>
            <motion.div 
              initial={{ clipPath: "inset(100% 0 0 0)" }}
              animate={{ clipPath: ["inset(100% 0 0 0)", "inset(0% 0 0 0)", "inset(0% 0 0 0)"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", times: [0, 0.8, 1] }}
              className="absolute top-0 left-0 flex whitespace-nowrap"
            >
              <span className="text-[#0b2344]">GuíaP!</span>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-pami-text pb-20 md:pb-0">
      {!user ? (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pami-blue/5 to-pami-cyan/5">
          <Login />
        </div>
      ) : userIsDisabled ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4 border border-gray-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-pami-text">Cuenta Suspendida</h2>
            <p className="text-pami-muted">Tu cuenta ({user.email}) ha sido inhabilitada para el uso de esta aplicación.</p>
            <p className="text-sm text-pami-muted">Por favor, contacta al administrador del sistema.</p>
            <Button variant="outline" className="w-full mt-4" onClick={logout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      ) : !isViewer ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4 border border-gray-100">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-pami-text">Acceso Restringido</h2>
            <p className="text-pami-muted">Tu cuenta ({user.email}) no tiene permisos para acceder a esta aplicación.</p>
            <p className="text-sm text-pami-muted">Por favor, contacta al administrador para solicitar acceso.</p>
            <Button variant="outline" className="w-full mt-4" onClick={logout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="hidden md:block bg-pami-blue text-white sticky top-0 z-40 shadow-md">
            <div className="max-w-7xl mx-auto px-4 min-h-[4rem] py-2 flex flex-wrap items-center justify-between gap-y-2">
              <div className="flex items-center gap-2 sm:gap-3 sm:pl-6">
                <button
                  className="md:hidden p-2 -ml-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Menu"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <AnimatedLogo 
                  variant="white"
                  className="text-2xl sm:text-3xl"
                  onClick={() => {
                    setActiveTab('tramites');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold truncate max-w-[150px]">{user.displayName || user.email}</span>
                    <span className="text-[9px] uppercase tracking-wider opacity-70 font-bold">
                      {isAdmin ? 'Administrador' : 'Solo Lectura'}
                    </span>
                  </div>
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`} alt="User" className="w-8 h-8 rounded-full border-2 border-white/20" referrerPolicy="no-referrer" />
                  <Button variant="ghost" className="text-white hover:bg-white/10 p-2 h-8 w-8" onClick={logout}>
                    <LogOut size={14} />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="relative bg-pami-blue/95 backdrop-blur-sm border-t border-white/10 hidden md:block">
              <div className="max-w-7xl mx-auto px-0 sm:px-4 flex overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory overscroll-x-contain">
                <button 
                  onClick={() => setActiveTab('tramites')}
                  className={cn(
                    "px-4 sm:px-6 py-3 md:py-3.5 text-sm font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 snap-start cursor-pointer",
                    activeTab === 'tramites' ? "border-white text-white bg-white/5" : "border-transparent text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <FileText size={16} className="shrink-0" />
                  Trámites y Prácticas
                </button>
                <button 
                  onClick={() => setActiveTab('prestadores')}
                  className={cn(
                    "px-4 sm:px-6 py-3 md:py-3.5 text-sm font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 snap-start cursor-pointer",
                    activeTab === 'prestadores' ? "border-white text-white bg-white/5" : "border-transparent text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Stethoscope size={16} className="shrink-0" />
                  Prestadores
                </button>
                <button 
                  onClick={() => setActiveTab('practicas')}
                  className={cn(
                    "px-4 sm:px-6 py-3 md:py-3.5 text-sm font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 snap-start cursor-pointer",
                    activeTab === 'practicas' ? "border-white text-white bg-white/5" : "border-transparent text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Activity size={16} className="shrink-0" />
                  Prácticas OME
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('centros');
                    setCentroSearch("");
                  }}
                  className={cn(
                    "px-4 sm:px-6 py-3 md:py-3.5 text-sm font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 snap-start cursor-pointer",
                    activeTab === 'centros' ? "border-white text-white bg-white/5" : "border-transparent text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Hospital size={16} className="shrink-0" />
                  C. Coordinadores
                </button>
                <button 
                  onClick={() => setActiveTab('folletos')}
                  className={cn(
                    "px-4 sm:px-6 py-3 md:py-3.5 text-sm font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 snap-start cursor-pointer",
                    activeTab === 'folletos' ? "border-white text-white bg-white/5" : "border-transparent text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <BookOpen size={16} className="shrink-0" />
                  Folletos
                </button>
                <button 
                  onClick={() => setActiveTab('telefonos')}
                  className={cn(
                    "px-4 sm:px-6 py-3 md:py-3.5 text-sm font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 snap-start cursor-pointer",
                    activeTab === 'telefonos' ? "border-white text-white bg-white/5" : "border-transparent text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Phone size={16} className="shrink-0" />
                  Tel
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => setActiveTab('admin')}
                    className={cn(
                      "px-4 sm:px-6 py-3 md:py-3.5 text-sm font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 snap-start",
                      activeTab === 'admin' ? "border-white text-white bg-white/5" : "border-transparent text-white/70 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Settings size={16} className="shrink-0" />
                    Administrar
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="md:hidden bg-[#0a1e38] overflow-hidden border-t border-white/10"
                >
                  <div className="flex flex-col py-2 shadow-inner">
                    <button 
                      onClick={() => { setActiveTab('tramites'); setIsMobileMenuOpen(false); }}
                      className={cn(
                        "px-6 py-4 text-left text-sm font-medium transition-all flex items-center gap-3 cursor-pointer",
                        activeTab === 'tramites' ? "text-white bg-white/10" : "text-white/70 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <FileText size={18} className={activeTab === 'tramites' ? "text-white" : "text-white/50"} />
                      Trámites y Prácticas
                    </button>
                    <button 
                      onClick={() => { setActiveTab('prestadores'); setIsMobileMenuOpen(false); }}
                      className={cn(
                        "px-6 py-4 text-left text-sm font-medium transition-all flex items-center gap-3 cursor-pointer",
                        activeTab === 'prestadores' ? "text-white bg-white/10" : "text-white/70 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Stethoscope size={18} className={activeTab === 'prestadores' ? "text-white" : "text-white/50"} />
                      Prestadores
                    </button>
                    <button 
                      onClick={() => { setActiveTab('practicas'); setIsMobileMenuOpen(false); }}
                      className={cn(
                        "px-6 py-4 text-left text-sm font-medium transition-all flex items-center gap-3 cursor-pointer",
                        activeTab === 'practicas' ? "text-white bg-white/10" : "text-white/70 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Activity size={18} className={activeTab === 'practicas' ? "text-white" : "text-white/50"} />
                      Prácticas OME
                    </button>
                    <button 
                      onClick={() => { 
                        setActiveTab('centros'); 
                        setCentroSearch("");
                        setIsMobileMenuOpen(false); 
                      }}
                      className={cn(
                        "px-6 py-4 text-left text-sm font-medium transition-all flex items-center gap-3 cursor-pointer",
                        activeTab === 'centros' ? "text-white bg-white/10" : "text-white/70 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Hospital size={18} className={activeTab === 'centros' ? "text-white" : "text-white/50"} />
                      C. Coordinadores
                    </button>
                    <button 
                      onClick={() => { setActiveTab('folletos'); setIsMobileMenuOpen(false); }}
                      className={cn(
                        "px-6 py-4 text-left text-sm font-medium transition-all flex items-center gap-3 cursor-pointer",
                        activeTab === 'folletos' ? "text-white bg-white/10" : "text-white/70 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <BookOpen size={18} className={activeTab === 'folletos' ? "text-white" : "text-white/50"} />
                      Folletos
                    </button>
                    <button 
                      onClick={() => { setActiveTab('telefonos'); setIsMobileMenuOpen(false); }}
                      className={cn(
                        "px-6 py-4 text-left text-sm font-medium transition-all flex items-center gap-3 cursor-pointer",
                        activeTab === 'telefonos' ? "text-white bg-white/10" : "text-white/70 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Phone size={18} className={activeTab === 'telefonos' ? "text-white" : "text-white/50"} />
                      Tel
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }}
                        className={cn(
                          "px-6 py-4 text-left text-sm font-medium transition-all flex items-center gap-3 border-t border-white/10 mt-2 pt-4",
                          activeTab === 'admin' ? "text-white bg-white/10" : "text-white/70 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <Settings size={18} className={activeTab === 'admin' ? "text-white" : "text-white/50"} />
                        Administrar
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Integrated Search Bar for Tramites */}
            {activeTab === 'tramites' && (
              <div className="bg-white border-t border-gray-200 py-2 sm:py-2 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-2 sm:gap-4 items-center">
                  {/* Primary Search: Internal Tramites */}
                  <div className="flex-grow flex items-center gap-2 sm:gap-3 w-full md:pl-6">
                    <div className="hidden sm:flex items-center gap-2 text-pami-blue whitespace-nowrap shrink-0">
                      <Search size={16} />
                      <h3 className="text-sm font-medium">Buscar trámite</h3>
                    </div>
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pami-muted sm:text-pami-muted/70" size={16} />
                      <Input 
                        placeholder="Buscar trámite..." 
                        className="pl-9 bg-gray-50 border-gray-200 text-pami-text placeholder:text-pami-muted focus:ring-pami-blue focus:border-pami-blue focus:bg-white h-10 sm:h-9 text-sm sm:text-sm w-full transition-colors shadow-inner"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Divider Desktop */}
                  <div className="hidden md:block w-px h-6 bg-gray-200"></div>

                  <AttentionCountdown />

                  {/* Divider Desktop */}
                  <div className="hidden md:block w-px h-6 bg-gray-200"></div>

                  <div className="flex w-full md:w-auto gap-2 sm:gap-4 items-center">
                    {/* SIMAP Link */}
                    <button 
                      onClick={handleSimapClick}
                      className="flex-1 md:flex-none flex justify-center items-center gap-2 px-3 sm:px-5 py-1.5 h-10 sm:h-9 bg-pami-blue/5 hover:bg-pami-blue/10 text-[#1d438a] rounded-lg transition-all border border-pami-blue/10 shrink-0 group cursor-pointer"
                      title="Ir a SIMAP PAMI"
                    >
                      <span className="text-base sm:text-lg font-varela font-bold tracking-tight">SIMAP</span>
                    </button>

                    {/* Divider Desktop */}
                    <div className="hidden md:block w-px h-6 bg-gray-200"></div>

                    {/* Secondary Search: Google Search */}
                    <div className="flex-[2] md:w-[250px] lg:w-[300px] flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className="hidden sm:flex items-center gap-2 whitespace-nowrap shrink-0">
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
                          className="pr-10 bg-gray-50 border-gray-200 text-pami-text placeholder:text-pami-muted focus:ring-pami-cyan focus:border-pami-cyan focus:bg-white h-10 sm:h-9 text-sm w-full transition-colors shadow-inner"
                          value={aiSearch}
                          onChange={(e) => setAiSearch(e.target.value)}
                        />
                        <button 
                          type="submit"
                          disabled={!aiSearch.trim()}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-pami-cyan hover:text-pami-blue hover:bg-pami-blue/5 rounded transition-colors disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </header>

          <main className={cn("max-w-7xl mx-auto px-4 pb-8", isMobile && activeTab === 'home' ? "pt-0 px-0" : "pt-4")}>
            {isMobile && activeTab === 'home' && (
              <div className="w-full min-h-[calc(100vh-80px)] pb-24">
                {/* Mobile Header Box */}
                <div className="bg-[#009EE3] text-white rounded-b-[40px] px-6 pt-10 pb-6 relative shadow-md">
                  <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Menu size={28} />
                    </button>
                    <h1 className="text-xl font-bold tracking-wide">PAMI Gula</h1>
                    <div className="relative p-2">
                      <Bell size={24} />
                      <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#009EE3]"></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white shrink-0 shadow-inner">
                      <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold truncate">{user.displayName || "Usuario"}</h2>
                      <p className="text-sm text-blue-100 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Dashboard Grid */}
                <div className="px-6 -mt-4 relative z-10 flex flex-col gap-4">
                  
                  {/* Large Primary Card */}
                  <button 
                    onClick={() => setActiveTab('tramites')}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#e6f5fb] text-[#009EE3] flex items-center justify-center">
                        <FileText size={24} />
                      </div>
                      <span className="font-semibold text-gray-800 text-lg">Trámites y Prácticas</span>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-[#009EE3] transition-colors" />
                  </button>

                  {/* Grid 2x2 */}
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setActiveTab('prestadores')}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#f0fdf4] text-emerald-500 flex items-center justify-center">
                        <Stethoscope size={24} />
                      </div>
                      <span className="font-semibold text-gray-700 text-sm text-center line-clamp-2">Prestadores Médicos</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('practicas')}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#fdf4ff] text-purple-500 flex items-center justify-center">
                        <Activity size={24} />
                      </div>
                      <span className="font-semibold text-gray-700 text-sm text-center line-clamp-2">Prácticas OME</span>
                    </button>

                    <button 
                      onClick={() => { setActiveTab('centros'); setCentroSearch(''); }}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#fffbeb] text-amber-500 flex items-center justify-center">
                        <Hospital size={24} />
                      </div>
                      <span className="font-semibold text-gray-700 text-sm text-center leading-tight">C. Coordinadores</span>
                    </button>

                    <button 
                      onClick={() => setActiveTab('telefonos')}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#eff6ff] text-blue-500 flex items-center justify-center">
                        <Phone size={24} />
                      </div>
                      <span className="font-semibold text-gray-700 text-sm text-center">Teléfonos Internos</span>
                    </button>
                  </div>

                  <button 
                    onClick={() => setActiveTab('folletos')}
                    className="w-full mt-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-2xl p-4 shadow-md shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all font-bold text-lg"
                  >
                    <BookOpen size={22} />
                    Ver Folletos
                  </button>

                  {isAdmin && (
                    <button 
                      onClick={() => setActiveTab('admin')}
                      className="w-full mt-2 bg-gray-800 hover:bg-gray-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-center gap-3 active:scale-[0.98] transition-all font-bold text-lg"
                    >
                      <Settings size={22} />
                      Panel Administrativo
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Desktop Tramites View (when home falls back to tramites) */}

            {/* Content Container (Hidden on mobile home) */}
            {(!isMobile || activeTab !== 'home') && (
              <div className="w-full px-4 md:px-0">
            {/* LATEST UPDATE BANNER (TEST) */}
            {showUpdateBanner && latestUpdate && (
              <div className="mb-4 bg-emerald-50/80 border border-emerald-200 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm relative pr-8 transition-all">
                <div className="shrink-0 text-emerald-600">
                  <Megaphone size={12} />
                </div>
                <div className="flex items-center gap-2 text-[11px] overflow-hidden max-w-full">
                  <span className="font-bold text-emerald-700 uppercase tracking-wider shrink-0">Última actualización:</span>
                  <p className="text-emerald-900/80 truncate">{latestUpdate.description}</p>
                  <span className="text-[10px] text-emerald-700/60 font-medium whitespace-nowrap ml-1">
                    ({latestUpdate.timestamp ? new Date(latestUpdate.timestamp.seconds * 1000).toLocaleDateString('es-AR') : 'Reciente'})
                  </span>
                </div>
                <button 
                  onClick={() => setShowUpdateBanner(false)}
                  className="absolute right-1.5 p-1 text-emerald-600/60 hover:text-emerald-700 hover:bg-emerald-100/80 rounded-md transition-colors"
                  title="Ocultar nota"
                >
                  <X size={14} />
                </button>
              </div>
            )}

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
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between cursor-pointer",
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
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group relative overflow-hidden cursor-pointer",
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-grow">
                  <h2 className="text-xl sm:text-2xl font-semibold text-pami-text leading-tight">
                    {selectedCat === 'all' ? 'Todos los trámites y prácticas' : selectedCat}
                  </h2>
                  <div className="flex items-center justify-between w-full sm:w-auto">
                    {isAdmin && (
                      <Button 
                        className="text-xs py-1.5 h-auto shrink-0"
                        onClick={() => { setEditingTramite(null); setIsModalOpen(true); }}
                      >
                        <Plus size={14} className="mr-1" />
                        Nuevo
                      </Button>
                    )}
                    <span className="text-sm text-pami-muted sm:hidden shrink-0">
                      {filteredTramites.length} {filteredTramites.length === 1 ? 'trámite' : 'trámites'}
                    </span>
                  </div>
                </div>
                <span className="hidden sm:block text-sm text-pami-muted shrink-0">
                  {filteredTramites.length} {filteredTramites.length === 1 ? 'trámite encontrado' : 'trámites encontrados'}
                </span>
              </div>

              {filteredTramites.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <Search size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-pami-muted">No se encontraron trámites con estos criterios.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    {paginatedTramites.map(t => (
                      <motion.div 
                        layout
                        key={t.id}
                      className={cn(
                        "rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all",
                        CATEGORY_LIGHT_COLORS[t.categoria] || "bg-white",
                        expandedId === t.id ? "ring-2 ring-pami-blue shadow-md" : "hover:border-pami-blue/50",
                        t.oculto && "bg-gray-100/80 opacity-60 grayscale-[50%] hover:opacity-80"
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
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-pami-text uppercase truncate">{t.nombre}</h3>
                            {t.oculto && isAdmin && (
                              <span className="shrink-0 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                                <EyeOff size={10} /> Oculto (Solo Admin)
                              </span>
                            )}
                          </div>
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
                                  {t.nombre.toUpperCase() === 'DIÁLISIS' || t.nombre.toUpperCase() === 'DIALISIS' ? (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm text-left border-collapse">
                                        <thead>
                                          <tr className="border-b border-gray-200">
                                            <th className="py-2 pr-4 font-bold text-pami-blue uppercase tracking-wider text-[10px]">Centro</th>
                                            <th className="py-2 pr-4 font-bold text-pami-blue uppercase tracking-wider text-[10px]">Teléfono</th>
                                            <th className="py-2 pr-4 font-bold text-pami-blue uppercase tracking-wider text-[10px]">Dirección</th>
                                            <th className="py-2 font-bold text-pami-blue uppercase tracking-wider text-[10px]">Email</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {(t.descripcion || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>|<\/li>|<\/div>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').split('\n').map((line, idx) => {
                                            if (!line.trim()) return null;
                                            const parts = line.split('|').map(p => p.trim());
                                            return (
                                              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-2 pr-4 font-semibold text-gray-900">{parts[0]}</td>
                                                <td className="py-2 pr-4 text-pami-muted">{parts[1]}</td>
                                                <td className="py-2 pr-4 text-pami-muted">{parts[2]}</td>
                                                <td className="py-2 font-medium text-pami-cyan">
                                                  {parts[3] ? <a href={`mailto:${parts[3]}`} className="hover:underline">{parts[3]}</a> : '-'}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : t.nombre.toUpperCase() === 'ITEM' || t.nombre.toUpperCase() === 'ITEM / INSUMOS VE' || t.nombre.toUpperCase().includes('ITEM / INSUMOS VE') ? (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm text-left border-collapse">
                                        <thead>
                                          <tr className="border-b border-gray-200">
                                            <th className="py-2 pr-4 font-bold text-pami-blue uppercase tracking-wider text-[10px]">Área / Especialidad</th>
                                            <th className="py-2 pr-4 font-bold text-pami-blue uppercase tracking-wider text-[10px]">Correo Electrónico</th>
                                            <th className="py-2 font-bold text-pami-blue uppercase tracking-wider text-[10px]">Observaciones</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {(t.descripcion || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>|<\/li>|<\/div>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').split('\n').map((line, idx) => {
                                            if (!line.trim()) return null;
                                            if (line.includes('Área / \tContactos') || line.toLowerCase().startsWith('área /') && line.toLowerCase().includes('contacto')) return null;
                                            if (line.includes('Práctica') && line.includes('Dirección de mail')) return null;
                                            if (line.toLowerCase().includes('área/especialidad') && line.toLowerCase().includes('correo')) return null;
                                            
                                            let area = '';
                                            let contacto = '';
                                            let obs = '';
                                            
                                            if (line.includes('|')) {
                                              const parts = line.split('|').map(p => p.trim());
                                              area = parts[0] || '';
                                              contacto = parts[1] || '';
                                              obs = parts[2] || '';
                                            } else if (line.includes('\t')) {
                                              const parts = line.split('\t').map(p => p.trim());
                                              area = parts[0] || '';
                                              contacto = parts[1] || '';
                                              obs = parts[2] || '';
                                            } else {
                                              const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
                                              if (emailMatch && emailMatch.index !== undefined) {
                                                area = line.substring(0, emailMatch.index).trim();
                                                contacto = line.substring(emailMatch.index).trim();
                                              } else {
                                                const parts = line.split(/ {2,}/);
                                                if (parts.length > 1) {
                                                  area = parts[0].trim();
                                                  contacto = parts.slice(1).join(' ').trim();
                                                } else {
                                                  area = line.trim();
                                                  contacto = '';
                                                }
                                              }
                                            }
                                            
                                            if (!area && !contacto && !obs) return null;
                                            
                                            return (
                                              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-2.5 pr-4 font-medium text-pami-text align-top text-xs lg:w-1/4">{area}</td>
                                                <td className="py-2.5 pr-4 text-pami-muted align-top text-xs break-all sm:break-normal whitespace-pre-wrap lg:w-1/3">{contacto}</td>
                                                <td className="py-2.5 text-pami-muted align-top text-xs italic">{obs}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div 
                                      className="text-sm text-pami-muted leading-relaxed rich-text-content"
                                      dangerouslySetInnerHTML={{ __html: t.descripcion }}
                                    />
                                  )}
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
                                            
                                            const isDriveUrl = pdfDoc.url.includes('drive.google.com') || pdfDoc.url.includes('docs.google.com');
                                            
                                            if (isDriveUrl) {
                                              window.open(pdfDoc.url, '_blank');
                                              return;
                                            }

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
                                            onClick={() => window.open(doc.url, '_blank')}
                                            className="p-1.5 bg-white sm:bg-transparent hover:bg-white rounded-md text-pami-blue shadow-sm sm:shadow-none hover:shadow-sm transition-colors flex items-center justify-center"
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
                                <div className="inline-flex items-center px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-bold text-pami-muted shadow-sm">
                                  {t.updatedAt?.toDate ? (
                                    <>
                                      <Calendar size={12} className="mr-1.5 text-emerald-600" />
                                      <span className="text-emerald-700/70">Última actualización:</span>
                                      <span className="ml-1.5 text-emerald-700">{t.updatedAt.toDate().toLocaleDateString()}</span>
                                    </>
                                  ) : (
                                    t.createdAt?.toDate ? (
                                      <>
                                        <Calendar size={12} className="mr-1.5 text-blue-600" />
                                        <span className="text-blue-700/70">Añadido el:</span>
                                        <span className="ml-1.5 text-blue-700">{t.createdAt.toDate().toLocaleDateString()}</span>
                                      </>
                                    ) : ''
                                  )}
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-200 bg-white text-pami-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      <ChevronDown className="rotate-90" size={20} />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        // Mostrar solo algunas páginas si hay muchas
                        if (
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => {
                                setCurrentPage(page);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={cn(
                                "w-10 h-10 rounded-lg border text-sm font-bold transition-all",
                                currentPage === page 
                                  ? "bg-pami-blue border-pami-blue text-white shadow-md shadow-pami-blue/20" 
                                  : "bg-white border-gray-200 text-pami-text hover:border-pami-blue/50"
                              )}
                            >
                              {page}
                            </button>
                          );
                        }
                        
                        if (
                          (page === 2 && currentPage > 3) || 
                          (page === totalPages - 1 && currentPage < totalPages - 2)
                        ) {
                          return <span key={page} className="px-1 text-gray-400">...</span>;
                        }
                        
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-200 bg-white text-pami-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
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
                {(!prestadorSearch.trim() && !selectedSpecialty) ? (
                  <p className="text-sm text-pami-muted">Busque por nombre o especialidad para ver resultados</p>
                ) : (
                  <p className="text-sm text-pami-muted">{filteredPrestadores.length} centros encontrados</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {(selectedSpecialty || prestadorSearch) && filteredPrestadores.length > 0 && (
                  <>
                  <Button 
                    variant="outline" 
                    className="border-pami-blue text-pami-blue hover:bg-pami-blue/5"
                    onClick={() => {
                      setCartillaSelections({ medicoCabecera: "", odontologo: "", kinesiologia: "", guardia: "" });
                      setIsCartillaModalOpen(true);
                    }}
                  >
                    <BookOpen size={18} className="mr-2" />
                    Armar Cartilla
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-pami-cyan text-pami-cyan hover:bg-pami-cyan/5"
                    onClick={() => {
                      setSelectedLocalities([]);
                      setIsPrintingPrestadores(true);
                    }}
                  >
                    <Printer size={18} className="mr-2" />
                    Preparar Impresión
                  </Button>
                  </>
                )}
                {isAdmin && (
                  <Button 
                    onClick={() => { setEditingPrestador(null); setIsPrestadorModalOpen(true); }}
                  >
                    <Plus size={18} className="mr-2" />
                    Nuevo Prestador
                  </Button>
                )}
              </div>
            </div>

            {isPrintingPrestadores && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-pami-blue/5 border border-pami-blue/20 rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pami-blue text-white rounded-full flex items-center justify-center">
                      <Printer size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-pami-text">Opciones de Impresión</h3>
                      <p className="text-xs text-pami-muted">Selecciona qué localidades incluir en el listado para el afiliado</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsPrintingPrestadores(false)}
                    className="p-2 hover:bg-pami-blue/10 rounded-full text-pami-muted transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-pami-blue">Localidades Disponibles</p>
                  <div className="flex flex-wrap gap-2">
                    {availableLocalities.map(loc => (
                      <button
                        key={loc}
                        onClick={() => toggleLocality(loc)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border",
                          selectedLocalities.includes(loc)
                            ? "bg-pami-blue text-white border-pami-blue shadow-sm"
                            : "bg-white text-pami-muted border-gray-200 hover:border-pami-blue/30"
                        )}
                      >
                        {selectedLocalities.includes(loc) ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />}
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-pami-blue/10">
                  <span className="text-sm font-medium text-pami-blue">
                    {prestadoresToPrint.length} prestadores seleccionados para imprimir
                  </span>
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setIsPrintingPrestadores(false)}>Cancelar</Button>
                    <Button 
                      onClick={handlePrintPrestadores}
                    >
                      <Printer size={18} className="mr-2" />
                      Generar Listado para Imprimir
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-pami-muted uppercase tracking-wider">Filtrar por Especialidad o Práctica</label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-pami-muted z-10" size={18} />
                    <AutocompleteSingleSelect
                      value={selectedSpecialty}
                      onChange={setSelectedSpecialty}
                      options={allSpecialties}
                      placeholder="Todas las especialidades / prácticas"
                      emptyOptionText="Todas las especialidades / prácticas"
                      className="w-full"
                    />
                    {selectedSpecialty ? (
                      <button 
                        onClick={() => setSelectedSpecialty('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-pami-muted hover:text-red-500 transition-colors z-10"
                        title="Limpiar filtro"
                      >
                        <X size={18} />
                      </button>
                    ) : (
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-pami-muted pointer-events-none z-10" size={18} />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-pami-muted uppercase tracking-wider">Buscar por Nombre</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pami-muted z-10" size={18} />
                    <AutocompleteSingleSelect
                      value={prestadorSearch}
                      onChange={setPrestadorSearch}
                      options={allPrestadorNames}
                      placeholder="Ej: Clínica San Miguel..."
                      emptyOptionText="Todos los prestadores"
                      className="w-full"
                    />
                    {prestadorSearch && (
                      <button 
                        onClick={() => setPrestadorSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-pami-muted hover:text-red-500 transition-colors z-10"
                        title="Limpiar búsqueda"
                      >
                        <X size={18} />
                      </button>
                    )}
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
              {(!prestadorSearch.trim() && !selectedSpecialty) ? (
                <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <Search size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-pami-muted text-lg font-medium">Utilice el buscador para encontrar prestadores.</p>
                  <p className="text-pami-muted text-sm mt-2">Puede buscar por nombre o filtrar por especialidad.</p>
                </div>
              ) : filteredPrestadores.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <Search size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-pami-muted">No se encontraron prestadores con estos criterios.</p>
                </div>
              ) : (
                filteredPrestadores.map(p => (
                  <PrestadorCard 
                    key={p.id}
                    p={p}
                    isAdmin={isAdmin || false}
                    onEdit={() => { setEditingPrestador(p); setIsPrestadorModalOpen(true); }}
                    onDelete={(e) => handleDeletePrestador(p, e)}
                    onPrint={() => handlePrintSinglePrestador(p)}
                    searchTerm={prestadorSearch}
                    selectedSpecialty={selectedSpecialty}
                  />
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
              {user && (
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={csvInputRef}
                    onChange={handleImportPracticasCSV}
                  />
                  <Button 
                    variant="outline"
                    className="shrink-0 text-[#009EE3] border-[#009EE3]/20 hover:bg-[#009EE3]/5"
                    onClick={() => csvInputRef.current?.click()}
                    isLoading={isSaving}
                  >
                    <Download size={20} className="mr-2" />
                    Importar Excel (CSV)
                  </Button>
                  <Button 
                    onClick={() => {
                      setEditingPractica(null);
                      setIsPracticaModalOpen(true);
                    }}
                    className="shrink-0"
                  >
                    <Plus size={20} />
                    Nueva Práctica
                  </Button>
                </div>
              )}
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
                          {user && <th className="px-6 py-4 text-right">Acciones</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredPracticas.map((p, idx) => (
                          <tr key={`${p.codigo}-${idx}`} className={cn("hover:bg-gray-50/50 transition-colors group", p.oculto && "bg-gray-100/50 opacity-60 grayscale-[50%] hover:opacity-80")}>
                            <td className="px-6 py-4 font-mono text-sm text-pami-blue font-bold">{p.codigo}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-pami-text font-medium uppercase">{p.descripcion}</span>
                                  {p.oculto && isAdmin && (
                                    <span className="w-fit bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <EyeOff size={10} /> Oculto
                                    </span>
                                  )}
                                </div>
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
                            {user && (
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2 transition-opacity">
                                  <button 
                                    onClick={() => {
                                      setEditingPractica(p);
                                      setIsPracticaModalOpen(true);
                                    }}
                                    className="p-1.5 text-pami-muted hover:text-pami-blue hover:bg-pami-blue/5 rounded-lg transition-colors"
                                    title="Editar"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setPracticaToDelete(p);
                                      setIsDeletePracticaModalOpen(true);
                                    }}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar permanentemente"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            )}
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

        {activeTab === 'centros' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-pami-text">C. Coordinadores</h2>
                <p className="text-sm text-pami-muted">Hospitales y personal de contacto para consultas</p>
              </div>
              {user && (
                <Button 
                  onClick={() => {
                    setEditingCentro(null);
                    setIsCentroModalOpen(true);
                  }}
                  className="shrink-0"
                >
                  <Plus size={20} />
                  Nuevo Registro
                </Button>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-pami-muted uppercase tracking-wider">Buscar por Hospital o Trabajador</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pami-muted" size={18} />
                  <Input 
                    placeholder="Ej: Gonnet, Fernanda, Rossi..." 
                    className="pl-10"
                    value={centroSearch}
                    onChange={(e) => setCentroSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedCentros.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <Search size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-pami-muted">No se encontraron registros con estos criterios.</p>
                </div>
              ) : (
                groupedCentros.map(([hospital, workers]) => (
                  <motion.div 
                    key={hospital}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
                  >
                    <div className="p-5 space-y-4">
                      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="w-10 h-10 bg-pami-blue/10 rounded-xl flex items-center justify-center text-pami-blue">
                          <Hospital size={20} />
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              setActiveTab('prestadores');
                              setPrestadorSearch(hospital);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="font-bold text-pami-blue hover:text-pami-blue/80 hover:underline uppercase text-sm leading-tight text-left transition-colors"
                            title="Ver en Prestadores"
                          >
                            {hospital}
                          </button>
                          <p className="text-xs text-pami-muted font-medium mt-0.5">Centro Coordinador</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {workers.map((c) => (
                          <div key={c.id} className="group relative bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-pami-cyan shadow-sm">
                                  <Users size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-bold text-pami-muted uppercase tracking-wider">Trabajador/a</p>
                                  <p className="text-sm font-semibold text-pami-text truncate">{c.trabajador}</p>
                                </div>
                              </div>
                              {user && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => {
                                      setEditingCentro(c);
                                      setIsCentroModalOpen(true);
                                    }}
                                    className="p-1.5 text-pami-muted hover:text-pami-blue hover:bg-pami-blue/5 rounded-lg transition-colors"
                                    title="Editar"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setCentroToDelete(c);
                                      setIsDeleteCentroModalOpen(true);
                                    }}
                                    className="p-1.5 text-pami-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Borrar"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-3 p-2 bg-white rounded-lg border border-gray-100">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-6 h-6 flex items-center justify-center text-pami-blue">
                                  <Phone size={14} />
                                </div>
                                <p className="text-sm font-bold text-pami-blue truncate">{c.telefono}</p>
                              </div>
                              <a 
                                href={`https://wa.me/${c.telefono.replace(/\s+/g, '').replace(/-/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors shadow-sm"
                                title="Enviar WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
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
                          className="flex-1 bg-pami-blue text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-pami-blue/90 transition-colors flex items-center justify-center gap-2 cursor-pointer"
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

        {activeTab === 'telefonos' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-pami-text">Teléfonos Internos</h2>
                <p className="text-sm text-pami-muted">Listado de internos y áreas de la agencia</p>
              </div>
              {user && (
                <Button 
                  onClick={() => {
                    setEditingTelefono(null);
                    setIsTelefonoModalOpen(true);
                  }}
                  className="shrink-0"
                >
                  <Phone size={20} className="mr-2" />
                  Nuevo Interno
                </Button>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-pami-muted uppercase tracking-wider">Buscar por Área, Nombre o Interno</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pami-muted" size={18} />
                  <Input 
                    placeholder="Ej: Sistemas, 1093, Recursos Humanos..." 
                    className="pl-10"
                    value={telefonoSearch}
                    onChange={(e) => setTelefonoSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              {groupedTelefonos.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <Search size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-pami-muted">No se encontraron teléfonos con estos criterios.</p>
                </div>
              ) : (
                groupedTelefonos.map(([area, items]) => (
                  <motion.div 
                    key={area}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3 px-1">
                      <div className="w-8 h-8 bg-pami-blue/10 text-pami-blue rounded-lg flex items-center justify-center shrink-0">
                        <Phone size={14} />
                      </div>
                      <h3 className="font-bold text-pami-blue uppercase text-xs tracking-[0.2em]">{area}</h3>
                      <div className="h-px bg-pami-blue/10 flex-1"></div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                      {items.map((t) => (
                        <div key={t.id} className="p-4 group hover:bg-pami-blue/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-pami-muted shrink-0 group-hover:bg-white transition-colors">
                              <span className="text-xs font-bold">{t.nombre.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-pami-text leading-tight uppercase tracking-tight truncate">{t.nombre}</p>
                              {t.nroInventario && (
                                <p className="text-[10px] text-pami-muted font-mono mt-1">S/N: {t.nroInventario} {t.descripcionBien ? `| ${t.descripcionBien}` : ''}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                            <div className="text-right flex items-center gap-1.5">
                              {t.interno !== 'NO FUNCIONA' && (
                                <span className="text-pami-muted text-sm font-semibold opacity-70">439</span>
                              )}
                              <span className={cn(
                                "inline-flex items-center justify-center px-4 py-1.5 rounded-xl text-md font-black tracking-wider shadow-sm border",
                                t.interno === 'NO FUNCIONA' 
                                  ? "bg-red-50 text-red-600 border-red-100" 
                                  : "bg-pami-blue text-white border-pami-blue shadow-pami-blue/20"
                              )}>
                                {t.interno}
                              </span>
                            </div>

                            {user && (
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    setEditingTelefono(t);
                                    setIsTelefonoModalOpen(true);
                                  }}
                                  className="p-2 text-pami-muted hover:text-pami-blue hover:bg-pami-blue/5 rounded-xl transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => {
                                    setTelefonoToDelete(t);
                                    setIsDeleteTelefonoModalOpen(true);
                                  }}
                                  className="p-2 text-pami-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                  title="Borrar"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-pami-text">Panel de Administración</h2>
                <p className="text-sm text-pami-muted">Gestiona el contenido de la plataforma</p>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setAdminSubTab('tramites')}
                  className={cn(
                    "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    adminSubTab === 'tramites' ? "bg-white text-pami-blue shadow-sm" : "text-pami-muted hover:text-pami-text"
                  )}
                >
                  Trámites y Prácticas
                </button>
                <button 
                  onClick={() => setAdminSubTab('prestadores')}
                  className={cn(
                    "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                    adminSubTab === 'prestadores' ? "bg-white text-pami-blue shadow-sm" : "text-pami-muted hover:text-pami-text"
                  )}
                >
                  Prestadores
                  {prestadores.some(p => p.especialidadesTopeadas && p.especialidadesTopeadas.length > 0) && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setAdminSubTab('folletos')}
                  className={cn(
                    "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    adminSubTab === 'folletos' ? "bg-white text-pami-blue shadow-sm" : "text-pami-muted hover:text-pami-text"
                  )}
                >
                  Folletos
                </button>
                <button 
                  onClick={() => setAdminSubTab('especialidades')}
                  className={cn(
                    "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    adminSubTab === 'especialidades' ? "bg-white text-pami-blue shadow-sm" : "text-pami-muted hover:text-pami-text"
                  )}
                >
                  Gestión Especialidades
                </button>
                <button 
                  onClick={() => setAdminSubTab('usuarios')}
                  className={cn(
                    "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    adminSubTab === 'usuarios' ? "bg-white text-pami-blue shadow-sm" : "text-pami-muted hover:text-pami-text"
                  )}
                >
                  Usuarios
                </button>
              </div>
            </div>

            {adminSubTab !== 'usuarios' && (
              <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm justify-between">
                <Button variant="outline" className="text-sm py-2 px-4 shadow-sm" onClick={handleSeed} isLoading={isSaving} title="Agrega datos nuevos de la plantilla sin borrar ni duplicar lo existente">
                  <Activity size={16} className="mr-2" />
                  Actualizar Catálogo (Seguro)
                </Button>

                <Button variant="outline" className="text-sm py-2 px-4 border-[#009EE3] text-[#009EE3] hover:bg-[#009EE3]/5" onClick={handleDownloadBackup} isLoading={isSaving} title="Descarga un archivo con toda la información de PAMI en tu computadora">
                  <Download size={16} className="mr-2" />
                  Descargar Backup Completo
                </Button>
              </div>
            )}

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
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 rounded-xl border border-gray-100 gap-4">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div 
                          className={cn(
                            "w-9 h-5 rounded-full transition-colors relative border",
                            showTopesOnly ? "bg-red-500 border-red-600" : "bg-gray-200 border-gray-300"
                          )}
                          onClick={() => setShowTopesOnly(!showTopesOnly)}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all shadow-sm",
                            showTopesOnly ? "left-[18px]" : "left-0.5"
                          )}></div>
                        </div>
                        <span className="text-xs font-bold text-pami-text uppercase tracking-tight">Ver solo prestadores con topes</span>
                      </label>
                    </div>
                    
                    <button 
                      onClick={handleResetTopes}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-100 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <RotateCcw size={14} />
                      Resetear todos los topes
                    </button>
                  </div>

                  <div className="overflow-x-auto">
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
                        {prestadores
                          .filter(p => !showTopesOnly || (p.especialidadesTopeadas && p.especialidadesTopeadas.length > 0))
                          .map(p => (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4 font-medium text-pami-text uppercase">{p.nombre}</td>
                            <td className="px-6 py-4 text-sm text-pami-muted uppercase">{p.localidad || '-'}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {unifyTerms(p.especialidades || []).slice(0, 3).map((e, idx) => {
                                  const unifiedTopeadas = unifyTerms(p.especialidadesTopeadas || []);
                                  const isTopeada = unifiedTopeadas.includes(e);
                                  return (
                                    <span key={`${e}-${idx}`} className={cn(
                                      "text-[9px] px-1.5 py-0.5 rounded uppercase font-bold",
                                      isTopeada ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600"
                                    )}>
                                      {e}
                                    </span>
                                  );
                                })}
                                {(unifyTerms(p.especialidades || []).length || 0) > 3 && (
                                  <span className="text-[9px] text-pami-muted">+{unifyTerms(p.especialidades || []).length - 3}</span>
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
                  </div>
                </div>
              ) : adminSubTab === 'usuarios' ? (
                <AdminUsers />
              ) : adminSubTab === 'especialidades' ? (
                <div className="p-6">
                  <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-pami-text">Purgado Global de Especialidades</h3>
                      <p className="text-sm text-pami-muted">Selecciona uno o varios nombres de especialidades y prácticas para eliminarlos de TODO el sistema (Prestadores y Nomenclador).</p>
                    </div>
                    {selectedSpecialtiesForPurge.length > 0 && (
                      <Button 
                        variant="ghost" 
                        className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100 flex items-center gap-2 px-4 shadow-sm"
                        onClick={() => {
                          setSpecialtiesToPurge(selectedSpecialtiesForPurge);
                          setIsPurgeSpecialtyModalOpen(true);
                        }}
                      >
                        <Trash2 size={16} />
                        Eliminar Seleccionados ({selectedSpecialtiesForPurge.length})
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allSpecialties.map((s, idx) => (
                      <div 
                        key={`${s}-${idx}`} 
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all group cursor-pointer",
                          selectedSpecialtiesForPurge.includes(s) 
                            ? "bg-red-50 border-red-200" 
                            : "bg-gray-50 border-gray-100 hover:border-pami-blue/30"
                        )}
                        onClick={() => {
                          if (selectedSpecialtiesForPurge.includes(s)) {
                            setSelectedSpecialtiesForPurge(prev => prev.filter(item => item !== s));
                          } else {
                            setSelectedSpecialtiesForPurge(prev => [...prev, s]);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3 truncate pr-4">
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                            selectedSpecialtiesForPurge.includes(s) 
                              ? "bg-red-600 border-red-600 text-white" 
                              : "bg-white border-gray-300"
                          )}>
                            {selectedSpecialtiesForPurge.includes(s) && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className="text-xs font-bold uppercase truncate">{s}</span>
                        </div>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation();
                            setSpecialtiesToPurge([s]); 
                            setIsPurgeSpecialtyModalOpen(true); 
                          }}
                          className="p-1.5 text-pami-muted hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          title="Purgar de todo el sistema"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
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
        </div>
      )}
      </main>

      {/* Mobile Bottom Navigation */}
      {user && isMobile && (
        <>
          {/* Add Floating Action Button on mobile for adding if admin */}
          {isAdmin && activeTab !== 'home' && (
            <div className="fixed bottom-24 right-4 z-50">
              <button
                onClick={() => {
                  if (activeTab === 'tramites') { setEditingTramite(null); setIsModalOpen(true); }
                  else if (activeTab === 'prestadores') { setEditingPrestador(null); setIsPrestadorModalOpen(true); }
                  else if (activeTab === 'practicas') { setEditingPractica(null); setIsPracticaModalOpen(true); }
                  else if (activeTab === 'centros') { setEditingCentro(null); setIsCentroModalOpen(true); }
                  else if (activeTab === 'folletos') { setEditingFolleto(null); setIsFolletoModalOpen(true); }
                  else if (activeTab === 'telefonos') { setEditingTelefono(null); /* Add phone modal if exists */ }
                }}
                className="w-14 h-14 bg-[#009EE3] text-white rounded-full shadow-lg shadow-[#009EE3]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>
          )}
          
          {/* Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-3xl z-50 flex items-center justify-around px-6 pb-2">
            <button 
              onClick={() => setActiveTab('home')}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px]",
                activeTab === 'home' ? "text-[#009EE3]" : "text-gray-400"
              )}
            >
              <div className={cn("p-2 rounded-2xl transition-colors", activeTab === 'home' && "bg-[#009EE3]/10")}>
                <Home size={22} className={activeTab === 'home' ? "fill-[#009EE3]" : ""} />
              </div>
              <span className={cn("text-[10px] font-bold tracking-wide", activeTab === 'home' ? "text-[#009EE3]" : "")}>Home</span>
            </button>

            <button 
              onClick={() => setActiveTab('folletos')}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px]",
                activeTab === 'folletos' ? "text-[#009EE3]" : "text-gray-400"
              )}
            >
              <div className={cn("p-2 rounded-2xl transition-colors", activeTab === 'folletos' && "bg-[#009EE3]/10")}>
                <BookOpen size={22} className={activeTab === 'folletos' ? "fill-[#009EE3]" : ""} />
              </div>
              <span className={cn("text-[10px] font-bold tracking-wide", activeTab === 'folletos' ? "text-[#009EE3]" : "")}>Folletos</span>
            </button>

            {/* Center + Button / Main Action */}
            <div className="relative -top-6">
              <button 
                onClick={() => setActiveTab('tramites')}
                className="w-14 h-14 bg-[#009EE3] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#009EE3]/30 transform active:scale-95 transition-all border-4 border-[#F0F4F8]"
              >
                <FileText size={24} />
              </button>
            </div>

            <button 
              onClick={() => setActiveTab('prestadores')}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px]",
                activeTab === 'prestadores' ? "text-[#009EE3]" : "text-gray-400"
              )}
            >
              <div className={cn("p-2 rounded-2xl transition-colors", activeTab === 'prestadores' && "bg-[#009EE3]/10")}>
                <Stethoscope size={22} className={activeTab === 'prestadores' ? "fill-[#009EE3]" : ""} />
              </div>
              <span className={cn("text-[10px] font-bold tracking-wide", activeTab === 'prestadores' ? "text-[#009EE3]" : "")}>Medicos</span>
            </button>

            <button 
              onClick={() => setActiveTab('centros')}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px]",
                activeTab === 'centros' ? "text-[#009EE3]" : "text-gray-400"
              )}
            >
              <div className={cn("p-2 rounded-2xl transition-colors", activeTab === 'centros' && "bg-[#009EE3]/10")}>
                <Hospital size={22} className={activeTab === 'centros' ? "fill-[#009EE3]" : ""} />
              </div>
              <span className={cn("text-[10px] font-bold tracking-wide", activeTab === 'centros' ? "text-[#009EE3]" : "")}>Centros</span>
            </button>
          </div>
        </>
      )}

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
            <RichTextEditor 
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

          {isAdmin && (
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-red-50/50 border border-red-100 rounded-xl cursor-pointer hover:bg-red-50 transition-colors">
                <input 
                  type="checkbox" 
                  name="oculto"
                  defaultChecked={editingTramite?.oculto}
                  className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-600"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-red-800">Ocultar trámite (Prestación no disponible)</span>
                  <span className="text-xs text-red-600/80">El trámite permanecerá en el sistema pero no será visible para los usuarios normales.</span>
                </div>
              </label>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-pami-muted">Prestadores que realizan este trámite</label>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar prestador..."
                value={prestadorSearchInForm}
                onChange={(e) => setPrestadorSearchInForm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pami-cyan"
              />
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="max-h-48 overflow-y-auto p-2 space-y-1 bg-gray-50">
                {[...prestadores]
                  .filter(p => p.nombre.toLowerCase().includes(prestadorSearchInForm.toLowerCase()) || (p.localidad && p.localidad.toLowerCase().includes(prestadorSearchInForm.toLowerCase())))
                  .sort((a, b) => a.nombre.localeCompare(b.nombre))
                  .map(p => (
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

      <Modal 
        isOpen={isCartillaModalOpen} 
        onClose={() => setIsCartillaModalOpen(false)}
        title="Armar Cartilla Personalizada"
      >
        <div className="space-y-6">
          <p className="text-sm text-pami-muted mb-4">
            Seleccione los prestadores que desea incluir en la cartilla. Solo se imprimirán las secciones que tengan un prestador seleccionado.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Médico de Cabecera</label>
              <AutocompleteSingleSelect
                value={cartillaSelections.medicoCabecera}
                onChange={(val) => setCartillaSelections(prev => ({ ...prev, medicoCabecera: val }))}
                options={allPrestadorNames}
                placeholder="Buscar médico de cabecera..."
                emptyOptionText="Ninguno"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Odontólogo</label>
              <AutocompleteSingleSelect
                value={cartillaSelections.odontologo}
                onChange={(val) => setCartillaSelections(prev => ({ ...prev, odontologo: val }))}
                options={allPrestadorNames}
                placeholder="Buscar odontólogo..."
                emptyOptionText="Ninguno"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Kinesiología</label>
              <AutocompleteSingleSelect
                value={cartillaSelections.kinesiologia}
                onChange={(val) => setCartillaSelections(prev => ({ ...prev, kinesiologia: val }))}
                options={allPrestadorNames}
                placeholder="Buscar kinesiología..."
                emptyOptionText="Ninguno"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Internación y Guardia</label>
              <AutocompleteSingleSelect
                value={cartillaSelections.guardia}
                onChange={(val) => setCartillaSelections(prev => ({ ...prev, guardia: val }))}
                options={allPrestadorNames}
                placeholder="Buscar centro de internación/guardia..."
                emptyOptionText="Ninguno"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsCartillaModalOpen(false)}>Cancelar</Button>
            <Button onClick={handlePrintCartilla}>
              <Printer size={18} className="mr-2" />
              Imprimir Cartilla
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
        <form 
          onSubmit={handleSavePrestador} 
          className="space-y-6"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Nombre del Prestador</label>
            <Input name="nombre" defaultValue={editingPrestador?.nombre} required placeholder="Ej: Dr. Juan Pérez o Clínica San Miguel" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Especialidades / Prácticas</label>
            <AutocompleteTagInput 
              name="especialidades" 
              defaultValue={editingPrestador?.especialidades?.join('\n')} 
              suggestions={allSpecialties}
              placeholder="Ej: CARDIOLOGÍA, VIDEOCOLONOSCOPIA..." 
              onChange={setPrestadorTags}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Especialidades Topeadas (opcional)</label>
            <p className="text-xs text-pami-muted mb-1">Deben coincidir exactamente con el texto de arriba. Se mostrarán con un indicador "EXCEDIÓ TOPES".</p>
            <AutocompleteTagInput 
              name="especialidadesTopeadas" 
              defaultValue={editingPrestador?.especialidadesTopeadas?.join('\n')} 
              suggestions={allSpecialties}
              placeholder="Ej: TOMOGRAFIA, RESONANCIA..." 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Dirección</label>
              <AddressAutocomplete 
                defaultValue={editingPrestador?.direccion} 
                onAddressSelect={handleAddressSelect}
                isLoaded={isLoaded}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Localidad</label>
              <Input 
                name="localidad" 
                value={formLocality} 
                onChange={(e) => setFormLocality(e.target.value)}
                placeholder="Ej: La Plata" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Teléfono</label>
              <Input name="telefono" defaultValue={editingPrestador?.telefono} placeholder="Ej: 0221-483..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted flex items-center gap-1.5">
                <MessageCircle size={14} className="text-green-600" />
                WhatsApp
              </label>
              <Input name="whatsapp" defaultValue={editingPrestador?.whatsapp} placeholder="Ej: 11-6674..." />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Email</label>
            <Input name="email" type="email" defaultValue={editingPrestador?.email} placeholder="Ej: contacto@clinica.com" />
          </div>

          {prestadorTags.some(t => {
            const tl = t.toLowerCase();
            return tl.includes('cabecera') || tl.includes('odontolog');
          }) && (
            <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <label className="text-sm font-semibold text-pami-blue flex items-center gap-2">
                <Clock size={16} />
                Horarios de Atención (Médico de Cabecera / Odontología)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-pami-muted uppercase tracking-wider">Lunes</label>
                  <Input name="horario_lunes" defaultValue={editingPrestador?.horariosAtencion?.lunes} placeholder="Ej: 08:00 a 14:00" className="text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-pami-muted uppercase tracking-wider">Martes</label>
                  <Input name="horario_martes" defaultValue={editingPrestador?.horariosAtencion?.martes} placeholder="Ej: 08:00 a 14:00" className="text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-pami-muted uppercase tracking-wider">Miércoles</label>
                  <Input name="horario_miercoles" defaultValue={editingPrestador?.horariosAtencion?.miercoles} placeholder="Ej: 08:00 a 14:00" className="text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-pami-muted uppercase tracking-wider">Jueves</label>
                  <Input name="horario_jueves" defaultValue={editingPrestador?.horariosAtencion?.jueves} placeholder="Ej: 08:00 a 14:00" className="text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-pami-muted uppercase tracking-wider">Viernes</label>
                  <Input name="horario_viernes" defaultValue={editingPrestador?.horariosAtencion?.viernes} placeholder="Ej: 08:00 a 14:00" className="text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-pami-muted uppercase tracking-wider">Sábado</label>
                  <Input name="horario_sabado" defaultValue={editingPrestador?.horariosAtencion?.sabado} placeholder="Ej: 08:00 a 14:00" className="text-sm" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Notas Adicionales</label>
            <TextArea name="notas" defaultValue={editingPrestador?.notas} placeholder="Horarios, requisitos especiales, etc." />
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-red-50/50 border border-red-100 rounded-xl cursor-pointer hover:bg-red-50 transition-colors">
                <input 
                  type="checkbox" 
                  name="oculto"
                  defaultChecked={editingPrestador?.oculto}
                  className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-600"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-red-800">Ocultar prestador (No disponible temporalmente)</span>
                  <span className="text-xs text-red-600/80">El prestador permanecerá en el sistema pero no será visible para los usuarios normales.</span>
                </div>
              </label>
            </div>
          )}

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

      {/* Purge Specialty Modal */}
      <Modal 
        isOpen={isPurgeSpecialtyModalOpen} 
        onClose={() => setIsPurgeSpecialtyModalOpen(false)} 
        title={specialtiesToPurge.length > 1 ? "Eliminación Masiva" : "Eliminar de todo el sistema"}
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 text-red-700">
            <Trash2 className="shrink-0 mt-1" size={24} />
            <div>
              <p className="font-bold">
                {specialtiesToPurge.length > 1 
                  ? `¿Eliminar ${specialtiesToPurge.length} elementos seleccionados?` 
                  : `¿Eliminar "${specialtiesToPurge[0]}" de todo el sistema?`}
              </p>
              <p className="text-xs mt-2 opacity-80 leading-relaxed">
                Esta acción borrará permanentemente de TODOS los prestadores y del nomenclador los registros que coincidan exactamente con:
              </p>
              <div className="mt-3 max-h-32 overflow-y-auto bg-white/50 p-2 rounded-lg border border-red-100">
                <ul className="text-[10px] list-disc list-inside space-y-1 font-bold">
                  {specialtiesToPurge.map((s, i) => (
                    <li key={i} className="uppercase">{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setIsPurgeSpecialtyModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-red-600 hover:bg-red-700 border-red-600" 
              onClick={handlePurgeSpecialty}
              isLoading={isSaving}
            >
              Confirmar Eliminación
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

      {/* Modal for Practica OME */}
      <Modal 
        isOpen={isPracticaModalOpen} 
        onClose={() => { setIsPracticaModalOpen(false); setEditingPractica(null); }}
        title={editingPractica ? `Editar Práctica: ${editingPractica.codigo}` : "Nueva Práctica OME"}
      >
        <form onSubmit={handleSavePractica} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Código</label>
              <Input name="codigo" defaultValue={editingPractica?.codigo} required placeholder="Ej: 660101" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Módulo</label>
              <Input name="modulo" defaultValue={editingPractica?.modulo} required placeholder="Ej: MODULO 1" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Descripción</label>
            <TextArea name="descripcion" defaultValue={editingPractica?.descripcion} required placeholder="Descripción completa de la práctica" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Descripción Impresa (opcional)</label>
              <Input name="descImpresa" defaultValue={editingPractica?.descImpresa} placeholder="Como aparece en el sistema" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted">Sinónimo (opcional)</label>
              <Input name="sinonimo" defaultValue={editingPractica?.sinonimo} placeholder="Nombre alternativo" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Responsable</label>
            <select 
              name="responsable" 
              defaultValue={editingPractica?.responsable || 'Médico de Cabecera'}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pami-cyan focus:border-transparent transition-all"
              required
            >
              <option value="Médico de Cabecera">Médico de Cabecera</option>
              <option value="Médico Auditor">Médico Auditor</option>
            </select>
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-red-50/50 border border-red-100 rounded-xl cursor-pointer hover:bg-red-50 transition-colors">
                <input 
                  type="checkbox" 
                  name="oculto"
                  defaultChecked={editingPractica?.oculto}
                  className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-600"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-red-800">Ocultar práctica (No disponible temporalmente)</span>
                  <span className="text-xs text-red-600/80">La práctica permanecerá en el sistema pero no será visible para los usuarios normales.</span>
                </div>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsPracticaModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>
              <CheckCircle2 size={18} />
              <span>{editingPractica ? 'Guardar Cambios' : 'Crear Práctica'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal for Practica Delete Confirmation */}
      <Modal 
        isOpen={isDeletePracticaModalOpen} 
        onClose={() => { setIsDeletePracticaModalOpen(false); setPracticaToDelete(null); }}
        title="Confirmar Eliminación de Práctica"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl text-red-700 border border-red-100">
            <AlertCircle className="shrink-0" size={24} />
            <p className="text-sm font-medium">
              ¿Estás seguro de que deseas eliminar la práctica <span className="font-bold uppercase">"{practicaToDelete?.codigo} - {practicaToDelete?.descripcion}"</span>? Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsDeletePracticaModalOpen(false)}>Cancelar</Button>
            <Button type="button" variant="danger" onClick={handleDeletePractica} isLoading={isSaving}>
              <Trash2 size={18} />
              <span>Eliminar Práctica</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal for Centro Coordinador */}
      <Modal 
        isOpen={isCentroModalOpen} 
        onClose={() => { setIsCentroModalOpen(false); setEditingCentro(null); }}
        title={editingCentro ? `Editar Registro: ${editingCentro.hospital}` : "Nuevo Registro de Centro Coordinador"}
      >
        <form onSubmit={handleSaveCentro} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Hospital / Centro</label>
            <Input name="hospital" defaultValue={editingCentro?.hospital} required placeholder="Ej: Hospital Gonnet" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Trabajador/a</label>
            <Input name="trabajador" defaultValue={editingCentro?.trabajador} required placeholder="Ej: Fernanda Galeano" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted">Teléfono</label>
            <Input name="telefono" defaultValue={editingCentro?.telefono} required placeholder="Ej: 221 605-9898" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsCentroModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>
              <CheckCircle2 size={18} />
              <span>{editingCentro ? 'Guardar Cambios' : 'Crear Registro'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal for Centro Delete Confirmation */}
      <Modal 
        isOpen={isDeleteCentroModalOpen} 
        onClose={() => { setIsDeleteCentroModalOpen(false); setCentroToDelete(null); }}
        title="Confirmar Eliminación de Registro"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl text-red-700 border border-red-100">
            <AlertCircle className="shrink-0" size={24} />
            <p className="text-sm font-medium">
              ¿Estás seguro de que deseas eliminar el registro de <span className="font-bold uppercase">"{centroToDelete?.trabajador}"</span> en <span className="font-bold uppercase">"{centroToDelete?.hospital}"</span>? Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsDeleteCentroModalOpen(false)}>Cancelar</Button>
            <Button type="button" variant="danger" onClick={handleDeleteCentro} isLoading={isSaving}>
              <Trash2 size={18} />
              <span>Eliminar Registro</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal for Telefono Interno */}
      <Modal 
        isOpen={isTelefonoModalOpen} 
        onClose={() => { setIsTelefonoModalOpen(false); setEditingTelefono(null); }}
        title={editingTelefono ? `Editar Interno: ${editingTelefono.nombre}` : "Nuevo Interno"}
      >
        <form onSubmit={handleSaveTelefono} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted uppercase tracking-wider">Área / Sección</label>
            <Input name="area" defaultValue={editingTelefono?.area} required placeholder="Ej: AUDITORIA MEDICA" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted uppercase tracking-wider">Nombre / Sub-área</label>
            <Input name="nombre" defaultValue={editingTelefono?.nombre} required placeholder="Ej: JEFATURA" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted uppercase tracking-wider">Nro. de Interno</label>
              <Input name="interno" defaultValue={editingTelefono?.interno} required placeholder="Ej: 1093" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-pami-muted uppercase tracking-wider">Nro. de Inventario</label>
              <Input name="nroInventario" defaultValue={editingTelefono?.nroInventario} placeholder="Ej: 595306" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-pami-muted uppercase tracking-wider">Descripción del Bien</label>
            <Input name="descripcionBien" defaultValue={editingTelefono?.descripcionBien} placeholder="Ej: TELEFONO CISCO" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsTelefonoModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>
              <CheckCircle2 size={18} />
              <span>{editingTelefono ? "Guardar Cambios" : "Agregar Interno"}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal for Telefono Delete Confirmation */}
      <Modal 
        isOpen={isDeleteTelefonoModalOpen} 
        onClose={() => { setIsDeleteTelefonoModalOpen(false); setTelefonoToDelete(null); }}
        title="Confirmar Eliminación de Interno"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl text-red-700 border border-red-100">
            <AlertCircle className="shrink-0" size={24} />
            <p className="text-sm font-medium">
              ¿Estás seguro de que deseas eliminar el interno <span className="font-bold uppercase">"{telefonoToDelete?.interno}"</span> de <span className="font-bold uppercase">"{telefonoToDelete?.area}"</span>? Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsDeleteTelefonoModalOpen(false)}>Cancelar</Button>
            <Button type="button" variant="danger" onClick={handleDeleteTelefono} isLoading={isSaving}>
              <Trash2 size={18} />
              <span>Eliminar Interno</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <AnimatedLogo 
              variant="blue"
              className="text-4xl"
              onClick={() => {
                setActiveTab('tramites');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
          <p className="text-sm text-pami-muted">
            Esta es una herramienta de consulta interna para facilitar la gestión de trámites. Desarrollada por F.M
          </p>
        </div>
      </footer>
      </>
      )}
    </div>
  );
}
