
import { db } from './src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

async function run() {
  console.log("Agregando Fundación Quarello con especialidades solicitadas...");
  
  const prestadorData = {
    nombre: "FUNDACION QUARELLO",
    especialidades: ["FISIOKINESIO", "FISIATRIA"],
    localidad: "LA PLATA", // Asumiendo La Plata por el contexto general, se puede ajustar
    direccion: "",
    telefono: "",
    email: "",
    whatsapp: "",
    notas: "",
    practicas: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: "system-manual-fix"
  };

  try {
    const docRef = await addDoc(collection(db, 'prestadores'), prestadorData);
    console.log(`Prestador agregado con éxito. ID: ${docRef.id}`);
  } catch (error) {
    console.error("Error al agregar prestador:", error);
  }
}

run().catch(console.error);
