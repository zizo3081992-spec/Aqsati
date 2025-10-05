'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
import type { Client, Installment } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

type InstallmentHistoryDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  client: Client;
  installments: Installment[];
  onDeleteInstallment: (clientId: string, installmentId: string) => void;
};

export default function InstallmentHistoryDialog({
  isOpen,
  setIsOpen,
  client,
  installments,
  onDeleteInstallment,
}: InstallmentHistoryDialogProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [installmentToDelete, setInstallmentToDelete] = useState<Installment | null>(null);

  const handleDeleteClick = (installment: Installment) => {
    setInstallmentToDelete(installment);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (installmentToDelete) {
      onDeleteInstallment(client.id, installmentToDelete.id);
      setIsAlertOpen(false);
      setInstallmentToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>سجل دفعات: {client.name}</DialogTitle>
            <DialogDescription>
              جميع الدفعات المسجلة لهذا العميل.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>تاريخ الدفعة</TableHead>
                  <TableHead className="text-end">المبلغ</TableHead>
                  <TableHead className="w-[50px] text-end">حذف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.length > 0 ? (
                  installments
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((inst) => (
                      <TableRow key={inst.id}>
                        <TableCell>{inst.date}</TableCell>
                        <TableCell className="text-end">{formatCurrency(inst.amount)}</TableCell>
                        <TableCell className="text-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteClick(inst)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      لا توجد دفعات مسجلة.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه الدفعة؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              نعم، حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
