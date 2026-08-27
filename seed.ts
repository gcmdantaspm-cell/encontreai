import { auth, db } from './src/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';

async function seed() {
    try {
        const cred1 = await createUserWithEmailAndPassword(auth, 'gabrielgcm@encontreai.com', '102030');
        await setDoc(doc(db, 'users', cred1.user.uid), {
            name: 'Gabriel GCM', email: 'gabrielgcm@encontreai.com', role: 'professional',
            profession: 'Especialista em Segurança', rating: 5, reviewsCount: 15,
            avatarInitial: 'G', verified: true, currentMode: 'professional',
            description: 'Especialista em segurança física e eletrônica, instalação de CFTV, alarmes e consultoria de segurança.'
        });
        await addDoc(collection(db, 'services'), {
            professionalId: cred1.user.uid, title: 'Instalação de Câmeras (CFTV)', price: 450,
            duration: '4h', description: 'Instalação de até 4 câmeras de segurança com configuração para acesso via celular.',
            imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&h=400&fit=crop'
        });
        await addDoc(collection(db, 'services'), {
            professionalId: cred1.user.uid, title: 'Sistema de Alarme', price: 300,
            duration: '3h', description: 'Instalação de central de alarme e sensores de movimento/abertura.',
            imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=400&fit=crop'
        });
        await addDoc(collection(db, 'services'), {
            professionalId: cred1.user.uid, title: 'Consultoria de Segurança', price: 200,
            duration: '2h', description: 'Visita técnica para avaliação de vulnerabilidades do seu imóvel ou comércio.',
            imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop'
        });
        console.log("Criado Gabriel");
    } catch(e: any) {
        console.log("Erro Gabriel:", e.message);
    }

    try {
        const cred2 = await createUserWithEmailAndPassword(auth, 'italodantas@encontreai.com', '102030');
        await setDoc(doc(db, 'users', cred2.user.uid), {
            name: 'Ítalo Dantas', email: 'italodantas@encontreai.com', role: 'professional',
            profession: 'Profissional de TI', rating: 5, reviewsCount: 10,
            avatarInitial: 'I', verified: true, currentMode: 'professional',
            description: 'Desenvolvedor Full-Stack, manutenção de computadores, redes e suporte técnico.'
        });
        await addDoc(collection(db, 'services'), {
            professionalId: cred2.user.uid, title: 'Formatação e Backup', price: 150,
            duration: '3h', description: 'Formatação de Windows, instalação de drivers, pacote Office e backup de arquivos.',
            imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&h=400&fit=crop'
        });
        await addDoc(collection(db, 'services'), {
            professionalId: cred2.user.uid, title: 'Configuração de Rede Wi-Fi', price: 120,
            duration: '1h', description: 'Instalação e configuração de roteadores e repetidores de sinal para melhor cobertura.',
            imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&h=400&fit=crop'
        });
        await addDoc(collection(db, 'services'), {
            professionalId: cred2.user.uid, title: 'Desenvolvimento de Landing Page', price: 800,
            duration: 'A Combinar', description: 'Criação de site institucional de página única responsivo para o seu negócio.',
            imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop'
        });
        console.log("Criado Ítalo");
    } catch(e: any) {
        console.log("Erro Ítalo:", e.message);
    }

    process.exit(0);
}
seed();
