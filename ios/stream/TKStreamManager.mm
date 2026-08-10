#import "TKStreamManager.h"

#import "../events/TransferkitEventEmitter.h"

@interface TKStreamManager ()

@property(nonatomic, strong) NSURLSession *session;
@property(nonatomic, strong) NSURLSessionDataTask *task;
@property(nonatomic, strong) NSMutableData *streamBuffer;
@property(nonatomic, assign) BOOL isSSE;

@end

@implementation TKStreamManager

+ (instancetype)shared
{
    static TKStreamManager *sharedInstance = nil;
    static dispatch_once_t onceToken;

    dispatch_once(&onceToken, ^{
        sharedInstance = [[TKStreamManager alloc] init];
    });

    return sharedInstance;
}

- (void)startStream:(NSString *)url
             method:(NSString *)method
            headers:(NSDictionary *)headers
               body:(NSString *)body
{
    NSLog(@"startStream called");

    self.streamBuffer = [NSMutableData data];
    self.isSSE = NO;

    NSURL *requestURL = [NSURL URLWithString:url];
    if (!requestURL) {
        NSLog(@"Invalid URL");
        return;
    }

    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:requestURL];
    request.HTTPMethod = method;

    for (NSString *key in headers) {
        [request setValue:headers[key] forHTTPHeaderField:key];
    }

    if (![[method uppercaseString] isEqualToString:@"GET"]) {
        request.HTTPBody = [body dataUsingEncoding:NSUTF8StringEncoding];
    }

    NSURLSessionConfiguration *config = [NSURLSessionConfiguration defaultSessionConfiguration];
    self.session = [NSURLSession sessionWithConfiguration:config delegate:self delegateQueue:nil];
    self.task = [self.session dataTaskWithRequest:request];

    [self.task resume];
}

- (void)cancelStream
{
    [self.task cancel];
    self.task = nil;
    self.streamBuffer = nil;
    self.isSSE = NO;

    [[NSNotificationCenter defaultCenter]
        postNotificationName:TransferkitStreamCancelNotification
                      object:nil
                    userInfo:@{
                        @"data": @"cancelled"
                    }];
}

#pragma mark - NSURLSessionDataDelegate

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
didReceiveResponse:(NSURLResponse *)response
 completionHandler:(void (^)(NSURLSessionResponseDisposition disposition))completionHandler
{
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
    NSDictionary *allHeaders = httpResponse.allHeaderFields;

    NSString *contentType = @"";
    for (NSString *key in allHeaders) {
        if ([[key lowercaseString] isEqualToString:@"content-type"]) {
            contentType = allHeaders[key];
            break;
        }
    }

    if ([contentType rangeOfString:@"text/event-stream" options:NSCaseInsensitiveSearch].location != NSNotFound) {
        self.isSSE = YES;
    }

    completionHandler(NSURLSessionResponseAllow);
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
    didReceiveData:(NSData *)data
{
    if (self.isSSE) {
        if (!self.streamBuffer) {
            self.streamBuffer = [NSMutableData data];
        }

        [self.streamBuffer appendData:data];

        NSString *stringVal = [[NSString alloc] initWithData:self.streamBuffer encoding:NSUTF8StringEncoding];
        if (!stringVal) return;

        NSRange delimiterRange = [stringVal rangeOfString:@"\n\n"];
        NSUInteger delimiterLen = 2;
        if (delimiterRange.location == NSNotFound) {
            delimiterRange = [stringVal rangeOfString:@"\r\n\r\n"];
            delimiterLen = 4;
        }

        while (delimiterRange.location != NSNotFound) {
            NSString *eventString = [stringVal substringToIndex:delimiterRange.location];

            if (eventString.length > 0) {
                [[NSNotificationCenter defaultCenter]
                    postNotificationName:TransferkitStreamDataNotification
                                  object:nil
                                userInfo:@{
                                    @"data": eventString
                                }];
            }

            stringVal = [stringVal substringFromIndex:delimiterRange.location + delimiterLen];

            delimiterRange = [stringVal rangeOfString:@"\n\n"];
            delimiterLen = 2;
            if (delimiterRange.location == NSNotFound) {
                delimiterRange = [stringVal rangeOfString:@"\r\n\r\n"];
                delimiterLen = 4;
            }
        }

        self.streamBuffer = [[stringVal dataUsingEncoding:NSUTF8StringEncoding] mutableCopy];
    } else {
        NSString *chunk = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];

        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitStreamDataNotification
                          object:nil
                        userInfo:@{
                            @"data": chunk ?: @""
                        }];
    }
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didCompleteWithError:(NSError *)error
{
    if (self.isSSE && self.streamBuffer.length > 0) {
        NSString *remaining = [[NSString alloc] initWithData:self.streamBuffer encoding:NSUTF8StringEncoding];
        if (remaining.length > 0) {
            [[NSNotificationCenter defaultCenter]
                postNotificationName:TransferkitStreamDataNotification
                              object:nil
                            userInfo:@{
                                @"data": remaining
                            }];
        }
    }

    self.streamBuffer = nil;
    self.isSSE = NO;

    if (error) {
        NSLog(@"Stream Error: %@", error.localizedDescription);

        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitStreamErrorNotification
                          object:nil
                        userInfo:@{
                            @"data": error.localizedDescription ?: @"Unknown error"
                        }];
    } else {
        NSLog(@"Stream Complete");

        [[NSNotificationCenter defaultCenter]
            postNotificationName:TransferkitStreamCompleteNotification
                          object:nil
                        userInfo:@{
                            @"data": @"done"
                        }];
    }
}

@end