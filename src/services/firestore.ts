import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocs,
  getDoc,
  writeBatch,
  getDocFromServer,
  setDoc,
  limit,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { Tramite, Prestador, Folleto, PracticaOME, CentroCoordinador, TelefonoInterno } from '../types';

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}

const TRAMITES_COLLECTION = 'tramites';
const PRESTADORES_COLLECTION = 'prestadores';
const FOLLETOS_COLLECTION = 'folletos';
const PRACTICAS_COLLECTION = 'practicas';
const CENTROS_COORDINADORES_COLLECTION = 'centros_coordinadores';
const TELEFONOS_COLLECTION = 'telefonos';
const DELETED_ITEMS_COLLECTION = 'deleted_items';

const HOSPITAL_CANONICAL_GROUPS = [
  { canonical: "HOSPITAL SAN MARTIN", variants: ["HTAL. SAN MARTIN", "HOSPITAL INTERZONAL GENERAL DE AGUDOS GENERAL SAN MARTÍN", "HOSPITAL INTERZONAL GENER AL DE AGUDOS GENERAL SAN MARTÍN", "HOSPITAL SAN MARTIN", "HOSPITAL DE AGUDOS GENERAL SAN MARTÍN", "Hospital San Martin"] },
  { canonical: "ALTHEA (EX VACCARINI)", variants: ["ALTHEA CLINICA PRIVADA", "CL PR VACCARINI SA", "ALTHEA", "CLINICA VACCARINI", "VACCARINI", "VACARINI"] },
  { canonical: "HOSPITAL GUTIERREZ", variants: ["HTAL. GUTIERREZ", "Htal Zonal Ricardo Gutierrez", "HOSPITAL RICARDO GUTIERREZ", "HOSPITAL GUTIERREZ", "GUTIERREZ", "RICARDO GUTIERREZ"] },
  { canonical: "HOSPITAL SAN ROQUE", variants: ["HTAL. SAN ROQUE", "HOSPITAL ZONAL GENERAL DE AGUDOS SAN ROQUE", "HOSPITAL SAN ROQUE", "SAN ROQUE", "Hospital San Roque", "HOSPITAL ZONAL GRI GENERAL DE AGUDOS SAN ROQUE"] },
  { canonical: "SANATORIO MEDICO LOS TILOS", variants: ["SANATORIO MÉDICO LOS TILOS SA", "SANATORIO MEDICO LOS TILOS", "SANATORIO MEDICO LOS TILOS SA", "LOS TILOS"] },
  { canonical: "HOSPITAL ROSSI", variants: ["HTAL. ROSSI", "HOSPITAL INTERZONAL GRAL AGUDOS PROF DR R. ROSSI", "HOSPITAL INTERZONAL ROSSI", "HTAL. ROSSI", "HOSPITAL ROSSI", "Hospital Rossi"] },
  { canonical: "GUSTAVO DILORETTO", variants: ["DI LORETO GUSTAVO", "GUSTAVO DI LORETTO"] },
  { canonical: "HOSPITAL PRIVADO SUDAMERICANO", variants: ["HTAL. PRIVADO SUSAMERICANO", "Hospital Privado Sudamericano", "HTAL. PRIVADO SUDAMERICANO", "HOSPITAL PRIVADO SUDAMERICANO", "Hospital Privado Susamericano"] },
  { canonical: "HOSPITAL SAN JUAN DE DIOS", variants: ["HTAL. SAN JUAN DE DIOS", "HOSPITAL INTERZONAL DE AGUDOS Y CRÓNICOS SAN JUAN DE DIOS", "HOSPITAL ZONAL DE AGUDOS Y CRONICOS SAN JUAN DE DIOS", "HOSPITAL SAN JUAN DE DIOS", "HTAL. SAN JUAN DE DIOS"] },
  { canonical: "SANATORIO ARGENTINO (NARDO)", variants: ["SANATORIO ARGENTINO"] },
  { canonical: "INST. MEDICO PLATENSE", variants: ["Instituto Medico platense", "INSTITUTO MEDICO PLATENSE"] },
  { canonical: "INSTITUTO DEL DIAGNÓSTICO DE LA PLATA", variants: ["INST. DEL DIAGNOSTICO", "Instituto Del Diagnostico", "INSTITUTO DEL DIAGNOSTICO", "INSTITUTO DEL DIAGNÓSTICO DE LA PLATA SA", "INSTITUTO DEL DIAGNOSTICO DE LA PLATA SA", "INSTITUTO DEL DIAGNOSTICO DE LA PLATA", "INSTITUTO DEL DIAGNÓSTICO DE LA PLATA"] },
  { canonical: "INSTITUTO DEL DIAGONISTICO CARDIOVASCULAR", variants: ["INST. DIAG. CARDIOVASCULAR", "INSTITUTO DEL DIAGNOSTICO CARDIOVASCULAR", "INSTITUTO DEL DIAGNOSTICO CARDIOVASCULAR LA PLATA S.R.L.", "INSTITUTO DEL DIAGNOSTICO CARDIOVASCULAR LA PLATA", "INSTITUTO DEL DIAGONISTICO CARDIOVASCULAR", "INSTITUTO DEL DIAGNOSTICO CARDIOVASCULAR LA PLATA SRL"] },
  { canonical: "CL PR DE EXCELENCIA MÉDICA SA (C.BELGRANO)", variants: ["CLINICA DE EXCELENCIA MEDICA", "CLINICA DE EX. MEDICA", "CL PR DE EXCELENCIA MÉDICA SA (C.Belgrano)", "CL PR DE EXCELENCIA MÉDICA SA", "Clinica Belgrano", "EXCELENCIA MEDICA", "EXCELENCIA MÉDICA SA", "CLINICA BELGRANO", "CLINICA DE EXCELENCIA MÉDICA"] }
];

export function normalizeHospitalName(name: string): string {
  if (!name) return "";
  let trimmed = name.trim();
  
  // Normalización agresiva de abreviaturas de Hospital
  const lower = trimmed.toLowerCase();
  
  // Primero buscamos en grupos canónicos
  for (const group of HOSPITAL_CANONICAL_GROUPS) {
    if (lower === group.canonical.toLowerCase() || group.variants.map(v => v.toLowerCase()).includes(lower)) {
      return group.canonical;
    }
  }

  // Si no está en grupos, aplicamos reemplazo genérico de abreviaturas
  trimmed = trimmed
    .replace(/^(HTAL|HATL|HOSP|HOSTIPAL)\.?\s+/i, "HOSPITAL ")
    .replace(/\s+(HTAL|HATL|HOSP|HOSTIPAL)\.?\s+/gi, " HOSPITAL ")
    .replace(/hospital/gi, "HOSPITAL")
    .replace(/hostipal/gi, "HOSPITAL");

  return trimmed;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function uploadFile(file: File): Promise<{ nombre: string; url: string }> {
  console.log("Iniciando subida de:", file.name);
  
  if (!auth.currentUser) {
    throw new Error("No has iniciado sesión. Por favor, ingresa con tu cuenta de Google para subir archivos.");
  }

  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("El servidor de archivos no responde (Timeout 30s). Verifica que Storage esté activado en la consola de Firebase.")), 30000)
  );

  const uploadPromise = (async () => {
    try {
      const storageRef = ref(storage, `tramites/${Date.now()}_${file.name}`);
      console.log("Referencia de storage:", storageRef.fullPath);
      
      const snapshot = await uploadBytes(storageRef, file);
      console.log("Subida completada, obteniendo URL...");
      
      const url = await getDownloadURL(snapshot.ref);
      console.log("URL obtenida:", url);
      
      return { nombre: file.name, url };
    } catch (error: any) {
      console.error("Error detallado en uploadBytes:", error);
      if (error.code === 'storage/unauthorized') {
        throw new Error("No tienes permisos para subir archivos. Revisa las 'Rules' en la pestaña Storage de Firebase.");
      }
      throw error;
    }
  })();

  return Promise.race([uploadPromise, timeoutPromise]) as Promise<{ nombre: string; url: string }>;
}

export function subscribeToTramites(callback: (tramites: Tramite[]) => void) {
  const q = query(collection(db, TRAMITES_COLLECTION), orderBy('nombre', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const tramites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Tramite[];
    callback(tramites);
  }, (error) => {
    console.error("Error subscribing to tramites:", error);
  });
}

export function subscribeToPrestadores(callback: (prestadores: Prestador[]) => void) {
  const q = query(collection(db, PRESTADORES_COLLECTION), orderBy('nombre', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const prestadores = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Prestador[];
    callback(prestadores);
  }, (error) => {
    console.error("Error subscribing to prestadores:", error);
  });
}

export async function addTramite(tramite: Omit<Tramite, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, TRAMITES_COLLECTION), {
      ...tramite,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid
    });
    await logUpdate(`Se agregó el trámite: ${tramite.nombre}`);
    return docRef;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, TRAMITES_COLLECTION);
  }
}

export async function updateTramite(id: string, tramite: Partial<Tramite>) {
  try {
    const docRef = doc(db, TRAMITES_COLLECTION, id);
    await updateDoc(docRef, {
      ...tramite,
      updatedAt: serverTimestamp()
    });
    if (tramite.nombre) {
      await logUpdate(`Se actualizó el trámite: ${tramite.nombre}`);
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, TRAMITES_COLLECTION);
  }
}

async function logDeletedItem(type: string, identifier: string, fullData?: any) {
  try {
    const safeId = identifier.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    const logId = `${type}_${safeId}_${Date.now()}`;
    await setDoc(doc(db, DELETED_ITEMS_COLLECTION, logId), {
      type,
      identifier: identifier.toLowerCase().trim(),
      deletedAt: serverTimestamp(),
      data: fullData || null
    });
  } catch (e) {
    console.warn("Could not log deletion:", e);
  }
}

export async function deleteTramite(id: string) {
  try {
    const docRef = doc(db, TRAMITES_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      await logDeletedItem('tramite', data.nombre || id, data);
      await logUpdate(`Se eliminó el trámite: ${data.nombre}`);
    }
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, TRAMITES_COLLECTION);
  }
}

const APP_UPDATES_COLLECTION = 'app_updates';

async function logUpdate(description: string) {
  try {
    await addDoc(collection(db, APP_UPDATES_COLLECTION), {
      description,
      timestamp: serverTimestamp(),
      userEmail: auth.currentUser?.email || 'Sistema'
    });
  } catch (error) {
    console.error("Error logging update:", error);
  }
}

export function subscribeToLatestUpdate(callback: (update: { description: string, timestamp: any } | null) => void) {
  const q = query(
    collection(db, APP_UPDATES_COLLECTION),
    orderBy('timestamp', 'desc'),
    limit(1)
  );
  
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      callback({
        description: data.description,
        timestamp: data.timestamp
      });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error subscribing to updates:", error);
  });
}

function normalizePrestadorName(name: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  
  for (const group of HOSPITAL_CANONICAL_GROUPS) {
    if (lower === group.canonical.toLowerCase() || group.variants.map(v => v.toLowerCase()).includes(lower)) {
      return group.canonical;
    }
  }
  
  return trimmed;
}

export async function addPrestador(prestador: Omit<Prestador, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, PRESTADORES_COLLECTION), {
      ...prestador,
      nombre: normalizePrestadorName(prestador.nombre),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid
    });
    await logUpdate(`Se agregó el prestador: ${normalizePrestadorName(prestador.nombre)}`);
    return docRef;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PRESTADORES_COLLECTION);
  }
}

export async function updatePrestador(id: string, prestador: Partial<Prestador>) {
  try {
    const updates = { ...prestador };
    if (updates.nombre) {
      updates.nombre = normalizePrestadorName(updates.nombre);
    }

    const docRef = doc(db, PRESTADORES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    if (updates.nombre) {
      await logUpdate(`Se actualizó el prestador: ${updates.nombre}`);
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, PRESTADORES_COLLECTION);
  }
}

export async function deletePrestador(id: string) {
  try {
    const docRef = doc(db, PRESTADORES_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      await logDeletedItem('prestador', data.nombre || id, data);
      await logUpdate(`Se eliminó el prestador: ${data.nombre}`);
    }
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, PRESTADORES_COLLECTION);
  }
}

export async function deleteAllPrestadores() {
  try {
    const prestadoresSnap = await getDocs(collection(db, PRESTADORES_COLLECTION));
    let deleted = 0;
    const docs = prestadoresSnap.docs;
    
    // Firestore batches have a limit of 500 operations
    for (let i = 0; i < docs.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + 500);
      chunk.forEach(doc => {
        batch.delete(doc.ref);
        deleted++;
      });
      await batch.commit();
    }
    
    return deleted;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, PRESTADORES_COLLECTION);
    return 0; // Should not reach here
  }
}

export async function deleteAllTramites() {
  try {
    const tramitesSnap = await getDocs(collection(db, TRAMITES_COLLECTION));
    let deleted = 0;
    const docs = tramitesSnap.docs;
    
    for (let i = 0; i < docs.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + 500);
      chunk.forEach(doc => {
        batch.delete(doc.ref);
        deleted++;
      });
      await batch.commit();
    }
    
    return deleted;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, TRAMITES_COLLECTION);
    return 0;
  }
}

export async function resetAllTopes() {
  try {
    const prestadoresSnap = await getDocs(collection(db, PRESTADORES_COLLECTION));
    const docsToUpdate = prestadoresSnap.docs.filter(doc => {
      const data = doc.data();
      return data.especialidadesTopeadas && data.especialidadesTopeadas.length > 0;
    });

    let updated = 0;
    for (let i = 0; i < docsToUpdate.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = docsToUpdate.slice(i, i + 500);
      chunk.forEach(doc => {
        batch.update(doc.ref, { 
          especialidadesTopeadas: [],
          updatedAt: serverTimestamp()
        });
        updated++;
      });
      await batch.commit();
    }
    
    if (updated > 0) {
      await logUpdate(`Se resetearon los topes de ${updated} prestadores`);
    }
    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, PRESTADORES_COLLECTION);
    return 0;
  }
}

export async function cleanupPrestadores() {
  const prestadoresSnap = await getDocs(collection(db, PRESTADORES_COLLECTION));
  const seen = new Set<string>();
  const batch = writeBatch(db);
  let deleted = 0;

  prestadoresSnap.docs.forEach(doc => {
    const data = doc.data();
    const name = (data.nombre || "").trim().toLowerCase();
    
    if (seen.has(name)) {
      batch.delete(doc.ref);
      deleted++;
    } else {
      seen.add(name);
    }
  });

  if (deleted > 0) {
    await batch.commit();
  }
  return deleted;
}

export async function cleanupTramites() {
  const tramitesSnap = await getDocs(collection(db, TRAMITES_COLLECTION));
  const seen = new Set<string>();
  const batch = writeBatch(db);
  let deleted = 0;

  tramitesSnap.docs.forEach(doc => {
    const data = doc.data();
    const name = (data.nombre || "").trim().toLowerCase();
    
    if (seen.has(name)) {
      batch.delete(doc.ref);
      deleted++;
    } else {
      seen.add(name);
    }
  });

  if (deleted > 0) {
    await batch.commit();
  }
  return deleted;
}

export async function cleanupFolletos() {
  const folletosSnap = await getDocs(collection(db, FOLLETOS_COLLECTION));
  const seen = new Set<string>();
  const batch = writeBatch(db);
  let deleted = 0;

  folletosSnap.docs.forEach(docSnap => {
    const data = docSnap.data();
    const name = (data.nombre || "").trim().toLowerCase();
    
    if (seen.has(name)) {
      batch.delete(docSnap.ref);
      deleted++;
    } else {
      seen.add(name);
    }
  });

  if (deleted > 0) {
    await batch.commit();
  }
  return deleted;
}

export async function cleanupPracticas() {
  const practicasSnap = await getDocs(collection(db, PRACTICAS_COLLECTION));
  
  // Group by codigo|descripcion
  const groups = new Map<string, any[]>();
  practicasSnap.docs.forEach(doc => {
    const data = doc.data();
    const key = `${data.codigo}|${data.descripcion}`.trim().toLowerCase();
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push({
      ref: doc.ref,
      ...data
    });
  });

  const batches: ReturnType<typeof writeBatch>[] = [];
  let currentBatch = writeBatch(db);
  let operations = 0;
  let deleted = 0;

  const pushOp = () => {
    operations++;
    if (operations === 500) {
      batches.push(currentBatch);
      currentBatch = writeBatch(db);
      operations = 0;
    }
  };

  for (const [key, docs] of groups.entries()) {
    if (docs.length > 1) {
      // Keep the first one, delete the rest, but merge descImpresa and sinonimo.
      const toKeep = docs[0];
      let mergedDescImpresa = toKeep.descImpresa || '';
      let mergedSinonimo = toKeep.sinonimo || '';
      
      let needsUpdate = false;

      for (let i = 1; i < docs.length; i++) {
        const d = docs[i];
        
        // Merge descImpresa
        if (d.descImpresa && d.descImpresa !== mergedDescImpresa) {
          if (!mergedDescImpresa) {
            mergedDescImpresa = d.descImpresa;
          } else if (!mergedDescImpresa.split(' / ').includes(d.descImpresa)) {
            mergedDescImpresa += ' / ' + d.descImpresa;
          }
          needsUpdate = true;
        }

        // Merge sinonimo
        if (d.sinonimo && d.sinonimo !== mergedSinonimo) {
          if (!mergedSinonimo) {
            mergedSinonimo = d.sinonimo;
          } else if (!mergedSinonimo.split(' / ').includes(d.sinonimo)) {
            mergedSinonimo += ' / ' + d.sinonimo;
          }
          needsUpdate = true;
        }

        currentBatch.delete(d.ref);
        pushOp();
        deleted++;
      }
      
      // If we merged values into the kept document, update it
      if (needsUpdate || toKeep.descImpresa !== mergedDescImpresa || toKeep.sinonimo !== mergedSinonimo) {
        currentBatch.update(toKeep.ref, {
          descImpresa: mergedDescImpresa,
          sinonimo: mergedSinonimo
        });
        pushOp();
      }
    }
  }

  if (operations > 0) {
    batches.push(currentBatch);
  }

  for (const batch of batches) {
    await batch.commit();
  }

  return deleted;
}

export async function cleanupTelefonos() {
  const telefonosSnap = await getDocs(collection(db, TELEFONOS_COLLECTION));
  const seen = new Set<string>();
  const batch = writeBatch(db);
  let deleted = 0;

  telefonosSnap.docs.forEach(docSnap => {
    const data = docSnap.data();
    const key = `${data.area}|${data.nombre}|${data.interno}`.toLowerCase();
    
    if (seen.has(key)) {
      batch.delete(docSnap.ref);
      deleted++;
    } else {
      seen.add(key);
    }
  });

  if (deleted > 0) {
    await batch.commit();
  }
  return deleted;
}

export async function cleanupCentrosCoordinadores() {
  const centrosSnap = await getDocs(collection(db, CENTROS_COORDINADORES_COLLECTION));
  const seen = new Set<string>();
  const batch = writeBatch(db);
  let deletedCount = 0;

  centrosSnap.docs.forEach(docSnap => {
    const data = docSnap.data();
    const hospital = normalizeHospitalName(data.hospital || "");
    const key = `${hospital.trim()}|${(data.trabajador || "").trim()}`.toLowerCase();
    
    if (seen.has(key)) {
      batch.delete(docSnap.ref);
      deletedCount++;
    } else {
      seen.add(key);
    }
  });

  if (deletedCount > 0) {
    await batch.commit();
  }
  return deletedCount;
}

export function subscribeToFolletos(callback: (folletos: Folleto[]) => void) {
  const q = query(collection(db, FOLLETOS_COLLECTION), orderBy('nombre', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const folletos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Folleto[];
    callback(folletos);
  }, (error) => {
    console.error("Error subscribing to folletos:", error);
  });
}

export function subscribeToPracticas(callback: (practicas: PracticaOME[]) => void) {
  const q = query(collection(db, PRACTICAS_COLLECTION), orderBy('descripcion', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const practicas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PracticaOME[];
    callback(practicas);
  }, (error) => {
    console.error("Error subscribing to practicas:", error);
  });
}

export async function addPractica(practica: Omit<PracticaOME, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, PRACTICAS_COLLECTION), {
      ...practica,
      createdAt: serverTimestamp()
    });
    await logUpdate(`Se agregó la práctica OME: ${practica.codigo} - ${practica.descripcion}`);
    return docRef;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PRACTICAS_COLLECTION);
  }
}

export async function updatePractica(id: string, practica: Partial<PracticaOME>) {
  try {
    const docRef = doc(db, PRACTICAS_COLLECTION, id);
    await updateDoc(docRef, {
      ...practica,
      updatedAt: serverTimestamp()
    });
    if (practica.descripcion) {
      await logUpdate(`Se actualizó la práctica OME: ${practica.descripcion}`);
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, PRACTICAS_COLLECTION);
  }
}

export async function deletePractica(id: string) {
  try {
    const docRef = doc(db, PRACTICAS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      const identifier = `${data.codigo}|${data.descripcion}`;
      await logDeletedItem('practica', identifier, data);
      await logUpdate(`Se eliminó la práctica OME: ${data.descripcion}`);
    }
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, PRACTICAS_COLLECTION);
  }
}

export async function purgeSpecialtyFromDatabase(specialtyNames: string[]) {
  try {
    const targets = specialtyNames.map(s => s.trim());
    if (targets.length === 0) return true;
    
    // 1. Get all documents to process
    const practicasSnap = await getDocs(collection(db, PRACTICAS_COLLECTION));
    const prestadoresSnap = await getDocs(collection(db, PRESTADORES_COLLECTION));
    
    const allOps: { type: 'delete' | 'update', ref: any, data?: any }[] = [];

    // Filter practicas - Strict match on descripcion or sinonimo
    practicasSnap.docs.forEach(doc => {
      const data = doc.data();
      const desc = (data.descripcion || "").trim();
      const sino = (data.sinonimo || "").trim();
      if (targets.includes(desc) || targets.includes(sino)) {
        allOps.push({ type: 'delete', ref: doc.ref });
      }
    });

    // Filter prestadores - Strict match in specialities array
    prestadoresSnap.docs.forEach(doc => {
      const data = doc.data();
      const specs = data.especialidades || [];
      const hasTarget = specs.some((s: string) => targets.includes(s.trim()));
      if (hasTarget) {
        const newSpecs = specs.filter((s: string) => !targets.includes(s.trim()));
        allOps.push({ 
          type: 'update', 
          ref: doc.ref, 
          data: { 
            especialidades: newSpecs,
            updatedAt: serverTimestamp()
          } 
        });
      }
    });

    // Execute in batches
    for (let i = 0; i < allOps.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = allOps.slice(i, i + 500);
      chunk.forEach(op => {
        if (op.type === 'delete') {
          batch.delete(op.ref);
        } else {
          batch.update(op.ref, op.data);
        }
      });
      await batch.commit();
    }

    await logUpdate(`Se purgaron ${targets.length} especialidades/prácticas (coincidencia exacta): ${targets.join(', ')}`);

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'global_purge');
    throw error;
  }
}

export async function getExportableData() {
  try {
    const tSnap = await getDocs(collection(db, TRAMITES_COLLECTION));
    const pSnap = await getDocs(collection(db, PRESTADORES_COLLECTION));
    const fSnap = await getDocs(collection(db, FOLLETOS_COLLECTION));
    
    const tramites = tSnap.docs.map(d => {
      const data = d.data();
      return {
        nombre: data.nombre,
        categoria: data.categoria,
        descripcion: data.descripcion,
        fuente: data.fuente || 'Manual'
      };
    }).sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    const prestadores = pSnap.docs.map(d => {
      const data = d.data();
      return {
        nombre: data.nombre,
        especialidad: data.especialidad,
        domicilio: data.domicilio,
        localidad: data.localidad,
        telefono: data.telefono,
        notas: data.notas,
        tieneTope: data.tieneTope
      };
    }).sort((a, b) => a.nombre.localeCompare(b.nombre));

    const folletos = fSnap.docs.map(d => {
      const data = d.data();
      return {
        nombre: data.nombre,
        url: data.url,
        categoria: data.categoria
      };
    }).sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    return { tramites, prestadores, folletos };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'export all');
    throw error;
  }
}

export async function purgeRecentRecords(thresholdDate: Date) {
  try {
    let totalDeleted = 0;
    let batch = writeBatch(db);
    let batchCount = 0;

    // 1. Clear deleted log
    const deletedSnap = await getDocs(collection(db, DELETED_ITEMS_COLLECTION));
    for (const d of deletedSnap.docs) {
      batch.delete(d.ref);
      batchCount++;
      if (batchCount >= 450) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
    if (batchCount > 0) { await batch.commit(); batch = writeBatch(db); batchCount = 0; }

    // 2. Only delete medical junk
    const snap = await getDocs(collection(db, PRACTICAS_COLLECTION));
    const docsToDelete = snap.docs.filter(d => {
      const data = d.data();
      const desc = (data.descripcion || '').toUpperCase();
      const bad = ['BACTERIOLOGICO', 'ACIDO', 'ESTADO ACIDO', 'ABDOMEN', 'ACETONA', 'ACIDIMETRIA', 'ADDIS', 'ADH'];
      return bad.some(kw => desc.includes(kw));
    });

    for (const d of docsToDelete) {
      batch.delete(d.ref);
      totalDeleted++;
      batchCount++;
      if (batchCount >= 450) { await batch.commit(); batch = writeBatch(db); batchCount = 0; }
    }
    if (batchCount > 0) await batch.commit();

    if (totalDeleted > 0) await logUpdate(`Limpieza: ${totalDeleted} prácticas basura eliminadas.`);
    return totalDeleted;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'cleanup');
    return 0;
  }
}

export async function resetToBaseline(
  initialTramites: any[], 
  initialPrestadores: any[], 
  initialFolletos: any[], 
  initialPracticas: any[], 
  initialCentros: any[], 
  initialTelefonos: any[]
) {
  try {
    const collections = [
      TRAMITES_COLLECTION,
      PRESTADORES_COLLECTION,
      FOLLETOS_COLLECTION,
      PRACTICAS_COLLECTION,
      CENTROS_COORDINADORES_COLLECTION,
      TELEFONOS_COLLECTION,
      DELETED_ITEMS_COLLECTION // Also clear history of deleted items so they re-populate correctly
    ];

    let totalDeleted = 0;
    
    // 1. Wipe everything
    for (const colName of collections) {
      const snap = await getDocs(collection(db, colName));
      let batch = writeBatch(db);
      let count = 0;
      for (const d of snap.docs) {
        batch.delete(d.ref);
        count++;
        totalDeleted++;
        if (count >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) await batch.commit();
    }

    // 2. Seed from baseline
    await seedDatabase(
      initialTramites, 
      initialPrestadores, 
      initialFolletos, 
      initialPracticas, 
      initialCentros, 
      initialTelefonos
    );

    await logUpdate("REINICIO TOTAL DEL SISTEMA: Se eliminaron todos los registros y se restauró la base de datos desde los archivos locales.");
    return totalDeleted;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, "reset all");
    throw error;
  }
}

export async function addFolleto(folleto: Omit<Folleto, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, FOLLETOS_COLLECTION), {
      ...folleto,
      createdAt: serverTimestamp()
    });
    await logUpdate(`Se agregó el folleto: ${folleto.nombre}`);
    return docRef;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, FOLLETOS_COLLECTION);
  }
}

export async function deleteFolleto(id: string) {
  try {
    const docRef = doc(db, FOLLETOS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    await deleteDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      await logDeletedItem('folleto', data.nombre || id, data);
      await logUpdate(`Se eliminó el folleto: ${data.nombre}`);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, FOLLETOS_COLLECTION);
  }
}

export function subscribeToCentrosCoordinadores(callback: (centros: CentroCoordinador[]) => void) {
  const q = query(collection(db, CENTROS_COORDINADORES_COLLECTION), orderBy('hospital', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const centros = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CentroCoordinador[];
    callback(centros);
  }, (error) => {
    console.error("Error subscribing to centros coordinadores:", error);
  });
}

export async function addCentroCoordinador(centro: Omit<CentroCoordinador, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, CENTROS_COORDINADORES_COLLECTION), {
      ...centro,
      createdAt: serverTimestamp()
    });
    await logUpdate(`Se agregó el centro coordinador: ${centro.hospital}`);
    return docRef;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, CENTROS_COORDINADORES_COLLECTION);
  }
}

export async function updateCentroCoordinador(id: string, centro: Partial<CentroCoordinador>) {
  try {
    const docRef = doc(db, CENTROS_COORDINADORES_COLLECTION, id);
    await updateDoc(docRef, {
      ...centro,
      updatedAt: serverTimestamp()
    });
    if (centro.hospital) {
      await logUpdate(`Se actualizó el centro coordinador: ${centro.hospital}`);
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, CENTROS_COORDINADORES_COLLECTION);
  }
}

export async function deleteCentroCoordinador(id: string) {
  try {
    const docRef = doc(db, CENTROS_COORDINADORES_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      const hospitalKey = normalizeHospitalName(data.hospital || "");
      const key = `${hospitalKey}|${data.trabajador}`;
      await logDeletedItem('centro', key, data);
      await logUpdate(`Se eliminó el centro coordinador: ${data.hospital}`);
    }
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, CENTROS_COORDINADORES_COLLECTION);
  }
}

export function subscribeToTelefonos(callback: (telefonos: TelefonoInterno[]) => void) {
  const q = query(collection(db, TELEFONOS_COLLECTION), orderBy('area', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const telefonos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TelefonoInterno[];
    callback(telefonos);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, TELEFONOS_COLLECTION);
  });
}

export async function addTelefono(telefono: Omit<TelefonoInterno, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, TELEFONOS_COLLECTION), {
      ...telefono,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await logUpdate(`Se agregó el interno: ${telefono.area} - ${telefono.interno}`);
    return docRef;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, TELEFONOS_COLLECTION);
  }
}

export async function updateTelefono(id: string, telefono: Partial<TelefonoInterno>) {
  try {
    const docRef = doc(db, TELEFONOS_COLLECTION, id);
    await updateDoc(docRef, {
      ...telefono,
      updatedAt: serverTimestamp()
    });
    if (telefono.area) {
      await logUpdate(`Se actualizó el interno: ${telefono.area}`);
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, TELEFONOS_COLLECTION);
  }
}

export async function deleteTelefono(id: string) {
  try {
    const docRef = doc(db, TELEFONOS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      const key = `${data.area}|${data.nombre}|${data.interno}`.toLowerCase();
      await logDeletedItem('telefono', key, data);
      await logUpdate(`Se eliminó el teléfono interno: ${data.area}`);
    }
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, TELEFONOS_COLLECTION);
  }
}

export async function deleteAllTelefonos() {
  try {
    const telefonosSnap = await getDocs(collection(db, TELEFONOS_COLLECTION));
    let deleted = 0;
    const docs = telefonosSnap.docs;
    
    for (let i = 0; i < docs.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + 500);
      chunk.forEach(doc => {
        batch.delete(doc.ref);
        deleted++;
      });
      await batch.commit();
    }
    
    return deleted;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, TELEFONOS_COLLECTION);
    return 0;
  }
}

export function subscribeToUsers(callback: (users: any[]) => void) {
  const q = query(collection(db, 'users'), orderBy('email', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(users);
  }, (error) => {
    console.error("Error subscribing to users:", error);
  });
}

export async function setUserRole(uid: string, email: string, role: 'admin' | 'viewer', password?: string) {
  try {
    const docRef = doc(db, 'users', uid);
    return await setDoc(docRef, {
      email,
      role,
      creds_pw: password, // Store password as requested
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'users');
  }
}

export async function deleteUser(uid: string) {
  try {
    const docRef = doc(db, 'users', uid);
    return await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'users');
  }
}

export async function toggleUserStatus(uid: string, isDisabled: boolean) {
  try {
    const docRef = doc(db, 'users', uid);
    return await updateDoc(docRef, {
      isDisabled,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'users');
  }
}

export async function resetDeletedLog() {
  try {
    const snap = await getDocs(collection(db, DELETED_ITEMS_COLLECTION));
    const batch = writeBatch(db);
    snap.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    return snap.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, DELETED_ITEMS_COLLECTION);
    return 0;
  }
}

export async function seedDatabase(initialTramites: any[], initialPrestadores: any[], initialFolletos: any[] = [], initialPracticas: any[] = [], initialCentros: any[] = [], initialTelefonos: any[] = []) {
  const tramitesSnap = await getDocs(collection(db, TRAMITES_COLLECTION));
  const existingTramiteNames = new Set(
    tramitesSnap.docs.map(doc => (doc.data().nombre || "").trim().toLowerCase())
  );
  
  const prestadoresSnap = await getDocs(collection(db, PRESTADORES_COLLECTION));
  const existingPrestadorNames = new Set(
    prestadoresSnap.docs.map(doc => (doc.data().nombre || "").trim().toLowerCase())
  );

  const folletosSnap = await getDocs(collection(db, FOLLETOS_COLLECTION));
  const existingFolletoNames = new Set(
    folletosSnap.docs.map(doc => (doc.data().nombre || "").trim().toLowerCase())
  );

  const practicasSnap = await getDocs(collection(db, PRACTICAS_COLLECTION));
  const existingPracticaKeys = new Set(
    practicasSnap.docs.map(doc => {
      const data = doc.data();
      return `${data.codigo}|${data.descripcion}`.trim().toLowerCase();
    })
  );

  const centrosSnap = await getDocs(collection(db, CENTROS_COORDINADORES_COLLECTION));
  const existingCentroKeys = new Set(
    centrosSnap.docs.map(doc => {
      const data = doc.data();
      const hospitalRaw = normalizeHospitalName(data.hospital || "").toUpperCase();
      return `${hospitalRaw}|${(data.trabajador || "").trim().toUpperCase()}`.toLowerCase();
    })
  );

  const telefonosSnap = await getDocs(collection(db, TELEFONOS_COLLECTION));
  const existingTelefonoKeys = new Set(
    telefonosSnap.docs.map(doc => `${doc.data().area}|${doc.data().nombre}|${doc.data().interno}`.toLowerCase())
  );

  const deletedItemsSnap = await getDocs(collection(db, DELETED_ITEMS_COLLECTION));
  const deletedKeys = new Set(deletedItemsSnap.docs.map(doc => doc.id.toLowerCase()));

  let addedTramites = 0;
  let addedPrestadores = 0;
  let addedFolletos = 0;
  let addedPracticas = 0;
  let addedCentros = 0;
  let addedTelefonos = 0;

  const chunks = [];
  let currentChunk = [];

  initialTramites.forEach(t => {
    const normalizedName = (t.nombre || "").trim().toLowerCase();
    const safeId = normalizedName.replace(/[^a-z0-9]/g, '_');
    const deleteKey = `tramite_${safeId}`;
    
    if (!existingTramiteNames.has(normalizedName) && !deletedKeys.has(deleteKey)) {
      const docRef = doc(collection(db, TRAMITES_COLLECTION));
      
      let documents = t.documentos || [];
      if (t.nombre === "Dapaglifozina") {
        documents = [
          { 
            nombre: "Formulario_Dapaglifozina.pdf", 
            url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" 
          }
        ];
      }

      currentChunk.push({
        ref: docRef,
        data: {
          ...t,
          nombre: t.nombre.trim(),
          documentos: documents,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid || 'system'
        }
      });
      existingTramiteNames.add(normalizedName);
      addedTramites++;
      if (currentChunk.length === 450) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    }
  });

  initialPrestadores.forEach(p => {
    const normalizedName = (p.nombre || "").trim().toLowerCase();
    const safeId = normalizedName.replace(/[^a-z0-9]/g, '_');
    const deleteKey = `prestador_${safeId}`;

    if (!existingPrestadorNames.has(normalizedName) && !deletedKeys.has(deleteKey)) {
      const docRef = doc(collection(db, PRESTADORES_COLLECTION));
      currentChunk.push({
        ref: docRef,
        data: {
          ...p,
          nombre: p.nombre.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid || 'system'
        }
      });
      existingPrestadorNames.add(normalizedName);
      addedPrestadores++;
      if (currentChunk.length === 450) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    }
  });

  initialFolletos.forEach(f => {
    const normalizedName = (f.nombre || "").trim().toLowerCase();
    const safeId = normalizedName.replace(/[^a-z0-9]/g, '_');
    const deleteKey = `folleto_${safeId}`;

    if (!existingFolletoNames.has(normalizedName) && !deletedKeys.has(deleteKey)) {
      const docRef = doc(collection(db, FOLLETOS_COLLECTION));
      currentChunk.push({
        ref: docRef,
        data: {
          ...f,
          nombre: f.nombre.trim(),
          createdAt: serverTimestamp()
        }
      });
      existingFolletoNames.add(normalizedName);
      addedFolletos++;
      if (currentChunk.length === 450) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    }
  });

  initialPracticas.forEach(p => {
    const key = `${p.codigo}|${p.descripcion}`.trim().toLowerCase();
    const safeId = key.replace(/[^a-z0-9]/g, '_');
    const deleteKey = `practica_${safeId}`;

    if (!existingPracticaKeys.has(key) && !deletedKeys.has(deleteKey)) {
      const docRef = doc(collection(db, PRACTICAS_COLLECTION));
      currentChunk.push({
        ref: docRef,
        data: {
          ...p,
          createdAt: serverTimestamp()
        }
      });
      existingPracticaKeys.add(key);
      addedPracticas++;
      if (currentChunk.length === 450) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    }
  });

  initialCentros.forEach(c => {
    const hospital = normalizeHospitalName(c.hospital || "");
    const trabajador = (c.trabajador || "").trim();
    
    const key = `${hospital.toUpperCase()}|${trabajador.toUpperCase()}`.toLowerCase();
    const safeId = key.replace(/[^a-z0-9]/g, '_');
    const deleteKey = `centro_${safeId}`;

    if (!existingCentroKeys.has(key) && !deletedKeys.has(deleteKey)) {
      const docRef = doc(collection(db, CENTROS_COORDINADORES_COLLECTION));
      currentChunk.push({
        ref: docRef,
        data: {
          ...c,
          hospital: hospital, // Use normalized name
          createdAt: serverTimestamp()
        }
      });
      existingCentroKeys.add(key);
      addedCentros++;
      if (currentChunk.length === 450) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    }
  });

  initialTelefonos.forEach(t => {
    const key = `${t.area}|${t.nombre}|${t.interno}`.toLowerCase();
    if (!existingTelefonoKeys.has(key)) {
      const docRef = doc(collection(db, TELEFONOS_COLLECTION));
      currentChunk.push({
        ref: docRef,
        data: {
          ...t,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      });
      existingTelefonoKeys.add(key);
      addedTelefonos++;
      if (currentChunk.length === 450) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    }
  });
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const batch = writeBatch(db);
    chunk.forEach(op => {
      batch.set(op.ref, op.data);
    });
    await batch.commit();
    console.log(`Batch ${i + 1}/${chunks.length} completado.`);
  }

  return { addedTramites, addedPrestadores, addedFolletos, addedPracticas, addedCentros, addedTelefonos };
}

export const unifyTerms = (specs: string[]): string[] => {
  let mapped: string[] = [];
  const rmnExactMatches = ['RESONANCIA', 'RESONANCIA MAGNETICA', 'RMN'];
  const tacExactMatches = ['TAC', 'TOMOGRAFIA', 'TOMOGRAFIA COMPUTADA'];
  
  const accentsMap: Record<string, string> = {
    'ALERGIA E INMUNOLOGIA': 'ALERGIA E INMUNOLOGÍA',
    'ANATOMIA PATOLOGICA': 'ANATOMÍA PATOLÓGICA',
    'AUDIOMETRIA': 'AUDIOMETRÍA',
    'AUDIFONOS': 'AUDÍFONOS',
    'CARDIOLOGIA': 'CARDIOLOGÍA',
    'CIRUGIA CARDIOVASCULAR CENTRAL Y PERIFERICA': 'CIRUGÍA CARDIOVASCULAR CENTRAL Y PERIFÉRICA',
    'CIRUGIA GENERAL AMBULATORIA': 'CIRUGÍA GENERAL AMBULATORIA',
    'CLINICA MEDICA': 'CLÍNICA MÉDICA',
    'DERMATOLOGIA': 'DERMATOLOGÍA',
    'DIABETOLOGIA': 'DIABETOLOGÍA',
    'ECODIAGNOSTICO': 'ECODIAGNÓSTICO',
    'ECOGRAFIA': 'ECOGRAFÍA',
    'ELECTROFISIOLOGIA': 'ELECTROFISIOLOGÍA',
    'ENDOCRINOLOGIA': 'ENDOCRINOLOGÍA',
    'ESPINOGRAFIA': 'ESPINOGRAFÍA',
    'FISIATRIA': 'FISIATRÍA',
    'FLEBOLOGIA': 'FLEBOLOGÍA',
    'FONOAUDIOLOGIA': 'FONOAUDIOLOGÍA',
    'GASTROENTEROLOGIA': 'GASTROENTEROLOGÍA',
    'GERIATRIA': 'GERIATRÍA',
    'GINECOLOGIA Y OBSTETRICIA': 'GINECOLOGÍA Y OBSTETRICIA',
    'HEMATOLOGIA': 'HEMATOLOGÍA',
    'HEPATOLOGIA': 'HEPATOLOGÍA',
    'INFECTOLOGIA': 'INFECTOLOGÍA',
    'INTERNACION CON EL FIN DE REHABILITACION': 'INTERNACIÓN CON EL FIN DE REHABILITACIÓN',
    'KINESIOLOGIA': 'KINESIOLOGÍA',
    'LOGOAUDIOMETRIA': 'LOGOAUDIOMETRÍA',
    'MAMOGRAFIA': 'MAMOGRAFÍA',
    'MEDICA DE CABECERA': 'MÉDICA DE CABECERA',
    'MEDICO DE CABECERA': 'MÉDICO DE CABECERA',
    'NEFROLOGIA': 'NEFROLOGÍA',
    'NEUMONOLOGIA': 'NEUMONOLOGÍA',
    'NEUROCIRUGIA': 'NEUROCIRUGÍA',
    'NEUROLOGIA': 'NEUROLOGÍA',
    'NUTRICION': 'NUTRICIÓN',
    'NUTRICIONISTA': 'NUTRICIÓN',
    'ODONTOLOGIA': 'ODONTOLOGÍA',
    'OFTALMOLOGIA': 'OFTALMOLOGÍA',
    'ONCOLOGIA': 'ONCOLOGÍA',
    'ONCOLOGIA CLINICA': 'ONCOLOGÍA CLÍNICA',
    'ONCOLOGIA - TRATAMIENTOS': 'ONCOLOGÍA - TRATAMIENTOS',
    'OPTICA': 'ÓPTICA',
    'OTORRINOLARINGOLOGIA': 'OTORRINOLARINGOLOGÍA',
    'PANORAMICA ODONTOLOGICA': 'PANORÁMICA ODONTOLÓGICA',
    'PEDIATRIA': 'PEDIATRÍA',
    'PSIQUIATRIA': 'PSIQUIATRÍA',
    'PSICOLOGIA': 'PSICOLOGÍA',
    'RADIOLOGIA': 'RADIOLOGÍA',
    'RESONANCIA MAGNETICA': 'RESONANCIA MAGNÉTICA',
    'RESONANCIA MULTIPARAMETRICA': 'RESONANCIA MULTIPARAMÉTRICA',
    'REUMATOLOGIA': 'REUMATOLOGÍA',
    'TOMOGRAFIA': 'TOMOGRAFÍA',
    'TRAUMATOLOGIA': 'TRAUMATOLOGÍA',
    'UROLOGIA': 'UROLOGÍA',
    'VIDEOENDOSCOPICAS GASTROINTESTINALES': 'VIDEOENDOSCÓPICAS GASTROINTESTINALES',
    'COLOCACION DE MARCAPASOS': 'COLOCACIÓN DE MARCAPASOS'
  };

  // Expand comma-separated lists first
  const expandedSpecs: string[] = [];
  for (const s of specs) {
    if (s.includes(',') || s.includes(';')) {
      const parts = s.split(/[;,]/).map(p => p.trim()).filter(Boolean);
      expandedSpecs.push(...parts);
    } else {
      expandedSpecs.push(s);
    }
  }

  for (const s of expandedSpecs) {
    // Aggressive normalization: remove accents, uppercase, trim
    let upper = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    
    // Minor typo fixes (ambulatorio -> ambulatoria)
    if (upper === 'CIRUGIA GENERAL AMBULATORIO') {
       upper = 'CIRUGIA GENERAL AMBULATORIA';
    }
    
    // Split combined terms
    if (upper === 'TAC - RMN') {
      mapped.push('TOMOGRAFIA', 'RESONANCIA MAGNETICA');
      continue;
    }
    if (upper === 'RX - TAC') {
      mapped.push('RX', 'TOMOGRAFIA');
      continue;
    }
    if (upper === 'ECODIAGNOSTICO - RMN') {
      mapped.push('ECODIAGNOSTICO', 'RESONANCIA MAGNETICA');
      continue;
    }

    // Resonancia + 130 Unification
    if (upper.startsWith('RESONANCIA +') || upper.startsWith('RESONANCIA+')) {
      if (upper.includes('130')) {
         mapped.push('RESONANCIA + 130');
      } else {
         mapped.push('RESONANCIA MAGNETICA');
      }
      continue;
    }
    
    if (tacExactMatches.includes(upper)) {
      mapped.push('TOMOGRAFIA');
      continue;
    }

    // Fisiatria Unification
    if (upper === 'FISIOKINESIO' || upper === 'FISIATRIA' || upper === 'FISIATRIA CONSULTAS' || upper === 'FISIATRIA - CONSULTAS') {
      mapped.push('FISIATRIA');
      continue;
    }

    // Espinograma Unification
    if (upper === 'ESPINOGRAMA' || upper === 'ESPINOGRAFIA') {
      mapped.push('ESPINOGRAFIA');
      continue;
    }

    // Ensure ALL audiology maps to proper terms
    if (upper === 'AUDIOMETRIA' || upper === 'AUDIFONOS' || upper === 'AUDIOMETRIA / AUDIFONOS' || upper === 'LOGOAUDIOMETRIA') {
      // We will map them all to these 3 separate canonical items so the user finds them individually
      if (upper === 'AUDIOMETRIA / AUDIFONOS') {
         mapped.push('AUDIOMETRIA', 'AUDIFONOS');
      } else {
         mapped.push(upper);
      }
      continue;
    }

    // Abbreviations
    if (upper === 'CARDIO') {
      mapped.push('CARDIOLOGIA');
      continue;
    }
    if (upper === 'FONO') {
      mapped.push('FONOAUDIOLOGIA');
      continue;
    }
    if (upper === 'GASTRO') {
      mapped.push('GASTROENTEROLOGIA');
      continue;
    }
    if (upper === 'GINECO') {
      mapped.push('GINECOLOGIA Y OBSTETRICIA');
      continue;
    }
    if (upper === 'HEPATO') {
      mapped.push('HEPATOLOGIA');
      continue;
    }
    if (upper === 'KINESIO') {
      mapped.push('KINESIOLOGIA');
      continue;
    }
    if (upper === 'PSICO') {
      mapped.push('PSICOLOGIA');
      continue;
    }
    if (upper === 'REUMA') {
      mapped.push('REUMATOLOGIA');
      continue;
    }
    if (upper === 'OTORRINO / FONOAUDIO') {
      mapped.push('OTORRINOLARINGOLOGIA', 'FONOAUDIOLOGIA');
      continue;
    }
    if (upper === 'NUTRICIONISTA') {
      mapped.push('NUTRICION');
      continue;
    }

    // Diabetologia unification
    if (upper === 'DIABETOLOGIA' || upper === 'DIABETOLOGO') {
      mapped.push('DIABETOLOGIA');
      continue;
    }

    // Eco Doppler unification
    if (upper === 'ECO DOPPLER' || upper === 'ECO DOPP.' || upper === 'ECODOPPLER' || upper === 'ECO DOPP') {
      mapped.push('ECO DOPPLER');
      continue;
    }

    if (upper === 'ECO DOPP. / ECODIAG.') {
      mapped.push('ECO DOPPLER', 'ECODIAGNOSTICO');
      continue;
    }

    if (upper === 'RX - ECODIAG. / ECO DOPPLER') {
      mapped.push('RX', 'ECODIAGNOSTICO', 'ECO DOPPLER');
      continue;
    }

    // Ginecologia y Obstetricia unification
    if (upper === 'GINECOLOGIA' || upper === 'GINECOLOGIA Y OBSTETRICIA' || upper === 'GIENECOLOGIA' || upper === 'GINECO' || upper === 'GIENECOLOGIA Y OBSTETRICIA') {
      mapped.push('GINECOLOGIA Y OBSTETRICIA');
      continue;
    }

    // Panoramica Odontologica unification
    if (upper === 'PANORAMICA' || upper === 'PANORAMICA ODONTOLOGICA' || upper === 'PANORAMICA ODONTOLIGICA') {
      mapped.push('PANORAMICA ODONTOLOGICA');
      continue;
    }

    // Mamotonne Unification
    if (upper.includes('MAMMOTONNE') || upper.includes('MAMMOTONE') || upper.includes('MAMOTONE')) {
      mapped.push(accentsMap['MAMOTONNE'] || 'MAMOTONNE');
      continue;
    }
    
    mapped.push(accentsMap[upper] || upper);
  }
  
  // Remove duplicates and apply accents to any hardcoded pushed terms
  return Array.from(new Set(mapped.map(m => accentsMap[m] || m)));
};

export async function migrateData() {
  const tramitesSnap = await getDocs(collection(db, TRAMITES_COLLECTION));
  const prestadoresSnap = await getDocs(collection(db, PRESTADORES_COLLECTION));
  const centrosSnap = await getDocs(collection(db, CENTROS_COORDINADORES_COLLECTION));
  const batch = writeBatch(db);
  let migrated = 0;

  // 1. Migrate Tramites
  tramitesSnap.docs.forEach(docSnap => {
    const t = docSnap.data() as Tramite;
    let needsUpdate = false;
    const updates: any = {};

    // 1. Migrate "Afiliaciones y expedientes" to "Afiliaciones"
    if (t.categoria === 'Afiliaciones y expedientes') {
      updates.categoria = 'Afiliaciones';
      needsUpdate = true;
    }

    // 2. Fix Expedientes and Reintegros categories
    if ((t.nombre === 'Expedientes' || t.nombre === 'Reintegros') && 
        (t.categoria === 'Afiliaciones' || t.categoria === 'Afiliaciones y expedientes')) {
      updates.categoria = t.nombre === 'Expedientes' ? 'Expediente GDE' : 'Reintegros';
      needsUpdate = true;
    }

    // 3. Migrate Oxygen related trámites to "Oxigenoterapia"
    if (t.nombre.toLowerCase().includes('oxigeno') && t.categoria !== 'Oxigenoterapia') {
      updates.categoria = 'Oxigenoterapia';
      needsUpdate = true;
    }

    if (needsUpdate) {
      batch.update(docSnap.ref, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      migrated++;
    }
  });

  // 2. Unify Specialties across all prestadores
  prestadoresSnap.docs.forEach(docSnap => {
    const p = docSnap.data() as Prestador;
    
    const currentSpecs = p.especialidades || [];
    const currentTopeadas = p.especialidadesTopeadas || [];
    
    const newSpecs = unifyTerms(currentSpecs);
    const newTopeadas = unifyTerms(currentTopeadas);
    
    const currentSpecsSorted = [...currentSpecs].sort();
    const newSpecsSorted = [...newSpecs].sort();
    const currentTopeadasSorted = [...currentTopeadas].sort();
    const newTopeadasSorted = [...newTopeadas].sort();
    
    if (JSON.stringify(currentSpecsSorted) !== JSON.stringify(newSpecsSorted) || 
        JSON.stringify(currentTopeadasSorted) !== JSON.stringify(newTopeadasSorted)) {
      batch.update(docSnap.ref, {
        especialidades: newSpecs,
        especialidadesTopeadas: newTopeadas,
        updatedAt: serverTimestamp()
      });
      migrated++;
    }
  });

  // 4. General Hospital Name Unification (HTAL/HOSP -> HOSPITAL)
  const allDocs = [...prestadoresSnap.docs, ...centrosSnap.docs];
  allDocs.forEach(docSnap => {
    const data = docSnap.data();
    const currentName = docSnap.ref.path.startsWith(PRESTADORES_COLLECTION) ? (data.nombre || "") : (data.hospital || "");
    const normalized = normalizeHospitalName(currentName);
    
    if (normalized !== currentName) {
      const updateData: any = { updatedAt: serverTimestamp() };
      if (docSnap.ref.path.startsWith(PRESTADORES_COLLECTION)) {
        updateData.nombre = normalized;
      } else {
        updateData.hospital = normalized;
      }
      batch.update(docSnap.ref, updateData);
      migrated++;
    }
  });

  // 5. Unify and Merge based on Canonical Groups
  const groupsConfig = HOSPITAL_CANONICAL_GROUPS;

  const replacementsMap: Record<string, string> = {};

  for (const group of groupsConfig) {
    const lowerVariants = group.variants.map(v => v.toLowerCase());
    const lowerCanonical = group.canonical.toLowerCase();

    // Group matching prestadores
    const matchingPrestadores = prestadoresSnap.docs.filter(docSnap => {
      const name = (docSnap.data().nombre || "").trim().toLowerCase();
      return name === lowerCanonical || lowerVariants.includes(name);
    });

    if (matchingPrestadores.length > 0) {
      // Pick primary doc: the one already named canonical OR the first one
      let primaryDocSnap = matchingPrestadores.find(d => (d.data().nombre || "").trim() === group.canonical);
      if (!primaryDocSnap) primaryDocSnap = matchingPrestadores[0];

      const others = matchingPrestadores.filter(d => d.id !== primaryDocSnap!.id);
      
      // Merge specialties
      const primaryData = primaryDocSnap.data() as Prestador;
      let mergedSpecs = [...(primaryData.especialidades || [])];
      let needsUpdate = primaryData.nombre !== group.canonical;

      for (const otherDoc of others) {
        const otherData = otherDoc.data() as Prestador;
        mergedSpecs = [...mergedSpecs, ...(otherData.especialidades || [])];
        replacementsMap[otherDoc.id] = primaryDocSnap!.id;
        batch.delete(otherDoc.ref);
        needsUpdate = true;
      }

      const uniqueSpecs = Array.from(new Set(mergedSpecs.map(s => s.trim().toUpperCase()))).sort();
      
      // Check if specs changed
      const currentSpecsSorted = [...(primaryData.especialidades || [])].map(s => s.trim().toUpperCase()).sort();
      if (JSON.stringify(uniqueSpecs) !== JSON.stringify(currentSpecsSorted)) {
        needsUpdate = true;
      }

      if (needsUpdate) {
        batch.update(primaryDocSnap.ref, {
          nombre: group.canonical,
          especialidades: uniqueSpecs,
          updatedAt: serverTimestamp()
        });
        migrated++;
      }
    }

    // Unify names in Centros Coordinadores (no merge needed per-se, but rename)
    centrosSnap.docs.forEach(docSnap => {
      const c = docSnap.data();
      const currentHospital = (c.hospital || "").trim();
      if ((currentHospital.toLowerCase() === lowerCanonical || lowerVariants.includes(currentHospital.toLowerCase())) && 
          currentHospital !== group.canonical) {
        batch.update(docSnap.ref, {
          hospital: group.canonical,
          updatedAt: serverTimestamp()
        });
        migrated++;
      }
    });
  }

  // 4. Update Tramites referencing deleted prestadores
  if (Object.keys(replacementsMap).length > 0) {
    tramitesSnap.docs.forEach(docSnap => {
      const t = docSnap.data() as Tramite;
      if (t.prestadoresIds && t.prestadoresIds.length > 0) {
        let changed = false;
        const newIds = t.prestadoresIds.map(id => {
          if (replacementsMap[id]) {
            changed = true;
            return replacementsMap[id];
          }
          return id;
        });

        if (changed) {
          batch.update(docSnap.ref, {
            prestadoresIds: Array.from(new Set(newIds)),
            updatedAt: serverTimestamp()
          });
          migrated++;
        }
      }
    });
  }

  // 5. Update ITEM procedure
  const itemProcedData = `COORDINADOR | rgiugnoli@pami.org.ar | 
CARDIOLOGÍA / TAVI / V-E | cardio@pami.org.ar | 
NEUROLOGÍA | gnano@proyectos.pami.org.ar | Prácticas, Expedientes VE, neuroestimulación
NEUROCIRUGIA (insumos T.2 y V/E) | aconde@proyectos.pami.org.ar / flferraro@proyectos.pami.org.ar / ftonero@proyectos.pami.org.ar | 
ALTA COMPLEJIDAD (Cx Gral. - Gastro - M. Invasiva) | cirugia@pami.org.ar | 
NEUMONOLOGÍA | rcarpio@proyectos.pami.org.ar | Cánulas traqueales - insumos de pulmón o pedidos por neumólogo
UROLOGÍA | jreyesolivera@proyectos.pami.org.ar / lschneider@proyectos.pami.org.ar | 
DERMATOLOGÍA / DERCARTABLES HERIDAS / VAC | arocchese@proyectos.pami.org.ar | 
OBESIDAD | pcatellani@pami.org.ar | 
OSTOMÍA | ostomia@pami.org.ar | 
OXIGENO | oxigenoterapia@pami.org.ar | 
OFTALMOLOGÍA | divisionoptica@pami.org.ar | 
AUDITORIA TRAUMATOLOGÍA (EVALUACION T.2 - VE) | auditoriatraumatonc@pami.org.ar | 
RECLAMO PROVISIÓN TRAUMATOLOGÍA | traumatologia@pami.org.ar | 
DIABETES | mcrodi@pami.org.ar / bioquimica@pami.org.ar | 
BOMBAS DE ALIMENTACIÓN Y GUÍAS | recuperacionnutricional@pami.org.ar | va por OP MODULO 400 ENTERAL
FONOAUDIOLOGÍA Y AUDÍFONOS | spalladino@pami.org.ar / programas_audifonos@pami.org.ar | INSUMOS SOLICITADOS POR ORL
PAÑALES | insumosdeincontinencias@pami.org.ar | 
PRESUPUESTOS DE PRÁCTICAS VE (EXPEDIENTES) | contrataciones.especiales@pami.org.ar | 
MESA DE ENTRADAS | mffernandez@pami.org.ar / masuan@pami.org.ar | 
GINECOLOGÍA / ANTICONCEPCIÓN | rgiugnoli@pami.org.ar | 
RECLAMOS | subgciaprestyprov@pami.org.ar | 
LICITACIONES | gestiondecomprasylicitaciones@pami.org.ar | 
SUBGERENCIA DE PRESTACIONES MÉDICAS | subgciapresmedicas@pami.org.ar | 
FISIATRÍA / AYUDA EXTERNA (VE) Y REHABILITACIÓN | ayudastecnicas@pami.org.ar |`;

  const itemTramites = tramitesSnap.docs.filter(d => {
    const name = d.data().nombre?.toUpperCase();
    return name === 'ITEM' || name === 'ITEM / INSUMOS VE';
  });

  itemTramites.forEach(d => {
    batch.update(d.ref, {
      descripcion: itemProcedData,
      nombre: 'ITEM / INSUMOS VE',
      updatedAt: serverTimestamp()
    });
    migrated++;
  });

  if (migrated > 0) {
    await batch.commit();
  }
  return migrated;
}

export async function seedDialisis() {
  try {
    const tSnap = await getDocs(collection(db, TRAMITES_COLLECTION));
    const existing = tSnap.docs.find(d => d.data().nombre.toUpperCase().includes('DIALISIS') || d.data().nombre.toUpperCase().includes('DIÁLISIS'));
    
    if (existing) {
      console.log("Diálisis already seeded");
      return;
    }

    const prestadores = [
      { nombre: 'IPENSA', telefono: '221-427 1190', direccion: 'Calle 59 # 434 entre 3 y 4, La Plata', email: 'nefrologia-dialisis@ipensa.com' },
      { nombre: 'Diálisis y nefrología srl (Mater dei)', telefono: '221-4210993 / 221-4234110', direccion: '45 e 13 y 14, La Plata', email: 'dianefro@fibertel.com.ar' },
      { nombre: 'Fresenius MC', telefono: '221-4536246 / 221-4571471', direccion: '31 e 63 y 64 #1478, La Plata', email: 'la.plata-adm.clinics-r-arg@fmc-ag.com' },
      { nombre: 'Nefrodialisis srl (Hospital Español)', telefono: '221-4838350', direccion: '9 e 35 y 36, La Plata', email: 'nefrodialisis_srl@yahoo.com.ar' },
      { nombre: 'Nefroexcel srl', telefono: '221-4534727', direccion: '51 entre 17 y 18 #1111, La Plata', email: 'nefroexcel.srl@hotmail.com' },
      { nombre: 'Diaziza (Sanatorio Argentino)', telefono: '221-4278007', direccion: '56 #874 entre 12 y 13, La Plata', email: 'dialisisargentino@yahoo.com.ar' },
      { nombre: 'Terapia Renal de Lobos', telefono: '2227-431116', direccion: 'Las Heras #344, Lobos', email: 'terapiarenaldelobos@gmail.com' },
      { nombre: 'San Bruno srl', telefono: '2226-42-3963', direccion: 'Mitre #468, Cañuelas', email: 'canuelas@strargentina.com.ar' },
      { nombre: 'Centro Nefrológico Chascomús', telefono: '2241-422610', direccion: 'Cramer #58, Chascomús', email: 'cnchascomus@yahoo.com.ar' }
    ];

    const batch = writeBatch(db);
    const pIds: string[] = [];
    
    for (const p of prestadores) {
      const ref = doc(collection(db, PRESTADORES_COLLECTION));
      batch.set(ref, {
        ...p,
        especialidades: ['DIÁLISIS', 'NEFROLOGÍA'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      pIds.push(ref.id);
    }

    const descLines = [];
    for (const p of prestadores) {
      descLines.push(`${p.nombre}|${p.telefono}|${p.direccion}|${p.email}`);
    }

    const trRef = doc(collection(db, TRAMITES_COLLECTION));
    batch.set(trRef, {
      nombre: 'DIÁLISIS',
      categoria: 'Especialidades Médicas',
      descripcion: descLines.join('\n'),
      prestadoresIds: pIds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid
    });

    await batch.commit();
    console.log("Diálisis seeded!");
  } catch (error) {
    console.error("Error seeding dialisis:", error);
  }
}

export async function unifyIpensa() {
  try {
    const prestadoresSnap = await getDocs(collection(db, PRESTADORES_COLLECTION));
    const prestadoresDocs = prestadoresSnap.docs.map(d => ({id: d.id, ...d.data()} as Prestador));
    
    const ipensas = prestadoresDocs.filter(p => p.nombre.toUpperCase().trim() === 'IPENSA');
    
    if (ipensas.length <= 1) return 0; // Already unified or missing
    
    const targetDoc = ipensas[0];
    const targetDocId = targetDoc.id;

    const allSpecs = new Set<string>();
    const allTopeadas = new Set<string>();
    let bestEmail = targetDoc.email;
    let bestPhone = targetDoc.telefono;
    let bestAddress = targetDoc.direccion;
    
    ipensas.forEach(p => {
      (p.especialidades || []).forEach((s: string) => allSpecs.add(s));
      (p.especialidadesTopeadas || []).forEach((s: string) => allTopeadas.add(s));
      if (!bestEmail && p.email) bestEmail = p.email;
      if (!bestPhone && p.telefono) bestPhone = p.telefono;
      if (!bestAddress && p.direccion) bestAddress = p.direccion;
    });

    const finalRefsToDelete = ipensas.map(p => p.id).filter(id => id !== targetDocId);
    if (finalRefsToDelete.length === 0) return 0;

    const batch = writeBatch(db);

    batch.update(doc(db, PRESTADORES_COLLECTION, targetDocId), {
      especialidades: Array.from(allSpecs),
      especialidadesTopeadas: Array.from(allTopeadas),
      email: bestEmail || '',
      telefono: bestPhone || '',
      direccion: bestAddress || '',
      updatedAt: serverTimestamp()
    });

    for (const idToDelete of finalRefsToDelete) {
      if (idToDelete) {
        batch.delete(doc(db, PRESTADORES_COLLECTION, idToDelete));
      }
    }

    const tramitesSnap = await getDocs(collection(db, TRAMITES_COLLECTION));
    tramitesSnap.docs.forEach(tDoc => {
      const tData = tDoc.data();
      let pIds: string[] = tData.prestadoresIds || [];
      let needsUpdate = false;
      
      const newIdsSet = new Set(pIds);
      for (const deletedId of finalRefsToDelete) {
        if (deletedId && newIdsSet.has(deletedId)) {
          newIdsSet.delete(deletedId);
          newIdsSet.add(targetDocId);
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        batch.update(doc(db, TRAMITES_COLLECTION, tDoc.id), {
          prestadoresIds: Array.from(newIdsSet),
          updatedAt: serverTimestamp()
        });
      }
    });

    await batch.commit();
    return finalRefsToDelete.length;
  } catch (error) {
    console.error("Error unifying IPENSA:", error);
    return 0;
  }
}

export async function unifySudamericanoHospitals() {
  try {
    const prestadoresSnap = await getDocs(collection(db, PRESTADORES_COLLECTION));
    const prestadoresDocs = prestadoresSnap.docs.map(d => ({id: d.id, ...d.data()} as Prestador));
    
    const hSuda = prestadoresDocs.find(p => p.nombre.toUpperCase().trim() === 'HOSPITAL SUDAMERICANO');
    const hPrivSuda = prestadoresDocs.find(p => p.nombre.toUpperCase().trim() === 'HOSPITAL PRIVADO SUDAMERICANO');
    const hSudaPlural = prestadoresDocs.find(p => p.nombre.toUpperCase().trim() === 'HOSPITAL SUDAMERICANOS');

    // If already unified into one, do nothing unless we have duplicates
    if (!hSuda && !hPrivSuda && hSudaPlural) return 0;
    
    let targetDocId = hSudaPlural?.id || hSuda?.id || hPrivSuda?.id;
    if (!targetDocId) return 0; // Not found

    const allSpecs = new Set<string>();
    const allTopeadas = new Set<string>();
    
    [hSuda, hPrivSuda, hSudaPlural].forEach(p => {
      if (!p) return;
      (p.especialidades || []).forEach((s: string) => allSpecs.add(s));
      (p.especialidadesTopeadas || []).forEach((s: string) => allTopeadas.add(s));
    });

    const finalRefsToDelete = [hSuda?.id, hPrivSuda?.id, hSudaPlural?.id].filter(id => id && id !== targetDocId);

    const batch = writeBatch(db);

    // Update target doc
    batch.update(doc(db, PRESTADORES_COLLECTION, targetDocId), {
      nombre: 'HOSPITAL SUDAMERICANOS',
      especialidades: Array.from(allSpecs),
      especialidadesTopeadas: Array.from(allTopeadas),
      updatedAt: serverTimestamp()
    });

    // Delete others
    for (const idToDelete of finalRefsToDelete) {
      if (idToDelete) {
        batch.delete(doc(db, PRESTADORES_COLLECTION, idToDelete));
      }
    }

    // Now update Tramites that might reference the deleted ones
    if (finalRefsToDelete.length > 0) {
      const tramitesSnap = await getDocs(collection(db, TRAMITES_COLLECTION));
      tramitesSnap.docs.forEach(tDoc => {
        const tData = tDoc.data();
        let pIds: string[] = tData.prestadoresIds || [];
        let needsUpdate = false;
        
        const newIdsSet = new Set(pIds);
        for (const deletedId of finalRefsToDelete) {
          if (deletedId && newIdsSet.has(deletedId)) {
            newIdsSet.delete(deletedId);
            newIdsSet.add(targetDocId as string);
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          batch.update(doc(db, TRAMITES_COLLECTION, tDoc.id), {
            prestadoresIds: Array.from(newIdsSet),
            updatedAt: serverTimestamp()
          });
        }
      });
    }

    await batch.commit();
    return finalRefsToDelete.length + 1;
  } catch (error) {
    console.error("Error unifying SUDAMERICANO hospitals:", error);
    return 0;
  }
}

