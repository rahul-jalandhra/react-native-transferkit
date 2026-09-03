import { jest } from '@jest/globals';

const mockTransferkitSpec = {
  startStream: jest.fn(),
  cancelStream: jest.fn(),
  startBackgroundUpload: jest.fn(),
  cancelUpload: jest.fn(),
};

jest.mock('react-native', () => ({
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  })),
  NativeModules: {
    TransferkitEventEmitter: {},
  },
  Platform: {
    OS: 'ios',
    select: jest.fn((dict: any) => dict?.ios),
  },
  TurboModuleRegistry: {
    getEnforcing: jest.fn().mockReturnValue(mockTransferkitSpec),
  },
}));
