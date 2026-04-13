
import { db } from './src/firebase';
import { collection, getDocs } from 'firebase/firestore';

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeNameSafe(name: string): string {
  if (!name) return "";
  let n = removeAccents(name.toUpperCase());
  
  // Only remove very common clinic/hospital prefixes to match names
  const wordsToRemove = [
    "HOSPITAL", "HTAL", "HOSP", "INSTITUTO", "INST", "INSTIT", 
    "CLINICA", "CL", "CLIN", "SANATORIO", "SANAT", "CENTRO", "CTRO", "CIEN",
    "SRL", "SA", "S.A.", "S.R.L.", "PROF", "DR", "DRA"
  ];
  
  wordsToRemove.forEach(w => {
    const reg = new RegExp(`\\b${w.replace(/\./g, "\\.")}\\b`, "g");
    n = n.replace(reg, " ");
  });
  
  n = n.replace(/[.,/()#\-]/g, " ");
  n = n.replace(/\s+/g, " ").trim();
  
  return n;
}

function normalizeLocalidad(loc: string): string {
  if (!loc) return "";
  let l = removeAccents(loc.toUpperCase());
  l = l.replace(/\(.*\)/g, ""); 
  l = l.replace(/\s+/g, " ").trim();
  return l;
}

async function run() {
  console.log("Iniciando DRY RUN de limpieza (SOLO LOGS)...");
  const snap = await getDocs(collection(db, 'prestadores'));
  const prestadores = snap.docs.map(d => ({
    id: d.id,
    data: d.data() as any
  }));

  const processedIds = new Set<string>();
  let potentialMerges = 0;

  for (let i = 0; i < prestadores.length; i++) {
    const p1 = prestadores[i];
    if (processedIds.has(p1.id)) continue;

    const n1 = normalizeNameSafe(p1.data.nombre);
    const l1 = normalizeLocalidad(p1.data.localidad);
    const group = [p1];

    for (let j = i + 1; j < prestadores.length; j++) {
      const p2 = prestadores[j];
      if (processedIds.has(p2.id)) continue;

      const n2 = normalizeNameSafe(p2.data.nombre);
      const l2 = normalizeLocalidad(p2.data.localidad);

      // EXACT MATCH ONLY for safety
      if (n1 === n2 && (l1 === l2 || l1 === "" || l2 === "")) {
        group.push(p2);
      }
    }

    if (group.length > 1) {
      potentialMerges++;
      console.log(`\n[POTENCIAL FUSION ${potentialMerges}]`);
      group.forEach(p => {
        console.log(`  - ID: ${p.id} | Nombre: "${p.data.nombre}" | Loc: "${p.data.localidad}" | Specs: ${JSON.stringify(p.data.especialidades)}`);
        processedIds.add(p.id);
      });
    }
  }

  console.log(`\nTotal grupos de duplicados potenciales encontrados: ${potentialMerges}`);
}

run().catch(console.error);
