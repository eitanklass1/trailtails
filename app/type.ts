import { WalletAdapter } from '@solana/wallet-adapter-base';
import { Connection } from '@solana/web3.js';

export interface SolanaWalletContextType {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  getWalletAddress: () => string;
  walletAddress: string;
  connection: Connection | null;
  wallet: WalletAdapter;
}
