import { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';

import { addStreamListener, startStream } from 'react-native-transferkit';

export default function App() {
  const [streamData, setStreamData] = useState('');

  const newStartStream = () => {
    setStreamData('');

    startStream('https://jsonplaceholder.typicode.com/posts/1', 'GET', {}, '');
  };

  useEffect(() => {
    const listener = addStreamListener((event) => {
      console.log('STREAM:', event);

      setStreamData((prev) => prev + (event.data || ''));
    });

    return () => {
      listener.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.button} onPress={newStartStream}>
        Start Stream
      </Text>

      <ScrollView style={styles.resultContainer}>
        <Text style={styles.result}>{streamData}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 20,
  },

  button: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },

  resultContainer: {
    flex: 1,
  },

  result: {
    fontSize: 16,
    lineHeight: 24,
  },
});
