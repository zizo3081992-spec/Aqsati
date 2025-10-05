'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateEndDate, formatCurrency, getClientStatus } from '@/lib/utils';
import ClientActions from './client-actions';
import type { Client, Installment } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

type ClientTableProps = {
  clients: Client[];
  installments: Installment[];
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onAddInstallment: (installment: Omit<Installment, 'id'>) => void;
  onDeleteInstallment: (clientId: string, installmentId: string) => void;
};

export default function ClientTable({
  clients,
  installments,
  onEditClient,
  onDeleteClient,
  onAddInstallment,
  onDeleteInstallment,
}: ClientTableProps) {
  const getClientPaidAmount = (clientId: string) => {
    return installments
      .filter((inst) => inst.clientId === clientId)
      .reduce((sum, inst) => sum + inst.amount, 0);
  };

  const getClientInstallments = (clientId: string) => {
    return installments.filter((inst) => inst.clientId === clientId);
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle>قائمة العملاء</CardTitle>
        <CardDescription>إدارة بيانات العملاء وتتبع الأقساط.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العميل</TableHead>
                <TableHead className="hidden sm:table-cell">الحالة</TableHead>
                <TableHead className="hidden sm:table-cell">الهاتف</TableHead>
                <TableHead className="text-end">الإجمالي</TableHead>
                <TableHead className="text-end">المدفوع</TableHead>
                <TableHead className="text-end">المتبقي</TableHead>
                <TableHead className="hidden lg:table-cell">الأقساط</TableHead>
                <TableHead className="hidden lg:table-cell">تاريخ الانتهاء</TableHead>
                <TableHead className="w-[50px]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client) => {
                  const paid = getClientPaidAmount(client.id);
                  const remaining = client.total - paid;
                  const endDate = calculateEndDate(client.startDate, client.months);
                  const clientInstallments = getClientInstallments(client.id);
                  const { status, color } = getClientStatus(client, paid);

                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground sm:hidden">{client.phone}</div>
                        <div className="sm:hidden mt-1">
                           <Badge style={{ backgroundColor: color, color: 'white' }}>{status}</Badge>
                        </div>
                      </TableCell>
                       <TableCell className="hidden sm:table-cell">
                        <Badge style={{ backgroundColor: color, color: 'white' }} className="text-white">
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{client.phone}</TableCell>
                      <TableCell className="text-end">{formatCurrency(client.total)}</TableCell>
                      <TableCell className="text-end" style={{ color: 'hsl(142.1 76.2% 36.3%)' }}>{formatCurrency(paid)}</TableCell>
                      <TableCell className="text-end" style={{ color: 'hsl(0 84.2% 60.2%)' }}>{formatCurrency(remaining)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{client.months} أشهر</Badge>
                        <div className="text-xs text-muted-foreground">يبدأ في: {client.startDate}</div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{endDate}</TableCell>
                      <TableCell>
                        <ClientActions
                          client={client}
                          paid={paid}
                          installments={clientInstallments}
                          onEdit={onEditClient}
                          onDelete={onDeleteClient}
                          onAddInstallment={onAddInstallment}
                          onDeleteInstallment={onDeleteInstallment}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    لا توجد بيانات.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}