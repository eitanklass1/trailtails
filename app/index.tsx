// import { Text, View, Button } from "react-native";

// export default function Index() {
//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       <Text>Welcome to TrailTails</Text>
//       <Button title="Generate"/>
//     </View>
//   );
// }

import { Text, View, Button } from "react-native";
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useEffect, useState } from 'react';

const LOCATION_TRACKING = 'background-location-task';

// Define the background task
TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data;
    console.log('Received new locations', locations);
    // Here you can implement your location data handling
    // e.g., send to your backend or store locally
  }
});

export default function Index() {
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    checkTrackingStatus();
  }, []);

  const checkTrackingStatus = async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TRACKING
    ).catch(() => false);
    setIsTracking(hasStarted);
  };

  const startTracking = async () => {
    try {
      // Request permissions
      const { status: foregroundStatus } = 
        await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const { status: backgroundStatus } = 
        await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        alert('Permission to access background location was denied');
        return;
      }

      // Start tracking
      await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
        foregroundService: {
          notificationTitle: 'TrailTails Active',
          notificationBody: 'Tracking your trail adventure!',
        },
        android: {
          notificationChannelName: 'TrailTails Location',
          notificationColor: '#fff',
        }
      });

      setIsTracking(true);
      alert('Location tracking started');
    } catch (err) {
      alert('Error starting tracking: ' + err);
    }
  };

  const stopTracking = async () => {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(
        LOCATION_TRACKING
      );
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
        setIsTracking(false);
        alert('Location tracking stopped');
      }
    } catch (err) {
      alert('Error stopping tracking: ' + err);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Welcome to TrailTails</Text>
      <Button 
        title={isTracking ? "Stop Tracking" : "Start Tracking"} 
        onPress={isTracking ? stopTracking : startTracking}
      />
      <Text style={{ color: isTracking ? 'green' : 'gray' }}>
        {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
      </Text>
    </View>
  );
}
