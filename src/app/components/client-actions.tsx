'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, MoreHorizontal, Pen, Trash2, DollarSign, History } from 'lucide-react';
import type { Client, Installment } from '@/lib/types';
import ClientForm from './client-form';
import InstallmentForm from './installment-form';
import { WhatsAppIcon } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { generateWhatsAppMessage } from '@/ai/flows/automated-whatsapp-messages';
import { calculateEndDate } from '@/lib/utils';
import InstallmentHistoryDialog from './installment-history-dialog';

type ClientActionsProps = {
  client: Client;
  paid: number;
  installments: Installment[];
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
  onAddInstallment: (installment: Omit<Installment, 'id'>) => void;
  onDeleteInstallment: (clientId: string, installmentId: string) => void;
};

export default function ClientActions({
  client,
  paid,
  installments,
  onEdit,
  onDelete,
  onAddInstallment,
  onDeleteInstallment,
}: ClientActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isWhatsAppLoading, setIsWhatsAppLoading] = useState(false);
  const { toast } = useToast();

  const handleEditSubmit = (editedClient: Client) => {
    onEdit(editedClient);
    setIsEditDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    onDelete(client.id);
    setIsDeleteDialogOpen(false);
  };

  const handleAddInstallmentSubmit = (installment: Omit<Installment, 'id'>) => {
    onAddInstallment(installment);
    setIsAddPaymentDialogOpen(false);
  };

  const handleWhatsAppClick = async () => {
    setIsWhatsAppLoading(true);
    try {
      const remaining = client.total - paid;
      const endDate = calculateEndDate(client.startDate, client.months);

      const result = await generateWhatsAppMessage({
        name: client.name,
        phone: client.phone,
        total: client.total,
        paid: paid,
        remaining: remaining,
        months: client.months,
        startDate: client.startDate,
        endDate: endDate,
      });

      // Clean the phone number for the wa.me link
      const cleanPhoneNumber = client.phone.replace(/[\s+()-]/g, '');

      const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(result.message)}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Failed to generate WhatsApp message', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في إنشاء رسالة WhatsApp.',
      });
    } finally {
      setIsWhatsAppLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-haspopup="true" size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">قائمة التحكم</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>التحكم</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setIsAddPaymentDialogOpen(true)}>
            <DollarSign className="me-2 h-4 w-4" />
            إضافة دفعة
          </DropdownMenuItem>
           <DropdownMenuItem onSelect={() => setIsHistoryDialogOpen(true)}>
            <History className="me-2 h-4 w-4" />
            سجل الدفعات
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
            <Pen className="me-2 h-4 w-4" />
            تعديل
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleWhatsAppClick} disabled={isWhatsAppLoading}>
             {isWhatsAppLoading ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
             ) : (
                <WhatsAppIcon className="me-2 h-4 w-4" />
             )}
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive">
            <Trash2 className="me-2 h-4 w-4" />
            حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>تعديل بيانات العميل</SheetTitle>
          </SheetHeader>
          <ClientForm client={client} onFormSubmit={handleEditSubmit} />
        </SheetContent>
      </Sheet>

      <Dialog open={isAddPaymentDialogOpen} onOpenChange={setIsAddPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة دفعة جديدة لـ {client.name}</DialogTitle>
          </DialogHeader>
          <InstallmentForm clientId={client.id} onFormSubmit={handleAddInstallmentSubmit} />
        </DialogContent>
      </Dialog>
      
      <InstallmentHistoryDialog
        isOpen={isHistoryDialogOpen}
        setIsOpen={setIsHistoryDialogOpen}
        client={client}
        installments={installments}
        onDeleteInstallment={onDeleteInstallment}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيؤدي هذا الإجراء إلى حذف بيانات العميل وجميع أقساطه بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              نعم، حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
