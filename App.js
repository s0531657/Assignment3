import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import styles from './page-styles'; // Import styles from page-styles.js

export default function App() {
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [permissionsResponse, requestPermission] = Audio.usePermissions();
  const [sound, setSound] = useState(null);

  const startRecording = async () => {
    try {
      if (permissionsResponse.status !== 'granted') {
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (error) {
      console.error("Failed to start recording: ", error);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      console.log('Recording stopped and stored at ', uri);
    } catch (error) {
      console.error("Failed to stop recording: ", error);
    }
  };

  const playRecording = async () => {
    const { sound } = await Audio.Sound.createAsync({
      uri: recordingUri,
    });
    setSound(sound);
    await sound.playAsync();
  };

  const playPreloadedSound = async () => {
    const { sound } = await Audio.Sound.createAsync({
      uri: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
    });
    setSound(sound);
    await sound.playAsync();
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={recording ? stopRecording : startRecording}>
        <Text style={styles.buttonText}>{recording ? 'Stop Recording' : 'Start Recording'}</Text>
      </TouchableOpacity>
      {recordingUri && (
        <TouchableOpacity style={styles.button} onPress={playRecording}>
          <Text style={styles.buttonText}>Play Recorded Sound</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.button} onPress={playPreloadedSound}>
        <Text style={styles.buttonText}>Play Preloaded Sound</Text>
      </TouchableOpacity>
      <StatusBar style="auto" />
    </View>
  );
}
