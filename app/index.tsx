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

import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';
import { requestBackgroundPermissionsAsync, watchPositionAsync } from 'expo-location';

const IndexRecord = () => {
  const [recording, setRecording] = useState(false);

  const handleStartRecording = async () => {
    try {
      const { status } = await requestBackgroundPermissionsAsync();
      if (status === 'granted') {
        const locationOptions = {
          accuracy: 6, // High accuracy
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        };
        
        watchPositionAsync(locationOptions, (location) => {
          console.log(location);
        });
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

  return (
    <View>
      
      <Button title="Start Recording" onPress={handleStartRecording} />
      {recording && (
        <Button title="Stop Recording" onPress={handleStopRecording} />
      )}
      <Text>Recording: {recording ? 'Yes' : 'No'}</Text>
    </View>
  );
};

export default IndexRecord;