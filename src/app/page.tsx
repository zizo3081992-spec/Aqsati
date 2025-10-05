'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, Installment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import ClientTable from './components/client-table';
import DashboardHeader from './components/dashboard-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useAuth } from '@/firebase/provider';
import DashboardStats from './components/dashboard-stats';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const clientsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'clients');
  }, [firestore, user]);

  const { data: clients, isLoading: isClientsLoading } = useCollection<Client>(clientsQuery);

  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isInstallmentsLoading, setIsInstallmentsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchAllInstallments() {
      if (!clients || !user || !firestore) {
        setIsInstallmentsLoading(false);
        return;
      };
      
      setIsInstallmentsLoading(true);
      const allInstallments: Installment[] = [];
      
      for (const client of clients) {
        try {
            const installmentsCollectionRef = collection(firestore, 'users', user.uid, 'clients', client.id, 'installments');
            const installmentsSnapshot = await getDocs(installmentsCollectionRef);
            installmentsSnapshot.forEach(doc => {
              allInstallments.push({ id: doc.id, ...doc.data() } as Installment);
            });
        } catch (error) {
            console.error(`Could not fetch installments for client ${client.id}`, error);
        }
      }
      
      setInstallments(allInstallments);
      setIsInstallmentsLoading(false);
    }

    if (!isClientsLoading) {
        fetchAllInstallments();
    }
  }, [clients, user, firestore, isClientsLoading]);


  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchTerm) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  const handleAddClient = useCallback((client: Omit<Client, 'id'>) => {
    if (!clientsQuery) return;
    const docRef = doc(clientsQuery);
    const newClient: Client = { ...client, id: docRef.id };
    setDocumentNonBlocking(docRef, newClient, {});
    toast({
      title: 'نجاح',
      description: 'تمت إضافة العميل بنجاح.',
    });
  }, [clientsQuery, toast]);

  const handleImportClients = useCallback(async (newClients: Omit<Client, 'id'>[]) => {
    if (!user || !firestore) return;
    const batch = writeBatch(firestore);
    const clientsCollectionRef = collection(firestore, 'users', user.uid, 'clients');

    newClients.forEach((client) => {
        const docRef = doc(clientsCollectionRef);
        // Assign the generated ID to the client object before adding it to the batch
        const clientWithId: Client = { ...client, id: docRef.id };
        batch.set(docRef, clientWithId);
    });

    try {
        await batch.commit();
        toast({
            title: 'نجاح',
            description: `تم استيراد ${newClients.length} عميل بنجاح.`,
        });
    } catch (error) {
        console.error("Failed to import clients in batch:", error);
        toast({
            variant: 'destructive',
            title: 'خطأ في الاستيراد',
            description: 'فشل في إضافة العملاء. يرجى المحاولة مرة أخرى.',
        });
    }
  }, [user, firestore, toast]);

  const handleEditClient = useCallback((updatedClient: Client) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'clients', updatedClient.id);
    setDocumentNonBlocking(docRef, updatedClient, { merge: true });
    toast({
      title: 'نجاح',
      description: 'تم تعديل بيانات العميل بنجاح.',
    });
  }, [user, firestore, toast]);

  const handleDeleteClient = useCallback(async (clientId: string) => {
    if (!user || !firestore) return;
    
    const clientDocRef = doc(firestore, 'users', user.uid, 'clients', clientId);
    
    // Delete all installments in the subcollection first
    const installmentsColRef = collection(clientDocRef, 'installments');
    const installmentsSnapshot = await getDocs(installmentsColRef);
    const batch = writeBatch(firestore);
    installmentsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Then delete the client document
    deleteDocumentNonBlocking(clientDocRef);
    setInstallments(prev => prev.filter(inst => inst.clientId !== clientId));

    toast({
      variant: 'destructive',
      title: 'تم الحذف',
      description: 'تم حذف بيانات العميل وجميع أقساطه بنجاح.',
    });
  }, [user, firestore, toast]);


  const handleAddInstallment = useCallback((installment: Omit<Installment, 'id'>) => {
    if (!user || !firestore) return;
    const installmentsColRef = collection(firestore, 'users', user.uid, 'clients', installment.clientId, 'installments');
    addDocumentNonBlocking(installmentsColRef, installment).then(docRef => {
        if(docRef) {
            setInstallments(prev => [...prev, {id: docRef.id, ...installment}])
        }
    });
    toast({
      title: 'نجاح',
      description: 'تمت إضافة الدفعة بنجاح.',
    });
  }, [user, firestore, toast]);
  
  const handleDeleteInstallment = useCallback(async (clientId: string, installmentId: string) => {
    if (!user || !firestore) return;
    const installmentDocRef = doc(firestore, 'users', user.uid, 'clients', clientId, 'installments', installmentId);
    
    // Using await here to ensure UI state updates after deletion
    await deleteDoc(installmentDocRef);
    
    setInstallments(prev => prev.filter(inst => inst.id !== installmentId));
    
    toast({
      variant: 'destructive',
      title: 'تم حذف الدفعة',
      description: 'تم حذف الدفعة بنجاح.',
    });
  }, [user, firestore, toast]);

  const handleClientFormSubmit = (data: Client) => {
    if (clients?.some(c => c.id === data.id)) {
      handleEditClient(data);
    } else {
      const { id, ...clientData } = data;
      handleAddClient(clientData);
    }
  }

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
    }
    router.push('/login');
  };

  if (isUserLoading || isClientsLoading || isInstallmentsLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40 p-4 md:p-8">
         <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-[320px]" />
            <div className="ms-auto flex items-center gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
         </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mt-8">
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-[500px] w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <DashboardHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClientAdded={handleClientFormSubmit}
        onClientsImported={handleImportClients}
        clients={clients || []}
        installments={installments || []}
        onLogout={handleLogout}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <DashboardStats clients={clients || []} installments={installments || []} />
        <ClientTable
          clients={filteredClients}
          installments={installments || []}
          onEditClient={handleEditClient}
          onDeleteClient={handleDeleteClient}
          onAddInstallment={handleAddInstallment}
          onDeleteInstallment={handleDeleteInstallment}
        />
      </main>
      <footer className="mt-auto border-t bg-card py-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Aqsati. كل الحقوق محفوظة.
        <br />
        للتواصل مع المبرمج: <a href="mailto:abdelaziz92mohamed@gmail.com" className="underline">abdelaziz92mohamed@gmail.com</a>
      </footer>
    </div>
  );
}
