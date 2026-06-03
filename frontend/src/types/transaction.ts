export interface Transaction {
  id: string;
  user: string;
  bank: string;
  amount: number;
  rail: string;
  risk_score: number;
  risk_level: string;
  status: string;
  timestamp: string;
}

export interface TransactionsResponse {
  source_mode: string;
  transactions: Transaction[];
}