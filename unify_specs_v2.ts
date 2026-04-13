
import { db } from './src/firebase';
import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';

const PRESTADORES_COLLECTION = 'prestadores';

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const specialtyMap: { [key: string]: string } = {
  "KINESO": "KINESIOLOGIA",
  "KINESIO": "KINESIOLOGIA",
  "KINESIOTERAPIA": "KINESIOLOGIA",
  "FISIOKINESIO": "KINESIOLOGIA",
  "FISIOTERAPIA": "KINESIOLOGIA",
  "FONO": "FONOAUDIOLOGIA",
  "FONOAUDIO": "FONOAUDIOLOGIA",
  "DIABETOLOGO": "DIABETOLOGIA",
  "ENDOCRINOLOGO": "ENDOCRINOLOGIA",
  "NUTRICIONISTA": "NUTRICION",
  "PSICOLOGA": "PSICOLOGIA",
  "PSICOLOGO": "PSICOLOGIA",
  "PSIQUIATRA": "PSIQUIATRIA",
  "GINECO": "GINECOLOGIA",
  "GASTRO": "GASTROENTEROLOGIA",
  "HEPATO": "HEPATOLOGIA",
  "PSICO": "PSICOLOGIA",
  "TRAUMATO": "TRAUMATOLOGIA",
  "CARDIO": "CARDIOLOGIA",
  "REUMA": "REUMATOLOGIA",
  "NEUMONO": "NEUMONOLOGIA",
  "OTORRINO": "OTORRINOLARINGOLOGIA",
  "DERMATO": "DERMATOLOGIA",
  "ENDOCRINO": "ENDOCRINOLOGIA",
  "INFECTO": "INFECTOLOGIA",
  "PEDIAT": "PEDIATRIA",
  "PSIQUIAT": "PSIQUIATRIA",
  "NUTRI": "NUTRICION",
  "REHABILITACION": "REHABILITACION",
  "AUDIOMETRIA": "AUDIOMETRIA",
  "LOGOMETRIA": "LOGOMETRIA",
  "OPTICA": "OPTICA",
  "AUDIFONOS": "AUDIFONOS"
};

function unifySpecialty(s: string): string {
  const norm = removeAccents(s.toUpperCase().trim());
  
  // Check exact map
  if (specialtyMap[norm]) return specialtyMap[norm];
  
  // Check prefix (4 letters)
  for (const [abbr, full] of Object.entries(specialtyMap)) {
    if (norm.length >= 4 && abbr.length >= 4 && norm.startsWith(abbr)) {
      return full;
    }
  }
  
  return norm;
}

async function run() {
  console.log("Iniciando unificación de especialidades v2...");
  const snap = await getDocs(collection(db, PRESTADORES_COLLECTION));
  const operations: any[] = [];

  snap.docs.forEach(d => {
    const data = d.data();
    const originalSpecs = data.especialidades || [];
    
    // Process each specialty
    let unifiedSpecs = originalSpecs.map((s: string) => unifySpecialty(s));
    
    // Handle split cases like "OTORRINO / FONOAUDIO"
    let expandedSpecs: string[] = [];
    unifiedSpecs.forEach((s: string) => {
      if (s.includes("/")) {
        const parts = s.split("/").map(p => unifySpecialty(p));
        expandedSpecs.push(...parts);
      } else {
        expandedSpecs.push(s);
      }
    });
    
    // Deduplicate
    expandedSpecs = Array.from(new Set(expandedSpecs)).filter(s => s.length > 0);
    expandedSpecs.sort();

    const normOriginal = originalSpecs.map((s: string) => removeAccents(s.toUpperCase().trim())).sort();
    const normUnified = expandedSpecs.map((s: string) => removeAccents(s.toUpperCase().trim())).sort();

    if (JSON.stringify(normOriginal) !== JSON.stringify(normUnified)) {
      console.log(`Actualizando ${data.nombre}: ${JSON.stringify(originalSpecs)} -> ${JSON.stringify(expandedSpecs)}`);
      operations.push({ id: d.id, specs: expandedSpecs });
    }
  });

  console.log(`Total prestadores a actualizar: ${operations.length}`);

  if (operations.length > 0) {
    const batch = writeBatch(db);
    operations.forEach(op => {
      batch.update(doc(db, PRESTADORES_COLLECTION, op.id), {
        especialidades: op.specs,
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
    console.log("Especialidades unificadas con éxito.");
  }
}

run().catch(console.error);
