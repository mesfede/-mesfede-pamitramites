
import { db } from './src/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

async function run() {
  const q = query(collection(db, 'prestadores'), limit(50));
  const snap = await getDocs(q);
  snap.docs.forEach(d => {
    console.log(JSON.stringify({ id: d.id, ...d.data() }));
  });
}

run().catch(console.error);
