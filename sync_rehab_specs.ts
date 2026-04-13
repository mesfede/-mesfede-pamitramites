
import { db } from './src/firebase';
import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';

const PRESTADORES_COLLECTION = 'prestadores';

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function run() {
  console.log("Sincronizando prestadores entre FISIATRIA, FISIOKINESIO y KINESIOLOGIA...");
  const snap = await getDocs(collection(db, PRESTADORES_COLLECTION));
  const operations: any[] = [];

  const targetSpecs = ["FISIATRIA", "FISIOKINESIO", "KINESIOLOGIA"];

  snap.docs.forEach(d => {
    const data = d.data();
    const originalSpecs: string[] = data.especialidades || [];
    
    // Check if the provider has ANY of the target specialties
    const hasAny = originalSpecs.some(s => {
      const norm = removeAccents(s.toUpperCase().trim());
      return targetSpecs.includes(norm) || norm === "KINESIO" || norm === "FISIOTERAPIA" || norm === "KINESIOTERAPIA";
    });

    if (hasAny) {
      // Create a new set of specialties that includes ALL three target ones
      let newSpecs = [...originalSpecs];
      
      // Add missing ones
      targetSpecs.forEach(ts => {
        if (!newSpecs.some(s => removeAccents(s.toUpperCase().trim()) === ts)) {
          newSpecs.push(ts);
        }
      });

      // Clean up old/abbreviated terms if they exist to keep it tidy
      newSpecs = newSpecs.filter(s => {
        const norm = removeAccents(s.toUpperCase().trim());
        return !["KINESIO", "FISIOTERAPIA", "KINESIOTERAPIA"].includes(norm);
      });

      newSpecs = Array.from(new Set(newSpecs)).sort();

      // Compare to see if update is needed
      const sortedOriginal = [...originalSpecs].sort();
      if (JSON.stringify(sortedOriginal) !== JSON.stringify(newSpecs)) {
        console.log(`Actualizando ${data.nombre}: Agregando bloque de rehabilitación.`);
        operations.push({ id: d.id, specs: newSpecs });
      }
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
    console.log("Sincronización completada con éxito.");
  }
}

run().catch(console.error);
