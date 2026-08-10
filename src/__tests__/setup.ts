import { jest } from '@jest/globals';

jest.mock('../NativeTransferkit', () => ({
  default: {
    startStream: jest.fn(),
    cancelStream: jest.fn(),
    startBackgroundUpload: jest.fn(),
    cancelUpload: jest.fn(),
  },
}));

jest.mock('react-native', () => ({
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  })),
  NativeModules: {
    TransferkitEventEmitter: {},
  },
  TurboModuleRegistry: {
    getEnforcing: jest.fn().mockReturnValue({
      startStream: jest.fn(),
      cancelStream: jest.fn(),
      startBackgroundUpload: jest.fn(),
      cancelUpload: jest.fn(),
    }),
  },
}));
