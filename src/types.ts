export interface Tramite {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  pasos?: string[];
  nota?: string;
  fuente?: string;
  documentos?: { nombre: string; url: string }[];
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface Prestador {
  id: string;
  nombre: string;
  especialidades: string[];
  imagenes: string[];
}

export type Category = 
  | "Afiliaciones y expedientes"
  | "Audífonos e implantes auditivos"
  | "Consultas con especialistas"
  | "Estudios diagnósticos e imágenes"
  | "Insumos y ayudas técnicas"
  | "Internación y cuidados especiales"
  | "Kinesiología y rehabilitación"
  | "Medicamentos especiales"
  | "Nutrición"
  | "Prácticas quirúrgicas y de alta complejidad"
  | "Trámites administrativos"
  | "Salud mental"
  | "Óptica y oftalmología";

export const CATEGORIES: Category[] = [
  "Afiliaciones y expedientes",
  "Audífonos e implantes auditivos",
  "Consultas con especialistas",
  "Estudios diagnósticos e imágenes",
  "Insumos y ayudas técnicas",
  "Internación y cuidados especiales",
  "Kinesiología y rehabilitación",
  "Medicamentos especiales",
  "Nutrición",
  "Prácticas quirúrgicas y de alta complejidad",
  "Trámites administrativos",
  "Salud mental",
  "Óptica y oftalmología"
];

export const CATEGORY_ICONS: Record<string, string> = {
  "Afiliaciones y expedientes": "📋",
  "Audífonos e implantes auditivos": "🦻",
  "Consultas con especialistas": "🩺",
  "Estudios diagnósticos e imágenes": "🔬",
  "Insumos y ayudas técnicas": "🦽",
  "Internación y cuidados especiales": "🏥",
  "Kinesiología y rehabilitación": "🏃",
  "Medicamentos especiales": "💊",
  "Nutrición": "🥗",
  "Prácticas quirúrgicas y de alta complejidad": "⚕️",
  "Trámites administrativos": "🗂️",
  "Salud mental": "🧠",
  "Óptica y oftalmología": "👁️"
};
