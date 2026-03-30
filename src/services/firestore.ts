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
import { Tramite, Prestador } from '../types';

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
  const storageRef = ref(storage, `tramites/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return { nombre: file.name, url };
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
  return addDoc(collection(db, TRAMITES_COLLECTION), {
    ...tramite,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid
  });
}

export async function updateTramite(id: string, tramite: Partial<Tramite>) {
  const docRef = doc(db, TRAMITES_COLLECTION, id);
  return updateDoc(docRef, {
    ...tramite,
    updatedAt: serverTimestamp()
  });
}

export async function deleteTramite(id: string) {
  const docRef = doc(db, TRAMITES_COLLECTION, id);
  return deleteDoc(docRef);
}

export async function addPrestador(prestador: Omit<Prestador, 'id'>) {
  return addDoc(collection(db, PRESTADORES_COLLECTION), {
    ...prestador,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid
  });
}

export async function updatePrestador(id: string, prestador: Partial<Prestador>) {
  const docRef = doc(db, PRESTADORES_COLLECTION, id);
  return updateDoc(docRef, {
    ...prestador,
    updatedAt: serverTimestamp()
  });
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

export async function seedDatabase(initialTramites: any[], initialPrestadores: any[]) {
  const tramitesSnap = await getDocs(collection(db, TRAMITES_COLLECTION));
  const existingTramiteNames = new Set(
    tramitesSnap.docs.map(doc => (doc.data().nombre || "").trim().toLowerCase())
  );
  
  const prestadoresSnap = await getDocs(collection(db, PRESTADORES_COLLECTION));
  const existingPrestadorNames = new Set(
    prestadoresSnap.docs.map(doc => (doc.data().nombre || "").trim().toLowerCase())
  );

  const batch = writeBatch(db);
  let addedTramites = 0;
  let addedPrestadores = 0;

  initialTramites.forEach(t => {
    const normalizedName = (t.nombre || "").trim().toLowerCase();
    if (!existingTramiteNames.has(normalizedName)) {
      const docRef = doc(collection(db, TRAMITES_COLLECTION));
      batch.set(docRef, {
        ...t,
        nombre: t.nombre.trim(),
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
  
  if (addedTramites > 0 || addedPrestadores > 0) {
    await batch.commit();
  }
  return { addedTramites, addedPrestadores };
}
