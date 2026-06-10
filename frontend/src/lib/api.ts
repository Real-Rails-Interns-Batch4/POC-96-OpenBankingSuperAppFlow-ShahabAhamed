import { TransactionsResponse } from "@/types/transaction";

export async function fetchTransactions(): Promise<TransactionsResponse> {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/transactions", {
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
  } catch (error) {
    console.warn("Backend unavailable. Using MOCK mode.");
    return {
      source_mode: "ERROR",
      transactions: [],
    };
  }
}
export async function fetchSourceStatus() {

  try {

    const response = await fetch(
      "http://127.0.0.1:8000/api/source-status"
    );

    return await response.json();

  } catch (error) {

    return {
      mode: "MOCK",
      provider: "Fallback Feed",
    };
  }
}