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
  onStreamDataListener,
} from 'react-native-transferkit';

export default function App() {
  const [data, setData] = useState('');

  useEffect(() => {
    const listener = onStreamDataListener((event) => {
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

Listen for stream completion.

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

Listen for stream cancellation.

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

Listen for stream errors.

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

## startBackgroundUpload

Starts a background file upload using the current native upload API.

```ts
startBackgroundUpload({
  url: string,
  filePath: string,
  fileName: string,
  mimeType: string,
  fieldName: string,
  method?: string,
  headers?: Record<string, string>,
});
```

### Example

```ts
import { startBackgroundUpload } from 'react-native-transferkit';

startBackgroundUpload({
  url: 'https://your-api.com/upload',
  filePath: 'file:///path/to/large-file.zip',
  fileName: 'large-file.zip',
  mimeType: 'application/zip',
  fieldName: 'file',
  method: 'POST',
  headers: {
    Authorization: 'Bearer token',
  },
});
```

---

## cancelUpload

Cancels the active file upload.

```ts
cancelUpload();
```

---

## addUploadProgressListener

Listen for upload progress updates.

```ts
addUploadProgressListener(callback);
```

### Example

```ts
const progressListener = addUploadProgressListener((event) => {
  console.log(`Upload progress: ${event.progress}%`);
});

progressListener.remove();
```

---

## addUploadCompleteListener

Listen for successful upload completion.

```ts
addUploadCompleteListener(callback);
```

### Example

```ts
const completeListener = addUploadCompleteListener((event) => {
  console.log('Upload complete', event.response);
});

completeListener.remove();
```

---

## addUploadErrorListener

Listen for upload errors.

```ts
addUploadErrorListener(callback);
```

### Example

```ts
const errorListener = addUploadErrorListener((error) => {
  console.log('Upload failed:', error);
});

errorListener.remove();
```

---

## addUploadCancelListener

Listen for upload cancellation.

```ts
addUploadCancelListener(callback);
```

### Example

```ts
const cancelListener = addUploadCancelListener(() => {
  console.log('Upload cancelled');
});

cancelListener.remove();
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

### Use background upload

High-level hook API for background file uploads with progress tracking.

### Return Values

```ts
const {
  progress,
  loading,
  completed,
  cancelled,
  error,
  start,
  cancel,
} = useBackgroundUpload();
```

### start()

```ts
start({
  url,
  filePath,
  fileName,
  mimeType,
  fieldName,
  method?,
  headers?,
});
```

### Example

```tsx
import { useBackgroundUpload } from 'react-native-transferkit';
import { Button, Text, View } from 'react-native';

export default function UploadExample() {
  const {
    progress,
    loading,
    completed,
    cancelled,
    error,
    start,
    cancel,
  } = useBackgroundUpload();

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button
        title="Upload File"
        onPress={() =>
          start({
            url: 'https://your-api.com/upload',
            filePath: 'file:///path/to/file.pdf',
            fileName: 'file.pdf',
            mimeType: 'application/pdf',
            fieldName: 'file',
            method: 'POST',
            headers: {
              Authorization: 'Bearer token',
            },
          })
        }
      />

      <Button title="Cancel Upload" onPress={cancel} disabled={!loading} />

      {loading && <Text>Upload Progress: {progress}%</Text>}
      {completed && <Text>Upload complete</Text>}
      {cancelled && <Text>Upload cancelled</Text>}
      {error && <Text>Error: {error}</Text>}
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
│   ├── native/
│   ├── types/
│   └── index.ts
│
├── upload/
│   ├── hooks/
│   ├── native/
│   ├── types/
│   └── index.ts
│
├── eventEmitter.ts
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
- [ ] Retry queues

---

# 🤝 Contributing

Contributions are welcome.

Please open issues and pull requests for improvements and bug fixes.

---

# 📄 License

MIT
