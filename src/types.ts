export interface Tramite {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  pasos?: string[];
  nota?: string;
  documentos?: { nombre: string; url: string }[];
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface Prestador {
  id: string;
  nombre: string;
  especialidades: string[];
  practicas?: string[];
  telefono?: string;
  whatsapp?: string;
  email?: string;
  direccion?: string;
  localidad?: string;
  horario?: string;
  notas?: string;
}

export type Category = 
  | "Afiliaciones y expedientes"
  | "Audífonos e implantes auditivos"
  | "Consultas con especialistas"
  | "Estudios diagnósticos e imágenes"
  | "Expediente GDE"
  | "Insumos y ayudas técnicas"
  | "Internación y cuidados especiales"
  | "Kinesiología y rehabilitación"
  | "Medicamentos especiales"
  | "Nutrición"
  | "Prácticas quirúrgicas y de alta complejidad"
  | "Reintegros"
  | "Trámites administrativos"
  | "Salud mental"
  | "Óptica y oftalmología";

export const CATEGORIES: Category[] = [
  "Afiliaciones y expedientes",
  "Audífonos e implantes auditivos",
  "Consultas con especialistas",
  "Estudios diagnósticos e imágenes",
  "Expediente GDE",
  "Insumos y ayudas técnicas",
  "Internación y cuidados especiales",
  "Kinesiología y rehabilitación",
  "Medicamentos especiales",
  "Nutrición",
  "Prácticas quirúrgicas y de alta complejidad",
  "Reintegros",
  "Trámites administrativos",
  "Salud mental",
  "Óptica y oftalmología"
];

export const CATEGORY_ICONS: Record<string, string> = {
  "Afiliaciones y expedientes": "📋",
  "Audífonos e implantes auditivos": "🦻",
  "Consultas con especialistas": "🩺",
  "Estudios diagnósticos e imágenes": "🔬",
  "Expediente GDE": "📁",
  "Insumos y ayudas técnicas": "🦽",
  "Internación y cuidados especiales": "🏥",
  "Kinesiología y rehabilitación": "🏃",
  "Medicamentos especiales": "💊",
  "Nutrición": "🥗",
  "Prácticas quirúrgicas y de alta complejidad": "⚕️",
  "Reintegros": "💸",
  "Trámites administrativos": "🗂️",
  "Salud mental": "🧠",
  "Óptica y oftalmología": "👁️"
};

export const CATEGORY_COLORS: Record<string, string> = {
  "Afiliaciones y expedientes": "bg-blue-100 text-blue-800",
  "Audífonos e implantes auditivos": "bg-amber-100 text-amber-800",
  "Consultas con especialistas": "bg-emerald-100 text-emerald-800",
  "Estudios diagnósticos e imágenes": "bg-purple-100 text-purple-800",
  "Expediente GDE": "bg-fuchsia-100 text-fuchsia-800",
  "Insumos y ayudas técnicas": "bg-orange-100 text-orange-800",
  "Internación y cuidados especiales": "bg-rose-100 text-rose-800",
  "Kinesiología y rehabilitación": "bg-lime-100 text-lime-800",
  "Medicamentos especiales": "bg-cyan-100 text-cyan-800",
  "Nutrición": "bg-green-100 text-green-800",
  "Prácticas quirúrgicas y de alta complejidad": "bg-red-100 text-red-800",
  "Reintegros": "bg-yellow-100 text-yellow-800",
  "Trámites administrativos": "bg-slate-100 text-slate-800",
  "Salud mental": "bg-indigo-100 text-indigo-800",
  "Óptica y oftalmología": "bg-teal-100 text-teal-800"
};

export const CATEGORY_LIGHT_COLORS: Record<string, string> = {
  "Afiliaciones y expedientes": "bg-blue-50/50",
  "Audífonos e implantes auditivos": "bg-amber-50/50",
  "Consultas con especialistas": "bg-emerald-50/50",
  "Estudios diagnósticos e imágenes": "bg-purple-50/50",
  "Expediente GDE": "bg-fuchsia-50/50",
  "Insumos y ayudas técnicas": "bg-orange-50/50",
  "Internación y cuidados especiales": "bg-rose-50/50",
  "Kinesiología y rehabilitación": "bg-lime-50/50",
  "Medicamentos especiales": "bg-cyan-50/50",
  "Nutrición": "bg-green-50/50",
  "Prácticas quirúrgicas y de alta complejidad": "bg-red-50/50",
  "Reintegros": "bg-yellow-50/50",
  "Trámites administrativos": "bg-slate-50/50",
  "Salud mental": "bg-indigo-50/50",
  "Óptica y oftalmología": "bg-teal-50/50"
};
