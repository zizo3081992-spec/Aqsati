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
  try {
    if (!startDate || isNaN(months)) return 'N/A';
    const start = new Date(startDate);
    // Check if the start date is valid before proceeding
    if (isNaN(start.getTime())) {
      return 'N/A';
    }
    const end = addMonths(start, months);
    return format(end, 'yyyy-MM-dd');
  } catch (error) {
    console.error("Error calculating end date:", error);
    return 'N/A';
  }
}

export function getClientStatus(client: Client, paidAmount: number): { status: string; color: string } {
    const remaining = client.total - paidAmount;
    if (remaining <= 0) {
      return { status: 'مدفوع', color: 'hsl(142.1 76.2% 36.3%)' }; // Green
    }
  
    const monthlyInstallment = client.total / client.months;
    const today = startOfDay(new Date());
    const startDate = startOfDay(new Date(client.startDate));
  
    // Check if start date is valid
    if (isNaN(startDate.getTime())) {
        return { status: 'ساري', color: 'hsl(205 90% 40%)' }; // Blue (Default)
    }

    // Calculate months passed since the start date.
    const monthsPassed = differenceInMonths(today, startDate);
  
    // If payments haven't started yet
    if (monthsPassed < 0) {
       return { status: 'ساري', color: 'hsl(205 90% 40%)' }; // Blue
    }

    // Calculate the total amount that should have been paid by now
    const expectedAmount = (monthsPassed + 1) * monthlyInstallment;
  
    if (paidAmount < expectedAmount) {
      return { status: 'متأخر', color: 'hsl(0 84.2% 60.2%)' }; // Red
    }
  
    return { status: 'ساري', color: 'hsl(205 90% 40%)' }; // Blue
}
