import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const querySnapshot = await getDocs(collection(db, "prestadores"));
  for (const document of querySnapshot.docs) {
    const data = document.data();
    if (data.nombre && data.nombre !== data.nombre.toUpperCase()) {
      console.log(`Updating ${data.nombre} -> ${data.nombre.toUpperCase()}`);
      await updateDoc(doc(db, "prestadores", document.id), {
        nombre: data.nombre.toUpperCase()
      });
    }
  }
  console.log("Done");
}

run();
