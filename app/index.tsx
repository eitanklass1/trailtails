import './polyfills'; 
import { useState, useEffect, useRef } from 'react';
import { Platform, Text, View, StyleSheet, Button } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { captureRef } from 'react-native-view-shot';
import * as TaskManager from 'expo-task-manager';
import * as Sharing from 'expo-sharing';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
import { usePhantomWallet } from './PhantomWallet';
import { Connection, Transaction, SystemProgram } from '@solana/web3.js';

global.Buffer = Buffer;

export default function App() {
  const [location, setLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [currentCoordinate, setCurrentCoordinate] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null);
  const mapRef = useRef(null);
  
  // Phantom wallet integration
  const { publicKey, connected, connecting, connect, signAndSendTransaction } = usePhantomWallet();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const initialLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = initialLocation.coords;

      setInitialRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      setCurrentCoordinate({ latitude, longitude });

      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setCurrentCoordinate({ latitude, longitude });
          setRouteCoordinates((prevCoords) => [
            ...prevCoords,
            { latitude, longitude },
          ]);
          setLocation(newLocation);
        }
      );

      return () => {
        locationSubscription.remove();
      };
    })();
  }, []);

  const captureMap = async () => {
    if (mapRef.current) {
      try {
        const uri = await captureRef(mapRef, {
          format: 'png',
          quality: 0.8,
        });
        console.log('Map image saved to:', uri);
        return uri;
      } catch (error) {
        console.error('Error capturing map:', error);
        return null;
      }
    }
  };

  const mintNFT = async () => {
    if (!connected) {
      await connect();
      return;
    }

    try {
      const uri = await captureMap();
      if (!uri) return;

      const connection = new Connection(
        'https://api.devnet.solana.com',
        'confirmed'
      );

      // This is a placeholder transaction. Replace with actual NFT minting logic
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey,
          lamports: 100,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      await signAndSendTransaction(transaction);
      console.log('NFT minting initiated');

      // Optional: Share the captured image
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button 
          title={connected ? "Mint NFT" : "Connect Wallet"} 
          onPress={mintNFT} 
        />
        {connecting && <Text style={styles.statusText}>Connecting to Phantom...</Text>}
        {connected && (
          <Text style={styles.statusText}>
            Connected: {publicKey.toString().slice(0, 8)}...
          </Text>
        )}
      </View>
      
      {initialRegion && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
        >
          {currentCoordinate && <Marker coordinate={currentCoordinate} />}
          <Polyline 
            coordinates={routeCoordinates} 
            strokeColor="blue" 
            strokeWidth={4} 
          />
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    width: '100%',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  statusText: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
  map: {
    width: '100%',
    height: '80%',
  },
});