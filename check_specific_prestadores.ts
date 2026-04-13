
import { db } from './src/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

async function run() {
  console.log("Buscando Vaccarini y Wernicke...");
  const snap = await getDocs(collection(db, 'prestadores'));
  
  snap.docs.forEach(d => {
    const name = d.data().nombre || "";
    if (name.toUpperCase().includes("VACCARINI") || name.toUpperCase().includes("WERNICKE") || name.toUpperCase().includes("WRNICKE")) {
      console.log(`ID: ${d.id} | Nombre: ${name} | Localidad: ${d.data().localidad} | Especialidades: ${JSON.stringify(d.data().especialidades)}`);
    }
  });
}

run().catch(console.error);
