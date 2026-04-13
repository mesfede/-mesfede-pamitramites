
import { db } from './src/firebase';
import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';

const PRESTADORES_COLLECTION = 'prestadores';

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function unifySpecialties(specs: string[]): string[] {
  if (!specs) return [];
  
  let normalized = specs.map(s => removeAccents(s.toUpperCase().trim())).filter(s => s.length > 0);
  normalized = Array.from(new Set(normalized));
  normalized.sort((a, b) => b.length - a.length);
  
  const finalSpecs: string[] = [];
  
  for (const s of normalized) {
    const isCovered = finalSpecs.some(existing => {
      if (existing === s) return true;
      if (s.length >= 4 && existing.startsWith(s)) return true;
      const abbreviations: {[key: string]: string} = {
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
        "NUTRI": "NUTRICION"
      };
      if (abbreviations[s] === existing) return true;
      return false;
    });
    
    if (!isCovered) {
      finalSpecs.push(s);
    }
  }
  
  const fullNames: {[key: string]: string} = {
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
    "PSICOLOGA": "PSICOLOGIA",
    "PSICOLOGO": "PSICOLOGIA",
    "PSIQUIATRA": "PSIQUIATRIA"
  };

  return finalSpecs.map(s => {
    for (const [abbr, full] of Object.entries(fullNames)) {
      if (s === abbr || (s.length >= 4 && full.startsWith(s))) return full;
    }
    return s;
  }).filter((v, i, a) => a.indexOf(v) === i);
}

async function run() {
  console.log("Unificando especialidades en toda la base de datos...");
  const snap = await getDocs(collection(db, PRESTADORES_COLLECTION));
  const operations: any[] = [];

  snap.docs.forEach(d => {
    const data = d.data();
    const originalSpecs = data.especialidades || [];
    const unifiedSpecs = unifySpecialties(originalSpecs);
    
    // Compare normalized versions to see if change is needed
    const normOriginal = originalSpecs.map((s: string) => removeAccents(s.toUpperCase().trim())).sort();
    const normUnified = unifiedSpecs.map((s: string) => removeAccents(s.toUpperCase().trim())).sort();

    if (JSON.stringify(normOriginal) !== JSON.stringify(normUnified)) {
      operations.push({ id: d.id, specs: unifiedSpecs });
    }
  });

  console.log(`Se encontraron ${operations.length} prestadores con especialidades para unificar.`);

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
    console.log(`Lote ${i / 400 + 1} completado.`);
  }

  console.log("Proceso finalizado.");
}

run().catch(console.error);
