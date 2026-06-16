#import "TKUploadManager.h"

#import "../events/TransferkitEventEmitter.h"

@interface TKUploadManager ()

@property(nonatomic, strong) NSURLSession *session;
@property(nonatomic, strong) NSURLSessionUploadTask *uploadTask;

@end

@implementation TKUploadManager

+ (instancetype)shared
{
    static TKUploadManager *sharedInstance = nil;

    static dispatch_once_t onceToken;

    dispatch_once(&onceToken, ^{

        sharedInstance =
            [[TKUploadManager alloc] init];
    });

    return sharedInstance;
}

- (instancetype)init
{
    self = [super init];

    if (self) {

        NSURLSessionConfiguration *config =
            [NSURLSessionConfiguration
                backgroundSessionConfigurationWithIdentifier:
                    @"com.transferkit.upload"];

        self.session =
            [NSURLSession sessionWithConfiguration:config
                                          delegate:self
                                     delegateQueue:nil];
    }

    return self;
}

- (void)startUpload:(NSString *)url
           filePath:(NSString *)filePath
           fileName:(NSString *)fileName
           mimeType:(NSString *)mimeType
          fieldName:(NSString *)fieldName
             method:(NSString *)method
            headers:(NSDictionary *)headers
{

    NSURL *requestURL =
        [NSURL URLWithString:url];

    if (!requestURL) {

        NSLog(@"Invalid upload URL");

        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitUploadErrorNotification
                          object:nil
                        userInfo:@{
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

    if (![[NSFileManager defaultManager]
          fileExistsAtPath:fileURL.path]) {

        NSLog(@"File does not exist: %@", fileURL);

        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitUploadErrorNotification
                          object:nil
                        userInfo:@{
                            @"error": @"File does not exist"
                        }];

        return;
    }

    NSString *boundary =
        [NSString stringWithFormat:
            @"Boundary-%@",
            [[NSUUID UUID] UUIDString]];

    NSMutableURLRequest *request =
        [NSMutableURLRequest requestWithURL:requestURL];

    request.HTTPMethod = method;

    NSString *contentType =
        [NSString stringWithFormat:
            @"multipart/form-data; boundary=%@",
            boundary];

    [request setValue:contentType
   forHTTPHeaderField:@"Content-Type"];

    for (NSString *key in headers) {

        [request setValue:headers[key]
       forHTTPHeaderField:key];
    }

    NSString *tempFilePath =
        [NSTemporaryDirectory()
            stringByAppendingPathComponent:
                [NSString stringWithFormat:
                    @"upload-%@.tmp",
                    [[NSUUID UUID] UUIDString]]];

    NSURL *tempFileURL =
        [NSURL fileURLWithPath:tempFilePath];

    NSMutableData *body =
        [NSMutableData data];

    NSString *disposition =
        [NSString stringWithFormat:
            @"--%@\r\n"
            "Content-Disposition: form-data; "
            "name=\"%@\"; filename=\"%@\"\r\n"
            "Content-Type: %@\r\n\r\n",
            boundary,
            fieldName,
            fileName,
            mimeType];

    [body appendData:
        [disposition
            dataUsingEncoding:NSUTF8StringEncoding]];

    NSData *fileData =
        [NSData dataWithContentsOfURL:fileURL];

    if (!fileData) {
        NSLog(@"Unable to read file at URL: %@", fileURL);

        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitUploadErrorNotification
                          object:nil
                        userInfo:@{
                            @"error": @"Unable to read upload file"
                        }];

        return;
    }

    [body appendData:fileData];

    NSString *closingBoundary =
        [NSString stringWithFormat:
            @"\r\n--%@--\r\n",
            boundary];

    [body appendData:
        [closingBoundary
            dataUsingEncoding:NSUTF8StringEncoding]];

    [body writeToURL:tempFileURL atomically:YES];

    self.uploadTask =
        [self.session
            uploadTaskWithRequest:request
                         fromFile:tempFileURL];

    [self.uploadTask resume];

    NSLog(@"Background upload started");
}

- (void)cancelUpload
{
    if (self.uploadTask) {

        [self.uploadTask cancel];

        self.uploadTask = nil;

        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitUploadCancelNotification
                          object:nil
                        userInfo:@{
                            @"success": @YES
                        }];
    }
}


#pragma mark - Upload Progress

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didSendBodyData:(int64_t)bytesSent
 totalBytesSent:(int64_t)totalBytesSent
totalBytesExpectedToSend:(int64_t)
totalBytesExpectedToSend
{

    double progress =
        (double)totalBytesSent /
        (double)totalBytesExpectedToSend;

    [[NSNotificationCenter defaultCenter]
        postNotificationName:TransferkitUploadProgressNotification
                      object:nil
                    userInfo:@{
                        @"progress": @(progress)
                    }];
}


#pragma mark - Upload Completion

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didCompleteWithError:(NSError *)error
{

    NSHTTPURLResponse *httpResponse =
        (NSHTTPURLResponse *)task.response;

    if (httpResponse &&
        (httpResponse.statusCode < 200 ||
         httpResponse.statusCode >= 300)) {

        NSString *statusMessage =
            [NSString stringWithFormat:
                @"Upload failed with status code %ld",
                (long)httpResponse.statusCode];

        NSLog(@"%@", statusMessage);

        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitUploadErrorNotification
                          object:nil
                        userInfo:@{
                            @"error": statusMessage,
                            @"statusCode": @(httpResponse.statusCode)
                        }];

        self.uploadTask = nil;
        return;
    }

    if (error) {

        NSLog(@"Upload Error: %@",
              error.localizedDescription);

        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitUploadErrorNotification
                          object:nil
                        userInfo:@{
                            @"error": error.localizedDescription
                        }];

    } else {

        NSLog(@"Upload Complete");

        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitUploadCompleteNotification
                          object:nil
                        userInfo:@{
                            @"success": @YES
                        }];
    }

    self.uploadTask = nil;
}

@end