import { TransactionsResponse } from "@/types/transaction";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchTransactions(): Promise<TransactionsResponse> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch {
    console.warn("Backend unavailable. Using MOCK mode.");
    return {
      source_mode: "ERROR",
      transactions: [],
    };
  }
}
export async function fetchSourceStatus() {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  try {

    const response = await fetch(
      `${API_BASE_URL}/api/source-status`
    );

    return await response.json();

  } catch {

    return {
      mode: "MOCK",
      provider: "Fallback Feed",
    };
  }
}