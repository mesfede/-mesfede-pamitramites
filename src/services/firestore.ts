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
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { Tramite, Prestador } from '../types';

const TRAMITES_COLLECTION = 'tramites';
const PRESTADORES_COLLECTION = 'prestadores';

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

export async function seedDatabase(initialTramites: any[], initialPrestadores: any[]) {
  const tramitesSnap = await getDocs(collection(db, TRAMITES_COLLECTION));
  const existingTramiteNames = new Set(tramitesSnap.docs.map(doc => doc.data().nombre));
  
  const batch = writeBatch(db);
  let added = 0;

  initialTramites.forEach(t => {
    if (!existingTramiteNames.has(t.nombre)) {
      const docRef = doc(collection(db, TRAMITES_COLLECTION));
      batch.set(docRef, {
        ...t,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'system'
      });
      added++;
    }
  });
  
  if (added > 0) {
    await batch.commit();
    console.log(`${added} tramites seeded successfully`);
  } else {
    console.log("No new tramites to seed");
  }
}
