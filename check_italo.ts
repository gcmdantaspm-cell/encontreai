import { db } from './src/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

async function check() {
    const snap = await getDocs(query(collection(db, 'users'), where('email', '==', 'italodantas@encontreai.com')));
    snap.docs.forEach(d => console.log(JSON.stringify(d.data(), null, 2)));
    process.exit(0);
}
check();
