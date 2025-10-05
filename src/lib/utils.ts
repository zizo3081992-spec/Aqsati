import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { addMonths, format, differenceInMonths, startOfDay } from "date-fns";
import type { Client } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}


export function calculateEndDate(startDate: string, months: number): string {
  if (!startDate || isNaN(months)) return 'N/A';
  const start = new Date(startDate);
  const end = addMonths(start, months);
  return format(end, 'yyyy-MM-dd');
}

export function getClientStatus(client: Client, paidAmount: number): { status: string; color: string } {
    const remaining = client.total - paidAmount;
    if (remaining <= 0) {
      return { status: 'مدفوع', color: 'hsl(142.1 76.2% 36.3%)' }; // Green
    }
  
    const monthlyInstallment = client.total / client.months;
    const today = startOfDay(new Date());
    const startDate = startOfDay(new Date(client.startDate));
  
    // Calculate months passed since the start date. Add 1 because it's inclusive.
    const monthsPassed = differenceInMonths(today, startDate);
  
    // If payments haven't started yet or it's the first month
    if (monthsPassed < 0) {
       return { status: 'ساري', color: 'hsl(205 90% 40%)' }; // Blue
    }

    const expectedAmount = (monthsPassed + 1) * monthlyInstallment;
  
    if (paidAmount < expectedAmount) {
      return { status: 'متأخر', color: 'hsl(0 84.2% 60.2%)' }; // Red
    }
  
    return { status: 'ساري', color: 'hsl(205 90% 40%)' }; // Blue
}