import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = !getApps().length ? initializeApp(config) : getApp();
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const prestadoresSnap = await getDocs(collection(db, 'prestadoresOME'));
  const specs = new Set<string>();
  prestadoresSnap.docs.forEach(doc => {
    const data = doc.data();
    for (const s of (data.especialidades || [])) specs.add(s);
    for (const s of (data.especialidadesTopeadas || [])) specs.add(s);
  });
  
  const specList = Array.from(specs);
  console.log('Total unique especialidades:', specList.length);
  specList.sort();
  fs.writeFileSync('specs.json', JSON.stringify(specList, null, 2));
}

run().then(() => {
    console.log("Done");
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
