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
  limit
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

const HOSPITAL_CANONICAL_GROUPS = [
  { canonical: "HTAL. SAN MARTIN", variants: ["HOSPITAL INTERZONAL GENERAL DE AGUDOS GENERAL SAN MARTÍN", "HOSPITAL INTERZONAL GENER AL DE AGUDOS GENERAL SAN MARTÍN", "HOSPITAL SAN MARTIN", "HOSPITAL DE AGUDOS GENERAL SAN MARTÍN", "Hospital San Martin"] },
  { canonical: "ALTHEA (EX VACCARINI)", variants: ["ALTHEA CLINICA PRIVADA", "CL PR VACCARINI SA", "ALTHEA", "CLINICA VACCARINI", "VACCARINI", "VACARINI"] },
  { canonical: "HTAL. GUTIERREZ", variants: ["Htal Zonal Ricardo Gutierrez", "HOSPITAL RICARDO GUTIERREZ", "HOSPITAL GUTIERREZ", "GUTIERREZ", "RICARDO GUTIERREZ"] },
  { canonical: "HTAL. SAN ROQUE", variants: ["HOSPITAL ZONAL GENERAL DE AGUDOS SAN ROQUE", "HOSPITAL SAN ROQUE", "SAN ROQUE", "Hospital San Roque"] },
  { canonical: "SANATORIO MEDICO LOS TILOS", variants: ["SANATORIO MÉDICO LOS TILOS SA", "SANATORIO MEDICO LOS TILOS", "SANATORIO MEDICO LOS TILOS SA", "LOS TILOS"] },
  { canonical: "HTAL. ROSSI", variants: ["HOSPITAL INTERZONAL GRAL AGUDOS PROF DR R. ROSSI", "HOSPITAL INTERZONAL ROSSI", "HTAL. ROSSI", "HOSPITAL ROSSI"] },
  { canonical: "GUSTAVO DILORETTO", variants: ["DI LORETO GUSTAVO", "GUSTAVO DI LORETTO"] },
  { canonical: "HTAL. PRIVADO SUSAMERICANO", variants: ["Hospital Privado Sudamericano", "HTAL. PRIVADO SUDAMERICANO", "HOSPITAL PRIVADO SUDAMERICANO", "Hospital Privado Susamericano"] },
  { canonical: "HTAL. SAN JUAN DE DIOS", variants: ["HOSPITAL INTERZONAL DE AGUDOS Y CRÓNICOS SAN JUAN DE DIOS", "HOSPITAL ZONAL DE AGUDOS Y CRONICOS SAN JUAN DE DIOS", "HOSPITAL SAN JUAN DE DIOS", "HTAL. SAN JUAN DE DIOS"] }
];

function normalizeHospitalName(name: string): string {
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

export async function deleteTramite(id: string) {
  try {
    const docRef = doc(db, TRAMITES_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    await deleteDoc(docRef);
    if (snapshot.exists()) {
      await logUpdate(`Se eliminó el trámite: ${snapshot.data().nombre}`);
    }
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
  const upper = name.trim().toUpperCase();
  
  const sanJuanVariants = [
    "HOSPITAL INTERZONAL DE AGUDOS Y CRÓNICOS SAN JUAN DE DIOS",
    "HOSPITAL ZONAL DE AGUDOS Y CRONICOS SAN JUAN DE DIOS",
    "HOSPITAL SAN JUAN DE DIOS",
    "HTAL. SAN JUAN DE DIOS"
  ].map(v => v.toUpperCase());

  if (sanJuanVariants.includes(upper)) {
    return "HTAL. SAN JUAN DE DIOS";
  }

  // Add more as needed based on groupsConfig if we want global enforcement
  return name.trim();
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
    await deleteDoc(docRef);
    if (snapshot.exists()) {
      await logUpdate(`Se eliminó el prestador: ${snapshot.data().nombre}`);
    }
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

export async function cleanupPracticas() {
  const practicasSnap = await getDocs(collection(db, PRACTICAS_COLLECTION));
  const seen = new Set<string>();
  const batch = writeBatch(db);
  let deleted = 0;

  practicasSnap.docs.forEach(doc => {
    const data = doc.data();
    const key = `${data.codigo}|${data.descripcion}|${data.descImpresa || ''}|${data.sinonimo || ''}`.trim().toLowerCase();
    
    if (seen.has(key)) {
      batch.delete(doc.ref);
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
  let deletedCount = 0;
  
  // Collect IDs of duplicates
  const idsToDelete: string[] = [];

  centrosSnap.docs.forEach(doc => {
    const data = doc.data();
    const hospital = normalizeHospitalName(data.hospital || "");
    const key = `${hospital.trim()}|${(data.trabajador || "").trim()}`.toLowerCase();
    
    if (seen.has(key)) {
      idsToDelete.push(doc.id);
    } else {
      seen.add(key);
    }
  });

  // Delete in batches of 500 (Firestore limit)
  for (let i = 0; i < idsToDelete.length; i += 500) {
    const batch = writeBatch(db);
    const chunk = idsToDelete.slice(i, i + 500);
    chunk.forEach(id => {
      batch.delete(doc(db, CENTROS_COORDINADORES_COLLECTION, id));
    });
    await batch.commit();
    deletedCount += chunk.length;
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
    await deleteDoc(docRef);
    if (snapshot.exists()) {
      await logUpdate(`Se eliminó la práctica: ${snapshot.data().descripcion}`);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, PRACTICAS_COLLECTION);
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
      await logUpdate(`Se eliminó el folleto: ${snapshot.data().nombre}`);
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
    await deleteDoc(docRef);
    if (snapshot.exists()) {
      await logUpdate(`Se eliminó el centro coordinador: ${snapshot.data().hospital}`);
    }
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
    await deleteDoc(docRef);
    if (snapshot.exists()) {
      await logUpdate(`Se eliminó el teléfono interno: ${snapshot.data().area}`);
    }
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

export async function setUserRole(uid: string, email: string, role: 'admin' | 'viewer') {
  try {
    const docRef = doc(db, 'users', uid);
    return await setDoc(docRef, {
      email,
      role,
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
      return `${data.codigo}|${data.descripcion}|${data.descImpresa || ''}|${data.sinonimo || ''}`.trim().toLowerCase();
    })
  );

  const centrosSnap = await getDocs(collection(db, CENTROS_COORDINADORES_COLLECTION));
  const existingCentroKeys = new Set(
    centrosSnap.docs.map(doc => {
      const data = doc.data();
      const hospitalRaw = (data.hospital || "").trim().toUpperCase();
      // Use the same normalization logic as migrateData if possible, or just trim/upper
      return `${hospitalRaw}|${(data.trabajador || "").trim().toUpperCase()}`.toLowerCase();
    })
  );

  const telefonosSnap = await getDocs(collection(db, TELEFONOS_COLLECTION));
  const existingTelefonoKeys = new Set(
    telefonosSnap.docs.map(doc => `${doc.data().area}|${doc.data().nombre}|${doc.data().interno}`.toLowerCase())
  );

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
    if (!existingTramiteNames.has(normalizedName)) {
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
    if (!existingPrestadorNames.has(normalizedName)) {
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
    if (!existingFolletoNames.has(normalizedName)) {
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
    const key = `${p.codigo}|${p.descripcion}|${p.descImpresa || ''}|${p.sinonimo || ''}`.trim().toLowerCase();
    if (!existingPracticaKeys.has(key)) {
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

    if (!existingCentroKeys.has(key)) {
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

  // 2. Unify Audiology specialties in prestadores
  const audiologySpecs = ['AUDÍFONOS', 'AUDIOMETRÍA', 'LOGOAUDIOMETRÍA'];
  prestadoresSnap.docs.forEach(docSnap => {
    const p = docSnap.data() as Prestador;
    const specs = p.especialidades || [];
    
    // Check if it has any audiology related specialty (accented or not)
    const hasAny = specs.some(s => {
      const upper = s.toUpperCase();
      return audiologySpecs.includes(upper) || 
             upper === 'AUDIFONOS' || 
             upper === 'AUDIOMETRIA' || 
             upper === 'LOGOAUDIOMETRIA';
    });

    if (hasAny) {
      // Create a new list of specialties:
      // 1. Remove any unaccented or accented version of the three target specialties
      // 2. Add the three canonical accented versions
      const otherSpecs = specs.filter(s => {
        const upper = s.toUpperCase();
        return !audiologySpecs.includes(upper) && 
               upper !== 'AUDIFONOS' && 
               upper !== 'AUDIOMETRIA' && 
               upper !== 'LOGOAUDIOMETRIA';
      });

      const newSpecs = [...otherSpecs, ...audiologySpecs];
      
      // Only update if the list actually changed (ignoring order)
      const currentSorted = [...specs].sort();
      const newSorted = [...newSpecs].sort();
      
      if (JSON.stringify(currentSorted) !== JSON.stringify(newSorted)) {
        batch.update(docSnap.ref, {
          especialidades: newSpecs,
          updatedAt: serverTimestamp()
        });
        migrated++;
      }
    }

    // Generic Term Unification
    const unifyTerms = (specs: string[]): string[] => {
      let mapped: string[] = [];
      const rmnExactMatches = ['RESONANCIA', 'RESONANCIA MAGNETICA', 'RMN'];
      const tacExactMatches = ['TAC', 'TOMOGRAFIA', 'TOMOGRAFIA COMPUTADA'];
      
      for (const s of specs) {
        const upper = s.toUpperCase().trim();
        
        // Split combined terms
        if (upper === 'TAC - RMN') {
          mapped.push('TOMOGRAFIA', 'RESONANCIA MAGNETICA');
          continue;
        }
        if (upper === 'RX - TAC') {
          mapped.push('RX', 'TOMOGRAFIA');
          continue;
        }

        // RMN Unification
        if (rmnExactMatches.includes(upper)) {
          mapped.push('RESONANCIA MAGNETICA');
          continue;
        }

        // Resonancia + 130 Unification
        if (upper === 'RESONANCIA +130' || upper === 'RESONANCIA+ 130' || upper === 'RESONANCIA+130') {
          mapped.push('RESONANCIA + 130');
          continue;
        }
        
        // TAC Unification
        if (tacExactMatches.includes(upper) || upper === 'TOMOGRAFÍA' || upper === 'TOMOGRAFÍA COMPUTADA') {
          mapped.push('TOMOGRAFIA');
          continue;
        }

        // Fisiatria Unification
        if (upper === 'FISIOKINESIO' || upper === 'FISIATRIA' || upper === 'FISIATRÍA' || upper === 'FISIATRIA CONSULTAS' || upper === 'FISIATRÍA CONSULTAS' || upper === 'FISIATRIA - CONSULTAS' || upper === 'FISIATRÍA - CONSULTAS') {
          mapped.push('FISIATRÍA');
          continue;
        }

        // Espinografia Unification
        if (upper === 'ESPINOGRAMA' || upper === 'ESPINOGRAFIA' || upper === 'ESPINOGRAFÍA') {
          mapped.push('ESPINOGRAFÍA');
          continue;
        }

        // Audiometria / Audifonos Unification
        if (upper === 'AUDIOMETRIA' || upper === 'AUDIOMETRÍA' || upper === 'AUDIFONOS' || upper === 'AUDÍFONOS' || upper === 'AUDIOMETRIA / AUDIFONOS' || upper === 'AUDIOMETRÍA / AUDÍFONOS' || upper === 'AUDIOMETRIA / AUDÍFONOS' || upper === 'AUDIOMETRÍA / AUDIFONOS') {
          mapped.push('AUDIOMETRÍA / AUDÍFONOS');
          continue;
        }

        // Mamotonne Unification
        if (upper === 'MAMMOTONNE' || upper === 'MAMMOTONE' || upper === 'MAMOTONE') {
          mapped.push('MAMOTONNE');
          continue;
        }

        // Neurologia Unification
        if (upper === 'NEUROLOGIA' || upper === 'NEUROLOGÍA') {
          mapped.push('NEUROLOGÍA');
          continue;
        }

        // Urologia Unification
        if (upper === 'UROLOGIA' || upper === 'UROLOGÍA') {
          mapped.push('UROLOGÍA');
          continue;
        }
        
        // Default
        let finalString = s.trim().toUpperCase();
        if (finalString.includes('MAMMOTONNE')) finalString = finalString.replace('MAMMOTONNE', 'MAMOTONNE');
        if (finalString.includes('MAMMOTONE')) finalString = finalString.replace('MAMMOTONE', 'MAMOTONNE');
        if (finalString.includes('MAMOTONE') && !finalString.includes('MAMOTONNE')) finalString = finalString.replace('MAMOTONE', 'MAMOTONNE');
        
        mapped.push(finalString);
      }
      
      // Remove duplicates
      return Array.from(new Set(mapped));
    };

    const currentSpecs = p.especialidades || [];
    const currentTopeadas = p.especialidadesTopeadas || [];
    
    const newSpecs = unifyTerms(currentSpecs);
    const newTopeadas = unifyTerms(currentTopeadas);
    
    const currentSpecsSorted = [...currentSpecs].map(s => s.trim().toUpperCase()).sort();
    const newSpecsSorted = [...newSpecs].sort();
    const currentTopeadasSorted = [...currentTopeadas].map(s => s.trim().toUpperCase()).sort();
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

  // 3. Unify and Merge San Martin Hospital / Althea
  const sanMartinCanonical = "HTAL. SAN MARTIN";
  const sanMartinVariants = [
    "HOSPITAL INTERZONAL GENERAL DE AGUDOS GENERAL SAN MARTÍN",
    "HOSPITAL INTERZONAL GENER AL DE AGUDOS GENERAL SAN MARTÍN",
    "HOSPITAL SAN MARTIN",
    "HOSPITAL DE AGUDOS GENERAL SAN MARTÍN",
    "Hospital San Martin"
  ];

  const altheaCanonical = "ALTHEA (EX VACCARINI)";
  const altheaVariants = [
    "ALTHEA CLINICA PRIVADA",
    "CL PR VACCARINI SA",
    "ALTHEA",
    "CLINICA VACCARINI",
    "VACCARINI",
    "VACARINI"
  ];

  const gutierrezCanonical = "HTAL. GUTIERREZ";
  const gutierrezVariants = [
    "Htal Zonal Ricardo Gutierrez",
    "HOSPITAL RICARDO GUTIERREZ",
    "HOSPITAL GUTIERREZ",
    "GUTIERREZ",
    "RICARDO GUTIERREZ"
  ];

  const sanRoqueCanonical = "HTAL. SAN ROQUE";
  const sanRoqueVariants = [
    "HOSPITAL ZONAL GENERAL DE AGUDOS SAN ROQUE",
    "HOSPITAL SAN ROQUE",
    "SAN ROQUE",
    "Hospital San Roque"
  ];

  const losTilosCanonical = "SANATORIO MEDICO LOS TILOS";
  const losTilosVariants = [
    "SANATORIO MÉDICO LOS TILOS SA",
    "SANATORIO MEDICO LOS TILOS",
    "SANATORIO MEDICO LOS TILOS SA",
    "LOS TILOS"
  ];

  const rossiCanonical = "HTAL. ROSSI";
  const rossiVariants = [
    "HOSPITAL INTERZONAL GRAL AGUDOS PROF DR R. ROSSI",
    "HOSPITAL INTERZONAL ROSSI",
    "HTAL. ROSSI",
    "HOSPITAL ROSSI"
  ];

  const groupsConfig = [
    { canonical: sanMartinCanonical, variants: sanMartinVariants },
    { canonical: altheaCanonical, variants: altheaVariants },
    { canonical: gutierrezCanonical, variants: gutierrezVariants },
    { canonical: sanRoqueCanonical, variants: sanRoqueVariants },
    { canonical: losTilosCanonical, variants: losTilosVariants },
    { canonical: rossiCanonical, variants: rossiVariants },
    { canonical: "GUSTAVO DILORETTO", variants: ["DI LORETO GUSTAVO", "GUSTAVO DI LORETTO"] },
    { 
      canonical: "HTAL. PRIVADO SUSAMERICANO", 
      variants: ["Hospital Privado Sudamericano", "HTAL. PRIVADO SUDAMERICANO", "HOSPITAL PRIVADO SUDAMERICANO", "Hospital Privado Susamericano"] 
    },
    {
      canonical: "HTAL. SAN JUAN DE DIOS",
      variants: [
        "HOSPITAL INTERZONAL DE AGUDOS Y CRÓNICOS SAN JUAN DE DIOS",
        "HOSPITAL ZONAL DE AGUDOS Y CRONICOS SAN JUAN DE DIOS",
        "HOSPITAL SAN JUAN DE DIOS",
        "HTAL. SAN JUAN DE DIOS"
      ]
    }
  ];

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
