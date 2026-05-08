const { getApp, getApps, initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, serverTimestamp, writeBatch, doc } = require('firebase/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = !getApps().length ? initializeApp(config) : getApp();
const db = getFirestore(app, config.firestoreDatabaseId);

const prestadores = [
  { nombre: 'IPENSA', telefono: '221-427 1190', direccion: 'Calle 59 # 434 entre 3 y 4, La Plata', email: 'nefrologia-dialisis@ipensa.com' },
  { nombre: 'Diálisis y nefrología srl (Mater dei)', telefono: '221-4210993 / 221-4234110', direccion: '45 e 13 y 14, La Plata', email: 'dianefro@fibertel.com.ar' },
  { nombre: 'Fresenius MC', telefono: '221-4536246 / 221-4571471', direccion: '31 e 63 y 64 #1478, La Plata', email: 'la.plata-adm.clinics-r-arg@fmc-ag.com' },
  { nombre: 'Nefrodialisis srl (Hospital Español)', telefono: '221-4838350', direccion: '9 e 35 y 36, La Plata', email: 'nefrodialisis_srl@yahoo.com.ar' },
  { nombre: 'Nefroexcel srl', telefono: '221-4534727', direccion: '51 entre 17 y 18 #1111, La Plata', email: 'nefroexcel.srl@hotmail.com' },
  { nombre: 'Diaziza (Sanatorio Argentino)', telefono: '221-4278007', direccion: '56 #874 entre 12 y 13, La Plata', email: 'dialisisargentino@yahoo.com.ar' },
  { nombre: 'Terapia Renal de Lobos', telefono: '2227-431116', direccion: 'Las Heras #344, Lobos', email: 'terapiarenaldelobos@gmail.com' },
  { nombre: 'San Bruno srl', telefono: '2226-42-3963', direccion: 'Mitre #468, Cañuelas', email: 'canuelas@strargentina.com.ar' },
  { nombre: 'Centro Nefrológico Chascomús', telefono: '2241-422610', direccion: 'Cramer #58, Chascomús', email: 'cnchascomus@yahoo.com.ar' }
];

async function run() {
  const batch = writeBatch(db);
  const pIds = [];
  
  // Find current tramites to not duplicate DIÁLISIS
  const tSnap = await getDocs(collection(db, 'tramitesOME'));
  const existing = tSnap.docs.find(d => d.data().nombre.toUpperCase().includes('DIALISIS') || d.data().nombre.toUpperCase().includes('DIÁLISIS'));
  
  if (existing) {
    console.log("Already exists!");
    return;
  }

  // Create prestadores
  for (const p of prestadores) {
    const o = {
      ...p,
      especialidades: ['DIÁLISIS', 'NEFROLOGÍA'],
      categoria: 'Médicos o Centros OME',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const ref = doc(collection(db, 'prestadoresOME'));
    batch.set(ref, o);
    pIds.push(ref.id);
  }

  const descLines = [];
  for (const p of prestadores) {
    descLines.push(`${p.nombre}|${p.telefono}|${p.direccion}|${p.email}`);
  }

  const tramite = {
    nombre: 'DIÁLISIS',
    categoria: 'Especialidades Médicas',
    descripcion: descLines.join('\n'), // pipe separated so we can parse it as a table
    prestadoresIds: pIds, // link these created prestadores to the tramite
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const trRef = doc(collection(db, 'tramitesOME'));
  batch.set(trRef, tramite);

  await batch.commit();
  console.log("Done inserting.");
}
run().catch(console.error);
