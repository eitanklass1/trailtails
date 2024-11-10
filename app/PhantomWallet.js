// PhantomWallet.js
import { useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';

const NETWORK = "devnet";
const PHANTOM_DEEPLINK_PREFIX = Platform.OS === 'ios' 
  ? 'phantom://' 
  : 'https://phantom.app/ul/';
const PHANTOM_APP_STORE = "https://phantom.app/download";

export const usePhantomWallet = () => {
  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Generate a new dapp encryption key pair on each session
  const [dappKeyPair] = useState(() => {
    const timestamp = new Date().getTime();
    return Buffer.from(`dapp-encryption-key-${timestamp}`);
  });

  useEffect(() => {
    const handleDeepLink = async ({ url }) => {
      console.log('Received deep link:', url);
  
      if (!url) {
        console.log('Received empty URL');
        setConnecting(false);
        return;
      }
  
      // Directly parse the Expo URL for now
      const response = parseExpURL(url);
      if (!response) {
        console.log('Failed to parse URL response');
        setConnecting(false);
        return;
      }
  
      if (response.public_key) {
        try {
          const newPublicKey = new PublicKey(response.public_key);
          console.log('Successfully connected to wallet:', newPublicKey.toString());
          setPublicKey(newPublicKey);
          setConnected(true);
          setConnecting(false);
        } catch (error) {
          console.error('Error processing public key:', error);
          setConnecting(false);
        }
      } else {
        console.log('No public key found in response');
        setConnecting(false);
      }
    };
  
    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });
  
    return () => {
      subscription.remove();
    };
  }, []);
  
  

  const connect = async () => {
    try {
      setConnecting(true);
      console.log('Initiating wallet connection...');
  
      // Add timeout to reset connecting state if no response
      const timeout = setTimeout(() => {
        if (connecting) {
          console.log('Connection attempt timed out');
          setConnecting(false);
        }
      }, 30000); // 30 second timeout
  
      const APP_SCHEME = 'trailtails';
      const redirectUrl = `${APP_SCHEME}://onConnect`;
      
      const params = new URLSearchParams({
        dapp_encryption_public_key: bs58.encode(dappKeyPair),
        redirect_link: redirectUrl,
        app_url: `${APP_SCHEME}://`,
        cluster: NETWORK
      });
  
      const url = Platform.OS === 'ios'
        ? `${PHANTOM_DEEPLINK_PREFIX}connect?${params.toString()}`
        : `${PHANTOM_DEEPLINK_PREFIX}v1/connect?${params.toString()}`;
  
      console.log('Connection URL:', url);
  
      if (Platform.OS === 'ios') {
        const supported = await Linking.canOpenURL(url);
        if (!supported) {
          console.log('Phantom app not installed');
          clearTimeout(timeout);
          setConnecting(false);
          await WebBrowser.openBrowserAsync(PHANTOM_APP_STORE);
          return;
        }
        await Linking.openURL(url);
      } else {
        try {
          await Linking.openURL(url);
        } catch (error) {
          console.log('Error opening direct URL, falling back to web version');
          clearTimeout(timeout);
          setConnecting(false);
          await WebBrowser.openBrowserAsync(url);
        }
      }
    } catch (error) {
      console.error('Error connecting to Phantom:', error);
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setPublicKey(null);
    setConnected(false);
  };

  const signAndSendTransaction = async (transaction) => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const serializedTransaction = bs58.encode(transaction.serialize({
        requireAllSignatures: false
      }));

      const params = new URLSearchParams({
        dapp_encryption_public_key: bs58.encode(dappKeyPair),
        redirect_link: 'trailtails://onSign', // Replace trailtails with your scheme
        transaction: serializedTransaction
      });

      const url = Platform.OS === 'ios'
        ? `${PHANTOM_DEEPLINK_PREFIX}signTransaction?${params.toString()}`
        : `${PHANTOM_DEEPLINK_PREFIX}v1/signTransaction?${params.toString()}`;

      await Linking.openURL(url);
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  };

  return {
    publicKey,
    connected,
    connecting,
    connect,
    disconnect,
    signAndSendTransaction
  };
};

const parseExpURL = (url) => {
  try {
    console.log('Parsing Expo URL:', url);

    // Extract the part after "/--/" if it's present
    const match = url.match(/exp:\/\/.*?\/--\/(.*)$/);
    // if (!match || !match[1]) {
    //   console.log('Expo URL format does not match expected pattern:', url);
    //   return null;
    // }

    const queryString = match[1].startsWith('?') ? match[1].substring(1) : match[1];
    const params = new URLSearchParams(queryString);
    return Object.fromEntries(params.entries());
  } catch (error) {
    console.error('Error parsing Expo URL:', error);
    return null;
  }
};
