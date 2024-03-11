import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import styles from '../styles/page-styles';
import * as SQLite from 'expo-sqlite';



export default function App() {
  const [recordings, setRecordings] = useState([null, null, null]);
  const [recordingUris, setRecordingUris] = useState([null, null, null]);
  const [permissionsResponse, requestPermission] = Audio.usePermissions();
  const [sound, setSound] = useState(null);
  const [db, setDb] = useState(null);

  useEffect(() => {
    let db;
    if (Platform.OS === 'web') {
      db = {
        transaction: () => ({
          executeSql: () => {},
        }),
      };
    } else {
      db = SQLite.openDatabase('soundboard.db');
    }
    setDb(db);

    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS recordings (id INTEGER PRIMARY KEY NOT NULL, uri TEXT);'
      );
    });

    return () => {
      db && db.close();
    };
  }, []);

  const saveRecording = (uri, index) => {
    db.transaction(
      (tx) => {
        tx.executeSql('INSERT INTO recordings (uri) VALUES (?);', [uri]);
      },
      null,
      () => {
        console.log(`Recording ${index + 1} saved to database.`);
      }
    );
  };

  const startRecording = async (index) => {
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
      const newRecordings = [...recordings];
      newRecordings[index] = recording;
      setRecordings(newRecordings);
    } catch (error) {
      console.error('Failed to start recording: ', error);
    }
  };

  const stopRecording = async (index) => {
    try {
      const recording = recordings[index];
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const newRecordingUris = [...recordingUris];
      newRecordingUris[index] = uri;
      setRecordingUris(newRecordingUris);
      const newRecordings = [...recordings];
      newRecordings[index] = null;
      setRecordings(newRecordings);
      saveRecording(uri, index);
      console.log('Recording stopped and stored at ', uri);
    } catch (error) {
      console.error('Failed to stop recording: ', error);
    }
  };

  const playRecording = async (index) => {
    if (sound) {
      await sound.stopAsync();
    }
    const uri = recordingUris[index];
    if (uri) {
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      await newSound.playAsync();
    }
  };

  const playPreloadedSound = async () => {
    if (sound) {
      await sound.stopAsync();
    }
    const { sound: newSound } = await Audio.Sound.createAsync({
      uri: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
    });
    setSound(newSound);
    await newSound.playAsync();
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
    }
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
      {recordings.map((recording, index) => (
        <View key={index}>
          <TouchableOpacity
            style={[styles.button, recording ? styles.stopButton : null]}
            onPress={() => (recording ? stopRecording(index) : startRecording(index))}
          >
            <Text style={styles.buttonText}>
              {recording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </TouchableOpacity>

          {recordingUris[index] && (
            <TouchableOpacity style={styles.button} onPress={() => playRecording(index)}>
              <Text style={styles.buttonText}>Play Recorded Sound</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity style={styles.button} onPress={playPreloadedSound}>
        <Text style={styles.buttonText}>Play Preloaded Sound</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopSound}>
        <Text style={styles.buttonText}>Stop Sound</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}
