
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
  "REHABILITACIÓN": "REHABILITACION",
  "AUDIOMETRIA": "AUDIOMETRIA",
  "AUDIOMETRÍA": "AUDIOMETRIA",
  "LOGOMETRIA": "LOGOMETRIA",
  "LOGOMETRÍA": "LOGOMETRIA",
  "OPTICA": "OPTICA",
  "ÓPTICA": "OPTICA",
  "AUDIFONOS": "AUDIFONOS",
  "AUDÍFONOS": "AUDIFONOS"
};

function unifySpecialty(s: string): string {
  if (!s) return "";
  const raw = s.trim();
  const norm = removeAccents(raw.toUpperCase());
  
  // Check exact map
  if (specialtyMap[norm]) return specialtyMap[norm];
  
  // Check prefix (4 letters)
  for (const [abbr, full] of Object.entries(specialtyMap)) {
    const normAbbr = removeAccents(abbr.toUpperCase());
    if (norm.length >= 4 && normAbbr.length >= 4 && norm.startsWith(normAbbr)) {
      return full;
    }
  }
  
  return norm;
}

async function run() {
  console.log("Iniciando unificación final de especialidades...");
  const snap = await getDocs(collection(db, PRESTADORES_COLLECTION));
  const operations: any[] = [];

  snap.docs.forEach(d => {
    const data = d.data();
    const originalSpecs = data.especialidades || [];
    
    let expandedSpecs: string[] = [];
    originalSpecs.forEach((s: string) => {
      if (s.includes("/")) {
        const parts = s.split("/").map(p => unifySpecialty(p));
        expandedSpecs.push(...parts);
      } else {
        expandedSpecs.push(unifySpecialty(s));
      }
    });
    
    expandedSpecs = Array.from(new Set(expandedSpecs)).filter(s => s.length > 0);
    expandedSpecs.sort();

    // Compare with original (normalized)
    const normOriginal = originalSpecs.map((s: string) => removeAccents(s.toUpperCase().trim())).sort();
    const normUnified = expandedSpecs.map((s: string) => removeAccents(s.toUpperCase().trim())).sort();

    if (JSON.stringify(normOriginal) !== JSON.stringify(normUnified) || originalSpecs.some((s: string) => s !== unifySpecialty(s))) {
      operations.push({ id: d.id, specs: expandedSpecs });
    }
  });

  console.log(`Total prestadores a actualizar: ${operations.length}`);

  if (operations.length > 0) {
    for (let i = 0; i < operations.length; i += 400) {
      const chunk = operations.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach(op => {
        batch.update(doc(db, PRESTADORES_COLLECTION, op.id), {
          especialidades: op.specs,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      console.log(`Lote ${i/400 + 1} completado.`);
    }
    console.log("Especialidades unificadas con éxito.");
  }
}

run().catch(console.error);
