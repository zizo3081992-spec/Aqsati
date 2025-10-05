'use client';

import { useState, useRef, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { FileWarning, Loader2, UploadCloud } from 'lucide-react';
import type { Client } from '@/lib/types';
import { format } from 'date-fns';

type ImportClientsDialogProps = {
  children: ReactNode;
  onClientsImported: (clients: Omit<Client, 'id'>[]) => void;
};

// Define the shape of the parsed data
type ParsedClient = {
  name: string;
  phone: string;
  total: number;
  months: number;
  startDate: string;
};

export default function ImportClientsDialog({ children, onClientsImported }: ImportClientsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedClient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setParsedData([]);

    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const requiredHeaders = ['name', 'phone', 'total', 'months', 'startDate'];
        const actualHeaders = results.meta.fields || [];
        const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h));

        if (missingHeaders.length > 0) {
          setError(`الملف غير صالح. الأعمدة التالية مفقودة: ${missingHeaders.join(', ')}`);
          setIsLoading(false);
          return;
        }

        const validData: ParsedClient[] = [];
        const validationErrors: string[] = [];

        results.data.forEach((row, index) => {
          const name = row.name?.trim();
          const phone = row.phone?.trim();
          const total = parseFloat(row.total);
          const months = parseInt(row.months, 10);
          const startDateRaw = row.startDate?.trim();

          if (!name || !phone || isNaN(total) || isNaN(months) || !startDateRaw) {
            validationErrors.push(`الصف ${index + 2}: يحتوي على بيانات ناقصة أو غير صالحة.`);
            return;
          }
          
          let formattedDate;
          try {
            formattedDate = format(new Date(startDateRaw), 'yyyy-MM-dd');
          } catch {
            validationErrors.push(`الصف ${index + 2}: تنسيق التاريخ غير صالح (يجب أن يكون YYYY-MM-DD).`);
            return;
          }

          validData.push({
            name,
            phone,
            total,
            months,
            startDate: formattedDate,
          });
        });

        if (validationErrors.length > 0) {
            setError(validationErrors.join('\n'));
        } else {
            setParsedData(validData);
        }
        
        setIsLoading(false);
      },
      error: (err) => {
        setError(`حدث خطأ أثناء قراءة الملف: ${err.message}`);
        setIsLoading(false);
      },
    });
  };

  const handleImportConfirm = () => {
    if (parsedData.length > 0) {
      onClientsImported(parsedData);
      toast({
        title: "جاري الاستيراد...",
        description: `سيتم إضافة ${parsedData.length} عميل جديد.`,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setParsedData([]);
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) handleClose();
        else setIsOpen(true);
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>استيراد عملاء من ملف CSV</DialogTitle>
          <DialogDescription>
            قم برفع ملف CSV لإضافة عدة عملاء دفعة واحدة. يجب أن يحتوي الملف على الأعمدة التالية باللغة الإنجليزية: 
            `name`, `phone`, `total`, `months`, `startDate`.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-2">
                <UploadCloud className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-medium">اختر ملفًا لرفعه</h3>
                <p className="text-sm text-muted-foreground text-center">
                    تأكد من أن تنسيق التاريخ هو YYYY-MM-DD
                </p>
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="csv-upload" />
                <Button asChild>
                    <label htmlFor="csv-upload">اختر ملف</label>
                </Button>
            </div>
          
          {isLoading && <div className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /><span>جاري المعالجة...</span></div>}
          
          {error && (
            <Alert variant="destructive">
              <FileWarning className="h-4 w-4" />
              <AlertTitle>خطأ في الملف</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
            </Alert>
          )}

          {parsedData.length > 0 && (
            <div className="mt-4">
                <h4 className="font-medium mb-2">بيانات للمعاينة قبل الاستيراد ({parsedData.length} سجلات)</h4>
                <ScrollArea className="h-60 w-full rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الاسم</TableHead>
                                <TableHead>الهاتف</TableHead>
                                <TableHead className="text-end">المبلغ</TableHead>
                                <TableHead className="text-end">الشهور</TableHead>
                                <TableHead>تاريخ البدء</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.map((client, index) => (
                                <TableRow key={index}>
                                    <TableCell>{client.name}</TableCell>
                                    <TableCell>{client.phone}</TableCell>
                                    <TableCell className="text-end">{client.total}</TableCell>
                                    <TableCell className="text-end">{client.months}</TableCell>
                                    <TableCell>{client.startDate}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button onClick={handleImportConfirm} disabled={parsedData.length === 0 || !!error}>
            تأكيد الاستيراد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
