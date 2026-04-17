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
  writeBatch,
  getDocFromServer,
  setDoc
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
    return await addDoc(collection(db, TRAMITES_COLLECTION), {
      ...tramite,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, TRAMITES_COLLECTION);
  }
}

export async function updateTramite(id: string, tramite: Partial<Tramite>) {
  try {
    const docRef = doc(db, TRAMITES_COLLECTION, id);
    return await updateDoc(docRef, {
      ...tramite,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, TRAMITES_COLLECTION);
  }
}

export async function deleteTramite(id: string) {
  try {
    const docRef = doc(db, TRAMITES_COLLECTION, id);
    return await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, TRAMITES_COLLECTION);
  }
}

export async function addPrestador(prestador: Omit<Prestador, 'id'>) {
  try {
    return await addDoc(collection(db, PRESTADORES_COLLECTION), {
      ...prestador,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PRESTADORES_COLLECTION);
  }
}

export async function updatePrestador(id: string, prestador: Partial<Prestador>) {
  try {
    const docRef = doc(db, PRESTADORES_COLLECTION, id);
    return await updateDoc(docRef, {
      ...prestador,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, PRESTADORES_COLLECTION);
  }
}

export async function deletePrestador(id: string) {
  try {
    const docRef = doc(db, PRESTADORES_COLLECTION, id);
    return await deleteDoc(docRef);
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
    return await addDoc(collection(db, PRACTICAS_COLLECTION), {
      ...practica,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PRACTICAS_COLLECTION);
  }
}

export async function updatePractica(id: string, practica: Partial<PracticaOME>) {
  try {
    const docRef = doc(db, PRACTICAS_COLLECTION, id);
    return await updateDoc(docRef, {
      ...practica,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, PRACTICAS_COLLECTION);
  }
}

export async function deletePractica(id: string) {
  try {
    const docRef = doc(db, PRACTICAS_COLLECTION, id);
    return await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, PRACTICAS_COLLECTION);
  }
}

export async function addFolleto(folleto: Omit<Folleto, 'id'>) {
  try {
    return await addDoc(collection(db, FOLLETOS_COLLECTION), {
      ...folleto,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, FOLLETOS_COLLECTION);
  }
}

export async function deleteFolleto(id: string) {
  try {
    const docRef = doc(db, FOLLETOS_COLLECTION, id);
    return await deleteDoc(docRef);
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
    return await addDoc(collection(db, CENTROS_COORDINADORES_COLLECTION), {
      ...centro,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, CENTROS_COORDINADORES_COLLECTION);
  }
}

export async function updateCentroCoordinador(id: string, centro: Partial<CentroCoordinador>) {
  try {
    const docRef = doc(db, CENTROS_COORDINADORES_COLLECTION, id);
    return await updateDoc(docRef, {
      ...centro,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, CENTROS_COORDINADORES_COLLECTION);
  }
}

export async function deleteCentroCoordinador(id: string) {
  try {
    const docRef = doc(db, CENTROS_COORDINADORES_COLLECTION, id);
    return await deleteDoc(docRef);
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
    return await addDoc(collection(db, TELEFONOS_COLLECTION), {
      ...telefono,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, TELEFONOS_COLLECTION);
  }
}

export async function updateTelefono(id: string, telefono: Partial<TelefonoInterno>) {
  try {
    const docRef = doc(db, TELEFONOS_COLLECTION, id);
    return await updateDoc(docRef, {
      ...telefono,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, TELEFONOS_COLLECTION);
  }
}

export async function deleteTelefono(id: string) {
  try {
    const docRef = doc(db, TELEFONOS_COLLECTION, id);
    return await deleteDoc(docRef);
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
    centrosSnap.docs.map(doc => `${doc.data().hospital}|${doc.data().trabajador}`.toLowerCase())
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
    const key = `${c.hospital}|${c.trabajador}`.toLowerCase();
    if (!existingCentroKeys.has(key)) {
      const docRef = doc(collection(db, CENTROS_COORDINADORES_COLLECTION));
      currentChunk.push({
        ref: docRef,
        data: {
          ...c,
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
  });

  // 3. Unify San Martin Hospital names
  const canonicalName = "HTAL. SAN MARTIN";
  const variants = [
    "HOSPITAL INTERZONAL GENERAL DE AGUDOS GENERAL SAN MARTÍN",
    "HOSPITAL INTERZONAL GENER AL DE AGUDOS GENERAL SAN MARTÍN", // With potential typo user showed
    "HOSPITAL SAN MARTIN",
    "HOSPITAL DE AGUDOS GENERAL SAN MARTÍN",
    "Hospital San Martin"
  ].map(v => v.toLowerCase());

  prestadoresSnap.docs.forEach(docSnap => {
    const p = docSnap.data();
    const currentName = (p.nombre || "").trim();
    if (variants.includes(currentName.toLowerCase()) && currentName !== canonicalName) {
      batch.update(docSnap.ref, {
        nombre: canonicalName,
        updatedAt: serverTimestamp()
      });
      migrated++;
    }
  });

  centrosSnap.docs.forEach(docSnap => {
    const c = docSnap.data();
    const currentHospital = (c.hospital || "").trim();
    if (variants.includes(currentHospital.toLowerCase()) && currentHospital !== canonicalName) {
      batch.update(docSnap.ref, {
        hospital: canonicalName,
        updatedAt: serverTimestamp()
      });
      migrated++;
    }
  });

  if (migrated > 0) {
    await batch.commit();
  }
  return migrated;
}
