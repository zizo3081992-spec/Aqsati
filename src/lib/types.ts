export interface Client {
  id: string;
  name: string;
  phone: string;
  total: number;
  months: number;
  startDate: string; // YYYY-MM-DD
}

export interface Installment {
  id: string;
  clientId: string;
  amount: number;
  date: string; // YYYY-MM-DD
}
