
import { db } from './src/firebase';
import { doc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

async function run() {
  console.log("Fusionando duplicados confirmados...");
  const batch = writeBatch(db);

  // 1. Los Tilos
  // Main: 345wa8ik1B5N4O4Jrnng ("SANATORIO MÉDICO LOS TILOS SA")
  // Duplicate: vW3deemPGa2PuLCoazyJ ("SANATORIO MEDICO LOS TILOS")
  batch.update(doc(db, 'prestadores', '345wa8ik1B5N4O4Jrnng'), {
    updatedAt: serverTimestamp()
  });
  batch.delete(doc(db, 'prestadores', 'vW3deemPGa2PuLCoazyJ'));

  // 2. Sudamericano
  // Main: 4x7b8auQ5iYWwcjt96iD ("Hospital Privado Sudamericano")
  // Duplicate: QJiocTtlqqIvJ8dj2iPy ("HTAL. PRIVADO SUDAMERICANO")
  batch.update(doc(db, 'prestadores', '4x7b8auQ5iYWwcjt96iD'), {
    updatedAt: serverTimestamp()
  });
  batch.delete(doc(db, 'prestadores', 'QJiocTtlqqIvJ8dj2iPy'));

  // 3. Meroni
  // Main: jEE9A8KL47S5t8EQrSTH ("CLÍNICA MERONI")
  // Duplicate: A81aZTjwZP0aC3k2UWAr ("MERONI")
  batch.update(doc(db, 'prestadores', 'jEE9A8KL47S5t8EQrSTH'), {
    updatedAt: serverTimestamp()
  });
  batch.delete(doc(db, 'prestadores', 'A81aZTjwZP0aC3k2UWAr'));

  await batch.commit();
  console.log("Fusiones seguras completadas.");
}

run().catch(console.error);
