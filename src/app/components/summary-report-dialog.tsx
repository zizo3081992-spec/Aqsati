'use client';

import { useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { generateSummaryReport } from '@/ai/flows/generate-summary-reports';
import type { Client, Installment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, getClientStatus } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type SummaryReportDialogProps = {
  clients: Client[];
  installments: Installment[];
  children: ReactNode;
};

export default function SummaryReportDialog({
  clients,
  installments,
  children,
}: SummaryReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const totalReceivables = clients.reduce((sum, client) => sum + client.total, 0);
  const totalPaid = installments.reduce((sum, inst) => sum + inst.amount, 0);
  const totalOutstanding = totalReceivables - totalPaid;

  const getClientPaidAmount = (clientId: string) => {
    return installments
      .filter((inst) => inst.clientId === clientId)
      .reduce((sum, inst) => sum + inst.amount, 0);
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setReport('');
    try {
      const clientsSummary = clients.map(client => {
        const paid = getClientPaidAmount(client.id);
        const { status } = getClientStatus(client, paid);
        return {
          name: client.name,
          total: client.total,
          paid: paid,
          remaining: client.total - paid,
          status: status
        };
      });

      const result = await generateSummaryReport({
        totalReceivables,
        totalPaid,
        totalOutstanding,
        clients: clientsSummary
      });

      setReport(result.report);
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل إنشاء التقرير. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ملخص مالي</DialogTitle>
          <DialogDescription>
            احصل على تحليل ورؤى ذكية حول وضعك المالي.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>إجمالي المستحقات</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(totalReceivables)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>إجمالي المدفوع</CardDescription>
              <CardTitle className="text-2xl text-green-600">{formatCurrency(totalPaid)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>إجمالي المتبقي</CardDescription>
              <CardTitle className="text-2xl text-red-600">{formatCurrency(totalOutstanding)}</CardTitle>
            </CardHeader>
          </Card>

          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                جاري إنشاء رؤى...
              </>
            ) : (
              'إنشاء رؤى بالذكاء الاصطناعي'
            )}
          </Button>

          {report && (
            <Card className="mt-4 bg-secondary">
                <CardHeader>
                    <CardTitle className="text-lg">رؤى الذكاء الاصطناعي</CardTitle>
                </CardHeader>
              <CardContent>
                <div className="text-sm text-secondary-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br />') }} />
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
