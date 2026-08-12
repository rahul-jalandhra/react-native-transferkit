import { describe, expect, it } from '@jest/globals';
import Transferkit from '../NativeTransferkit';
import { startBackgroundUpload, cancelUpload } from '../upload/native';

describe('multiUpload native functions', () => {
  it('assigns a default taskId if none is provided', () => {
    const assignedId = startBackgroundUpload({
      url: 'https://api.com/upload',
      filePath: 'file:///tmp/photo.jpg',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      fieldName: 'file',
    });

    expect(assignedId).toBeDefined();
    expect(typeof assignedId).toBe('string');
    expect(assignedId.length).toBeGreaterThan(0);
  });

  it('uses the provided taskId if passed', () => {
    const customId = 'task-custom-123';
    const returnedId = startBackgroundUpload({
      taskId: customId,
      url: 'https://api.com/upload',
      filePath: 'file:///tmp/photo.jpg',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      fieldName: 'file',
    });

    expect(returnedId).toBe(customId);
  });

  it('calls cancelUpload with target taskId', () => {
    cancelUpload('task-custom-123');
    expect(Transferkit.cancelUpload).toHaveBeenCalledWith('task-custom-123');
  });
});
