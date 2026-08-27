import { db } from './src/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function check() {
    const snap = await getDocs(collection(db, 'users'));
    snap.docs.forEach(d => console.log(d.data().email));
    process.exit(0);
}
check();
