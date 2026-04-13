
import { db } from './src/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function run() {
  const snap = await getDocs(collection(db, 'prestadores'));
  const specs = new Set<string>();
  snap.docs.forEach(d => {
    const s = d.data().especialidades;
    if (Array.isArray(s)) {
      s.forEach(spec => specs.add(spec));
    }
  });
  
  const sortedSpecs = Array.from(specs).sort();
  console.log("Especialidades encontradas en la base de datos:");
  sortedSpecs.forEach(s => console.log(`- ${s}`));
}

run().catch(console.error);
