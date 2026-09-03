#import "TKUploadManager.h"

#import "../events/TransferkitEventEmitter.h"

static const NSUInteger kStreamBufferSize = 256 * 1024; // 256 KB chunks

static void (^_backgroundCompletionHandler)(void) = nil;

@interface TKUploadManager ()

@property(nonatomic, strong) NSURLSession *session;
@property(nonatomic, strong) NSMutableDictionary<NSString *, NSURLSessionUploadTask *> *tasksMap;
@property(nonatomic, strong) NSMutableDictionary<NSNumber *, NSString *> *taskIdsMap;
@property(nonatomic, strong) NSMutableDictionary<NSString *, NSURL *> *tempFilesMap;

@end

@implementation TKUploadManager

+ (instancetype)shared
{
    static TKUploadManager *sharedInstance = nil;
    static dispatch_once_t onceToken;

    dispatch_once(&onceToken, ^{
        sharedInstance = [[TKUploadManager alloc] init];
    });

    return sharedInstance;
}

+ (void)handleBackgroundSessionCompletionHandler:(void (^)(void))completionHandler
{
    _backgroundCompletionHandler = [completionHandler copy];
    // Accessing [self shared] ensures the session is recreated with its delegate
    // so that pending delegate messages are delivered.
    (void)[TKUploadManager shared];
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        NSURLSessionConfiguration *config =
            [NSURLSessionConfiguration
                backgroundSessionConfigurationWithIdentifier:@"com.transferkit.upload"];

        self.session = [NSURLSession sessionWithConfiguration:config delegate:self delegateQueue:nil];
        self.tasksMap = [NSMutableDictionary dictionary];
        self.taskIdsMap = [NSMutableDictionary dictionary];
        self.tempFilesMap = [NSMutableDictionary dictionary];
    }

    return self;
}

- (void)startUpload:(NSString *)taskId
                url:(NSString *)url
           filePath:(NSString *)filePath
           fileName:(NSString *)fileName
           mimeType:(NSString *)mimeType
          fieldName:(NSString *)fieldName
             method:(NSString *)method
            headers:(NSDictionary *)headers
{
    NSString *safeTaskId = taskId.length > 0 ? taskId : [[NSUUID UUID] UUIDString];

    NSURL *requestURL = [NSURL URLWithString:url];
    if (!requestURL) {
        NSLog(@"Invalid upload URL");
        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitUploadErrorNotification
                          object:nil
                        userInfo:@{
                            @"taskId": safeTaskId,
                            @"error": @"Invalid upload URL"
                        }];
        return;
    }

    NSURL *fileURL = [NSURL URLWithString:filePath];
    if (!fileURL || !fileURL.scheme) {
        fileURL = [NSURL fileURLWithPath:filePath];
    }
    if (![fileURL isFileURL]) {
        fileURL = [NSURL fileURLWithPath:fileURL.path];
    }

    if (![[NSFileManager defaultManager] fileExistsAtPath:fileURL.path]) {
        NSLog(@"File does not exist: %@", fileURL);
        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitUploadErrorNotification
                          object:nil
                        userInfo:@{
                            @"taskId": safeTaskId,
                            @"error": @"File does not exist"
                        }];
        return;
    }

    NSString *boundary = [NSString stringWithFormat:@"Boundary-%@", [[NSUUID UUID] UUIDString]];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:requestURL];
    request.HTTPMethod = method;

    NSString *contentType = [NSString stringWithFormat:@"multipart/form-data; boundary=%@", boundary];
    [request setValue:contentType forHTTPHeaderField:@"Content-Type"];

    for (NSString *key in headers) {
        [request setValue:headers[key] forHTTPHeaderField:key];
    }

    // Build multipart body by streaming to a temp file (avoids loading entire file into RAM)
    NSString *tempFilePath = [NSTemporaryDirectory()
        stringByAppendingPathComponent:[NSString stringWithFormat:@"upload-%@.tmp", [[NSUUID UUID] UUIDString]]];
    NSURL *tempFileURL = [NSURL fileURLWithPath:tempFilePath];

    BOOL writeSuccess = [self writeMultipartBodyToFile:tempFileURL
                                             fileURL:fileURL
                                           fieldName:fieldName
                                            fileName:fileName
                                            mimeType:mimeType
                                            boundary:boundary];
    if (!writeSuccess) {
        NSLog(@"Failed to write multipart body for taskId: %@", safeTaskId);
        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitUploadErrorNotification
                          object:nil
                        userInfo:@{
                            @"taskId": safeTaskId,
                            @"error": @"Unable to read upload file"
                        }];
        return;
    }

    NSURLSessionUploadTask *task = [self.session uploadTaskWithRequest:request fromFile:tempFileURL];

    @synchronized (self) {
        self.tasksMap[safeTaskId] = task;
        self.taskIdsMap[@(task.taskIdentifier)] = safeTaskId;
        self.tempFilesMap[safeTaskId] = tempFileURL;
    }

    [task resume];
    NSLog(@"Background upload started for taskId: %@", safeTaskId);
}

#pragma mark - Streamed Multipart Body Writer

- (BOOL)writeMultipartBodyToFile:(NSURL *)destURL
                         fileURL:(NSURL *)fileURL
                       fieldName:(NSString *)fieldName
                        fileName:(NSString *)fileName
                        mimeType:(NSString *)mimeType
                        boundary:(NSString *)boundary
{
    NSOutputStream *outputStream = [NSOutputStream outputStreamWithURL:destURL append:NO];
    if (!outputStream) {
        return NO;
    }
    [outputStream open];

    // Write multipart header
    NSString *disposition = [NSString stringWithFormat:
        @"--%@\r\n"
        "Content-Disposition: form-data; name=\"%@\"; filename=\"%@\"\r\n"
        "Content-Type: %@\r\n\r\n",
        boundary, fieldName, fileName, mimeType];
    NSData *headerData = [disposition dataUsingEncoding:NSUTF8StringEncoding];
    [outputStream write:headerData.bytes maxLength:headerData.length];

    // Stream file contents in chunks
    NSInputStream *inputStream = [NSInputStream inputStreamWithURL:fileURL];
    if (!inputStream) {
        [outputStream close];
        [[NSFileManager defaultManager] removeItemAtURL:destURL error:nil];
        return NO;
    }
    [inputStream open];

    uint8_t buffer[kStreamBufferSize];
    while ([inputStream hasBytesAvailable]) {
        NSInteger bytesRead = [inputStream read:buffer maxLength:kStreamBufferSize];
        if (bytesRead < 0) {
            [inputStream close];
            [outputStream close];
            [[NSFileManager defaultManager] removeItemAtURL:destURL error:nil];
            return NO;
        }
        if (bytesRead > 0) {
            NSInteger totalWritten = 0;
            while (totalWritten < bytesRead) {
                NSInteger written = [outputStream write:(buffer + totalWritten)
                                             maxLength:(bytesRead - totalWritten)];
                if (written <= 0) {
                    [inputStream close];
                    [outputStream close];
                    [[NSFileManager defaultManager] removeItemAtURL:destURL error:nil];
                    return NO;
                }
                totalWritten += written;
            }
        }
    }
    [inputStream close];

    // Write closing boundary
    NSString *closingBoundary = [NSString stringWithFormat:@"\r\n--%@--\r\n", boundary];
    NSData *closingData = [closingBoundary dataUsingEncoding:NSUTF8StringEncoding];
    [outputStream write:closingData.bytes maxLength:closingData.length];

    [outputStream close];
    return YES;
}

#pragma mark - Cancel

- (void)cancelUpload:(NSString *)taskId
{
    @synchronized (self) {
        if (taskId && taskId.length > 0) {
            NSURLSessionUploadTask *task = self.tasksMap[taskId];
            if (task) {
                [task cancel];
                [self.tasksMap removeObjectForKey:taskId];
                [self.taskIdsMap removeObjectForKey:@(task.taskIdentifier)];
            }
            [self cleanupTempFile:taskId];

            [[NSNotificationCenter defaultCenter]
                postNotificationName:TransferkitUploadCancelNotification
                              object:nil
                            userInfo:@{
                                @"taskId": taskId,
                                @"success": @YES
                            }];
        } else {
            for (NSString *key in [self.tasksMap allKeys]) {
                NSURLSessionUploadTask *task = self.tasksMap[key];
                [task cancel];
            }
            [self.tasksMap removeAllObjects];
            [self.taskIdsMap removeAllObjects];
            [self cleanupAllTempFiles];

            [[NSNotificationCenter defaultCenter]
                postNotificationName:TransferkitUploadCancelNotification
                              object:nil
                            userInfo:@{
                                @"taskId": @"",
                                @"success": @YES
                            }];
        }
    }
}

#pragma mark - Temp File Cleanup

- (void)cleanupTempFile:(NSString *)taskId
{
    NSURL *tempURL = self.tempFilesMap[taskId];
    if (tempURL) {
        [[NSFileManager defaultManager] removeItemAtURL:tempURL error:nil];
        [self.tempFilesMap removeObjectForKey:taskId];
    }
}

- (void)cleanupAllTempFiles
{
    for (NSURL *tempURL in [self.tempFilesMap allValues]) {
        [[NSFileManager defaultManager] removeItemAtURL:tempURL error:nil];
    }
    [self.tempFilesMap removeAllObjects];
}

#pragma mark - Upload Progress

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
   didSendBodyData:(int64_t)bytesSent
    totalBytesSent:(int64_t)totalBytesSent
totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend
{
    NSString *taskId = @"";
    @synchronized (self) {
        taskId = self.taskIdsMap[@(task.taskIdentifier)] ?: @"";
    }

    double progress = (double)totalBytesSent / (double)totalBytesExpectedToSend;

    [[NSNotificationCenter defaultCenter]
        postNotificationName:TransferkitUploadProgressNotification
                      object:nil
                    userInfo:@{
                        @"taskId": taskId,
                        @"progress": @(progress)
                    }];
}

#pragma mark - Upload Completion

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didCompleteWithError:(NSError *)error
{
    NSString *taskId = @"";
    @synchronized (self) {
        taskId = self.taskIdsMap[@(task.taskIdentifier)] ?: @"";
        if (taskId.length > 0) {
            [self.tasksMap removeObjectForKey:taskId];
            [self.taskIdsMap removeObjectForKey:@(task.taskIdentifier)];
        }
        [self cleanupTempFile:taskId];
    }

    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)task.response;
    if (httpResponse && (httpResponse.statusCode < 200 || httpResponse.statusCode >= 300)) {
        NSString *statusMessage = [NSString stringWithFormat:@"Upload failed with status code %ld", (long)httpResponse.statusCode];

        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitUploadErrorNotification
                          object:nil
                        userInfo:@{
                            @"taskId": taskId,
                            @"error": statusMessage,
                            @"statusCode": @(httpResponse.statusCode)
                        }];
        return;
    }

    if (error) {
        NSLog(@"Upload Error: %@", error.localizedDescription);
        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitUploadErrorNotification
                          object:nil
                        userInfo:@{
                            @"taskId": taskId,
                            @"error": error.localizedDescription
                        }];
    } else {
        NSLog(@"Upload Complete for taskId: %@", taskId);
        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitUploadCompleteNotification
                          object:nil
                        userInfo:@{
                            @"taskId": taskId,
                            @"success": @YES
                        }];
    }
}

#pragma mark - Background Session Lifecycle

- (void)URLSessionDidFinishEventsForBackgroundURLSession:(NSURLSession *)session
{
    if (_backgroundCompletionHandler) {
        void (^handler)(void) = _backgroundCompletionHandler;
        _backgroundCompletionHandler = nil;
        dispatch_async(dispatch_get_main_queue(), ^{
            handler();
        });
    }
}

@end