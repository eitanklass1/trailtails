import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';
import { requestBackgroundPermissionsAsync, watchPositionAsync, LocationObject } from 'expo-location';


const SERVER_URL = 'http://localhost:3000'; // Update with your server address if needed

const IndexRecord = () => {
  const [recording, setRecording] = useState(false);
  const [ip, setIp] = useState<string | null>(null);
  const [anonStarted, setAnonStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    </View>
  );
};

export default IndexRecord;