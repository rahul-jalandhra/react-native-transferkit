<div align="center">

# react-native-transferkit

High-performance background and foreground streaming toolkit for React Native on Android and iOS.

<p align="center">
  <img alt="platforms" src="https://img.shields.io/badge/platforms-android%20%7C%20ios-blue.svg" />
  <img alt="react-native" src="https://img.shields.io/badge/react--native-0.79+-brightgreen.svg" />
  <img alt="architecture" src="https://img.shields.io/badge/new--architecture-enabled-success.svg" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-orange.svg" />
</p>

</div>

---

# ✨ Features

- ✅ Turbo Module support
- ✅ Android + iOS support
- ✅ Native realtime streaming
- ✅ Event-based stream handling
- ✅ React hooks support
- ✅ Lightweight architecture
- ✅ Minimal dependencies
- ✅ Scalable SDK structure
- ✅ Stream cancellation support
- ✅ Background file uploads
- ✅ Upload progress tracking
- ✅ Android notifications for upload progress

---

# 📦 Installation

```bash
npm install react-native-transferkit
```

or

```bash
yarn add react-native-transferkit
```

---

# 🍎 iOS Setup

Install CocoaPods dependencies:

```bash
cd ios && pod install
```

---

# 📋 Requirements

- React Native `0.79+`
- New Architecture enabled

---

# 🚀 Quick Start

## Hook API (Recommended)

```tsx
import React from 'react';

import { Button, ScrollView, Text, View } from 'react-native';

import { useTransferStream } from 'react-native-transferkit';

export default function App() {
  const { data, loading, error, start, cancel } = useTransferStream();

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button
        title="Start Stream"
        onPress={() =>
          start({
            url: 'https://your-stream-api.com',
            method: 'GET',
          })
        }
      />

      <Button title="Cancel Stream" onPress={cancel} />

      {loading && <Text>Streaming...</Text>}

      {error && <Text>{error}</Text>}

      <ScrollView>
        <Text>{data}</Text>
      </ScrollView>
    </View>
  );
}
```

---

# ⚡ Low Level API

For advanced/custom implementations.

```tsx
import React, { useEffect, useState } from 'react';

import { Button, Text, View } from 'react-native';

import {
  startStream,
  cancelStream,
  addStreamListener,
} from 'react-native-transferkit';

export default function App() {
  const [data, setData] = useState('');

  useEffect(() => {
    const listener = addStreamListener((event) => {
      setData((prev) => prev + (event.data || ''));
    });

    return () => {
      listener.remove();
    };
  }, []);

  const onStart = () => {
    startStream('https://your-stream-api.com', 'GET', {}, '');
  };

  return (
    <View>
      <Button title="Start Stream" onPress={onStart} />

      <Button title="Cancel Stream" onPress={cancelStream} />

      <Text>{data}</Text>
    </View>
  );
}
```

---

# 📚 API

## startStream

Starts a native stream request.

```ts
startStream(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string
)
```

### Example

```ts
startStream(
  'https://your-api.com',
  'POST',
  {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json',
  },
  JSON.stringify({
    message: 'Hello',
  })
);
```

---

## cancelStream

Cancels the active stream request.

```ts
cancelStream();
```

---

## onStreamDataListener

Listen for incoming stream chunks.

```ts
onStreamDataListener(callback);
```

### Example

```ts
const streamDataListener = onStreamDataListener((event) => {
  console.log(event.data);
});

streamDataListener.remove();
```

---

## onStreamCompleteListener

Listen for incoming stream chunks.

```ts
onStreamCompleteListener(callback);
```

### Example

```ts
const streamCompleteListener = onStreamCompleteListener(() => {
  console.log('STREAM COMPLETED');
});

streamCompleteListener.remove();
```

---

## onStreamCancelListener

Listen for incoming stream chunks.

```ts
onStreamCancelListener(callback);
```

### Example

```ts
const streamCancelListener = onStreamCancelListener(() => {
  console.log('STREAM CANCELLED');
});

streamCancelListener.remove();
```

---

## onStreamErrorListener

Listen for incoming stream chunks.

```ts
onStreamErrorListener(callback);
```

### Example

```ts
const streamErrorListener = onStreamErrorListener((error) => {
  console.log(error);
});

streamErrorListener.remove();
```

---

## startUpload

Starts a background file upload with optional progress tracking and notifications.

```ts
startUpload(
  url: string,
  filePath: string,
  method: string,
  headers: Record<string, string>,
  body: string,
  enableNotification?: boolean,
  notificationTitle?: string
)
```

### Example

```ts
import { startUpload } from 'react-native-transferkit';

startUpload(
  'https://your-api.com/upload',
  'file:///path/to/large-file.zip',
  'POST',
  {
    'Authorization': 'Bearer token',
    'Content-Type': 'multipart/form-data',
  },
  JSON.stringify({ metadata: 'value' }),
  true,
  'Uploading file...'
);
```

---

## cancelUpload

Cancels the active file upload.

```ts
cancelUpload();
```

---

## onUploadProgressListener

Listen for upload progress updates.

```ts
onUploadProgressListener(callback);
```

### Example

```ts
const progressListener = onUploadProgressListener((event) => {
  console.log(`Upload progress: ${event.progress}%`);
});

progressListener.remove();
```

---

## onUploadCompleteListener

Listen for successful upload completion.

```ts
onUploadCompleteListener(callback);
```

### Example

```ts
const completeListener = onUploadCompleteListener((event) => {
  console.log('Upload complete', event.response);
});

completeListener.remove();
```

---

## onUploadErrorListener

Listen for upload errors.

```ts
onUploadErrorListener(callback);
```

### Example

```ts
const errorListener = onUploadErrorListener((error) => {
  console.log('Upload failed:', error);
});

errorListener.remove();
```

---

# 🪝 Hook API

## useTransferStream

Recommended high-level API for React applications (streaming responses).

### Return Values

```ts
const { data, loading, error, start, cancel } = useTransferStream();
```

---

## start()

```ts
start({
  url,
  method,
  headers,
  body,
});
```

### Example

```ts
start({
  url: 'https://your-api.com',
  method: 'POST',
  headers: {
    Authorization: 'Bearer token',
  },
  body: JSON.stringify({
    prompt: 'Hello',
  }),
});
```

---

## cancel()

Stops the current stream request.

```ts
cancel();
```

---

## useTransferUpload

High-level hook API for background file uploads with progress tracking.

### Return Values

```ts
const { uploading, progress, error, response, start, cancel } =
  useTransferUpload();
```

### start()

```ts
start({
  url,
  filePath,
  method,
  headers,
  body,
  enableNotification,
  notificationTitle,
});
```

### Example

```tsx
import { useTransferUpload } from 'react-native-transferkit';
import { Button, Text, View } from 'react-native';

export default function UploadExample() {
  const { uploading, progress, error, response, start, cancel } =
    useTransferUpload();

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button
        title="Upload File"
        onPress={() =>
          start({
            url: 'https://your-api.com/upload',
            filePath: 'file:///path/to/file.pdf',
            method: 'POST',
            headers: {
              Authorization: 'Bearer token',
            },
            enableNotification: true,
            notificationTitle: 'File Upload',
          })
        }
      />

      <Button title="Cancel Upload" onPress={cancel} disabled={!uploading} />

      {uploading && <Text>Upload Progress: {progress}%</Text>}

      {error && <Text>Error: {error}</Text>}

      {response && <Text>Response: {JSON.stringify(response)}</Text>}
    </View>
  );
}
```

---

# 📡 Event Names

## Stream Events

| Event            | Description           |
| ---------------- | --------------------- |
| onStreamData     | Stream chunk received |
| onStreamComplete | Stream completed      |
| onStreamError    | Stream failed         |
| onStreamCancel   | Stream cancelled      |

## Upload Events

| Event            | Description                                  |
| ---------------- | -------------------------------------------- |
| onUploadProgress | Upload progress update (includes progress %) |
| onUploadComplete | Upload successfully completed                |
| onUploadError    | Upload failed                                |
| onUploadCancel   | Upload cancelled                             |

---

# 🏗️ Architecture

```text
JS
 ↓
Turbo Module
 ↓
Native Managers
 ↓
Networking Layer
 ↓
Event Emitter
 ↓
React Native
```

---

# 📁 Project Structure

```text
src/
│
├── stream/
│   ├── hooks/
│   ├── events/
│   ├── native/
│   ├── types/
│   └── index.ts
│
├── NativeTransferkit.ts
│
└── index.ts
```

---

# ⚙️ Native Architecture

## Android

- Kotlin
- OkHttp
- Turbo Modules
- Android Notification Service (upload progress)

## iOS

- Objective-C++
- NSURLSession
- Turbo Modules

---

# 📦 Dependencies

Minimal dependencies:

## Android

- OkHttp

## iOS

- Native NSURLSession

No large third-party networking libraries are used.

---

# 🤔 Why react-native-transferkit?

Unlike traditional fetch implementations, `react-native-transferkit` provides native realtime streaming support with a scalable architecture for modern React Native apps.

Built for:

- AI streaming
- SSE responses
- Realtime APIs
- Background file uploads
- Upload progress tracking
- Background networking
- Large-scale RN applications

---

# 🛣️ Roadmap

- [x] Background file upload
- [x] Upload progress events
- [x] Android notifications for upload progress
- [ ] Background downloads
- [ ] SSE parser support
- [ ] WebSocket support
- [ ] Retry queues
- [ ] Resumable uploads
- [ ] Download manager
- [ ] Queue system
- [ ] Offline persistence

---

# 🤝 Contributing

Contributions are welcome.

Please open issues and pull requests for improvements and bug fixes.

---

# 📄 License

MIT
