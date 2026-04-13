
import { db } from './src/firebase';
import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';

const PRESTADORES_COLLECTION = 'prestadores';

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeName(name: string): string {
  if (!name) return "";
  let n = removeAccents(name.toUpperCase());
  
  // Remove common descriptive words entirely for the matching key
  const wordsToRemove = [
    "HOSPITAL", "HTAL", "HOSP", "INSTITUTO", "INST", "INSTIT", 
    "CLINICA", "CL", "CLIN", "SANATORIO", "SANAT", "CENTRO", "CTRO", "CIEN",
    "PRIVADO", "PRIV", "PR", "GENERAL", "GRAL", "ZONAL", "AGUDOS", "CRONICOS", 
    "ESPECIALIZADO", "ESPECIALIZADA", "PROF", "DR", "DRA", "SRL", "SA", "S.A.", "S.R.L.",
    "DE", "LA", "EL", "LOS", "LAS", "Y", "E", "EN", "DEL", "S.E.", "S.H."
  ];
  
  // Replace words with spaces
  wordsToRemove.forEach(w => {
    const reg = new RegExp(`\\b${w.replace(/\./g, "\\.")}\\b`, "g");
    n = n.replace(reg, " ");
  });
  
  // Punctuation and extra spaces
  n = n.replace(/[.,/()#\-]/g, " ");
  n = n.replace(/\s+/g, " ").trim();
  
  return n;
}

function normalizeLocalidad(loc: string): string {
  if (!loc) return "";
  let l = removeAccents(loc.toUpperCase());
  l = l.replace(/\(.*\)/g, ""); // Remove parenthetical info like "(PDO. LA PLATA)"
  l = l.replace(/\s+/g, " ").trim();
  return l;
}

function unifySpecialties(specs: string[]): string[] {
  if (!specs) return [];
  
  // First, normalize all to uppercase and remove accents
  let normalized = specs.map(s => removeAccents(s.toUpperCase().trim())).filter(s => s.length > 0);
  
  // Remove duplicates initially
  normalized = Array.from(new Set(normalized));
  
  // Sort by length descending so we find the longest matches first
  normalized.sort((a, b) => b.length - a.length);
  
  const finalSpecs: string[] = [];
  
  for (const s of normalized) {
    // Check if this specialty is already covered by a longer one
    const isCovered = finalSpecs.some(existing => {
      if (existing === s) return true;
      // The "4 letters prefix" rule
      if (s.length >= 4 && existing.startsWith(s)) return true;
      // Also check if s is a common abbreviation of existing
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
  
  // Final pass to replace common ones with full names
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

async function runRobust() {
  console.log("Iniciando limpieza agresiva de duplicados...");
  const prestadoresSnap = await getDocs(collection(db, PRESTADORES_COLLECTION));
  const prestadores = prestadoresSnap.docs.map(d => ({
    id: d.id,
    data: d.data() as any
  }));

  const operations: any[] = [];
  const processedIds = new Set<string>();

  // Sort by name length descending to use longer names as representatives if possible
  prestadores.sort((a, b) => (b.data.nombre || "").length - (a.data.nombre || "").length);

  for (let i = 0; i < prestadores.length; i++) {
    const p1 = prestadores[i];
    if (processedIds.has(p1.id)) continue;

    const group = [p1];
    processedIds.add(p1.id);
    const n1 = normalizeName(p1.data.nombre);
    const l1 = normalizeLocalidad(p1.data.localidad);

    for (let j = i + 1; j < prestadores.length; j++) {
      const p2 = prestadores[j];
      if (processedIds.has(p2.id)) continue;

      const n2 = normalizeName(p2.data.nombre);
      const l2 = normalizeLocalidad(p2.data.localidad);

      // Check name similarity
      let nameMatch = (n1 === n2);
      if (!nameMatch && n1.length > 5 && n2.length > 5) {
        // Prefix matching
        if (n1.startsWith(n2) || n2.startsWith(n1)) {
          nameMatch = true;
        }
      }

      if (nameMatch) {
        // Check locality compatibility
        if (l1 === l2 || l1 === "" || l2 === "") {
          group.push(p2);
          processedIds.add(p2.id);
          console.log(`[DEBUG] Agrupando: "${p1.data.nombre}" (${p1.id}) con "${p2.data.nombre}" (${p2.id}) - Nombres: "${n1}" vs "${n2}" - Locs: "${l1}" vs "${l2}"`);
        } else {
          console.log(`[DEBUG] Nombres coinciden pero localidades no: "${p1.data.nombre}" (${l1}) vs "${p2.data.nombre}" (${l2})`);
        }
      }
    }

    // Merge group
    let mergedSpecs: string[] = [];
    let bestLocalidad = p1.data.localidad || "";
    let bestDireccion = p1.data.direccion || "";
    let bestTelefono = p1.data.telefono || "";
    let bestEmail = p1.data.email || "";
    let bestWhatsapp = p1.data.whatsapp || "";
    let bestNombre = p1.data.nombre || "";

    group.forEach(p => {
      mergedSpecs = [...mergedSpecs, ...(p.data.especialidades || [])];
      if (!bestLocalidad || (bestLocalidad.length < (p.data.localidad || "").length)) bestLocalidad = p.data.localidad;
      if (!bestDireccion || (bestDireccion.length < (p.data.direccion || "").length)) bestDireccion = p.data.direccion;
      if (!bestTelefono || (bestTelefono.length < (p.data.telefono || "").length)) bestTelefono = p.data.telefono;
      if (!bestEmail || (bestEmail.length < (p.data.email || "").length)) bestEmail = p.data.email;
      if (!bestWhatsapp || (bestWhatsapp.length < (p.data.whatsapp || "").length)) bestWhatsapp = p.data.whatsapp;
      if (p.data.nombre.length > bestNombre.length) bestNombre = p.data.nombre;
    });

    const unifiedSpecs = unifySpecialties(mergedSpecs);
    const main = group[0];
    const others = group.slice(1);

    const currentSpecs = (main.data.especialidades || []).map((s: string) => removeAccents(s.toUpperCase().trim()));
    const needsUpdate = JSON.stringify(currentSpecs.sort()) !== JSON.stringify(unifiedSpecs.sort()) || 
                        main.data.localidad !== bestLocalidad ||
                        main.data.nombre !== bestNombre ||
                        others.length > 0;

    if (needsUpdate) {
      operations.push({ type: 'update', id: main.id, data: {
        nombre: bestNombre,
        especialidades: unifiedSpecs,
        localidad: bestLocalidad || "",
        direccion: bestDireccion || "",
        telefono: bestTelefono || "",
        email: bestEmail || "",
        whatsapp: bestWhatsapp || "",
        updatedAt: serverTimestamp()
      }});
    }

    others.forEach(other => {
      operations.push({ type: 'delete', id: other.id });
    });
  }

  console.log(`Total operaciones planeadas: ${operations.length}`);
  
  for (let i = 0; i < operations.length; i += 400) {
    const chunk = operations.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(op => {
      if (op.type === 'update') {
        batch.update(doc(db, PRESTADORES_COLLECTION, op.id), op.data);
      } else {
        batch.delete(doc(db, PRESTADORES_COLLECTION, op.id));
      }
    });
    await batch.commit();
    console.log(`Committed batch ${i / 400 + 1}`);
  }
  
  console.log("Limpieza completada.");
}

runRobust().catch(console.error);
