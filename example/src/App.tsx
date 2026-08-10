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
  StatusBar,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  useBackgroundUpload,
  useTransferStream,
  useSSEStream,
} from 'react-native-transferkit';

const STREAM_URL = 'https://jsonplaceholder.typicode.com/posts/1';
const UPLOAD_URL = 'http://192.168.1.4:4000/files/upload';
const ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YWNkMmEyYzkwMWMyMGNiNDBhNWVkZSIsImlhdCI6MTc4MDA2ODYxMywiZXhwIjoxNzgwMDY5NTEzfQ.OfIluLJTsh5LYt9zrz7-O5GeC_o83NrjejRU1c9kFhw';

const MOCK_SSE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/stream-sse'
    : 'http://localhost:3000/stream-sse';

const handlePermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
  }
};

type ActiveTab = 'sse' | 'standard' | 'upload';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('sse');
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [uploadMessage, setUploadMessage] = useState(
    'Select an image to start upload test.'
  );

  const {
    data: streamData,
    loading: streamLoading,
    error: streamError,
    start: startStreamRequest,
    cancel: cancelStreamRequest,
  } = useTransferStream();

  const {
    events: sseEvents,
    data: sseData,
    loading: sseLoading,
    error: sseError,
    start: startSSERequest,
    cancel: cancelSSERequest,
  } = useSSEStream({
    onEvent: (evt) => {
      console.log('Realtime SSE Event:', evt);
    },
  });

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

  useEffect(() => {
    handlePermission();
  }, []);

  useEffect(() => {
    if (completed) setUploadMessage('Upload completed successfully! 🎉');
  }, [completed]);

  useEffect(() => {
    if (uploadError) setUploadMessage(`Upload error: ${uploadError}`);
  }, [uploadError]);

  useEffect(() => {
    if (cancelled) setUploadMessage('Upload cancelled by user.');
  }, [cancelled]);

  const sseStatusBadge = useMemo(() => {
    if (sseLoading)
      return { text: 'STREAMING', color: '#a855f7', bg: '#2e1065' };
    if (sseError) return { text: 'ERROR', color: '#f43f5e', bg: '#4c0519' };
    if (sseData.length)
      return { text: 'COMPLETED', color: '#10b981', bg: '#064e3b' };
    return { text: 'READY', color: '#6366f1', bg: '#1e1b4b' };
  }, [sseLoading, sseError, sseData.length]);

  const streamStatusBadge = useMemo(() => {
    if (streamLoading)
      return { text: 'STREAMING', color: '#38bdf8', bg: '#0c4a6e' };
    if (streamError) return { text: 'ERROR', color: '#f43f5e', bg: '#4c0519' };
    if (streamData.length)
      return { text: 'DONE', color: '#10b981', bg: '#064e3b' };
    return { text: 'READY', color: '#94a3b8', bg: '#1e293b' };
  }, [streamLoading, streamError, streamData.length]);

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
    if (asset && asset.uri) {
      setSelectedImage(asset);
      setUploadMessage('Image selected. Ready to test background upload.');
    }
  };

  const uploadImage = () => {
    if (!selectedImage?.uri) return;
    const filePath = selectedImage.uri;
    const fileName =
      selectedImage.fileName || filePath.split('/').pop() || 'upload.jpg';
    const mimeType = selectedImage.type || 'image/jpeg';

    setUploadMessage('Initiating background upload...');
    startUpload({
      url: UPLOAD_URL,
      filePath,
      fileName,
      mimeType,
      fieldName: 'file',
      method: 'POST',
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Hero Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>TK</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>TransferKit</Text>
              <Text style={styles.headerSubtitle}>
                Native Realtime & Transfer Engine
              </Text>
            </View>
          </View>
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>v0.2.0</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'sse' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('sse')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'sse' && styles.tabTextActive,
              ]}
            >
              🤖 AI SSE Stream
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'standard' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('standard')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'standard' && styles.tabTextActive,
              ]}
            >
              📡 Standard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'upload' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('upload')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'upload' && styles.tabTextActive,
              ]}
            >
              📤 Upload
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* TAB 1: AI / SSE STREAMING */}
        {activeTab === 'sse' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>AI & SSE Token Parser</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: sseStatusBadge.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: sseStatusBadge.color },
                    ]}
                  >
                    {sseStatusBadge.text}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardDescription}>
                Native line-buffered SSE parser for OpenAI, Claude, and
                real-time event streams.
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.btnPrimary, sseLoading && styles.btnDisabled]}
                onPress={() => startSSERequest({ url: MOCK_SSE_URL })}
                disabled={sseLoading}
              >
                {sseLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.btnPrimaryText}>
                    ⚡ Start Mock SSE Stream
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnDanger, !sseLoading && styles.btnDisabled]}
                onPress={cancelSSERequest}
                disabled={!sseLoading}
              >
                <Text style={styles.btnDangerText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Meta Stats Bar */}
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Text style={styles.metaLabel}>Endpoint</Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  {MOCK_SSE_URL}
                </Text>
              </View>

              <View style={styles.metaBadge}>
                <Text style={styles.metaLabel}>Events Parsed</Text>
                <Text style={styles.metaValueHighlight}>
                  {sseEvents.length} events
                </Text>
              </View>
            </View>

            {/* Terminal Stream Console */}
            <View style={styles.terminalWindow}>
              <View style={styles.terminalHeader}>
                <View style={styles.terminalDots}>
                  <View style={[styles.dot, styles.dotRed]} />
                  <View style={[styles.dot, styles.dotYellow]} />
                  <View style={[styles.dot, styles.dotGreen]} />
                </View>
                <Text style={styles.terminalTitle}>Stream Console output</Text>
              </View>

              <ScrollView style={styles.terminalBody} nestedScrollEnabled>
                {sseError ? (
                  <Text style={styles.errorOutput}>Error: {sseError}</Text>
                ) : sseData ? (
                  <Text style={styles.terminalText}>
                    {sseData}
                    {sseLoading && <Text style={styles.cursor}> ▍</Text>}
                  </Text>
                ) : (
                  <Text style={styles.terminalPlaceholder}>
                    Click "Start Mock SSE Stream" to view word-by-word token
                    parsing...
                  </Text>
                )}
              </ScrollView>
            </View>
          </View>
        )}

        {/* TAB 2: STANDARD HTTP STREAMING */}
        {activeTab === 'standard' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>
                  Standard HTTP Response Stream
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: streamStatusBadge.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: streamStatusBadge.color },
                    ]}
                  >
                    {streamStatusBadge.text}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardDescription}>
                Foreground raw HTTP response chunk streaming via OkHttp &
                NSURLSession.
              </Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.btnSecondary,
                  streamLoading && styles.btnDisabled,
                ]}
                onPress={() =>
                  startStreamRequest({
                    url: STREAM_URL,
                    method: 'GET',
                    headers: {},
                    body: '',
                  })
                }
                disabled={streamLoading}
              >
                {streamLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.btnSecondaryText}>
                    🚀 Start Standard Stream
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnDanger, !streamLoading && styles.btnDisabled]}
                onPress={cancelStreamRequest}
                disabled={!streamLoading}
              >
                <Text style={styles.btnDangerText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.codeBox}>
              {streamLoading && (
                <ActivityIndicator
                  color="#38bdf8"
                  size="small"
                  style={styles.indicatorMargin}
                />
              )}
              <Text style={styles.codeText}>
                {streamData ||
                  '// Standard streamed payload output will appear here...'}
              </Text>
            </View>
          </View>
        )}

        {/* TAB 3: BACKGROUND FILE UPLOAD */}
        {activeTab === 'upload' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Background File Upload</Text>
              <Text style={styles.cardDescription}>
                Native background upload engine with progress callbacks &
                notification service.
              </Text>
            </View>

            {/* Media Upload Preview Box */}
            <View style={styles.uploadCard}>
              {selectedImage?.uri ? (
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <TouchableOpacity style={styles.dropZone} onPress={pickImage}>
                  <Text style={styles.dropZoneIcon}>🖼️</Text>
                  <Text style={styles.dropZoneTitle}>Select Media File</Text>
                  <Text style={styles.dropZoneSub}>
                    Tap to open device gallery
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {selectedImage && (
              <View style={styles.fileMetaContainer}>
                <Text style={styles.fileMetaText}>
                  📄 {selectedImage.fileName || 'selected_file.jpg'}
                </Text>
                <Text style={styles.fileMetaSub}>
                  {selectedImage.type || 'image/jpeg'} •{' '}
                  {selectedImage.fileSize
                    ? `${Math.round(selectedImage.fileSize / 1024)} KB`
                    : 'Unknown size'}
                </Text>
              </View>
            )}

            {/* Action Row */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.btnOutline} onPress={pickImage}>
                <Text style={styles.btnOutlineText}>Pick Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  (!selectedImage || uploadLoading) && styles.btnDisabled,
                ]}
                onPress={uploadImage}
                disabled={!selectedImage || uploadLoading}
              >
                {uploadLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Start Upload</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Progress Bar & Status */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{uploadMessage}</Text>
                <Text style={styles.progressPercent}>{uploadPercent}%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${uploadPercent}%` },
                  ]}
                />
              </View>
            </View>

            {uploadLoading && (
              <TouchableOpacity
                style={[styles.btnDanger, styles.cancelMargin]}
                onPress={cancelUpload}
              >
                <Text style={styles.btnDangerText}>Cancel Upload</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modern Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          React Native TransferKit • Powered by TurboModules & Native C++ /
          Kotlin
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#6366f1',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  logoText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  versionPill: {
    backgroundColor: '#1e1b4b',
    borderColor: '#4338ca',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  versionText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  contentContainer: {
    padding: 18,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  cardDescription: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  btnSecondaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  btnOutline: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  btnOutlineText: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 14,
  },
  btnDanger: {
    width: 90,
    backgroundColor: '#e11d48',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDangerText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  metaRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  metaBadge: {
    flex: 1,
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  metaValueHighlight: {
    color: '#a855f7',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  terminalWindow: {
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  terminalHeader: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  terminalDots: {
    flexDirection: 'row',
    marginRight: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  terminalTitle: {
    color: '#64748b',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  terminalBody: {
    padding: 14,
    minHeight: 180,
    maxHeight: 280,
  },
  terminalText: {
    color: '#a855f7',
    fontSize: 15,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  cursor: {
    color: '#c084fc',
    fontWeight: '900',
  },
  terminalPlaceholder: {
    color: '#475569',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  errorOutput: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: '600',
  },
  codeBox: {
    backgroundColor: '#020617',
    borderRadius: 14,
    padding: 16,
    minHeight: 180,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  codeText: {
    color: '#38bdf8',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  uploadCard: {
    height: 180,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dropZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  dropZoneIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  dropZoneTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  dropZoneSub: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  fileMetaContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  fileMetaText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  fileMetaSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  progressSection: {
    marginTop: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  progressPercent: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 10,
  },
  dotRed: {
    backgroundColor: '#ff5f56',
  },
  dotYellow: {
    backgroundColor: '#ffbd2e',
  },
  dotGreen: {
    backgroundColor: '#27c93f',
  },
  indicatorMargin: {
    marginBottom: 10,
  },
  cancelMargin: {
    marginTop: 12,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
});
