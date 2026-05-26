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

import {
  Button,
  ScrollView,
  Text,
  View,
} from 'react-native';

import {
  useTransferStream,
} from 'react-native-transferkit';

export default function App() {

  const {
    data,
    loading,
    error,
    start,
    cancel,
  } = useTransferStream();

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

      <Button
        title="Cancel Stream"
        onPress={cancel}
      />

      {loading && (
        <Text>Streaming...</Text>
      )}

      {error && (
        <Text>{error}</Text>
      )}

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
import React, {
  useEffect,
  useState,
} from 'react';

import {
  Button,
  Text,
  View,
} from 'react-native';

import {
  startStream,
  cancelStream,
  addStreamListener,
} from 'react-native-transferkit';

export default function App() {

  const [data, setData] = useState('');

  useEffect(() => {

    const listener =
      addStreamListener(event => {

        setData(prev =>
          prev + (event.data || '')
        );
      });

    return () => {
      listener.remove();
    };

  }, []);

  const onStart = () => {

    startStream(
      'https://your-stream-api.com',
      'GET',
      {},
      ''
    );
  };

  return (
    <View>

      <Button
        title="Start Stream"
        onPress={onStart}
      />

      <Button
        title="Cancel Stream"
        onPress={cancelStream}
      />

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
    Authorization: 'Bearer token',
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
cancelStream()
```

---

## onStreamDataListener

Listen for incoming stream chunks.

```ts
onStreamDataListener(callback)
```

### Example

```ts
const streamDataListener =
  onStreamDataListener(event => {

    console.log(event.data);
  });

streamDataListener.remove();
```

---

## onStreamCompleteListener

Listen for incoming stream chunks.

```ts
onStreamCompleteListener(callback)
```

### Example

```ts
const streamCompleteListener =
  onStreamCompleteListener(event => {

    console.log(event.data);
  });

streamCompleteListener.remove();
```

---

## onStreamCancelListener

Listen for incoming stream chunks.

```ts
onStreamCancelListener(callback)
```

### Example

```ts
const streamCancelListener =
  onStreamCancelListener(event => {

    console.log(event.data);
  });

streamCancelListener.remove();
```

---

## onStreamErrorListener

Listen for incoming stream chunks.

```ts
onStreamErrorListener(callback)
```

### Example

```ts
const streamErrorListener =
  onStreamErrorListener(event => {

    console.log(event.data);
  });

streamErrorListener.remove();
```

---

# 🪝 Hook API

## useTransferStream

Recommended high-level API for React applications.

### Return Values

```ts
const {
  data,
  loading,
  error,
  start,
  cancel,
} = useTransferStream();
```

---

## start()

```ts
start({
  url,
  method,
  headers,
  body,
})
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
cancel()
```

---

# 📡 Event Names

| Event | Description |
|---|---|
| onStreamData | Stream chunk received |
| onStreamComplete | Stream completed |
| onStreamError | Stream failed |
| onStreamCancel | Stream cancelled |

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
- Background networking
- Large-scale RN applications

---

# 🛣️ Roadmap

- [ ] Background file upload
- [ ] Background downloads
- [ ] Upload progress events
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