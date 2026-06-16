import { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  useBackgroundUpload,
  useTransferStream,
} from 'react-native-transferkit';

const STREAM_URL = 'https://jsonplaceholder.typicode.com/posts/1';
const UPLOAD_URL = 'http://192.168.1.4:4000/files/upload';
const ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YWNkMmEyYzkwMWMyMGNiNDBhNWVkZSIsImlhdCI6MTc4MDA2ODYxMywiZXhwIjoxNzgwMDY5NTEzfQ.OfIluLJTsh5LYt9zrz7-O5GeC_o83NrjejRU1c9kFhw';

const handlePermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
  }
};

export default function App() {
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [uploadMessage, setUploadMessage] = useState(
    'Pick an image, then upload it.'
  );

  const {
    data: streamData,
    loading: streamLoading,
    error: streamError,
    start: startStreamRequest,
    cancel: cancelStreamRequest,
  } = useTransferStream();

  const {
    progress,
    loading: uploadLoading,
    completed,
    cancelled,
    error: uploadError,
    start: startUpload,
    cancel: cancelUpload,
  } = useBackgroundUpload();

  const uploadPercent = Math.min(Math.max(Math.round(progress * 100), 0), 100);
  const uploadStatusText = uploadLoading
    ? `Uploading... ${uploadPercent}%`
    : uploadMessage;

  useEffect(() => {
    handlePermission();
  }, []);

  useEffect(() => {
    if (completed) {
      setUploadMessage('Upload completed successfully.');
    }
  }, [completed]);

  useEffect(() => {
    if (uploadError) {
      setUploadMessage(`Upload failed: ${uploadError}`);
    }
  }, [uploadError]);

  useEffect(() => {
    if (cancelled) {
      setUploadMessage('Upload was cancelled.');
    }
  }, [cancelled]);

  const streamStatus = useMemo(() => {
    if (streamError) return `Error: ${streamError}`;
    if (streamLoading) return 'Receiving streamed response...';
    if (streamData.length) return 'Stream finished.';
    return 'Ready to start stream.';
  }, [streamError, streamLoading, streamData.length]);

  const pickImage = async () => {
    const response = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 1,
    });

    if (response.didCancel) {
      setUploadMessage('Image selection cancelled.');
      return;
    }

    if (response.errorCode) {
      setUploadMessage(
        `Picker error: ${response.errorMessage || response.errorCode}`
      );
      return;
    }

    const asset = response.assets?.[0];
    if (!asset || !asset.uri) {
      setUploadMessage('No image selected.');
      return;
    }

    setSelectedImage(asset);
    setUploadMessage('Image selected. Ready to upload.');
  };

  const uploadImage = () => {
    if (!selectedImage?.uri) {
      setUploadMessage('Please select an image first.');
      return;
    }

    const filePath = selectedImage.uri;
    const fileName =
      selectedImage.fileName || filePath.split('/').pop() || 'upload.jpg';
    const mimeType = selectedImage.type || 'image/jpeg';
    console.log(
      'Starting upload with filePath:',
      filePath,
      'fileName:',
      fileName,
      'mimeType:',
      mimeType
    );

    setUploadMessage('Starting upload...');
    startUpload({
      url: UPLOAD_URL,
      filePath,
      fileName,
      mimeType,
      fieldName: 'file',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });
  };

  const startStream = () => {
    startStreamRequest({
      url: STREAM_URL,
      method: 'GET',
      headers: {},
      body: '',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Stream Response</Text>
          <Text style={styles.statusText}>{streamStatus}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                streamLoading && styles.disabledButton,
              ]}
              onPress={startStream}
              disabled={streamLoading}
            >
              <Text style={styles.buttonText}>
                {streamLoading ? 'Streaming...' : 'Start Stream'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                !streamLoading && styles.disabledButton,
              ]}
              onPress={cancelStreamRequest}
              disabled={!streamLoading}
            >
              <Text style={styles.buttonText}>Cancel Stream</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.responseBox}>
            {streamLoading && (
              <ActivityIndicator size="small" color="#0f62fe" />
            )}
            <Text style={styles.responseText}>
              {streamData || 'No streamed data yet.'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload File Events</Text>
          <View style={styles.uploadPreview}>
            {selectedImage?.uri ? (
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.emptyPreview}>
                <Text style={styles.emptyPreviewText}>No image selected</Text>
              </View>
            )}
          </View>

          <View style={styles.fileDetails}>
            <Text style={styles.detailText}>
              File: {selectedImage?.fileName || 'N/A'}
            </Text>
            <Text style={styles.detailText}>
              Type: {selectedImage?.type || 'N/A'}
            </Text>
            <Text style={styles.detailText}>
              Size:{' '}
              {selectedImage?.fileSize
                ? `${selectedImage.fileSize} bytes`
                : 'N/A'}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
              <Text style={styles.buttonText}>Pick Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                (!selectedImage || uploadLoading) && styles.disabledButton,
              ]}
              onPress={uploadImage}
              disabled={!selectedImage || uploadLoading}
            >
              <Text style={styles.buttonText}>
                {uploadLoading ? 'Uploading...' : 'Upload Image'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                !uploadLoading && styles.disabledButton,
              ]}
              onPress={cancelUpload}
              disabled={!uploadLoading}
            >
              <Text style={styles.buttonText}>Cancel Upload</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${uploadPercent}%` }]}
            />
          </View>
          <Text style={styles.statusText}>{uploadStatusText}</Text>
          <Text style={styles.detailText}>Progress: {uploadPercent}%</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#102a43',
  },
  statusText: {
    fontSize: 14,
    color: '#334e68',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  actionButton: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#0f62fe',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
  },
  cancelButton: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#d82c20',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
  },
  disabledButton: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  responseBox: {
    minHeight: 160,
    borderRadius: 14,
    backgroundColor: '#eef5ff',
    padding: 14,
  },
  responseText: {
    color: '#102a43',
    lineHeight: 22,
  },
  uploadPreview: {
    height: 220,
    borderRadius: 16,
    backgroundColor: '#e9eff5',
    marginBottom: 12,
    overflow: 'hidden',
  },
  emptyPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPreviewText: {
    color: '#627d98',
    fontSize: 15,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  fileDetails: {
    marginBottom: 14,
  },
  detailText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  progressTrack: {
    height: 10,
    borderRadius: 10,
    backgroundColor: '#d9e3ff',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0f62fe',
  },
});
