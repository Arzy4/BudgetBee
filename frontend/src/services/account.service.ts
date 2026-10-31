import api from "./api";

export interface Account {
  id: number;
  name: string;
  type: "CASH" | "BANK_TRANSFER" | "E_WALLET" | "CARD";
  initialBalance: string;
  createdAt: string;
  updatedAt: string;
}

interface GetAccountsResponse {
  success: boolean;
  message: string;
  data: Account[];
}

export async function getAccounts(): Promise<Account[]> {
  const response = await api.get<GetAccountsResponse>(
    "/accounts"
  );

  return response.data.data;
}