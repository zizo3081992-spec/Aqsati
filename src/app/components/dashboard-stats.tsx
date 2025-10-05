'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Client, Installment } from '@/lib/types';
import { Users, Wallet, Landmark, PiggyBank } from 'lucide-react';

type DashboardStatsProps = {
  clients: Client[];
  installments: Installment[];
};

export default function DashboardStats({ clients, installments }: DashboardStatsProps) {
  const totalReceivables = clients.reduce((sum, client) => sum + client.total, 0);
  const totalPaid = installments.reduce((sum, inst) => sum + inst.amount, 0);
  const totalOutstanding = totalReceivables - totalPaid;

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي المستحقات</CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalReceivables)}</div>
          <p className="text-xs text-muted-foreground">مجموع المبالغ من كل العملاء</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي المدفوع</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
           <p className="text-xs text-muted-foreground">مجموع الأقساط المحصلة</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي المتبقي</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</div>
          <p className="text-xs text-muted-foreground">المبالغ المتبقية للتحصيل</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">عدد العملاء</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clients.length}</div>
          <p className="text-xs text-muted-foreground">إجمالي العملاء المسجلين</p>
        </CardContent>
      </Card>
    </div>
  );
}
