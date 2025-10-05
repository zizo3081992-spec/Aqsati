'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FileText, PlusCircle, Search, LogOut, Loader2, Download, Upload, Mail, User, Moon, Sun, MonitorSmartphone } from 'lucide-react';
import ClientForm from './client-form';
import type { Client, Installment } from '@/lib/types';
import { Logo, WhatsAppIcon } from '@/components/icons';
import SummaryReportDialog from './summary-report-dialog';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { generateWhatsAppMessage } from '@/ai/flows/automated-whatsapp-messages';
import { calculateEndDate, getClientStatus } from '@/lib/utils';
import Papa from 'papaparse';
import ImportClientsDialog from './import-clients-dialog';
import Link from 'next/link';
import { useTheme } from 'next-themes';

type DashboardHeaderProps = {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClientAdded: (client: Client) => void;
  onClientsImported: (clients: Omit<Client, 'id'>[]) => void;
  clients: Client[];
  installments: Installment[];
  onLogout: () => void;
};

export default function DashboardHeader({
  searchTerm,
  onSearchChange,
  onClientAdded,
  onClientsImported,
  clients,
  installments,
  onLogout,
}: DashboardHeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isBulkWhatsAppLoading, setIsBulkWhatsAppLoading] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const { setTheme } = useTheme();

  const handleClientAdded = (client: Client) => {
    setSheetOpen(false);
    onClientAdded(client);
  };

  const getClientPaidAmount = (clientId: string) => {
    return installments
      .filter((inst) => inst.clientId === clientId)
      .reduce((sum, inst) => sum + inst.amount, 0);
  };

  const handleSendAllWhatsApp = async () => {
    setIsBulkWhatsAppLoading(true);
    toast({
      title: 'جاري تجهيز الرسائل للعملاء المتأخرين...',
      description: 'قد يتطلب الأمر السماح بفتح نوافذ منبثقة متعددة.',
    });

    try {
      const lateClients = clients.filter(client => {
        const paid = getClientPaidAmount(client.id);
        const { status } = getClientStatus(client, paid);
        return status === 'متأخر';
      });

      if (lateClients.length === 0) {
        toast({
          title: 'لا يوجد عملاء متأخرون',
          description: 'جميع العملاء منتظمون في الدفع.',
        });
        setIsBulkWhatsAppLoading(false);
        return;
      }

      for (const client of lateClients) {
        const paid = getClientPaidAmount(client.id);
        const remaining = client.total - paid;
        
        if (remaining <= 0) continue;

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
        
        const whatsappUrl = `https://wa.me/${client.phone}?text=${encodeURIComponent(result.message)}`;
        window.open(whatsappUrl, '_blank');
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
        console.error('Failed to generate bulk WhatsApp messages', error);
        toast({
            variant: 'destructive',
            title: 'خطأ',
            description: 'فشل في إنشاء رسائل WhatsApp الجماعية.',
        });
    } finally {
        setIsBulkWhatsAppLoading(false);
    }
  };

  const getClientsAsCsvString = () => {
    const clientsToExport = clients.map(client => {
        return {
            'name': client.name,
            'phone': client.phone,
            'total': client.total,
            'months': client.months,
            'startDate': client.startDate,
        };
    });
    return Papa.unparse(clientsToExport);
  }

  const handleExportData = () => {
    const csv = getClientsAsCsvString();
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Aqsati_Clients_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "نجاح",
      description: "تم تصدير البيانات بنجاح."
    });
  };

  const handleEmailExport = () => {
    if (!user?.email) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "لا يمكن العثور على بريدك الإلكتروني لإرسال البيانات."
      });
      return;
    }
    const csvData = getClientsAsCsvString();
    const subject = "تصدير بيانات أقساطي";
    const body = `مرحباً،\n\nهذه هي بيانات عملائك المصدرة من تطبيق أقساطي.\nيمكنك نسخ المحتوى أدناه ولصقه مباشرة في Google Sheets أو Excel.\n\n-------------------------------------\n\n${csvData}`;
    const mailtoLink = `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    toast({
      title: "تم التحضير",
      description: "جاري فتح تطبيق الإيميل لإرسال البيانات."
    });
  };
  
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="flex items-center gap-2">
        <Logo className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-2xl font-bold text-foreground">أقساطي</h1>
      </div>
      <div className="relative flex-1 md:grow-0">
        <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="ابحث بالاسم أو الهاتف..."
          className="w-full rounded-lg bg-background ps-8 md:w-[200px] lg:w-[320px]"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="ms-auto flex items-center gap-2">
        <ImportClientsDialog onClientsImported={onClientsImported}>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <Upload className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              استيراد
            </span>
          </Button>
        </ImportClientsDialog>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1">
                    <Download className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        تصدير
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>خيارات التصدير</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportData}>
                    <Download className="me-2 h-4 w-4" />
                    تنزيل ملف CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEmailExport}>
                    <Mail className="me-2 h-4 w-4" />
                    إرسال إلى الإيميل
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <SummaryReportDialog clients={clients} installments={installments}>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              تقرير
            </span>
          </Button>
        </SummaryReportDialog>

        <Button 
          size="sm" 
          className="h-8 gap-1 bg-[#25D366] text-white hover:bg-[#25D366]/90" 
          onClick={handleSendAllWhatsApp} 
          disabled={isBulkWhatsAppLoading}
        >
            {isBulkWhatsAppLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
                <WhatsAppIcon className="h-3.5 w-3.5" />
            )}
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            WhatsApp للمتأخرين
          </span>
        </Button>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="h-8 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                إضافة عميل
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>إضافة عميل جديد</SheetTitle>
            </SheetHeader>
            <ClientForm onFormSubmit={handleClientAdded} />
          </SheetContent>
        </Sheet>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <Avatar>
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                    <AvatarFallback>👤</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.displayName || user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                 <Link href="/profile">
                  <User className="me-2 h-4 w-4" />
                  الملف الشخصي
                 </Link>
               </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <MonitorSmartphone className="me-2 h-4 w-4" />
                    السمة
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme('light')}>
                        <Sun className="me-2 h-4 w-4" />
                        فاتح
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('dark')}>
                        <Moon className="me-2 h-4 w-4" />
                        داكن
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('system')}>
                        <MonitorSmartphone className="me-2 h-4 w-4" />
                        النظام
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="me-2 h-4 w-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>
    </header>
  );
}
