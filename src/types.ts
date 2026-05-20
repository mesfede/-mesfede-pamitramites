export interface TelefonoInterno {
  id?: string;
  area: string;
  nombre: string;
  interno: string;
  nroInventario?: string;
  descripcionBien?: string;
}

export interface Folleto {
  id: string;
  nombre: string;
  url: string;
  createdAt?: any;
}

export interface PracticaOME {
  id?: string;
  codigo: string;
  descripcion: string;
  descImpresa?: string;
  sinonimo?: string;
  modulo: string;
  responsable: 'Médico de Cabecera' | 'Médico Auditor';
  oculto?: boolean;
}

export interface CentroCoordinador {
  id?: string;
  hospital: string;
  trabajador: string;
  telefono: string;
}

export interface Tramite {
  id: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  pasos?: string[];
  nota?: string;
  oculto?: boolean;
  documentos?: { nombre: string; url: string }[];
  prestadoresIds?: string[];
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface HorarioAtencion {
  lunes?: string;
  martes?: string;
  miercoles?: string;
  jueves?: string;
  viernes?: string;
  sabado?: string;
}

export interface Prestador {
  id: string;
  nombre: string;
  especialidades: string[];
  especialidadesTopeadas?: string[];
  telefono?: string;
  whatsapp?: string;
  email?: string;
  direccion?: string;
  localidad?: string;
  horario?: string;
  notas?: string;
  oculto?: boolean;
  horariosAtencion?: HorarioAtencion;
  createdAt?: any;
  updatedAt?: any;
}

export interface Solicitud {
  id?: string;
  uid: string;
  userEmail: string;
  type: 'tramite' | 'prestador' | 'practica' | 'telefono' | 'otro';
  action: 'add' | 'edit' | 'delete' | 'other';
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'rejected';
  adminReturnMessage?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type Category = 
  | "Afiliaciones"
  | "Audífonos e implantes auditivos"
  | "Consultas con especialistas"
  | "Estudios diagnósticos e imágenes"
  | "Expediente GDE"
  | "Insumos y ayudas técnicas"
  | "Internación y cuidados especiales"
  | "Kinesiología y rehabilitación"
  | "Medicamentos especiales"
  | "Nutrición"
  | "Óptica y oftalmología"
  | "Oxigenoterapia"
  | "Prácticas quirúrgicas y de alta complejidad"
  | "Prótesis"
  | "Reintegros"
  | "Salud mental"
  | "Trámites administrativos"
  | "Traslados"
  | "Sociales"
  | "Odontología";

export const CATEGORIES: Category[] = [
  "Afiliaciones",
  "Audífonos e implantes auditivos",
  "Consultas con especialistas",
  "Estudios diagnósticos e imágenes",
  "Expediente GDE",
  "Insumos y ayudas técnicas",
  "Internación y cuidados especiales",
  "Kinesiología y rehabilitación",
  "Medicamentos especiales",
  "Nutrición",
  "Odontología",
  "Óptica y oftalmología",
  "Oxigenoterapia",
  "Prácticas quirúrgicas y de alta complejidad",
  "Prótesis",
  "Reintegros",
  "Salud mental",
  "Sociales",
  "Trámites administrativos",
  "Traslados"
];

export const CATEGORY_ICONS: Record<string, string> = {
  "Afiliaciones": "📋",
  "Audífonos e implantes auditivos": "👂",
  "Consultas con especialistas": "🩺",
  "Estudios diagnósticos e imágenes": "🔬",
  "Expediente GDE": "📁",
  "Insumos y ayudas técnicas": "🦽",
  "Internación y cuidados especiales": "🏥",
  "Kinesiología y rehabilitación": "🏃",
  "Medicamentos especiales": "💊",
  "Nutrición": "🥗",
  "Óptica y oftalmología": "👁️",
  "Oxigenoterapia": "🌬️",
  "Prácticas quirúrgicas y de alta complejidad": "⚕️",
  "Prótesis": "👣",
  "Reintegros": "💸",
  "Salud mental": "🧠",
  "Trámites administrativos": "🗂️",
  "Traslados": "🚑",
  "Sociales": "👥",
  "Odontología": "🦷"
};

export const CATEGORY_COLORS: Record<string, string> = {
  "Afiliaciones": "bg-blue-100 text-blue-600",
  "Audífonos e implantes auditivos": "bg-amber-100 text-amber-600",
  "Consultas con especialistas": "bg-emerald-100 text-emerald-600",
  "Estudios diagnósticos e imágenes": "bg-purple-100 text-purple-600",
  "Expediente GDE": "bg-fuchsia-100 text-fuchsia-600",
  "Insumos y ayudas técnicas": "bg-orange-100 text-orange-600",
  "Internación y cuidados especiales": "bg-rose-100 text-rose-600",
  "Kinesiología y rehabilitación": "bg-lime-100 text-lime-600",
  "Medicamentos especiales": "bg-cyan-100 text-cyan-600",
  "Nutrición": "bg-green-100 text-green-600",
  "Óptica y oftalmología": "bg-teal-100 text-teal-600",
  "Oxigenoterapia": "bg-sky-100 text-sky-600",
  "Prácticas quirúrgicas y de alta complejidad": "bg-red-100 text-red-600",
  "Prótesis": "bg-pink-100 text-pink-600",
  "Reintegros": "bg-yellow-100 text-yellow-600",
  "Salud mental": "bg-indigo-100 text-indigo-600",
  "Trámites administrativos": "bg-slate-100 text-slate-600",
  "Traslados": "bg-violet-100 text-violet-600",
  "Sociales": "bg-emerald-100 text-emerald-600",
  "Odontología": "bg-sky-100 text-sky-600"
};

export const CATEGORY_LIGHT_COLORS: Record<string, string> = {
  "Afiliaciones": "bg-blue-50",
  "Audífonos e implantes auditivos": "bg-amber-50",
  "Consultas con especialistas": "bg-emerald-50",
  "Estudios diagnósticos e imágenes": "bg-purple-50",
  "Expediente GDE": "bg-fuchsia-50",
  "Insumos y ayudas técnicas": "bg-orange-50",
  "Internación y cuidados especiales": "bg-rose-50",
  "Kinesiología y rehabilitación": "bg-lime-50",
  "Medicamentos especiales": "bg-cyan-50",
  "Nutrición": "bg-green-50",
  "Óptica y oftalmología": "bg-teal-50",
  "Oxigenoterapia": "bg-sky-50",
  "Prácticas quirúrgicas y de alta complejidad": "bg-red-50",
  "Prótesis": "bg-pink-50",
  "Reintegros": "bg-yellow-50",
  "Salud mental": "bg-indigo-50",
  "Trámites administrativos": "bg-slate-50",
  "Traslados": "bg-violet-50",
  "Sociales": "bg-emerald-50",
  "Odontología": "bg-sky-50"
};
