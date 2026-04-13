
import { db } from './src/firebase';
import { doc, getDoc } from 'firebase/firestore';

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeName(name: string): string {
  if (!name) return "";
  let n = removeAccents(name.toUpperCase());
  
  const wordsToRemove = [
    "HOSPITAL", "HTAL", "HOSP", "INSTITUTO", "INST", "INSTIT", 
    "CLINICA", "CL", "CLIN", "SANATORIO", "SANAT", "CENTRO", "CTRO", "CIEN",
    "PRIVADO", "PRIV", "PR", "GENERAL", "GRAL", "ZONAL", "AGUDOS", "CRONICOS", 
    "ESPECIALIZADO", "ESPECIALIZADA", "PROF", "DR", "DRA", "SRL", "SA", "S.A.", "S.R.L.",
    "DE", "LA", "EL", "LOS", "LAS", "Y", "E", "EN", "DEL", "S.E.", "S.H."
  ];
  
  wordsToRemove.forEach(w => {
    const reg = new RegExp(`\\b${w.replace(/\./g, "\\.")}\\b`, "g");
    n = n.replace(reg, " ");
  });
  
  n = n.replace(/[.,/()#\-]/g, " ");
  n = n.replace(/\s+/g, " ").trim();
  
  return n;
}

async function run() {
  const id1 = "Asx5SpTLlt0435OEPrJM";
  const id2 = "2UY5AqM0QHsViouWYpMU";
  
  const d1 = await getDoc(doc(db, 'prestadores', id1));
  const d2 = await getDoc(doc(db, 'prestadores', id2));
  
  const n1 = d1.data()?.nombre;
  const n2 = d2.data()?.nombre;
  
  console.log(`ID1: ${id1} - Nombre: ${n1} - Norm: ${normalizeName(n1)}`);
  console.log(`ID2: ${id2} - Nombre: ${n2} - Norm: ${normalizeName(n2)}`);
}

run().catch(console.error);
