import React, { useState, useEffect, useRef } from 'react';
import { Platform, Text, View, StyleSheet, Button } from 'react-native';
import { requestBackgroundPermissionsAsync, watchPositionAsync, LocationObject } from 'expo-location';
import './polyfills'; 
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { captureRef } from 'react-native-view-shot';
import * as TaskManager from 'expo-task-manager';
import * as Sharing from 'expo-sharing';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
import { usePhantomWallet } from './PhantomWallet';
import { Connection, Transaction, SystemProgram } from '@solana/web3.js';

const SERVER_URL = 'http://localhost:3000'; // Update with your server address if needed

const IndexRecord = () => {
  const [recording, setRecording] = useState(false);
  const [ip, setIp] = useState<string | null>(null);
  const [anonStarted, setAnonStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

//Shivoham
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
  //Shivoham

  const handleStartRecording = async () => {
    try {
      const { status } = await requestBackgroundPermissionsAsync();
      if (status === 'granted') {
        const locationOptions = {
          accuracy: 6, // High accuracy
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        };
        
        const locationCallback = (location: LocationObject) => {
          console.log(location);
        };


        watchPositionAsync(locationOptions, locationCallback);
        setRecording(true);
      } else {
        console.log('Permission denied');
      }
    } catch (error) {
      console.log(error);
    }
  };
  

  const handleStopRecording = async () => {
    try {
      await watchPositionAsync({}, () => {});
      setRecording(false);
    } catch (error) {
      console.log(error);
    }
  };

  // Start Anon client
  const startAnon = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/start`);
      const data = await response.json();
      if (data.message) {
        console.log(data.message);
        setAnonStarted(true);
      }
    } catch (error) {
      setError('Failed to start Anon client');
      console.error(error);
    }
  };

  // Stop Anon client
  const stopAnon = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/stop`);
      const data = await response.json();
      if (data.message) {
        console.log(data.message);
        setAnonStarted(false);
      }
    } catch (error) {
      setError('Failed to stop Anon client');
      console.error(error);
    }
  };

  // Get IP address via Anon client
  const fetchIp = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/get-ip`);
      const data = await response.json();
      if (data.ip) {
        setIp(data.ip);
        console.log(data.ip);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch IP address');
      console.error(error);
    }
  };

  return (
    <View>
      <Button title="Start Recording" onPress={handleStartRecording} />
      {recording && <Button title="Stop Recording" onPress={handleStopRecording} />}
      <Text>Recording: {recording ? 'Yes' : 'No'}</Text>

      <Button title="Start Anon" onPress={startAnon} disabled={anonStarted} />
      <Button title="Stop Anon" onPress={stopAnon} disabled={!anonStarted} />
      
      <Button title="Fetch IP" onPress={fetchIp} />
      {ip && <Text>Your IP: {ip}</Text>}
      
      {error && <Text>Error: {error}</Text>}


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
};


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

export default IndexRecord;