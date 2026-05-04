import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const snap = await getDocs(collection(db, 'tramites'));
  let found = false;
  for (const item of snap.docs) {
    if (item.data().nombre === 'ITEM') {
      console.log('Found ITEM, updating to ITEM / INSUMOS VE');
      await updateDoc(doc(db, 'tramites', item.id), {
        nombre: 'ITEM / INSUMOS VE'
      });
      found = true;
    }
  }
  if (!found) {
    console.log('No item found with name ITEM');
  }
  process.exit(0);
}
run();
