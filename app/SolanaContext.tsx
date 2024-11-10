import React, { createContext, useContext, useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

// Create a context
const SolanaContext = createContext<any>(null);

export const useSolana = () => {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error('useSolana must be used within a SolanaProvider');
  }
  return context;
};

export const SolanaProvider = ({ children }: { children: React.ReactNode }) => {
  const [connection, setConnection] = useState<Connection | null>(null);
  const wallet = useWallet();
  const [walletAddress, setWalletAddress] = useState<string>('');

  useEffect(() => {
    const newConnection = new Connection('https://api.mainnet-beta.solana.com');
    setConnection(newConnection);
  }, []);

  const connectWallet = async () => {
    if (!wallet.connected) {
      await wallet.connect();
    }
    setWalletAddress(wallet.publicKey?.toString() || '');
  };

  const disconnectWallet = async () => {
    if (wallet.connected) {
      await wallet.disconnect();
    }
    setWalletAddress('');
  };

  const getWalletAddress = (): string => {
    return wallet.publicKey?.toString() || '';
  };

  return (
    <SolanaContext.Provider
      value={{
        connectWallet,
        disconnectWallet,
        getWalletAddress,
        walletAddress,
        connection,
        wallet
      }}
    >
      {children}
    </SolanaContext.Provider>
  );
};
