
import { db } from './src/firebase';
import { collection, getDocs } from 'firebase/firestore';

const PRESTADORES_COLLECTION = 'prestadores';

function normalizeName(name: string): string {
  if (!name) return "";
  return name
    .toUpperCase()
    .replace(/HOSP\.|HTAL\.|HTAL|HOSPITAL/g, "HOSPITAL")
    .replace(/S\.A\.|SA|S\.R\.L\.|SRL/g, "")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function run() {
  const prestadoresSnap = await getDocs(collection(db, PRESTADORES_COLLECTION));
  const prestadores = prestadoresSnap.docs.map(d => ({
    id: d.id,
    data: d.data() as any
  }));

  const groups: { [key: string]: any[] } = {};
  prestadores.forEach(p => {
    const key = `${normalizeName(p.data.nombre)}|${p.data.localidad?.toUpperCase().trim()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  console.log("Grupos con más de un elemento:");
  for (const key in groups) {
    if (groups[key].length > 1) {
      console.log(`Key: ${key}`);
      groups[key].forEach(p => {
        console.log(`  - ID: ${p.id}, Nombre: "${p.data.nombre}", Localidad: "${p.data.localidad}", Specs: ${JSON.stringify(p.data.especialidades)}`);
      });
    }
  }
}

run().catch(console.error);
