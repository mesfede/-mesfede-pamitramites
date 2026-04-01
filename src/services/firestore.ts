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
  getDocFromServer
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { Tramite, Prestador, Folleto } from '../types';

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

export async function seedDatabase(initialTramites: any[], initialPrestadores: any[], initialFolletos: any[] = []) {
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

  const batch = writeBatch(db);
  let addedTramites = 0;
  let addedPrestadores = 0;
  let addedFolletos = 0;

  initialTramites.forEach(t => {
    const normalizedName = (t.nombre || "").trim().toLowerCase();
    if (!existingTramiteNames.has(normalizedName)) {
      const docRef = doc(collection(db, TRAMITES_COLLECTION));
      
      // Add a sample PDF to Dapaglifozina for testing the "Kit Completo" feature
      let documents = t.documentos || [];
      if (t.nombre === "Dapaglifozina") {
        documents = [
          { 
            nombre: "Formulario_Dapaglifozina.pdf", 
            url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" 
          }
        ];
      }

      batch.set(docRef, {
        ...t,
        nombre: t.nombre.trim(),
        documentos: documents,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'system'
      });
      existingTramiteNames.add(normalizedName);
      addedTramites++;
    }
  });

  initialPrestadores.forEach(p => {
    const normalizedName = (p.nombre || "").trim().toLowerCase();
    if (!existingPrestadorNames.has(normalizedName)) {
      const docRef = doc(collection(db, PRESTADORES_COLLECTION));
      batch.set(docRef, {
        ...p,
        nombre: p.nombre.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'system'
      });
      existingPrestadorNames.add(normalizedName);
      addedPrestadores++;
    }
  });

  initialFolletos.forEach(f => {
    const normalizedName = (f.nombre || "").trim().toLowerCase();
    if (!existingFolletoNames.has(normalizedName)) {
      const docRef = doc(collection(db, FOLLETOS_COLLECTION));
      batch.set(docRef, {
        ...f,
        nombre: f.nombre.trim(),
        createdAt: serverTimestamp()
      });
      existingFolletoNames.add(normalizedName);
      addedFolletos++;
    }
  });
  
  if (addedTramites > 0 || addedPrestadores > 0 || addedFolletos > 0) {
    await batch.commit();
  }
  return { addedTramites, addedPrestadores, addedFolletos };
}
