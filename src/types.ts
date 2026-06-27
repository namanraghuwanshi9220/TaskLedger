export interface Task {
  id: number;
  title: string;
  description: string;
  owner: string;
  deadline: number; // Unix timestamp in seconds
  isCompleted: boolean;
}

export type WalletType = "freighter" | "albedo" | "lobstr" | "xbull" | "simulated";

export interface WalletOption {
  id: WalletType;
  name: string;
  icon: string;
  description: string;
  downloadUrl: string;
}

export interface NetworkState {
  isConnected: boolean;
  address: string | null;
  walletType: WalletType | null;
  balance: string; // XLM Balance
  isSimulated: boolean;
}
